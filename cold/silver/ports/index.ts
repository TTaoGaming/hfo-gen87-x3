/**
 * HFO 8-Port System - Barrel Export
 *
 * Gen87.X3 | Port 7 Navigator
 *
 * "All ports talk through strict contracts - never directly"
 */

// Core port interfaces and types
export {
	// Port interfaces
	type SensePort,
	type FusePort,
	type ShapePort,
	type DeliverPort,
	type TestPort,
	type DefendPort,
	type StorePort,
	type DecidePort,
	// Result types
	type SenseResult,
	type SenseSnapshot,
	type NormalizedLandmark,
	type ShapeResult,
	type ShapeParams,
	type DeliverAction,
	type TestPrediction,
	type TestValidation,
	type TestPropertyResult,
	type DefendEvent,
	type TargetBounds,
	// Composition types
	type Pipeline,
	type PipelineConfig,
	type DecisionOptions,
	// Metadata types
	type PortNumber,
	type PortHealth,
	type PortMetadata,
	type CloudEvent,
	// Schemas
	CloudEventSchema,
	// Constants
	PORT_METADATA,
	// Type guards
	isValidPort,
	assertPortCan,
	assertPortCannot,
} from './hfo-ports.js';
