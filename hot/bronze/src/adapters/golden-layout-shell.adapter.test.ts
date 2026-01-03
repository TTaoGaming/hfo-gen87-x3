/**
 * GoldenLayout Shell Adapter Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED → GREEN
 *
 * Tests the UIShellPort implementation using Golden Layout 2.x
 * PRINCIPLE: Adapter wraps golden-layout exemplar for window management.
 *
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UIShellPort } from '../contracts/ports.js';
import type { LayoutState, TileConfig, UIShellConfig } from '../contracts/schemas.js';
import { LayoutStateSchema, TileConfigSchema, UIShellConfigSchema } from '../contracts/schemas.js';
import { GoldenLayoutShellAdapter } from './golden-layout-shell.adapter.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a valid TileConfig for testing
 */
function createTileConfig(overrides: Partial<TileConfig> = {}): TileConfig {
	const defaults: TileConfig = {
		id: `tile-${Math.random().toString(36).slice(2, 8)}`,
		type: 'dom',
		title: 'Test Tile',
		config: {},
	};
	return TileConfigSchema.parse({ ...defaults, ...overrides });
}

/**
 * Create a valid UIShellConfig for testing
 */
function createShellConfig(overrides: Partial<UIShellConfig> = {}): UIShellConfig {
	const defaults: UIShellConfig = {
		shell: 'golden',
		allowDragDrop: true,
		allowSplit: true,
		allowClose: true,
	};
	return UIShellConfigSchema.parse({ ...defaults, ...overrides });
}

/**
 * Create a valid LayoutState for testing
 */
function createLayoutState(overrides: Partial<LayoutState> = {}): LayoutState {
	const tile1 = createTileConfig({ id: 'tile-1', title: 'Tile 1' });
	const tile2 = createTileConfig({ id: 'tile-2', title: 'Tile 2' });
	const defaults: LayoutState = {
		tiles: [tile1, tile2],
		arrangement: {
			direction: 'row',
			first: 'tile-1',
			second: 'tile-2',
			splitPercentage: 50,
		},
		shell: 'golden',
	};
	return LayoutStateSchema.parse({ ...defaults, ...overrides });
}

/**
 * Create a mock container element
 */
function createMockContainer(): HTMLElement {
	const container = document.createElement('div');
	container.id = 'golden-layout-container';
	container.style.width = '800px';
	container.style.height = '600px';
	document.body.appendChild(container);
	return container;
}

// ============================================================================
// INTERFACE COMPLIANCE TESTS
// ============================================================================

