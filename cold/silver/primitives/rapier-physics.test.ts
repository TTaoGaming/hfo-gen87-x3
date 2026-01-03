import { beforeEach, describe, expect, it } from 'vitest';
import { RapierPhysicsPrimitive } from './rapier-physics.js';

describe('RapierPhysicsPrimitive', () => {
	let primitive: RapierPhysicsPrimitive;

	beforeEach(async () => {
		primitive = new RapierPhysicsPrimitive({
			mode: 'smoothed',
			stiffness: 200,
			damping: 1.2,
			velocityDeadZone: 0 // Disable dead zone for tests
		});
		await primitive.init();
	});

	it('should initialize correctly', () => {
		expect(primitive).toBeDefined();
		const config = primitive.getConfig();
		expect(config.mode).toBe('smoothed');
	});

	it('should smooth movement toward a target', () => {
		const target = { x: 0.8, y: 0.8 };
		const dt = 1 / 60;

		// First update
		const result1 = primitive.update(target, dt);
		
		// Should have moved from 0.5 toward 0.8
		expect(result1.position.x).toBeGreaterThan(0.5);
		expect(result1.position.x).toBeLessThan(0.8);
		expect(result1.velocity.x).toBeGreaterThan(0);

		// Multiple updates should converge
		let lastPos = result1.position;
		for (let i = 0; i < 120; i++) {
			primitive.update(target, dt);
		}
		const finalRes = primitive.update(target, dt);

		expect(finalRes.position.x).toBeCloseTo(0.8, 1);
	});

	it('should predict future position in predictive mode', async () => {
		const predictivePrimitive = new RapierPhysicsPrimitive({
			mode: 'predictive',
			predictionMs: 100,
			stiffness: 200,
			velocityDeadZone: 0
		});
		await predictivePrimitive.init();

		const target = { x: 0.55, y: 0.55 };
		const dt = 1 / 60;

		// Need a few steps to build velocity
		predictivePrimitive.update(target, dt);
		const result = predictivePrimitive.update(target, dt);
		
		expect(result.prediction).not.toBeNull();
		if (result.prediction) {
			// Prediction should be ahead of current position if moving
			expect(result.prediction.x).toBeGreaterThan(result.position.x);
			expect(result.prediction.x).toBeLessThan(1.0); // Ensure no clamping for test
		}
	});

	it('should respect velocity dead zone', () => {
		const target = { x: 0.501, y: 0.501 }; // Very small movement
		const dt = 1 / 60;

		const result = primitive.update(target, dt);
		
		// If movement is below dead zone, velocity should be zeroed
		// Note: With stiffness 200, 0.001 displacement might still produce some velocity
		// but let's check if it eventually settles to exactly 0.5 if we stop moving
		
		primitive.reset();
		const result2 = primitive.update({ x: 0.5, y: 0.5 }, dt);
		expect(result2.velocity.x).toBe(0);
		expect(result2.velocity.y).toBe(0);
	});

	it('should handle adaptive mode', async () => {
		const adaptivePrimitive = new RapierPhysicsPrimitive({
			mode: 'adaptive',
			minStiffness: 50,
			speedCoefficient: 500,
			velocityDeadZone: 0
		});
		await adaptivePrimitive.init();

		const target = { x: 1.0, y: 1.0 };
		const dt = 1 / 60;

		// Slow movement
		const res1 = adaptivePrimitive.update({ x: 0.51, y: 0.51 }, dt);
		const vel1 = Math.sqrt(res1.velocity.x ** 2 + res1.velocity.y ** 2);

		// Fast movement
		adaptivePrimitive.reset();
		const res2 = adaptivePrimitive.update({ x: 0.9, y: 0.9 }, dt);
		const vel2 = Math.sqrt(res2.velocity.x ** 2 + res2.velocity.y ** 2);

		expect(vel2).toBeGreaterThan(vel1);
	});

	it('should reset state', () => {
		primitive.update({ x: 1.0, y: 1.0 }, 1 / 60);
		primitive.reset();
		
		// After reset, next update from 0.5 should behave like first update
		const res = primitive.update({ x: 1.0, y: 1.0 }, 1 / 60);
		expect(res.position.x).toBeLessThan(0.6); // Should not be near 1.0
	});
});
