/**
 * HFO Pipeline - REAL Data Flow Proof
 * ====================================
 * 
 * This is NOT theater. This pipeline:
 * 1. Takes noisy input (simulating MediaPipe jitter)
 * 2. Passes through port-compliant adapters
 * 3. Applies 1€ filter smoothing
 * 4. Outputs smooth coordinates
 * 
 * PROOF: Run mutation testing - if contracts are soft, mutants survive.
 */

import { z } from 'zod';
import { OneEuroSmoother, type SmoothedPoint, type Point2D } from '../../quarantine/one-euro-smoother.js';

// ============================================================================
// PIPELINE SCHEMAS (Contract-Driven)
// ============================================================================

/** Raw noisy input - simulates MediaPipe fingertip */
export const NoisyLandmarkSchema = z.object({
	x: z.number().min(0).max(1),  // Normalized 0-1
	y: z.number().min(0).max(1),
	z: z.number().optional(),
	timestamp: z.number().positive(),
	confidence: z.number().min(0).max(1).default(0.9),
});

export type NoisyLandmark = z.infer<typeof NoisyLandmarkSchema>;

/** Sensed frame - Port 0 output */
export const SensedFrameSchema = z.object({
	_port: z.literal(0),
	_verb: z.literal('SENSE'),
	_ts: z.string(),
	landmark: NoisyLandmarkSchema,
});

export type SensedFrame = z.infer<typeof SensedFrameSchema>;

/** Fused frame - Port 1 output */
export const FusedFrameSchema = z.object({
	_port: z.literal(1),
	_verb: z.literal('FUSE'),
	_ts: z.string(),
	_traceId: z.string(),
	payload: SensedFrameSchema,
});

export type FusedFrame = z.infer<typeof FusedFrameSchema>;

/** Shaped frame - Port 2 output (SMOOTHED) */
export const ShapedFrameSchema = z.object({
	_port: z.literal(2),
	_verb: z.literal('SHAPE'),
	_ts: z.string(),
	raw: z.object({ x: z.number(), y: z.number() }),
	smooth: z.object({ x: z.number(), y: z.number() }),
	jitter: z.number().nonnegative(),
});

export type ShapedFrame = z.infer<typeof ShapedFrameSchema>;

// ============================================================================
// PORT INTERFACES (Polymorphic)
// ============================================================================

export interface Port0Sense {
	sense(input: unknown): SensedFrame;
}

export interface Port1Fuse {
	fuse(input: SensedFrame): FusedFrame;
}

export interface Port2Shape {
	shape(input: FusedFrame): ShapedFrame;
}

// ============================================================================
// REAL ADAPTERS (Not Mocks)
// ============================================================================

/**
 * Port 0: Sense Adapter
 * Tags raw input with port metadata - NO MODIFICATION of data
 */
export class SenseAdapter implements Port0Sense {
	sense(input: unknown): SensedFrame {
		const landmark = NoisyLandmarkSchema.parse(input);
		return {
			_port: 0,
			_verb: 'SENSE',
			_ts: new Date().toISOString(),
			landmark,
		};
	}
}

/**
 * Port 1: Fuse Adapter
 * Wraps sensed data with trace ID for pipeline tracking
 */
export class FuseAdapter implements Port1Fuse {
	private traceCounter = 0;

	fuse(input: SensedFrame): FusedFrame {
		// Validate input matches expected schema
		SensedFrameSchema.parse(input);
		
		return {
			_port: 1,
			_verb: 'FUSE',
			_ts: new Date().toISOString(),
			_traceId: `trace-${++this.traceCounter}`,
			payload: input,
		};
	}
}

/**
 * Port 2: Shape Adapter - USES REAL 1€ FILTER
 * This is the critical piece - actual smoothing happens here
 */
export class ShapeSmootherAdapter implements Port2Shape {
	private smoother: OneEuroSmoother;

	constructor(config?: { freq?: number; beta?: number; minCutoff?: number }) {
		this.smoother = new OneEuroSmoother({
			freq: config?.freq ?? 60,
			beta: config?.beta ?? 0.007,
			minCutoff: config?.minCutoff ?? 1.0,
		});
	}

