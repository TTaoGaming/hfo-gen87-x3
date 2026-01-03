/**
 * Pointer Event Generator - PURE PRIMITIVE
 *
 * Gen87.X3 | cold/silver/primitives | MUTATION TESTABLE
 *
 * EXEMPLAR: W3C Pointer Events Level 3
 *
 * This is the PURE LOGIC to map FSM actions to W3C Pointer Event descriptors.
 */
import type {
    AdapterTarget,
    FSMAction,
    PointerEventOut,
} from '../../../hot/bronze/src/contracts/schemas.js';

export interface PointerGeneratorConfig {
	pointerId: number;
	pointerType: 'mouse' | 'pen' | 'touch';
}

export const DEFAULT_POINTER_CONFIG: PointerGeneratorConfig = {
	pointerId: 1,
	pointerType: 'touch',
};

/**
 * Pure function to generate a PointerEventOut from an FSMAction
 */
export function generatePointerEvent(
	action: FSMAction,
	target: AdapterTarget,
	config: PointerGeneratorConfig = DEFAULT_POINTER_CONFIG
): PointerEventOut | null {
	if (action.action === 'none') {
		return null;
	}

	// Convert normalized (0-1) coordinates to target coordinates
	const clientX = 'x' in action ? target.bounds.left + action.x * target.bounds.width : 0;
	const clientY = 'y' in action ? target.bounds.top + action.y * target.bounds.height : 0;

	const { pointerId, pointerType } = config;

	switch (action.action) {
		case 'move':
			return {
				type: 'pointermove',
				pointerId,
				clientX,
				clientY,
				pointerType,
				pressure: 0.5,
				isPrimary: true,
			};

		case 'down':
			return {
				type: 'pointerdown',
				pointerId,
				clientX,
				clientY,
				pointerType,
				button: action.button,
				buttons: action.button === 0 ? 1 : action.button === 1 ? 4 : 2,
				pressure: 0.5,
				isPrimary: true,
			};

		case 'up':
			return {
				type: 'pointerup',
				pointerId,
				clientX,
				clientY,
				pointerType,
				button: action.button,
				buttons: 0,
				pressure: 0,
				isPrimary: true,
			};

		case 'cancel':
			return {
				type: 'pointercancel',
				pointerId,
				pointerType,
			};

		case 'wheel':
			return {
				type: 'wheel',
				deltaY: action.deltaY,
				deltaMode: 0, // DOM_DELTA_PIXEL
				ctrlKey: action.ctrl ?? false,
				clientX,
				clientY,
			};

		default:
			return null;
	}
}
