import { describe, expect, it } from 'vitest';
import type { AdapterTarget, FSMAction } from '../../../hot/bronze/src/contracts/schemas.js';
import { generatePointerEvent } from './pointer-event-generator.js';

describe('PointerEventGenerator Primitive', () => {
	const mockTarget: AdapterTarget = {
		id: 'test',
		bounds: { left: 100, top: 100, width: 800, height: 600 },
	};

	it('should generate pointermove event', () => {
		const action: FSMAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		const event = generatePointerEvent(action, mockTarget);
		
		expect(event?.type).toBe('pointermove');
		expect(event?.clientX).toBe(500); // 100 + 0.5 * 800
		expect(event?.clientY).toBe(400); // 100 + 0.5 * 600
	});

	it('should generate pointerdown event', () => {
		const action: FSMAction = { action: 'down', state: 'DOWN_COMMIT', x: 0.1, y: 0.1, button: 0 };
		const event = generatePointerEvent(action, mockTarget);
		
		expect(event?.type).toBe('pointerdown');
		expect(event?.button).toBe(0);
		expect(event?.buttons).toBe(1);
	});

	it('should return null for none action', () => {
		const action: FSMAction = { action: 'none', state: 'DISARMED' };
		const event = generatePointerEvent(action, mockTarget);
		expect(event).toBeNull();
	});
});