	shape(input: FusedFrame): ShapedFrame {
		// Validate input
		FusedFrameSchema.parse(input);

		const landmark = input.payload.landmark;
		
		// Apply REAL 1€ filter
		const point: Point2D = {
			x: landmark.x,
			y: landmark.y,
			timestamp: landmark.timestamp,
		};
		
		const smoothed: SmoothedPoint = this.smoother.smooth(point);

		return {
			_port: 2,
			_verb: 'SHAPE',
			_ts: new Date().toISOString(),
			raw: { x: landmark.x, y: landmark.y },
			smooth: { x: smoothed.smoothedX, y: smoothed.smoothedY },
			jitter: smoothed.jitter,
		};
	}

	reset(): void {
		this.smoother.reset();
	}
}

// ============================================================================
// PIPELINE ORCHESTRATOR
// ============================================================================

export class HFOPipeline {
	private port0: Port0Sense;
	private port1: Port1Fuse;
	private port2: Port2Shape;

	constructor(
		port0?: Port0Sense,
		port1?: Port1Fuse,
		port2?: Port2Shape,
	) {
		// Default to real adapters - polymorphism allows swapping
		this.port0 = port0 ?? new SenseAdapter();
		this.port1 = port1 ?? new FuseAdapter();
		this.port2 = port2 ?? new ShapeSmootherAdapter();
	}

	/**
	 * Process a single frame through the pipeline
	 * Input: Raw noisy landmark
	 * Output: Smoothed coordinates
	 */
	process(rawInput: NoisyLandmark): ShapedFrame {
		// Port 0: SENSE - Tag the raw data
		const sensed = this.port0.sense(rawInput);

		// Port 1: FUSE - Wrap with trace ID
		const fused = this.port1.fuse(sensed);

		// Port 2: SHAPE - Apply 1€ smoothing
		const shaped = this.port2.shape(fused);

		return shaped;
	}

	/**
	 * Process multiple frames (batch)
	 */
	processBatch(inputs: NoisyLandmark[]): ShapedFrame[] {
		return inputs.map(input => this.process(input));
	}
}

// ============================================================================
// NOISE GENERATOR (For Testing)
// ============================================================================

/**
 * Generate synthetic noisy data simulating MediaPipe jitter ON A MOVING PATH
 * Real MediaPipe has ~2-5px jitter at 60fps during hand movement
 * 
 * This creates a smooth circular motion with noise overlaid - realistic test case
 */
export function generateNoisyPath(
	numFrames: number,
	centerX: number = 0.5,
	centerY: number = 0.5,
	jitterAmount: number = 0.01,  // ~1% normalized = ~10px on 1000px screen
): NoisyLandmark[] {
	const frames: NoisyLandmark[] = [];
	let ts = Date.now();
	const radius = 0.2; // Circular motion radius

	for (let i = 0; i < numFrames; i++) {
		// Smooth circular path
		const angle = (i / numFrames) * Math.PI * 2;
		const smoothX = centerX + Math.cos(angle) * radius;
		const smoothY = centerY + Math.sin(angle) * radius;

		// Add random jitter
		const noisyX = smoothX + (Math.random() - 0.5) * jitterAmount * 2;
		const noisyY = smoothY + (Math.random() - 0.5) * jitterAmount * 2;

		// Clamp to valid range
		frames.push({
			x: Math.max(0, Math.min(1, noisyX)),
			y: Math.max(0, Math.min(1, noisyY)),
			timestamp: ts,
			confidence: 0.9 + Math.random() * 0.1,
		});
		ts += 16.67; // ~60fps
	}

	return frames;
}

/**
 * Calculate jitter reduction ratio
 * Returns value < 1 if smoothing reduced jitter (good)
 */
export function calculateJitterReduction(
	rawPoints: Array<{ x: number; y: number }>,
	smoothPoints: Array<{ x: number; y: number }>,
): number {
	if (rawPoints.length < 2) return 1;

	const rawJitter = calculateTotalJitter(rawPoints);
	const smoothJitter = calculateTotalJitter(smoothPoints);

	return smoothJitter / rawJitter;
}

function calculateTotalJitter(points: Array<{ x: number; y: number }>): number {
	let total = 0;
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		total += Math.sqrt(dx * dx + dy * dy);
	}
	return total;
}

export default {
	HFOPipeline,
	SenseAdapter,
	FuseAdapter,
	ShapeSmootherAdapter,
	generateNoisyPath,
	calculateJitterReduction,
};
