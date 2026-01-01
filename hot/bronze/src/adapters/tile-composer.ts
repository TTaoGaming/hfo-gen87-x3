/**
 * Tile Composer - Per-Tile Pipeline Composition with Golden Layout
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Dependency Injection for Tiles
 *
 * PRINCIPLE: Each tile can have its own pipeline with different adapter configs.
 * TileComposer wraps HFOPortFactory and GoldenLayoutShellAdapter to:
 * 1. Create independent pipelines per tile
 * 2. Allow runtime adapter swapping (e.g., switch 1€ to Rapier)
 * 3. Manage tile-to-pipeline mapping
 * 4. Support serialization of full app state
 *
 * ## Architecture
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    TileComposer                              │
 * │  ┌───────────┐  ┌───────────┐  ┌───────────┐               │
 * │  │ Tile A    │  │ Tile B    │  │ Tile C    │               │
 * │  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │               │
 * │  │ │1€ Filt│ │  │ │Rapier │ │  │ │Kalman │ │  ← Smoother  │
 * │  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │               │
 * │  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │               │
 * │  │ │XState │ │  │ │XState │ │  │ │XState │ │  ← FSM       │
 * │  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │               │
 * │  └───────────┘  └───────────┘  └───────────┘               │
 * │         ↓              ↓              ↓                     │
 * │  ┌──────────────────────────────────────────────────────┐  │
 * │  │          GoldenLayoutShellAdapter                     │  │
 * │  └──────────────────────────────────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 * ```typescript
 * const composer = new TileComposer({
 *   shell: { type: 'golden' },
 *   defaultSmoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 }
 * });
 *
 * await composer.initialize(containerEl);
 *
 * // Add tiles with different smoother configs
 * composer.addTile({ id: 'main', type: 'dom', title: 'Main App' });
 * composer.addTile({
 *   id: 'physics',
 *   type: 'canvas',
 *   title: 'Physics Demo',
 *   smootherConfig: { type: 'rapier-smooth', stiffness: 100, damping: 0.7 }
 * });
 *
 * // Process frame through all pipelines
 * const results = await composer.processFrame(videoEl, timestamp);
 * ```
 */
import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from '../contracts/ports.js';
import type {
	FSMAction,
	LayoutState,
	PointerEventOut,
	SensorFrame,
	ShellType,
	SmoothedFrame,
	TileConfig,
} from '../contracts/schemas.js';
import { type ComponentFactory, GoldenLayoutShellAdapter } from './golden-layout-shell.adapter.js';
import { HFOPortFactory, type ShellConfig, type SmootherConfig } from './port-factory.js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended tile config with per-tile smoother override
 */
export interface TileComposerTileConfig extends TileConfig {
	/** Override smoother config for this tile (default: use composer default) */
	smootherConfig?: SmootherConfig;
	/** Whether this tile should receive gesture input (default: true) */
	gestureEnabled?: boolean;
}

/**
 * Per-tile pipeline state
 */
interface TilePipeline {
	id: string;
	config: TileComposerTileConfig;
	smoother: SmootherPort;
	fsm: FSMPort;
	adapter: AdapterPort | null;
	emitter: EmitterPort;
	enabled: boolean;
}

/**
 * Composer configuration
 */
export interface TileComposerConfig {
	/** Shell configuration */
	shell: ShellConfig;
	/** Default smoother for tiles without override */
	defaultSmoother: SmootherConfig;
	/** Sensor configuration (shared across all tiles) */
	sensor?: { wasmPath?: string; modelPath?: string };
}

/**
 * Frame processing result per tile
 */
export interface TileFrameResult {
	tileId: string;
	smoothedFrame: SmoothedFrame;
	fsmAction: FSMAction;
	pointerEvent: PointerEventOut | null;
	injected: boolean;
}

/**
 * Serializable composer state
 */
export interface ComposerState {
	layout: LayoutState;
	tiles: Array<{
		id: string;
		config: TileComposerTileConfig;
		fsmState: string;
	}>;
	defaultSmoother: SmootherConfig;
}

// ============================================================================
// TILE COMPOSER
// ============================================================================

/**
 * TileComposer - Manages per-tile pipelines with Golden Layout integration
 */
export class TileComposer {
	private shell: UIShellPort | null = null;
	private sensor: SensorPort | null = null;
	private pipelines = new Map<string, TilePipeline>();
	private factory: HFOPortFactory;
	private initialized = false;
	private config: TileComposerConfig;

	// Component factories registered by user
	private componentFactories = new Map<string, ComponentFactory>();

