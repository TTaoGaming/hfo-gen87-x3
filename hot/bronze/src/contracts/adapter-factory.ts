/**
 * Polymorphic Adapter Factory - Runtime Composition Pattern
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Web Weaver (Port 1) + Kraken Keeper (Port 6)
 *
 * PRINCIPLE: "Easy to compose, easy to interlock"
 * - Adapters implement PORT INTERFACES (polymorphic)
 * - Factories create adapters at runtime (dependency injection)
 * - Registry enables discovery and swapping (hot-reload capable)
 *
 * This enables:
 * - Swap MediaPipe → WebXR sensor without code changes
 * - Swap 1€ filter → Kalman filter at runtime
 * - Test with mock adapters, deploy with real ones
 */
import type {
	EmitterPort,
	FSMPort,
	OverlayPort,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from './ports.js';

// ============================================================================
// ADAPTER METADATA
// ============================================================================

/**
 * Metadata for adapter registration
 * Used for discovery and compatibility checking
 */
export interface AdapterMetadata {
	/** Unique adapter identifier (e.g., "mediapipe-sensor", "one-euro-smoother") */
	id: string;
	/** Human-readable name */
	name: string;
	/** Adapter version (semver) */
	version: string;
	/** Short description */
	description: string;
	/** TRL level (9 = production proven) */
	trl: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
	/** Source package (npm package name or URL) */
	source: string;
	/** Citation (for academic exemplars) */
	citation?: string;
	/** Required configuration keys */
	requiredConfig?: string[];
	/** Browser compatibility */
	browser?: {
		chrome?: string;
		firefox?: string;
		safari?: string;
		edge?: string;
	};
}

// ============================================================================
// GENERIC ADAPTER FACTORY INTERFACE
// ============================================================================

/**
 * Generic factory interface for creating adapters
 *
 * @typeParam TPort - The port interface this factory creates
 * @typeParam TConfig - Configuration type for adapter creation
 */
export interface AdapterFactory<TPort, TConfig = Record<string, unknown>> {
	/** Factory metadata */
	readonly metadata: AdapterMetadata;

	/** Create an adapter instance with configuration */
	create(config?: TConfig): TPort;

	/** Validate configuration before creation */
	validateConfig(config?: TConfig): { valid: boolean; errors?: string[] };

	/** Get default configuration */
	getDefaultConfig(): TConfig;
}

// ============================================================================
// ADAPTER REGISTRY
// ============================================================================

/**
 * Registry for discovering and instantiating adapters
 *
 * Usage:
 * ```typescript
 * const registry = new AdapterRegistry<SmootherPort>();
 * registry.register('one-euro', OneEuroFactory);
 * registry.register('kalman', KalmanFactory);
 *
 * const smoother = registry.create('one-euro', { beta: 0.007 });
 * ```
 */
export class AdapterRegistry<TPort> {
	private factories = new Map<string, AdapterFactory<TPort, unknown>>();

	/**
	 * Register an adapter factory
	 */
	register<TConfig>(id: string, factory: AdapterFactory<TPort, TConfig>): void {
		if (this.factories.has(id)) {
			throw new Error(`Adapter "${id}" is already registered`);
		}
		this.factories.set(id, factory as AdapterFactory<TPort, unknown>);
	}

	/**
	 * Unregister an adapter factory
	 */
	unregister(id: string): boolean {
		return this.factories.delete(id);
	}

	/**
	 * Create an adapter instance
	 */
	create<TConfig>(id: string, config?: TConfig): TPort {
		const factory = this.factories.get(id);
		if (!factory) {
			throw new Error(`Adapter "${id}" not found. Available: ${this.getAvailableIds().join(', ')}`);
		}

		const validation = factory.validateConfig(config);
		if (!validation.valid) {
			throw new Error(`Invalid config for "${id}": ${validation.errors?.join(', ')}`);
		}

		return factory.create(config);
	}

	/**
	 * Get metadata for an adapter
	 */
	getMetadata(id: string): AdapterMetadata | undefined {
		return this.factories.get(id)?.metadata;
	}

	/**
	 * Get all registered adapter IDs
	 */
	getAvailableIds(): string[] {
		return Array.from(this.factories.keys());
	}

	/**
	 * Get all registered adapters with metadata
	 */
	getAll(): Array<{ id: string; metadata: AdapterMetadata }> {
		return Array.from(this.factories.entries()).map(([id, factory]) => ({
			id,
			metadata: factory.metadata,
		}));
	}

	/**
	 * Filter adapters by TRL level
	 */
	getByTRL(minTRL: number): Array<{ id: string; metadata: AdapterMetadata }> {
		return this.getAll().filter(({ metadata }) => metadata.trl >= minTRL);
	}

	/**
	 * Check if an adapter is registered
	 */
	has(id: string): boolean {
		return this.factories.has(id);
	}
}

// ============================================================================
// PORT-SPECIFIC REGISTRIES (Pre-configured singletons)
// ============================================================================

/** Registry for Sensor adapters (Port 0 - MediaPipe, WebXR, Mock) */
export const SensorRegistry = new AdapterRegistry<SensorPort>();

/** Registry for Smoother adapters (Port 2 - 1€ Filter, Kalman, NoOp) */
export const SmootherRegistry = new AdapterRegistry<SmootherPort>();

/** Registry for Predictor adapters (Port 2.5 - DESP, Kalman) */
export const PredictorRegistry = new AdapterRegistry<any>();

/** Registry for FSM adapters (Port 3 - XState, RxJS, Simple) */
export const FSMRegistry = new AdapterRegistry<FSMPort>();

/** Registry for Emitter adapters (Port 5 - W3C Pointer, Touch Emulator) */
export const EmitterRegistry = new AdapterRegistry<EmitterPort>();

/** Registry for Target adapters (Port 1 - DOM, Canvas, NATS) */
export const TargetRegistry = new AdapterRegistry<any>(); // Using any for generic target port

/** Registry for Overlay adapters (Pixi, Canvas2D, DOM) */
export const OverlayRegistry = new AdapterRegistry<OverlayPort>();

/** Registry for UI Shell adapters (Port 7 - Golden Layout, Mosaic, Raw) */
export const UIShellRegistry = new AdapterRegistry<UIShellPort>();

/**
 * Pipeline Composition - IDs of adapters to use for each stage
 */
export interface PipelineComposition {
	sensor: string;
	smoother: string;
	predictor?: string | undefined;
	fsm: string;
	emitter: string;
	target: string;
	overlay?: string | undefined;
}

/**
 * Resolved Pipeline - Actual adapter instances
 */
export interface ResolvedPipeline {
	sensor: SensorPort;
	smoother: SmootherPort;
	predictor?: any | undefined;
	fsm: FSMPort;
	emitter: EmitterPort;
	target: any;
	overlay?: OverlayPort | undefined;
}
