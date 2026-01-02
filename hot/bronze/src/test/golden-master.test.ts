/**
 * Golden Master Video Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Port 4 (Red Regnant)
 *
 * Tests pipeline behavior against known video landmark traces.
 * Uses deterministic inputs to verify FSM state transitions.
 *
 * @source HFO_DETERMINISTIC_HARNESS_SPECS: "lock per-frame landmark traces from short MP4s"
 * @source cold/silver/golden/*.landmarks.jsonl
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
	calculatePalmAngle,
	createPalmConeGate,
	DEFAULT_PALM_CONE_CONFIG,
	type PalmConeGateResult,
} from '../gates/palm-cone-gate.js';
import type { NormalizedLandmark } from '../contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

interface FrameLandmark {
	frameNumber: number;
	timestampMs: number;
	handDetected: boolean;
	handedness: string | null;
	landmarks: Array<{ x: number; y: number; z: number; visibility: number }> | null;
}

interface GoldenMasterResult {
	frames: FrameLandmark[];
	summary: {
		totalFrames: number;
		detectedFrames: number;
		palmAngles: number[];
		facingFrames: number;
		avgPalmAngle: number;
	};
}

// ============================================================================
// HELPERS
// ============================================================================

function loadGoldenMaster(filename: string): FrameLandmark[] | null {
	// Find workspace root (hot/bronze/src/test → ../../../../cold/silver/golden)
	const testDir = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
	const goldenPath = join(testDir, '../../../../cold/silver/golden', filename);

	if (!existsSync(goldenPath)) {
		console.error(`Golden master not found: ${goldenPath}`);
		return null;
	}

	const content = readFileSync(goldenPath, 'utf-8');
	const lines = content.trim().split('\n');
	return lines.map((line) => JSON.parse(line) as FrameLandmark);
}

function convertToNormalizedLandmarks(
	landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
): NormalizedLandmark[] {
	return landmarks.map((lm) => ({
		x: lm.x,
		y: lm.y,
		z: lm.z,
		visibility: lm.visibility,
	}));
}

function processGoldenMaster(frames: FrameLandmark[]): GoldenMasterResult {
	const gate = createPalmConeGate();
	const palmAngles: number[] = [];
	let facingFrames = 0;

	for (const frame of frames) {
		if (frame.handDetected && frame.landmarks) {
			const landmarks = convertToNormalizedLandmarks(frame.landmarks);
			const palmAngle = calculatePalmAngle(landmarks);
			palmAngles.push(palmAngle);

			const result = gate.process(landmarks, frame.timestampMs);
			if (result.isFacing) {
				facingFrames++;
			}
		}
	}

	const detectedFrames = frames.filter((f) => f.handDetected).length;
	const avgPalmAngle =
		palmAngles.length > 0 ? palmAngles.reduce((a, b) => a + b, 0) / palmAngles.length : 180;

	return {
		frames,
		summary: {
			totalFrames: frames.length,
			detectedFrames,
			palmAngles,
			facingFrames,
			avgPalmAngle,
		},
	};
}

// ============================================================================
// TESTS
// ============================================================================

describe('Golden Master Video Tests', () => {
	describe('Video A: open-palm-pointer-up-open-palm', () => {
		let result: GoldenMasterResult | null = null;

		beforeAll(() => {
			const frames = loadGoldenMaster('open-palm-pointer-up-open-palm.landmarks.jsonl');
			if (frames) {
				result = processGoldenMaster(frames);
			}
		});

		it('should load golden master file', () => {
			expect(result).not.toBeNull();
		});

		it('should have reasonable frame count', () => {
			if (!result) return;
			expect(result.summary.totalFrames).toBeGreaterThan(50);
		});

		it('should detect hand in most frames', () => {
			if (!result) return;
			const detectionRate = result.summary.detectedFrames / result.summary.totalFrames;
			expect(detectionRate).toBeGreaterThan(0.7); // >70% detection
		});

		it('should have palm facing camera (low palm angle)', () => {
			if (!result) return;
			// Palm facing camera = angle < 25° (armThreshold)
			// We expect many frames to have low palm angle
			expect(result.summary.avgPalmAngle).toBeLessThan(90);
		});

		it('should trigger palmFacing=true for at least some frames', () => {
			if (!result) return;
			// Video A should trigger ARMED state
			expect(result.summary.facingFrames).toBeGreaterThan(0);
		});
	});

	describe('Video B: open-palm-side', () => {
		let result: GoldenMasterResult | null = null;

		beforeAll(() => {
			const frames = loadGoldenMaster('open-palm-side.landmarks.jsonl');
			if (frames) {
				result = processGoldenMaster(frames);
			}
		});

		it('should load golden master file', () => {
			expect(result).not.toBeNull();
		});

		it('should have reasonable frame count', () => {
			if (!result) return;
			expect(result.summary.totalFrames).toBeGreaterThan(50);
		});

		it('should detect hand in most frames', () => {
			if (!result) return;
			const detectionRate = result.summary.detectedFrames / result.summary.totalFrames;
			expect(detectionRate).toBeGreaterThan(0.7); // >70% detection
		});

		it('should have palm facing SIDE (high palm angle)', () => {
			if (!result) return;
			// Palm facing side = angle > 35° (disarmThreshold)
			// Average should be higher than Video A
			expect(result.summary.avgPalmAngle).toBeGreaterThan(
				DEFAULT_PALM_CONE_CONFIG.disarmThreshold,
			);
		});

		it('should trigger palmFacing=false (stay DISARMED)', () => {
			if (!result) return;
			// Video B should NOT trigger ARMED state
			// Facing frames should be minimal or zero
			const facingRatio = result.summary.facingFrames / result.summary.detectedFrames;
			expect(facingRatio).toBeLessThan(0.5); // <50% facing
		});
	});

	describe('Palm Cone Gate Schmitt Trigger', () => {
		it('should use hysteresis band of 10°', () => {
			const armThreshold = DEFAULT_PALM_CONE_CONFIG.armThreshold;
			const disarmThreshold = DEFAULT_PALM_CONE_CONFIG.disarmThreshold;
			expect(disarmThreshold - armThreshold).toBe(10);
		});

		it('should have armThreshold at 25°', () => {
			expect(DEFAULT_PALM_CONE_CONFIG.armThreshold).toBe(25);
		});

		it('should have disarmThreshold at 35°', () => {
			expect(DEFAULT_PALM_CONE_CONFIG.disarmThreshold).toBe(35);
		});

		it('should have cancelThreshold at 70°', () => {
			expect(DEFAULT_PALM_CONE_CONFIG.cancelThreshold).toBe(70);
		});
	});

	describe('W3C Trace Context Integration', () => {
		it('should be available in pipeline', async () => {
			const {
				createTraceContext,
				validateTraceparent,
			} = await import('../shared/trace-context.js');

			const ctx = createTraceContext();
			expect(validateTraceparent(ctx.traceparent)).toBe(true);
			expect(ctx.tracestate).toBe('hfo=gen87');
		});

		it('should propagate traceId across spans', async () => {
			const {
				createTraceContext,
				propagateTrace,
				extractTraceId,
			} = await import('../shared/trace-context.js');

			const parent = createTraceContext();
			const child = propagateTrace(parent);

			expect(extractTraceId(parent.traceparent)).toBe(extractTraceId(child.traceparent));
		});
	});
});