	constructor(config: TileComposerConfig) {
		this.config = config;
		this.factory = new HFOPortFactory({
			smoother: config.defaultSmoother,
			shell: config.shell,
			sensor: config.sensor,
		});
	}

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	/**
	 * Initialize the composer with a container element
	 */
	async initialize(container: HTMLElement): Promise<void> {
		if (this.initialized) {
			throw new Error('TileComposer already initialized');
		}

		// Create shell based on config
		this.shell = this.factory.createShell(this.config.shell.type as ShellType);

		// Register component factories if shell supports it
		if (this.shell instanceof GoldenLayoutShellAdapter) {
			for (const [type, factory] of this.componentFactories) {
				(this.shell as GoldenLayoutShellAdapter).registerComponent(
					type as import('../contracts/schemas.js').TileType,
					factory,
				);
			}
		}

		// Initialize shell
		await this.shell.initialize(container, {
			shell: this.config.shell.type as ShellType,
			allowDragDrop: true,
			allowSplit: true,
			allowClose: true,
		});

		// Subscribe to tile focus changes
		this.shell.onTileFocus((tileId) => {
			this.handleTileFocus(tileId);
		});

		this.initialized = true;
	}

	/**
	 * Initialize sensor (call after initialize, before processFrame)
	 */
	async initializeSensor(): Promise<void> {
		if (!this.initialized) {
			throw new Error('TileComposer not initialized');
		}
		this.sensor = this.factory.createSensor();
		await this.sensor.initialize();
	}

	/**
	 * Register a component factory for tile rendering
	 * Must be called BEFORE initialize()
	 */
	registerComponent(type: string, factory: ComponentFactory): void {
		if (this.initialized) {
			throw new Error('Cannot register components after initialization');
		}
		this.componentFactories.set(type, factory);
	}

	// ============================================================================
	// TILE MANAGEMENT
	// ============================================================================

	/**
	 * Add a tile with its own pipeline
	 */
	addTile(config: TileComposerTileConfig): void {
		if (!this.initialized || !this.shell) {
			throw new Error('TileComposer not initialized');
		}

		// Add tile to shell
		this.shell.addTile(config);

		// Create pipeline for this tile
		this.createPipeline(config);
	}

	/**
	 * Remove a tile and its pipeline
	 */
	removeTile(tileId: string): void {
		if (!this.shell) return;

		// Remove from shell
		this.shell.removeTile(tileId);

		// Remove pipeline
		this.pipelines.delete(tileId);
	}

	/**
	 * Get all tile IDs
	 */
	getTileIds(): string[] {
		return Array.from(this.pipelines.keys());
	}

	/**
	 * Get tile configuration
	 */
	getTileConfig(tileId: string): TileComposerTileConfig | null {
		return this.pipelines.get(tileId)?.config ?? null;
	}

	/**
	 * Update tile smoother at runtime
	 */
	updateTileSmoother(tileId: string, config: SmootherConfig): void {
		const pipeline = this.pipelines.get(tileId);
		if (!pipeline) {
			throw new Error(`Tile '${tileId}' not found`);
		}

		// Create new smoother with updated config
		const newFactory = new HFOPortFactory({
			smoother: config,
			shell: this.config.shell,
		});

		pipeline.smoother = newFactory.createSmoother();
		pipeline.config.smootherConfig = config;
	}

	/**
	 * Enable/disable gesture input for a tile
	 */
	setTileGestureEnabled(tileId: string, enabled: boolean): void {
		const pipeline = this.pipelines.get(tileId);
		if (pipeline) {
			pipeline.enabled = enabled;
		}
	}

	// ============================================================================
	// FRAME PROCESSING
	// ============================================================================

	/**
	 * Process a video frame through all enabled tile pipelines
	 * @returns Results for each tile
	 */
	async processFrame(video: HTMLVideoElement, timestamp: number): Promise<TileFrameResult[]> {
		if (!this.sensor?.isReady) {
			throw new Error('Sensor not initialized');
		}

		// Get sensor frame (shared across all tiles)
		const sensorFrame = await this.sensor.sense(video, timestamp);

		// Process through each enabled pipeline
		const results: TileFrameResult[] = [];

		for (const [tileId, pipeline] of this.pipelines) {
			if (!pipeline.enabled) continue;

			const result = this.processTilePipeline(tileId, pipeline, sensorFrame);
			results.push(result);
		}

		return results;
	}

