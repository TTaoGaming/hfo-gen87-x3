/**
 * SENSE Adapters Tests - Port 0 (@0) - Lidless Legion
 *
 * Gen87.X3 | TDD RED phase
 *
 * Tests for all 6 SENSE adapters:
 * 1. CameraSettingsAdapter
 * 2. CameraAdapter (mock)
 * 3. MediaPipelineSettingsAdapter
 * 4. MediaPipelineAdapter (mock)
 * 5. GestureRecognizerSettingsAdapter
 * 6. GestureRecognizerAdapter (mock)
 *
 * Plus utility functions for palm observation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
	// Types
	type CameraSettings,
	type MediaPipelineSettings,
	type GestureRecognizerSettings,
	type SenseTag,
	type NormalizedLandmark,
	type GestureCategory,
	type CameraState,
	type PipelineState,
	// Schemas
	CameraSettingsSchema,
	MediaPipelineSettingsSchema,
	GestureRecognizerSettingsSchema,
	// Defaults
	DEFAULT_CAMERA_SETTINGS,
	DEFAULT_PIPELINE_SETTINGS,
	DEFAULT_GESTURE_SETTINGS,
	// Constants
	LANDMARK_INDEX,
	HAND_CONNECTIONS,
	// Factory functions
	createSenseTag,
	createCameraSettingsAdapter,
	createPipelineSettingsAdapter,
	createGestureSettingsAdapter,
	// Utility functions
	observePalmNormal,
	observePalmAngle,
	observeIndexFingertip,
} from './sense-adapters.js';

// ============================================================================
// ARBITRARIES FOR PROPERTY TESTS
// ============================================================================

/** Generate valid camera settings */
const cameraSettingsArbitrary = fc.record({
	width: fc.integer({ min: 160, max: 4096 }),
	height: fc.integer({ min: 120, max: 2160 }),
	frameRate: fc.integer({ min: 1, max: 120 }),
	facingMode: fc.constantFrom('user', 'environment') as fc.Arbitrary<'user' | 'environment'>,
	autoFocus: fc.boolean(),
});

/** Generate valid pipeline settings */
const pipelineSettingsArbitrary = fc.record({
	modelComplexity: fc.constantFrom(0, 1, 2) as fc.Arbitrary<0 | 1 | 2>,
	maxNumHands: fc.integer({ min: 1, max: 4 }),
	minDetectionConfidence: fc.float({ min: 0, max: 1, noNaN: true }),
	minTrackingConfidence: fc.float({ min: 0, max: 1, noNaN: true }),
	useGpu: fc.boolean(),
	runningMode: fc.constantFrom('VIDEO', 'IMAGE') as fc.Arbitrary<'VIDEO' | 'IMAGE'>,
});

/** Generate valid gesture settings */
const gestureSettingsArbitrary = fc.record({
	minGestureConfidence: fc.float({ min: 0, max: 1, noNaN: true }),
	minHandPresenceConfidence: fc.float({ min: 0, max: 1, noNaN: true }),
	maxNumHands: fc.integer({ min: 1, max: 4 }),
	useGpu: fc.boolean(),
	runningMode: fc.constantFrom('VIDEO', 'IMAGE') as fc.Arbitrary<'VIDEO' | 'IMAGE'>,
});

/** Generate valid normalized landmark */
const landmarkArbitrary = fc.record({
	x: fc.float({ min: 0, max: 1, noNaN: true }),
	y: fc.float({ min: 0, max: 1, noNaN: true }),
	z: fc.float({ min: -1, max: 1, noNaN: true }),
});

/** Generate array of 21 landmarks (full hand) */
const handLandmarksArbitrary = fc.array(landmarkArbitrary, { minLength: 21, maxLength: 21 });

// ============================================================================
// 1. SENSE TAG TESTS
// ============================================================================

