/**
 * MediaPipe Adapter Tests - Anti-Theater Detection
 *
 * Gen87.X3 | Hot Silver | TDD for Anti-Reward-Hacking
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type PointerFrame, createDefaultFrame, createFacingFrame } from './contracts.js';
import { DEFAULT_ANTI_THEATER, MediaPipeAdapter } from './mediapipe-adapter.js';

describe('MediaPipeAdapter', () => {
	let adapter: MediaPipeAdapter;

	beforeEach(() => {
		adapter = new MediaPipeAdapter('test-mp', {
			varianceWindowSize: 5, // Smaller window for tests
			quarantineThreshold: 3,
		});
	});

	afterEach(async () => {
		await adapter.stop();
	});

	describe('Lifecycle', () => {
		it('should start and stop correctly', async () => {
			expect(adapter.isRunning()).toBe(false);
			await adapter.start();
			expect(adapter.isRunning()).toBe(true);
			await adapter.stop();
			expect(adapter.isRunning()).toBe(false);
		});

		it('should not be quarantined on fresh start', async () => {
			await adapter.start();
			expect(adapter.isQuarantined()).toBe(false);
		});
	});

	describe('Frame Delivery', () => {
		it('should deliver valid frames to callback', async () => {
			const frames: PointerFrame[] = [];
			adapter.onFrame((frame) => frames.push(frame));
			await adapter.start();

			adapter.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }));

			expect(frames).toHaveLength(1);
			expect(frames[0].position).toEqual({ x: 0.5, y: 0.5 });
		});

		it('should not deliver frames when not running', () => {
			const frames: PointerFrame[] = [];
			adapter.onFrame((frame) => frames.push(frame));

			adapter.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }));

			expect(frames).toHaveLength(0);
		});
	});

	describe('Anti-Theater: VELOCITY_SPIKE', () => {
		it('should detect superhuman velocity', async () => {
			// Use tight velocity threshold but allow larger teleport to isolate velocity detection
			adapter = new MediaPipeAdapter('test', { maxVelocity: 0.01, maxTeleport: 0.2 });
			await adapter.start();
			adapter.onFrame(() => {});

			// First frame establishes position
			adapter.injectFrame(createFacingFrame(1000, { x: 0.1, y: 0.1 }));

			// Second frame: small distance (0.1 diagonal ≈ 0.14) but very fast (1ms)
			// Velocity = 0.14 / 0.001s = 140, far above maxVelocity of 0.01
			adapter.injectFrame(createFacingFrame(1001, { x: 0.2, y: 0.2 }));

			const violations = adapter.getViolations();
			const velocityViolation = violations.find((v) => v.type === 'VELOCITY_SPIKE');

			expect(velocityViolation).toBeDefined();
			expect(velocityViolation?.severity).toBe('error');
		});

		it('should accept normal human velocity', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			// Normal hand movement
			adapter.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }));
			adapter.injectFrame(createFacingFrame(1016, { x: 0.501, y: 0.501 })); // Tiny movement

			const violations = adapter.getViolations();
			const velocityViolation = violations.find((v) => v.type === 'VELOCITY_SPIKE');

			expect(velocityViolation).toBeUndefined();
		});
	});

	describe('Anti-Theater: TELEPORTATION', () => {
		it('should detect position teleportation', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			adapter.injectFrame(createFacingFrame(1000, { x: 0.1, y: 0.1 }));
			adapter.injectFrame(createFacingFrame(1100, { x: 0.9, y: 0.9 })); // 100ms apart but huge jump

			const violations = adapter.getViolations();
			const teleportViolation = violations.find((v) => v.type === 'TELEPORTATION');

			expect(teleportViolation).toBeDefined();
			expect(teleportViolation?.details).toContain('Teleportation');
		});

		it('should accept gradual position changes', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			// Gradual movement
			for (let i = 0; i < 10; i++) {
				adapter.injectFrame(
					createFacingFrame(1000 + i * 16, {
						x: 0.5 + i * 0.01,
						y: 0.5 + i * 0.01,
					}),
				);
			}

			const violations = adapter.getViolations();
			const teleportViolation = violations.find((v) => v.type === 'TELEPORTATION');

			expect(teleportViolation).toBeUndefined();
		});
	});

	describe('Anti-Theater: PERFECT_TRACKING', () => {
		it('should detect suspiciously perfect positions', async () => {
			adapter = new MediaPipeAdapter('test', {
				varianceWindowSize: 5,
				minJitter: 0.0001,
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Perfectly identical positions = synthetic
			for (let i = 0; i < 10; i++) {
				adapter.injectFrame(createFacingFrame(1000 + i * 16, { x: 0.5, y: 0.5 }));
			}

			const violations = adapter.getViolations();
			const perfectViolation = violations.find((v) => v.type === 'PERFECT_TRACKING');

			expect(perfectViolation).toBeDefined();
			expect(perfectViolation?.details).toContain('synthetic');
		});

		it('should accept naturally jittery positions', async () => {
			adapter = new MediaPipeAdapter('test', {
				varianceWindowSize: 5,
				minJitter: 0.000001, // Very low threshold to accept natural jitter
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Naturally jittery positions (larger jitter)
			for (let i = 0; i < 10; i++) {
				adapter.injectFrame(
					createFacingFrame(1000 + i * 16, {
						x: 0.5 + (Math.random() - 0.5) * 0.05, // 5% jitter
						y: 0.5 + (Math.random() - 0.5) * 0.05,
					}),
				);
			}

			const violations = adapter.getViolations();
			const perfectViolation = violations.find((v) => v.type === 'PERFECT_TRACKING');

			expect(perfectViolation).toBeUndefined();
		});
	});

	describe('Anti-Theater: CONFIDENCE_FLATLINE', () => {
		it('should detect constant confidence values', async () => {
			adapter = new MediaPipeAdapter('test', {
				varianceWindowSize: 5,
				minConfidenceVariance: 0.001,
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Perfectly constant confidence = mocked
			for (let i = 0; i < 10; i++) {
				adapter.injectFrame({
					...createFacingFrame(1000 + i * 16, {
						x: 0.5 + (Math.random() - 0.5) * 0.01,
						y: 0.5,
					}),
					confidence: 0.9, // Always exactly 0.9
				});
			}

			const violations = adapter.getViolations();
			const flatlineViolation = violations.find((v) => v.type === 'CONFIDENCE_FLATLINE');

			expect(flatlineViolation).toBeDefined();
		});

		it('should accept naturally varying confidence', async () => {
			adapter = new MediaPipeAdapter('test', {
				varianceWindowSize: 5,
				minConfidenceVariance: 0.00001, // Very low threshold to accept natural variance
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Naturally varying confidence (wider range)
			for (let i = 0; i < 10; i++) {
				adapter.injectFrame({
					...createFacingFrame(1000 + i * 16, { x: 0.5, y: 0.5 }),
					confidence: 0.7 + Math.random() * 0.25, // Range from 0.7 to 0.95
				});
			}

			const violations = adapter.getViolations();
			const flatlineViolation = violations.find((v) => v.type === 'CONFIDENCE_FLATLINE');

			expect(flatlineViolation).toBeUndefined();
		});
	});

	describe('Anti-Theater: ANGLE_IMPOSSIBILITY', () => {
		it('should quarantine on impossible palm angles', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			adapter.injectFrame({
				...createFacingFrame(1000, { x: 0.5, y: 0.5 }),
				palmAngle: 200, // Impossible
			});

			expect(adapter.isQuarantined()).toBe(true);

			const violations = adapter.getViolations();
			const angleViolation = violations.find((v) => v.type === 'ANGLE_IMPOSSIBILITY');
			expect(angleViolation).toBeDefined();
			expect(angleViolation?.severity).toBe('quarantine');
		});

		it('should accept valid palm angles', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			adapter.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }, 'Open_Palm', 25, 0.9));
			adapter.injectFrame(createFacingFrame(1016, { x: 0.5, y: 0.5 }, 'Open_Palm', 90, 0.9));
			adapter.injectFrame(createFacingFrame(1032, { x: 0.5, y: 0.5 }, 'Open_Palm', 180, 0.9));

			const violations = adapter.getViolations();
			const angleViolation = violations.find((v) => v.type === 'ANGLE_IMPOSSIBILITY');
			expect(angleViolation).toBeUndefined();
		});
	});

	describe('Anti-Theater: FRAME_TIMING', () => {
		it('should detect perfect frame intervals (replay attack)', async () => {
			adapter = new MediaPipeAdapter('test', {
				varianceWindowSize: 15,
				framingToleranceMs: 0.5,
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Perfectly timed frames = replay
			for (let i = 0; i < 20; i++) {
				adapter.injectFrame({
					...createFacingFrame(1000 + i * 16.666666, {
						x: 0.5 + (Math.random() - 0.5) * 0.01,
						y: 0.5,
					}),
					confidence: 0.85 + Math.random() * 0.1,
				});
			}

			const violations = adapter.getViolations();
			const timingViolation = violations.find((v) => v.type === 'FRAME_TIMING');

			expect(timingViolation).toBeDefined();
			expect(timingViolation?.details).toContain('Replay');
		});
	});

	describe('Quarantine Mechanism', () => {
		it('should quarantine after threshold violations', async () => {
			adapter = new MediaPipeAdapter('test', {
				quarantineThreshold: 3,
				maxTeleport: 0.1,
			});
			await adapter.start();
			adapter.onFrame(() => {});

			// Generate multiple teleportation violations
			adapter.injectFrame(createFacingFrame(1000, { x: 0.1, y: 0.5 }));
			adapter.injectFrame(createFacingFrame(1050, { x: 0.8, y: 0.5 })); // Violation 1
			adapter.injectFrame(createFacingFrame(1100, { x: 0.1, y: 0.5 })); // Violation 2
			adapter.injectFrame(createFacingFrame(1150, { x: 0.9, y: 0.5 })); // Violation 3

			expect(adapter.isQuarantined()).toBe(true);
		});

		it('should not deliver frames when quarantined', async () => {
			adapter = new MediaPipeAdapter('test', { quarantineThreshold: 1, maxTeleport: 0.01 });
			await adapter.start();

			const frames: PointerFrame[] = [];
			adapter.onFrame((frame) => frames.push(frame));

			// Trigger quarantine
			adapter.injectFrame(createFacingFrame(1000, { x: 0.1, y: 0.5 }));
			adapter.injectFrame(createFacingFrame(1050, { x: 0.9, y: 0.5 })); // Triggers quarantine

			// More frames should not be delivered
			adapter.injectFrame(createFacingFrame(1100, { x: 0.5, y: 0.5 }));
			adapter.injectFrame(createFacingFrame(1150, { x: 0.5, y: 0.5 }));

			// Only frames before quarantine
			expect(frames.length).toBeLessThanOrEqual(2);
		});

		it('should allow reset of quarantine', async () => {
			adapter = new MediaPipeAdapter('test', { quarantineThreshold: 1, maxTeleport: 0.01 });
			await adapter.start();
			adapter.onFrame(() => {});

			// Trigger quarantine
			adapter.injectFrame(createFacingFrame(1000, { x: 0.1, y: 0.5 }));
			adapter.injectFrame(createFacingFrame(1050, { x: 0.9, y: 0.5 }));

			expect(adapter.isQuarantined()).toBe(true);

			// Reset
			adapter.resetQuarantine();

			expect(adapter.isQuarantined()).toBe(false);
			expect(adapter.getViolations()).toHaveLength(0);
		});
	});

	describe('Lost Tracking Frames', () => {
		it('should not validate lost tracking frames', async () => {
			await adapter.start();
			adapter.onFrame(() => {});

			// Lost tracking frame
			adapter.injectFrame(
				createDefaultFrame({
					ts: 1000,
					trackingOk: false,
					position: { x: 0.5, y: 0.5 },
				}),
			);

			// Should have no violations (lost frames are not validated)
			expect(adapter.getViolations()).toHaveLength(0);
		});
	});
});

describe('Anti-Theater Config', () => {
	it('should have sensible defaults', () => {
		expect(DEFAULT_ANTI_THEATER.maxVelocity).toBe(0.05);
		expect(DEFAULT_ANTI_THEATER.minJitter).toBe(0.0001);
		expect(DEFAULT_ANTI_THEATER.maxTeleport).toBe(0.15);
		expect(DEFAULT_ANTI_THEATER.quarantineThreshold).toBe(5);
	});

	it('should allow custom config', () => {
		const adapter = new MediaPipeAdapter('test', { maxVelocity: 0.1 });
		expect(adapter.getConfig().maxVelocity).toBe(0.1);
		expect(adapter.getConfig().minJitter).toBe(DEFAULT_ANTI_THEATER.minJitter);
	});
});
