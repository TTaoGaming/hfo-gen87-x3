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

	it('should reset state', () => {
		const filter = new OneEuroPrimitive();
		filter.filter(1.0, 1.0, 0.1);
		filter.reset();
		const r = filter.filter(0.5, 0.5, 0.2);
		expect(r.position.x).toBe(0.5);
		expect(r.velocity.x).toBe(0);
	});
});
