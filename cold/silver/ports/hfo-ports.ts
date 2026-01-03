/**
 * HFO 8-Port Interface Contracts
 *
 * Gen87.X3 | Port 7 Navigator | Spider Sovereign
 *
 * PRINCIPLE: "All ports talk through strict contracts - never directly"
 *
 * The 8-Port Hexagonal Architecture:
 * @0 SENSE   (Lidless Legion)   - Observe, tag, snapshot
 * @1 FUSE    (Web Weaver)       - Validate, envelope, route
 * @2 SHAPE   (Mirror Magus)     - Transform, smooth
 * @3 DELIVER (Spore Storm)      - Emit FSM events
 * @4 TEST    (Red Regnant)      - Predict, validate properties
 * @5 DEFEND  (Pyre Praetorian)  - Gate, emit pointer events
 * @6 STORE   (Kraken Keeper)    - Persist, target dispatch
 * @7 DECIDE  (Spider Sovereign) - Compose, route, decide
 *
 * DARPA MOSAIC: Each port is a "tile" that can be hot-swapped at runtime.
 */

import { z } from 'zod';

// ============================================================================
// COMMON TYPES
// ============================================================================

/** Port number type - exactly 0-7 */
export type PortNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Port health status */
export interface PortHealth {
	port: PortNumber;
	name: string;
	status: 'online' | 'degraded' | 'offline';
	lastHeartbeat: number;
	adapters: string[];
}

/** Base port metadata */
export interface PortMetadata {
	port: PortNumber;
	name: string;
	verb: string;
	commander: string;
	can: readonly string[];
	cannot: readonly string[];
}

/** CloudEvent envelope for inter-port communication */
export const CloudEventSchema = z.object({
	specversion: z.literal('1.0'),
	id: z.string().uuid(),
	source: z.string(),
	type: z.string(),
	time: z.string().datetime(),
	data: z.unknown(),
	// HFO Extensions
	hfoport: z.number().int().min(0).max(7),
	hfogen: z.number().int().min(85),
	hfohive: z.enum(['H', 'I', 'V', 'E', 'X']),
});

export type CloudEvent = z.infer<typeof CloudEventSchema>;

// ============================================================================
// @0 SENSE PORT - Lidless Legion
// ============================================================================

/**
 * Port 0: SENSE - Lidless Legion
 *
 * "The eye that watches itself watching"
 *
 * CAN: read, tag, observe, snapshot
 * CANNOT: modify, transform, persist, decide, emit
 *
 * Observes raw input (camera, MediaPipe) and tags with metadata.
 * Never transforms data - only observes and forwards.
 */
export interface SensePort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/** Initialize the sensor (load ML model, etc.) */
	initialize(): Promise<void>;

	/**
	 * Observe a video frame and detect gestures
	 * Returns tagged observation - NEVER transforms
	 */
	sense(video: HTMLVideoElement, timestamp: number): Promise<SenseResult>;

	/** Tag observation with metadata */
	tag(observation: SenseResult, tags: Record<string, unknown>): SenseResult;

	/** Snapshot current state for debugging */
	snapshot(): SenseSnapshot;

	/** Release resources */
	dispose(): void;

	/** Is sensor ready? */
	readonly isReady: boolean;
}

export interface SenseResult {
	port: 0;
	timestamp: number;
	frameId: string;
	source: 'camera' | 'mediapipe' | 'mock';
	landmarks: NormalizedLandmark[] | null;
	gesture: string | null;
	handedness: 'Left' | 'Right' | null;
	confidence: number;
	tags: Record<string, unknown>;
}

export interface SenseSnapshot {
	port: 0;
	timestamp: number;
	isReady: boolean;
	lastFrame: SenseResult | null;
	frameCount: number;
}

export interface NormalizedLandmark {
	x: number;
	y: number;
	z: number;
}

// ============================================================================
// @1 FUSE PORT - Web Weaver
// ============================================================================

