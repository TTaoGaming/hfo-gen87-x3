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
	// Palm Cone Gate
	type PalmConeConfig,
	type PalmConeGateState,
	type PalmConeGateResult,
	type PalmConeGate,
	PalmConeConfigSchema,
	DEFAULT_PALM_CONE_CONFIG,
	calculatePalmAngle,
	updatePalmConeGate,
	createPalmConeGate,
	createPalmConeGateState,
} from './palm-cone-gate.js';

export {
	// Gesture Transition Predictor
	type GestureTransitionConfig,
	type GestureTransitionState,
	type GestureTransitionPrediction,
	type GestureTransitionPredictor,
	GestureTransitionConfigSchema,
	DEFAULT_GESTURE_TRANSITION_CONFIG,
	updateGestureTransitionPredictor,
	createGestureTransitionPredictor,
	createGestureTransitionState,
} from './gesture-transition-predictor.js';

export {
	// Pyre Praetorian Daemon - HIVE Sequence Validator (P0 IR-0001 mitigation)
	type ViolationType,
	type HIVEViolation,
	type PyrePraetorianConfig,
	type StigmergyEmitter,
	type PyreHealthReport,
	type GitCommitInfo,
	type BlackboardReader,
	StigmergySignalSchema,
	VALID_TRANSITIONS,
	PyrePraetorianDaemon,
	// Emitter factories (JSONL now, NATS later)
	createJSONLEmitter,
	createConsoleEmitter,
	createNATSEmitter,
} from './pyre-praetorian-daemon.js';