	/**
	 * Process sensor frame through a single tile's pipeline
	 */
	private processTilePipeline(
		tileId: string,
		pipeline: TilePipeline,
		sensorFrame: SensorFrame,
	): TileFrameResult {
		// Smooth
		const smoothedFrame = pipeline.smoother.smooth(sensorFrame);

		// FSM
		const fsmAction = pipeline.fsm.process(smoothedFrame);

		// Get target for this tile
		let pointerEvent: PointerEventOut | null = null;
		let injected = false;

		if (this.shell) {
			const target = this.shell.getTileTarget(tileId);
			if (target) {
				// Ensure we have an adapter for this tile
				if (!pipeline.adapter) {
					pipeline.adapter = this.factory.createAdapter(target);
				}

				// Emit pointer event
				pointerEvent = pipeline.emitter.emit(fsmAction, target);

				// Inject into target
				if (pointerEvent && pipeline.adapter) {
					injected = pipeline.adapter.inject(pointerEvent);
				}
			}
		}

		return {
			tileId,
			smoothedFrame,
			fsmAction,
			pointerEvent,
			injected,
		};
	}

	// ============================================================================
	// STATE MANAGEMENT
	// ============================================================================

	/**
	 * Get full composer state (for serialization)
	 */
	getState(): ComposerState {
		const tiles = Array.from(this.pipelines.values()).map((p) => ({
			id: p.id,
			config: p.config,
			fsmState: p.fsm.getState(),
		}));

		return {
			layout: this.shell?.getLayout() ?? { tiles: [], arrangement: '', shell: 'raw' },
			tiles,
			defaultSmoother: this.config.defaultSmoother,
		};
	}

	/**
	 * Restore composer state (from serialization)
	 */
	async restoreState(state: ComposerState): Promise<void> {
		if (!this.shell) {
			throw new Error('TileComposer not initialized');
		}

		// Clear existing pipelines
		this.pipelines.clear();

		// Restore layout
		this.shell.setLayout(state.layout);

		// Restore tiles and pipelines
		for (const tileState of state.tiles) {
			this.createPipeline(tileState.config);
		}

		// Update default smoother
		this.config.defaultSmoother = state.defaultSmoother;
	}

	// ============================================================================
	// LAYOUT OPERATIONS
	// ============================================================================

	/**
	 * Split a tile
	 */
	splitTile(
		tileId: string,
		direction: 'horizontal' | 'vertical',
		newTileConfig: TileComposerTileConfig,
	): void {
		if (!this.shell) return;

		this.shell.splitTile(tileId, direction, newTileConfig);
		this.createPipeline(newTileConfig);
	}

	/**
	 * Get current layout
	 */
	getLayout(): LayoutState | null {
		return this.shell?.getLayout() ?? null;
	}

	/**
	 * Subscribe to layout changes
	 */
	onLayoutChange(callback: (layout: LayoutState) => void): () => void {
		if (!this.shell) return () => {};
		return this.shell.onLayoutChange(callback);
	}

	// ============================================================================
	// CLEANUP
	// ============================================================================

	/**
	 * Dispose all resources
	 */
	dispose(): void {
		// Clear pipelines
		this.pipelines.clear();

		// Dispose shell
		this.shell?.dispose();
		this.shell = null;

		// Dispose sensor
		this.sensor?.dispose();
		this.sensor = null;

		this.initialized = false;
	}

	// ============================================================================
	// PRIVATE METHODS
	// ============================================================================

	/**
	 * Create a pipeline for a tile
	 */
	private createPipeline(config: TileComposerTileConfig): void {
		// Use tile-specific smoother config or default
		const smootherConfig = config.smootherConfig ?? this.config.defaultSmoother;

		// Create factory with tile-specific smoother
		const tileFactory = new HFOPortFactory({
			smoother: smootherConfig,
			shell: this.config.shell,
		});

		const pipeline: TilePipeline = {
			id: config.id,
			config,
			smoother: tileFactory.createSmoother(),
			fsm: tileFactory.createFSM(),
			adapter: null, // Created lazily when target is available
			emitter: tileFactory.createEmitter(),
			enabled: config.gestureEnabled !== false,
		};

		this.pipelines.set(config.id, pipeline);
	}

	/**
	 * Handle tile focus change
	 */
	private handleTileFocus(tileId: string): void {
		// Could be used to prioritize gesture input for focused tile
		// For now, just log
		console.log(`[TileComposer] Tile focused: ${tileId}`);
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a TileComposer with sensible defaults
 */
export function createTileComposer(options: Partial<TileComposerConfig> = {}): TileComposer {
	const defaultConfig: TileComposerConfig = {
		shell: { type: 'golden' },
		defaultSmoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 },
	};

	return new TileComposer({
		...defaultConfig,
		...options,
	});
}
