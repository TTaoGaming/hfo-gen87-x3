/**
 * Pointer Event Generator Tests - MUTATION KILLING
 *
 * Gen87.X3 | Port 4 (Red Regnant) | HARD COVERAGE
 *
 * These tests kill ALL mutation survivors from previous runs.
 * Target: 80%+ mutation score
 */
import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import type { AdapterTarget, FSMAction } from '../../../hot/bronze/src/contracts/schemas.js';
import { generatePointerEvent, DEFAULT_POINTER_CONFIG } from './pointer-event-generator.js';

describe('PointerEventGenerator Primitive', () => {
	const mockTarget: AdapterTarget = {
		id: 'test',
		bounds: { left: 100, top: 100, width: 800, height: 600 },
	};

	// =========================================================================
	// POINTERMOVE TESTS
	// =========================================================================
	describe('pointermove event', () => {
		it('should generate pointermove event with correct type', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.type).toBe('pointermove');
		});

		it('should calculate clientX correctly', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientX).toBe(500); // 100 + 0.5 * 800
		});

		it('should calculate clientY correctly', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientY).toBe(400); // 100 + 0.5 * 600
		});

		it('should set pressure to 0.5 for move', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pressure).toBe(0.5);
		});

		it('should set isPrimary to true for move', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.isPrimary).toBe(true);
		});

		it('should use pointerId from config', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget, { pointerId: 42, pointerType: 'pen' });
			expect(event?.pointerId).toBe(42);
		});

		it('should use pointerType from config', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget, { pointerId: 1, pointerType: 'pen' });
			expect(event?.pointerType).toBe('pen');
		});
	});

	// =========================================================================
	// POINTERDOWN TESTS
	// =========================================================================
	describe('pointerdown event', () => {
		it('should generate pointerdown event with correct type', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.type).toBe('pointerdown');
		});

		it('should set button 0 correctly', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.button).toBe(0);
		});

		it('should set buttons to 1 for button 0 (left)', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.buttons).toBe(1);
		});

		it('should set buttons to 4 for button 1 (middle)', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 1 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.buttons).toBe(4);
		});

		it('should set buttons to 2 for button 2 (right)', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 2 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.buttons).toBe(2);
		});

		it('should set pressure to 0.5 for down', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pressure).toBe(0.5);
		});

		it('should set isPrimary to true for down', () => {
			const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.isPrimary).toBe(true);
		});
	});

	// =========================================================================
	// POINTERUP TESTS - MUTATION SURVIVORS
	// =========================================================================
	describe('pointerup event', () => {
		it('should generate pointerup event with correct type', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.type).toBe('pointerup');
		});

		it('should set buttons to 0 for up', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.buttons).toBe(0);
		});

		it('should set pressure to 0 for up', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pressure).toBe(0);
		});

		it('should set isPrimary to true for up', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.isPrimary).toBe(true);
		});

		it('should preserve button value for up', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 2 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.button).toBe(2);
		});

		it('should calculate coordinates for up', () => {
			const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.25, y: 0.75, button: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientX).toBe(300); // 100 + 0.25 * 800
			expect(event?.clientY).toBe(550); // 100 + 0.75 * 600
		});
	});

	// =========================================================================
	// POINTERCANCEL TESTS
	// =========================================================================
	describe('pointercancel event', () => {
		it('should generate pointercancel event with correct type', () => {
			const action: FSMAction = { action: 'cancel', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.type).toBe('pointercancel');
		});

		it('should include pointerId for cancel', () => {
			const action: FSMAction = { action: 'cancel', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pointerId).toBe(DEFAULT_POINTER_CONFIG.pointerId);
		});

		it('should include pointerType for cancel', () => {
			const action: FSMAction = { action: 'cancel', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pointerType).toBe(DEFAULT_POINTER_CONFIG.pointerType);
		});
	});

	// =========================================================================
	// WHEEL TESTS - MUTATION SURVIVORS
	// =========================================================================
	describe('wheel event', () => {
		it('should generate wheel event with correct type', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.type).toBe('wheel');
		});

		it('should set deltaY from action', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.deltaY).toBe(100);
		});

		it('should set negative deltaY for scroll up', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: -50 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.deltaY).toBe(-50);
		});

		it('should set deltaMode to 0 (DOM_DELTA_PIXEL)', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.deltaMode).toBe(0);
		});

		it('should set ctrlKey to false by default', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.ctrlKey).toBe(false);
		});

		it('should set ctrlKey to true when specified', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100, ctrl: true };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.ctrlKey).toBe(true);
		});

		it('should calculate clientX for wheel', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientX).toBe(500);
		});

		it('should calculate clientY for wheel', () => {
			const action: FSMAction = { action: 'wheel', state: 'ZOOM', x: 0.5, y: 0.5, deltaY: 100 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientY).toBe(400);
		});
	});

	// =========================================================================
	// NONE ACTION TESTS
	// =========================================================================
	describe('none action', () => {
		it('should return null for none action', () => {
			const action: FSMAction = { action: 'none', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			expect(event).toBeNull();
		});

		it('should return exactly null (not undefined)', () => {
			const action: FSMAction = { action: 'none', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			expect(event).toBe(null);
		});

		it('should not return a valid pointer event for none action', () => {
			const action: FSMAction = { action: 'none', state: 'DISARMED' };
			const event = generatePointerEvent(action, mockTarget);
			// If the if-block is emptied, this would be truthy
			expect(event).toBeFalsy();
			expect(event?.type).toBeUndefined();
		});
	});

	// =========================================================================
	// COORDINATE EDGE CASES
	// =========================================================================
	describe('coordinate calculations', () => {
		it('should handle x=0, y=0 (top-left corner)', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0, y: 0 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientX).toBe(100); // bounds.left
			expect(event?.clientY).toBe(100); // bounds.top
		});

		it('should handle x=1, y=1 (bottom-right corner)', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 1, y: 1 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.clientX).toBe(900); // 100 + 800
			expect(event?.clientY).toBe(700); // 100 + 600
		});

		it('should handle negative bounds.left', () => {
			const target: AdapterTarget = {
				id: 'test',
				bounds: { left: -50, top: 0, width: 100, height: 100 },
			};
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, target);
			expect(event?.clientX).toBe(0); // -50 + 0.5 * 100
		});
	});

	// =========================================================================
	// DEFAULT CONFIG TESTS
	// =========================================================================
	describe('default config', () => {
		it('should use default pointerId of 1', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pointerId).toBe(1);
		});

		it('should use default pointerType of touch', () => {
			const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
			const event = generatePointerEvent(action, mockTarget);
			expect(event?.pointerType).toBe('touch');
		});
	});

	// =========================================================================
	// PROPERTY-BASED TESTS (MUTATION KILLERS)
	// =========================================================================
	describe('PROPERTY: coordinate invariants', () => {
		it('clientX is always within target bounds', () => {
			fc.assert(
				fc.property(
					fc.double({ min: 0, max: 1, noNaN: true }),
					fc.double({ min: 0, max: 1, noNaN: true }),
					(x, y) => {
						const action: FSMAction = { action: 'move', state: 'ARMED', x, y };
						const event = generatePointerEvent(action, mockTarget);
						if (event && 'clientX' in event) {
							expect(event.clientX).toBeGreaterThanOrEqual(mockTarget.bounds.left);
							expect(event.clientX).toBeLessThanOrEqual(mockTarget.bounds.left + mockTarget.bounds.width);
						}
					}
				),
				{ numRuns: 100 }
			);
		});

		it('clientY is always within target bounds', () => {
			fc.assert(
				fc.property(
					fc.double({ min: 0, max: 1, noNaN: true }),
					fc.double({ min: 0, max: 1, noNaN: true }),
					(x, y) => {
						const action: FSMAction = { action: 'move', state: 'ARMED', x, y };
						const event = generatePointerEvent(action, mockTarget);
						if (event && 'clientY' in event) {
							expect(event.clientY).toBeGreaterThanOrEqual(mockTarget.bounds.top);
							expect(event.clientY).toBeLessThanOrEqual(mockTarget.bounds.top + mockTarget.bounds.height);
						}
					}
				),
				{ numRuns: 100 }
			);
		});
	});

	describe('PROPERTY: button/buttons consistency', () => {
		it('pointerdown buttons matches button', () => {
			fc.assert(
				fc.property(fc.constantFrom(0, 1, 2), (button) => {
					const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.5, y: 0.5, button };
					const event = generatePointerEvent(action, mockTarget);
					if (event && 'buttons' in event) {
						const expectedButtons = button === 0 ? 1 : button === 1 ? 4 : 2;
						expect(event.buttons).toBe(expectedButtons);
					}
				}),
				{ numRuns: 100 }
			);
		});

		it('pointerup always has buttons=0', () => {
			fc.assert(
				fc.property(fc.constantFrom(0, 1, 2), (button) => {
					const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button };
					const event = generatePointerEvent(action, mockTarget);
					if (event && 'buttons' in event) {
						expect(event.buttons).toBe(0);
					}
				}),
				{ numRuns: 100 }
			);
		});
	});
});
