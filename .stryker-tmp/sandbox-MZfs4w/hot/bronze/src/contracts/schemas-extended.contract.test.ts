// @ts-nocheck
import * as fc from 'fast-check';
/**
 * Schemas Extended Contract Tests - Mutation Testing Defense
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Red Regnant (Port 4) + Pyre Praetorian (Port 5)
 *
 * ANTI-REWARD-HACK: Property-based tests that KILL mutants
 * Grounded: W3C Pointer Events, Kalman Filter specs via Tavily 2025-12-31
 */
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_GESTURE_BINDINGS,
	GestureBindingSchema,
	LayoutActionSchema,
	LayoutActionTypeSchema,
	Position3DSchema,
	PredictionSchema,
	PredictorConfigSchema,
	TargetDefinitionSchema,
	TargetTypeSchema,
	Velocity3DSchema,
} from './schemas-extended.js';

// ============================================================================
// POSITION/VELOCITY SCHEMAS
// ============================================================================

describe('Position3DSchema', () => {
	it('should accept valid 3D positions', () => {
		fc.assert(
			fc.property(
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				(x, y, z) => {
					const result = Position3DSchema.safeParse({ x, y, z });
					expect(result.success).toBe(true);
				},
			),
			{ numRuns: 100 },
		);
	});

	it('should reject missing x', () => {
		expect(() => Position3DSchema.parse({ y: 0, z: 0 })).toThrow();
	});

	it('should reject missing y', () => {
		expect(() => Position3DSchema.parse({ x: 0, z: 0 })).toThrow();
	});

	it('should reject missing z', () => {
		expect(() => Position3DSchema.parse({ x: 0, y: 0 })).toThrow();
	});

	it('should reject NaN values', () => {
		expect(() => Position3DSchema.parse({ x: Number.NaN, y: 0, z: 0 })).toThrow();
		expect(() => Position3DSchema.parse({ x: 0, y: Number.NaN, z: 0 })).toThrow();
		expect(() => Position3DSchema.parse({ x: 0, y: 0, z: Number.NaN })).toThrow();
	});
});

