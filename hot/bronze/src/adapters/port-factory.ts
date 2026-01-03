/**
 * HFO Port Factory
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Implements PortFactory
 *
 * PRINCIPLE: Factory wires adapters via DI, enabling swap-ability.
 *
 * Supported adapters:
 * - SensorPort: MediaPipeAdapter
 * - SmootherPort: OneEuroExemplarAdapter, RapierPhysicsAdapter
 * - FSMPort: XStateFSMAdapter
 * - EmitterPort: PointerEventAdapter
 * - UIShellPort: GoldenLayoutShellAdapter, RawHTMLShellAdapter
 */
import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	OverlayPort,
	PortFactory,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from '../contracts/ports.js';
import type {
	AdapterTarget,
	LayoutNode,
	LayoutState,
	OverlayConfig,
	ShellType,
	TileConfig,
	UIShellConfig,
} from '../contracts/schemas.js';
import { DoubleExponentialPredictor } from './double-exponential-predictor.adapter.js';
import { GoldenLayoutShellAdapter } from './golden-layout-shell.adapter.js';
import { MediaPipeAdapter } from './mediapipe.adapter.js';
import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
import { PointerEventAdapter } from './pointer-event.adapter.js';
import { NullOverlayAdapter } from './quarantine/stub-overlay.adapter.js';
import { RapierPhysicsAdapter } from './rapier-physics.adapter.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Smoother configuration supporting 1€ filter and Rapier physics
 */
export interface SmootherConfig {
	/** Smoother algorithm type */
	type: '1euro' | 'rapier-smooth' | 'rapier-predict' | 'rapier-adaptive' | 'desp';

	// 1€ filter options
	/** Minimum cutoff frequency (1€ filter) - lower = more smoothing at low speeds */
	minCutoff?: number;
	/** Speed coefficient (1€ filter) - higher = less lag at high speeds */
	beta?: number;
	/** Derivative cutoff (1€ filter) */
	dCutoff?: number;

	// Rapier physics options
	/** Spring stiffness (Rapier) - higher = snappier response */
	stiffness?: number;
	/** Damping ratio (Rapier) - 0.7 = underdamped, 1.0 = critical */
	damping?: number;
	/** Prediction lookahead in ms (Rapier predictive mode only) */
	predictionMs?: number;

	// Rapier adaptive mode options (1€ physics)
	/** Minimum stiffness at rest (Rapier adaptive mode) */
	minStiffness?: number;
	/** Speed coefficient for adaptive stiffness (Rapier adaptive mode) */
	speedCoefficient?: number;
	/** Maximum stiffness cap (Rapier adaptive mode) */
	maxStiffness?: number;

	// DESP (Double Exponential Smoothing Predictor) options
	/**
	 * Smoothing factor α ∈ (0,1) for DESP
	 * Higher = more responsive, lower = smoother
	 * @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
	 */
	alpha?: number;
}

/**
 * Shell configuration
 */
export interface ShellConfig {
	/** Shell/window manager type */
	type: 'golden' | 'raw' | 'mosaic' | 'daedalos';
}

/**
 * Sensor configuration
 */
export interface SensorConfig {
	/** Path to MediaPipe WASM files */
	wasmPath?: string;
	/** Path to gesture recognizer model */
	modelPath?: string;
}

/**
 * Complete factory configuration
 */
export interface PortFactoryConfig {
	/** Smoother adapter configuration */
	smoother: SmootherConfig;
	/** Shell adapter configuration */
	shell: ShellConfig;
	/** Optional sensor configuration */
	sensor?: SensorConfig;
}

// ============================================================================
// RAPIER SMOOTHER WRAPPER (Adapts RapierPhysicsAdapter to SmootherPort)
// ============================================================================

/**
 * RapierSmootherAdapter - Wraps RapierPhysicsAdapter to match SmootherPort interface
 *
 * The issue: SmootherPort.setParams(mincutoff, beta) vs RapierPhysicsAdapter.setParams(config)
 * This wrapper maps the 1€ filter params to Rapier physics params.
 */
