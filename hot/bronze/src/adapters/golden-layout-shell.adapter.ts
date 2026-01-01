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
import type { AdapterTarget, LayoutNode, LayoutState, TileConfig, TileType, UIShellConfig } from '../contracts/schemas.js';
import {
	LayoutStateSchema,
	TileConfigSchema,
	UIShellConfigSchema,
} from '../contracts/schemas.js';

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
	config: Record<string, unknown>
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
 *
 * ## Usage
 * ```typescript
 * const adapter = new GoldenLayoutShellAdapter();
 * adapter.registerComponent('dom', (container, config) => {
 *   const el = document.createElement('div');
 *   container.appendChild(el);
 *   return el;
 * });
 * await adapter.initialize(containerEl, { shell: 'golden' });
 * adapter.addTile({ id: 'main', type: 'dom', title: 'Main' });
 * ```
 */
export class GoldenLayoutShellAdapter implements UIShellPort {
	// Private state
	private initialized = false;
	private rootContainer: HTMLElement | null = null;
	private config: UIShellConfig | null = null;

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
	}

	// ============================================================================
	// UIShellPort IMPLEMENTATION
	// ============================================================================

	/**
	 * Initialize the shell with configuration
	 * @throws If already initialized or config is invalid
	 */
	async initialize(container: HTMLElement, config: UIShellConfig): Promise<void> {
		// Validate config
		const validatedConfig = UIShellConfigSchema.parse(config);

		// Check for double initialization
		if (this.initialized) {
			throw new Error('GoldenLayoutShellAdapter: Already initialized. Call dispose() first.');
		}

		this.rootContainer = container;
		this.config = validatedConfig;
		this.initialized = true;

		// Apply initial layout if provided
		if (validatedConfig.initialLayout) {
			this.setLayoutInternal(validatedConfig.initialLayout, false);
		}
	}

	/**
	 * Get the target element/canvas for a tile
	 * Used to wire up AdapterPort for each tile
	 */
	getTileTarget(tileId: string): AdapterTarget | null {
		const tileState = this.tiles.get(tileId);
		if (!tileState?.container) {
			return null;
		}

		// Get container bounds
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

	/**
	 * Get all tile IDs
	 */
	getTileIds(): string[] {
		return Array.from(this.tiles.keys());
	}

	/**
	 * Add a new tile
	 * @throws If tile config is invalid or ID already exists
	 */
	addTile(config: TileConfig): void {
		// Validate config
		const validatedConfig = TileConfigSchema.parse(config);

		// Check for duplicate
		if (this.tiles.has(validatedConfig.id)) {
			throw new Error(`GoldenLayoutShellAdapter: Tile already exists with ID "${validatedConfig.id}"`);
		}

		// Create tile container
		const tileContainer = this.createTileContainer(validatedConfig);

		// Store tile state
		this.tiles.set(validatedConfig.id, {
			config: validatedConfig,
			container: tileContainer,
			element: null,
		});

		// Update arrangement to include new tile
		this.updateArrangementWithNewTile(validatedConfig.id);

		// Emit layout change
		this.emitLayoutChange();
	}

	/**
	 * Remove a tile
	 * @throws If tile not found
	 */
	removeTile(tileId: string): void {
		const tileState = this.tiles.get(tileId);
		if (!tileState) {
			throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
		}

		// Remove from DOM
		if (tileState.container?.parentElement) {
			tileState.container.remove();
		}

		// Remove from tracking
		this.tiles.delete(tileId);

		// Update arrangement
		this.arrangement = this.removeTileFromArrangement(this.arrangement, tileId);

		// Emit layout change
		this.emitLayoutChange();
	}

	/**
	 * Split a tile in the given direction
	 * @throws If source tile not found or new tile config invalid
	 */
	splitTile(
		tileId: string,
		direction: 'horizontal' | 'vertical',
		newTile: TileConfig
	): void {
		// Validate source exists
		if (!this.tiles.has(tileId)) {
			throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
		}

		// Validate new tile
		const validatedNewTile = TileConfigSchema.parse(newTile);

		// Check for duplicate
		if (this.tiles.has(validatedNewTile.id)) {
			throw new Error(`GoldenLayoutShellAdapter: Tile already exists with ID "${validatedNewTile.id}"`);
		}

		// Create new tile container
		const newContainer = this.createTileContainer(validatedNewTile);
		this.tiles.set(validatedNewTile.id, {
			config: validatedNewTile,
			container: newContainer,
			element: null,
		});

		// Map direction: horizontal → row, vertical → column
		const layoutDirection = direction === 'horizontal' ? 'row' : 'column';

		// Update arrangement to split
		this.arrangement = this.splitInArrangement(
			this.arrangement,
			tileId,
			validatedNewTile.id,
			layoutDirection
		);

		// Emit layout change
		this.emitLayoutChange();
	}

	/**
	 * Get current layout state (for serialization)
	 */
	getLayout(): LayoutState {
		const tiles = Array.from(this.tiles.values()).map(s => s.config);

		return {
			tiles,
			arrangement: this.arrangement,
			shell: 'golden',
		};
	}

	/**
	 * Set layout state (for deserialization)
	 * @throws If layout is invalid
	 */
	setLayout(state: LayoutState): void {
		this.setLayoutInternal(state, true);
	}

	/**
	 * Subscribe to layout changes
	 * @returns Unsubscribe function
	 */
	onLayoutChange(callback: (layout: LayoutState) => void): () => void {
		this.layoutChangeCallbacks.add(callback);
		return () => {
			this.layoutChangeCallbacks.delete(callback);
		};
	}

	/**
	 * Subscribe to tile focus changes
	 * @returns Unsubscribe function
	 */
	onTileFocus(callback: (tileId: string) => void): () => void {
		this.tileFocusCallbacks.add(callback);
		return () => {
			this.tileFocusCallbacks.delete(callback);
		};
	}

	/**
	 * Dispose resources
	 */
	dispose(): void {
		// Clear all tiles
		for (const [_id, state] of this.tiles) {
			if (state.container?.parentElement) {
				state.container.remove();
			}
		}
		this.tiles.clear();

		// Clear callbacks
		this.layoutChangeCallbacks.clear();
		this.tileFocusCallbacks.clear();

		// Reset state
		this.arrangement = '';
		this.rootContainer = null;
		this.config = null;
		this.initialized = false;
	}

	// ============================================================================
	// PUBLIC HELPERS (for testing)
	// ============================================================================

	/**
	 * Programmatically focus a tile (emits focus event)
	 * Used for testing and external focus management
	 */
	focusTile(tileId: string): void {
		if (this.tiles.has(tileId)) {
			this.emitTileFocus(tileId);
		}
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	/**
	 * Internal setLayout implementation
	 */
	private setLayoutInternal(state: LayoutState, clearExisting: boolean): void {
		// Validate
		const validated = LayoutStateSchema.parse(state);

		// Clear existing tiles if requested
		if (clearExisting) {
			for (const [_id, tileState] of this.tiles) {
				if (tileState.container?.parentElement) {
					tileState.container.remove();
				}
			}
			this.tiles.clear();
		}

		// Create tiles
		for (const tileConfig of validated.tiles) {
			if (!this.tiles.has(tileConfig.id)) {
				const container = this.createTileContainer(tileConfig);
				this.tiles.set(tileConfig.id, {
					config: tileConfig,
					container,
					element: null,
				});
			}
		}

		// Set arrangement
		this.arrangement = validated.arrangement;

		// Emit change (only if this is a user-triggered setLayout, not initial)
		if (clearExisting) {
			this.emitLayoutChange();
		}
	}

	/**
	 * Create a tile container element and invoke component factory
	 */
	private createTileContainer(config: TileConfig): HTMLElement {
		const container = document.createElement('div');
		container.dataset.tileId = config.id;
		container.dataset.tileType = config.type;
		container.className = 'gl-tile-container';

		// Add title if present
		if (config.title) {
			container.dataset.tileTitle = config.title;
		}

		// Append to root if available
		if (this.rootContainer) {
			this.rootContainer.appendChild(container);
		}

		// Invoke factory if registered
		const factory = this.componentRegistry.get(config.type);
		if (factory) {
			factory(container, config.config);
		} else {
			// Default placeholder for unregistered types
			const placeholder = document.createElement('div');
			placeholder.className = 'gl-tile-placeholder';
			placeholder.textContent = `${config.type}: ${config.title ?? config.id}`;
			container.appendChild(placeholder);
		}

		// Wire up focus event
		container.addEventListener('click', () => {
			this.emitTileFocus(config.id);
		});

		return container;
	}

	/**
	 * Update arrangement to include a new tile (adds to root)
	 */
	private updateArrangementWithNewTile(tileId: string): void {
		if (this.arrangement === '' || this.tiles.size === 1) {
			// First tile becomes root
			this.arrangement = tileId;
		} else {
			// Wrap existing arrangement with new tile in row
			this.arrangement = {
				direction: 'row',
				first: this.arrangement,
				second: tileId,
				splitPercentage: 50,
			};
		}
	}

	/**
	 * Remove a tile from arrangement tree
	 */
	private removeTileFromArrangement(node: LayoutNode, tileId: string): LayoutNode {
		if (typeof node === 'string') {
			// Leaf node
			return node === tileId ? '' : node;
		}

		// Branch node
		const first = this.removeTileFromArrangement(node.first, tileId);
		const second = this.removeTileFromArrangement(node.second, tileId);

		// If one side is empty, return the other
		if (first === '') return second;
		if (second === '') return first;

		return {
			...node,
			first,
			second,
		};
	}

	/**
	 * Split a tile in the arrangement tree
	 */
	private splitInArrangement(
		node: LayoutNode,
		sourceTileId: string,
		newTileId: string,
		direction: 'row' | 'column'
	): LayoutNode {
		if (typeof node === 'string') {
			if (node === sourceTileId) {
				// Found the tile to split
				return {
					direction,
					first: sourceTileId,
					second: newTileId,
					splitPercentage: 50,
				};
			}
			return node;
		}

		// Recurse into branches
		return {
			...node,
			first: this.splitInArrangement(node.first, sourceTileId, newTileId, direction),
			second: this.splitInArrangement(node.second, sourceTileId, newTileId, direction),
		};
	}

	/**
	 * Emit layout change event to all subscribers
	 */
	private emitLayoutChange(): void {
		const layout = this.getLayout();
		for (const callback of this.layoutChangeCallbacks) {
			callback(layout);
		}
	}

	/**
	 * Emit tile focus event to all subscribers
	 */
	private emitTileFocus(tileId: string): void {
		for (const callback of this.tileFocusCallbacks) {
			callback(tileId);
		}
	}
}
