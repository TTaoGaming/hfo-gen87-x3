import { GoldenLayout, type LayoutConfig } from 'golden-layout';
import {
	addTileToTree,
	removeTileFromTree,
	splitTileInTree,
} from '../../../../cold/silver/primitives/layout-tree.js';
/**
 * GoldenLayout Shell Adapter
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | UIShellPort Implementation
 *
 * Implements UIShellPort interface using Golden Layout 2.x for tiling window management.
 * PRINCIPLE: Adapter wraps golden-layout exemplar, handles config mapping.
 *
 * @see https://golden-layout.com/docs/
 * @see W3C_POINTER_GESTURE_CONTROL_PLANE_20251230.md Section 11
 */
import type { UIShellPort } from '../contracts/ports.js';
import type {
	AdapterTarget,
	LayoutNode,
	LayoutState,
	TileConfig,
	TileType,
	UIShellConfig,
} from '../contracts/schemas.js';
import { LayoutStateSchema, TileConfigSchema, UIShellConfigSchema } from '../contracts/schemas.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Component factory function - creates content for a tile
 * @param container - The HTML element to render into
 * @param config - Tile-specific configuration
 * @returns The created element or component
 */
export type ComponentFactory = (
	container: HTMLElement,
	config: Record<string, unknown>,
) => HTMLElement | undefined;

/**
 * Internal tile state tracking
 */
interface TileState {
	config: TileConfig;
	container: HTMLElement | null;
	element: HTMLElement | null;
}

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * Golden Layout Shell Adapter
 *
 * Implements UIShellPort using Golden Layout 2.x for browser-based tiling.
 * Manages component lifecycle, layout serialization, and event subscriptions.
 */
export class GoldenLayoutShellAdapter implements UIShellPort {
	// Private state
	private initialized = false;
	private _config: UIShellConfig | null = null;
	private gl: GoldenLayout | null = null;

	/** Get current configuration (for hot-swapping and inspection) */
	get config(): UIShellConfig | null {
		return this._config;
	}

	// Component registry - maps tile type to factory
	private componentRegistry = new Map<TileType, ComponentFactory>();

	// Tile state tracking
	private tiles = new Map<string, TileState>();

	// Current layout arrangement
	private arrangement: LayoutNode = '';

	// Event callbacks
	private layoutChangeCallbacks = new Set<(layout: LayoutState) => void>();
	private tileFocusCallbacks = new Set<(tileId: string) => void>();

	// ============================================================================
	// COMPONENT REGISTRATION
	// ============================================================================

	/**
	 * Register a component factory for a tile type
	 * Must be called BEFORE initialize() for the factory to be used
	 *
	 * @param type - The tile type (dom, iframe, canvas, etc.)
	 * @param factory - Factory function to create tile content
	 */
	registerComponent(type: TileType, factory: ComponentFactory): void {
		this.componentRegistry.set(type, factory);
		if (this.gl) {
			this.registerWithGL(type, factory);
		}
	}

	private registerWithGL(type: TileType, factory: ComponentFactory): void {
		if (!this.gl) return;
		this.gl.registerComponentFactoryFunction(type, (container, itemConfig) => {
			const tileId = (itemConfig as any)?.componentState?.tileId;
			if (!tileId) return;

			const tileState = this.tiles.get(tileId);
			if (!tileState) return;

			const el = factory(container.element, tileState.config.config || {});
			tileState.container = container.element;
			if (el) {
				tileState.element = el;
			}

			// Add data attributes for E2E testing
			container.element.dataset.tileId = tileId;
			container.element.dataset.tileType = type;
		});
	}

	// ============================================================================
	// UIShellPort IMPLEMENTATION
	// ============================================================================

	/**
	 * Initialize the shell with configuration
	 * @throws If already initialized or config is invalid
	 */
	async initialize(container: HTMLElement, config: UIShellConfig): Promise<void> {
		const validatedConfig = UIShellConfigSchema.parse(config);

		if (this.initialized) {
			throw new Error('GoldenLayoutShellAdapter: Already initialized. Call dispose() first.');
		}

		this._config = validatedConfig;

		// Initialize GoldenLayout
		this.gl = new GoldenLayout(container);

		// Register all existing components
		for (const [type, factory] of this.componentRegistry) {
			this.registerWithGL(type, factory);
		}

		// Handle GL events
		this.gl.on('stateChanged', () => {
			this.emitLayoutChange();
		});

		this.initialized = true;

		// Apply initial layout if provided
		if (validatedConfig.initialLayout) {
			this.setLayoutInternal(validatedConfig.initialLayout, false);
		}
	}

	/**
	 * Get the target element/canvas for a tile
	 */
	getTileTarget(tileId: string): AdapterTarget | null {
		const tileState = this.tiles.get(tileId);
		if (!tileState?.container) {
			return null;
		}

		const rect = tileState.container.getBoundingClientRect();

		return {
			type: 'element',
			selector: `[data-tile-id="${tileId}"]`,
			bounds: {
				width: rect.width || 100,
				height: rect.height || 100,
				left: rect.left || 0,
				top: rect.top || 0,
			},
		};
	}

