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
	// Predictor schemas
	Position3DSchema,
	Velocity3DSchema,
	PredictionSchema,
	PredictedFrameSchema,
	PredictorConfigSchema,
	// Target router schemas
	TargetTypeSchema,
	TargetDefinitionSchema,
	RoutingResultSchema,
	// UI Shell schemas
	LayoutActionTypeSchema,
	LayoutActionSchema,
	GestureTypeSchema,
	GestureModifierSchema,
	GestureBindingSchema,
	DEFAULT_GESTURE_BINDINGS,
	// Pipeline stats
	PipelineStatsSchema,
	// Extended pointer events
	PointerEventOutExtendedSchema,
	// Adapter metadata
	AdapterMetadataSchema,
	type Position3D,
	type Velocity3D,
	type Prediction,
	type PredictedFrame,
	type PredictorConfig,
	type TargetType,
	type TargetDefinition,
	type RoutingResult,
	type LayoutActionType,
	type LayoutAction,
	type GestureType,
	type GestureModifier,
	type GestureBinding,
	type PipelineStats,
	type PointerEventOutExtended,
	type AdapterMetadata,
} from './schemas-extended.js';

// ============================================================================
// BASE PORT INTERFACES
// ============================================================================
export type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	PipelinePort,
	PortFactory,
	SensorPort,
	SmootherPort,
	OverlayPort,
	UIShellPort,
} from './ports.js';

// ============================================================================
// EXTENDED PORT INTERFACES (Vacuole-aware)
// ============================================================================
export type {
	PredictorConfig as PredictorPortConfig,
	PredictorPortVacuole,
	TargetRouterPort,
	UIShellPortEnhanced,
	VacuolePipelinePort,
	NATSSubstratePort,
	// Envelope types
	SenseEnvelope,
	SmoothEnvelope,
	PredictEnvelope,
	FSMEnvelope,
	EmitEnvelope,
	TargetEnvelope,
	UIEnvelope,
} from './ports-extended.js';

// ============================================================================
// ADAPTER FACTORY (Polymorphic Composition)
// ============================================================================
export {
	AdapterRegistry,
	SensorRegistry,
	SmootherRegistry,
	PredictorRegistry,
	FSMRegistry,
	EmitterRegistry,
	TargetRegistry,
	OverlayRegistry,
	UIShellRegistry,
	createFactoryFromClass,
	type AdapterFactory,
	type AdapterMetadata as FactoryAdapterMetadata,
	type PredictorPort,
	type PipelineComposition,
	type ResolvedPipeline,
} from './adapter-factory.js';

// ============================================================================
// VACUOLE ENVELOPE (CloudEvents + W3C Trace Context)
// ============================================================================
export {
	TraceparentSchema,
	CloudEventsBaseSchema,
	HFOExtensionsSchema,
	VacuoleEnvelopeSchema,
	generateTraceparent,
	propagateTraceparent,
	wrapInVacuole,
	unwrapVacuole,
	propagateVacuole,
	PIPELINE_EVENT_TYPES,
	PIPELINE_NATS_SUBJECTS,
	type Traceparent,
	type HFOExtensions,
	type VacuoleEnvelope,
	type VacuoleOptions,
} from './vacuole-envelope.js';
