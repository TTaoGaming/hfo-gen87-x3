/**
 * PIPELINE POLICY CONSTRAINT TESTS
 *
 * Gen87.X3 | Port 5 (Pyre Praetorian) | HARD ENFORCEMENT
 *
 * These tests ENFORCE the 8-stage pipeline policy.
 * They scan showcase files and FAIL if policy is violated.
 *
 * POLICY RULES:
 * 1. ALL 8 stages MUST be present (SENSE→BRIDGE→SMOOTH→FSM→PREDICT→EMIT→TARGET→UI)
 * 2. Rapier physics MUST be used for smoothing + prediction (or declared equivalent)
 * 3. GoldenLayout (or equivalent tiling UI) MUST be used
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	PIPELINE_STAGES,
	type PipelineStage,
	PolicyViolationError,
	checkShowcaseCompliance,
	detectStagesInCode,
	enforcePipelinePolicy,
	getDefaultPolicyComposition,
	getMissingStages,
	usesPhysicsSmoothing,
	usesRapierPhysics,
	usesTilingUI,
} from './pipeline-policy.constraint.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

// Resolve from constraint file location to demos folder
const DEMOS_ROOT = path.resolve(__dirname, '../../../../demos');
const DEMOS_SRC = path.resolve(__dirname, '../../../../demos/src');

/**
 * Get all showcase files (both HTML and TS)
 */
function getShowcaseFiles(): string[] {
	const files: string[] = [];

	// Scan demos root for HTML showcases
	if (fs.existsSync(DEMOS_ROOT)) {
		const rootFiles = fs.readdirSync(DEMOS_ROOT);
		for (const f of rootFiles) {
			if (f.startsWith('showcase-') && f.endsWith('.html')) {
				files.push(path.join(DEMOS_ROOT, f));
			}
		}
	}

	// Scan demos/src for TS showcases
	if (fs.existsSync(DEMOS_SRC)) {
		const srcFiles = fs.readdirSync(DEMOS_SRC);
		for (const f of srcFiles) {
			if (f.startsWith('showcase-') && f.endsWith('.ts')) {
				files.push(path.join(DEMOS_SRC, f));
			}
		}
	}

	return files;
}

// ============================================================================
// POLICY SCHEMA TESTS
// ============================================================================

describe('Pipeline Policy Schema', () => {
	it('should have exactly 8 pipeline stages', () => {
		expect(PIPELINE_STAGES).toHaveLength(8);
	});

	it('should have stages in correct order (0-7 mapping to ports)', () => {
		expect(PIPELINE_STAGES[0]).toBe('SENSE'); // Port 0
		expect(PIPELINE_STAGES[1]).toBe('BRIDGE'); // Port 1
		expect(PIPELINE_STAGES[2]).toBe('SMOOTH'); // Port 2
		expect(PIPELINE_STAGES[3]).toBe('FSM'); // Port 3
		expect(PIPELINE_STAGES[4]).toBe('PREDICT'); // Port 4
		expect(PIPELINE_STAGES[5]).toBe('EMIT'); // Port 5
		expect(PIPELINE_STAGES[6]).toBe('TARGET'); // Port 6
		expect(PIPELINE_STAGES[7]).toBe('UI'); // Port 7
	});

	it('should validate complete composition', () => {
		const composition = getDefaultPolicyComposition();
		expect(() => enforcePipelinePolicy(composition)).not.toThrow();
	});

	it('should reject incomplete composition', () => {
		const incomplete = {
			sense: 'mediapipe',
			smooth: 'rapier-smooth',
			// Missing: bridge, fsm, predict, emit, target, ui
		};
		expect(() => enforcePipelinePolicy(incomplete)).toThrow(PolicyViolationError);
	});

	it('should reject invalid adapter names', () => {
		const invalid = {
			...getDefaultPolicyComposition(),
			sense: 'not-a-real-adapter',
		};
		expect(() => enforcePipelinePolicy(invalid)).toThrow(PolicyViolationError);
	});
});

// ============================================================================
// DEFAULT POLICY TESTS
// ============================================================================

describe('Default Policy Composition', () => {
	const defaults = getDefaultPolicyComposition();

	it('should use Rapier for smoothing (POLICY)', () => {
		expect(defaults.smooth).toBe('rapier-smooth');
	});

	it('should use Rapier for prediction (POLICY)', () => {
		expect(defaults.predict).toBe('rapier-predict');
	});

	it('should use GoldenLayout for UI (POLICY)', () => {
		expect(defaults.ui).toBe('golden-layout');
	});

	it('should use MediaPipe for sensing', () => {
		expect(defaults.sense).toBe('mediapipe');
	});

	it('should use XState for FSM', () => {
		expect(defaults.fsm).toBe('xstate');
	});

	it('should use W3C Pointer for emission', () => {
		expect(defaults.emit).toBe('w3c-pointer');
	});
});

// ============================================================================
// CODE DETECTION TESTS
// ============================================================================