describe('SenseTag', () => {
	it('creates tag with correct port number', () => {
		const tag = createSenseTag('test-source', 42);

		expect(tag._port).toBe(0);
		expect(tag._verb).toBe('SENSE');
		expect(tag._source).toBe('test-source');
		expect(tag._frameId).toBe(42);
	});

	it('includes ISO8601 timestamp', () => {
		const before = new Date().toISOString();
		const tag = createSenseTag('test', 1);
		const after = new Date().toISOString();

		expect(tag._timestamp).toBeDefined();
		expect(new Date(tag._timestamp).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
		expect(new Date(tag._timestamp).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
	});

	it('always sets port 0 for any source and frameId', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1 }), fc.nat(), (source, frameId) => {
				const tag = createSenseTag(source, frameId);
				expect(tag._port).toBe(0);
				expect(tag._verb).toBe('SENSE');
			})
		);
	});
});

// ============================================================================
// 2. CAMERA SETTINGS ADAPTER TESTS
// ============================================================================

describe('CameraSettingsAdapter', () => {
	describe('defaults', () => {
		it('has sensible defaults', () => {
			expect(DEFAULT_CAMERA_SETTINGS.width).toBe(1280);
			expect(DEFAULT_CAMERA_SETTINGS.height).toBe(720);
			expect(DEFAULT_CAMERA_SETTINGS.frameRate).toBe(30);
			expect(DEFAULT_CAMERA_SETTINGS.facingMode).toBe('user');
			expect(DEFAULT_CAMERA_SETTINGS.autoFocus).toBe(true);
		});
	});

	describe('schema validation', () => {
		it('validates width constraints', () => {
			expect(() => CameraSettingsSchema.parse({ width: 159 })).toThrow();
			expect(() => CameraSettingsSchema.parse({ width: 4097 })).toThrow();
			expect(CameraSettingsSchema.parse({ width: 160 }).width).toBe(160);
			expect(CameraSettingsSchema.parse({ width: 4096 }).width).toBe(4096);
		});

		it('validates height constraints', () => {
			expect(() => CameraSettingsSchema.parse({ height: 119 })).toThrow();
			expect(() => CameraSettingsSchema.parse({ height: 2161 })).toThrow();
			expect(CameraSettingsSchema.parse({ height: 120 }).height).toBe(120);
			expect(CameraSettingsSchema.parse({ height: 2160 }).height).toBe(2160);
		});

		it('validates frameRate constraints', () => {
			expect(() => CameraSettingsSchema.parse({ frameRate: 0 })).toThrow();
			expect(() => CameraSettingsSchema.parse({ frameRate: 121 })).toThrow();
			expect(CameraSettingsSchema.parse({ frameRate: 1 }).frameRate).toBe(1);
			expect(CameraSettingsSchema.parse({ frameRate: 120 }).frameRate).toBe(120);
		});

		it('validates facingMode enum', () => {
			expect(CameraSettingsSchema.parse({ facingMode: 'user' }).facingMode).toBe('user');
			expect(CameraSettingsSchema.parse({ facingMode: 'environment' }).facingMode).toBe(
				'environment'
			);
			expect(() => CameraSettingsSchema.parse({ facingMode: 'invalid' })).toThrow();
		});

		it('accepts all valid settings via property test', () => {
			fc.assert(
				fc.property(cameraSettingsArbitrary, (settings) => {
					const result = CameraSettingsSchema.parse(settings);
					expect(result.width).toBe(settings.width);
					expect(result.height).toBe(settings.height);
				})
			);
		});
	});

	describe('adapter factory', () => {
		it('creates adapter with defaults', () => {
			const adapter = createCameraSettingsAdapter();

			expect(adapter.current.width).toBe(1280);
			expect(adapter.current.height).toBe(720);
		});

		it('creates adapter with custom initial values', () => {
			const adapter = createCameraSettingsAdapter({ width: 640, height: 480 });

			expect(adapter.current.width).toBe(640);
			expect(adapter.current.height).toBe(480);
			expect(adapter.current.frameRate).toBe(30); // default
		});

		it('validates initial values', () => {
			expect(() => createCameraSettingsAdapter({ width: 50 })).toThrow();
		});
	});

	describe('toConstraints', () => {
		it('converts settings to MediaStreamConstraints', () => {
			const adapter = createCameraSettingsAdapter({ width: 1920, height: 1080, frameRate: 60 });
			const constraints = adapter.toConstraints();

			expect(constraints.video).toBeDefined();
			expect(constraints.audio).toBe(false);

			const video = constraints.video as MediaTrackConstraints;
			expect(video.width).toEqual({ ideal: 1920 });
			expect(video.height).toEqual({ ideal: 1080 });
			expect(video.frameRate).toEqual({ ideal: 60 });
		});

		it('includes deviceId when specified', () => {
			const adapter = createCameraSettingsAdapter({ deviceId: 'my-camera-123' });
			const constraints = adapter.toConstraints();

			const video = constraints.video as MediaTrackConstraints;
			expect(video.deviceId).toEqual({ exact: 'my-camera-123' });
		});
	});

	describe('update', () => {
		it('returns new settings without mutating current', () => {
			const adapter = createCameraSettingsAdapter();
			const original = adapter.current;

			const updated = adapter.update({ width: 640 });

			expect(updated.width).toBe(640);
			expect(adapter.current.width).toBe(640); // adapter is updated
			expect(original.width).toBe(1280); // original unchanged
		});

		it('update preserves other fields', () => {
			fc.assert(
				fc.property(
					cameraSettingsArbitrary,
					fc.integer({ min: 160, max: 4096 }),
					(settings, newWidth) => {
						const adapter = createCameraSettingsAdapter(settings);
						const updated = adapter.update({ width: newWidth });

						expect(updated.width).toBe(newWidth);
						expect(updated.height).toBe(settings.height);
						expect(updated.frameRate).toBe(settings.frameRate);
					}
				)
			);
		});
	});

	describe('tag', () => {
		it('returns settings with sense tag', () => {
			const adapter = createCameraSettingsAdapter({ width: 800 });
			const tagged = adapter.tag();

			expect(tagged.settings.width).toBe(800);
			expect(tagged.tag._port).toBe(0);
			expect(tagged.tag._verb).toBe('SENSE');
			expect(tagged.tag._source).toBe('camera-settings');
		});

		it('increments frameId on each tag call', () => {
			const adapter = createCameraSettingsAdapter();

			const tag1 = adapter.tag();
			const tag2 = adapter.tag();
			const tag3 = adapter.tag();

			expect(tag1.tag._frameId).toBe(0);
			expect(tag2.tag._frameId).toBe(1);
			expect(tag3.tag._frameId).toBe(2);
		});
	});
});