/**
 * Port 1: FUSE - Web Weaver
 *
 * "The bridge that builds itself"
 *
 * CAN: read, validate, compose, route
 * CANNOT: persist, decide, skip_validation
 *
 * Validates all incoming data and wraps in CloudEvents envelope.
 * The strict schema gatekeeper - nothing passes without validation.
 */
export interface FusePort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Validate incoming data against schema
	 * MUST throw if invalid
	 */
	validate<T>(data: unknown, schema: z.ZodType<T>): T;

	/**
	 * Wrap data in CloudEvents envelope
	 * All inter-port communication uses this
	 */
	envelope(data: unknown, type: string, source: PortNumber): CloudEvent;

	/**
	 * Route CloudEvent to target port
	 * Returns routed event with target port set
	 */
	route(event: CloudEvent, target: PortNumber): CloudEvent;

	/**
	 * Compose multiple CloudEvents into batch
	 */
	compose(events: CloudEvent[]): CloudEvent[];
}

// ============================================================================
// @2 SHAPE PORT - Mirror Magus
// ============================================================================

/**
 * Port 2: SHAPE - Mirror Magus
 *
 * "The mirror that reflects itself"
 *
 * CAN: read, transform, tag
 * CANNOT: persist, decide, emit_output, invoke_external
 *
 * ALL transformation - smoothing, physics, prediction.
 * Takes raw Port 0 data + Port 1 contracts → stable physics object.
 * Includes: 1€ filter + Rapier physics + momentum prediction
 */
export interface ShapePort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Transform/smooth input data
	 * Returns shaped output - pure function
	 */
	shape(input: SenseResult): ShapeResult;

	/**
	 * Predict future position based on velocity
	 * Uses momentum extrapolation or Kalman filtering
	 * @param input - Current shaped frame with velocity
	 * @param lookahead - Frames ahead to predict
	 */
	predict(input: ShapeResult, lookahead: number): ShapePrediction;

	/** Reset transformation state */
	reset(): void;

	/** Update transformation parameters */
	setParams(params: ShapeParams): void;

	/** Tag shaped result with transformation metadata */
	tag(result: ShapeResult, tags: Record<string, unknown>): ShapeResult;
}

export interface ShapeResult {
	port: 2;
	timestamp: number;
	frameId: string;
	position: { x: number; y: number };
	velocity: { x: number; y: number };
	smoothed: boolean;
	filterParams: ShapeParams;
	inputPort: 0;
}

export interface ShapeParams {
	mincutoff: number;
	beta: number;
	dcutoff: number;
}

export interface ShapePrediction {
	port: 2;
	timestamp: number;
	frameId: string;
	predicted: { x: number; y: number };
	confidence: number;
	lookahead: number;
	method: 'momentum' | 'kalman' | 'spring';
	inputPort: 2;
}

// ============================================================================
// @3 DELIVER PORT - Spore Storm
// ============================================================================

/**
 * Port 3: DELIVER - Spore Storm
 *
 * "The message that sends itself"
 *
 * CAN: read, emit_output, invoke_external, tag
 * CANNOT: decide, persist, validate, transform
 *
 * FSM state management, W3C event creation, AND DOM dispatch.
 * Delivers state transitions and events to the outside world.
 */
export interface DeliverPort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Process shaped frame through FSM
	 * Returns action to deliver
	 */
	process(frame: ShapeResult): DeliverAction;

	/**
	 * Create W3C PointerEvent from action
	 * @param action - FSM action to convert
	 * @param target - Target bounds for coordinate mapping
	 */
	emit(action: DeliverAction, target: TargetBounds): DeliverEvent | null;

	/**
	 * Dispatch event to DOM target
	 * This is the final output - actually fires the event
	 */
	dispatch(event: DeliverEvent, target: HTMLElement): boolean;

	/** Get current FSM state */
	getState(): string;

	/** Disarm FSM (force to safe state) */
	disarm(): void;

	/** Subscribe to state changes */
	subscribe(callback: (state: string, action: DeliverAction) => void): () => void;

	/** Tag action with delivery metadata */
	tag(action: DeliverAction, tags: Record<string, unknown>): DeliverAction;
}