class RapierSmootherAdapter implements SmootherPort {
	constructor(private readonly rapier: RapierPhysicsAdapter) {}

	smooth(
		frame: import('../contracts/schemas.js').SensorFrame,
	): import('../contracts/schemas.js').SmoothedFrame {
		return this.rapier.smooth(frame);
	}

	reset(): void {
		this.rapier.reset();
	}

	/**
	 * Map 1€ filter params to Rapier physics params
	 * Delegates to RapierPhysicsAdapter.setParams which handles mode-specific mapping
	 */
	setParams(mincutoff: number, beta: number): void {
		// RapierPhysicsAdapter.setParams handles mode-specific mapping internally
		this.rapier.setParams(mincutoff, beta);
	}
}

// ============================================================================
// VIRTUAL DOM ADAPTER (Adapts AdapterTarget to AdapterPort without real DOM)
// ============================================================================

/**
 * VirtualDOMAdapter - Creates a virtual adapter for headless environments
 *
 * For test/headless environments where real DOM elements aren't available.
 * In browser, we'd use the real DOMAdapter from pointer-event.adapter.ts
 */
class VirtualDOMAdapter {
	private _bounds: AdapterTarget['bounds'];
	private _hasCapture = false;

	constructor(target: AdapterTarget) {
		this._bounds = target.bounds;
	}

	inject(_event: import('../contracts/schemas.js').PointerEventOut): boolean {
		// In virtual mode, we just accept the event
		// Real DOMAdapter would dispatch to actual DOM element
		return true;
	}

	getBounds(): AdapterTarget['bounds'] {
		return this._bounds;
	}

	setCapture(): void {
		this._hasCapture = true;
	}

	releaseCapture(): void {
		this._hasCapture = false;
	}

	hasCapture(): boolean {
		return this._hasCapture;
	}
}

// ============================================================================
// RAW HTML SHELL ADAPTER (Fallback)
// ============================================================================

/**
 * RawHTMLShellAdapter - Simple div-based shell (no external dependencies)
 *
 * Used as fallback when GoldenLayout is not available or for simple layouts.
 */
export class RawHTMLShellAdapter implements UIShellPort {
	private container: HTMLElement | null = null;
	private tiles = new Map<string, { config: TileConfig; element: HTMLElement | null }>();
	private layoutChangeCallbacks = new Set<(layout: LayoutState) => void>();
	private tileFocusCallbacks = new Set<(tileId: string) => void>();
	private arrangement: LayoutNode = '';

	async initialize(container: HTMLElement, config: UIShellConfig): Promise<void> {
		this.container = container;
		this.container.style.position = 'relative';
		this.container.style.width = '100%';
		this.container.style.height = '100%';

		// Apply initial layout if provided
		if (config.initialLayout) {
			this.setLayout(config.initialLayout);
		}
	}

	getTileTarget(tileId: string): AdapterTarget | null {
		const tile = this.tiles.get(tileId);
		if (!tile?.element) return null;

		const rect = tile.element.getBoundingClientRect();
		return {
			type: 'element',
			bounds: {
				width: rect.width,
				height: rect.height,
				left: rect.left,
				top: rect.top,
			},
		};
	}

	getTileIds(): string[] {
		return Array.from(this.tiles.keys());
	}

	addTile(config: TileConfig): void {
		if (!this.container) return;

		const element = document.createElement('div');
		element.id = `tile-${config.id}`;
		element.style.position = 'absolute';
		element.style.border = '1px solid #ccc';
		element.style.overflow = 'hidden';
		element.dataset.tileId = config.id;

		// Simple grid layout for new tiles
		const count = this.tiles.size;
		const cols = Math.ceil(Math.sqrt(count + 1));
		const width = 100 / cols;
		element.style.width = `${width}%`;
		element.style.height = '100%';
		element.style.left = `${(count % cols) * width}%`;
		element.style.top = '0';

		this.container.appendChild(element);
		this.tiles.set(config.id, { config, element });

		// Notify listeners
		this.notifyLayoutChange();
	}