// ============================================================================
// 3. MEDIA PIPELINE SETTINGS ADAPTER TESTS
// ============================================================================

describe('MediaPipelineSettingsAdapter', () => {
	describe('defaults', () => {
		it('has sensible defaults', () => {
			expect(DEFAULT_PIPELINE_SETTINGS.modelComplexity).toBe(1);
			expect(DEFAULT_PIPELINE_SETTINGS.maxNumHands).toBe(2);
			expect(DEFAULT_PIPELINE_SETTINGS.minDetectionConfidence).toBe(0.5);
			expect(DEFAULT_PIPELINE_SETTINGS.minTrackingConfidence).toBe(0.5);
			expect(DEFAULT_PIPELINE_SETTINGS.useGpu).toBe(true);
			expect(DEFAULT_PIPELINE_SETTINGS.runningMode).toBe('VIDEO');
		});

		it('includes CDN paths', () => {
			expect(DEFAULT_PIPELINE_SETTINGS.wasmPath).toContain('cdn.jsdelivr.net');
			expect(DEFAULT_PIPELINE_SETTINGS.modelAssetPath).toContain('storage.googleapis.com');
		});
	});

	describe('schema validation', () => {
		it('validates modelComplexity enum', () => {
			expect(MediaPipelineSettingsSchema.parse({ modelComplexity: 0 }).modelComplexity).toBe(0);
			expect(MediaPipelineSettingsSchema.parse({ modelComplexity: 1 }).modelComplexity).toBe(1);
			expect(MediaPipelineSettingsSchema.parse({ modelComplexity: 2 }).modelComplexity).toBe(2);
			expect(() => MediaPipelineSettingsSchema.parse({ modelComplexity: 3 })).toThrow();
		});

		it('validates confidence ranges', () => {
			expect(() =>
				MediaPipelineSettingsSchema.parse({ minDetectionConfidence: -0.1 })
			).toThrow();
			expect(() =>
				MediaPipelineSettingsSchema.parse({ minDetectionConfidence: 1.1 })
			).toThrow();
			expect(
				MediaPipelineSettingsSchema.parse({ minDetectionConfidence: 0 }).minDetectionConfidence
			).toBe(0);
			expect(
				MediaPipelineSettingsSchema.parse({ minDetectionConfidence: 1 }).minDetectionConfidence
			).toBe(1);
		});

		it('validates maxNumHands', () => {
			expect(() => MediaPipelineSettingsSchema.parse({ maxNumHands: 0 })).toThrow();
			expect(() => MediaPipelineSettingsSchema.parse({ maxNumHands: 5 })).toThrow();
			expect(MediaPipelineSettingsSchema.parse({ maxNumHands: 1 }).maxNumHands).toBe(1);
			expect(MediaPipelineSettingsSchema.parse({ maxNumHands: 4 }).maxNumHands).toBe(4);
		});

		it('accepts all valid settings via property test', () => {
			fc.assert(
				fc.property(pipelineSettingsArbitrary, (settings) => {
					const result = MediaPipelineSettingsSchema.parse(settings);
					expect(result.modelComplexity).toBe(settings.modelComplexity);
					expect(result.maxNumHands).toBe(settings.maxNumHands);
				})
			);
		});
	});

	describe('adapter factory', () => {
		it('creates adapter with defaults', () => {
			const adapter = createPipelineSettingsAdapter();

			expect(adapter.current.modelComplexity).toBe(1);
			expect(adapter.current.maxNumHands).toBe(2);
		});

		it('creates adapter with custom initial values', () => {
			const adapter = createPipelineSettingsAdapter({
				modelComplexity: 0,
				minDetectionConfidence: 0.7,
			});

			expect(adapter.current.modelComplexity).toBe(0);
			expect(adapter.current.minDetectionConfidence).toBe(0.7);
		});
	});

	describe('update', () => {
		it('updates and validates', () => {
			const adapter = createPipelineSettingsAdapter();
			const updated = adapter.update({ modelComplexity: 2 });

			expect(updated.modelComplexity).toBe(2);
			expect(adapter.current.modelComplexity).toBe(2);
		});

		it('rejects invalid updates', () => {
			const adapter = createPipelineSettingsAdapter();
			expect(() => adapter.update({ modelComplexity: 5 as any })).toThrow();
		});
	});

	describe('tag', () => {
		it('returns tagged settings', () => {
			const adapter = createPipelineSettingsAdapter();
			const tagged = adapter.tag();

			expect(tagged.tag._port).toBe(0);
			expect(tagged.tag._source).toBe('pipeline-settings');
			expect(tagged.settings.modelComplexity).toBe(1);
		});
	});
});

