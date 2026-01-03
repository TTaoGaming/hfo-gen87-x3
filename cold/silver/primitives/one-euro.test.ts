import { describe, expect, it } from 'vitest';
import { OneEuroPrimitive } from './one-euro.js';

describe('OneEuroPrimitive', () => {
	it('should smooth jittery input', () => {
		const filter = new OneEuroPrimitive({ minCutoff: 1.0, beta: 0.0 });
		
		// Constant input
		const r1 = filter.filter(0.5, 0.5, 0.0);
		const r2 = filter.filter(0.5, 0.5, 0.016);
		
		expect(r1.position.x).toBeCloseTo(0.5);
		expect(r2.position.x).toBeCloseTo(0.5);
		
		// Jittery input
		const j1 = filter.filter(0.6, 0.6, 0.032);
		expect(j1.position.x).toBeLessThan(0.6); // Should be smoothed
		expect(j1.position.x).toBeGreaterThan(0.5);
	});

	it('should calculate velocity', () => {
		const filter = new OneEuroPrimitive({ minCutoff: 100, beta: 0.0 }); // High cutoff for fast response
		
		filter.filter(0.0, 0.0, 0.0);
		const r = filter.filter(0.1, 0.1, 0.1); // Move 0.1 in 0.1s -> velocity 1.0
		
		expect(r.velocity.x).toBeGreaterThan(0);
		expect(r.velocity.y).toBeGreaterThan(0);
	});

	it('should handle zero timestamp by clamping to minimum', () => {
		const filter = new OneEuroPrimitive();
		const r = filter.filter(0.5, 0.5, 0.0);
		expect(r.position.x).toBe(0.5);
		expect(r.position.y).toBe(0.5);
	});

	it('should fully reset all internal filters', () => {
		const filter = new OneEuroPrimitive({ minCutoff: 1000, beta: 0.0, dCutoff: 1.0 });
		filter.filter(0, 0, 0);
		filter.filter(0.1, 0.1, 0.1); // dx = 1.0, dxFilter.lastValue = 1.0
		filter.reset();
		
		filter.filter(0.5, 0.5, 0.3); // first call after reset
		const r2 = filter.filter(0.6, 0.6, 0.4); // second call, dx = 1.0
		
		// If dxFilter was reset, dxHat should be exactly 1.0 (first call to dxFilter.filter)
		// If it wasn't reset, it would be smoothed with the previous 1.0, which also gives 1.0...
		// Wait, I need to change the velocity.
		
		filter.reset();
		filter.filter(0, 0, 0);
		filter.filter(1.0, 1.0, 0.1); // dx = 10.0, dxFilter.lastValue = 10.0
		filter.reset();
		
		filter.filter(0, 0, 0);
		const r3 = filter.filter(0.1, 0.1, 0.1); // dx = 1.0
		// If reset worked, dxHat is 1.0.
		// If reset failed, dxHat = dAlpha * 1.0 + (1 - dAlpha) * 10.0 = 0.3858 + 6.142 = 6.5278
		expect(r3.velocity.x).toBeCloseTo(1.0, 5);
	});

	it('should handle duplicate or near-duplicate timestamps', () => {
		const filter = new OneEuroPrimitive();
		filter.filter(0.5, 0.5, 1.0);
		
		// Exact duplicate
		const r1 = filter.filter(0.6, 0.6, 1.0);
		expect(r1.position.x).toBeNaN();

		// Near duplicate (boundary)
		const r2 = filter.filter(0.6, 0.6, 1.00009); 
		expect(r2.position.x).toBeNaN();
		
		// Just above boundary
		const r3 = filter.filter(0.6, 0.6, 1.00011);
		expect(r3.position.x).not.toBeNaN();
	});

	it('should increase cutoff as speed increases', () => {
		const filter = new OneEuroPrimitive({ minCutoff: 1.0, beta: 1.0 });
		filter.filter(0, 0, 0);
		
		// Slow move
		const r1 = filter.filter(0.01, 0.01, 0.1);
		const pos1 = r1.position.x;
		
		filter.reset();
		filter.filter(0, 0, 0);
		// Fast move
		const r2 = filter.filter(1.0, 1.0, 0.1);
		const pos2 = r2.position.x;
		
		// Fast move should have higher alpha (less smoothing)
		expect(pos2).toBeGreaterThan(pos1);
	});

	it('should adapt smoothing based on speed (beta)', () => {
		const filterLowBeta = new OneEuroPrimitive({ minCutoff: 1.0, beta: 0.0 });
		const filterHighBeta = new OneEuroPrimitive({ minCutoff: 1.0, beta: 100.0 });
		
		// Initial samples
		filterLowBeta.filter(0, 0, 0);
		filterHighBeta.filter(0, 0, 0);
		
		// Move fast
		const rLow = filterLowBeta.filter(1.0, 1.0, 0.016);
		const rHigh = filterHighBeta.filter(1.0, 1.0, 0.016);
		
		// High beta should have less smoothing (closer to 1.0)
		expect(rHigh.position.x).toBeGreaterThan(rLow.position.x);
	});

	it('should correctly calculate alpha and apply low-pass filter', () => {
		// Manual calculation for verification:
		// cutoff = 1.0, dt = 0.016
		// tau = 1.0 / (2 * PI * 1.0) = 0.1591549
		// alpha = 1.0 / (1.0 + 0.1591549 / 0.016) = 1.0 / (1.0 + 9.94718) = 0.091347
		// result = alpha * 1.0 + (1 - alpha) * 0.0 = 0.091347
		
		const filter = new OneEuroPrimitive({ minCutoff: 1.0, beta: 0.0, dCutoff: 1.0 });
		filter.filter(0, 0, 0); // lastX = 0, lastTs = 0
		const r = filter.filter(1.0, 1.0, 0.016);
		
		expect(r.position.x).toBeCloseTo(0.091347, 5);
		expect(r.position.y).toBeCloseTo(0.091347, 5);
	});

	it('should correctly calculate velocity and apply smoothing', () => {
		// Use high minCutoff to minimize position smoothing while testing velocity smoothing
		const filter = new OneEuroPrimitive({ minCutoff: 1000, beta: 0.0, dCutoff: 1.0 });
		filter.filter(0, 0, 0);
		
		// First move: sets dxFilter.lastValue = 1.0
		filter.filter(0.1, 0.2, 0.1);
		
		// Second move: applies smoothing
		// dt = 0.1, dx = (0.3 - 0.1) / 0.1 = 2.0
		// dAlpha = 0.3858
		// dxHat = 0.3858 * 2.0 + (1 - 0.3858) * 1.0 = 1.3858
		const r = filter.filter(0.3, 0.6, 0.2);
		
		expect(r.velocity.x).toBeCloseTo(1.386, 2);
		expect(r.velocity.y).toBeCloseTo(2.772, 2);
	});
});
