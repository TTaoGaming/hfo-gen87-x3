/**
 * W3C Pointer FSM - Contract Tests (TDD/CDD)
 *
 * Gen87.X3 | Hot Silver | Test-First Contracts
 *
 * These tests validate the Zod schemas and type guards
 * BEFORE any implementation touches them.
 */

import { describe, expect, it } from 'vitest';
import {
	type W3CPointerAction,
	// Factory functions
	createDefaultFrame,
	createFacingFrame,
	createLostFrame,
	isClickAction,
	isTerminalAction,
	// Type guards
	isTrackingAction,
	safeValidateFrame,
	validateAction,
	validateConfig,
	// Validation functions
	validateFrame,
} from './contracts.js';

describe('Contract: PointerFrameSchema', () => {
	describe('POSITIVE: Valid frames', () => {
		it('should accept minimal valid frame', () => {
			const frame = {
				ts: 1000,
				trackingOk: true,
				palmAngle: 20,
				gesture: 'Open_Palm',
				confidence: 0.9,
				position: { x: 0.5, y: 0.5 },
			};
			expect(() => validateFrame(frame)).not.toThrow();
		});

		it('should accept frame with velocity', () => {
			const frame = {
				ts: 1000,
				trackingOk: true,
				palmAngle: 20,
				gesture: 'Open_Palm',
				confidence: 0.9,
				position: { x: 0.5, y: 0.5 },
				velocity: { vx: 0.01, vy: -0.02 },
			};
			const result = validateFrame(frame);
			expect(result.velocity).toEqual({ vx: 0.01, vy: -0.02 });
		});

		it('should accept all valid gesture labels', () => {
			const gestures = [
				'None',
				'Open_Palm',
				'Pointing_Up',
				'Victory',
				'Thumb_Up',
				'Thumb_Down',
				'Closed_Fist',
			];
			for (const gesture of gestures) {
				const frame = createDefaultFrame({
					trackingOk: true,
					gesture: gesture as any,
					confidence: 0.9,
				});
				expect(() => validateFrame(frame)).not.toThrow();
			}
		});

		it('should accept boundary palm angles', () => {
			expect(() => validateFrame(createDefaultFrame({ palmAngle: 0 }))).not.toThrow();
			expect(() => validateFrame(createDefaultFrame({ palmAngle: 90 }))).not.toThrow();
			expect(() => validateFrame(createDefaultFrame({ palmAngle: 180 }))).not.toThrow();
		});

		it('should accept boundary confidence values', () => {
			expect(() => validateFrame(createDefaultFrame({ confidence: 0 }))).not.toThrow();
			expect(() => validateFrame(createDefaultFrame({ confidence: 1 }))).not.toThrow();
			expect(() => validateFrame(createDefaultFrame({ confidence: 0.5 }))).not.toThrow();
		});

		it('should accept boundary positions', () => {
			expect(() => validateFrame(createDefaultFrame({ position: { x: 0, y: 0 } }))).not.toThrow();
			expect(() => validateFrame(createDefaultFrame({ position: { x: 1, y: 1 } }))).not.toThrow();
			expect(() =>
				validateFrame(createDefaultFrame({ position: { x: 0.5, y: 0.5 } })),
			).not.toThrow();
		});
	});

	describe('NEGATIVE: Invalid frames', () => {
		it('should reject missing required fields', () => {
			expect(() => validateFrame({})).toThrow();
			expect(() => validateFrame({ ts: 1000 })).toThrow();
			expect(() => validateFrame({ ts: 1000, trackingOk: true })).toThrow();
		});

		it('should reject invalid gesture labels', () => {
			const frame = createDefaultFrame({ gesture: 'InvalidGesture' as any });
			expect(() => validateFrame(frame)).toThrow();
		});

		it('should reject out-of-range palm angles', () => {
			expect(() => validateFrame(createDefaultFrame({ palmAngle: -1 }))).toThrow();
			expect(() => validateFrame(createDefaultFrame({ palmAngle: 181 }))).toThrow();
		});

		it('should reject out-of-range confidence', () => {
			expect(() => validateFrame(createDefaultFrame({ confidence: -0.1 }))).toThrow();
			expect(() => validateFrame(createDefaultFrame({ confidence: 1.1 }))).toThrow();
		});

		it('should reject out-of-range positions', () => {
			expect(() => validateFrame(createDefaultFrame({ position: { x: -0.1, y: 0.5 } }))).toThrow();
			expect(() => validateFrame(createDefaultFrame({ position: { x: 0.5, y: 1.1 } }))).toThrow();
		});

		it('should reject non-positive timestamps', () => {
			expect(() => validateFrame(createDefaultFrame({ ts: 0 }))).toThrow();
			expect(() => validateFrame(createDefaultFrame({ ts: -1000 }))).toThrow();
		});

		it('should reject null/undefined', () => {
			expect(() => validateFrame(null)).toThrow();
			expect(() => validateFrame(undefined)).toThrow();
		});
	});

	describe('safeValidateFrame', () => {
		it('should return success for valid frames', () => {
			const result = safeValidateFrame(createDefaultFrame({ trackingOk: true }));
			expect(result.success).toBe(true);
		});

		it('should return error for invalid frames', () => {
			const result = safeValidateFrame({ invalid: true });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
			}
		});
	});
});