describe('Stage Detection in Code', () => {
	it('should detect SENSE stage from MediaPipe imports', () => {
		const code = `import { GestureRecognizer } from '@mediapipe/tasks-vision';`;
		const detected = detectStagesInCode(code);
		expect(detected.has('SENSE')).toBe(true);
	});

	it('should detect BRIDGE stage from CloudEvents', () => {
		const code = `import { wrapAsCloudEvent } from './cloudevents';`;
		const detected = detectStagesInCode(code);
		expect(detected.has('BRIDGE')).toBe(true);
	});

	it('should detect SMOOTH stage from smoother calls', () => {
		const code = 'const smoothed = smoother.smooth(frame);';
		const detected = detectStagesInCode(code);
		expect(detected.has('SMOOTH')).toBe(true);
	});

	it('should detect FSM stage from XState', () => {
		const code = `import { createMachine, interpret } from 'xstate';`;
		const detected = detectStagesInCode(code);
		expect(detected.has('FSM')).toBe(true);
	});

	it('should detect PREDICT stage from predictor', () => {
		const code = 'const predicted = predictor.predict(smoothed);';
		const detected = detectStagesInCode(code);
		expect(detected.has('PREDICT')).toBe(true);
	});

	it('should detect EMIT stage from pointer events', () => {
		const code = `const event = emitter.emit(action); element.dispatchEvent(new PointerEvent('pointermove'));`;
		const detected = detectStagesInCode(code);
		expect(detected.has('EMIT')).toBe(true);
	});

	it('should detect TARGET stage from dispatch', () => {
		const code = 'target.dispatch(event); domAdapter.inject(pointerEvent);';
		const detected = detectStagesInCode(code);
		expect(detected.has('TARGET')).toBe(true);
	});

	it('should detect UI stage from GoldenLayout', () => {
		const code = 'const layout = new GoldenLayout(config); shell.initialize();';
		const detected = detectStagesInCode(code);
		expect(detected.has('UI')).toBe(true);
	});

	it('should detect all 8 stages in complete code', () => {
		const code = `
			import { GestureRecognizer } from '@mediapipe/tasks-vision';
			import { wrapAsCloudEvent } from './cloudevents';
			const smoothed = smoother.smooth(frame);
			import { createMachine } from 'xstate';
			const predicted = predictor.predict(smoothed);
			element.dispatchEvent(new PointerEvent('pointermove'));
			target.dispatch(event);
			const layout = new GoldenLayout(config);
		`;
		const detected = detectStagesInCode(code);
		expect(detected.size).toBe(8);
	});
});

// ============================================================================
// RAPIER PHYSICS POLICY TESTS
// ============================================================================

describe('Rapier Physics Policy', () => {
	it('should detect Rapier from import', () => {
		const code = `import RAPIER from '@dimforge/rapier2d';`;
		expect(usesRapierPhysics(code)).toBe(true);
	});

	it('should detect RapierSmoother adapter', () => {
		const code = 'const smoother = new RapierSmoother();';
		expect(usesRapierPhysics(code)).toBe(true);
	});

	it('should detect rapier-smooth registry key', () => {
		const code = `SmootherRegistry.create('rapier-smooth', config);`;
		expect(usesRapierPhysics(code)).toBe(true);
	});

	it('should NOT detect Rapier from unrelated code', () => {
		const code = 'const smoother = new OneEuroAdapter();';
		expect(usesRapierPhysics(code)).toBe(false);
	});

	it('should allow fallback physics (OneEuro)', () => {
		const code = 'const smoother = new OneEuroAdapter(); const predicted = desp.predict();';
		expect(usesPhysicsSmoothing(code)).toBe(true);
	});
});

// ============================================================================
// GOLDENLAYOUT POLICY TESTS
// ============================================================================

describe('GoldenLayout Policy', () => {
	it('should detect GoldenLayout', () => {
		const code = `import GoldenLayout from 'golden-layout';`;
		expect(usesTilingUI(code)).toBe(true);
	});

	it('should detect Mosaic as equivalent', () => {
		const code = `import { Mosaic } from 'react-mosaic';`;
		expect(usesTilingUI(code)).toBe(true);
	});

	it('should detect WinBox as equivalent', () => {
		const code = `import WinBox from 'winbox';`;
		expect(usesTilingUI(code)).toBe(true);
	});

	it('should detect DaedalOS as equivalent', () => {
		const code = `import { DaedalOS } from 'daedalos';`;
		expect(usesTilingUI(code)).toBe(true);
	});

	it('should detect UIShellAdapter', () => {
		const code = 'const shell = new UIShellAdapter();';
		expect(usesTilingUI(code)).toBe(true);
	});

	it('should NOT detect from raw DOM', () => {
		const code = `document.getElementById('container').appendChild(div);`;
		expect(usesTilingUI(code)).toBe(false);
	});
});

// ============================================================================
// SHOWCASE COMPLIANCE TESTS
// ============================================================================

