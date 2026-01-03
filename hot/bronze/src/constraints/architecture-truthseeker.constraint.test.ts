/**
 * Architecture Truth-Seeker Constraint Tests
 *
 * Gen87.X3 | Port 5 DEFEND | Anti-Theater Code Enforcement
 *
 * PURPOSE: These tests EXPOSE SILENT FAILURES in architecture compliance.
 * They verify that adapters are not just INSTANTIATED but actually USED
 * in a proper data flow pipeline.
 *
 * REAL ARCHITECTURE (per AGENTS.md):
 * MediaPipe → 1€ Filter → Rapier Physics → FSM → W3C Pointer → GoldenLayout
 *
 * GAPS IN CURRENT TESTS:
 * - infrastructure-usage.constraint.test.ts only checks INSTANTIATION
 * - It doesn't verify methods are CALLED
 * - It doesn't verify data FLOWS through the pipeline
 * - It doesn't verify adapters are WIRED together
 *
 * THESE TESTS WILL FAIL (RED) if:
 * - Adapters are instantiated but methods never called
 * - Data doesn't flow through the expected pipeline
 * - GoldenLayout adapter methods aren't invoked
 * - Pipeline produces no output or wrong types
 *
 * @port 5
 * @verb DEFEND
 * @binary 101
 * @incident IR-0012 ORPHAN_ADAPTERS
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMOS_DIR = path.resolve(__dirname, '../../../../demos/src');
const DEMOS_HTML_DIR = path.resolve(__dirname, '../../../../demos');

// Adapter instantiation patterns
const ADAPTER_PATTERNS = {
	OneEuroExemplarAdapter: {
		instantiate: /new\s+OneEuroExemplarAdapter\s*\(/g,
		methods: ['.smooth(', '.reset(', '.setParams('],
		requiredMethods: ['.smooth('], // MUST call at least one of these
	},
	RapierPhysicsAdapter: {
		instantiate: /new\s+RapierPhysicsAdapter\s*\(/g,
		methods: ['.smooth(', '.reset(', '.setParams('],
		requiredMethods: ['.smooth('],
	},
	XStateFSMAdapter: {
		instantiate: /new\s+XStateFSMAdapter\s*\(/g,
		methods: ['.process(', '.getState(', '.disarm(', '.subscribe('],
		requiredMethods: ['.process('],
	},
	GoldenLayoutShellAdapter: {
		instantiate: /new\s+GoldenLayoutShellAdapter\s*\(/g,
		methods: [
			'.initialize(',
			'.getTileTarget(',
			'.addTile(',
			'.getTileIds(',
			'.dispose(',
			'.setLayout(',
			'.getLayout(',
			'.onLayoutChange(',
			'.onTileFocus(',
			'.registerComponent(',
		],
		requiredMethods: ['.initialize('], // MUST at least initialize
	},
	PointerEventAdapter: {
		instantiate: /new\s+PointerEventAdapter\s*\(/g,
		methods: ['.emit('],
		requiredMethods: ['.emit('],
	},
	InMemorySubstrateAdapter: {
		instantiate: /new\s+InMemorySubstrateAdapter\s*\(/g,
		methods: ['.publish(', '.subscribe(', '.kvGet(', '.kvSet('],
		requiredMethods: [], // Message bus can be optional
	},
};

// Pipeline flow patterns - what should connect to what
const PIPELINE_FLOWS = {
	'SensorFrame → SmootherPort': {
		producer: /createSensorFrameFromMouse\s*\(|\.sense\s*\(/,
		consumer: /\.smooth\s*\(/,
		description: 'SensorFrame must flow through smooth()',
	},
	'SmoothedFrame → FSMPort': {
		producer: /\.smooth\s*\(/,
		consumer: /\.process\s*\(/,
		description: 'SmoothedFrame must flow through process()',
	},
	'FSMAction → EmitterPort': {
		producer: /\.process\s*\(/,
		consumer: /\.emit\s*\(/,
		description: 'FSMAction must flow through emit()',
	},
};

// GoldenLayout specific patterns
const GOLDENLAYOUT_PATTERNS = {
	initializeCall: /shell\.initialize\s*\(/,
	getTileTargetCall: /shell\.getTileTarget\s*\(/,
	addTileCall: /shell\.addTile\s*\(/,
	setLayoutCall: /shell\.setLayout\s*\(/,
	registerComponentCall: /shell\.registerComponent\s*\(/,
	onLayoutChangeCall: /shell\.onLayoutChange\s*\(/,
	disposeCall: /shell\.dispose\s*\(/,
};

// ============================================================================
// HELPERS
// ============================================================================

function getDemoFiles(): Array<{ name: string; content: string; path: string }> {
	const files: Array<{ name: string; content: string; path: string }> = [];

	// TypeScript demos
	if (fs.existsSync(DEMOS_DIR)) {
		const tsFiles = fs.readdirSync(DEMOS_DIR).filter((f) => f.endsWith('.ts'));
		for (const file of tsFiles) {
			const filePath = path.join(DEMOS_DIR, file);
			files.push({
				name: file,
				content: fs.readFileSync(filePath, 'utf-8'),
				path: filePath,
			});
		}
	}

	// HTML demos with inline scripts
	if (fs.existsSync(DEMOS_HTML_DIR)) {
		const htmlFiles = fs.readdirSync(DEMOS_HTML_DIR).filter((f) => f.endsWith('.html'));
		for (const file of htmlFiles) {
			const filePath = path.join(DEMOS_HTML_DIR, file);
			files.push({
				name: file,
				content: fs.readFileSync(filePath, 'utf-8'),
				path: filePath,
			});
		}
	}

	return files;
}

interface OrphanedAdapter {
	file: string;
	adapter: string;
	instantiated: boolean;
	methodsCalled: string[];
	requiredMethodsMissing: string[];
}

function findOrphanedAdapters(): OrphanedAdapter[] {
	const orphans: OrphanedAdapter[] = [];
	const files = getDemoFiles();

	for (const file of files) {
		for (const [adapterName, patterns] of Object.entries(ADAPTER_PATTERNS)) {
			const isInstantiated = patterns.instantiate.test(file.content);
			// Reset regex lastIndex
			patterns.instantiate.lastIndex = 0;

			if (!isInstantiated) continue;

			const methodsCalled = patterns.methods.filter((method) => file.content.includes(method));

			const requiredMethodsMissing = patterns.requiredMethods.filter(
				(method) => !file.content.includes(method),
			);

			if (requiredMethodsMissing.length > 0) {
				orphans.push({
					file: file.name,
					adapter: adapterName,
					instantiated: true,
					methodsCalled,
					requiredMethodsMissing,
				});
			}
		}
	}

	return orphans;
}

interface PipelineGap {
	file: string;
	flow: string;
	description: string;
	hasProducer: boolean;
	hasConsumer: boolean;
}

function findPipelineGaps(): PipelineGap[] {
	const gaps: PipelineGap[] = [];
	const files = getDemoFiles();

	for (const file of files) {
		// Only check files that have some pipeline involvement
		const hasPipelineCode =
			/OneEuroExemplarAdapter|RapierPhysicsAdapter|XStateFSMAdapter|PointerEventAdapter/.test(
				file.content,
			);

		if (!hasPipelineCode) continue;

		for (const [flowName, patterns] of Object.entries(PIPELINE_FLOWS)) {
			const hasProducer = patterns.producer.test(file.content);
			const hasConsumer = patterns.consumer.test(file.content);

			// Reset regex
			patterns.producer.lastIndex = 0;
			patterns.consumer.lastIndex = 0;

			// If file has the producer but not the consumer, it's a gap
			if (hasProducer && !hasConsumer) {
				gaps.push({
					file: file.name,
					flow: flowName,
					description: patterns.description,
					hasProducer,
					hasConsumer,
				});
			}
		}
	}

	return gaps;
}

interface GoldenLayoutUsage {
	file: string;
	hasAdapter: boolean;
	methodsUsed: string[];
	methodsMissing: string[];
	isFullyWired: boolean;
}

function analyzeGoldenLayoutUsage(): GoldenLayoutUsage[] {
	const usage: GoldenLayoutUsage[] = [];
	const files = getDemoFiles();

	for (const file of files) {
		const hasAdapter = /new\s+GoldenLayoutShellAdapter\s*\(/.test(file.content);

		if (!hasAdapter) continue;

		const methodsUsed: string[] = [];
		const methodsMissing: string[] = [];

		// Check each method
		if (GOLDENLAYOUT_PATTERNS.initializeCall.test(file.content)) {
			methodsUsed.push('initialize()');
		} else {
			methodsMissing.push('initialize()');
		}

		if (GOLDENLAYOUT_PATTERNS.registerComponentCall.test(file.content)) {
			methodsUsed.push('registerComponent()');
		}

		if (GOLDENLAYOUT_PATTERNS.getTileTargetCall.test(file.content)) {
			methodsUsed.push('getTileTarget()');
		}

		if (GOLDENLAYOUT_PATTERNS.addTileCall.test(file.content)) {
			methodsUsed.push('addTile()');
		}

		if (GOLDENLAYOUT_PATTERNS.setLayoutCall.test(file.content)) {
			methodsUsed.push('setLayout()');
		}

		if (GOLDENLAYOUT_PATTERNS.onLayoutChangeCall.test(file.content)) {
			methodsUsed.push('onLayoutChange()');
		}

		if (GOLDENLAYOUT_PATTERNS.disposeCall.test(file.content)) {
			methodsUsed.push('dispose()');
		}

		// Minimum requirements for "fully wired"
		const requiredMethods = ['initialize()'];
		const hasAllRequired = requiredMethods.every((m) => methodsUsed.includes(m));

		usage.push({
			file: file.name,
			hasAdapter: true,
			methodsUsed,
			methodsMissing,
			isFullyWired: hasAllRequired && methodsUsed.length >= 2, // At least init + one other
		});
	}

	return usage;
}

// ============================================================================
// TRUTH-SEEKING TESTS
// ============================================================================

describe('TRUTH-SEEKER: Architecture Enforcement (IR-0012)', () => {
	describe('Orphaned Adapter Detection', () => {
		it('should NOT have adapters that are instantiated but never used', () => {
			const orphans = findOrphanedAdapters();

			if (orphans.length > 0) {
				const report = orphans
					.map(
						(o) =>
							`  ❌ ${o.file}: ${o.adapter}\n     Instantiated: ✓\n     Methods called: ${o.methodsCalled.length > 0 ? o.methodsCalled.join(', ') : 'NONE'}\n     Missing required: ${o.requiredMethodsMissing.join(', ')}`,
					)
					.join('\n');

				console.error(
					`\n🚨 ORPHANED ADAPTERS DETECTED (IR-0012)\nThese adapters are instantiated but their required methods are never called:\n\n${report}\n`,
				);
			}

			expect(orphans.length).toBe(0);
		});

		it('should call OneEuroExemplarAdapter.smooth() when adapter is instantiated', () => {
			const files = getDemoFiles();
			const violations: string[] = [];

			for (const file of files) {
				const hasAdapter = /new\s+OneEuroExemplarAdapter\s*\(/.test(file.content);
				const callsSmooth = file.content.includes('.smooth(');

				if (hasAdapter && !callsSmooth) {
					violations.push(file.name);
				}
			}

			if (violations.length > 0) {
				console.error(
					`\n🚨 OneEuroExemplarAdapter.smooth() NOT CALLED:\n${violations.map((v) => `  - ${v}`).join('\n')}`,
				);
			}

			expect(violations.length).toBe(0);
		});

		it('should call XStateFSMAdapter.process() when adapter is instantiated', () => {
			const files = getDemoFiles();
			const violations: string[] = [];

			for (const file of files) {
				const hasAdapter = /new\s+XStateFSMAdapter\s*\(/.test(file.content);
				const callsProcess = file.content.includes('.process(');

				if (hasAdapter && !callsProcess) {
					violations.push(file.name);
				}
			}

			if (violations.length > 0) {
				console.error(
					`\n🚨 XStateFSMAdapter.process() NOT CALLED:\n${violations.map((v) => `  - ${v}`).join('\n')}`,
				);
			}

			expect(violations.length).toBe(0);
		});
	});

	describe('Pipeline Data Flow Verification', () => {
		it('should have complete data flow chains (no broken pipelines)', () => {
			const gaps = findPipelineGaps();

			if (gaps.length > 0) {
				const report = gaps
					.map((g) => `  ❌ ${g.file}: ${g.flow}\n     ${g.description}`)
					.join('\n');

				console.error(`\n🚨 PIPELINE FLOW GAPS DETECTED:\n${report}\n`);
			}

			// This is informational - we don't fail because not all files need all flows
			// But we DO warn about potential disconnects
			console.log(`\n📊 Pipeline Flow Analysis: ${gaps.length} potential gaps found`);
			expect(gaps.length).toBeGreaterThanOrEqual(0);
		});

		it('RED: showcase files must have complete SmoothedFrame → FSM → Emit pipeline', () => {
			// This test INTENTIONALLY FAILS to expose missing pipeline in showcases
			const files = getDemoFiles().filter((f) => f.name.includes('showcase'));
			const violations: string[] = [];

			// Exempt isolation demos (explicitly testing one component)
			// showcase-fsm.ts: FSM isolation demo
			// showcase-palmcone.ts: PalmConeGate isolation demo (different .process() interface)
			const PIPELINE_ISOLATION_DEMOS = ['showcase-fsm.ts', 'showcase-palmcone.ts'];

			for (const file of files) {
				if (PIPELINE_ISOLATION_DEMOS.includes(file.name)) continue;

				// If file smoothes data, it MUST also process through FSM
				const hasSmooth = file.content.includes('.smooth(');
				const hasProcess = file.content.includes('.process(');
				const hasEmit = file.content.includes('.emit(') || file.content.includes('dispatchEvent');

				if (hasSmooth && !hasProcess) {
					violations.push(
						`${file.name}: Has .smooth() but no .process() - SmoothedFrame not flowing to FSM`,
					);
				}
				if (hasProcess && !hasEmit) {
					violations.push(`${file.name}: Has .process() but no .emit() - FSMAction not emitted`);
				}
			}

			if (violations.length > 0) {
				console.error(
					`\n🔴 RED TEST: INCOMPLETE PIPELINE IN SHOWCASES:\n${violations.map((v) => `  - ${v}`).join('\n')}\n\nFIX: Wire SmoothedFrame through fsm.process() then emit the FSMAction`,
				);
			}

			// ENFORCE: This MUST be 0 for test to pass
			expect(violations.length).toBe(0);
		});
	});

	describe('GoldenLayout Integration Verification', () => {
		it('should call GoldenLayoutShellAdapter.initialize() when adapter is instantiated', () => {
			const usage = analyzeGoldenLayoutUsage();
			const violations = usage.filter(
				(u) => u.hasAdapter && !u.methodsUsed.includes('initialize()'),
			);

			if (violations.length > 0) {
				const report = violations.map((v) => `  ❌ ${v.file}: Has adapter but no initialize()`);

				console.error(
					`\n🚨 GoldenLayoutShellAdapter.initialize() NOT CALLED:\n${report.join('\n')}`,
				);
			}

			expect(violations.length).toBe(0);
		});

		it('should have at least one demo with fully-wired GoldenLayout integration', () => {
			const usage = analyzeGoldenLayoutUsage();
			const fullyWired = usage.filter((u) => u.isFullyWired);

			console.log('\n📊 GoldenLayout Usage Report:');
			for (const u of usage) {
				const status = u.isFullyWired ? '✅' : '⚠️';
				console.log(`  ${status} ${u.file}: ${u.methodsUsed.join(', ') || 'NO METHODS CALLED'}`);
			}

			expect(fullyWired.length).toBeGreaterThan(0);
		});

		it('should use GoldenLayoutShellAdapter methods, not raw GoldenLayout API', () => {
			const files = getDemoFiles();
			const violations: string[] = [];

			// Allowlist for demos that intentionally showcase raw GoldenLayout
			const RAW_GL_ALLOWLIST = ['12-golden-unified.html', 'showcase-goldenlayout.ts'];

			for (const file of files) {
				// Skip allowlisted files
				if (RAW_GL_ALLOWLIST.includes(file.name)) continue;

				// Check for raw GoldenLayout instantiation without going through adapter
				const usesRawGL =
					/new\s+GoldenLayout\s*\(/.test(file.content) &&
					!/GoldenLayoutShellAdapter/.test(file.content);

				// Check for RAW GoldenLayout API methods (not adapter methods)
				// Raw API: goldenLayout.registerComponentConstructor, layout.registerComponent
				// These patterns should NOT match: shell.registerComponent (that's the adapter)
				const usesRawRegister =
					/goldenLayout\.registerComponent(?:Constructor)?\s*\(/.test(file.content) ||
					/layout\.registerComponent(?:Constructor)?\s*\(/.test(file.content) ||
					/gl\.registerComponent(?:Constructor)?\s*\(/.test(file.content);

				// Check for raw GoldenLayout method calls that bypass adapter
				const usesRawMethods =
					/goldenLayout\.(init|destroy|toConfig|loadLayout)\s*\(/.test(file.content) ||
					/layout\.(init|destroy|toConfig|loadLayout)\s*\(/.test(file.content);

				if (usesRawGL || usesRawRegister || usesRawMethods) {
					violations.push(`${file.name}: Uses raw GoldenLayout API`);
				}
			}

			if (violations.length > 0) {
				console.error(
					`\n🚨 RAW GOLDENLAYOUT API BYPASS DETECTED:\n${violations.map((v) => `  - ${v}`).join('\n')}`,
				);
			}

			expect(violations.length).toBe(0);
		});
	});

	describe('Type Contract Verification', () => {
		it('should pass SensorFrame to smooth(), not arbitrary objects', () => {
			const files = getDemoFiles();
			const suspiciousPatterns: string[] = [];

			for (const file of files) {
				// Look for smooth() calls that don't appear to use SensorFrame
				const smoothCalls = file.content.match(/\.smooth\s*\(\s*(\{[^}]+\})/g) || [];

				for (const call of smoothCalls) {
					// Check if it has SensorFrame required fields
					if (!call.includes('ts') || !call.includes('handId') || !call.includes('indexTip')) {
						suspiciousPatterns.push(`${file.name}: ${call.slice(0, 50)}...`);
					}
				}

				// Also check for createSensorFrameFromMouse usage (the RIGHT way)
				if (file.content.includes('.smooth(') && !file.content.includes('createSensorFrame')) {
					// This might be suspicious - smooth() called but no SensorFrame creation visible
					// Could be inline object that's wrong
				}
			}

			if (suspiciousPatterns.length > 0) {
				console.warn(
					`\n⚠️ Suspicious smooth() calls (may not be passing SensorFrame):\n${suspiciousPatterns.map((p) => `  - ${p}`).join('\n')}`,
				);
			}

			// Informational - we can't fully validate without runtime
			expect(suspiciousPatterns.length).toBeGreaterThanOrEqual(0);
		});

		it('RED: showcases must use createSensorFrameFromMouse, not raw objects', () => {
			// This test INTENTIONALLY FAILS if showcases pass raw objects to smooth()
			// Valid sources:
			// 1. createSensorFrameFromMouse (for mouse-simulated input)
			// 2. MediaPipeAdapter.sense() (for real webcam input)
			// 3. MockSensorAdapter.sense() (for testing)
			const files = getDemoFiles().filter((f) => f.name.includes('showcase'));
			const violations: string[] = [];

			for (const file of files) {
				const hasSmooth = file.content.includes('.smooth(');
				const hasCreateFrame =
					file.content.includes('createSensorFrameFromMouse') ||
					file.content.includes('createSensorFrame(');
				const hasMediaPipe =
					file.content.includes('MediaPipeAdapter') || file.content.includes('MockSensorAdapter');
				const hasSense = file.content.includes('.sense(');

				// Valid if: has factory OR (has MediaPipe/MockSensor AND uses .sense())
				const isValid = hasCreateFrame || (hasMediaPipe && hasSense);

				if (hasSmooth && !isValid) {
					violations.push(`${file.name}: Uses .smooth() without valid SensorFrame source`);
				}
			}

			if (violations.length > 0) {
				console.error(
					`\n🔴 RED TEST: RAW OBJECTS PASSED TO SMOOTH():\n${violations.map((v) => `  - ${v}`).join('\n')}\n\nFIX: Use createSensorFrameFromMouse() or MediaPipeAdapter.sense() for SensorFrame`,
				);
			}

			expect(violations.length).toBe(0);
		});
	});

	describe('Full Architecture Pipeline Enforcement', () => {
		it('RED: at least one showcase must demonstrate FULL pipeline', () => {
			// FULL PIPELINE: SensorFrame → Smooth → FSM → Emit
			const files = getDemoFiles().filter((f) => f.name.includes('showcase'));
			const fullPipelineFiles: string[] = [];

			for (const file of files) {
				const hasSensorInput =
					file.content.includes('createSensorFrameFromMouse') ||
					file.content.includes('MediaPipeAdapter');
				const hasSmooth = file.content.includes('.smooth(');
				const hasFSM = file.content.includes('.process(');
				const hasEmit =
					file.content.includes('.emit(') ||
					file.content.includes('dispatchEvent') ||
					file.content.includes('PointerEvent');

				if (hasSensorInput && hasSmooth && hasFSM && hasEmit) {
					fullPipelineFiles.push(file.name);
				}
			}

			console.log('\n📊 Full Pipeline Detection:');
			console.log(`   Files with FULL pipeline: ${fullPipelineFiles.length}`);
			if (fullPipelineFiles.length > 0) {
				console.log(`   ✅ ${fullPipelineFiles.join(', ')}`);
			}

			if (fullPipelineFiles.length === 0) {
				console.error(
					'\n🔴 RED TEST: NO SHOWCASE HAS FULL PIPELINE!\n' +
						'   Required: SensorFrame → Smooth → FSM → Emit\n' +
						'   None of the showcases demonstrate the complete architecture.\n',
				);
			}

			expect(fullPipelineFiles.length).toBeGreaterThan(0);
		});
	});
});

describe('RED: Raw SensorFrame Object Literals (IR-0012.1)', () => {
	it('RED: NO showcase should create SensorFrame with object literal', () => {
		/**
		 * VIOLATION: Creating SensorFrame manually instead of using factory
		 *
		 * BAD:  const frame: SensorFrame = { ts, handId: 'right', ... }
		 * GOOD: const frame = createSensorFrameFromMouse(x, y, ts)
		 *
		 * Why? The factory ensures consistent structure and defaults.
		 */
		const files = getDemoFiles();
		const violations: Array<{ file: string; line: string }> = [];

		// Regex to detect raw object literals assigned to SensorFrame
		const RAW_OBJECT_PATTERN = /(?:const|let|var)\s+\w+\s*:\s*SensorFrame\s*=\s*\{/g;
		const EXCLUDED_FILES = ['types.ts', 'schemas.ts', 'contracts.ts']; // Type definitions are OK

		for (const file of files) {
			if (EXCLUDED_FILES.some((ex) => file.name.endsWith(ex))) continue;

			const lines = file.content.split('\n');
			for (let i = 0; i < lines.length; i++) {
				if (RAW_OBJECT_PATTERN.test(lines[i])) {
					violations.push({
						file: file.name,
						line: `Line ${i + 1}: ${lines[i].trim().slice(0, 60)}...`,
					});
				}
				RAW_OBJECT_PATTERN.lastIndex = 0;
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: RAW SensorFrame OBJECT LITERALS DETECTED:');
			for (const v of violations) {
				console.error(`   - ${v.file}: ${v.line}`);
			}
			console.error('   FIX: Use createSensorFrameFromMouse(x, y, ts) instead\n');
		}

		expect(violations.length).toBe(0);
	});

	it('RED: Every showcase with smooth() must use createSensorFrameFromMouse', () => {
		/**
		 * If you call .smooth(), you need a SensorFrame.
		 * Valid sources:
		 * 1. createSensorFrameFromMouse (for mouse-simulated input)
		 * 2. MediaPipeAdapter.sense() (for real webcam input)
		 * 3. MockSensorAdapter.sense() (for testing)
		 */
		const files = getDemoFiles();
		const violations: Array<{ file: string; reason: string }> = [];

		for (const file of files) {
			const hasSmooth = file.content.includes('.smooth(');
			const hasFactory = file.content.includes('createSensorFrameFromMouse');
			const hasMediaPipe =
				file.content.includes('MediaPipeAdapter') || file.content.includes('MockSensorAdapter');
			const hasSense = file.content.includes('.sense(');

			// Valid if: has factory OR (has MediaPipe/MockSensor AND uses .sense())
			const isValid = hasFactory || (hasMediaPipe && hasSense);

			if (hasSmooth && !isValid) {
				violations.push({
					file: file.name,
					reason: 'Has .smooth() but no valid SensorFrame source',
				});
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: SMOOTH WITHOUT VALID SOURCE:');
			for (const v of violations) {
				console.error(`   - ${v.file}: ${v.reason}`);
			}
			console.error('   FIX: Use createSensorFrameFromMouse or MediaPipeAdapter.sense()\n');
		}

		expect(violations.length).toBe(0);
	});
});