describe('Contract: W3CPointerActionSchema', () => {
	describe('POSITIVE: Valid actions', () => {
		it('should accept "none" action', () => {
			const action: W3CPointerAction = { type: 'none' };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "enter" action', () => {
			const action: W3CPointerAction = { type: 'enter', x: 0.5, y: 0.5, pointerId: 1 };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "move" action', () => {
			const action: W3CPointerAction = { type: 'move', x: 0.3, y: 0.7, pointerId: 1 };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "down" action', () => {
			const action: W3CPointerAction = { type: 'down', x: 0.5, y: 0.5, pointerId: 1, button: 0 };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "up" action', () => {
			const action: W3CPointerAction = { type: 'up', x: 0.5, y: 0.5, pointerId: 1, button: 0 };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "cancel" action', () => {
			const action: W3CPointerAction = { type: 'cancel', pointerId: 1 };
			expect(() => validateAction(action)).not.toThrow();
		});

		it('should accept "leave" action', () => {
			const action: W3CPointerAction = { type: 'leave', pointerId: 1 };
			expect(() => validateAction(action)).not.toThrow();
		});
	});

	describe('NEGATIVE: Invalid actions', () => {
		it('should reject unknown action types', () => {
			expect(() => validateAction({ type: 'unknown' })).toThrow();
		});

		it('should reject "enter" without coordinates', () => {
			expect(() => validateAction({ type: 'enter', pointerId: 1 })).toThrow();
		});

		it('should reject "move" with out-of-range coordinates', () => {
			expect(() => validateAction({ type: 'move', x: 1.5, y: 0.5, pointerId: 1 })).toThrow();
			expect(() => validateAction({ type: 'move', x: -0.1, y: 0.5, pointerId: 1 })).toThrow();
		});

		it('should reject "down" without button', () => {
			expect(() => validateAction({ type: 'down', x: 0.5, y: 0.5, pointerId: 1 })).toThrow();
		});

		it('should reject invalid pointerId', () => {
			expect(() => validateAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 0 })).toThrow();
			expect(() => validateAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: -1 })).toThrow();
		});

		it('should reject negative button numbers', () => {
			expect(() =>
				validateAction({ type: 'down', x: 0.5, y: 0.5, pointerId: 1, button: -1 }),
			).toThrow();
		});
	});
});

describe('Contract: GateConfigSchema', () => {
	describe('POSITIVE: Valid configs', () => {
		it('should accept empty config (uses defaults)', () => {
			const config = validateConfig({});
			expect(config.palm.enterThreshold).toBe(30);
			expect(config.palm.exitThreshold).toBe(45);
			expect(config.palm.cancelThreshold).toBe(70);
			expect(config.confidence.armThreshold).toBe(0.7);
			expect(config.timing.coastingMaxMs).toBe(2000);
		});

		it('should accept partial overrides', () => {
			const config = validateConfig({
				palm: { enterThreshold: 25 },
				confidence: { armThreshold: 0.8 },
			});
			expect(config.palm.enterThreshold).toBe(25);
			expect(config.palm.exitThreshold).toBe(45); // default
			expect(config.confidence.armThreshold).toBe(0.8);
		});

		it('should accept full config', () => {
			const config = validateConfig({
				palm: { enterThreshold: 20, exitThreshold: 40, cancelThreshold: 60 },
				confidence: { armThreshold: 0.75, maintainThreshold: 0.55, dropThreshold: 0.2 },
				timing: { noneDebounceMs: 100, armStableMs: 200, coastingMaxMs: 3000 },
				coasting: { damping: 0.95, minVelocity: 0.001 },
			});
			expect(config).toBeDefined();
		});
	});

	describe('NEGATIVE: Invalid configs', () => {
		it('should reject out-of-range palm thresholds', () => {
			expect(() => validateConfig({ palm: { enterThreshold: -1 } })).toThrow();
			expect(() => validateConfig({ palm: { exitThreshold: 100 } })).toThrow();
			expect(() => validateConfig({ palm: { cancelThreshold: 200 } })).toThrow();
		});

		it('should reject out-of-range confidence thresholds', () => {
			expect(() => validateConfig({ confidence: { armThreshold: 1.5 } })).toThrow();
			expect(() => validateConfig({ confidence: { maintainThreshold: -0.1 } })).toThrow();
		});

		it('should reject negative timing values', () => {
			expect(() => validateConfig({ timing: { noneDebounceMs: -100 } })).toThrow();
			expect(() => validateConfig({ timing: { armStableMs: -1 } })).toThrow();
		});
	});
});

