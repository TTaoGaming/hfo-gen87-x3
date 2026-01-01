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
	AdapterPort,
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

/** Registry for FSM adapters (Port 3 - XState, RxJS, Simple) */
export const FSMRegistry = new AdapterRegistry<FSMPort>();

/** Registry for Emitter adapters (Port 5 - W3C Pointer, Touch Emulator) */
export const EmitterRegistry = new AdapterRegistry<EmitterPort>();

/** Registry for Target adapters (Port 1 - DOM, Canvas, NATS) */
export const TargetRegistry = new AdapterRegistry<AdapterPort>();

/** Registry for Overlay adapters (Pixi, Canvas2D, DOM) */
export const OverlayRegistry = new AdapterRegistry<OverlayPort>();

/** Registry for UI Shell adapters (Port 7 - Golden Layout, Mosaic, Raw) */
export const UIShellRegistry = new AdapterRegistry<UIShellPort>();

// ============================================================================
// PREDICTOR PORT & REGISTRY (NEW - Stage 3)
// ============================================================================

import type { SmoothedFrame } from './schemas.js';

/**
 * Predicted frame with lookahead position
 * @source Kalman Filter (1960), Rapier Physics, Spring-Damper
 */
export interface PredictedFrame {
	/** Original smoothed frame */
	current: SmoothedFrame;
	/** Predicted position (lookahead) */
	predicted: {
		x: number;
		y: number;
		z: number;
		velocity: { x: number; y: number; z: number };
		confidence: number;
		lookAheadMs: number;
	};
}

/**
 * PredictorPort - Stage 3 of W3C Gesture Pipeline
 *
 * Purpose: Reduce perceived latency by predicting future pointer position
 *
 * Implementations:
 * - KalmanPredictorAdapter (default, low CPU)
 * - RapierPredictorAdapter (physics-based, high fidelity)
 * - SpringDamperAdapter (iOS-feel, rubbery)
 * - NoOpPredictorAdapter (passthrough for testing)
 */
export interface PredictorPort {
	/**
	 * Predict future position from smoothed frame
	 * @param frame - Smoothed frame from Stage 2
	 * @param lookAheadMs - How far ahead to predict (default 16ms = 1 frame)
	 * @returns Predicted frame with lookahead position
	 */
	predict(frame: SmoothedFrame, lookAheadMs?: number): PredictedFrame;

	/**
	 * Reset predictor state (call when tracking is lost)
	 */
	reset(): void;

	/**
	 * Get current predictor confidence (0-1)
	 */
	getConfidence(): number;
}

/** Registry for Predictor adapters (Port 2.5 - Kalman, Rapier, Spring-Damper) */
export const PredictorRegistry = new AdapterRegistry<PredictorPort>();

// ============================================================================
// PIPELINE COMPOSER TYPE
// ============================================================================

/**
 * Configuration for composing a complete gesture pipeline
 */
export interface PipelineComposition {
	/** Sensor adapter ID (or instance) */
	sensor: string | SensorPort;
	/** Smoother adapter ID (or instance) */
	smoother: string | SmootherPort;
	/** Predictor adapter ID (or instance) - optional */
	predictor?: string | PredictorPort;
	/** FSM adapter ID (or instance) */
	fsm: string | FSMPort;
	/** Emitter adapter ID (or instance) */
	emitter: string | EmitterPort;
	/** Target adapter ID (or instance) */
	target: string | AdapterPort;
	/** Overlay adapter ID (or instance) - optional */
	overlay?: string | OverlayPort;
	/** UI Shell adapter ID (or instance) - optional */
	uiShell?: string | UIShellPort;
}

/**
 * Resolved pipeline composition (all instances, no IDs)
 */
export interface ResolvedPipeline {
	sensor: SensorPort;
	smoother: SmootherPort;
	predictor?: PredictorPort;
	fsm: FSMPort;
	emitter: EmitterPort;
	target: AdapterPort;
	overlay?: OverlayPort;
	uiShell?: UIShellPort;
}

// ============================================================================
// HELPER: Create factory from class
// ============================================================================

/**
 * Create an AdapterFactory from a class constructor
 *
 * Usage:
 * ```typescript
 * const OneEuroFactory = createFactoryFromClass(OneEuroExemplarAdapter, {
 *   id: 'one-euro',
 *   name: '1€ Filter',
 *   version: '1.2.2',
 *   description: 'Speed-based low-pass filter',
 *   trl: 9,
 *   source: 'npm:1eurofilter',
 *   citation: 'Casiez et al. CHI 2012'
 * });
 * ```
 */
export function createFactoryFromClass<TPort, TConfig>(
	AdapterClass: new (config?: TConfig) => TPort,
	metadata: AdapterMetadata,
	defaultConfig: TConfig = {} as TConfig,
	configValidator?: (config?: TConfig) => { valid: boolean; errors?: string[] },
): AdapterFactory<TPort, TConfig> {
	return {
		metadata,
		create(config?: TConfig): TPort {
			return new AdapterClass(config ?? defaultConfig);
		},
		validateConfig(config?: TConfig): { valid: boolean; errors?: string[] } {
			if (configValidator) {
				return configValidator(config);
			}
			return { valid: true };
		},
		getDefaultConfig(): TConfig {
			return { ...defaultConfig };
		},
	};
}