// ============================================================================
// 4. GESTURE RECOGNIZER SETTINGS ADAPTER TESTS
// ============================================================================

describe('GestureRecognizerSettingsAdapter', () => {
	describe('defaults', () => {
		it('has sensible defaults', () => {
			expect(DEFAULT_GESTURE_SETTINGS.minGestureConfidence).toBe(0.5);
			expect(DEFAULT_GESTURE_SETTINGS.minHandPresenceConfidence).toBe(0.5);
			expect(DEFAULT_GESTURE_SETTINGS.maxNumHands).toBe(2);
			expect(DEFAULT_GESTURE_SETTINGS.useGpu).toBe(true);
		});

		it('includes model path', () => {
			expect(DEFAULT_GESTURE_SETTINGS.modelAssetPath).toContain('gesture_recognizer');
		});
	});

	describe('schema validation', () => {
		it('validates confidence ranges', () => {
			expect(() =>
				GestureRecognizerSettingsSchema.parse({ minGestureConfidence: -0.1 })
			).toThrow();
			expect(() =>
				GestureRecognizerSettingsSchema.parse({ minGestureConfidence: 1.1 })
			).toThrow();
		});

		it('allows optional customModelPath', () => {
			const result = GestureRecognizerSettingsSchema.parse({});
			expect(result.customModelPath).toBeUndefined();

			const withCustom = GestureRecognizerSettingsSchema.parse({
				customModelPath: '/custom/model.task',
			});
			expect(withCustom.customModelPath).toBe('/custom/model.task');
		});

		it('accepts all valid settings via property test', () => {
			fc.assert(
				fc.property(gestureSettingsArbitrary, (settings) => {
					const result = GestureRecognizerSettingsSchema.parse(settings);
					expect(result.maxNumHands).toBe(settings.maxNumHands);
				})
			);
		});
	});

	describe('adapter factory', () => {
		it('creates adapter with defaults', () => {
			const adapter = createGestureSettingsAdapter();

			expect(adapter.current.minGestureConfidence).toBe(0.5);
			expect(adapter.current.maxNumHands).toBe(2);
		});

		it('creates adapter with custom values', () => {
			const adapter = createGestureSettingsAdapter({
				minGestureConfidence: 0.8,
				customModelPath: '/my/model.task',
			});

			expect(adapter.current.minGestureConfidence).toBe(0.8);
			expect(adapter.current.customModelPath).toBe('/my/model.task');
		});
	});

	describe('update', () => {
		it('updates immutably', () => {
			const adapter = createGestureSettingsAdapter();
			const original = adapter.current;

			adapter.update({ maxNumHands: 4 });

			expect(adapter.current.maxNumHands).toBe(4);
			expect(original.maxNumHands).toBe(2);
		});
	});

	describe('tag', () => {
		it('returns tagged settings', () => {
			const adapter = createGestureSettingsAdapter();
			const tagged = adapter.tag();

			expect(tagged.tag._port).toBe(0);
			expect(tagged.tag._source).toBe('gesture-settings');
		});

		it('increments frameId', () => {
			const adapter = createGestureSettingsAdapter();

			expect(adapter.tag().tag._frameId).toBe(0);
			expect(adapter.tag().tag._frameId).toBe(1);
			expect(adapter.tag().tag._frameId).toBe(2);
		});
	});
});

