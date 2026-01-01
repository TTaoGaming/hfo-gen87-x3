/**
 * POLYMORPHIC COMPOSITION CONSTRAINTS
 *
 * Gen87.X3.2 | Phase: VALIDATE (V) | CDD + Property Testing
 *
 * These are MACHINE-ENFORCEABLE CONSTRAINTS, not documentation.
 * If these tests fail, the system is NOT truly polymorphic.
 *
 * RULES:
 * 1. NO MOCKS - Use real adapters only
 * 2. NO THEATER - Every assertion must be mutation-killable
 * 3. CONTRACTS - Use Zod schemas to validate all I/O
 * 4. PROPERTIES - Use fast-check for invariant testing
 *
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

// ============================================================================
// CONSTRAINT 1: Port Interface Contracts
// All adapters must implement their port interfaces EXACTLY
// ============================================================================

describe('CONSTRAINT: Port Interface Compliance', () => {
	describe('SensorPort Contract', () => {
		it('MediaPipeAdapter MUST implement SensorPort interface', async () => {
			// This constraint will FAIL if MediaPipeAdapter doesn't exist or has wrong shape
			const { MediaPipeAdapter } = await import('../adapters/mediapipe.adapter.js');
			const adapter = new MediaPipeAdapter();

			// Check interface shape (compile-time + runtime)
			expect(typeof adapter.initialize).toBe('function');
			expect(typeof adapter.sense).toBe('function');
			expect(typeof adapter.dispose).toBe('function');
			expect('isReady' in adapter).toBe(true);
		});
	});

	describe('SmootherPort Contract', () => {
		it('OneEuroAdapter MUST implement SmootherPort interface', async () => {
			const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');
			const adapter = new OneEuroExemplarAdapter();

			expect(typeof adapter.smooth).toBe('function');
			expect(typeof adapter.reset).toBe('function');
			expect(typeof adapter.setParams).toBe('function');
		});

		it('RapierPhysicsAdapter MUST implement SmootherPort interface', async () => {
			const { RapierPhysicsAdapter } = await import('../adapters/rapier-physics.adapter.js');
			const adapter = new RapierPhysicsAdapter();

			expect(typeof adapter.smooth).toBe('function');
			expect(typeof adapter.reset).toBe('function');
			expect(typeof adapter.setParams).toBe('function');
		});

		it('PROPERTY: Any SmootherPort implementation is interchangeable', async () => {
			const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');
			const { RapierPhysicsAdapter } = await import('../adapters/rapier-physics.adapter.js');

			// Input schema (what SmootherPort.smooth() accepts)
			// Use VALID indexTip (not null) to test the filtering behavior
			const SensorFrameWithIndexTip = fc.record({
				ts: fc.nat(),
				handId: fc.constantFrom('left', 'right', 'none'),
				trackingOk: fc.constant(true),
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
				),
				confidence: fc.double({ min: 0, max: 1 }),
				indexTip: fc.record({
					x: fc.double({ min: 0, max: 1, noNaN: true }),
					y: fc.double({ min: 0, max: 1, noNaN: true }),
				}),
				landmarks: fc.constant(null),
			});

			// Output schema (what SmootherPort.smooth() must return)
			const SmoothedFrameSchema = z.object({
				ts: z.number(),
				handId: z.enum(['left', 'right', 'none']),
				trackingOk: z.boolean(),
				palmFacing: z.boolean(),
				label: z.string(),
				confidence: z.number().min(0).max(1),
				position: z
					.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
					.nullable(),
				velocity: z.object({ x: z.number(), y: z.number() }).nullable(),
				prediction: z.object({ x: z.number(), y: z.number() }).nullable(),
			});

			const oneEuro = new OneEuroExemplarAdapter();
			const rapier = new RapierPhysicsAdapter();
			await rapier.init();

				// PROPERTY: Both adapters produce valid SmoothedFrame for any valid SensorFrame
			fc.assert(
				fc.property(SensorFrameWithIndexTip, (frame) => {
					const oneEuroResult = oneEuro.smooth(frame as any);
					const rapierResult = rapier.smooth(frame as any);

					// Both must produce valid output
					const oneEuroValid = SmoothedFrameSchema.safeParse(oneEuroResult);
					const rapierValid = SmoothedFrameSchema.safeParse(rapierResult);

					// Log failures for debugging
					if (!oneEuroValid.success) {
						console.log('OneEuro failed for frame:', JSON.stringify(frame));
						console.log('OneEuro result:', JSON.stringify(oneEuroResult));
						console.log('OneEuro errors:', oneEuroValid.error.issues);
					}
					if (!rapierValid.success) {
						console.log('Rapier failed for frame:', JSON.stringify(frame));
						console.log('Rapier result:', JSON.stringify(rapierResult));
						console.log('Rapier errors:', rapierValid.error.issues);
					}

					return oneEuroValid.success && rapierValid.success;
				}),
				{ numRuns: 100 },
			);
		});
	});

	describe('FSMPort Contract', () => {
		it('XStateFSMAdapter MUST implement FSMPort interface', async () => {
			const { XStateFSMAdapter } = await import('../adapters/xstate-fsm.adapter.js');
			const adapter = new XStateFSMAdapter();

			expect(typeof adapter.process).toBe('function');
			expect(typeof adapter.getState).toBe('function');
			expect(typeof adapter.disarm).toBe('function');
			expect(typeof adapter.subscribe).toBe('function');
		});
	});

	describe('UIShellPort Contract', () => {
		it('GoldenLayoutShellAdapter MUST implement UIShellPort interface', async () => {
			const { GoldenLayoutShellAdapter } = await import('../adapters/golden-layout-shell.adapter.js');
			const adapter = new GoldenLayoutShellAdapter();

			// Check all UIShellPort methods
			expect(typeof adapter.initialize).toBe('function');
			expect(typeof adapter.getTileTarget).toBe('function');
			expect(typeof adapter.getTileIds).toBe('function');
			expect(typeof adapter.addTile).toBe('function');
			expect(typeof adapter.removeTile).toBe('function');
			expect(typeof adapter.splitTile).toBe('function');
			expect(typeof adapter.getLayout).toBe('function');
			expect(typeof adapter.setLayout).toBe('function');
			expect(typeof adapter.onLayoutChange).toBe('function');
			expect(typeof adapter.onTileFocus).toBe('function');
			expect(typeof adapter.dispose).toBe('function');
		});
	});
});

// ============================================================================
// CONSTRAINT 2: Data Flow Composition
// Data MUST flow correctly through the pipeline
// ============================================================================

describe('CONSTRAINT: Pipeline Data Flow', () => {
	it('SensorFrame → SmootherPort → SmoothedFrame (REAL 1€ Filter)', async () => {
		const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');

		const smoother = new OneEuroExemplarAdapter({ minCutoff: 1.0, beta: 0.007 });

		// Real sensor frame data WITH indexTip
		const sensorFrame = {
			ts: 1000,
			handId: 'right' as const,
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm' as const,
			confidence: 0.95,
			indexTip: { x: 0.5, y: 0.5 },
			landmarks: null,
		};

		const smoothed = smoother.smooth(sensorFrame);

		// Validate output structure
		expect(smoothed).toHaveProperty('position');
		expect(smoothed).toHaveProperty('velocity');

		// Position should be non-null when indexTip is provided
		expect(smoothed.position).not.toBeNull();
		expect(smoothed.position!.x).toBeGreaterThanOrEqual(0);
		expect(smoothed.position!.x).toBeLessThanOrEqual(1);
		expect(smoothed.position!.y).toBeGreaterThanOrEqual(0);
		expect(smoothed.position!.y).toBeLessThanOrEqual(1);
	});

	it('SensorFrame with NULL indexTip → SmoothedFrame with NULL position', async () => {
		const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');

		const smoother = new OneEuroExemplarAdapter({ minCutoff: 1.0, beta: 0.007 });

		// Sensor frame WITHOUT indexTip (hand lost tracking)
		const sensorFrame = {
			ts: 1000,
			handId: 'none' as const,
			trackingOk: false,
			palmFacing: false,
			label: 'None' as const,
			confidence: 0,
			indexTip: null,
			landmarks: null,
		};

		const smoothed = smoother.smooth(sensorFrame);

		// When indexTip is null, position should be null (graceful degradation)
		expect(smoothed.position).toBeNull();
		expect(smoothed.velocity).toBeNull();
	});

	it('SensorFrame → SmootherPort → SmoothedFrame (REAL Rapier Physics)', async () => {
		const { RapierPhysicsAdapter } = await import('../adapters/rapier-physics.adapter.js');

		const smoother = new RapierPhysicsAdapter({ mode: 'smoothed', stiffness: 100, damping: 0.7 });
		await smoother.init();

		const sensorFrame = {
			ts: 1000,
			handId: 'right' as const,
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm' as const,
			confidence: 0.95,
			indexTip: { x: 0.5, y: 0.5 },
			landmarks: null,
		};

		const smoothed = smoother.smooth(sensorFrame);

		expect(smoothed).toHaveProperty('position');
		expect(smoothed).toHaveProperty('velocity');
		expect(typeof smoothed.position.x).toBe('number');
		expect(typeof smoothed.position.y).toBe('number');
	});

	it('PROPERTY: Smoother output is always bounded [0,1] for bounded input', async () => {
		const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');
		const smoother = new OneEuroExemplarAdapter();

		fc.assert(
			fc.property(
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.double({ min: 0, max: 1, noNaN: true }),
				fc.nat({ max: 100000 }),
				(x, y, ts) => {
					const frame = {
						ts,
						handId: 'right' as const,
						trackingOk: true,
						palmFacing: true,
						label: 'Open_Palm' as const,
						confidence: 0.9,
						indexTip: { x, y }, // ALWAYS provide indexTip for this test
						landmarks: null,
					};

					const result = smoother.smooth(frame);

					// Position should be non-null and bounded when indexTip is provided
					if (result.position === null) return false; // Fail if null when indexTip was provided

					return (
						result.position.x >= 0 &&
						result.position.x <= 1 &&
						result.position.y >= 0 &&
						result.position.y <= 1
					);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// CONSTRAINT 3: Adapter Swappability
// Any adapter implementing a port MUST be hot-swappable
// ============================================================================

describe('CONSTRAINT: Hot-Swappable Adapters', () => {
	it('Can swap 1€ filter for Rapier at runtime without breaking pipeline', async () => {
		const { OneEuroExemplarAdapter } = await import('../adapters/one-euro-exemplar.adapter.js');
		const { RapierPhysicsAdapter } = await import('../adapters/rapier-physics.adapter.js');

		let currentSmoother: { smooth: (f: any) => any; reset: () => void; setParams: (m: number, b: number) => void };

		// Start with 1€ filter
		currentSmoother = new OneEuroExemplarAdapter();

		const frame1 = {
			ts: 1000,
			handId: 'right' as const,
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm' as const,
			confidence: 0.9,
			indexTip: { x: 0.3, y: 0.3 },
			landmarks: null,
		};

		const result1 = currentSmoother.smooth(frame1);
		expect(result1).toHaveProperty('position');

		// Hot-swap to Rapier
		const rapier = new RapierPhysicsAdapter({ mode: 'smoothed' });
		await rapier.init();
		currentSmoother = rapier;

		const frame2 = {
			ts: 2000,
			handId: 'right' as const,
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm' as const,
			confidence: 0.9,
			indexTip: { x: 0.7, y: 0.7 },
			landmarks: null,
		};

		const result2 = currentSmoother.smooth(frame2);
		expect(result2).toHaveProperty('position');

		// Both results should be valid SmoothedFrame
		expect(result1.position).toBeDefined();
		expect(result2.position).toBeDefined();
	});
});

// ============================================================================
// CONSTRAINT 4: Factory Composition (PortFactory)
// PortFactory MUST wire all ports correctly
// ============================================================================

describe('CONSTRAINT: PortFactory Wiring', () => {
	it('HFOPortFactory creates all port types', async () => {
		const { HFOPortFactory } = await import('../adapters/port-factory.js');

		const factory = new HFOPortFactory({
			smoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 },
			shell: { type: 'raw' },
		});

		// Factory should expose all port getters
		expect(typeof factory.createSmoother).toBe('function');
		expect(typeof factory.createShell).toBe('function');
	});

	it.todo('HFOPortFactory produces composable pipeline', async () => {
		// TODO: This test documents what SHOULD work but likely DOESN'T
		// When this passes without mocks, composition is truly working
	});
});

// ============================================================================
// CONSTRAINT 5: End-to-End Composition (THE GOAL)
// This is the ULTIMATE constraint - if this passes, we have polymorphism
// ============================================================================

describe('CONSTRAINT: End-to-End Polymorphic Composition', () => {
	it.todo('MediaPipe → 1€ Filter → XState FSM → GoldenLayout COMPOSES', async () => {
		// This is the constraint the user asked about:
		// "Can I just take MediaPipe and put it inside GoldenLayout right now?"
		//
		// When this test passes WITHOUT MOCKS, the answer is YES.
		// Until then, the answer is NO.
		//
		// TODO: Implement this when all adapters are properly wired
	});

	it.todo('Swap 1€ for Rapier in live GoldenLayout tile', async () => {
		// Hot-swap constraint: Runtime adapter replacement must work
	});

	it.todo('Add new tile with different smoother config', async () => {
		// Multi-tile constraint: Each tile can have independent pipeline
	});
});
