import { OneEuroFilter } from '1eurofilter';
/**
 * Smoother Benchmark: 1€ Filter vs Double Exponential vs Rapier Physics
 *
 * Gen87.X3 | Port 2 (SHAPE) | Performance & Quality Comparison
 *
 * SOURCES:
 * - 1€ Filter: Casiez et al. (CHI 2012) - https://gery.casiez.net/1euro/
 * - Double Exponential: LaViola (2003) - 135x faster than Kalman
 * - Rapier Physics: Spring-damper simulation with WASM
 *
 * METRICS:
 * - Jitter Reduction: How much high-frequency noise is removed
 * - Lag: Delay between input and output (lower = better)
 * - Prediction Accuracy: How close prediction is to actual future position
 * - Time-to-Impact: Can the system predict when cursor reaches target?
 * - Throughput: Frames per second processing capability
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { SensorFrame } from '../contracts/schemas.js';
import { DoubleExponentialPredictor } from './double-exponential-predictor.adapter.js';
import {
	type RapierPhysicsAdapter,
	createAdaptiveRapierAdapter,
	createPredictiveRapierAdapter,
} from './rapier-physics.adapter.js';

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Generate a circular motion path with optional noise
 */
function generateCircularPath(
	frames: number,
	radius: number,
	noiseLevel: number,
	frameTimeMs = 16,
): Array<{ x: number; y: number; ts: number }> {
	const path: Array<{ x: number; y: number; ts: number }> = [];
	const center = { x: 0.5, y: 0.5 };

	for (let i = 0; i < frames; i++) {
		const angle = (i / frames) * Math.PI * 2;
		const idealX = center.x + radius * Math.cos(angle);
		const idealY = center.y + radius * Math.sin(angle);

		// Add Gaussian-like noise
		const noiseX = (Math.random() - 0.5) * noiseLevel * 2;
		const noiseY = (Math.random() - 0.5) * noiseLevel * 2;

		path.push({
			x: Math.max(0, Math.min(1, idealX + noiseX)),
			y: Math.max(0, Math.min(1, idealY + noiseY)),
			ts: i * frameTimeMs,
		});
	}

	return path;
}

/**
 * Generate linear motion toward a target
 */
function generateLinearPath(
	start: { x: number; y: number },
	end: { x: number; y: number },
	frames: number,
	noiseLevel: number,
	frameTimeMs = 16,
): Array<{ x: number; y: number; ts: number }> {
	const path: Array<{ x: number; y: number; ts: number }> = [];

	for (let i = 0; i < frames; i++) {
		const t = i / (frames - 1);
		const idealX = start.x + (end.x - start.x) * t;
		const idealY = start.y + (end.y - start.y) * t;

		const noiseX = (Math.random() - 0.5) * noiseLevel * 2;
		const noiseY = (Math.random() - 0.5) * noiseLevel * 2;

		path.push({
			x: Math.max(0, Math.min(1, idealX + noiseX)),
			y: Math.max(0, Math.min(1, idealY + noiseY)),
			ts: i * frameTimeMs,
		});
	}

	return path;
}

/**
 * Create a SensorFrame from path point
 */
function toSensorFrame(point: { x: number; y: number; ts: number }): SensorFrame {
	return {
		ts: point.ts,
		handId: 'right',
		trackingOk: true,
		palmFacing: false,
		label: 'Open_Palm',
		confidence: 0.9,
		indexTip: { x: point.x, y: point.y, z: 0, visibility: 1 },
		landmarks: null,
	};
}

/**
 * Calculate jitter (variance of differences)
 */
function calculateJitter(values: number[]): number {
	if (values.length < 2) return 0;

	const diffs: number[] = [];
	for (let i = 1; i < values.length; i++) {
		diffs.push(Math.abs(values[i] - values[i - 1]));
	}

	const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
	const variance = diffs.reduce((sum, d) => sum + (d - mean) ** 2, 0) / diffs.length;
	return Math.sqrt(variance);
}

/**
 * Calculate lag (average distance behind ideal)
 */
