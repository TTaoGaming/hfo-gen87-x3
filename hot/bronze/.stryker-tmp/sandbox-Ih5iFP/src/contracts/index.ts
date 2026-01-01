/**
 * W3C Gesture Control Plane - Contracts Index
 *
 * Gen87.X3 | Phase: INTERLOCK (I)
 *
 * Export all schemas and port interfaces
 */
// @ts-nocheck


// Zod schemas (source of truth)
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

// Port interfaces
export type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	PipelinePort,
	PortFactory,
	SensorPort,
	SmootherPort,
} from './ports.js';
