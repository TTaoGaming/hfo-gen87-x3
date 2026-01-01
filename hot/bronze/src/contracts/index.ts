/**
 * W3C Gesture Control Plane - Contracts Index
 *
 * Gen87.X3 | Phase: INTERLOCK (I)
 *
 * Export all schemas and port interfaces
 */

// ============================================================================
// BASE SCHEMAS (Source of Truth)
// ============================================================================
export {
	// Adapter schemas
	AdapterTargetSchema,
	FSMActionSchema,
	// FSM schemas
	FSMStates,
	// Labels
	GestureLabels,
	NormalizedLandmarkSchema,
	// Config
	PipelineConfigSchema,
	// Emitter schemas
	PointerEventOutSchema,
	SensorFrameSchema,
	// Smoother schemas
	SmoothedFrameSchema,
	// Sensor schemas
	VideoFrameSchema,
	type AdapterTarget,
	type FSMAction,
	type FSMState,
	type GestureLabel,
	type NormalizedLandmark,
	type PipelineConfig,
	type PointerEventOut,
	type SensorFrame,
	type SmoothedFrame,
	type VideoFrame,
} from './schemas.js';

// ============================================================================
// EXTENDED SCHEMAS (Predictor, Layout, Gesture Binding)
// ============================================================================
export {
	// Adapter metadata
	AdapterMetadataSchema,
	DEFAULT_GESTURE_BINDINGS,
	GestureBindingSchema,
	GestureModifierSchema,
	GestureTypeSchema,
	LayoutActionSchema,
	// UI Shell schemas
	LayoutActionTypeSchema,
	// Pipeline stats
	PipelineStatsSchema,
	// Extended pointer events
	PointerEventOutExtendedSchema,
	// Predictor schemas
	Position3DSchema,
	PredictedFrameSchema,
	PredictionSchema,
	PredictorConfigSchema,
	RoutingResultSchema,
	TargetDefinitionSchema,
	// Target router schemas
	TargetTypeSchema,
	Velocity3DSchema,
	type AdapterMetadata,
	type GestureBinding,
	type GestureModifier,
	type GestureType,
	type LayoutAction,
	type LayoutActionType,
	type PipelineStats,
	type PointerEventOutExtended,
	type Position3D,
	type PredictedFrame,
	type Prediction,
	type PredictorConfig,
	type RoutingResult,
	type TargetDefinition,
	type TargetType,
	type Velocity3D,
} from './schemas-extended.js';

// ============================================================================
// BASE PORT INTERFACES
// ============================================================================
export type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	OverlayPort,
	PipelinePort,
	PortFactory,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from './ports.js';

// ============================================================================
// EXTENDED PORT INTERFACES (Vacuole-aware)
// ============================================================================
export type {
	EmitEnvelope,
	FSMEnvelope,
	NATSSubstratePort,
	PredictEnvelope,
	PredictorConfig as PredictorPortConfig,
	PredictorPortVacuole,
	// Envelope types
	SenseEnvelope,
	SmoothEnvelope,
	TargetEnvelope,
	TargetRouterPort,
	UIEnvelope,
	UIShellPortEnhanced,
	VacuolePipelinePort,
} from './ports-extended.js';

// ============================================================================
// ADAPTER FACTORY (Polymorphic Composition)
// ============================================================================
export {
	AdapterRegistry,
	EmitterRegistry,
	FSMRegistry,
	OverlayRegistry,
	PredictorRegistry,
	SensorRegistry,
	SmootherRegistry,
	TargetRegistry,
	UIShellRegistry,
	createFactoryFromClass,
	type AdapterFactory,
	type AdapterMetadata as FactoryAdapterMetadata,
	type PipelineComposition,
	type PredictorPort,
	type ResolvedPipeline,
} from './adapter-factory.js';

// ============================================================================
// VACUOLE ENVELOPE (CloudEvents + W3C Trace Context)
// ============================================================================
export {
	CloudEventsBaseSchema,
	HFOExtensionsSchema,
	PIPELINE_EVENT_TYPES,
	PIPELINE_NATS_SUBJECTS,
	TraceparentSchema,
	VacuoleEnvelopeSchema,
	generateTraceparent,
	propagateTraceparent,
	propagateVacuole,
	unwrapVacuole,
	wrapInVacuole,
	type HFOExtensions,
	type Traceparent,
	type VacuoleEnvelope,
	type VacuoleOptions,
} from './vacuole-envelope.js';