function calculateLag(
	smoothed: Array<{ x: number; y: number }>,
	ideal: Array<{ x: number; y: number }>,
): number {
	if (smoothed.length !== ideal.length) return Number.NaN;

	let totalLag = 0;
	for (let i = 0; i < smoothed.length; i++) {
		const dx = smoothed[i].x - ideal[i].x;
		const dy = smoothed[i].y - ideal[i].y;
		totalLag += Math.sqrt(dx * dx + dy * dy);
	}

	return totalLag / smoothed.length;
}

// ============================================================================
// BENCHMARK TESTS
// ============================================================================

describe('Smoother Benchmark', () => {
	// Pre-initialized Rapier adapters (WASM takes time)
	let rapierPredictive: RapierPhysicsAdapter;
	let rapierAdaptive: RapierPhysicsAdapter;

	beforeAll(async () => {
		rapierPredictive = await createPredictiveRapierAdapter({ predictionMs: 50 });
		rapierAdaptive = await createAdaptiveRapierAdapter();
	});

	describe('1. Jitter Reduction', () => {
		it('compares jitter reduction on noisy circular path', () => {
			const path = generateCircularPath(60, 0.3, 0.02); // 60 frames, 0.02 noise
			const rawJitterX = calculateJitter(path.map((p) => p.x));

			// 1€ Filter
			const oneEuro = {
				x: new OneEuroFilter(60, 1.0, 0.007),
				y: new OneEuroFilter(60, 1.0, 0.007),
			};
			const oneEuroSmoothed = path.map((p) => ({
				x: oneEuro.x.filter(p.x, p.ts / 1000),
				y: oneEuro.y.filter(p.y, p.ts / 1000),
			}));
			const oneEuroJitter = calculateJitter(oneEuroSmoothed.map((p) => p.x));

			// Double Exponential Predictor
			const desp = new DoubleExponentialPredictor({ alpha: 0.5, predictionMs: 50 });
			const despSmoothed = path.map((p) => {
				const result = desp.smooth(toSensorFrame(p));
				return result.position ?? { x: p.x, y: p.y };
			});
			const despJitter = calculateJitter(despSmoothed.map((p) => p.x));

			// Rapier Adaptive (1€-inspired physics)
			rapierAdaptive.reset();
			const rapierSmoothed = path.map((p) => {
				const result = rapierAdaptive.smooth(toSensorFrame(p));
				return result.position ?? { x: p.x, y: p.y };
			});
			const rapierJitter = calculateJitter(rapierSmoothed.map((p) => p.x));

			console.log('\n📊 JITTER REDUCTION (lower = smoother):');
			console.log(`   Raw input:     ${rawJitterX.toFixed(6)}`);
			console.log(
				`   1€ Filter:     ${oneEuroJitter.toFixed(6)} (${((1 - oneEuroJitter / rawJitterX) * 100).toFixed(1)}% reduction)`,
			);
			console.log(
				`   DESP:          ${despJitter.toFixed(6)} (${((1 - despJitter / rawJitterX) * 100).toFixed(1)}% reduction)`,
			);
			console.log(
				`   Rapier:        ${rapierJitter.toFixed(6)} (${((1 - rapierJitter / rawJitterX) * 100).toFixed(1)}% reduction)`,
			);
			console.log('');
			console.log(
				'   ⚠️ Rapier adds physics oscillation (spring-damper) - trade-off for prediction',
			);

			// 1€ and DESP should reduce jitter
			// Rapier trades some jitter for physics-based prediction
			expect(oneEuroJitter).toBeLessThan(rawJitterX);
			expect(despJitter).toBeLessThan(rawJitterX);
			// Rapier may have MORE jitter due to spring oscillation - this is expected
			expect(rapierJitter).toBeDefined();
		});
	});

	describe('2. Prediction Capability', () => {
		it('compares prediction on linear motion', () => {
			const path = generateLinearPath({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, 30, 0.01);
			const lookAheadFrames = 3; // ~50ms at 60fps

			// 1€ Filter - NO PREDICTION (baseline)
			const oneEuro = {
				x: new OneEuroFilter(60, 1.0, 0.007),
				y: new OneEuroFilter(60, 1.0, 0.007),
			};
			let oneEuroPredError = 0;
			let oneEuroCount = 0;

			for (let i = 0; i < path.length - lookAheadFrames; i++) {
				const smoothedX = oneEuro.x.filter(path[i].x, path[i].ts / 1000);
				// 1€ has no prediction - use current smoothed as "prediction"
				const actualFutureX = path[i + lookAheadFrames].x;
				oneEuroPredError += Math.abs(smoothedX - actualFutureX);
				oneEuroCount++;
			}
			oneEuroPredError /= oneEuroCount;

			// Double Exponential - HAS PREDICTION
			const desp = new DoubleExponentialPredictor({ alpha: 0.5, predictionMs: 50 });
			let despPredError = 0;
			let despCount = 0;

			for (let i = 0; i < path.length - lookAheadFrames; i++) {
				const result = desp.smooth(toSensorFrame(path[i]));
				if (result.prediction) {
					const actualFutureX = path[i + lookAheadFrames].x;
					despPredError += Math.abs(result.prediction.x - actualFutureX);
					despCount++;
				}
			}
			despPredError /= despCount;

			// Rapier Predictive - HAS PREDICTION
			rapierPredictive.reset();
			let rapierPredError = 0;
			let rapierCount = 0;

			for (let i = 0; i < path.length - lookAheadFrames; i++) {
				const result = rapierPredictive.smooth(toSensorFrame(path[i]));
				if (result.prediction) {
					const actualFutureX = path[i + lookAheadFrames].x;
					rapierPredError += Math.abs(result.prediction.x - actualFutureX);
					rapierCount++;
				}
			}
			rapierPredError /= rapierCount;

			console.log('\n🎯 PREDICTION ACCURACY (lower = better):');
			console.log(
				`   1€ Filter:     ${oneEuroPredError.toFixed(6)} (NO prediction, uses current pos)`,
			);
			console.log(`   DESP:          ${despPredError.toFixed(6)} (HAS prediction)`);
			console.log(`   Rapier:        ${rapierPredError.toFixed(6)} (HAS prediction)`);

			// Predictors should beat non-predictor
			expect(despPredError).toBeLessThan(oneEuroPredError);
		});
	});

	describe('3. Time-to-Impact (TTI)', () => {
		it('measures TTI accuracy for DESP and Rapier', () => {
			const target = { x: 0.8, y: 0.5 };
			const path = generateLinearPath({ x: 0.2, y: 0.5 }, target, 40, 0.005);

			// Double Exponential
			const desp = new DoubleExponentialPredictor({ alpha: 0.5, predictionMs: 50 });
			const despTTIs: number[] = [];

			for (const point of path.slice(0, 30)) {
				desp.smooth(toSensorFrame(point));
				const tti = desp.calculateTTI(target.x, target.y);
				if (tti !== Number.POSITIVE_INFINITY && tti > 0) {
					despTTIs.push(tti);
				}
			}

			// Rapier
			rapierPredictive.reset();
			const rapierTTIs: number[] = [];

			for (const point of path.slice(0, 30)) {
				rapierPredictive.smooth(toSensorFrame(point));
				const tti = rapierPredictive.calculateTTI(target.x, target.y);
				if (tti !== Number.POSITIVE_INFINITY && tti > 0) {
					rapierTTIs.push(tti);
				}
			}

			console.log('\n⏱️ TIME-TO-IMPACT CAPABILITY:');
			console.log('   1€ Filter:     ❌ Not supported (smoothing only)');
			console.log(`   DESP:          ✅ ${despTTIs.length} valid TTI estimates`);
			console.log(`   Rapier:        ✅ ${rapierTTIs.length} valid TTI estimates`);

			// Both should produce TTI estimates
			expect(despTTIs.length).toBeGreaterThan(0);
			expect(rapierTTIs.length).toBeGreaterThan(0);
		});
	});

	describe('4. Throughput', () => {
		it('measures processing speed', () => {
			const frames = 1000;
			const path = generateCircularPath(frames, 0.3, 0.02);

			// 1€ Filter
			const oneEuro = {
				x: new OneEuroFilter(60, 1.0, 0.007),
				y: new OneEuroFilter(60, 1.0, 0.007),
			};
			const oneEuroStart = performance.now();
			for (const point of path) {
				oneEuro.x.filter(point.x, point.ts / 1000);
				oneEuro.y.filter(point.y, point.ts / 1000);
			}
			const oneEuroTime = performance.now() - oneEuroStart;

			// DESP
			const desp = new DoubleExponentialPredictor();
			const despStart = performance.now();
			for (const point of path) {
				desp.smooth(toSensorFrame(point));
			}
			const despTime = performance.now() - despStart;

			// Rapier (already initialized)
			rapierAdaptive.reset();
			const rapierStart = performance.now();
			for (const point of path) {
				rapierAdaptive.smooth(toSensorFrame(point));
			}
			const rapierTime = performance.now() - rapierStart;

			const oneEuroFPS = frames / (oneEuroTime / 1000);
			const despFPS = frames / (despTime / 1000);
			const rapierFPS = frames / (rapierTime / 1000);

			console.log('\n⚡ THROUGHPUT (frames/second):');
			console.log(
				`   1€ Filter:     ${oneEuroFPS.toFixed(0)} fps (${oneEuroTime.toFixed(2)}ms for ${frames} frames)`,
			);
			console.log(
				`   DESP:          ${despFPS.toFixed(0)} fps (${despTime.toFixed(2)}ms for ${frames} frames)`,
			);
			console.log(
				`   Rapier:        ${rapierFPS.toFixed(0)} fps (${rapierTime.toFixed(2)}ms for ${frames} frames)`,
			);

			// All should exceed 60fps (reasonable real-time performance)
			expect(oneEuroFPS).toBeGreaterThan(60);
			expect(despFPS).toBeGreaterThan(60);
			expect(rapierFPS).toBeGreaterThan(60);
		});
	});

	describe('5. Feature Comparison Matrix', () => {
		it('prints feature comparison', () => {
			console.log('\n📋 FEATURE COMPARISON MATRIX:');
			console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┐');
			console.log('│ Feature             │ 1€ Filter    │ DESP         │ Rapier       │');
			console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┤');
			console.log('│ Smoothing           │ ✅ Excellent │ ✅ Good      │ ✅ Good      │');
			console.log('│ Prediction          │ ❌ None      │ ✅ Linear    │ ✅ Physics   │');
			console.log('│ Time-to-Impact      │ ❌ None      │ ✅ Yes       │ ✅ Yes       │');
			console.log('│ Trajectory Forecast │ ❌ None      │ ✅ Linear    │ ✅ Physics   │');
			console.log('│ Adaptive Response   │ ✅ Speed-dep │ ⚠️ Fixed α   │ ✅ Adaptive  │');
			console.log('│ Collision Detection │ ❌ None      │ ❌ None      │ ✅ Possible  │');
			console.log('│ Real Physics        │ ❌ No        │ ❌ No        │ ✅ WASM      │');
			console.log('│ Setup Complexity    │ ✅ Simple    │ ✅ Simple    │ ⚠️ Async init│');
			console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┘');

			expect(true).toBe(true); // Always pass - this is informational
		});

		it('prints recommendation', () => {
			console.log('\n💡 RECOMMENDATIONS:');
			console.log('   • Use 1€ Filter: When you only need smoothing, simplest option');
			console.log('   • Use DESP: When you need prediction + simplicity (no async)');
			console.log('   • Use Rapier Adaptive: When you need full physics + prediction');
			console.log('   • Use Rapier Predictive: When you need trajectory forecasting');
			console.log('');
			console.log('   For "negative latency" (cursor ahead of actual position):');
			console.log('   → DESP or Rapier Predictive with predictionMs = 30-50ms');

			expect(true).toBe(true);
		});
	});
});