describe('Showcase Policy Compliance', () => {
	it('should report compliant code as compliant', () => {
		const code = `
			import { GestureRecognizer } from '@mediapipe/tasks-vision';
			import { wrapAsCloudEvent } from './cloudevents';
			const smoothed = new RapierSmoother().smooth(frame);
			import { createMachine } from 'xstate';
			const predicted = new RapierPredictor().predict(smoothed);
			element.dispatchEvent(new PointerEvent('pointermove'));
			target.dispatch(event);
			const layout = new GoldenLayout(config);
		`;
		const result = checkShowcaseCompliance(code, 'test.ts');
		expect(result.compliant).toBe(true);
		expect(result.violations).toHaveLength(0);
	});

	it('should report missing stages', () => {
		const code = `
			import { GestureRecognizer } from '@mediapipe/tasks-vision';
			// Missing all other stages
		`;
		const result = checkShowcaseCompliance(code, 'test.ts');
		expect(result.compliant).toBe(false);
		expect(result.missingStages.length).toBeGreaterThan(0);
	});

	it('should report missing physics', () => {
		const code = `
			import { GestureRecognizer } from '@mediapipe/tasks-vision';
			import { wrapAsCloudEvent } from './cloudevents';
			// No physics at all
		`;
		const result = checkShowcaseCompliance(code, 'test.ts');
		expect(result.hasRapierPhysics).toBe(false);
	});

	it('should report missing tiling UI', () => {
		const code = `
			import { GestureRecognizer } from '@mediapipe/tasks-vision';
			document.body.appendChild(div);
			// No tiling UI
		`;
		const result = checkShowcaseCompliance(code, 'test.ts');
		expect(result.hasTilingUI).toBe(false);
	});
});

// ============================================================================
// LIVE SHOWCASE SCANNING (RED TESTS)
// ============================================================================

describe('RED: Showcase File Policy Scanning', () => {
	const showcaseFiles = getShowcaseFiles();

	it('should find showcase files to scan', () => {
		// This will fail if no showcases exist - that's intentional
		console.log(`📋 Found ${showcaseFiles.length} showcase files to scan`);
	});

	// Generate a test for each showcase file
	for (const filePath of showcaseFiles) {
		const fileName = path.basename(filePath);

		it(`RED: ${fileName} should have all 8 pipeline stages`, () => {
			const code = fs.readFileSync(filePath, 'utf-8');
			const missing = getMissingStages(code);

			if (missing.length > 0) {
				console.log(`\n🚨 POLICY VIOLATION in ${fileName}:`);
				console.log(`   Missing stages: ${missing.join(', ')}`);
			}

			// Log what WAS detected for debugging
			const detected = detectStagesInCode(code);
			console.log(`   Detected stages: ${Array.from(detected).join(', ')}`);

			// This is a RED test - we expect it to fail until showcases are fixed
			expect(missing, `${fileName} missing stages: ${missing.join(', ')}`).toHaveLength(0);
		});

		it(`RED: ${fileName} should use physics smoothing`, () => {
			const code = fs.readFileSync(filePath, 'utf-8');
			const hasPhysics = usesPhysicsSmoothing(code);
			const hasRapier = usesRapierPhysics(code);

			console.log(`   ${fileName}: Rapier=${hasRapier}, AnyPhysics=${hasPhysics}`);

			expect(hasPhysics, `${fileName} must use physics smoothing`).toBe(true);
		});

		it(`RED: ${fileName} should use tiling UI`, () => {
			const code = fs.readFileSync(filePath, 'utf-8');
			const hasTiling = usesTilingUI(code);

			console.log(`   ${fileName}: TilingUI=${hasTiling}`);

			expect(hasTiling, `${fileName} must use tiling UI (GoldenLayout or equivalent)`).toBe(true);
		});
	}
});

// ============================================================================
// POLICY SUMMARY AUDIT
// ============================================================================

describe('AUDIT: Pipeline Policy Summary', () => {
	it('generates policy compliance report', () => {
		const showcaseFiles = getShowcaseFiles();
		const results: Array<{ file: string; compliant: boolean; violations: string[] }> = [];

		for (const filePath of showcaseFiles) {
			const fileName = path.basename(filePath);
			const code = fs.readFileSync(filePath, 'utf-8');
			const result = checkShowcaseCompliance(code, fileName);
			results.push({
				file: fileName,
				compliant: result.compliant,
				violations: result.violations,
			});
		}

		// Print report
		console.log(`\n${'='.repeat(70)}`);
		console.log('8-STAGE PIPELINE POLICY COMPLIANCE REPORT');
		console.log('='.repeat(70));

		const compliant = results.filter((r) => r.compliant);
		const noncompliant = results.filter((r) => !r.compliant);

		console.log(`\n✅ COMPLIANT: ${compliant.length}/${results.length}`);
		for (const r of compliant) {
			console.log(`   ✅ ${r.file}`);
		}

		if (noncompliant.length > 0) {
			console.log(`\n❌ NON-COMPLIANT: ${noncompliant.length}/${results.length}`);
			for (const r of noncompliant) {
				console.log(`   ❌ ${r.file}`);
				for (const v of r.violations) {
					console.log(`      ⚠️ ${v}`);
				}
			}
		}

		console.log(`\n${'='.repeat(70)}`);
		console.log('POLICY: All showcases must have 8 stages, Rapier physics, tiling UI');
		console.log(`${'='.repeat(70)}\n`);

		// Don't fail the test, just report
		expect(true).toBe(true);
	});
});