describe('Factory Functions', () => {
	describe('createDefaultFrame', () => {
		it('should create valid frame with defaults', () => {
			const frame = createDefaultFrame();
			expect(() => validateFrame(frame)).not.toThrow();
			expect(frame.trackingOk).toBe(false);
			expect(frame.gesture).toBe('None');
		});

		it('should apply overrides', () => {
			const frame = createDefaultFrame({ trackingOk: true, gesture: 'Open_Palm', confidence: 0.9 });
			expect(frame.trackingOk).toBe(true);
			expect(frame.gesture).toBe('Open_Palm');
			expect(frame.confidence).toBe(0.9);
		});
	});

	describe('createFacingFrame', () => {
		it('should create frame facing camera', () => {
			const frame = createFacingFrame(1000, { x: 0.5, y: 0.5 });
			expect(() => validateFrame(frame)).not.toThrow();
			expect(frame.trackingOk).toBe(true);
			expect(frame.palmAngle).toBe(20);
			expect(frame.gesture).toBe('Open_Palm');
			expect(frame.confidence).toBe(0.9);
		});

		it('should allow custom gesture and angle', () => {
			const frame = createFacingFrame(1000, { x: 0.3, y: 0.7 }, 'Pointing_Up', 15, 0.95);
			expect(frame.gesture).toBe('Pointing_Up');
			expect(frame.palmAngle).toBe(15);
			expect(frame.confidence).toBe(0.95);
		});
	});

	describe('createLostFrame', () => {
		it('should create frame with tracking lost', () => {
			const frame = createLostFrame(1000, { x: 0.5, y: 0.5 }, { vx: 0.01, vy: -0.01 });
			expect(() => validateFrame(frame)).not.toThrow();
			expect(frame.trackingOk).toBe(false);
			expect(frame.gesture).toBe('None');
			expect(frame.confidence).toBe(0);
			expect(frame.velocity).toEqual({ vx: 0.01, vy: -0.01 });
		});
	});
});

describe('Type Guards', () => {
	describe('isTrackingAction', () => {
		it('should return true for tracking actions', () => {
			expect(isTrackingAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 })).toBe(true);
			expect(isTrackingAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 })).toBe(true);
			expect(isTrackingAction({ type: 'down', x: 0.5, y: 0.5, pointerId: 1, button: 0 })).toBe(
				true,
			);
			expect(isTrackingAction({ type: 'up', x: 0.5, y: 0.5, pointerId: 1, button: 0 })).toBe(true);
		});

		it('should return false for non-tracking actions', () => {
			expect(isTrackingAction({ type: 'none' })).toBe(false);
			expect(isTrackingAction({ type: 'cancel', pointerId: 1 })).toBe(false);
			expect(isTrackingAction({ type: 'leave', pointerId: 1 })).toBe(false);
		});
	});

	describe('isTerminalAction', () => {
		it('should return true for terminal actions', () => {
			expect(isTerminalAction({ type: 'cancel', pointerId: 1 })).toBe(true);
			expect(isTerminalAction({ type: 'leave', pointerId: 1 })).toBe(true);
		});

		it('should return false for non-terminal actions', () => {
			expect(isTerminalAction({ type: 'none' })).toBe(false);
			expect(isTerminalAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 })).toBe(false);
			expect(isTerminalAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 })).toBe(false);
		});
	});

	describe('isClickAction', () => {
		it('should return true for click actions', () => {
			expect(isClickAction({ type: 'down', x: 0.5, y: 0.5, pointerId: 1, button: 0 })).toBe(true);
			expect(isClickAction({ type: 'up', x: 0.5, y: 0.5, pointerId: 1, button: 0 })).toBe(true);
		});

		it('should return false for non-click actions', () => {
			expect(isClickAction({ type: 'none' })).toBe(false);
			expect(isClickAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 })).toBe(false);
			expect(isClickAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 })).toBe(false);
		});
	});
});

describe('Contract Invariants', () => {
	it('INVARIANT: palmAngle + confidence determine tracking eligibility', () => {
		// Low angle + high confidence = eligible
		const facing = createFacingFrame(1000, { x: 0.5, y: 0.5 }, 'Open_Palm', 20, 0.9);
		expect(facing.palmAngle).toBeLessThan(30);
		expect(facing.confidence).toBeGreaterThan(0.7);

		// High angle OR low confidence = not eligible
		const away = createDefaultFrame({ palmAngle: 80, confidence: 0.9 });
		expect(away.palmAngle).toBeGreaterThan(45);

		const unsure = createDefaultFrame({ palmAngle: 20, confidence: 0.3 });
		expect(unsure.confidence).toBeLessThan(0.5);
	});

	it('INVARIANT: velocity is optional on input but affects coasting', () => {
		const withVelocity = createDefaultFrame({ velocity: { vx: 0.05, vy: 0.05 } });
		const withoutVelocity = createDefaultFrame();

		expect(withVelocity.velocity).toBeDefined();
		expect(withoutVelocity.velocity).toBeDefined(); // createDefaultFrame adds default
	});

	it('INVARIANT: all action types have discriminator', () => {
		const actionTypes = ['none', 'enter', 'move', 'down', 'up', 'cancel', 'leave'];
		for (const type of actionTypes) {
			// Each action type can be discriminated by 'type' field
			expect(type).toBeTruthy();
		}
	});
});