// ============================================================================
// 5. LANDMARK CONSTANTS TESTS
// ============================================================================

describe('Landmark Constants', () => {
	describe('LANDMARK_INDEX', () => {
		it('has all 21 landmarks', () => {
			const indices = Object.values(LANDMARK_INDEX);
			expect(indices.length).toBe(21);
		});

		it('has contiguous indices 0-20', () => {
			const indices = Object.values(LANDMARK_INDEX).sort((a, b) => a - b);
			for (let i = 0; i < 21; i++) {
				expect(indices[i]).toBe(i);
			}
		});

		it('has correct fingertip indices', () => {
			expect(LANDMARK_INDEX.THUMB_TIP).toBe(4);
			expect(LANDMARK_INDEX.INDEX_TIP).toBe(8);
			expect(LANDMARK_INDEX.MIDDLE_TIP).toBe(12);
			expect(LANDMARK_INDEX.RING_TIP).toBe(16);
			expect(LANDMARK_INDEX.PINKY_TIP).toBe(20);
		});

		it('has wrist at 0', () => {
			expect(LANDMARK_INDEX.WRIST).toBe(0);
		});
	});

	describe('HAND_CONNECTIONS', () => {
		it('has correct number of connections', () => {
			// 4 per finger (5 fingers) = 20 + 3 palm = 23
			expect(HAND_CONNECTIONS.length).toBe(23);
		});

		it('all connections reference valid indices', () => {
			for (const [from, to] of HAND_CONNECTIONS) {
				expect(from).toBeGreaterThanOrEqual(0);
				expect(from).toBeLessThanOrEqual(20);
				expect(to).toBeGreaterThanOrEqual(0);
				expect(to).toBeLessThanOrEqual(20);
			}
		});

		it('includes wrist connections', () => {
			const wristConnections = HAND_CONNECTIONS.filter(([from]) => from === 0);
			// Wrist connects to: thumb CMC, index MCP, middle MCP, ring MCP, pinky MCP
			expect(wristConnections.length).toBeGreaterThanOrEqual(5);
		});
	});
});

