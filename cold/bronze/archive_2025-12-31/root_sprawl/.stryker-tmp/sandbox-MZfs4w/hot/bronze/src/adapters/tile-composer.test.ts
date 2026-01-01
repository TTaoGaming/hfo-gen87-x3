/**
 * TileComposer Tests - TDD RED→GREEN
 *
 * Gen87.X3 | Phase: VALIDATE (V)
 *
 * Tests for per-tile pipeline composition with Golden Layout integration.
 *
 * @vitest-environment jsdom
 */
// @ts-nocheck

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ComposerState, TileComposer, createTileComposer } from '../adapters/tile-composer.js';
import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from '../contracts/ports.js';
import type {
	AdapterTarget,
	FSMAction,
	LayoutState,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
} from '../contracts/schemas.js';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

function createMockSensorFrame(): SensorFrame {
	return {
		ts: Date.now(),
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.9,
		indexTip: { x: 0.5, y: 0.5 },
		landmarks: null,
	};
}

function createMockSmoothedFrame(): SmoothedFrame {
	return {
		ts: Date.now(),
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.9,
		position: { x: 0.5, y: 0.5 },
		velocity: { x: 0, y: 0 },
		prediction: null,
	};
}

function createMockFSMAction(): FSMAction {
	return {
		state: 'DISARMED',
		gesture: null,
		confidence: 0.9,
		timestamp: Date.now(),
	};
}

function createMockPointerEvent(): PointerEventOut {
	return {
		type: 'pointermove',
		pointerId: 1,
		clientX: 100,
		clientY: 200,
		pointerType: 'pen',
		pressure: 0.5,
		isPrimary: true,
	};
}

function createMockLayoutState(): LayoutState {
	return {
		tiles: [{ id: 'test-tile', type: 'dom', title: 'Test', config: {} }],
		arrangement: 'test-tile',
		shell: 'golden',
	};
}

function createMockTarget(): AdapterTarget {
	return {
		type: 'element',
		bounds: { left: 0, top: 0, width: 800, height: 600 },
	};
}

// ============================================================================
// MOCK CLASSES
// ============================================================================

class MockSensorPort implements SensorPort {
	isReady = false;
	mockFrame = createMockSensorFrame();

	async initialize(): Promise<void> {
		this.isReady = true;
	}

	async sense(_video: HTMLVideoElement, timestamp: number): Promise<SensorFrame> {
		return { ...this.mockFrame, ts: timestamp };
	}

	dispose(): void {
		this.isReady = false;
	}
}

class MockSmootherPort implements SmootherPort {
	mockSmoothed = createMockSmoothedFrame();
	smoothCallCount = 0;

	smooth(_frame: SensorFrame): SmoothedFrame {
		this.smoothCallCount++;
		return this.mockSmoothed;
	}

	reset(): void {
		this.smoothCallCount = 0;
	}

	setParams(_mincutoff: number, _beta: number): void {
		// no-op for mock
	}
}

class MockFSMPort implements FSMPort {
	mockAction = createMockFSMAction();
	currentState = 'DISARMED';
	processCallCount = 0;

	process(_frame: SmoothedFrame): FSMAction {
		this.processCallCount++;
		return this.mockAction;
	}

	getState(): string {
		return this.currentState;
	}

	disarm(): void {
		this.currentState = 'DISARMED';
	}

	subscribe(_callback: (state: string, action: FSMAction) => void): () => void {
		return () => {};
	}

	reset(): void {
		this.currentState = 'DISARMED';
		this.processCallCount = 0;
	}
}

class MockEmitterPort implements EmitterPort {
	mockPointerEvent = createMockPointerEvent();
	emitCallCount = 0;
	pointerId = 1;

	emit(_action: FSMAction, _target: AdapterTarget): PointerEventOut {
		this.emitCallCount++;
		return this.mockPointerEvent;
	}
}

class MockAdapterPort implements AdapterPort {
	injectCallCount = 0;
	lastEvent: PointerEventOut | null = null;
	private hasPointerCapture = false;

	inject(event: PointerEventOut): boolean {
		this.injectCallCount++;
		this.lastEvent = event;
		return true;
	}

	getBounds(): AdapterTarget['bounds'] {
		return { left: 0, top: 0, width: 800, height: 600 };
	}

	setCapture(): void {
		this.hasPointerCapture = true;
	}

	releaseCapture(): void {
		this.hasPointerCapture = false;
	}

	hasCapture(): boolean {
		return this.hasPointerCapture;
	}
}

class MockUIShellPort implements UIShellPort {
	tiles = new Map<string, AdapterTarget>();
	focusCallbacks: Array<(tileId: string) => void> = [];
	layoutCallbacks: Array<(layout: LayoutState) => void> = [];
	mockLayout = createMockLayoutState();
	initialized = false;

	async initialize(_container: HTMLElement): Promise<void> {
		this.initialized = true;
	}

	getTileIds(): string[] {
		return Array.from(this.tiles.keys());
	}

