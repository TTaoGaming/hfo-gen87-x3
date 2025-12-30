import * as fc from 'fast-check';
/**
 * CDD Port Contract Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * These tests validate the port contracts using property-based testing.
 * PRINCIPLE: Schema roundtrip - parse(generate(schema)) must succeed.
 */
import { describe, expect, it } from 'vitest';
import { OneEuroAdapter, PassthroughSmootherAdapter } from '../adapters/one-euro.adapter.js';
import { PointerEventAdapter } from '../adapters/pointer-event.adapter.js';
import type { AdapterTarget } from '../contracts/schemas.js';
import {
	FSMActionSchema,
	FSMStates,
	GestureLabels,
	PointerEventOutSchema,
	type SensorFrame,
	SensorFrameSchema,
	type SmoothedFrame,
	SmoothedFrameSchema,
} from '../contracts/schemas.js';

// ============================================================================
// ARBITRARIES (Generators for property-based tests)
// ============================================================================

const normalizedLandmarkArb = fc.record({
	x: fc.float({ min: 0, max: 1, noNaN: true }),
	y: fc.float({ min: 0, max: 1, noNaN: true }),
	z: fc.float({ noNaN: true }),
	visibility: fc.option(fc.float({ min: 0, max: 1, noNaN: true })),
});

const sensorFrameArb = fc.record({
	ts: fc.nat(),
	handId: fc.constantFrom('left', 'right', 'none') as fc.Arbitrary<'left' | 'right' | 'none'>,
	trackingOk: fc.boolean(),
	palmFacing: fc.boolean(),
	label: fc.constantFrom(...GestureLabels),
	confidence: fc.float({ min: 0, max: 1, noNaN: true }),
	indexTip: fc.option(normalizedLandmarkArb),
	landmarks: fc.option(fc.array(normalizedLandmarkArb, { minLength: 21, maxLength: 21 })),
});

const fsmActionArb = fc.oneof(
	fc.record({ action: fc.constant('none' as const), state: fc.constantFrom(...FSMStates) }),
	fc.record({
		action: fc.constant('move' as const),
		state: fc.constantFrom(...FSMStates),
		x: fc.float({ noNaN: true }),
		y: fc.float({ noNaN: true }),
	}),
	fc.record({
		action: fc.constant('down' as const),
		state: fc.constantFrom(...FSMStates),
		x: fc.float({ noNaN: true }),
		y: fc.float({ noNaN: true }),
		button: fc.constantFrom(0, 1) as fc.Arbitrary<0 | 1>,
	}),
	fc.record({
		action: fc.constant('up' as const),
		state: fc.constantFrom(...FSMStates),
		x: fc.float({ noNaN: true }),
		y: fc.float({ noNaN: true }),
		button: fc.constantFrom(0, 1) as fc.Arbitrary<0 | 1>,
	}),
	fc.record({ action: fc.constant('cancel' as const), state: fc.constantFrom(...FSMStates) }),
	fc.record({
		action: fc.constant('wheel' as const),
		state: fc.constantFrom(...FSMStates),
		deltaY: fc.float({ noNaN: true }),
		ctrl: fc.option(fc.boolean()),
	}),
);

// ============================================================================
// SCHEMA ROUNDTRIP TESTS (REQ-PBT-002)
// ============================================================================