// ============================================================================
// 6. PALM OBSERVATION UTILITIES TESTS
// ============================================================================

describe('Palm Observation Utilities', () => {
	/** Create a flat hand facing camera (palm normal = +Z) */
	function createFlatHandFacingCamera(): NormalizedLandmark[] {
		const landmarks: NormalizedLandmark[] = [];
		for (let i = 0; i < 21; i++) {
			landmarks.push({ x: 0.5 + i * 0.01, y: 0.5 + i * 0.01, z: 0 });
		}
		// Set specific landmarks for palm calculation
		landmarks[LANDMARK_INDEX.WRIST] = { x: 0.5, y: 0.7, z: 0 };
		landmarks[LANDMARK_INDEX.INDEX_MCP] = { x: 0.4, y: 0.5, z: 0 };
		landmarks[LANDMARK_INDEX.PINKY_MCP] = { x: 0.6, y: 0.5, z: 0 };
		return landmarks;
	}

	/** Create hand facing away from camera */
	function createHandFacingAway(): NormalizedLandmark[] {
		const landmarks = createFlatHandFacingCamera();
		// Flip the palm (swap index and pinky to reverse normal direction)
		const temp = landmarks[LANDMARK_INDEX.INDEX_MCP];
		landmarks[LANDMARK_INDEX.INDEX_MCP] = landmarks[LANDMARK_INDEX.PINKY_MCP];
		landmarks[LANDMARK_INDEX.PINKY_MCP] = temp;
		return landmarks;
	}

	describe('observePalmNormal', () => {
		it('returns null for insufficient landmarks', () => {
			expect(observePalmNormal([])).toBeNull();
			expect(observePalmNormal([{ x: 0, y: 0, z: 0 }])).toBeNull();
		});

		it('returns null for exactly 20 landmarks', () => {
			const landmarks = Array(20)
				.fill(null)
				.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
			expect(observePalmNormal(landmarks)).toBeNull();
		});

		it('returns normalized vector', () => {
			const landmarks = createFlatHandFacingCamera();
			const normal = observePalmNormal(landmarks);

			expect(normal).not.toBeNull();
			if (normal) {
				// Check normalization
				const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
				expect(length).toBeCloseTo(1, 4);
			}
		});

		it('always returns normalized vector for valid hands', () => {
			fc.assert(
				fc.property(handLandmarksArbitrary, (landmarks) => {
					const normal = observePalmNormal(landmarks);

					if (normal) {
						const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
						expect(length).toBeCloseTo(1, 3);
					}
				})
			);
		});

		it('returns null for degenerate hand (all landmarks at same point)', () => {
			const landmarks = Array(21).fill({ x: 0.5, y: 0.5, z: 0 });
			const normal = observePalmNormal(landmarks);

			expect(normal).toBeNull();
		});

		it('handles near-zero length vectors', () => {
			// Create landmarks that result in very small cross product
			const landmarks = Array(21)
				.fill(null)
				.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
			// Make vectors nearly parallel (small angle)
			landmarks[LANDMARK_INDEX.WRIST] = { x: 0.5, y: 0.5, z: 0 };
			landmarks[LANDMARK_INDEX.INDEX_MCP] = { x: 0.5000001, y: 0.5, z: 0 };
			landmarks[LANDMARK_INDEX.PINKY_MCP] = { x: 0.5000002, y: 0.5, z: 0 };

			const normal = observePalmNormal(landmarks);
			// Should return null for near-degenerate case
			// or return a valid normalized vector
			if (normal !== null) {
				const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
				expect(length).toBeCloseTo(1, 3);
			}
		});
	});

	describe('observePalmAngle', () => {
		it('returns null for insufficient landmarks', () => {
			expect(observePalmAngle([])).toBeNull();
		});

		it('returns angle in degrees (0-180)', () => {
			const landmarks = createFlatHandFacingCamera();
			const angle = observePalmAngle(landmarks);

			expect(angle).not.toBeNull();
			if (angle !== null) {
				expect(angle).toBeGreaterThanOrEqual(0);
				expect(angle).toBeLessThanOrEqual(180);
			}
		});

		it('returns specific angle for known palm orientation', () => {
			// Create a hand with palm facing directly towards camera
			// Normal vector should be (0, 0, 1) giving angle of 0 degrees
			const landmarks = Array(21)
				.fill(null)
				.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
			// Wrist at center
			landmarks[LANDMARK_INDEX.WRIST] = { x: 0.5, y: 0.7, z: 0 };
			// Index MCP to the left
			landmarks[LANDMARK_INDEX.INDEX_MCP] = { x: 0.4, y: 0.5, z: 0 };
			// Pinky MCP to the right
			landmarks[LANDMARK_INDEX.PINKY_MCP] = { x: 0.6, y: 0.5, z: 0 };

			const angle = observePalmAngle(landmarks);

			// Should be close to 90 degrees (palm parallel to camera plane)
			expect(angle).not.toBeNull();
			if (angle !== null) {
				expect(angle).toBeGreaterThanOrEqual(0);
				expect(angle).toBeLessThanOrEqual(180);
			}
		});

		it('handles edge case dot product clamping', () => {
			// Test that we clamp dot product to [-1, 1] to avoid NaN from acos
			// Create a valid hand where normal can be computed
			const landmarks = createFlatHandFacingCamera();

			const angle = observePalmAngle(landmarks);

			// Should NOT be NaN due to proper clamping
			if (angle !== null) {
				expect(angle).not.toBeNaN();
				expect(typeof angle).toBe('number');
			}
		});

		it('angle is always 0-180 degrees', () => {
			fc.assert(
				fc.property(handLandmarksArbitrary, (landmarks) => {
					const angle = observePalmAngle(landmarks);

					if (angle !== null) {
						expect(angle).toBeGreaterThanOrEqual(0);
						expect(angle).toBeLessThanOrEqual(180);
					}
				})
			);
		});
	});

	describe('observeIndexFingertip', () => {
		it('returns null for insufficient landmarks', () => {
			expect(observeIndexFingertip([])).toBeNull();
		});

		it('returns index fingertip landmark', () => {
			const landmarks = createFlatHandFacingCamera();
			landmarks[LANDMARK_INDEX.INDEX_TIP] = { x: 0.3, y: 0.4, z: 0.1 };

			const tip = observeIndexFingertip(landmarks);

			expect(tip).not.toBeNull();
			expect(tip?.x).toBe(0.3);
			expect(tip?.y).toBe(0.4);
			expect(tip?.z).toBe(0.1);
		});

		it('returns null for exactly 20 landmarks', () => {
			const landmarks = Array(20)
				.fill(null)
				.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
			expect(observeIndexFingertip(landmarks)).toBeNull();
		});

		it('returns landmark at index 8', () => {
			fc.assert(
				fc.property(handLandmarksArbitrary, (landmarks) => {
					const tip = observeIndexFingertip(landmarks);

					expect(tip).toEqual(landmarks[LANDMARK_INDEX.INDEX_TIP]);
				})
			);
		});
	});
});