	addTile(config: import('../contracts/schemas.js').TileConfig): void {
		this.tiles.set(config.id, createMockTarget());
	}

	removeTile(tileId: string): void {
		this.tiles.delete(tileId);
	}

	getTileTarget(tileId: string): AdapterTarget | null {
		return this.tiles.get(tileId) ?? null;
	}

	getLayout(): LayoutState {
		return this.mockLayout;
	}

	setLayout(layout: LayoutState): void {
		this.mockLayout = layout;
	}

	splitTile(
		_tileId: string,
		_direction: 'horizontal' | 'vertical',
		newTileConfig: import('../contracts/schemas.js').TileConfig,
	): void {
		this.tiles.set(newTileConfig.id, createMockTarget());
	}

	onTileFocus(callback: (tileId: string) => void): () => void {
		this.focusCallbacks.push(callback);
		return () => {
			const idx = this.focusCallbacks.indexOf(callback);
			if (idx >= 0) this.focusCallbacks.splice(idx, 1);
		};
	}

	onLayoutChange(callback: (layout: LayoutState) => void): () => void {
		this.layoutCallbacks.push(callback);
		return () => {
			const idx = this.layoutCallbacks.indexOf(callback);
			if (idx >= 0) this.layoutCallbacks.splice(idx, 1);
		};
	}

	dispose(): void {
		this.tiles.clear();
		this.focusCallbacks = [];
		this.layoutCallbacks = [];
		this.initialized = false;
	}

	// Test helpers
	triggerFocus(tileId: string): void {
		for (const cb of this.focusCallbacks) cb(tileId);
	}

	triggerLayoutChange(): void {
		for (const cb of this.layoutCallbacks) cb(this.mockLayout);
	}
}

// ============================================================================
// TESTS
// ============================================================================