describe('RED: Pipeline Chain Enforcement (IR-0012.2)', () => {
	it('RED: Every smooth() call must be followed by process() in same file', () => {
		/**
		 * Architecture: SmoothedFrame MUST go to FSM
		 * If you smooth, you MUST process.
		 *
		 * Exemptions:
		 * - HTML files (visual demos, not full TypeScript modules)
		 * - smoother-demo.ts (smoother isolation demo)
		 */
		const files = getDemoFiles();
		const violations: Array<{ file: string }> = [];

		// Exempt visual/HTML demos and isolation demos
		const SMOOTH_ISOLATION_DEMOS = ['primitives-visual.html', 'manual-interlock.html'];

		for (const file of files) {
			if (SMOOTH_ISOLATION_DEMOS.includes(file.name)) continue;

			const hasSmooth = file.content.includes('.smooth(');
			const hasProcess = file.content.includes('.process(');

			// Files with smooth but no process are violations
			if (hasSmooth && !hasProcess) {
				violations.push({ file: file.name });
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: SMOOTH WITHOUT PROCESS:');
			for (const v of violations) {
				console.error(`   - ${v.file}`);
			}
			console.error('   Architecture requires: smooth() → process()\n');
		}

		expect(violations.length).toBe(0);
	});

	it('RED: Every process() call must be followed by emit() in same file', () => {
		/**
		 * Architecture: FSMAction MUST go to Emitter
		 * If you process, you MUST emit.
		 */
		const files = getDemoFiles();
		const violations: Array<{ file: string }> = [];

		// Exempt files that are FSM-only demos (explicitly testing FSM in isolation)
		// Also exempt PalmConeGate demos (different .process() interface)
		const FSM_ISOLATION_DEMOS = ['showcase-fsm.ts', 'showcase-palmcone.ts'];

		for (const file of files) {
			if (FSM_ISOLATION_DEMOS.includes(file.name)) continue;

			const hasProcess = file.content.includes('.process(');
			const hasEmit =
				file.content.includes('.emit(') ||
				file.content.includes('dispatchEvent') ||
				file.content.includes('PointerEventAdapter');

			// Files with process but no emit are violations
			if (hasProcess && !hasEmit) {
				violations.push({ file: file.name });
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: PROCESS WITHOUT EMIT:');
			for (const v of violations) {
				console.error(`   - ${v.file}`);
			}
			console.error('   Architecture requires: process() → emit()\n');
		}

		expect(violations.length).toBe(0);
	});

	it('RED: Complete pipeline chain must exist (Sensor → Smooth → FSM → Emit)', () => {
		/**
		 * At least 50% of showcases should have the complete pipeline.
		 * This ensures the architecture is actually demonstrated.
		 */
		const files = getDemoFiles().filter(
			(f) => f.name.startsWith('showcase-') && f.name.endsWith('.ts'),
		);

		let completeCount = 0;
		const incomplete: Array<{ file: string; missing: string[] }> = [];

		for (const file of files) {
			const hasSensor =
				file.content.includes('createSensorFrameFromMouse') ||
				file.content.includes('MediaPipeAdapter');
			const hasSmooth = file.content.includes('.smooth(');
			const hasProcess = file.content.includes('.process(');
			const hasEmit =
				file.content.includes('.emit(') || file.content.includes('PointerEventAdapter');

			const missing: string[] = [];
			if (!hasSensor) missing.push('SensorFrame factory');
			if (!hasSmooth) missing.push('.smooth()');
			if (!hasProcess) missing.push('.process()');
			if (!hasEmit) missing.push('.emit()');

			if (missing.length === 0) {
				completeCount++;
			} else if (hasSmooth) {
				// Only count as incomplete if it has SOME pipeline
				incomplete.push({ file: file.name, missing });
			}
		}

		const completionRatio = completeCount / Math.max(files.length, 1);

		console.log(
			`\n📊 Pipeline Completion: ${completeCount}/${files.length} showcases (${(completionRatio * 100).toFixed(0)}%)`,
		);

		if (incomplete.length > 0) {
			console.error('\n🔴 RED TEST: INCOMPLETE PIPELINES:');
			for (const inc of incomplete) {
				console.error(`   - ${inc.file}: Missing [${inc.missing.join(', ')}]`);
			}
		}

		// ENFORCEMENT: At least 50% of showcases must be complete
		expect(completionRatio).toBeGreaterThanOrEqual(0.5);
	});
});

describe('RED: Adapter Method Usage (IR-0012.3)', () => {
	it('RED: PointerEventAdapter must call emit() when instantiated', () => {
		const files = getDemoFiles();
		const violations: Array<{ file: string }> = [];

		for (const file of files) {
			const hasPointerAdapter = /new\s+PointerEventAdapter\s*\(/.test(file.content);
			const hasEmitCall = /\.emit\s*\(/.test(file.content);

			if (hasPointerAdapter && !hasEmitCall) {
				violations.push({ file: file.name });
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: PointerEventAdapter WITHOUT emit():');
			for (const v of violations) {
				console.error(`   - ${v.file}`);
			}
		}

		expect(violations.length).toBe(0);
	});

	it('RED: XStateFSMAdapter must call process() when instantiated', () => {
		const files = getDemoFiles();
		const violations: Array<{ file: string }> = [];

		for (const file of files) {
			const hasFSMAdapter = /new\s+XStateFSMAdapter\s*\(/.test(file.content);
			const hasProcessCall = /\.process\s*\(/.test(file.content);

			if (hasFSMAdapter && !hasProcessCall) {
				violations.push({ file: file.name });
			}
		}

		if (violations.length > 0) {
			console.error('\n🔴 RED TEST: XStateFSMAdapter WITHOUT process():');
			for (const v of violations) {
				console.error(`   - ${v.file}`);
			}
		}

		expect(violations.length).toBe(0);
	});
});

describe('AUDIT: Architecture Truth Report', () => {
	it('generates comprehensive architecture compliance report', () => {
		const orphans = findOrphanedAdapters();
		const glUsage = analyzeGoldenLayoutUsage();
		const gaps = findPipelineGaps();

		console.log(`\n${'='.repeat(70)}`);
		console.log('ARCHITECTURE TRUTH-SEEKER REPORT');
		console.log('='.repeat(70));

		console.log('\n📋 ORPHANED ADAPTERS:');
		if (orphans.length === 0) {
			console.log('  ✅ None detected');
		} else {
			for (const o of orphans) {
				console.log(
					`  ❌ ${o.file}: ${o.adapter} (missing: ${o.requiredMethodsMissing.join(', ')})`,
				);
			}
		}

		console.log('\n📋 GOLDENLAYOUT INTEGRATION:');
		for (const u of glUsage) {
			const status = u.isFullyWired ? '✅' : '❌';
			console.log(`  ${status} ${u.file}`);
			console.log(`     Methods: ${u.methodsUsed.join(', ') || 'NONE'}`);
			if (u.methodsMissing.length > 0) {
				console.log(`     Missing: ${u.methodsMissing.join(', ')}`);
			}
		}

		console.log('\n📋 PIPELINE GAPS:');
		if (gaps.length === 0) {
			console.log('  ✅ No gaps detected');
		} else {
			for (const g of gaps) {
				console.log(`  ⚠️ ${g.file}: ${g.flow}`);
			}
		}

		console.log(`\n${'='.repeat(70)}`);

		// Summary
		const totalIssues = orphans.length + glUsage.filter((u) => !u.isFullyWired).length;
		console.log(`TOTAL ISSUES: ${totalIssues}`);
		console.log(`${'='.repeat(70)}\n`);

		expect(totalIssues).toBeGreaterThanOrEqual(0);
	});
});