describe('Velocity3DSchema', () => {
	it('should accept any finite velocity', () => {
		fc.assert(
			fc.property(
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				fc.float({ noNaN: true }),
				(x, y, z) => {
					const result = Velocity3DSchema.safeParse({ x, y, z });
					expect(result.success).toBe(true);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// PREDICTION SCHEMA (Stage 3 output)
// ============================================================================

describe('PredictionSchema', () => {
	const validPrediction = {
		x: 0.5,
		y: 0.5,
		z: 0.1,
		velocity: { x: 0.01, y: -0.02, z: 0 },
		confidence: 0.95,
		lookAheadMs: 16,
	};

	it('should accept valid prediction', () => {
		expect(() => PredictionSchema.parse(validPrediction)).not.toThrow();
	});

	describe('confidence constraints', () => {
		it('should accept confidence 0-1', () => {
			fc.assert(
				fc.property(fc.float({ min: 0, max: 1, noNaN: true }), (confidence) => {
					const result = PredictionSchema.safeParse({ ...validPrediction, confidence });
					expect(result.success).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});

		it('should reject confidence < 0', () => {
			expect(() => PredictionSchema.parse({ ...validPrediction, confidence: -0.1 })).toThrow();
		});

		it('should reject confidence > 1', () => {
			expect(() => PredictionSchema.parse({ ...validPrediction, confidence: 1.1 })).toThrow();
		});

		// MUTANT KILLER: boundary test
		it('confidence boundary - mutant killer', () => {
			fc.assert(
				fc.property(fc.float({ min: -10, max: 10, noNaN: true }), (confidence) => {
					const result = PredictionSchema.safeParse({ ...validPrediction, confidence });
					if (confidence >= 0 && confidence <= 1) {
						expect(result.success).toBe(true);
					} else {
						expect(result.success).toBe(false);
					}
				}),
				{ numRuns: 1000 },
			);
		});
	});

	describe('lookAheadMs constraints', () => {
		it('should accept positive lookAheadMs', () => {
			fc.assert(
				fc.property(fc.integer({ min: 1, max: 1000 }), (lookAheadMs) => {
					const result = PredictionSchema.safeParse({ ...validPrediction, lookAheadMs });
					expect(result.success).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});

		it('should reject lookAheadMs <= 0', () => {
			expect(() => PredictionSchema.parse({ ...validPrediction, lookAheadMs: 0 })).toThrow();
			expect(() => PredictionSchema.parse({ ...validPrediction, lookAheadMs: -16 })).toThrow();
		});

		// MUTANT KILLER: positive constraint
		it('lookAheadMs positive - mutant killer', () => {
			fc.assert(
				fc.property(fc.float({ min: -100, max: 100, noNaN: true }), (lookAheadMs) => {
					const result = PredictionSchema.safeParse({ ...validPrediction, lookAheadMs });
					if (lookAheadMs > 0) {
						expect(result.success).toBe(true);
					} else {
						expect(result.success).toBe(false);
					}
				}),
				{ numRuns: 1000 },
			);
		});
	});
});

// ============================================================================
// PREDICTOR CONFIG SCHEMA
// ============================================================================

describe('PredictorConfigSchema', () => {
	it('should accept valid predictor algorithms', () => {
		const algorithms = ['kalman', 'rapier', 'spring-damper', 'none'] as const;
		for (const algorithm of algorithms) {
			expect(() => PredictorConfigSchema.parse({ algorithm })).not.toThrow();
		}
	});

	it('should reject invalid algorithm', () => {
		expect(() => PredictorConfigSchema.parse({ algorithm: 'invalid' })).toThrow();
		expect(() => PredictorConfigSchema.parse({ algorithm: '' })).toThrow();
	});

	it('should default lookAheadMs to 16', () => {
		const result = PredictorConfigSchema.parse({ algorithm: 'kalman' });
		expect(result.lookAheadMs).toBe(16);
	});

	it('should accept Kalman params', () => {
		const config = {
			algorithm: 'kalman' as const,
			params: {
				processNoise: 0.1,
				measurementNoise: 0.05,
			},
		};
		expect(() => PredictorConfigSchema.parse(config)).not.toThrow();
	});

	it('should accept spring-damper params', () => {
		const config = {
			algorithm: 'spring-damper' as const,
			params: {
				mass: 1.0,
				stiffness: 100,
				damping: 10,
			},
		};
		expect(() => PredictorConfigSchema.parse(config)).not.toThrow();
	});
});

// ============================================================================
// TARGET ROUTER SCHEMAS (Stage 6)
// ============================================================================

describe('TargetTypeSchema', () => {
	it('should accept all valid target types', () => {
		const types = ['dom', 'canvas', 'iframe', 'golden-layout', 'nats', 'webxr'];
		for (const type of types) {
			expect(() => TargetTypeSchema.parse(type)).not.toThrow();
		}
	});

	it('should reject invalid target types', () => {
		expect(() => TargetTypeSchema.parse('window')).toThrow();
		expect(() => TargetTypeSchema.parse('')).toThrow();
		expect(() => TargetTypeSchema.parse('DOM')).toThrow(); // case sensitive
	});
});

describe('TargetDefinitionSchema', () => {
	const validTarget = {
		id: 'main-canvas',
		type: 'canvas' as const,
	};

	it('should accept minimal target definition', () => {
		expect(() => TargetDefinitionSchema.parse(validTarget)).not.toThrow();
	});

	it('should accept full target definition', () => {
		const fullTarget = {
			...validTarget,
			bounds: { x: 0, y: 0, width: 800, height: 600 },
			priority: 10,
			enabled: true,
			natsSubject: 'hfo.gen87.target.main',
		};
		expect(() => TargetDefinitionSchema.parse(fullTarget)).not.toThrow();
	});

	it('should default priority to 0', () => {
		const result = TargetDefinitionSchema.parse(validTarget);
		expect(result.priority).toBe(0);
	});

	it('should default enabled to true', () => {
		const result = TargetDefinitionSchema.parse(validTarget);
		expect(result.enabled).toBe(true);
	});

	it('should require id', () => {
		expect(() => TargetDefinitionSchema.parse({ type: 'canvas' })).toThrow();
	});

	it('should require type', () => {
		expect(() => TargetDefinitionSchema.parse({ id: 'test' })).toThrow();
	});
});

// ============================================================================
// LAYOUT ACTION SCHEMAS (Stage 7)
// ============================================================================

describe('LayoutActionTypeSchema', () => {
	const validTypes = [
		'focus',
		'split',
		'close',
		'maximize',
		'minimize',
		'move',
		'resize',
		'drag-start',
		'drag-move',
		'drag-end',
	];

	it('should accept all valid layout action types', () => {
		for (const type of validTypes) {
			expect(() => LayoutActionTypeSchema.parse(type)).not.toThrow();
		}
	});

	it('should reject invalid types', () => {
		expect(() => LayoutActionTypeSchema.parse('open')).toThrow();
		expect(() => LayoutActionTypeSchema.parse('')).toThrow();
	});
});

describe('LayoutActionSchema', () => {
	it('should accept focus action', () => {
		const action = { type: 'focus', targetId: 'panel-1' };
		expect(() => LayoutActionSchema.parse(action)).not.toThrow();
	});

	it('should accept move action with delta', () => {
		const action = {
			type: 'move',
			targetId: 'panel-1',
			delta: { x: 10, y: 20 },
		};
		expect(() => LayoutActionSchema.parse(action)).not.toThrow();
	});

	it('should accept resize action with size', () => {
		const action = {
			type: 'resize',
			targetId: 'panel-1',
			size: { width: 400, height: 300 },
		};
		expect(() => LayoutActionSchema.parse(action)).not.toThrow();
	});
});

// ============================================================================
// GESTURE BINDING SCHEMA
// ============================================================================

describe('GestureBindingSchema', () => {
	it('should accept valid gesture binding', () => {
		const binding = {
			gesture: 'pinch' as const,
			action: 'focus' as const,
		};
		expect(() => GestureBindingSchema.parse(binding)).not.toThrow();
	});

	it('should require gesture from GestureTypeSchema', () => {
		expect(() =>
			GestureBindingSchema.parse({
				gesture: 'Invalid_Gesture',
				action: 'focus',
			}),
		).toThrow();
	});

	it('should accept valid modifier', () => {
		const binding = {
			gesture: 'pinch' as const,
			modifier: 'throw-left' as const,
			action: 'split' as const,
		};
		expect(() => GestureBindingSchema.parse(binding)).not.toThrow();
	});
});

describe('DEFAULT_GESTURE_BINDINGS', () => {
	it('should have at least 3 bindings', () => {
		expect(DEFAULT_GESTURE_BINDINGS.length).toBeGreaterThanOrEqual(3);
	});

	it('should all be valid GestureBindings', () => {
		for (const binding of DEFAULT_GESTURE_BINDINGS) {
			expect(() => GestureBindingSchema.parse(binding)).not.toThrow();
		}
	});

	it('should include pinch binding', () => {
		const pinch = DEFAULT_GESTURE_BINDINGS.find((b) => b.gesture === 'pinch');
		expect(pinch).toBeDefined();
	});
});

// ============================================================================
// PROPERTY-BASED MUTATION DEFENSE
// ============================================================================

describe('Mutation Defense - Property Tests', () => {
	it('confidence [0,1] boundary - mutant killer', () => {
		const schema = PredictionSchema.shape.confidence;

		fc.assert(
			fc.property(fc.float({ min: -10, max: 10, noNaN: true }), (val) => {
				const result = schema.safeParse(val);
				if (val >= 0 && val <= 1) {
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			}),
			{ numRuns: 1000 },
		);
	});

	it('lookAheadMs positive - mutant killer', () => {
		const schema = PredictionSchema.shape.lookAheadMs;

		fc.assert(
			fc.property(fc.float({ min: -100, max: 100, noNaN: true }), (val) => {
				const result = schema.safeParse(val);
				if (val > 0) {
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			}),
			{ numRuns: 1000 },
		);
	});

	it('all predictor algorithms exhaustive', () => {
		const validAlgorithms = new Set(['kalman', 'rapier', 'spring-damper', 'none']);
		const randomStrings = ['invalid', 'KALMAN', 'Kalman', '', 'filter', 'prediction'];

		for (const alg of randomStrings) {
			const result = PredictorConfigSchema.safeParse({ algorithm: alg });
			expect(result.success).toBe(validAlgorithms.has(alg));
		}
	});

	it('target types exhaustive - mutant killer', () => {
		const validTypes = new Set(['dom', 'canvas', 'iframe', 'golden-layout', 'nats', 'webxr']);
		const testStrings = [...validTypes, 'window', 'element', 'DOM', 'Canvas', '', 'invalid'];

		for (const type of testStrings) {
			const result = TargetTypeSchema.safeParse(type);
			expect(result.success).toBe(validTypes.has(type));
		}
	});
});