describe('TileComposer', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		document.body.removeChild(container);
	});

	describe('Factory Function', () => {
		it('creates composer with default config', () => {
			const composer = createTileComposer();
			expect(composer).toBeInstanceOf(TileComposer);
		});

		it('creates composer with custom config', () => {
			const composer = createTileComposer({
				shell: { type: 'raw' },
				defaultSmoother: { type: 'rapier-smooth', stiffness: 200, damping: 0.8 },
			});
			expect(composer).toBeInstanceOf(TileComposer);
		});
	});

	describe('Initialization', () => {
		it('throws if processFrame called before init', async () => {
			const composer = createTileComposer();
			const video = document.createElement('video');

			await expect(composer.processFrame(video, 0)).rejects.toThrow('Sensor not initialized');
		});

		it('throws if addTile called before init', () => {
			const composer = createTileComposer();

			expect(() =>
				composer.addTile({ id: 'test', type: 'dom', title: 'Test', config: {} }),
			).toThrow('TileComposer not initialized');
		});

		it('throws if initialized twice', async () => {
			const composer = createTileComposer({ shell: { type: 'raw' } });

			await composer.initialize(container);
			await expect(composer.initialize(container)).rejects.toThrow('already initialized');

			composer.dispose();
		});
	});

	describe('Tile Management', () => {
		let composer: TileComposer;

		beforeEach(async () => {
			composer = createTileComposer({ shell: { type: 'raw' } });
			await composer.initialize(container);
		});

		afterEach(() => {
			composer.dispose();
		});

		it('adds a tile', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			expect(composer.getTileIds()).toContain('tile1');
		});

		it('removes a tile', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });
			composer.removeTile('tile1');

			expect(composer.getTileIds()).not.toContain('tile1');
		});

		it('gets tile config', () => {
			composer.addTile({
				id: 'tile1',
				type: 'dom',
				title: 'Tile 1',
				config: {},
				smootherConfig: { type: 'rapier-smooth', stiffness: 100, damping: 0.5 },
			});

			const config = composer.getTileConfig('tile1');
			expect(config?.smootherConfig?.type).toBe('rapier-smooth');
		});

		it('returns null for non-existent tile config', () => {
			expect(composer.getTileConfig('nonexistent')).toBeNull();
		});

		it('enables/disables tile gesture', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			// Disabled tile should not appear in processing
			composer.setTileGestureEnabled('tile1', false);

			// We can't easily verify this without mocking more deeply,
			// but the method should not throw
			expect(() => composer.setTileGestureEnabled('tile1', true)).not.toThrow();
		});
	});

	describe('Per-Tile Smoother Configuration', () => {
		let composer: TileComposer;

		beforeEach(async () => {
			composer = createTileComposer({
				shell: { type: 'raw' },
				defaultSmoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 },
			});
			await composer.initialize(container);
		});

		afterEach(() => {
			composer.dispose();
		});

		it('uses default smoother if none specified', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			const config = composer.getTileConfig('tile1');
			// No smootherConfig means default is used
			expect(config?.smootherConfig).toBeUndefined();
		});

		it('uses tile-specific smoother config', () => {
			composer.addTile({
				id: 'tile1',
				type: 'dom',
				title: 'Tile 1',
				config: {},
				smootherConfig: { type: 'rapier-smooth', stiffness: 150, damping: 0.6 },
			});

			const config = composer.getTileConfig('tile1');
			expect(config?.smootherConfig?.type).toBe('rapier-smooth');
		});

		it('updates tile smoother at runtime', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			composer.updateTileSmoother('tile1', {
				type: 'rapier-predict',
				stiffness: 200,
				damping: 0.7,
			});

			const config = composer.getTileConfig('tile1');
			expect(config?.smootherConfig?.type).toBe('rapier-predict');
		});

		it('throws when updating non-existent tile smoother', () => {
			expect(() =>
				composer.updateTileSmoother('nonexistent', { type: '1euro', minCutoff: 1, beta: 0.01 }),
			).toThrow("Tile 'nonexistent' not found");
		});
	});

	describe('State Management', () => {
		let composer: TileComposer;

		beforeEach(async () => {
			composer = createTileComposer({ shell: { type: 'raw' } });
			await composer.initialize(container);
		});

		afterEach(() => {
			composer.dispose();
		});

		it('gets composer state', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });
			composer.addTile({
				id: 'tile2',
				type: 'canvas',
				title: 'Tile 2',
				config: {},
				smootherConfig: { type: 'rapier-smooth', stiffness: 100, damping: 0.5 },
			});

			const state = composer.getState();

			expect(state.tiles).toHaveLength(2);
			expect(state.tiles.map((t) => t.id)).toContain('tile1');
			expect(state.tiles.map((t) => t.id)).toContain('tile2');
		});

		it('restores composer state', async () => {
			const state: ComposerState = {
				layout: createMockLayoutState(),
				tiles: [
					{
						id: 'restored1',
						config: { id: 'restored1', type: 'dom', title: 'R1', config: {} },
						fsmState: 'DISARMED',
					},
					{
						id: 'restored2',
						config: { id: 'restored2', type: 'canvas', title: 'R2', config: {} },
						fsmState: 'DISARMED',
					},
				],
				defaultSmoother: { type: '1euro', minCutoff: 2.0, beta: 0.01 },
			};

			await composer.restoreState(state);

			expect(composer.getTileIds()).toContain('restored1');
			expect(composer.getTileIds()).toContain('restored2');
		});
	});

	describe('Layout Operations', () => {
		let composer: TileComposer;

		beforeEach(async () => {
			composer = createTileComposer({ shell: { type: 'raw' } });
			await composer.initialize(container);
		});

		afterEach(() => {
			composer.dispose();
		});

		it('gets current layout', () => {
			const layout = composer.getLayout();
			expect(layout).toBeDefined();
		});

		it('subscribes to layout changes', () => {
			const callback = vi.fn();
			const unsubscribe = composer.onLayoutChange(callback);

			expect(typeof unsubscribe).toBe('function');
			unsubscribe();
		});

		it('splits a tile', () => {
			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			composer.splitTile('tile1', 'horizontal', {
				id: 'tile2',
				type: 'dom',
				title: 'Tile 2',
				config: {},
			});

			expect(composer.getTileIds()).toContain('tile2');
		});
	});

	describe('Disposal', () => {
		it('clears all state on dispose', async () => {
			const composer = createTileComposer({ shell: { type: 'raw' } });
			await composer.initialize(container);

			composer.addTile({ id: 'tile1', type: 'dom', title: 'Tile 1', config: {} });

			composer.dispose();

			// After dispose, adding tiles should fail
			expect(() =>
				composer.addTile({ id: 'tile2', type: 'dom', title: 'Tile 2', config: {} }),
			).toThrow();
		});

		it('allows re-initialization after dispose', async () => {
			const composer = createTileComposer({ shell: { type: 'raw' } });

			await composer.initialize(container);
			composer.dispose();

			// Should be able to initialize again
			await composer.initialize(container);
			composer.dispose();
		});
	});

	describe('Component Registration', () => {
		it('allows component registration before init', () => {
			const composer = createTileComposer();

			const mockFactory = vi.fn().mockReturnValue(document.createElement('div'));
			expect(() => composer.registerComponent('custom', mockFactory)).not.toThrow();
		});

		it('throws if component registered after init', async () => {
			const composer = createTileComposer({ shell: { type: 'raw' } });
			await composer.initialize(container);

			const mockFactory = vi.fn().mockReturnValue(document.createElement('div'));
			expect(() => composer.registerComponent('custom', mockFactory)).toThrow(
				'Cannot register components after initialization',
			);

			composer.dispose();
		});
	});
});

describe('TileComposer Integration', () => {
	// These tests would require more elaborate mocking of the port factory
	// For now, they serve as documentation of expected behavior

	it.todo('processes frame through all enabled tile pipelines');
	it.todo('skips disabled tiles during frame processing');
	it.todo('creates adapter lazily when tile target becomes available');
	it.todo('handles focus changes between tiles');
});
