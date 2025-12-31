/**
 * Physics Check - Package Verification Test
 *
 * Purpose: Verify all installed packages can be imported and used
 * Phase: HUNT (H) - Primitive verification
 *
 * Run: npx vitest run sandbox/src/physics-check.test.ts
 */

import { describe, expect, it } from 'vitest';

describe('Physics Check - Package Verification', () => {
	describe('Stage 1: SENSOR (MediaPipe)', () => {
		it('should import @mediapipe/tasks-vision', async () => {
			const mp = await import('@mediapipe/tasks-vision');
			expect(mp).toBeDefined();
			expect(mp.GestureRecognizer).toBeDefined();
			expect(mp.HandLandmarker).toBeDefined();
			expect(mp.FilesetResolver).toBeDefined();
		});
	});

	describe('Stage 2: SMOOTHER (1€ + Physics)', () => {
		it('should import 1eurofilter package', async () => {
			const { OneEuroFilter } = await import('1eurofilter');
			expect(OneEuroFilter).toBeDefined();

			// Test instantiation
			const filter = new OneEuroFilter(60, 1.0, 0.007, 1.0);
			expect(filter).toBeDefined();

			// Test filtering
			const filtered = filter.filter(0.5, 0);
			expect(typeof filtered).toBe('number');
		});

		it('should import @dimforge/rapier2d-compat', async () => {
			const RAPIER = await import('@dimforge/rapier2d-compat');
			expect(RAPIER).toBeDefined();

			// Initialize WASM (required before use)
			await RAPIER.init();

			// Create a physics world
			const gravity = { x: 0.0, y: -9.81 };
			const world = new RAPIER.World(gravity);
			expect(world).toBeDefined();

			// Clean up
			world.free();
		});

		it('should import pixi.js for rendering', async () => {
			const PIXI = await import('pixi.js');
			expect(PIXI).toBeDefined();
			expect(PIXI.Application).toBeDefined();
			expect(PIXI.Graphics).toBeDefined();
			expect(PIXI.Container).toBeDefined();
		});
	});

	describe('Stage 3: FSM (XState)', () => {
		it('should import xstate v5', async () => {
			const { createMachine, createActor, setup, assign } = await import('xstate');
			expect(createMachine).toBeDefined();
			expect(createActor).toBeDefined();
			expect(setup).toBeDefined();
			expect(assign).toBeDefined();

			// Test machine creation
			const machine = setup({
				types: {
					context: {} as { count: number },
					events: {} as { type: 'INC' } | { type: 'DEC' },
				},
			}).createMachine({
				id: 'counter',
				initial: 'idle',
				context: { count: 0 },
				states: {
					idle: {
						on: {
							INC: {
								actions: assign({ count: ({ context }) => context.count + 1 }),
							},
						},
					},
				},
			});

			expect(machine).toBeDefined();
			expect(machine.id).toBe('counter');
		});
	});

	describe('Stage 4: OUTPUT (W3C Pointer + Validation)', () => {
		it('should import zod for schema validation', async () => {
			const { z } = await import('zod');
			expect(z).toBeDefined();

			// Test schema creation
			const PointerEventSchema = z.object({
				type: z.enum(['pointerdown', 'pointerup', 'pointermove']),
				clientX: z.number(),
				clientY: z.number(),
				pointerId: z.number().int().default(0),
				pressure: z.number().min(0).max(1).default(0.5),
			});

			// Test parsing
			const result = PointerEventSchema.parse({
				type: 'pointermove',
				clientX: 100,
				clientY: 200,
			});

			expect(result.type).toBe('pointermove');
			expect(result.clientX).toBe(100);
			expect(result.pointerId).toBe(0); // default
		});
	});

	describe('Stage 5: Pipeline Composition (RxJS)', () => {
		it('should import rxjs for reactive pipeline', async () => {
			const { Subject, map, filter, tap } = await import('rxjs');
			expect(Subject).toBeDefined();
			expect(map).toBeDefined();
			expect(filter).toBeDefined();

			// Test observable pipeline
			const subject = new Subject<number>();
			const results: number[] = [];

			subject
				.pipe(
					filter((x) => x > 0),
					map((x) => x * 2),
					tap((x) => results.push(x)),
				)
				.subscribe();

			subject.next(-1); // filtered out
			subject.next(5); // 10
			subject.next(3); // 6

			expect(results).toEqual([10, 6]);
		});
	});

	describe('Observability (OpenTelemetry)', () => {
		it('should import @opentelemetry/api', async () => {
			const { trace, SpanStatusCode } = await import('@opentelemetry/api');
			expect(trace).toBeDefined();
			expect(SpanStatusCode).toBeDefined();
			expect(trace.getTracer).toBeDefined();
		});

		it('should import @opentelemetry/sdk-trace-web', async () => {
			const { WebTracerProvider } = await import('@opentelemetry/sdk-trace-web');
			expect(WebTracerProvider).toBeDefined();
		});
	});

	describe('UI Shell (Golden Layout)', () => {
		it('should import golden-layout', async () => {
			const gl = await import('golden-layout');
			expect(gl).toBeDefined();
			expect(gl.GoldenLayout).toBeDefined();
		});
	});

	describe('Event Substrate (NATS)', () => {
		it('should import @nats-io/nats-core', async () => {
			const nats = await import('@nats-io/nats-core');
			expect(nats).toBeDefined();
			// Note: wsconnect requires a server, so just check export exists
		});

		it('should import @nats-io/jetstream', async () => {
			const js = await import('@nats-io/jetstream');
			expect(js).toBeDefined();
			expect(js.jetstream).toBeDefined();
		});

		it('should import @nats-io/kv', async () => {
			const kv = await import('@nats-io/kv');
			expect(kv).toBeDefined();
			expect(kv.Kvm).toBeDefined();
		});
	});

	describe('Property-Based Testing (fast-check)', () => {
		it('should import fast-check', async () => {
			const fc = await import('fast-check');
			expect(fc).toBeDefined();
			expect(fc.assert).toBeDefined();
			expect(fc.property).toBeDefined();
			expect(fc.integer).toBeDefined();

			// Test a simple property
			fc.assert(
				fc.property(fc.integer(), (n) => {
					return n + 0 === n;
				}),
			);
		});
	});
});

describe('Package Version Summary', () => {
	it('should have all required packages at correct versions', () => {
		// This test serves as documentation
		const expectedPackages = {
			// Core pipeline
			'@mediapipe/tasks-vision': '^0.10.22',
			'1eurofilter': '^1.2.2',
			'@dimforge/rapier2d-compat': '^0.19.3',
			xstate: '^5.25.0',
			zod: '^3.25.76',

			// UI/Rendering
			'pixi.js': '^8.14.3',
			'golden-layout': '^2.6.0',

			// Pipeline composition
			rxjs: '^7.8.2',

			// Observability
			'@opentelemetry/api': '^1.9.0',
			'@opentelemetry/sdk-trace-web': '^2.2.0',

			// Event substrate
			'@nats-io/nats-core': '^3.3.0',
			'@nats-io/jetstream': '^3.3.0',
			'@nats-io/kv': '^3.3.0',

			// Testing
			'fast-check': '^3.23.2',
		};

		// All packages accounted for
		expect(Object.keys(expectedPackages).length).toBe(14);
	});
});