export interface DeliverAction {
	port: 3;
	timestamp: number;
	frameId: string;
	state: string;
	eventType: 'pointermove' | 'pointerdown' | 'pointerup' | 'pointercancel' | null;
	position: { x: number; y: number };
	buttons: number;
	inputPort: 2;
}

export interface DeliverEvent {
	port: 3;
	timestamp: number;
	frameId: string;
	type: 'pointermove' | 'pointerdown' | 'pointerup' | 'pointercancel';
	clientX: number;
	clientY: number;
	pointerId: number;
	pointerType: 'pen';
	pressure: number;
	buttons: number;
	isPrimary: boolean;
	inputPort: 3;
}

// ============================================================================
// @4 TEST PORT - Red Regnant
// ============================================================================

/**
 * Port 4: TEST - Red Regnant
 *
 * "The Red Queen runs to stand still"
 *
 * CAN: read, validate, invoke
 * CANNOT: persist, decide, emit_output, modify, transform
 *
 * Property-based testing and adversarial validation ONLY.
 * Does NOT predict - prediction is transformation (@2 Shaper).
 * Red Queen = evolutionary pressure, run to stay in place.
 */
export interface TestPort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Validate shaped output against constraints
	 * Returns fitness score
	 */
	validate(shaped: ShapeResult): TestValidation;

	/**
	 * Validate prediction against actual outcome
	 * Tests Shaper's prediction accuracy
	 */
	validatePrediction(prediction: ShapePrediction, actual: ShapeResult): TestValidation;

	/**
	 * Run property-based test
	 * Returns pass/fail with counterexamples
	 */
	property<T>(name: string, generator: () => T, predicate: (value: T) => boolean): TestPropertyResult;

	/**
	 * Run mutation test against a function
	 * Returns mutation score
	 */
	mutate<T, R>(fn: (input: T) => R, inputs: T[]): TestMutationResult;

	/**
	 * Run adversarial test
	 * Generates worst-case inputs to break invariants
	 */
	adversarial<T>(name: string, generator: () => T, invariant: (value: T) => boolean): TestPropertyResult;
}

export interface TestValidation {
	port: 4;
	timestamp: number;
	fitness: number;
	error: { x: number; y: number } | null;
	pass: boolean;
	violations: string[];
}

export interface TestPropertyResult {
	port: 4;
	name: string;
	pass: boolean;
	runs: number;
	counterexample: unknown | null;
}

export interface TestMutationResult {
	port: 4;
	totalMutants: number;
	killed: number;
	survived: number;
	score: number;
	survivors: string[];
}

// ============================================================================
// @5 DEFEND PORT - Pyre Praetorian
// ============================================================================

/**
 * Port 5: DEFEND - Pyre Praetorian
 *
 * "The flame that judges itself"
 *
 * CAN: read, gate, tag
 * CANNOT: modify, persist, decide, emit_output, transform
 *
 * Pure GATING - validates and blocks invalid inputs.
 * Does NOT emit or create events - only approves/rejects.
 * Defends the pipeline from invalid data.
 */
export interface DefendPort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Gate action - validate before allowing through
	 * Returns gated action if valid, null if blocked
	 */
	gate(action: DeliverAction): DefendGate;

	/**
	 * Validate palm cone angle
	 * Blocks if palm not facing camera
	 */
	gatePalmCone(landmarks: NormalizedLandmark[], threshold: number): DefendGate;

	/**
	 * Validate gesture transition
	 * Blocks invalid state transitions
	 */
	gateTransition(from: string, to: string): DefendGate;

	/**
	 * Validate HIVE phase sequence
	 * Blocks out-of-order phase transitions
	 */
	gateHIVE(currentPhase: string, nextPhase: string): DefendGate;

	/**
	 * Rate limit gate
	 * Blocks if rate exceeded
	 */
	gateRate(key: string, maxPerSecond: number): DefendGate;

	/** Tag gate result with defense metadata */
	tag(gate: DefendGate, tags: Record<string, unknown>): DefendGate;
}

