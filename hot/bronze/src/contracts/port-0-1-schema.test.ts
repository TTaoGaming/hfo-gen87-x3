import * as fc from 'fast-check';
/**
 * Port 0 (Lidless Legion) + Port 1 (Web Weaver) Schema Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V)
 *
 * Tests for:
 * - Port 0 sensing schemas (camera, MediaPipe, landmarks, gestures)
 * - Port 1 validation utilities (valguards, registry, composition)
 */
import { describe, expect, it } from 'vitest';
import { RED_REGNANT_PROPERTY_RUNS } from '../../quarantine/shared/test-budget.js';

// Port 0 imports
import {
	CameraConstraintsSchema,
	GestureLabels,
	HandLandmarkIndex,
	HandLandmarksSchema,
	MediaPipeConfigSchema,
	NormalizedLandmarkSchema,
	PORT_0_METADATA,
	SensorFrameSchema,
	VideoFrameSchema,
	isGestureLabel,
	isNormalizedLandmark,
	isSensorFrame,
} from './port-0-lidless-legion.js';

// Port 1 imports
import {
	PORT_1_METADATA,
	SCHEMA_REGISTRY,
	composeSchemas,
	createStrictValguard,
	createValguard,
	getPortSchemas,
	validateCameraConstraints,
	validatePortInput,
	validateSensorFrame,
} from './port-1-web-weaver.js';

// ============================================================================
// PORT 0: LIDLESS LEGION (SENSE) TESTS
// ============================================================================

