/**
 * Pipeline Integration - HELD-OUT TESTS
 *
 * These tests are HIDDEN from AI during development.
 * They validate end-to-end pipeline behavior.
 *
 * Gen87.X3 | Held-Out Defense Protocol | 2026-01-02
 */
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_DESP_CONFIG,
	createInitialState,
	processDESP,
} from '../../cold/silver/primitives/double-exponential.js';
import { OneEuroPrimitive } from '../../cold/silver/primitives/one-euro.js';
import { generatePointerEvent } from '../../cold/silver/primitives/pointer-event-generator.js';
import type { AdapterTarget, FSMAction } from '../../hot/bronze/src/contracts/schemas.js';

describe('Pipeline Integration HELD-OUT Validation', () => {
	// =========================================================================
	// INTEGRATION: OneEuro → DESP Chain
	// =========================================================================

	it('OneEuro output can feed DESP input', () => {
		const oneEuro = new OneEuroPrimitive();
		const despState = createInitialState();

		// Simulate 10 frames of movement
		for (let i = 0; i < 10; i++) {
			const x = 0.3 + i * 0.05;
			const y = 0.5;
			const ts = 1000 + i * 16;

			// Stage 2: OneEuro smoothing
			const smoothed = oneEuro.filter(x, y, ts);

			// Skip if NaN (duplicate timestamp)
			if (Number.isNaN(smoothed.position.x)) continue;

			// Stage 3: DESP prediction
			const predicted = processDESP(
				smoothed.position.x,
				smoothed.position.y,
				ts,
				despState,
				DEFAULT_DESP_CONFIG,
			);

			// Outputs should be finite
			expect(Number.isFinite(predicted.smoothed.x)).toBe(true);
			expect(Number.isFinite(predicted.predicted.x)).toBe(true);
		}
	});

	// =========================================================================
	// INTEGRATION: Full Pipeline Simulation
	// =========================================================================

	it('simulates full gesture pipeline without crashes', () => {
		const oneEuro = new OneEuroPrimitive();
		const despState = createInitialState();
		const target: AdapterTarget = {
			element: null as any,
			bounds: { left: 0, top: 0, width: 1920, height: 1080 },
		};

		const events: any[] = [];

		// Simulate 60 frames (1 second at 60fps)
		for (let i = 0; i < 60; i++) {
			const ts = 1000 + i * 16;
			const rawX = 0.3 + Math.sin(i * 0.1) * 0.2;
			const rawY = 0.5 + Math.cos(i * 0.1) * 0.1;

			// Stage 2: Smooth
			const smoothed = oneEuro.filter(rawX, rawY, ts);
			if (Number.isNaN(smoothed.position.x)) continue;

			// Stage 3: Predict
			const predicted = processDESP(
				smoothed.position.x,
				smoothed.position.y,
				ts,
				despState,
				DEFAULT_DESP_CONFIG,
			);

			// Stage 4: FSM (simulated - use predicted position)
			const fsmAction: FSMAction = {
				action: 'move',
				state: 'ARMED',
				x: predicted.predicted.x,
				y: predicted.predicted.y,
			};

			// Stage 5: Generate pointer event
			const pointerEvent = generatePointerEvent(fsmAction, target);
			if (pointerEvent) {
				events.push(pointerEvent);
			}
		}

		// Should generate events
		expect(events.length).toBeGreaterThan(0);

		// All events should have valid coordinates
		for (const event of events) {
			expect(Number.isFinite(event.clientX)).toBe(true);
			expect(Number.isFinite(event.clientY)).toBe(true);
			expect(event.clientX).toBeGreaterThanOrEqual(0);
			expect(event.clientX).toBeLessThanOrEqual(1920);
		}
	});

	// =========================================================================
	// INTEGRATION: Jitter Reduction Through Pipeline
	// =========================================================================

	it('pipeline reduces jitter compared to raw input', () => {
		const oneEuro = new OneEuroPrimitive();
		const despState = createInitialState();

		const rawPositions: number[] = [];
		const pipelinePositions: number[] = [];
		const baseX = 0.5;

		// Add jittery input
		for (let i = 0; i < 100; i++) {
			const jitter = (Math.random() - 0.5) * 0.1;
			const rawX = baseX + jitter;
			const ts = 1000 + i * 16;

			rawPositions.push(rawX);

			const smoothed = oneEuro.filter(rawX, baseX, ts);
			if (Number.isNaN(smoothed.position.x)) continue;

			const predicted = processDESP(
				smoothed.position.x,
				smoothed.position.y,
				ts,
				despState,
				DEFAULT_DESP_CONFIG,
			);

			pipelinePositions.push(predicted.smoothed.x);
		}

		// Calculate variance
		const rawVariance = calculateVariance(rawPositions);
		const pipelineVariance = calculateVariance(pipelinePositions);

		// Pipeline should reduce variance (jitter)
		expect(pipelineVariance).toBeLessThan(rawVariance);
	});

	// =========================================================================
	// INTEGRATION: Latency Compensation
	// =========================================================================

	it('prediction leads smoothed position when moving', () => {
		const oneEuro = new OneEuroPrimitive();
		const despState = createInitialState();

		let predictionLeads = 0;
		let smoothedLeads = 0;

		// Consistent rightward movement
		for (let i = 0; i < 50; i++) {
			const x = 0.1 + i * 0.015;
			const ts = 1000 + i * 16;

			const smoothed = oneEuro.filter(x, 0.5, ts);
			if (Number.isNaN(smoothed.position.x)) continue;

			const result = processDESP(
				smoothed.position.x,
				smoothed.position.y,
				ts,
				despState,
				DEFAULT_DESP_CONFIG,
			);

			if (i > 5) {
				// Skip initial frames
				if (result.predicted.x > result.smoothed.x) {
					predictionLeads++;
				} else {
					smoothedLeads++;
				}
			}
		}

		// When moving right, prediction should usually lead
		expect(predictionLeads).toBeGreaterThan(smoothedLeads);
	});

	// =========================================================================
	// EDGE CASE: Reset Isolation
	// =========================================================================

	it('resetting one stage does not affect others', () => {
		const oneEuro = new OneEuroPrimitive();
		const despState = createInitialState();

		// Process some frames
		for (let i = 0; i < 20; i++) {
			const smoothed = oneEuro.filter(0.5 + i * 0.01, 0.5, 1000 + i * 16);
			if (!Number.isNaN(smoothed.position.x)) {
				processDESP(
					smoothed.position.x,
					smoothed.position.y,
					1000 + i * 16,
					despState,
					DEFAULT_DESP_CONFIG,
				);
			}
		}

		// Reset only OneEuro
		oneEuro.reset();

		// DESP should still have state
		expect(despState.initialized).toBe(true);
		expect(despState.lastTs).not.toBeNull();

		// Process one more frame - DESP should work with fresh OneEuro output
		const newSmoothed = oneEuro.filter(0.5, 0.5, 2000);
		expect(newSmoothed.position.x).toBe(0.5); // First frame returns input

		const predicted = processDESP(0.5, 0.5, 2000, despState, DEFAULT_DESP_CONFIG);
		expect(Number.isFinite(predicted.smoothed.x)).toBe(true);
	});
});

// Helper function
function calculateVariance(values: number[]): number {
	if (values.length === 0) return 0;
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	return values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / values.length;
}