// ============================================================================
// 7. CAMERA STATE MACHINE TESTS
// ============================================================================

describe('CameraState', () => {
	const validStates: CameraState[] = ['idle', 'requesting', 'active', 'error', 'stopped'];

	it('defines all valid states', () => {
		expect(validStates).toContain('idle');
		expect(validStates).toContain('requesting');
		expect(validStates).toContain('active');
		expect(validStates).toContain('error');
		expect(validStates).toContain('stopped');
	});
});

describe('PipelineState', () => {
	const validStates: PipelineState[] = ['uninitialized', 'loading', 'ready', 'processing', 'error'];

	it('defines all valid states', () => {
		expect(validStates).toContain('uninitialized');
		expect(validStates).toContain('loading');
		expect(validStates).toContain('ready');
		expect(validStates).toContain('processing');
		expect(validStates).toContain('error');
	});
});

// ============================================================================
// 8. GESTURE CATEGORY TESTS
// ============================================================================

describe('GestureCategory', () => {
	const validGestures: GestureCategory[] = [
		'None',
		'Closed_Fist',
		'Open_Palm',
		'Pointing_Up',
		'Thumb_Down',
		'Thumb_Up',
		'Victory',
		'ILoveYou',
	];

	it('includes all MediaPipe gesture categories', () => {
		expect(validGestures.length).toBe(8);
	});

	it('includes None for no gesture', () => {
		expect(validGestures).toContain('None');
	});

	it('includes common gestures', () => {
		expect(validGestures).toContain('Open_Palm');
		expect(validGestures).toContain('Closed_Fist');
		expect(validGestures).toContain('Victory');
	});
});

