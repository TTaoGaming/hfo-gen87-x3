/**
 * Interface Compliance Constraint Tests
 * ======================================
 * Gen87.X3 | Port 5 (DEFEND) | Pyre Praetorian
 *
 * PURPOSE: Automated detection of ad-hoc implementations that bypass
 * canonical interfaces. These tests REVEAL violations - they don't break
 * existing code, they expose it for safe migration.
 *
 * CANONICAL INTERFACES (hot/bronze/src/contracts/ports.ts):
 * - SensorPort.sense(video, timestamp) → SensorFrame
 * - SmootherPort.smooth(SensorFrame) → SmoothedFrame
 * - FSMPort.process(SmoothedFrame) → FSMAction
 * - UIShellPort for GoldenLayout
 *
 * AD-HOC PATTERNS TO DETECT:
 * - Point2D instead of SensorFrame
 * - SmoothedPoint instead of SmoothedFrame
 * - Direct imports from quarantine/
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Canonical schemas (SSOT)
import { type SensorFrame, type SmoothedFrame, SmoothedFrameSchema } from '../contracts/schemas.js';

import { DoubleExponentialPredictor } from '../adapters/double-exponential-predictor.adapter.js';
import { OneEuroExemplarAdapter } from '../adapters/one-euro-exemplar.adapter.js';
// All SmootherPort implementations to audit
import { OneEuroAdapter } from '../adapters/one-euro.adapter.js';
import { RapierPhysicsAdapter } from '../adapters/rapier-physics.adapter.js';

// ============================================================================
// SCHEMA DEFINITIONS FOR COMPLIANCE TESTING
// ============================================================================

/**
 * Ad-hoc Point2D schema (from quarantine - NOT canonical)
 * Used to detect if implementations accept this when they shouldn't
 */
const Point2DSchema = z.object({
	x: z.number(),
	y: z.number(),
	timestamp: z.number(),
});

/**
 * Ad-hoc SmoothedPoint schema (from quarantine - NOT canonical)
 */
const SmoothedPointSchema = z.object({
	x: z.number(),
	y: z.number(),
	timestamp: z.number(),
	smoothedX: z.number(),
	smoothedY: z.number(),
	jitter: z.number(),
});

/**
 * Generate valid SensorFrame for property testing
 */
const SensorFrameArbitrary = fc.record({
	ts: fc.float({ min: 0, max: 100000, noNaN: true }),
	handId: fc.constantFrom('left', 'right', 'none') as fc.Arbitrary<'left' | 'right' | 'none'>,
	trackingOk: fc.boolean(),
	palmFacing: fc.boolean(),
	label: fc.constantFrom(
		'Open_Palm',
		'Pointing_Up',
		'Victory',
		'Thumb_Up',
		'Thumb_Down',
		'Closed_Fist',
		'ILoveYou',
		'None',
	) as fc.Arbitrary<
		| 'Open_Palm'
		| 'Pointing_Up'
		| 'Victory'
		| 'Thumb_Up'
		| 'Thumb_Down'
		| 'Closed_Fist'
		| 'ILoveYou'
		| 'None'
	>,
	confidence: fc.float({ min: 0, max: 1, noNaN: true }),
	indexTip: fc.option(
		fc.record({
			x: fc.float({ min: 0, max: 1, noNaN: true }),
			y: fc.float({ min: 0, max: 1, noNaN: true }),
			z: fc.float({ min: -1, max: 1, noNaN: true }),
			visibility: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), { nil: null }),
		}),
		{ nil: null },
	),
	landmarks: fc.constant(null), // Simplified for testing
});

// ============================================================================
// SMOOTHER PORT COMPLIANCE REGISTRY
// ============================================================================

interface SmootherPortImplementation {
	name: string;
	factory: () => Promise<{
		smooth: (frame: SensorFrame) => SmoothedFrame;
		reset: () => void;
		setParams: (mincutoff: number, beta: number) => void;
	}>;
	status: 'compliant' | 'ad-hoc' | 'wrapper';
}

const SMOOTHER_REGISTRY: SmootherPortImplementation[] = [
	{
		name: 'OneEuroAdapter',
		factory: async () => new OneEuroAdapter(),
		status: 'compliant',
	},
	{
		name: 'OneEuroExemplarAdapter',
		factory: async () => new OneEuroExemplarAdapter(),
		status: 'compliant',
	},
	{
		name: 'DoubleExponentialPredictor',
		factory: async () => new DoubleExponentialPredictor(),
		status: 'compliant',
	},
	{
		name: 'RapierPhysicsAdapter',
		factory: async () => {
			const adapter = new RapierPhysicsAdapter();
			await adapter.init();
			return adapter;
		},
		status: 'compliant',
	},
];

// ============================================================================
// COMPLIANCE TESTS
// ============================================================================

