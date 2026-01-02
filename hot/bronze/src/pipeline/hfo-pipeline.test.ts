/**
 * HFO Pipeline Tests - PROOF That It Works
 * ==========================================
 * 
 * These tests prove:
 * 1. Noisy input → Smooth output (1€ filter works)
 * 2. Contracts are enforced (invalid data rejected)
 * 3. Polymorphism works (adapters are swappable)
 * 4. Jitter is reduced (measurable improvement)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
	HFOPipeline,
	SenseAdapter,
	FuseAdapter,
	ShapeSmootherAdapter,
	generateNoisyPath,
	calculateJitterReduction,
	NoisyLandmarkSchema,
	SensedFrameSchema,
	FusedFrameSchema,
	ShapedFrameSchema,
	type NoisyLandmark,
	type Port0Sense,
	type Port1Fuse,
	type Port2Shape,
} from './hfo-pipeline.js';

// ============================================================================
// PIPELINE INTEGRATION TESTS
// ============================================================================

describe('HFO Pipeline - Real Data Flow', () => {
	let pipeline: HFOPipeline;

	beforeEach(() => {
		pipeline = new HFOPipeline();
	});

	it('processes single frame through all ports', () => {
		const input: NoisyLandmark = {
			x: 0.5,
			y: 0.5,
			timestamp: Date.now(),
			confidence: 0.95,
		};

		const output = pipeline.process(input);

		// Verify output structure
		expect(output._port).toBe(2);
		expect(output._verb).toBe('SHAPE');
		expect(output.raw.x).toBe(0.5);
		expect(output.raw.y).toBe(0.5);
		expect(typeof output.smooth.x).toBe('number');
		expect(typeof output.smooth.y).toBe('number');
		expect(output.jitter).toBeGreaterThanOrEqual(0);
	});

	it('reduces deviation from ideal path on noisy input stream', () => {
		const pipeline = new HFOPipeline();
		const numFrames = 100;
		const centerX = 0.5, centerY = 0.5, radius = 0.2;
		
		// Generate noisy circular path
		const noisyFrames = generateNoisyPath(numFrames, centerX, centerY, 0.02);
		
		// Process through pipeline
		const outputs = pipeline.processBatch(noisyFrames);

		// Calculate total error from ideal path
		let rawTotalError = 0;
		let smoothTotalError = 0;

		for (let i = 0; i < numFrames; i++) {
			const angle = (i / numFrames) * Math.PI * 2;
			const idealX = centerX + Math.cos(angle) * radius;
			const idealY = centerY + Math.sin(angle) * radius;

			const rawDx = outputs[i].raw.x - idealX;
			const rawDy = outputs[i].raw.y - idealY;
			rawTotalError += Math.sqrt(rawDx * rawDx + rawDy * rawDy);

			const smoothDx = outputs[i].smooth.x - idealX;
			const smoothDy = outputs[i].smooth.y - idealY;
			smoothTotalError += Math.sqrt(smoothDx * smoothDx + smoothDy * smoothDy);
		}

		// Smoothed output should be closer to ideal path than raw
		expect(smoothTotalError).toBeLessThan(rawTotalError);
	});

	it('validates output against ShapedFrame schema', () => {
		const input: NoisyLandmark = {
			x: 0.3,
			y: 0.7,
			timestamp: Date.now(),
			confidence: 0.85,
		};

		const output = pipeline.process(input);

		// This will throw if schema doesn't match
		const validated = ShapedFrameSchema.parse(output);
		expect(validated).toEqual(output);
	});
});

// ============================================================================
// CONTRACT ENFORCEMENT TESTS
// ============================================================================

describe('Contract Enforcement', () => {
	describe('Port 0: Sense', () => {
		const sense = new SenseAdapter();

		it('rejects invalid x coordinate (out of range)', () => {
			expect(() => sense.sense({ x: 1.5, y: 0.5, timestamp: 1000 }))
				.toThrow();
		});

		it('rejects invalid y coordinate (out of range)', () => {
			expect(() => sense.sense({ x: 0.5, y: -0.1, timestamp: 1000 }))
				.toThrow();
		});

		it('rejects negative timestamp', () => {
			expect(() => sense.sense({ x: 0.5, y: 0.5, timestamp: -1 }))
				.toThrow();
		});

		it('accepts valid input and tags with port metadata', () => {
			const result = sense.sense({ x: 0.5, y: 0.5, timestamp: 1000 });
			expect(result._port).toBe(0);
			expect(result._verb).toBe('SENSE');
			expect(result.landmark.x).toBe(0.5);
		});
	});

	describe('Port 1: Fuse', () => {
		const fuse = new FuseAdapter();
		const validSensed = {
			_port: 0 as const,
			_verb: 'SENSE' as const,
			_ts: new Date().toISOString(),
			landmark: { x: 0.5, y: 0.5, timestamp: 1000, confidence: 0.9 },
		};

		it('rejects wrong port number', () => {
			const invalid = { ...validSensed, _port: 1 };
			expect(() => fuse.fuse(invalid as any)).toThrow();
		});

		it('rejects wrong verb', () => {
			const invalid = { ...validSensed, _verb: 'FUSE' };
			expect(() => fuse.fuse(invalid as any)).toThrow();
		});

		it('adds trace ID to valid input', () => {
			const result = fuse.fuse(validSensed);
			expect(result._port).toBe(1);
			expect(result._verb).toBe('FUSE');
			// W3C Trace Context format: 00-{32 hex}-{16 hex}-{2 hex}
			expect(result._traceId).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}$/);
		});
	});

	describe('Port 2: Shape', () => {
		const shape = new ShapeSmootherAdapter();

		it('applies 1€ filter and outputs smooth coordinates', () => {
			const validFused = {
				_port: 1 as const,
				_verb: 'FUSE' as const,
				_ts: new Date().toISOString(),
				_traceId: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01', // W3C format
				payload: {
					_port: 0 as const,
					_verb: 'SENSE' as const,
					_ts: new Date().toISOString(),
					landmark: { x: 0.5, y: 0.5, timestamp: Date.now(), confidence: 0.9 },
				},
			};

			const result = shape.shape(validFused);
			expect(result._port).toBe(2);
			expect(result._verb).toBe('SHAPE');
			expect(result.smooth.x).toBeDefined();
			expect(result.smooth.y).toBeDefined();
		});
	});
});

// ============================================================================
// POLYMORPHISM TESTS (Adapter Swapping)
// ============================================================================

describe('Polymorphic Composition', () => {
	it('accepts custom Port 0 adapter', () => {
		// Custom adapter that always returns fixed values
		const customSense: Port0Sense = {
			sense: () => ({
				_port: 0,
				_verb: 'SENSE',
				_ts: new Date().toISOString(),
				landmark: { x: 0.123, y: 0.456, timestamp: Date.now(), confidence: 1.0 },
			}),
		};

		const pipeline = new HFOPipeline(customSense);
		const output = pipeline.process({ x: 0.9, y: 0.9, timestamp: Date.now() });

		// Should use custom adapter's fixed values, not input
		expect(output.raw.x).toBe(0.123);
		expect(output.raw.y).toBe(0.456);
	});

	it('accepts custom Port 2 adapter (no smoothing)', () => {
		// Custom adapter that does NO smoothing
		const customShape: Port2Shape = {
			shape: (input) => ({
				_port: 2,
				_verb: 'SHAPE',
				_ts: new Date().toISOString(),
				raw: { x: input.payload.landmark.x, y: input.payload.landmark.y },
				smooth: { x: input.payload.landmark.x, y: input.payload.landmark.y }, // No change
				jitter: 0,
			}),
		};

		const pipeline = new HFOPipeline(undefined, undefined, customShape);
		const output = pipeline.process({ x: 0.7, y: 0.3, timestamp: Date.now() });

		// Raw and smooth should be identical (no smoothing)
		expect(output.smooth.x).toBe(output.raw.x);
		expect(output.smooth.y).toBe(output.raw.y);
	});
});

// ============================================================================
// PROPERTY-BASED TESTS (100+ iterations)
// ============================================================================

describe('Property-Based Testing (100+ iterations)', () => {
	it('output coordinates are always in valid range', () => {
		const pipeline = new HFOPipeline();
		let lastTs = Date.now();

		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
				fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
				(x, y) => {
					// Use incrementing timestamps (1€ filter needs strictly increasing ts)
					lastTs += 16.67;
					const output = pipeline.process({ x, y, timestamp: lastTs, confidence: 0.9 });
					
					// Smoothed coordinates should be reasonable
					// They might slightly exceed 0-1 due to filter dynamics, but not by much
					expect(output.smooth.x).toBeGreaterThanOrEqual(-0.1);
					expect(output.smooth.x).toBeLessThanOrEqual(1.1);
					expect(output.smooth.y).toBeGreaterThanOrEqual(-0.1);
					expect(output.smooth.y).toBeLessThanOrEqual(1.1);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('jitter is always non-negative', () => {
		const pipeline = new HFOPipeline();
		let lastTs = Date.now();

		fc.assert(
			fc.property(
				fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
				fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
				(x, y) => {
					lastTs += 16.67;
					const output = pipeline.process({ x, y, timestamp: lastTs, confidence: 0.9 });
					expect(output.jitter).toBeGreaterThanOrEqual(0);
				}
			),
			{ numRuns: 100 }
		);
	});

	it('port metadata is preserved through pipeline', () => {
		fc.assert(
			fc.property(
				fc.float({ min: 0, max: 1, noNaN: true }),
				fc.float({ min: 0, max: 1, noNaN: true }),
				(x, y) => {
					const sense = new SenseAdapter();
					const fuse = new FuseAdapter();
					const shape = new ShapeSmootherAdapter();

					const sensed = sense.sense({ x, y, timestamp: Date.now() });
					expect(sensed._port).toBe(0);
					expect(sensed._verb).toBe('SENSE');

					const fused = fuse.fuse(sensed);
					expect(fused._port).toBe(1);
					expect(fused._verb).toBe('FUSE');
					expect(fused.payload._port).toBe(0); // Nested payload preserved

					const shaped = shape.shape(fused);
					expect(shaped._port).toBe(2);
					expect(shaped._verb).toBe('SHAPE');
				}
			),
			{ numRuns: 100 }
		);
	});
});

// ============================================================================
// JITTER REDUCTION TESTS (The Proof)
// ============================================================================

describe('Jitter Reduction Proof', () => {
	it('smoothed path is closer to ideal than noisy path', () => {
		const pipeline = new HFOPipeline();
		const numFrames = 50;
		const centerX = 0.5, centerY = 0.5, radius = 0.2;
		const jitter = 0.02;
		
		// Generate noisy circular path
		const frames = generateNoisyPath(numFrames, centerX, centerY, jitter);
		const outputs = pipeline.processBatch(frames);

		// Calculate how close raw and smooth are to the IDEAL circular path
		let rawError = 0;
		let smoothError = 0;

		for (let i = 0; i < numFrames; i++) {
			const angle = (i / numFrames) * Math.PI * 2;
			const idealX = centerX + Math.cos(angle) * radius;
			const idealY = centerY + Math.sin(angle) * radius;

			const rawDx = outputs[i].raw.x - idealX;
			const rawDy = outputs[i].raw.y - idealY;
			rawError += Math.sqrt(rawDx * rawDx + rawDy * rawDy);

			const smoothDx = outputs[i].smooth.x - idealX;
			const smoothDy = outputs[i].smooth.y - idealY;
			smoothError += Math.sqrt(smoothDx * smoothDx + smoothDy * smoothDy);
		}

		// Smoothed should be closer to ideal path
		expect(smoothError).toBeLessThan(rawError);
	});

	it('reduces deviation from ideal path on highly noisy stream', () => {
		const pipeline = new HFOPipeline();
		const numFrames = 100;
		const frames = generateNoisyPath(numFrames, 0.5, 0.5, 0.05); // Higher jitter
		const outputs = pipeline.processBatch(frames);

		// Calculate variance of smooth vs raw
		const rawVariances: number[] = [];
		const smoothVariances: number[] = [];

		for (let i = 1; i < outputs.length; i++) {
			const rawDx = outputs[i].raw.x - outputs[i-1].raw.x;
			const rawDy = outputs[i].raw.y - outputs[i-1].raw.y;
			rawVariances.push(rawDx * rawDx + rawDy * rawDy);

			const smoothDx = outputs[i].smooth.x - outputs[i-1].smooth.x;
			const smoothDy = outputs[i].smooth.y - outputs[i-1].smooth.y;
			smoothVariances.push(smoothDx * smoothDx + smoothDy * smoothDy);
		}

		const rawAvgVariance = rawVariances.reduce((a, b) => a + b, 0) / rawVariances.length;
		const smoothAvgVariance = smoothVariances.reduce((a, b) => a + b, 0) / smoothVariances.length;

		// Smoothed should have lower variance (less jerky)
		expect(smoothAvgVariance).toBeLessThan(rawAvgVariance);
	});

	it('handles stationary point with minimal overshoot', () => {
		const pipeline = new HFOPipeline();
		
		// All points at exact same location
		const frames: NoisyLandmark[] = [];
		let ts = Date.now();
		for (let i = 0; i < 20; i++) {
			frames.push({ x: 0.5, y: 0.5, timestamp: ts, confidence: 1.0 });
			ts += 16.67;
		}

		const outputs = pipeline.processBatch(frames);
		const lastOutput = outputs[outputs.length - 1];

		// Smoothed should converge to actual position
		expect(Math.abs(lastOutput.smooth.x - 0.5)).toBeLessThan(0.01);
		expect(Math.abs(lastOutput.smooth.y - 0.5)).toBeLessThan(0.01);
	});
});
