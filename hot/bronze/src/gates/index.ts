/**
 * Gates Module - Entry Point
 *
 * Gen87.X3 | Port 5 (DEFEND) | Anti-Midas Touch Infrastructure
 *
 * Exports:
 * - PalmConeGate: Schmitt trigger hysteresis for palm orientation
 * - GestureTransitionPredictor: None as transition timing signal
 * - PyrePraetorianDaemon: Real-time HIVE sequence validator (IR-0001 mitigation)
 */

export {
	DEFAULT_PALM_CONE_CONFIG,
	PalmConeConfigSchema,
	calculatePalmAngle,
	createPalmConeGate,
	createPalmConeGateState,
	updatePalmConeGate,
	// Palm Cone Gate
	type PalmConeConfig,
	type PalmConeGate,
	type PalmConeGateResult,
	type PalmConeGateState,
} from './palm-cone-gate.js';

export {
	DEFAULT_GESTURE_TRANSITION_CONFIG,
	GestureTransitionConfigSchema,
	createGestureTransitionPredictor,
	createGestureTransitionState,
	updateGestureTransitionPredictor,
	// Gesture Transition Predictor
	type GestureTransitionConfig,
	type GestureTransitionPrediction,
	type GestureTransitionPredictor,
	type GestureTransitionState,
} from './gesture-transition-predictor.js';

export {
	PyrePraetorianDaemon,
	StigmergySignalSchema,
	VALID_TRANSITIONS,
	createConsoleEmitter,
	// Emitter factories (JSONL now, NATS later)
	createJSONLEmitter,
	createNATSEmitter,
	type BlackboardReader,
	type GitCommitInfo,
	type HIVEViolation,
	type PyreHealthReport,
	type PyrePraetorianConfig,
	type StigmergyEmitter,
	// Pyre Praetorian Daemon - HIVE Sequence Validator (P0 IR-0001 mitigation)
	type ViolationType,
} from './pyre-praetorian-daemon.js';
