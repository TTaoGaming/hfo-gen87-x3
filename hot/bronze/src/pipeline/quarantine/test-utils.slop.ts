// @ts-nocheck
/**
 * Test Utilities for HFO Pipeline
 * ================================
 *
 * These functions are for TESTING ONLY - not production code.
 * They generate synthetic data to verify pipeline behavior.
 *
 * @module test-utils
 * @internal
 */

import type { NoisyLandmark } from './hfo-pipeline.js';

/**
 * Generate synthetic noisy data simulating MediaPipe jitter ON A MOVING PATH
 * Real MediaPipe has ~2-5px jitter at 60fps during hand movement
 *
 * This creates a smooth circular motion with noise overlaid - realistic test case
 *
 * @param numFrames - Number of frames to generate
 * @param centerX - X center of circular path (0-1 normalized)
 * @param centerY - Y center of circular path (0-1 normalized)
 * @param jitterAmount - Amount of random noise (0.01 = ~1% = ~10px on 1000px screen)
 * @returns Array of noisy landmarks following a circular path
 *
 * @example
 * ```ts
 * const frames = generateNoisyPath(100, 0.5, 0.5, 0.01);
 * // Process through pipeline to verify smoothing
 * ```
 */
export function generateNoisyPath(
	numFrames: number,
	centerX = 0.5,
	centerY = 0.5,
	jitterAmount = 0.01,
): NoisyLandmark[] {
	if (numFrames <= 0) {
		return [];
	}

	const frames: NoisyLandmark[] = [];
	let ts = Date.now();
	const radius = 0.2;

	for (let i = 0; i < numFrames; i++) {
		const angle = (i / numFrames) * Math.PI * 2;
		const smoothX = centerX + Math.cos(angle) * radius;
		const smoothY = centerY + Math.sin(angle) * radius;

		const noisyX = smoothX + (Math.random() - 0.5) * jitterAmount * 2;
		const noisyY = smoothY + (Math.random() - 0.5) * jitterAmount * 2;

		frames.push({
			x: Math.max(0, Math.min(1, noisyX)),
			y: Math.max(0, Math.min(1, noisyY)),
			timestamp: ts,
			confidence: 0.9 + Math.random() * 0.1,
		});
		ts += 16.67;
	}

	return frames;
}

/**
 * Calculate total path length (sum of distances between consecutive points)
 * Used to measure jitter - more jitter = longer path for same motion
 *
 * @param points - Array of x,y coordinates
 * @returns Total path length
 */
export function calculateTotalJitter(points: Array<{ x: number; y: number }>): number {
	if (points.length < 2) {
		return 0;
	}

	let total = 0;
	for (let i = 1; i < points.length; i++) {
		const curr = points[i]!;
		const prev = points[i - 1]!;
		const dx = curr.x - prev.x;
		const dy = curr.y - prev.y;
		total += Math.sqrt(dx * dx + dy * dy);
	}
	return total;
}

/**
 * Calculate jitter reduction ratio
 * Returns value < 1 if smoothing reduced jitter (good)
 *
 * @param rawPoints - Original noisy coordinates
 * @param smoothPoints - Smoothed coordinates
 * @returns Ratio of smooth/raw path length. < 1 means smoothing helped.
 *
 * @example
 * ```ts
 * const ratio = calculateJitterReduction(rawPath, smoothedPath);
 * expect(ratio).toBeLessThan(1); // Smoothing reduced jitter
 * ```
 */
export function calculateJitterReduction(
	rawPoints: Array<{ x: number; y: number }>,
	smoothPoints: Array<{ x: number; y: number }>,
): number {
	if (rawPoints.length < 2) {
		return 1;
	}

	const rawJitter = calculateTotalJitter(rawPoints);
	const smoothJitter = calculateTotalJitter(smoothPoints);

	if (rawJitter === 0) {
		return 1;
	}

	return smoothJitter / rawJitter;
}

/**
 * Generate a linear path with noise (for testing edge detection)
 */
export function generateLinearPath(
	numFrames: number,
	startX = 0.1,
	startY = 0.5,
	endX = 0.9,
	endY = 0.5,
	jitterAmount = 0.01,
): NoisyLandmark[] {
	if (numFrames <= 0) {
		return [];
	}

	const frames: NoisyLandmark[] = [];
	let ts = Date.now();

	for (let i = 0; i < numFrames; i++) {
		const t = i / Math.max(1, numFrames - 1);
		const smoothX = startX + (endX - startX) * t;
		const smoothY = startY + (endY - startY) * t;

		const noisyX = smoothX + (Math.random() - 0.5) * jitterAmount * 2;
		const noisyY = smoothY + (Math.random() - 0.5) * jitterAmount * 2;

		frames.push({
			x: Math.max(0, Math.min(1, noisyX)),
			y: Math.max(0, Math.min(1, noisyY)),
			timestamp: ts,
			confidence: 0.95,
		});
		ts += 16.67;
	}

	return frames;
}

/**
 * Generate stationary point with jitter (for testing stability)
 */
export function generateStationaryJitter(
	numFrames: number,
	x = 0.5,
	y = 0.5,
	jitterAmount = 0.02,
): NoisyLandmark[] {
	if (numFrames <= 0) {
		return [];
	}

	const frames: NoisyLandmark[] = [];
	let ts = Date.now();

	for (let i = 0; i < numFrames; i++) {
		frames.push({
			x: Math.max(0, Math.min(1, x + (Math.random() - 0.5) * jitterAmount * 2)),
			y: Math.max(0, Math.min(1, y + (Math.random() - 0.5) * jitterAmount * 2)),
			timestamp: ts,
			confidence: 0.95,
		});
		ts += 16.67;
	}

	return frames;
}
