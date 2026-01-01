/**
 * HFO Gen87 - Port Adapters Index
 * ================================
 *
 * Exports all port adapters for the 8-port pipeline.
 */

// Port 0: SENSE - Lidless Legion
export { MediaPipeSenseAdapter, type SensedGestureFrame, SensedGestureFrameSchema } from './sense-mediapipe.js';

// Port 1: FUSE - Web Weaver
export { FuseWrapperAdapter, type Vacuole, VacuoleSchema, isVacuole } from './fuse-wrapper.js';

// Port 2: SHAPE - Mirror Magus
export { ShapePassthroughAdapter } from './shape-passthrough.js';

// Port 3: DELIVER - Spore Storm
export { DeliverGoldenLayoutAdapter, type DeliveryTarget, type DeliveryCallback } from './deliver-goldenlayout.js';