	removeTile(tileId: string): void {
		const tile = this.tiles.get(tileId);
		if (tile?.element) {
			tile.element.remove();
			this.tiles.delete(tileId);
			this.notifyLayoutChange();
		}
	}

	splitTile(_tileId: string, _direction: 'horizontal' | 'vertical', newTile: TileConfig): void {
		// Simple implementation: just add new tile
		this.addTile(newTile);
	}

	getLayout(): LayoutState {
		const tiles = Array.from(this.tiles.values()).map((t) => t.config);
		return {
			tiles,
			arrangement: this.arrangement || '',
			shell: 'raw',
		};
	}

	setLayout(state: LayoutState): void {
		// Clear existing tiles
		for (const [id] of this.tiles) {
			this.removeTile(id);
		}

		// Add tiles from layout
		for (const tileConfig of state.tiles) {
			this.addTile(tileConfig);
		}

		this.arrangement = state.arrangement;
	}

	onLayoutChange(callback: (layout: LayoutState) => void): () => void {
		this.layoutChangeCallbacks.add(callback);
		return () => this.layoutChangeCallbacks.delete(callback);
	}

	onTileFocus(callback: (tileId: string) => void): () => void {
		this.tileFocusCallbacks.add(callback);
		return () => this.tileFocusCallbacks.delete(callback);
	}

	dispose(): void {
		if (this.container) {
			// Remove all tiles
			for (const [, tile] of this.tiles) {
				tile.element?.remove();
			}
			this.tiles.clear();
		}
		this.layoutChangeCallbacks.clear();
		this.tileFocusCallbacks.clear();
		this.container = null;
	}

	private notifyLayoutChange(): void {
		const layout = this.getLayout();
		for (const callback of this.layoutChangeCallbacks) {
			callback(layout);
		}
	}
}

// ============================================================================
// HFO PORT FACTORY
// ============================================================================

/**
 * HFOPortFactory - Central factory for all port adapters
 *
 * PRINCIPLE: All adapter creation goes through factory for DI flexibility.
 *
 * ## Usage
 * ```typescript
 * const factory = new HFOPortFactory({
 *   smoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 },
 *   shell: { type: 'golden' }
 * });
 *
 * const sensor = factory.createSensor();
 * const smoother = factory.createSmoother();
 * const fsm = factory.createFSM();
 * const shell = factory.createShell('golden');
 * ```
 */
export class HFOPortFactory implements PortFactory {
	constructor(private readonly config: PortFactoryConfig) {}

	/**
	 * Create a SensorPort (MediaPipeAdapter)
	 */
	createSensor(): SensorPort {
		const sensorConfig = this.config.sensor;
		if (sensorConfig?.modelPath && sensorConfig?.wasmPath) {
			return new MediaPipeAdapter(sensorConfig.modelPath, sensorConfig.wasmPath);
		}
		return new MediaPipeAdapter();
	}