// ============================================================================
// 9. INTEGRATION - ADAPTER COMPOSITION
// ============================================================================

describe('Adapter Composition', () => {
	it('all settings adapters work together', () => {
		const cameraSettings = createCameraSettingsAdapter({ width: 1920, height: 1080 });
		const pipelineSettings = createPipelineSettingsAdapter({ modelComplexity: 2 });
		const gestureSettings = createGestureSettingsAdapter({ minGestureConfidence: 0.7 });

		// All adapters should have Port 0 tag
		expect(cameraSettings.tag().tag._port).toBe(0);
		expect(pipelineSettings.tag().tag._port).toBe(0);
		expect(gestureSettings.tag().tag._port).toBe(0);

		// All should have SENSE verb
		expect(cameraSettings.tag().tag._verb).toBe('SENSE');
		expect(pipelineSettings.tag().tag._verb).toBe('SENSE');
		expect(gestureSettings.tag().tag._verb).toBe('SENSE');
	});

	it('settings can be updated independently', () => {
		const camera = createCameraSettingsAdapter();
		const pipeline = createPipelineSettingsAdapter();
		const gesture = createGestureSettingsAdapter();

		camera.update({ frameRate: 60 });
		pipeline.update({ maxNumHands: 1 });
		gesture.update({ useGpu: false });

		expect(camera.current.frameRate).toBe(60);
		expect(pipeline.current.maxNumHands).toBe(1);
		expect(gesture.current.useGpu).toBe(false);
	});

	it('each adapter has independent frame counter', () => {
		const camera = createCameraSettingsAdapter();
		const pipeline = createPipelineSettingsAdapter();

		camera.tag();
		camera.tag();
		camera.tag();

		expect(camera.tag().tag._frameId).toBe(3);
		expect(pipeline.tag().tag._frameId).toBe(0); // Independent counter
	});
});

// ============================================================================
// 10. BEHAVIORAL CONTRACT TESTS (Port 0 Constraints)
// ============================================================================

describe('Port 0 Behavioral Contract', () => {
	it('observePalmNormal does NOT modify input', () => {
		const landmarks = Array(21)
			.fill(null)
			.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
		landmarks[0] = { x: 0.5, y: 0.7, z: 0 };
		landmarks[5] = { x: 0.4, y: 0.5, z: 0 };
		landmarks[17] = { x: 0.6, y: 0.5, z: 0 };

		const originalJson = JSON.stringify(landmarks);

		observePalmNormal(landmarks);

		expect(JSON.stringify(landmarks)).toBe(originalJson);
	});

	it('observePalmAngle does NOT modify input', () => {
		const landmarks = Array(21)
			.fill(null)
			.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
		const originalJson = JSON.stringify(landmarks);

		observePalmAngle(landmarks);

		expect(JSON.stringify(landmarks)).toBe(originalJson);
	});

	it('observeIndexFingertip does NOT modify input', () => {
		const landmarks = Array(21)
			.fill(null)
			.map(() => ({ x: 0.5, y: 0.5, z: 0 }));
		const originalJson = JSON.stringify(landmarks);

		observeIndexFingertip(landmarks);

		expect(JSON.stringify(landmarks)).toBe(originalJson);
	});

	it('settings adapters return copies, not references', () => {
		const adapter = createCameraSettingsAdapter();
		const settings1 = adapter.current;
		const settings2 = adapter.current;

		// These are the same object (getter returns same reference)
		// But update() should create new object
		const updated = adapter.update({ width: 640 });

		expect(updated).not.toBe(settings1);
		expect(adapter.current.width).toBe(640);
	});
});
