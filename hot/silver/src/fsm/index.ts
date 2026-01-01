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
  // Zod Schemas
  GestureLabel,
  NormalizedPosition,
  Velocity2D,
  PointerFrameSchema,
  FSMState,
  PointerEventType,
  W3CPointerActionSchema,
  FSMSnapshotSchema,
  PalmGateConfigSchema,
  ConfidenceGateConfigSchema,
  TimingConfigSchema,
  CoastingConfigSchema,
  GateConfigSchema,

  // TypeScript Types (inferred from Zod)
  type PointerFrame,
  type W3CPointerAction,
  type FSMSnapshot,
  type GateConfig,

  // Port Interfaces
  type IPointerFramePort,
  type IPointerActionPort,
  type IPointerFSMPort,

  // Validation Functions
  validateFrame,
  safeValidateFrame,
  validateAction,
  validateConfig,

  // Factory Functions
  createDefaultFrame,
  createFacingFrame,
  createLostFrame,

  // Type Guards
  isTrackingAction,
  isTerminalAction,
  isClickAction,
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
  // Input Adapters
  SyntheticFrameAdapter,
  LiveFrameAdapter,
  type SyntheticSequence,

  // Output Adapters
  DOMPointerAdapter,
  LoggerAdapter,
  WebSocketAdapter,
  type LogEntry,

  // Orchestrator
  PointerOrchestrator,
  type OrchestratorConfig,

  // Factory
  OrchestratorFactory,
} from './adapters.js';

// ============================================================================
// MEDIAPIPE ADAPTER (Anti-Theater)
// ============================================================================

export {
  MediaPipeAdapter,
  DEFAULT_ANTI_THEATER,
  type AntiTheaterConfig,
  type ViolationType,
  type TheaterViolation,
  type HandLandmark,
  type HandGesture,
  type HandLandmarkerResult,
} from './mediapipe-adapter.js';