export interface DefendGate {
	port: 5;
	timestamp: number;
	allowed: boolean;
	reason: string | null;
	gateName: 'action' | 'palmCone' | 'transition' | 'hive' | 'rate';
	inputPort: 3;
	tags: Record<string, unknown>;
}

export interface TargetBounds {
	left: number;
	top: number;
	width: number;
	height: number;
}

// ============================================================================
// @6 STORE PORT - Kraken Keeper
// ============================================================================

/**
 * Port 6: STORE - Kraken Keeper
 *
 * "The memory that remembers itself"
 *
 * CAN: read, persist, tag
 * CANNOT: transform, decide, validate, emit_output
 *
 * Pure STORAGE - state, config, history, blackboard.
 * Does NOT dispatch events - that's Port 3's job.
 */
export interface StorePort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Persist data to storage
	 */
	persist(key: string, data: unknown): Promise<void>;

	/**
	 * Recall data from storage
	 */
	recall<T>(key: string): Promise<T | null>;

	/**
	 * Store FSM state
	 */
	storeState(fsmId: string, state: string): Promise<void>;

	/**
	 * Recall FSM state
	 */
	recallState(fsmId: string): Promise<string | null>;

	/**
	 * Store event history
	 */
	storeEvent(event: StoreEvent): Promise<void>;

	/**
	 * Recall event history
	 * @param limit - Max events to return
	 */
	recallEvents(limit: number): Promise<StoreEvent[]>;

	/**
	 * Emit signal to blackboard (stigmergy)
	 */
	emitSignal(signal: StoreSignal): Promise<void>;

	/**
	 * Read signals from blackboard
	 */
	readSignals(limit: number): Promise<StoreSignal[]>;

	/** Tag with storage metadata */
	tag(data: unknown, tags: Record<string, unknown>): unknown;
}

export interface StoreEvent {
	port: 6;
	timestamp: number;
	type: string;
	data: unknown;
	tags: Record<string, unknown>;
}

export interface StoreSignal {
	ts: string;
	mark: number;
	pull: 'upstream' | 'downstream' | 'lateral';
	msg: string;
	type: 'signal' | 'event' | 'error' | 'metric';
	hive: 'H' | 'I' | 'V' | 'E' | 'X';
	gen: number;
	port: PortNumber;
}

// ============================================================================
// @7 DECIDE PORT - Spider Sovereign (Navigator/Orchestrator)
// ============================================================================

/**
 * Port 7: DECIDE - Spider Sovereign
 *
 * "The spider weaves the web that weaves the spider"
 *
 * CAN: read, route, compose
 * CANNOT: persist, emit_output, transform, validate, invoke_external
 *
 * The ORCHESTRATOR - composes all ports, routes events, makes decisions.
 * NEVER does the work - only decides WHO does.
 */
export interface DecidePort {
	/** Port metadata */
	readonly metadata: PortMetadata;

	/**
	 * Compose a pipeline from ports
	 * Returns composed pipeline ready to execute
	 */
	compose(config: PipelineConfig): Pipeline;

	/**
	 * Route event from source to target port
	 */
	route(event: CloudEvent, target: PortNumber): void;

	/**
	 * Decide which adapter to use for a port
	 * Based on runtime conditions
	 */
	decide(port: PortNumber, options: DecisionOptions): string;

	/**
	 * Get health status of all ports
	 */
	health(): PortHealth[];

	/**
	 * Start the orchestrator
	 */
	start(): Promise<void>;

	/**
	 * Stop the orchestrator
	 */
	stop(): Promise<void>;

	/**
	 * Process a frame through the pipeline
	 */
	process(video: HTMLVideoElement, timestamp: number): Promise<void>;