	/**
	 * Create a SmootherPort based on config type
	 * - '1euro': OneEuroExemplarAdapter (npm exemplar)
	 * - 'rapier-smooth': RapierPhysicsAdapter in smoothed mode
	 * - 'rapier-predict': RapierPhysicsAdapter in predictive mode
	 * - 'rapier-adaptive': RapierPhysicsAdapter with 1€-inspired adaptive physics
	 */
	createSmoother(): SmootherPort {
		const { smoother } = this.config;

		switch (smoother.type) {
			case '1euro': {
				// Build config object with only defined properties (exactOptionalPropertyTypes)
				const config: import('./one-euro-exemplar.adapter.js').OneEuroConfig = {};
				if (smoother.minCutoff !== undefined) config.minCutoff = smoother.minCutoff;
				if (smoother.beta !== undefined) config.beta = smoother.beta;
				if (smoother.dCutoff !== undefined) config.dCutoff = smoother.dCutoff;
				return new OneEuroExemplarAdapter(config);
			}

			case 'rapier-smooth': {
				// Build config object with only defined properties
				const config: Partial<import('./rapier-physics.adapter.js').RapierConfig> = {
					mode: 'smoothed',
				};
				if (smoother.stiffness !== undefined) config.stiffness = smoother.stiffness;
				if (smoother.damping !== undefined) config.damping = smoother.damping;
				return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
			}

			case 'rapier-predict': {
				// Build config object with only defined properties
				const config: Partial<import('./rapier-physics.adapter.js').RapierConfig> = {
					mode: 'predictive',
				};
				if (smoother.stiffness !== undefined) config.stiffness = smoother.stiffness;
				if (smoother.damping !== undefined) config.damping = smoother.damping;
				if (smoother.predictionMs !== undefined) config.predictionMs = smoother.predictionMs;
				return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
			}

			case 'rapier-adaptive': {
				// 1€ PHYSICS: Rapier with velocity-adaptive stiffness
				const config: Partial<import('./rapier-physics.adapter.js').RapierConfig> = {
					mode: 'adaptive',
				};
				if (smoother.minStiffness !== undefined) config.minStiffness = smoother.minStiffness;
				if (smoother.speedCoefficient !== undefined)
					config.speedCoefficient = smoother.speedCoefficient;
				if (smoother.maxStiffness !== undefined) config.maxStiffness = smoother.maxStiffness;
				if (smoother.damping !== undefined) config.damping = smoother.damping;
				return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
			}

			case 'desp': {
				// DESP: Double Exponential Smoothing Predictor (LaViola 2003)
				// @source https://cs.brown.edu/people/jlaviola/pubs/kfvsexp_final_laviola.pdf
				const config: Partial<import('./double-exponential-predictor.adapter.js').DESPConfig> = {};
				if (smoother.alpha !== undefined) config.alpha = smoother.alpha;
				if (smoother.predictionMs !== undefined) config.predictionMs = smoother.predictionMs;
				return new DoubleExponentialPredictor(config);
			}

			default: {
				// TypeScript exhaustiveness check
				const _exhaustive: never = smoother.type;
				throw new Error(`Unknown smoother type: ${_exhaustive}`);
			}
		}
	}

	/**
	 * Create an FSMPort (XStateFSMAdapter)
	 */
	createFSM(): FSMPort {
		return new XStateFSMAdapter();
	}

	/**
	 * Create an EmitterPort (PointerEventAdapter)
	 */
	createEmitter(): EmitterPort {
		return new PointerEventAdapter();
	}

	/**
	 * Create an AdapterPort for target injection
	 */
	createAdapter(target: AdapterTarget): AdapterPort {
		// VirtualDOMAdapter handles all target types for headless/test environments
		// In browser with real DOM, use DOMAdapter from pointer-event.adapter.ts directly
		return new VirtualDOMAdapter(target);
	}

	/**
	 * Create an OverlayPort (Null until Canvas2D/Pixi implemented)
	 */
	createOverlay(_config: OverlayConfig): OverlayPort {
		return new NullOverlayAdapter();
	}

	/**
	 * Create a UIShellPort based on shell type
	 * - 'golden': GoldenLayoutShellAdapter
	 * - 'raw': RawHTMLShellAdapter (simple divs)
	 * - others: Fallback to RawHTMLShellAdapter
	 */
	createShell(type: ShellType): UIShellPort {
		switch (type) {
			case 'golden':
				return new GoldenLayoutShellAdapter();

			case 'raw':
				return new RawHTMLShellAdapter();

			case 'mosaic':
			case 'daedalos':
				// Not implemented yet - fallback to raw
				return new RawHTMLShellAdapter();

			default: {
				// Fallback for unknown types
				return new RawHTMLShellAdapter();
			}
		}
	}
}
