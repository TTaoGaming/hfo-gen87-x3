/**
 * PointerEventAdapter Unit Tests
 *
 * Gen87.X3 | VALIDATE Phase | TDD RED→GREEN
 *
 * MUTATION KILLER TESTS for pointer-event.adapter.ts
 * Target: 80% mutation score threshold
 *
 * W3C PointerEvents spec: https://www.w3.org/TR/pointerevents/
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { AdapterTarget, FSMAction } from '../contracts/schemas.js';
import { PointerEventAdapter } from './pointer-event.adapter.js';
import { MockDOMAdapter } from './quarantine/mock-dom.adapter.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createTarget(overrides: Partial<AdapterTarget['bounds']> = {}): AdapterTarget {
	return {
		type: 'element',
		bounds: {
			width: 800,
			height: 600,
			left: 100,
			top: 50,
			...overrides,
		},
	};
}

// ============================================================================
// PointerEventAdapter Tests
// ============================================================================

describe('PointerEventAdapter', () => {
	let adapter: PointerEventAdapter;
	let target: AdapterTarget;

	beforeEach(() => {
		adapter = new PointerEventAdapter();
		target = createTarget();
	});

	describe('construction', () => {
		it('should create with default pointerId=1 and pointerType=touch', () => {
			const defaultAdapter = new PointerEventAdapter();
			expect(defaultAdapter.pointerId).toBe(1);
		});

		it('should accept custom pointerId', () => {
			const customAdapter = new PointerEventAdapter(5);
			expect(customAdapter.pointerId).toBe(5);
		});

		it('should accept custom pointerType', () => {
			const mouseAdapter = new PointerEventAdapter(1, 'mouse');
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = mouseAdapter.emit(moveAction, target);
			expect(result?.pointerType).toBe('mouse');
		});

		it('should accept pen pointerType', () => {
			const penAdapter = new PointerEventAdapter(1, 'pen');
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = penAdapter.emit(moveAction, target);
			expect(result?.pointerType).toBe('pen');
		});
	});

	describe('emit() - action:none', () => {
		it('should return null for action:none', () => {
			const noneAction: FSMAction = { action: 'none' };
			const result = adapter.emit(noneAction, target);
			expect(result).toBeNull();
		});

		// MUTATION KILLER: Ensure return null is executed, not just block removed
		it('should return exactly null (not undefined) for action:none', () => {
			const noneAction: FSMAction = { action: 'none' };
			const result = adapter.emit(noneAction, target);
			expect(result).toBe(null);
			expect(result).not.toBe(undefined);
		});

		// MUTATION KILLER: Early return should skip coordinate calculation
		// If the early return is removed, the function would try to access action.x/y
		// which don't exist on action:none, causing undefined behavior
		it('should handle action:none without x/y properties gracefully', () => {
			// action:none has NO x/y - this tests that early return happens
			// before coordinate calculation tries to access them
			const noneAction: FSMAction = { action: 'none' };
			// Should not throw when accessing non-existent properties
			expect(() => adapter.emit(noneAction, target)).not.toThrow();
			// And should return null
			expect(adapter.emit(noneAction, target)).toBeNull();
		});
	});

	describe('emit() - action:move', () => {
		it('should emit pointermove event', () => {
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = adapter.emit(moveAction, target);
			expect(result).not.toBeNull();
			expect(result?.type).toBe('pointermove');
		});

		it('should convert normalized coords to target coords', () => {
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = adapter.emit(moveAction, target);
			// clientX = left + x * width = 100 + 0.5 * 800 = 500
			// clientY = top + y * height = 50 + 0.5 * 600 = 350
			expect(result?.clientX).toBe(500);
			expect(result?.clientY).toBe(350);
		});

		it('should handle edge coordinates (0,0)', () => {
			const moveAction: FSMAction = { action: 'move', x: 0, y: 0 };
			const result = adapter.emit(moveAction, target);
			expect(result?.clientX).toBe(100); // left
			expect(result?.clientY).toBe(50); // top
		});

		it('should handle edge coordinates (1,1)', () => {
			const moveAction: FSMAction = { action: 'move', x: 1, y: 1 };
			const result = adapter.emit(moveAction, target);
			expect(result?.clientX).toBe(900); // left + width
			expect(result?.clientY).toBe(650); // top + height
		});

		it('should include W3C required properties', () => {
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = adapter.emit(moveAction, target);
			expect(result).toMatchObject({
				type: 'pointermove',
				pointerId: 1,
				pointerType: 'touch',
				pressure: 0.5,
				isPrimary: true,
			});
		});

		it('should calculate dynamic pressure based on velocity', () => {
			const moveAction: FSMAction = {
				action: 'move',
				x: 0.5,
				y: 0.5,
				velocity: { x: 2, y: 0 },
			};
			const result = adapter.emit(moveAction, target);
			// pressure = 0.5 + 2 * 0.05 = 0.6
			expect(result?.pressure).toBeCloseTo(0.6);
		});
	});

	describe('emit() - action:down', () => {
		it('should emit pointerdown event', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(downAction, target);
			expect(result?.type).toBe('pointerdown');
		});

		it('should set button=0 for left click', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(downAction, target);
			expect(result?.button).toBe(0);
			expect(result?.buttons).toBe(1); // Left button flag
		});

		it('should set button=1 for middle click', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 1 };
			const result = adapter.emit(downAction, target);
			expect(result?.button).toBe(1);
			expect(result?.buttons).toBe(4); // Middle button flag
		});

		it('should set button=2 for right click', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 2 };
			const result = adapter.emit(downAction, target);
			expect(result?.button).toBe(2);
			expect(result?.buttons).toBe(2); // Right button flag
		});

		it('should include pressure for pointerdown', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(downAction, target);
			expect(result?.pressure).toBe(0.7);
		});

		// MUTATION KILLER: isPrimary must be true for primary pointer
		it('should set isPrimary=true for pointerdown', () => {
			const downAction: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(downAction, target);
			expect(result?.isPrimary).toBe(true);
		});
	});

	describe('emit() - action:up', () => {
		it('should emit pointerup event', () => {
			const upAction: FSMAction = { action: 'up', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(upAction, target);
			expect(result?.type).toBe('pointerup');
		});

		it('should set buttons=0 on pointerup', () => {
			const upAction: FSMAction = { action: 'up', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(upAction, target);
			expect(result?.buttons).toBe(0);
		});

		it('should set pressure=0 on pointerup', () => {
			const upAction: FSMAction = { action: 'up', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(upAction, target);
			expect(result?.pressure).toBe(0);
		});

		// MUTATION KILLER: isPrimary must be true for primary pointer
		it('should set isPrimary=true for pointerup', () => {
			const upAction: FSMAction = { action: 'up', x: 0.5, y: 0.5, button: 0 };
			const result = adapter.emit(upAction, target);
			expect(result?.isPrimary).toBe(true);
		});
	});

	describe('emit() - action:cancel', () => {
		it('should emit pointercancel event', () => {
			const cancelAction: FSMAction = { action: 'cancel' };
			const result = adapter.emit(cancelAction, target);
			expect(result?.type).toBe('pointercancel');
		});

		it('should include pointerId on cancel', () => {
			const cancelAction: FSMAction = { action: 'cancel' };
			const result = adapter.emit(cancelAction, target);
			expect(result?.pointerId).toBe(1);
		});

		it('should include pointerType on cancel', () => {
			const cancelAction: FSMAction = { action: 'cancel' };
			const result = adapter.emit(cancelAction, target);
			expect(result?.pointerType).toBe('touch');
		});
	});

	describe('emit() - action:wheel', () => {
		it('should emit wheel event', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: -120 };
			const result = adapter.emit(wheelAction, target);
			expect(result?.type).toBe('wheel');
		});

		it('should set deltaY from action', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: -120 };
			const result = adapter.emit(wheelAction, target);
			expect(result?.deltaY).toBe(-120);
		});

		it('should set deltaMode=0 (DOM_DELTA_PIXEL)', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: 100 };
			const result = adapter.emit(wheelAction, target);
			expect(result?.deltaMode).toBe(0);
		});

		it('should center wheel event in target', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: 100 };
			const result = adapter.emit(wheelAction, target);
			// Center = left + width/2, top + height/2
			expect(result?.clientX).toBe(500); // 100 + 800/2
			expect(result?.clientY).toBe(350); // 50 + 600/2
		});

		it('should handle ctrl modifier for zoom', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: 100, ctrl: true };
			const result = adapter.emit(wheelAction, target);
			expect(result?.ctrlKey).toBe(true);
		});

		it('should default ctrl to false', () => {
			const wheelAction: FSMAction = { action: 'wheel', deltaY: 100 };
			const result = adapter.emit(wheelAction, target);
			expect(result?.ctrlKey).toBe(false);
		});
	});

	describe('coordinate transformation', () => {
		it('should handle different target sizes', () => {
			const smallTarget = createTarget({ width: 100, height: 100, left: 0, top: 0 });
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = adapter.emit(moveAction, smallTarget);
			expect(result?.clientX).toBe(50);
			expect(result?.clientY).toBe(50);
		});

		it('should handle offset target', () => {
			const offsetTarget = createTarget({ width: 400, height: 300, left: 200, top: 100 });
			const moveAction: FSMAction = { action: 'move', x: 0.25, y: 0.75 };
			const result = adapter.emit(moveAction, offsetTarget);
			// clientX = 200 + 0.25 * 400 = 300
			// clientY = 100 + 0.75 * 300 = 325
			expect(result?.clientX).toBe(300);
			expect(result?.clientY).toBe(325);
		});
	});

	describe('schema validation', () => {
		it('should produce valid PointerEventOut schema', () => {
			const moveAction: FSMAction = { action: 'move', x: 0.5, y: 0.5 };
			const result = adapter.emit(moveAction, target);
			// Schema validation happens inside emit() via PointerEventOutSchema.parse()
			// If we get here without error, schema is valid
			expect(result).toBeDefined();
		});
	});
});

// ============================================================================
// MockDOMAdapter Tests
// ============================================================================

describe('MockDOMAdapter', () => {
	let adapter: MockDOMAdapter;

	beforeEach(() => {
		adapter = new MockDOMAdapter();
	});

	describe('inject()', () => {
		it('should record injected events', () => {
			const event = {
				type: 'pointermove' as const,
				pointerId: 1,
				clientX: 100,
				clientY: 200,
				pointerType: 'touch' as const,
				isPrimary: true,
				pressure: 0.5,
			};
			adapter.inject(event);
			expect(adapter.getEvents()).toHaveLength(1);
			expect(adapter.getEvents()[0]).toEqual(event);
		});

		it('should return true on successful inject', () => {
			const event = {
				type: 'pointermove' as const,
				pointerId: 1,
				clientX: 100,
				clientY: 200,
				pointerType: 'touch' as const,
				isPrimary: true,
				pressure: 0.5,
			};
			const result = adapter.inject(event);
			expect(result).toBe(true);
		});
	});

	describe('getBounds()', () => {
		it('should return default bounds', () => {
			const bounds = adapter.getBounds();
			expect(bounds).toEqual({ width: 800, height: 600, left: 0, top: 0 });
		});

		it('should return custom bounds', () => {
			const customAdapter = new MockDOMAdapter({ width: 400, height: 300, left: 50, top: 25 });
			expect(customAdapter.getBounds()).toEqual({ width: 400, height: 300, left: 50, top: 25 });
		});
	});

	describe('pointer capture', () => {
		it('should track capture state', () => {
			expect(adapter.hasCapture()).toBe(false);
			adapter.setCapture();
			expect(adapter.hasCapture()).toBe(true);
			adapter.releaseCapture();
			expect(adapter.hasCapture()).toBe(false);
		});
	});

	describe('clearEvents()', () => {
		it('should clear recorded events', () => {
			const event = {
				type: 'pointermove' as const,
				pointerId: 1,
				clientX: 100,
				clientY: 200,
				pointerType: 'touch' as const,
				isPrimary: true,
				pressure: 0.5,
			};
			adapter.inject(event);
			adapter.inject(event);
			expect(adapter.getEvents()).toHaveLength(2);
			adapter.clearEvents();
			expect(adapter.getEvents()).toHaveLength(0);
		});
	});
});

// ============================================================================
// Integration Tests - PointerEventAdapter + MockDOMAdapter
// ============================================================================

describe('PointerEventAdapter + MockDOMAdapter Integration', () => {
	let emitter: PointerEventAdapter;
	let injector: MockDOMAdapter;
	let target: AdapterTarget;

	beforeEach(() => {
		emitter = new PointerEventAdapter();
		injector = new MockDOMAdapter();
		target = createTarget();
	});

	it('should emit and inject full gesture sequence', () => {
		// Move
		const move1 = emitter.emit({ action: 'move', x: 0.5, y: 0.5 }, target);
		if (move1) injector.inject(move1);

		// Down (click start)
		const down = emitter.emit({ action: 'down', x: 0.5, y: 0.5, button: 0 }, target);
		if (down) injector.inject(down);

		// Move while pressed
		const move2 = emitter.emit({ action: 'move', x: 0.6, y: 0.6 }, target);
		if (move2) injector.inject(move2);

		// Up (click end)
		const up = emitter.emit({ action: 'up', x: 0.6, y: 0.6, button: 0 }, target);
		if (up) injector.inject(up);

		const events = injector.getEvents();
		expect(events).toHaveLength(4);
		expect(events.map((e) => e.type)).toEqual([
			'pointermove',
			'pointerdown',
			'pointermove',
			'pointerup',
		]);
	});

	it('should produce W3C compliant event properties', () => {
		const down = emitter.emit({ action: 'down', x: 0.5, y: 0.5, button: 0 }, target);
		if (down) injector.inject(down);

		const event = injector.getEvents()[0];
		// W3C required properties
		expect(event).toHaveProperty('type');
		expect(event).toHaveProperty('pointerId');
		expect(event).toHaveProperty('pointerType');
		expect(event).toHaveProperty('isPrimary');
		expect(event).toHaveProperty('clientX');
		expect(event).toHaveProperty('clientY');
	});
});

// ============================================================================
// Mutation Killer Tests - Edge Cases
// ============================================================================

describe('Mutation Killers - Edge Cases', () => {
	let adapter: PointerEventAdapter;
	let target: AdapterTarget;

	beforeEach(() => {
		adapter = new PointerEventAdapter();
		target = createTarget();
	});

	it('should handle x=0 differently from missing x', () => {
		const zeroX: FSMAction = { action: 'move', x: 0, y: 0.5 };
		const result = adapter.emit(zeroX, target);
		expect(result?.clientX).toBe(100); // left + 0
	});

	it('should handle y=0 differently from missing y', () => {
		const zeroY: FSMAction = { action: 'move', x: 0.5, y: 0 };
		const result = adapter.emit(zeroY, target);
		expect(result?.clientY).toBe(50); // top + 0
	});

	it('should distinguish button 0 from button 1', () => {
		const btn0: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 0 };
		const btn1: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 1 };

		const r0 = adapter.emit(btn0, target);
		const r1 = adapter.emit(btn1, target);

		expect(r0?.buttons).toBe(1);
		expect(r1?.buttons).toBe(4);
	});

	it('should distinguish button 2 from button 1', () => {
		const btn1: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 1 };
		const btn2: FSMAction = { action: 'down', x: 0.5, y: 0.5, button: 2 };

		const r1 = adapter.emit(btn1, target);
		const r2 = adapter.emit(btn2, target);

		expect(r1?.buttons).toBe(4);
		expect(r2?.buttons).toBe(2);
	});

	it('should handle positive deltaY', () => {
		const wheelAction: FSMAction = { action: 'wheel', deltaY: 100 };
		const result = adapter.emit(wheelAction, target);
		expect(result?.deltaY).toBe(100);
		expect(result?.deltaY).toBeGreaterThan(0);
	});

	it('should handle negative deltaY', () => {
		const wheelAction: FSMAction = { action: 'wheel', deltaY: -100 };
		const result = adapter.emit(wheelAction, target);
		expect(result?.deltaY).toBe(-100);
		expect(result?.deltaY).toBeLessThan(0);
	});

	it('should preserve pointerId across events', () => {
		const customAdapter = new PointerEventAdapter(42);
		const move = customAdapter.emit({ action: 'move', x: 0.5, y: 0.5 }, target);
		const down = customAdapter.emit({ action: 'down', x: 0.5, y: 0.5, button: 0 }, target);
		const up = customAdapter.emit({ action: 'up', x: 0.5, y: 0.5, button: 0 }, target);

		expect(move?.pointerId).toBe(42);
		expect(down?.pointerId).toBe(42);
		expect(up?.pointerId).toBe(42);
	});
});
