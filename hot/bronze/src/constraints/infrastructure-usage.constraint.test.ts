import * as fs from 'node:fs';
import * as path from 'node:path';
/**
 * INFRASTRUCTURE USAGE CONSTRAINT TESTS
 *
 * Gen87.X3 | Port 5 DEFEND | Architecture Enforcement
 *
 * PURPOSE: Ensure demos ACTUALLY USE the infrastructure, not just import it.
 * These tests FAIL if demos bypass the hexagonal architecture.
 *
 * CATEGORIES:
 * - FULL_PIPELINE: Must use Sense → Shape → Deliver pipeline
 * - UI_SHELL: Must use GoldenLayoutShellAdapter
 * - POINTER_OUTPUT: Must use PointerEventAdapter
 * - FSM: Must use XStateFSMAdapter
 *
 * At least ONE demo MUST exist per category for the architecture to be valid.
 */
import { describe, expect, it } from 'vitest';

// ============================================================================
// INFRASTRUCTURE ADAPTERS (Real implementations, not mocks)
// ============================================================================

const INFRASTRUCTURE = {
	// Port 0 - SENSE
	SENSE: {
		adapters: ['MediaPipeAdapter', 'createSensorFrameFromMouse'],
		patterns: [/new\s+MediaPipeAdapter\s*\(/, /createSensorFrameFromMouse\s*\(/],
		description: 'Sensor input (MediaPipe or mouse)',
	},

	// Port 2 - SHAPE
	SHAPE: {
		adapters: ['OneEuroExemplarAdapter', 'RapierPhysicsAdapter', 'DESPAdapter'],
		patterns: [
			/new\s+OneEuroExemplarAdapter\s*\(/,
			/new\s+RapierPhysicsAdapter\s*\(/,
			/new\s+DESPAdapter\s*\(/,
		],
		description: 'Smoothing/filtering adapters',
	},

	// Port 3 - DELIVER (UI Shell)
	UI_SHELL: {
		adapters: ['GoldenLayoutShellAdapter'],
		patterns: [/new\s+GoldenLayoutShellAdapter\s*\(/],
		description: 'GoldenLayout for tiling windows',
	},

	// Port 3 - DELIVER (Pointer Output)
	POINTER_OUTPUT: {
		adapters: ['PointerEventAdapter'],
		patterns: [/new\s+PointerEventAdapter\s*\(/],
		description: 'W3C PointerEvent emission',
	},

	// Port 3 - DELIVER (FSM)
	FSM: {
		adapters: ['XStateFSMAdapter', 'createXStateFSMAdapter'],
		patterns: [/new\s+XStateFSMAdapter\s*\(/, /createXStateFSMAdapter\s*\(/],
		description: 'XState finite state machine',
	},

	// Infrastructure - Message Bus
	MESSAGE_BUS: {
		adapters: ['InMemorySubstrateAdapter'],
		patterns: [/new\s+InMemorySubstrateAdapter\s*\(/],
		description: 'Stigmergy message bus',
	},
};

// ============================================================================
// DEMO CATEGORY REQUIREMENTS
// ============================================================================

interface DemoCategoryRequirement {
	name: string;
	description: string;
	required: Array<keyof typeof INFRASTRUCTURE>;
	minimumDemos: number;
}

const DEMO_CATEGORIES: DemoCategoryRequirement[] = [
	{
		name: 'FULL_PIPELINE',
		description: 'Complete Sense → Shape → Deliver pipeline',
		required: ['SENSE', 'SHAPE'],
		minimumDemos: 1,
	},
	{
		name: 'UI_SHELL',
		description: 'GoldenLayout-based UI composition',
		required: ['UI_SHELL'],
		minimumDemos: 1, // ENFORCED: At least 1 demo must use GoldenLayoutShellAdapter
	},
	{
		name: 'POINTER_OUTPUT',
		description: 'W3C PointerEvent output integration',
		required: ['POINTER_OUTPUT'],
		minimumDemos: 1, // ENFORCED: At least 1 demo must use PointerEventAdapter
	},
	{
		name: 'FSM_INTEGRATION',
		description: 'XState FSM state management',
		required: ['FSM'],
		minimumDemos: 1, // ENFORCED: At least 1 demo must use XStateFSMAdapter
	},
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

function getAllDemoFiles(): string[] {
	const projectRoot = path.resolve(__dirname, '../../../../');
	const demosDir = path.join(projectRoot, 'demos');
	const files: string[] = [];

	if (!fs.existsSync(demosDir)) {
		return files;
	}

	// TypeScript demos in src/
	const srcDir = path.join(demosDir, 'src');
	if (fs.existsSync(srcDir)) {
		fs.readdirSync(srcDir)
			.filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
			.forEach((f) => files.push(path.join(srcDir, f)));
	}

	// HTML demos (non-index)
	fs.readdirSync(demosDir)
		.filter((f) => f.endsWith('.html') && !f.includes('index'))
		.forEach((f) => files.push(path.join(demosDir, f)));

	return files;
}

function checkInfrastructureUsage(content: string, infra: keyof typeof INFRASTRUCTURE): boolean {
	const { patterns } = INFRASTRUCTURE[infra];
	return patterns.some((pattern) => pattern.test(content));
}

function categorizeDemo(content: string): string[] {
	const categories: string[] = [];

	for (const category of DEMO_CATEGORIES) {
		const meetsRequirements = category.required.every((req) =>
			checkInfrastructureUsage(content, req),
		);
		if (meetsRequirements) {
			categories.push(category.name);
		}
	}

	return categories;
}

// ============================================================================
// CONSTRAINT TESTS
// ============================================================================

describe('CONSTRAINT: Infrastructure Usage Enforcement', () => {
	const demoFiles = getAllDemoFiles();

	describe('Demo Category Coverage', () => {
		for (const category of DEMO_CATEGORIES) {
			if (category.minimumDemos === 0) {
				// PRODUCTION: Skip categories with 0 minimum, don't use it.todo
				// @reason: Category has no minimum requirement, skipping enforcement
				it.skip(`[SKIPPED] ${category.name}: ${category.description} (minimum=0)`, () => {
					// This category has no minimum requirement
				});
				continue;
			}

			it(`${category.name}: At least ${category.minimumDemos} demo(s) must exist`, () => {
				let matchingDemos = 0;
				const matchedFiles: string[] = [];

				for (const file of demoFiles) {
					const content = fs.readFileSync(file, 'utf-8');
					const meetsRequirements = category.required.every((req) =>
						checkInfrastructureUsage(content, req),
					);

					if (meetsRequirements) {
						matchingDemos++;
						matchedFiles.push(path.basename(file));
					}
				}

				expect(
					matchingDemos,
					`Category ${category.name} requires ${category.minimumDemos} demo(s) but found ${matchingDemos}.\n` +
						`Required infrastructure: ${category.required.join(', ')}\n` +
						`Matching demos: ${matchedFiles.length > 0 ? matchedFiles.join(', ') : 'NONE'}`,
				).toBeGreaterThanOrEqual(category.minimumDemos);
			});
		}
	});

	describe('Infrastructure Instantiation (not just import)', () => {
		it('demos that import adapters must INSTANTIATE them', () => {
			const violations: { file: string; imported: string[]; instantiated: string[] }[] = [];

			for (const file of demoFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const filename = path.basename(file);

				// Find all adapter imports
				const importMatches = content.matchAll(/import\s*\{[^}]*(\w+Adapter)[^}]*\}/g);
				const importedAdapters: string[] = [];
				for (const match of importMatches) {
					const adapters = match[0].match(/\w+Adapter/g) || [];
					importedAdapters.push(...adapters);
				}

				// Check which are instantiated
				const instantiatedAdapters: string[] = [];
				for (const adapter of importedAdapters) {
					const instantiationPattern = new RegExp(`new\\s+${adapter}\\s*\\(`);
					if (instantiationPattern.test(content)) {
						instantiatedAdapters.push(adapter);
					}
				}

				// If imported but not instantiated, it's suspicious
				const notInstantiated = importedAdapters.filter((a) => !instantiatedAdapters.includes(a));
				if (notInstantiated.length > 0 && importedAdapters.length > 0) {
					// Only flag if NONE are instantiated (type-only imports are ok)
					if (instantiatedAdapters.length === 0) {
						violations.push({
							file: filename,
							imported: importedAdapters,
							instantiated: instantiatedAdapters,
						});
					}
				}
			}

			if (violations.length > 0) {
				const report = violations
					.map(
						(v) =>
							`  ${v.file}:\n` +
							`    Imported: ${v.imported.join(', ')}\n` +
							`    Instantiated: ${v.instantiated.length > 0 ? v.instantiated.join(', ') : 'NONE'}`,
					)
					.join('\n');

				expect.fail(`Adapters imported but never instantiated (theater code):\n${report}`);
			}
		});
	});

	// Allowlist for demos that intentionally showcase raw library usage
	// These are integration demos that demonstrate the underlying library
	const RAW_LIBRARY_ALLOWLIST = [
		'12-golden-unified.html', // Unified showcase - demonstrates raw GoldenLayout integration
		'showcase-goldenlayout.ts', // GoldenLayout showcase demo
	];

	describe('Anti-Bypass Checks', () => {
		it('demos should NOT use raw GoldenLayout constructor (use adapter)', () => {
			for (const file of demoFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const filename = path.basename(file);

				// Skip allowlisted demos
				if (RAW_LIBRARY_ALLOWLIST.includes(filename)) continue;

				// Direct GoldenLayout usage bypasses our adapter
				const usesRawGoldenLayout =
					/new\s+GoldenLayout\s*\(/.test(content) && !/GoldenLayoutShellAdapter/.test(content);

				expect(
					usesRawGoldenLayout,
					`${filename} uses raw GoldenLayout constructor. Use GoldenLayoutShellAdapter instead.`,
				).toBe(false);
			}
		});

		it('demos should NOT use raw PointerEvent constructor (use adapter)', () => {
			for (const file of demoFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const filename = path.basename(file);

				// Direct PointerEvent creation bypasses our adapter
				const usesRawPointerEvent =
					/new\s+PointerEvent\s*\(/.test(content) && !/PointerEventAdapter/.test(content);

				expect(
					usesRawPointerEvent,
					`${filename} uses raw PointerEvent constructor. Use PointerEventAdapter instead.`,
				).toBe(false);
			}
		});

		it('demos should NOT use raw createMachine from xstate (use adapter)', () => {
			for (const file of demoFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const filename = path.basename(file);

				// Direct xstate usage bypasses our adapter
				const usesRawXState =
					/createMachine\s*\(/.test(content) &&
					!/XStateFSMAdapter/.test(content) &&
					!/createXStateFSMAdapter/.test(content);

				expect(
					usesRawXState,
					`${filename} uses raw xstate createMachine. Use XStateFSMAdapter instead.`,
				).toBe(false);
			}
		});
	});
});

describe('AUDIT: Infrastructure Usage Report', () => {
	it('generates infrastructure coverage report', () => {
		const demoFiles = getAllDemoFiles();

		console.log('\n📊 INFRASTRUCTURE USAGE REPORT');
		console.log('═'.repeat(70));

		const infraUsage: Record<string, string[]> = {};
		for (const key of Object.keys(INFRASTRUCTURE)) {
			infraUsage[key] = [];
		}

		for (const file of demoFiles) {
			const content = fs.readFileSync(file, 'utf-8');
			const filename = path.basename(file);

			for (const [key, infra] of Object.entries(INFRASTRUCTURE)) {
				if (infra.patterns.some((p) => p.test(content))) {
					infraUsage[key].push(filename);
				}
			}
		}

		for (const [key, infra] of Object.entries(INFRASTRUCTURE)) {
			const demos = infraUsage[key];
			const status = demos.length > 0 ? '✅' : '❌';
			console.log(`${status} ${key}: ${infra.description}`);
			if (demos.length > 0) {
				demos.forEach((d) => console.log(`   └─ ${d}`));
			} else {
				console.log('   └─ NO DEMOS USE THIS INFRASTRUCTURE');
			}
		}

		console.log('');
		console.log('═'.repeat(70));
		console.log('CATEGORY COVERAGE:');

		for (const category of DEMO_CATEGORIES) {
			let matchingDemos = 0;
			for (const file of demoFiles) {
				const content = fs.readFileSync(file, 'utf-8');
				const meets = category.required.every((req) => checkInfrastructureUsage(content, req));
				if (meets) matchingDemos++;
			}

			const needed = category.minimumDemos;
			const status = matchingDemos >= needed ? '✅' : needed > 0 ? '❌' : '⏳';
			console.log(
				`${status} ${category.name}: ${matchingDemos}/${needed} demos (${category.description})`,
			);
		}

		console.log('═'.repeat(70));
		console.log('');

		expect(true).not.toBe(false);
	});
});
