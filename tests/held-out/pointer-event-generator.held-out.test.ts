/**
 * Pointer Event Generator - HELD-OUT TESTS
 *
 * These tests are HIDDEN from AI during development.
 * They validate edge cases that AI might skip or game.
 *
 * Gen87.X3 | Held-Out Defense Protocol | 2026-01-02
 */
import { describe, expect, it } from 'vitest';
import {
	type PointerGeneratorConfig,
	generatePointerEvent,
} from '../../cold/silver/primitives/pointer-event-generator.js';
import type { AdapterTarget, FSMAction } from '../../hot/bronze/src/contracts/schemas.js';

// Helper to create target
function createTarget(overrides: Partial<AdapterTarget> = {}): AdapterTarget {
	return {
		element: null as any,
		bounds: { left: 0, top: 0, width: 1920, height: 1080 },
		...overrides,
	};
}

describe('PointerEventGenerator HELD-OUT Validation', () => {
	const target = createTarget();

	// =========================================================================
	// EDGE CASE: None Action
	// =========================================================================

	it('returns null for none action', () => {
		const action: FSMAction = { action: 'none', state: 'DISARMED' };
		const result = generatePointerEvent(action, target);
		expect(result).toBeNull();
	});

	// =========================================================================
	// EDGE CASE: Coordinate Conversion
	// =========================================================================

	it('converts normalized (0,0) to top-left of bounds', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0, y: 0 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(0);
		expect((result as any).clientY).toBe(0);
	});

	it('converts normalized (1,1) to bottom-right of bounds', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 1, y: 1 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(1920);
		expect((result as any).clientY).toBe(1080);
	});

	it('converts normalized (0.5,0.5) to center of bounds', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(960);
		expect((result as any).clientY).toBe(540);
	});

	it('handles offset bounds correctly', () => {
		const offsetTarget = createTarget({ bounds: { left: 100, top: 50, width: 800, height: 600 } });
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, offsetTarget);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(100 + 400); // left + half width
		expect((result as any).clientY).toBe(50 + 300); // top + half height
	});

	// =========================================================================
	// EDGE CASE: Button Mapping
	// =========================================================================

	it('maps button 0 to buttons=1 (left click)', () => {
		const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).button).toBe(0);
		expect((result as any).buttons).toBe(1);
	});

	it('maps button 1 to buttons=4 (middle click)', () => {
		const action: FSMAction = { action: 'down', state: 'DOWN_NAV', x: 0.5, y: 0.5, button: 1 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).button).toBe(1);
		expect((result as any).buttons).toBe(4);
	});

	it('pointerup sets buttons=0', () => {
		const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).buttons).toBe(0);
	});

	// =========================================================================
	// EDGE CASE: Pointer Types
	// =========================================================================

	it('respects custom pointerId', () => {
		const config: PointerGeneratorConfig = { pointerId: 42, pointerType: 'touch' };
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target, config);
		expect(result).not.toBeNull();
		expect((result as any).pointerId).toBe(42);
	});

	it('respects mouse pointer type', () => {
		const config: PointerGeneratorConfig = { pointerId: 1, pointerType: 'mouse' };
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target, config);
		expect(result).not.toBeNull();
		expect((result as any).pointerType).toBe('mouse');
	});

	it('respects pen pointer type', () => {
		const config: PointerGeneratorConfig = { pointerId: 1, pointerType: 'pen' };
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target, config);
		expect(result).not.toBeNull();
		expect((result as any).pointerType).toBe('pen');
	});

	// =========================================================================
	// EDGE CASE: Event Type Generation
	// =========================================================================

	it('generates pointermove for move action', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect(result!.type).toBe('pointermove');
	});

	it('generates pointerdown for down action', () => {
		const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect(result!.type).toBe('pointerdown');
	});

	it('generates pointerup for up action', () => {
		const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect(result!.type).toBe('pointerup');
	});

	it('generates pointercancel for cancel action', () => {
		const action: FSMAction = { action: 'cancel', state: 'DISARMED' };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect(result!.type).toBe('pointercancel');
	});

	it('generates wheel event for wheel action', () => {
		const action: FSMAction = { action: 'wheel', state: 'ZOOM', deltaY: -120 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect(result!.type).toBe('wheel');
		expect((result as any).deltaY).toBe(-120);
	});

	// =========================================================================
	// EDGE CASE: Wheel Event Details
	// =========================================================================

	it('wheel event has deltaMode=0 (DOM_DELTA_PIXEL)', () => {
		const action: FSMAction = { action: 'wheel', state: 'ZOOM', deltaY: -120 };
		const result = generatePointerEvent(action, target);
		expect((result as any).deltaMode).toBe(0);
	});

	it('wheel event respects ctrl key for zoom', () => {
		const action: FSMAction = { action: 'wheel', state: 'ZOOM', deltaY: -120, ctrl: true };
		const result = generatePointerEvent(action, target);
		expect((result as any).ctrlKey).toBe(true);
	});

	it('wheel event defaults ctrl to false', () => {
		const action: FSMAction = { action: 'wheel', state: 'ZOOM', deltaY: -120 };
		const result = generatePointerEvent(action, target);
		expect((result as any).ctrlKey).toBe(false);
	});

	// =========================================================================
	// EDGE CASE: Pressure Values
	// =========================================================================

	it('pointermove has pressure 0.5', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, target);
		expect((result as any).pressure).toBe(0.5);
	});

	it('pointerdown has pressure 0.5', () => {
		const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect((result as any).pressure).toBe(0.5);
	});

	it('pointerup has pressure 0', () => {
		const action: FSMAction = { action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 };
		const result = generatePointerEvent(action, target);
		expect((result as any).pressure).toBe(0);
	});

	// =========================================================================
	// EDGE CASE: isPrimary Flag
	// =========================================================================

	it('all pointer events have isPrimary=true', () => {
		const actions: FSMAction[] = [
			{ action: 'move', state: 'ARMED', x: 0.5, y: 0.5 },
			{ action: 'down', state: 'DOWN_COMMIT', x: 0.5, y: 0.5, button: 0 },
			{ action: 'up', state: 'ARMED', x: 0.5, y: 0.5, button: 0 },
		];

		for (const action of actions) {
			const result = generatePointerEvent(action, target);
			expect((result as any).isPrimary).toBe(true);
		}
	});

	// =========================================================================
	// EDGE CASE: Zero-Size Bounds
	// =========================================================================

	it('handles zero-width bounds without crashing', () => {
		const zeroTarget = createTarget({ bounds: { left: 0, top: 0, width: 0, height: 1080 } });
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, zeroTarget);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(0);
	});

	it('handles zero-height bounds without crashing', () => {
		const zeroTarget = createTarget({ bounds: { left: 0, top: 0, width: 1920, height: 0 } });
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const result = generatePointerEvent(action, zeroTarget);
		expect(result).not.toBeNull();
		expect((result as any).clientY).toBe(0);
	});

	// =========================================================================
	// EDGE CASE: Out-of-Range Coordinates
	// =========================================================================

	it('handles coordinates < 0', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: -0.5, y: -0.5 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(-960);
		expect((result as any).clientY).toBe(-540);
	});

	it('handles coordinates > 1', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 1.5, y: 1.5 };
		const result = generatePointerEvent(action, target);
		expect(result).not.toBeNull();
		expect((result as any).clientX).toBe(2880);
		expect((result as any).clientY).toBe(1620);
	});
});