describe('Schema Roundtrip Tests', () => {
	it('SensorFrameSchema: parse(valid) succeeds', () => {
		fc.assert(
			fc.property(sensorFrameArb, (frame) => {
				const parsed = SensorFrameSchema.safeParse(frame);
				expect(parsed.success).toBe(true);
			}),
			{ numRuns: 100 },
		);
	});

	it('FSMActionSchema: parse(valid) succeeds', () => {
		fc.assert(
			fc.property(fsmActionArb, (action) => {
				const parsed = FSMActionSchema.safeParse(action);
				expect(parsed.success).toBe(true);
			}),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// SMOOTHER PORT TESTS (REQ-PORT-002)
// ============================================================================

describe('SmootherPort Contract', () => {
	it('smooth() returns valid SmoothedFrame', () => {
		const adapter = new OneEuroAdapter();

		fc.assert(
			fc.property(sensorFrameArb, (frame) => {
				const result = adapter.smooth(frame as SensorFrame);
				const parsed = SmoothedFrameSchema.safeParse(result);
				expect(parsed.success).toBe(true);
			}),
			{ numRuns: 100 },
		);
	});

	it('smooth() preserves trackingOk=false → position=null', () => {
		const adapter = new PassthroughSmootherAdapter();

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

		const result = adapter.smooth(frame);
		expect(result.trackingOk).toBe(false);
		expect(result.position).toBeNull();
	});

	it('smooth() output position stays in [0,1] range (REQ-PBT-003)', () => {
		const adapter = new OneEuroAdapter(1.0, 0.007);

		fc.assert(
			fc.property(fc.array(sensorFrameArb, { minLength: 1, maxLength: 50 }), (frames) => {
				adapter.reset();
				for (const frame of frames) {
					const result = adapter.smooth(frame as SensorFrame);
					if (result.position) {
						expect(result.position.x).toBeGreaterThanOrEqual(0);
						expect(result.position.x).toBeLessThanOrEqual(1);
						expect(result.position.y).toBeGreaterThanOrEqual(0);
						expect(result.position.y).toBeLessThanOrEqual(1);
					}
				}
			}),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// EMITTER PORT TESTS (REQ-PORT-004)
// ============================================================================

describe('EmitterPort Contract', () => {
	const target: AdapterTarget = {
		type: 'element',
		bounds: { width: 800, height: 600, left: 0, top: 0 },
	};

	it('emit() returns valid PointerEventOut or null', () => {
		const adapter = new PointerEventAdapter();

		fc.assert(
			fc.property(fsmActionArb, (action) => {
				const result = adapter.emit(action, target);
				if (result !== null) {
					const parsed = PointerEventOutSchema.safeParse(result);
					expect(parsed.success).toBe(true);
				}
			}),
			{ numRuns: 100 },
		);
	});

	it('emit() converts normalized coords to client coords', () => {
		const adapter = new PointerEventAdapter();

		const action = {
			action: 'move' as const,
			state: 'ARMED' as const,
			x: 0.5,
			y: 0.5,
		};

		const result = adapter.emit(action, target);
		expect(result).not.toBeNull();
		if (result && 'clientX' in result) {
			expect(result.clientX).toBe(400); // 0.5 * 800
			expect(result.clientY).toBe(300); // 0.5 * 600
		}
	});

	it('emit() returns null for action=none', () => {
		const adapter = new PointerEventAdapter();

		const action = { action: 'none' as const, state: 'DISARMED' as const };
		const result = adapter.emit(action, target);
		expect(result).toBeNull();
	});
});

// ============================================================================
// GATE VALIDATION TESTS (REQ-ZOD-002)
// ============================================================================

describe('Gate Validation (parse throws on invalid)', () => {
	it('SensorFrameSchema.parse throws on invalid label', () => {
		const invalid = {
			ts: 1000,
			handId: 'left',
			trackingOk: true,
			palmFacing: true,
			label: 'INVALID_GESTURE', // Not in GestureLabels
			confidence: 0.9,
			indexTip: { x: 0.5, y: 0.5, z: 0 },
			landmarks: null,
		};

		expect(() => SensorFrameSchema.parse(invalid)).toThrow();
	});

	it('SensorFrameSchema.parse throws on out-of-range confidence', () => {
		const invalid = {
			ts: 1000,
			handId: 'left',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 1.5, // Out of range
			indexTip: { x: 0.5, y: 0.5, z: 0 },
			landmarks: null,
		};

		expect(() => SensorFrameSchema.parse(invalid)).toThrow();
	});

	it('SmoothedFrameSchema.parse throws on out-of-range position', () => {
		const invalid = {
			ts: 1000,
			handId: 'left',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.9,
			position: { x: 1.5, y: 0.5 }, // x out of range
			velocity: { x: 0, y: 0 },
			prediction: { x: 0.5, y: 0.5 },
		};

		expect(() => SmoothedFrameSchema.parse(invalid)).toThrow();
	});
});

// ============================================================================
// TYPE INFERENCE TESTS (REQ-ZOD-003)
// ============================================================================

describe('Type Inference (z.infer alignment)', () => {
	it('SensorFrame type matches schema', () => {
		const frame: SensorFrame = {
			ts: 1000,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			indexTip: { x: 0.5, y: 0.5, z: -0.1 },
			landmarks: null,
		};

		// This compiles if types are correct
		const parsed = SensorFrameSchema.parse(frame);
		expect(parsed.label).toBe('Open_Palm');
	});

	it('SmoothedFrame type matches schema', () => {
		const frame: SmoothedFrame = {
			ts: 1000,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			position: { x: 0.5, y: 0.5 },
			velocity: { x: 0.01, y: -0.02 },
			prediction: { x: 0.51, y: 0.48 },
		};

		// This compiles if types are correct
		const parsed = SmoothedFrameSchema.parse(frame);
		expect(parsed.position?.x).toBe(0.5);
	});
});