	getTileIds(): string[] {
		return Array.from(this.tiles.keys());
	}

	addTile(config: TileConfig): void {
		const validatedConfig = TileConfigSchema.parse(config);

		if (this.tiles.has(validatedConfig.id)) {
			throw new Error(
				`GoldenLayoutShellAdapter: Tile already exists with ID "${validatedConfig.id}"`,
			);
		}

		this.tiles.set(validatedConfig.id, {
			config: validatedConfig,
			container: null,
			element: null,
		});

		if (this.gl) {
			this.gl.addComponent(
				validatedConfig.type,
				{ tileId: validatedConfig.id },
				validatedConfig.title,
			);
		}

		this.arrangement = addTileToTree(this.arrangement, validatedConfig.id);
		this.emitLayoutChange();
	}

	removeTile(tileId: string): void {
		const tileState = this.tiles.get(tileId);
		if (!tileState) {
			throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
		}

		if (this.gl) {
			const item = this.gl.findFirstComponentItemById(tileId);
			if (item) {
				item.remove();
			}
		}

		this.tiles.delete(tileId);
		this.arrangement = removeTileFromTree(this.arrangement, tileId);
		this.emitLayoutChange();
	}

	splitTile(tileId: string, direction: 'horizontal' | 'vertical', newTile: TileConfig): void {
		if (!this.tiles.has(tileId)) {
			throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
		}

		const validatedNewTile = TileConfigSchema.parse(newTile);
		if (this.tiles.has(validatedNewTile.id)) {
			throw new Error(
				`GoldenLayoutShellAdapter: Tile already exists with ID "${validatedNewTile.id}"`,
			);
		}

		this.tiles.set(validatedNewTile.id, {
			config: validatedNewTile,
			container: null,
			element: null,
		});

		if (this.gl) {
			const sourceItem = this.gl.findFirstComponentItemById(tileId);
			if (sourceItem?.parent) {
				const newItemConfig = {
					type: 'component',
					componentType: validatedNewTile.type,
					componentState: { tileId: validatedNewTile.id },
					title: validatedNewTile.title || validatedNewTile.id,
					id: validatedNewTile.id,
				};
				(sourceItem.parent as any).addItem(newItemConfig);
			}
		}

		const layoutDirection = direction === 'horizontal' ? 'row' : 'column';
		this.arrangement = splitTileInTree(
			this.arrangement,
			tileId,
			validatedNewTile.id,
			layoutDirection,
		);
		this.emitLayoutChange();
	}

	getLayout(): LayoutState {
		const tiles = Array.from(this.tiles.values()).map((s) => s.config);
		return {
			tiles,
			arrangement: this.arrangement,
			shell: 'golden',
		};
	}

	setLayout(state: LayoutState): void {
		this.setLayoutInternal(state, true);
	}

	onLayoutChange(callback: (layout: LayoutState) => void): () => void {
		this.layoutChangeCallbacks.add(callback);
		return () => {
			this.layoutChangeCallbacks.delete(callback);
		};
	}

	onTileFocus(callback: (tileId: string) => void): () => void {
		this.tileFocusCallbacks.add(callback);
		return () => {
			this.tileFocusCallbacks.delete(callback);
		};
	}

	dispose(): void {
		if (this.gl) {
			this.gl.destroy();
			this.gl = null;
		}
		this.tiles.clear();
		this.layoutChangeCallbacks.clear();
		this.tileFocusCallbacks.clear();
		this.arrangement = '';
		this._config = null;
		this.initialized = false;
	}

	focusTile(tileId: string): void {
		if (this.tiles.has(tileId)) {
			this.emitTileFocus(tileId);
		}
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	private setLayoutInternal(state: LayoutState, clearExisting: boolean): void {
		const validated = LayoutStateSchema.parse(state);

		if (clearExisting) {
			this.tiles.clear();
		}

		for (const tileConfig of validated.tiles) {
			if (!this.tiles.has(tileConfig.id)) {
				this.tiles.set(tileConfig.id, {
					config: tileConfig,
					container: null,
					element: null,
				});
			}
		}

		this.arrangement = validated.arrangement;

		if (this.gl && this.arrangement) {
			const glConfig: LayoutConfig = {
				root: this.convertNodeToGL(this.arrangement),
			};
			this.gl.loadLayout(glConfig);
		}

		if (clearExisting) {
			this.emitLayoutChange();
		}
	}

	private convertNodeToGL(node: LayoutNode): any {
		if (typeof node === 'string') {
			const tile = this.tiles.get(node);
			return {
				type: 'component',
				componentType: tile?.config.type || 'dom',
				componentState: { tileId: node },
				title: tile?.config.title || node,
				id: node,
			};
		}
		return {
			type: node.direction,
			content: [this.convertNodeToGL(node.first), this.convertNodeToGL(node.second)],
		};
	}

	private emitLayoutChange(): void {
		const layout = this.getLayout();
		for (const callback of this.layoutChangeCallbacks) {
			callback(layout);
		}
	}

	private emitTileFocus(tileId: string): void {
		for (const callback of this.tileFocusCallbacks) {
			callback(tileId);
		}
	}
}