describe('Port 0: Lidless Legion (SENSE)', () => {
	describe('PORT_0_METADATA', () => {
		it('has correct port number and trigram', () => {
			expect(PORT_0_METADATA.port).toBe(0);
			expect(PORT_0_METADATA.binary).toBe('000');
			expect(PORT_0_METADATA.trigram).toBe('☷');
			expect(PORT_0_METADATA.verb).toBe('SENSE');
		});

		it('mantra contains verb twice (self-reference)', () => {
			const verb = PORT_0_METADATA.verb;
			const mantaVerbCount = (PORT_0_METADATA.mantra.match(new RegExp(verb, 'g')) || []).length;
			expect(mantaVerbCount).toBe(2);
		});
	});

	describe('CameraConstraintsSchema', () => {
		it('accepts valid camera constraints', () => {
			const constraints = {
				width: 1920,
				height: 1080,
				frameRate: 60,
				facingMode: 'user',
			};
			expect(CameraConstraintsSchema.safeParse(constraints).success).toBe(true);
		});

		it('accepts constraint ranges', () => {
			const constraints = {
				width: { ideal: 1920, min: 1280, max: 3840 },
				frameRate: { ideal: 60, min: 30 },
			};
			expect(CameraConstraintsSchema.safeParse(constraints).success).toBe(true);
		});

		it('accepts empty constraints', () => {
			expect(CameraConstraintsSchema.safeParse({}).success).toBe(true);
		});
	});

	describe('VideoFrameSchema', () => {
		it('accepts valid video frame', () => {
			const frame = { timestamp: 1234.5, width: 1920, height: 1080 };
			expect(VideoFrameSchema.safeParse(frame).success).toBe(true);
		});

		it('rejects negative timestamp', () => {
			const frame = { timestamp: -1, width: 1920, height: 1080 };
			expect(VideoFrameSchema.safeParse(frame).success).toBe(false);
		});

		it('rejects zero dimensions', () => {
			const frame = { timestamp: 100, width: 0, height: 1080 };
			expect(VideoFrameSchema.safeParse(frame).success).toBe(false);
		});
	});

	describe('MediaPipeConfigSchema', () => {
		it('accepts minimal config with defaults', () => {
			const config = {};
			const result = MediaPipeConfigSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.delegate).toBe('GPU');
				expect(result.data.runningMode).toBe('VIDEO');
				expect(result.data.numHands).toBe(1);
			}
		});

		it('accepts full config', () => {
			const config = {
				modelAssetPath: '/models/gesture_recognizer.task',
				wasmLoaderPath: '/wasm/',
				delegate: 'CPU',
				runningMode: 'IMAGE',
				numHands: 2,
				minHandDetectionConfidence: 0.7,
				minHandPresenceConfidence: 0.6,
				minTrackingConfidence: 0.5,
			};
			expect(MediaPipeConfigSchema.safeParse(config).success).toBe(true);
		});
	});

	describe('HandLandmarkIndex', () => {
		it('has exactly 21 landmarks', () => {
			const landmarkCount = Object.keys(HandLandmarkIndex).length;
			expect(landmarkCount).toBe(21);
		});

		it('starts with WRIST at 0', () => {
			expect(HandLandmarkIndex.WRIST).toBe(0);
		});

		it('ends with PINKY_TIP at 20', () => {
			expect(HandLandmarkIndex.PINKY_TIP).toBe(20);
		});

		it('has INDEX_FINGER_TIP at 8 (cursor source)', () => {
			expect(HandLandmarkIndex.INDEX_FINGER_TIP).toBe(8);
		});
	});

	describe('NormalizedLandmarkSchema', () => {
		it('accepts valid landmark', () => {
			const landmark = { x: 0.5, y: 0.5, z: -0.1, visibility: 0.9 };
			expect(NormalizedLandmarkSchema.safeParse(landmark).success).toBe(true);
		});

		it('accepts landmark without visibility', () => {
			const landmark = { x: 0.5, y: 0.5, z: -0.1 };
			expect(NormalizedLandmarkSchema.safeParse(landmark).success).toBe(true);
		});

		it('rejects x outside [0,1]', () => {
			const landmark = { x: 1.5, y: 0.5, z: 0 };
			expect(NormalizedLandmarkSchema.safeParse(landmark).success).toBe(false);
		});

		it('PROPERTY: valid landmarks have x,y in [0,1]', () => {
			fc.assert(
				fc.property(
					fc.record({
						x: fc.double({ min: 0, max: 1, noNaN: true }),
						y: fc.double({ min: 0, max: 1, noNaN: true }),
						z: fc.double({ noNaN: true }),
						visibility: fc.option(fc.double({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
					}),
					(landmark) => {
						return NormalizedLandmarkSchema.safeParse(landmark).success;
					},
				),
				{ numRuns: RED_REGNANT_PROPERTY_RUNS },
			);
		});
	});

	describe('HandLandmarksSchema', () => {
		it('requires exactly 21 landmarks', () => {
			const makeLandmark = (i: number) => ({ x: i / 21, y: i / 21, z: 0 });
			const landmarks20 = Array.from({ length: 20 }, (_, i) => makeLandmark(i));
			const landmarks21 = Array.from({ length: 21 }, (_, i) => makeLandmark(i));
			const landmarks22 = Array.from({ length: 22 }, (_, i) => makeLandmark(i));

			expect(HandLandmarksSchema.safeParse(landmarks20).success).toBe(false);
			expect(HandLandmarksSchema.safeParse(landmarks21).success).toBe(true);
			expect(HandLandmarksSchema.safeParse(landmarks22).success).toBe(false);
		});
	});

	describe('GestureLabels', () => {
		it('has 8 gestures including None', () => {
			expect(GestureLabels.length).toBe(8);
			expect(GestureLabels).toContain('None');
		});

		it('includes key HFO gestures', () => {
			expect(GestureLabels).toContain('Open_Palm');
			expect(GestureLabels).toContain('Pointing_Up');
			expect(GestureLabels).toContain('Victory');
			expect(GestureLabels).toContain('Closed_Fist');
		});
	});

	describe('SensorFrameSchema', () => {
		it('accepts valid sensor frame', () => {
			const frame = {
				ts: 1000,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Open_Palm',
				confidence: 0.9,
				indexTip: { x: 0.5, y: 0.5, z: 0 },
				landmarks: null,
			};
			expect(SensorFrameSchema.safeParse(frame).success).toBe(true);
		});

		it('accepts frame with null indexTip (no hand detected)', () => {
			const frame = {
				ts: 1000,
				handId: 'none',
				trackingOk: false,
				palmFacing: false,
				label: 'None',
				confidence: 0,
				indexTip: null,
				landmarks: null,
			};
			expect(SensorFrameSchema.safeParse(frame).success).toBe(true);
		});
	});

	describe('Type guards', () => {
		it('isSensorFrame validates correctly', () => {
			const validFrame = {
				ts: 1000,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Open_Palm',
				confidence: 0.9,
				indexTip: { x: 0.5, y: 0.5, z: 0 },
				landmarks: null,
			};
			expect(isSensorFrame(validFrame)).toBe(true);
			expect(isSensorFrame({ ts: 1000 })).toBe(false);
		});

		it('isGestureLabel validates correctly', () => {
			expect(isGestureLabel('Open_Palm')).toBe(true);
			expect(isGestureLabel('InvalidGesture')).toBe(false);
		});

		it('isNormalizedLandmark validates correctly', () => {
			expect(isNormalizedLandmark({ x: 0.5, y: 0.5, z: 0 })).toBe(true);
			expect(isNormalizedLandmark({ x: 2, y: 0.5, z: 0 })).toBe(false);
		});
	});
});

// ============================================================================
// PORT 1: WEB WEAVER (FUSE) TESTS
// ============================================================================

describe('Port 1: Web Weaver (FUSE)', () => {
	describe('PORT_1_METADATA', () => {
		it('has correct port number and trigram', () => {
			expect(PORT_1_METADATA.port).toBe(1);
			expect(PORT_1_METADATA.binary).toBe('001');
			expect(PORT_1_METADATA.trigram).toBe('☶');
			expect(PORT_1_METADATA.verb).toBe('FUSE');
		});

		it('mantra contains verb twice (self-reference)', () => {
			const verb = PORT_1_METADATA.verb;
			const mantaVerbCount = (PORT_1_METADATA.mantra.match(new RegExp(verb, 'g')) || []).length;
			expect(mantaVerbCount).toBe(2);
		});

		it('capabilities include validate and compose', () => {
			expect(PORT_1_METADATA.capabilities.can).toContain('validate');
			expect(PORT_1_METADATA.capabilities.can).toContain('compose');
		});

		it('cannot persist or decide', () => {
			expect(PORT_1_METADATA.capabilities.cannot).toContain('persist');
			expect(PORT_1_METADATA.capabilities.cannot).toContain('decide');
		});
	});

	describe('createValguard', () => {
		it('creates working valguard from schema', () => {
			const valguard = createValguard(VideoFrameSchema, 'VideoFrame');

			const validResult = valguard({ timestamp: 100, width: 1920, height: 1080 });
			expect(validResult.success).toBe(true);
			expect(validResult.data).toEqual({ timestamp: 100, width: 1920, height: 1080 });

			const invalidResult = valguard({ timestamp: -1, width: 0 });
			expect(invalidResult.success).toBe(false);
			expect(invalidResult.error?.message).toBe('Invalid VideoFrame');
		});
	});

	describe('createStrictValguard', () => {
		it('throws on invalid input', () => {
			const strictValguard = createStrictValguard(VideoFrameSchema, 'VideoFrame');

			expect(() => strictValguard({ timestamp: -1 })).toThrow();
			expect(strictValguard({ timestamp: 100, width: 1920, height: 1080 })).toEqual({
				timestamp: 100,
				width: 1920,
				height: 1080,
			});
		});
	});

	describe('Pre-built valguards', () => {
		it('validateSensorFrame works', () => {
			const frame = {
				ts: 1000,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Open_Palm',
				confidence: 0.9,
				indexTip: { x: 0.5, y: 0.5, z: 0 },
				landmarks: null,
			};
			expect(validateSensorFrame(frame).success).toBe(true);
		});

		it('validateCameraConstraints works', () => {
			expect(validateCameraConstraints({ width: 1920 }).success).toBe(true);
			expect(validateCameraConstraints({ width: -1 }).success).toBe(false);
		});
	});

	describe('SCHEMA_REGISTRY', () => {
		it('has entries for ports 0, 1, 2, 3, 5', () => {
			expect(SCHEMA_REGISTRY[0]).toBeDefined();
			expect(SCHEMA_REGISTRY[1]).toBeDefined();
			expect(SCHEMA_REGISTRY[2]).toBeDefined();
			expect(SCHEMA_REGISTRY[3]).toBeDefined();
			expect(SCHEMA_REGISTRY[5]).toBeDefined();
		});

		it('Port 0 has SensorFrame as output', () => {
			expect(SCHEMA_REGISTRY[0].output.SensorFrame).toBeDefined();
		});

		it('Port 2 has SensorFrame as input, SmoothedFrame as output', () => {
			expect(SCHEMA_REGISTRY[2].input.SensorFrame).toBeDefined();
			expect(SCHEMA_REGISTRY[2].output.SmoothedFrame).toBeDefined();
		});
	});

	describe('getPortSchemas', () => {
		it('returns schemas for valid port', () => {
			const schemas = getPortSchemas(0);
			expect(schemas).toBeDefined();
			expect(schemas?.name).toContain('Lidless Legion');
		});

		it('returns undefined for invalid port', () => {
			expect(getPortSchemas(99)).toBeUndefined();
		});
	});

	describe('validatePortInput', () => {
		it('validates against correct port schema', () => {
			const frame = { timestamp: 100, width: 1920, height: 1080 };
			const result = validatePortInput(0, 'VideoFrame', frame);
			expect(result.success).toBe(true);
		});

		it('rejects unknown port', () => {
			const result = validatePortInput(99, 'SomeSchema', {});
			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Unknown port');
		});

		it('rejects unknown schema', () => {
			const result = validatePortInput(0, 'NonexistentSchema', {});
			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Unknown schema');
		});
	});

	describe('composeSchemas', () => {
		it('validates input, transforms, validates output', () => {
			const composed = composeSchemas(VideoFrameSchema, VideoFrameSchema, (frame) => ({
				...frame,
				timestamp: frame.timestamp + 1,
			}));

			const result = composed({ timestamp: 100, width: 1920, height: 1080 });
			expect(result.success).toBe(true);
			expect(result.data?.timestamp).toBe(101);
		});

		it('fails on invalid input', () => {
			const composed = composeSchemas(VideoFrameSchema, VideoFrameSchema, (frame) => frame);

			const result = composed({ timestamp: -1 });
			expect(result.success).toBe(false);
			expect(result.error?.message).toContain('Input validation failed');
		});
	});
});