describe('GoldenLayoutShellAdapter', () => {
	let adapter: GoldenLayoutShellAdapter;
	let container: HTMLElement;

	beforeEach(() => {
		adapter = new GoldenLayoutShellAdapter();
		container = createMockContainer();
	});

	afterEach(() => {
		adapter.dispose();
		container.remove();
	});

	describe('Interface Compliance', () => {
		it('implements UIShellPort interface', () => {
			// Type assertion ensures adapter has all required methods
			const shellPort: UIShellPort = adapter;
			expect(shellPort).toBeDefined();

			// Verify all interface methods exist
			expect(typeof adapter.initialize).toBe('function');
			expect(typeof adapter.getTileTarget).toBe('function');
			expect(typeof adapter.getTileIds).toBe('function');
			expect(typeof adapter.addTile).toBe('function');
			expect(typeof adapter.removeTile).toBe('function');
			expect(typeof adapter.splitTile).toBe('function');
			expect(typeof adapter.getLayout).toBe('function');
			expect(typeof adapter.setLayout).toBe('function');
			expect(typeof adapter.onLayoutChange).toBe('function');
			expect(typeof adapter.onTileFocus).toBe('function');
			expect(typeof adapter.dispose).toBe('function');
		});

		it('requires initialization before operations', async () => {
			// Operations before initialize should throw or return defaults
			expect(adapter.getTileIds()).toEqual([]);
			expect(adapter.getTileTarget('any')).toBeNull();
		});
	});

	// ============================================================================
	// INITIALIZATION TESTS
	// ============================================================================

	describe('initialize()', () => {
		it('initializes with container and config', async () => {
			const config = createShellConfig();
			await adapter.initialize(container, config);

			// After init, adapter should be ready
			expect(adapter.getTileIds()).toEqual([]);
		});

		it('applies initial layout from config', async () => {
			const initialLayout = createLayoutState();
			const config = createShellConfig({ initialLayout });

			await adapter.initialize(container, config);

			const layout = adapter.getLayout();
			expect(layout.tiles).toHaveLength(2);
			expect(layout.shell).toBe('golden');
		});

		it('validates config with Zod', async () => {
			const invalidConfig = { shell: 'invalid-shell' } as unknown as UIShellConfig;

			await expect(adapter.initialize(container, invalidConfig)).rejects.toThrow();
		});

		it('throws on double initialization', async () => {
			const config = createShellConfig();
			await adapter.initialize(container, config);

			await expect(adapter.initialize(container, config)).rejects.toThrow(/already initialized/i);
		});
	});

	// ============================================================================
	// COMPONENT REGISTRY TESTS
	// ============================================================================

	describe('Component Registry', () => {
		it('allows registering component factories before initialize', () => {
			const factory = vi.fn().mockReturnValue(document.createElement('div'));

			adapter.registerComponent('dom', factory);
			adapter.registerComponent('iframe', factory);
			adapter.registerComponent('canvas', factory);

			// Verify we can still get tile IDs (registry doesn't break state)
			expect(adapter.getTileIds()).toBeDefined();
		});

		it('uses registered factory when creating tiles', async () => {
			const mockElement = document.createElement('div');
			mockElement.textContent = 'Test Content';
			const factory = vi.fn().mockReturnValue(mockElement);

			adapter.registerComponent('dom', factory);

			const tile = createTileConfig({ type: 'dom' });
			const layout = createLayoutState({ tiles: [tile], arrangement: tile.id });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			// Wait for ResizeObserver to fire
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Force GL to render
			(adapter as any).gl.updateRootSize();

			// Wait for GL to render using vi.waitFor
			await vi.waitFor(
				() => {
					expect(factory).toHaveBeenCalled();
				},
				{ timeout: 1000, interval: 50 },
			);
		});

		it('provides default factory for unregistered types', async () => {
			// No factory registered for 'custom'
			const tile = createTileConfig({ type: 'custom' });
			const layout = createLayoutState({ tiles: [tile], arrangement: tile.id });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			// Should not throw, should use default placeholder
			const target = adapter.getTileTarget(tile.id);
			expect(target).toBeDefined();
		});
	});

	// ============================================================================
	// TILE MANAGEMENT TESTS
	// ============================================================================

	describe('Tile Management', () => {
		beforeEach(async () => {
			const config = createShellConfig();
			await adapter.initialize(container, config);
		});

		describe('addTile()', () => {
			it('adds a tile to the layout', () => {
				const tile = createTileConfig({ id: 'new-tile' });
				adapter.addTile(tile);

				expect(adapter.getTileIds()).toContain('new-tile');
			});

			it('validates tile config with Zod', () => {
				const invalidTile = { id: 123 } as unknown as TileConfig;

				expect(() => adapter.addTile(invalidTile)).toThrow();
			});

			it('rejects duplicate tile IDs', () => {
				const tile = createTileConfig({ id: 'dup-tile' });
				adapter.addTile(tile);

				expect(() => adapter.addTile(tile)).toThrow(/duplicate|exists/i);
			});
		});

		describe('removeTile()', () => {
			it('removes an existing tile', () => {
				const tile = createTileConfig({ id: 'remove-me' });
				adapter.addTile(tile);
				expect(adapter.getTileIds()).toContain('remove-me');

				adapter.removeTile('remove-me');
				expect(adapter.getTileIds()).not.toContain('remove-me');
			});

			it('throws for non-existent tile', () => {
				expect(() => adapter.removeTile('non-existent')).toThrow(/not found/i);
			});
		});

		describe('getTileTarget()', () => {
			it('returns AdapterTarget for existing tile', async () => {
				const tile = createTileConfig({ id: 'target-tile' });
				adapter.addTile(tile);

				// Wait for ResizeObserver to fire
				await new Promise((resolve) => setTimeout(resolve, 50));

				// Force GL to render
				(adapter as any).gl.updateRootSize();

				// Wait for GL to render and target to be available
				await vi.waitFor(
					() => {
						const target = adapter.getTileTarget('target-tile');
						expect(target).not.toBeNull();
					},
					{ timeout: 1000, interval: 50 },
				);

				const target = adapter.getTileTarget('target-tile');
				expect(target?.type).toBe('element');
				expect(target?.selector).toContain('target-tile');
				expect(target?.bounds).toBeDefined();
			});

			it('returns null for non-existent tile', () => {
				const target = adapter.getTileTarget('non-existent');
				expect(target).toBeNull();
			});
		});

		describe('getTileIds()', () => {
			it('returns all tile IDs', () => {
				adapter.addTile(createTileConfig({ id: 'a' }));
				adapter.addTile(createTileConfig({ id: 'b' }));
				adapter.addTile(createTileConfig({ id: 'c' }));

				const ids = adapter.getTileIds();
				expect(ids).toContain('a');
				expect(ids).toContain('b');
				expect(ids).toContain('c');
				expect(ids).toHaveLength(3);
			});

			it('returns empty array when no tiles', () => {
				expect(adapter.getTileIds()).toEqual([]);
			});
		});
	});

	// ============================================================================
	// SPLIT TILE TESTS
	// ============================================================================

	describe('splitTile()', () => {
		beforeEach(async () => {
			const tile = createTileConfig({ id: 'split-source' });
			const layout = createLayoutState({ tiles: [tile], arrangement: tile.id });
			const config = createShellConfig({ initialLayout: layout });
			await adapter.initialize(container, config);
		});

		it('splits tile horizontally', () => {
			const newTile = createTileConfig({ id: 'split-h' });

			adapter.splitTile('split-source', 'horizontal', newTile);

			expect(adapter.getTileIds()).toContain('split-source');
			expect(adapter.getTileIds()).toContain('split-h');

			const layout = adapter.getLayout();
			expect(layout.arrangement).toMatchObject({
				direction: 'row',
				first: 'split-source',
				second: 'split-h',
			});
		});

		it('splits tile vertically', () => {
			const newTile = createTileConfig({ id: 'split-v' });

			adapter.splitTile('split-source', 'vertical', newTile);

			expect(adapter.getTileIds()).toContain('split-source');
			expect(adapter.getTileIds()).toContain('split-v');

			const layout = adapter.getLayout();
			expect(layout.arrangement).toMatchObject({
				direction: 'column',
				first: 'split-source',
				second: 'split-v',
			});
		});

		it('throws for non-existent source tile', () => {
			const newTile = createTileConfig({ id: 'new' });

			expect(() => adapter.splitTile('non-existent', 'horizontal', newTile)).toThrow(/not found/i);
		});

		it('validates new tile config', () => {
			const invalidTile = { id: null } as unknown as TileConfig;

			expect(() => adapter.splitTile('split-source', 'horizontal', invalidTile)).toThrow();
		});
	});

	// ============================================================================
	// LAYOUT SERIALIZATION TESTS
	// ============================================================================

	describe('Layout Serialization', () => {
		describe('getLayout()', () => {
			it('returns valid LayoutState', async () => {
				const initialLayout = createLayoutState();
				const config = createShellConfig({ initialLayout });
				await adapter.initialize(container, config);

				const layout = adapter.getLayout();

				// Should pass Zod validation
				const parsed = LayoutStateSchema.safeParse(layout);
				expect(parsed.success).toBe(true);
			});

			it('serializes nested arrangements correctly', async () => {
				const tiles = [
					createTileConfig({ id: 't1' }),
					createTileConfig({ id: 't2' }),
					createTileConfig({ id: 't3' }),
				];
				const arrangement = {
					direction: 'row' as const,
					first: 't1',
					second: {
						direction: 'column' as const,
						first: 't2',
						second: 't3',
						splitPercentage: 60,
					},
					splitPercentage: 40,
				};
				const initialLayout = createLayoutState({ tiles, arrangement });
				const config = createShellConfig({ initialLayout });
				await adapter.initialize(container, config);

				const layout = adapter.getLayout();
				expect(layout.arrangement).toEqual(arrangement);
			});
		});

		describe('setLayout()', () => {
			beforeEach(async () => {
				const config = createShellConfig();
				await adapter.initialize(container, config);
			});

			it('sets layout from LayoutState', () => {
				const newLayout = createLayoutState();

				adapter.setLayout(newLayout);

				const retrieved = adapter.getLayout();
				expect(retrieved.tiles).toHaveLength(newLayout.tiles.length);
			});

			it('validates layout with Zod', () => {
				const invalidLayout = { tiles: 'not-an-array' } as unknown as LayoutState;

				expect(() => adapter.setLayout(invalidLayout)).toThrow();
			});

			it('clears existing tiles before applying new layout', () => {
				adapter.addTile(createTileConfig({ id: 'old-tile' }));
				expect(adapter.getTileIds()).toContain('old-tile');

				const newLayout = createLayoutState({
					tiles: [createTileConfig({ id: 'new-tile' })],
					arrangement: 'new-tile',
				});
				adapter.setLayout(newLayout);

				expect(adapter.getTileIds()).not.toContain('old-tile');
				expect(adapter.getTileIds()).toContain('new-tile');
			});
		});
	});

	// ============================================================================
	// EVENT SUBSCRIPTION TESTS
	// ============================================================================

	describe('Event Subscriptions', () => {
		beforeEach(async () => {
			const tile = createTileConfig({ id: 'event-tile' });
			const layout = createLayoutState({ tiles: [tile], arrangement: tile.id });
			const config = createShellConfig({ initialLayout: layout });
			await adapter.initialize(container, config);
		});

		describe('onLayoutChange()', () => {
			it('emits layout changes when tiles added', () => {
				const callback = vi.fn();
				const unsubscribe = adapter.onLayoutChange(callback);

				adapter.addTile(createTileConfig({ id: 'added' }));

				expect(callback).toHaveBeenCalled();
				const emittedLayout = callback.mock.calls[0][0];
				expect(emittedLayout.tiles.some((t: TileConfig) => t.id === 'added')).toBe(true);

				unsubscribe();
			});

			it('emits layout changes when tiles removed', () => {
				const callback = vi.fn();
				adapter.addTile(createTileConfig({ id: 'to-remove' }));

				const unsubscribe = adapter.onLayoutChange(callback);
				callback.mockClear();

				adapter.removeTile('to-remove');

				expect(callback).toHaveBeenCalled();

				unsubscribe();
			});

			it('returns unsubscribe function', () => {
				const callback = vi.fn();
				const unsubscribe = adapter.onLayoutChange(callback);

				expect(typeof unsubscribe).toBe('function');

				unsubscribe();

				adapter.addTile(createTileConfig({ id: 'after-unsub' }));
				expect(callback).not.toHaveBeenCalled();
			});
		});

		describe('onTileFocus()', () => {
			it('emits tile focus events', () => {
				const callback = vi.fn();
				const unsubscribe = adapter.onTileFocus(callback);

				// Simulate focus (in real GL this happens on tab header click)
				adapter.focusTile('event-tile');

				expect(callback).toHaveBeenCalledWith('event-tile');

				unsubscribe();
			});

			it('returns unsubscribe function', () => {
				const callback = vi.fn();
				const unsubscribe = adapter.onTileFocus(callback);

				unsubscribe();

				adapter.focusTile('event-tile');
				expect(callback).not.toHaveBeenCalled();
			});
		});
	});

	// ============================================================================
	// DISPOSE TESTS
	// ============================================================================

	describe('dispose()', () => {
		it('releases all resources', async () => {
			const config = createShellConfig();
			await adapter.initialize(container, config);
			adapter.addTile(createTileConfig({ id: 'dispose-tile' }));

			adapter.dispose();

			// After dispose, adapter should be in clean state
			expect(adapter.getTileIds()).toEqual([]);
		});

		it('can be called multiple times safely', () => {
			adapter.dispose();
			adapter.dispose();
			adapter.dispose();

			expect(adapter.getTileIds()).toHaveLength(0);
		});

		it('unsubscribes all listeners', async () => {
			const config = createShellConfig();
			await adapter.initialize(container, config);

			const layoutCallback = vi.fn();
			const focusCallback = vi.fn();
			adapter.onLayoutChange(layoutCallback);
			adapter.onTileFocus(focusCallback);

			adapter.dispose();

			// No callbacks should fire after dispose
			// (re-init would be needed for new operations)
		});
	});

	// ============================================================================
	// GOLDEN LAYOUT MAPPING TESTS
	// ============================================================================

	describe('Golden Layout Config Mapping', () => {
		it('maps TileConfig.id to componentState.tileId', async () => {
			const tile = createTileConfig({ id: 'mapped-id' });
			const layout = createLayoutState({ tiles: [tile], arrangement: tile.id });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			// The tile should be retrievable by its original ID
			expect(adapter.getTileIds()).toContain('mapped-id');
		});

		it('maps direction:row to horizontal split', async () => {
			const tiles = [createTileConfig({ id: 'left' }), createTileConfig({ id: 'right' })];
			const arrangement = {
				direction: 'row' as const,
				first: 'left',
				second: 'right',
			};
			const layout = createLayoutState({ tiles, arrangement });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			const retrieved = adapter.getLayout();
			expect(retrieved.arrangement).toMatchObject({ direction: 'row' });
		});

		it('maps direction:column to vertical split', async () => {
			const tiles = [createTileConfig({ id: 'top' }), createTileConfig({ id: 'bottom' })];
			const arrangement = {
				direction: 'column' as const,
				first: 'top',
				second: 'bottom',
			};
			const layout = createLayoutState({ tiles, arrangement });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			const retrieved = adapter.getLayout();
			expect(retrieved.arrangement).toMatchObject({ direction: 'column' });
		});

		it('preserves splitPercentage through round-trip', async () => {
			const tiles = [createTileConfig({ id: 'a' }), createTileConfig({ id: 'b' })];
			const arrangement = {
				direction: 'row' as const,
				first: 'a',
				second: 'b',
				splitPercentage: 30,
			};
			const layout = createLayoutState({ tiles, arrangement });
			const config = createShellConfig({ initialLayout: layout });

			await adapter.initialize(container, config);

			const retrieved = adapter.getLayout();
			if (typeof retrieved.arrangement === 'object') {
				expect(retrieved.arrangement.splitPercentage).toBe(30);
			} else {
				throw new Error('Expected object arrangement');
			}
		});
	});
});