	/**
	 * Hot-swap an adapter at a port
	 */
	swap(port: PortNumber, adapterId: string): void;

	/** Is orchestrator running? */
	readonly isRunning: boolean;
}

export interface PipelineConfig {
	gen: number;
	viewport: { width: number; height: number };
	adapters: {
		sense: string;
		fuse: string;
		shape: string;
		deliver: string;
		test: string;
		defend: string;
		store: string;
	};
}

export interface Pipeline {
	execute(input: unknown): Promise<unknown>;
	getPort(port: PortNumber): unknown;
	dispose(): void;
}

export interface DecisionOptions {
	latency?: 'low' | 'medium' | 'high';
	accuracy?: 'low' | 'medium' | 'high';
	fallback?: string;
}

// ============================================================================
// PORT METADATA CONSTANTS
// ============================================================================

export const PORT_METADATA: Record<PortNumber, PortMetadata> = {
	0: {
		port: 0,
		name: 'SENSE',
		verb: 'SENSE',
		commander: 'Lidless Legion',
		can: ['read', 'tag', 'observe', 'snapshot'] as const,
		cannot: ['modify', 'transform', 'persist', 'decide', 'emit'] as const,
	},
	1: {
		port: 1,
		name: 'FUSE',
		verb: 'FUSE',
		commander: 'Web Weaver',
		can: ['read', 'validate', 'compose', 'route'] as const,
		cannot: ['persist', 'decide', 'skip_validation'] as const,
	},
	2: {
		port: 2,
		name: 'SHAPE',
		verb: 'SHAPE',
		commander: 'Mirror Magus',
		can: ['read', 'transform', 'predict', 'tag'] as const,
		cannot: ['persist', 'decide', 'emit_output', 'invoke_external'] as const,
	},
	3: {
		port: 3,
		name: 'DELIVER',
		verb: 'DELIVER',
		commander: 'Spore Storm',
		can: ['read', 'emit_output', 'invoke_external', 'tag'] as const,
		cannot: ['decide', 'persist', 'validate', 'transform'] as const,
	},
	4: {
		port: 4,
		name: 'TEST',
		verb: 'TEST',
		commander: 'Red Regnant',
		can: ['read', 'validate', 'invoke'] as const,
		cannot: ['persist', 'decide', 'emit_output', 'modify'] as const,
	},
	5: {
		port: 5,
		name: 'DEFEND',
		verb: 'DEFEND',
		commander: 'Pyre Praetorian',
		can: ['read', 'gate', 'tag'] as const,
		cannot: ['modify', 'persist', 'decide', 'emit_output', 'transform'] as const,
	},
	6: {
		port: 6,
		name: 'STORE',
		verb: 'STORE',
		commander: 'Kraken Keeper',
		can: ['read', 'persist', 'tag'] as const,
		cannot: ['transform', 'decide', 'validate', 'emit_output'] as const,
	},
	7: {
		port: 7,
		name: 'DECIDE',
		verb: 'DECIDE',
		commander: 'Spider Sovereign',
		can: ['read', 'route', 'compose'] as const,
		cannot: ['persist', 'emit_output', 'transform', 'validate', 'invoke_external'] as const,
	},
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isValidPort(port: number): port is PortNumber {
	return Number.isInteger(port) && port >= 0 && port <= 7;
}

export function assertPortCan(port: PortNumber, action: string): void {
	const meta = PORT_METADATA[port];
	if (!meta.can.includes(action)) {
		throw new Error(
			`Port ${port} (${meta.commander}) CANNOT ${action}. ` +
			`Allowed: [${meta.can.join(', ')}]`
		);
	}
}

export function assertPortCannot(port: PortNumber, action: string): void {
	const meta = PORT_METADATA[port];
	if (meta.cannot.includes(action)) {
		throw new Error(
			`Port ${port} (${meta.commander}) is PROHIBITED from ${action}. ` +
			`Forbidden: [${meta.cannot.join(', ')}]`
		);
	}
}