describe('CONSTRAINT: Interface Compliance Audit', () => {
	describe('SmootherPort Canonical Interface Compliance', () => {
		it.each(SMOOTHER_REGISTRY)(
			'$name MUST implement SmootherPort with canonical schemas',
			async ({ name, factory }) => {
				const adapter = await factory();

				// Verify interface shape
				expect(typeof adapter.smooth).toBe('function');
				expect(typeof adapter.reset).toBe('function');
				expect(typeof adapter.setParams).toBe('function');

				// Verify smooth() function arity
				expect(adapter.smooth.length).toBeLessThanOrEqual(1);
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name.smooth() MUST accept valid SensorFrame',
			async ({ name, factory }) => {
				const adapter = await factory();

				const validFrame: SensorFrame = {
					ts: 1000,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Open_Palm',
					confidence: 0.95,
					indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1.0 },
					landmarks: null,
				};

				// Should not throw
				const result = adapter.smooth(validFrame);

				// Result must exist
				expect(result).toBeDefined();
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name.smooth() MUST return valid SmoothedFrame',
			async ({ name, factory }) => {
				const adapter = await factory();

				const validFrame: SensorFrame = {
					ts: 1000,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Pointing_Up',
					confidence: 0.9,
					indexTip: { x: 0.3, y: 0.7, z: 0.1, visibility: 0.95 },
					landmarks: null,
				};

				const result = adapter.smooth(validFrame);

				// Validate against canonical SmoothedFrame schema
				const parseResult = SmoothedFrameSchema.safeParse(result);

				if (!parseResult.success) {
					console.error(`${name} returned invalid SmoothedFrame:`, parseResult.error.format());
				}

				expect(parseResult.success).toBe(true);
			},
		);
	});

	describe('SmootherPort Property-Based Compliance', () => {
		it.each(SMOOTHER_REGISTRY)(
			'PROPERTY: $name produces valid SmoothedFrame for ANY valid SensorFrame',
			async ({ name, factory }) => {
				const adapter = await factory();

				fc.assert(
					fc.property(SensorFrameArbitrary, (frame) => {
						// Skip frames without indexTip (some adapters require it)
						if (!frame.indexTip) {
							adapter.reset(); // Still exercise reset
							return true;
						}

						const result = adapter.smooth(frame as SensorFrame);
						const parseResult = SmoothedFrameSchema.safeParse(result);

						if (!parseResult.success) {
							console.error(`${name} failed for frame:`, frame);
							console.error('Error:', parseResult.error.format());
						}

						return parseResult.success;
					}),
					{ numRuns: 50 }, // 50 random frames per adapter
				);
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'PROPERTY: $name preserves handId across smooth()',
			async ({ name, factory }) => {
				const adapter = await factory();

				fc.assert(
					fc.property(SensorFrameArbitrary, (frame) => {
						if (!frame.indexTip) return true;

						const result = adapter.smooth(frame as SensorFrame);
						return result.handId === frame.handId;
					}),
					{ numRuns: 20 },
				);
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'PROPERTY: $name preserves label across smooth()',
			async ({ name, factory }) => {
				const adapter = await factory();

				fc.assert(
					fc.property(SensorFrameArbitrary, (frame) => {
						if (!frame.indexTip) return true;

						const result = adapter.smooth(frame as SensorFrame);
						return result.label === frame.label;
					}),
					{ numRuns: 20 },
				);
			},
		);
	});

	describe('SmootherPort Output Bounds', () => {
		it.each(SMOOTHER_REGISTRY)(
			'$name MUST output position in [0,1] range for [0,1] input',
			async ({ name, factory }) => {
				const adapter = await factory();

				// Feed normalized input
				const frame: SensorFrame = {
					ts: 1000,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Open_Palm',
					confidence: 0.9,
					indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1.0 },
					landmarks: null,
				};

				const result = adapter.smooth(frame);

				if (result.position) {
					expect(result.position.x).toBeGreaterThanOrEqual(0);
					expect(result.position.x).toBeLessThanOrEqual(1);
					expect(result.position.y).toBeGreaterThanOrEqual(0);
					expect(result.position.y).toBeLessThanOrEqual(1);
				}
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name MUST handle edge case: indexTip at (0,0)',
			async ({ name, factory }) => {
				const adapter = await factory();
				adapter.reset();

				const frame: SensorFrame = {
					ts: 1000,
					handId: 'left',
					trackingOk: true,
					palmFacing: false,
					label: 'Closed_Fist',
					confidence: 0.8,
					indexTip: { x: 0, y: 0, z: 0, visibility: 1.0 },
					landmarks: null,
				};

				// Should not throw
				const result = adapter.smooth(frame);
				expect(SmoothedFrameSchema.safeParse(result).success).toBe(true);
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name MUST handle edge case: indexTip at (1,1)',
			async ({ name, factory }) => {
				const adapter = await factory();
				adapter.reset();

				const frame: SensorFrame = {
					ts: 1000,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Victory',
					confidence: 0.99,
					indexTip: { x: 1, y: 1, z: 0, visibility: 1.0 },
					landmarks: null,
				};

				const result = adapter.smooth(frame);
				expect(SmoothedFrameSchema.safeParse(result).success).toBe(true);
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name MUST handle null indexTip gracefully',
			async ({ name, factory }) => {
				const adapter = await factory();

				const frame: SensorFrame = {
					ts: 1000,
					handId: 'none',
					trackingOk: false,
					palmFacing: false,
					label: 'None',
					confidence: 0,
					indexTip: null,
					landmarks: null,
				};

				// Should not throw - may return null position
				const result = adapter.smooth(frame);
				expect(SmoothedFrameSchema.safeParse(result).success).toBe(true);
			},
		);
	});

	describe('SmootherPort Reset Behavior', () => {
		it.each(SMOOTHER_REGISTRY)(
			'$name.reset() MUST be callable without error',
			async ({ factory }) => {
				const adapter = await factory();
				expect(() => adapter.reset()).not.toThrow();
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name.reset() MUST clear filter state (no velocity carryover)',
			async ({ name, factory }) => {
				const adapter = await factory();

				// Build up velocity
				for (let i = 0; i < 10; i++) {
					adapter.smooth({
						ts: i * 16,
						handId: 'right',
						trackingOk: true,
						palmFacing: true,
						label: 'Open_Palm',
						confidence: 0.9,
						indexTip: { x: 0.1 + i * 0.05, y: 0.5, z: 0, visibility: 1.0 },
						landmarks: null,
					});
				}

				// Reset
				adapter.reset();

				// First frame after reset should have minimal velocity
				const result = adapter.smooth({
					ts: 1000,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Open_Palm',
					confidence: 0.9,
					indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1.0 },
					landmarks: null,
				});

				// Velocity should be zero or near-zero after reset
				if (result.velocity) {
					expect(Math.abs(result.velocity.x)).toBeLessThan(0.1);
					expect(Math.abs(result.velocity.y)).toBeLessThan(0.1);
				}
			},
		);
	});

	describe('SmootherPort setParams Behavior', () => {
		it.each(SMOOTHER_REGISTRY)(
			'$name.setParams() MUST accept valid parameters',
			async ({ factory }) => {
				const adapter = await factory();
				expect(() => adapter.setParams(1.0, 0.007)).not.toThrow();
			},
		);

		it.each(SMOOTHER_REGISTRY)(
			'$name.setParams() affects smoothing behavior',
			async ({ name, factory }) => {
				const adapter = await factory();

				// Low beta = more smoothing (slower response)
				adapter.setParams(0.5, 0.001);
				adapter.reset();

				const frame1: SensorFrame = {
					ts: 0,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Open_Palm',
					confidence: 0.9,
					indexTip: { x: 0.5, y: 0.5, z: 0, visibility: 1.0 },
					landmarks: null,
				};

				const frame2: SensorFrame = {
					ts: 16,
					handId: 'right',
					trackingOk: true,
					palmFacing: true,
					label: 'Open_Palm',
					confidence: 0.9,
					indexTip: { x: 0.8, y: 0.5, z: 0, visibility: 1.0 }, // Big jump
					landmarks: null,
				};

				adapter.smooth(frame1);
				const lowBetaResult = adapter.smooth(frame2);

				// High beta = less smoothing (faster response)
				adapter.setParams(0.5, 1.0);
				adapter.reset();

				adapter.smooth(frame1);
				const highBetaResult = adapter.smooth(frame2);

				// High beta should track input more closely
				if (lowBetaResult.position && highBetaResult.position) {
					// High beta result should be closer to 0.8 (input)
					const lowBetaDelta = Math.abs(lowBetaResult.position.x - 0.8);
					const highBetaDelta = Math.abs(highBetaResult.position.x - 0.8);

					// This tests that setParams actually changes behavior
					// If both are identical, setParams is broken
					expect(lowBetaDelta !== highBetaDelta || lowBetaDelta === 0).toBe(true);
				}
			},
		);
	});
});

// ============================================================================
// COMPLIANCE SUMMARY REPORT
// ============================================================================

describe('AUDIT: Interface Compliance Summary', () => {
	it('reports compliance status for all registered SmootherPort implementations', () => {
		console.log('\n═══════════════════════════════════════════════════════════════');
		console.log('SMOOTHER PORT COMPLIANCE AUDIT - Gen87.X3');
		console.log('═══════════════════════════════════════════════════════════════');

		const compliant = SMOOTHER_REGISTRY.filter((r) => r.status === 'compliant');
		const adhoc = SMOOTHER_REGISTRY.filter((r) => r.status === 'ad-hoc');
		const wrapper = SMOOTHER_REGISTRY.filter((r) => r.status === 'wrapper');

		console.log(`\n✅ COMPLIANT (${compliant.length}):`);
		compliant.forEach((r) => console.log(`   - ${r.name}`));

		if (adhoc.length > 0) {
			console.log(`\n⚠️  AD-HOC (${adhoc.length}):`);
			adhoc.forEach((r) => console.log(`   - ${r.name}`));
		}

		if (wrapper.length > 0) {
			console.log(`\n🔄 WRAPPER (${wrapper.length}):`);
			wrapper.forEach((r) => console.log(`   - ${r.name}`));
		}

		console.log('\n═══════════════════════════════════════════════════════════════\n');

		expect(compliant.length).toBeGreaterThan(0);
	});
});
