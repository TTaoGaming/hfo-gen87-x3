/**
 * W3C Pointer FSM - Barrel Export
 *
 * Gen87.X3 | Hot Silver | Hexagonal Architecture
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────────┐
 * │                         FSM MODULE                               │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  CONTRACTS (contracts.ts)                                        │
 * │  └─ Zod schemas, TypeScript interfaces, validation helpers       │
 * │                                                                  │
 * │  FSM CORE (w3c-pointer-fsm.ts)                                   │
 * │  └─ XState v5 state machine implementation                       │
 * │                                                                  │
 * │  ADAPTERS (adapters.ts)                                          │
 * │  └─ Input/Output adapters, Orchestrator                          │
 * └──────────────────────────────────────────────────────────────────┘
 * ```
 */

// ============================================================================
// CONTRACTS (Schemas, Interfaces, Validation)
// ============================================================================

export {
	CoastingConfigSchema,
	ConfidenceGateConfigSchema,
	FSMSnapshotSchema,
	FSMState,
	GateConfigSchema,
	// Zod Schemas
	GestureLabel,
	NormalizedPosition,
	PalmGateConfigSchema,
	PointerEventType,
	PointerFrameSchema,
	TimingConfigSchema,
	Velocity2D,
	W3CPointerActionSchema,
	// Factory Functions
	createDefaultFrame,
	createFacingFrame,
	createLostFrame,
	isClickAction,
	isTerminalAction,
	// Type Guards
	isTrackingAction,
	safeValidateFrame,
	validateAction,
	validateConfig,
	// Validation Functions
	validateFrame,
	type FSMSnapshot,
	type GateConfig,
	type IPointerActionPort,
	type IPointerFSMPort,
	// Port Interfaces
	type IPointerFramePort,
	// TypeScript Types (inferred from Zod)
	type PointerFrame,
	type W3CPointerAction,
} from './contracts.js';

// ============================================================================
// FSM CORE
// ============================================================================

export {
	// The FSM Class
	W3CPointerFSM,
	// Configuration Types
	type W3CPointerFSMConfig,
} from './w3c-pointer-fsm.js';

// ============================================================================
// ADAPTERS
// ============================================================================

export {
	// Output Adapters
	DOMPointerAdapter,
	LiveFrameAdapter,
	LoggerAdapter,
	// Factory
	OrchestratorFactory,
	// Orchestrator
	PointerOrchestrator,
	// Input Adapters
	SyntheticFrameAdapter,
	WebSocketAdapter,
	type LogEntry,
	type OrchestratorConfig,
	type SyntheticSequence,
} from './adapters.js';

// ============================================================================
// MEDIAPIPE ADAPTER (Anti-Theater)
// ============================================================================

export {
	DEFAULT_ANTI_THEATER,
	MediaPipeAdapter,
	type AntiTheaterConfig,
	type HandGesture,
	type HandLandmark,
	type HandLandmarkerResult,
	type TheaterViolation,
	type ViolationType,
} from './mediapipe-adapter.js';
