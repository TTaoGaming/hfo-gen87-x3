/**
 * HFO 8-Port Canonical Interface System
 * =====================================
 * 
 * The Obsidian Hourglass Architecture - 8 Legendary Commanders
 * 
 * HIVE/8 Anti-Diagonal Pairs (sum = 7):
 *   H (Hunt):      Port 0 + Port 7 = Lidless Legion + Spider Sovereign
 *   I (Interlock): Port 1 + Port 6 = Web Weaver + Kraken Keeper
 *   V (Validate):  Port 2 + Port 5 = Mirror Magus + Pyre Praetorian
 *   E (Evolve):    Port 3 + Port 4 = Spore Storm + Red Regnant
 * 
 * "The spider weaves the web that weaves the spider."
 */

import { z } from "zod";

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/** The 8 canonical port numbers */
export type PortNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** The 8 canonical verbs */
export type HFOVerb = 
  | "SENSE"   // Port 0
  | "FUSE"    // Port 1
  | "SHAPE"   // Port 2
  | "DELIVER" // Port 3
  | "TEST"    // Port 4
  | "DEFEND"  // Port 5
  | "STORE"   // Port 6
  | "DECIDE"; // Port 7

/** HIVE phases */
export type HIVEPhase = "H" | "I" | "V" | "E";

/** Commander names for semantic anchoring */
export type Commander =
  | "Lidless Legion"    // Port 0 - Observer
  | "Web Weaver"        // Port 1 - Bridger
  | "Mirror Magus"      // Port 2 - Shaper
  | "Spore Storm"       // Port 3 - Injector
  | "Red Regnant"       // Port 4 - Disruptor
  | "Pyre Praetorian"   // Port 5 - Immunizer
  | "Kraken Keeper"     // Port 6 - Assimilator
  | "Spider Sovereign"; // Port 7 - Navigator

// ============================================================================
// PORT METADATA SCHEMA
// ============================================================================

/** Zod schema for port metadata */
export const HFOPortMetadataSchema = z.object({
  portNumber: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3),
    z.literal(4), z.literal(5), z.literal(6), z.literal(7)
  ]),
  commander: z.string(),
  verb: z.enum(["SENSE", "FUSE", "SHAPE", "DELIVER", "TEST", "DEFEND", "STORE", "DECIDE"]),
  hivePhase: z.enum(["H", "I", "V", "E"]),
  antiDiagonalPair: z.union([
    z.literal(0), z.literal(1), z.literal(2), z.literal(3),
    z.literal(4), z.literal(5), z.literal(6), z.literal(7)
  ]),
  mantra: z.string(),
});

export type HFOPortMetadata = z.infer<typeof HFOPortMetadataSchema>;

// ============================================================================
// PORT METADATA CONSTANTS
// ============================================================================

export const PORT_METADATA: Record<PortNumber, HFOPortMetadata> = {
  0: {
    portNumber: 0,
    commander: "Lidless Legion",
    verb: "SENSE",
    hivePhase: "H",
    antiDiagonalPair: 7,
    mantra: "How do we SENSE the SENSE?",
  },
  1: {
    portNumber: 1,
    commander: "Web Weaver",
    verb: "FUSE",
    hivePhase: "I",
    antiDiagonalPair: 6,
    mantra: "How do we FUSE the FUSE?",
  },
  2: {
    portNumber: 2,
    commander: "Mirror Magus",
    verb: "SHAPE",
    hivePhase: "V",
    antiDiagonalPair: 5,
    mantra: "How do we SHAPE the SHAPE?",
  },
  3: {
    portNumber: 3,
    commander: "Spore Storm",
    verb: "DELIVER",
    hivePhase: "E",
    antiDiagonalPair: 4,
    mantra: "How do we DELIVER the DELIVER?",
  },
  4: {
    portNumber: 4,
    commander: "Red Regnant",
    verb: "TEST",
    hivePhase: "E",
    antiDiagonalPair: 3,
    mantra: "How do we TEST the TEST?",
  },
  5: {
    portNumber: 5,
    commander: "Pyre Praetorian",
    verb: "DEFEND",
    hivePhase: "V",
    antiDiagonalPair: 2,
    mantra: "How do we DEFEND the DEFEND?",
  },
  6: {
    portNumber: 6,
    commander: "Kraken Keeper",
    verb: "STORE",
    hivePhase: "I",
    antiDiagonalPair: 1,
    mantra: "How do we STORE the STORE?",
  },
  7: {
    portNumber: 7,
    commander: "Spider Sovereign",
    verb: "DECIDE",
    hivePhase: "H",
    antiDiagonalPair: 0,
    mantra: "How do we DECIDE the DECIDE?",
  },
};

// ============================================================================
// BASE PORT INTERFACE
// ============================================================================

/** Base interface all ports extend */
export interface HFOPort<T extends PortNumber = PortNumber> {
  readonly metadata: HFOPortMetadata;
  readonly portNumber: T;
  
  /** Health check for heartbeat monitoring */
  heartbeat(): Promise<{ healthy: boolean; timestamp: string; details?: unknown }>;
  
  /** Initialize the port */
  initialize(): Promise<void>;
  
  /** Graceful shutdown */
  shutdown(): Promise<void>;
}

// ============================================================================
// PORT 0: SENSE - Lidless Legion - Observer
// ============================================================================

/** Input for sense operations */
export interface SenseInput {
  source: string;
  payload: unknown;
  timestamp?: string;
}

/** Output from sense operations */
export interface SenseResult {
  detected: boolean;
  observations: Array<{
    key: string;
    value: unknown;
    confidence: number;
  }>;
  timestamp: string;
}

/** Port 0 - SENSE - Perception without interpretation */
export interface SensePort extends HFOPort<0> {
  /** Primary verb: Perceive inputs, detect changes */
  sense(input: SenseInput): Promise<SenseResult>;
  
  /** Subscribe to change events */
  observe(pattern: string, callback: (event: unknown) => void): () => void;
  
  /** Query current state snapshot */
  snapshot(): Promise<Record<string, unknown>>;
}

// ============================================================================
// PORT 1: FUSE - Web Weaver - Bridger
// ============================================================================

/** Schema definition for validation */
export interface SchemaDefinition {
  name: string;
  schema: z.ZodType<unknown>;
  version?: string;
}

/** Input for fuse operations */
export interface FuseInput {
  sources: unknown[];
  schema?: SchemaDefinition;
  strategy?: "merge" | "concat" | "override";
}

/** Output from fuse operations */
export interface FuseResult {
  fused: unknown;
  valid: boolean;
  errors?: string[];
  sourceMap?: Record<string, number[]>;
}

/** Port 1 - FUSE - Total Tool Virtualization */
export interface FusePort extends HFOPort<1> {
  /** Primary verb: Connect pieces, validate schemas */
  fuse(input: FuseInput): Promise<FuseResult>;
  
  /** Validate against schema */
  validate(data: unknown, schema: SchemaDefinition): Promise<{ valid: boolean; errors?: string[] }>;
  
  /** Bridge between adapters */
  bridge<TIn, TOut>(input: TIn, adapter: (x: TIn) => Promise<TOut>): Promise<TOut>;
  
  /** Route to appropriate handler */
  route(input: unknown, routes: Record<string, (x: unknown) => Promise<unknown>>): Promise<unknown>;
}

// ============================================================================
// PORT 2: SHAPE - Mirror Magus - Shaper
// ============================================================================

/** Transformation specification */
export interface ShapeSpec {
  type: "map" | "filter" | "reduce" | "transform";
  fn: string | ((x: unknown) => unknown);
}

/** Input for shape operations */
export interface ShapeInput {
  data: unknown;
  specs: ShapeSpec[];
}

/** Output from shape operations */
export interface ShapeResult {
  shaped: unknown;
  transformations: string[];
  originalShape?: string;
  resultShape?: string;
}

/** Port 2 - SHAPE - Higher-Dimensional Manifold */
export interface ShapePort extends HFOPort<2> {
  /** Primary verb: Transform data, apply patterns */
  shape(input: ShapeInput): Promise<ShapeResult>;
  
  /** Smooth/normalize data */
  smooth(data: unknown, options?: { window?: number; method?: string }): Promise<unknown>;
  
  /** Apply pattern/template */
  applyPattern(data: unknown, pattern: string): Promise<unknown>;
  
  /** Extract structure */
  extractStructure(data: unknown): Promise<{ type: string; fields: string[]; nested?: unknown }>;
}

// ============================================================================
// PORT 3: DELIVER - Spore Storm - Injector
// ============================================================================

/** State machine definition */
export interface FSMDefinition {
  initial: string;
  states: Record<string, {
    on?: Record<string, string>;
    entry?: string[];
    exit?: string[];
  }>;
}

/** Input for deliver operations */
export interface DeliverInput {
  payload: unknown;
  target: string;
  options?: {
    retry?: number;
    timeout?: number;
    acknowledgment?: boolean;
  };
}

/** Output from deliver operations */
export interface DeliverResult {
  delivered: boolean;
  target: string;
  timestamp: string;
  acknowledgment?: unknown;
  error?: string;
}

/** Port 3 - DELIVER - HIVE/8 Obsidian Hourglass */
export interface DeliverPort extends HFOPort<3> {
  /** Primary verb: Execute workflows, emit outputs */
  deliver(input: DeliverInput): Promise<DeliverResult>;
  
  /** Emit signal to blackboard */
  emit(signal: unknown): Promise<{ emitted: boolean; id: string }>;
  
  /** Execute FSM transition */
  transition(fsm: FSMDefinition, event: string): Promise<{ state: string; context: unknown }>;
  
  /** Inject into workflow */
  inject(workflow: string, payload: unknown): Promise<{ injected: boolean; workflowId: string }>;
}

// ============================================================================
// PORT 4: TEST - Red Regnant - Disruptor
// ============================================================================

/** Property definition for testing */
export interface PropertyDefinition {
  name: string;
  predicate: (x: unknown) => boolean;
  generator?: () => unknown;
}

/** Input for test operations */
export interface TestInput {
  subject: unknown | (() => unknown);
  properties: PropertyDefinition[];
  iterations?: number;
}

/** Output from test operations */
export interface TestResult {
  passed: boolean;
  results: Array<{
    property: string;
    passed: boolean;
    counterexample?: unknown;
    iterations: number;
  }>;
  coverage?: number;
}

/** Port 4 - TEST - Zero/Negative Trust */
export interface TestPort extends HFOPort<4> {
  /** Primary verb: Validate properties, find bugs */
  test(input: TestInput): Promise<TestResult>;
  
  /** Property-based testing */
  propertyTest(fn: () => unknown, properties: PropertyDefinition[], iterations?: number): Promise<TestResult>;
  
  /** Adversarial testing */
  adversarial(target: unknown, attacks: string[]): Promise<{ vulnerabilities: string[] }>;
  
  /** Mutation testing */
  mutate(code: string, mutations: string[]): Promise<{ survivors: string[]; killed: string[] }>;
}

// ============================================================================
// PORT 5: DEFEND - Pyre Praetorian - Immunizer
// ============================================================================

/** Gate definition */
export interface GateDefinition {
  id: string;
  check: (x: unknown) => boolean | Promise<boolean>;
  message: string;
}

/** Input for defend operations */
export interface DefendInput {
  payload: unknown;
  gates: GateDefinition[];
  mode?: "all" | "any";
}

/** Output from defend operations */
export interface DefendResult {
  allowed: boolean;
  passedGates: string[];
  failedGates: string[];
  violations?: Array<{ gate: string; message: string }>;
}

/** Port 5 - DEFEND - Forgiveness Architecture */
export interface DefendPort extends HFOPort<5> {
  /** Primary verb: Enforce gates, protect integrity */
  defend(input: DefendInput): Promise<DefendResult>;
  
  /** Validate signal through G0-G11 gates */
  validateSignal(signal: unknown): Promise<{ valid: boolean; failedGates: string[] }>;
  
  /** Quarantine invalid data */
  quarantine(data: unknown, reason: string): Promise<{ quarantined: boolean; id: string }>;
  
  /** Check HIVE sequence compliance */
  checkHIVESequence(signals: unknown[]): Promise<{ valid: boolean; violations: string[] }>;
}

// ============================================================================
// PORT 6: STORE - Kraken Keeper - Assimilator
// ============================================================================

/** Storage query */
export interface StoreQuery {
  collection: string;
  filter?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

/** Input for store operations */
export interface StoreInput {
  collection: string;
  data: unknown;
  options?: {
    upsert?: boolean;
    ttl?: number;
  };
}

/** Output from store operations */
export interface StoreResult {
  stored: boolean;
  id: string;
  collection: string;
  timestamp: string;
}

/** Port 6 - STORE - Memory Mining Imperative */
export interface StorePort extends HFOPort<6> {
  /** Primary verb: Persist memory, manage storage */
  store(input: StoreInput): Promise<StoreResult>;
  
  /** Query stored data */
  query(query: StoreQuery): Promise<{ results: unknown[]; total: number }>;
  
  /** Full-text search */
  search(query: string, options?: { limit?: number; collection?: string }): Promise<unknown[]>;
  
  /** Retrieve by ID */
  retrieve(collection: string, id: string): Promise<unknown | null>;
  
  /** Delete by ID */
  delete(collection: string, id: string): Promise<{ deleted: boolean }>;
}

// ============================================================================
// PORT 7: DECIDE - Spider Sovereign - Navigator
// ============================================================================

/** Decision context */
export interface DecisionContext {
  request: unknown;
  state: Record<string, unknown>;
  history?: unknown[];
}

/** Input for decide operations */
export interface DecideInput {
  context: DecisionContext;
  options: Array<{
    id: string;
    action: string;
    weight?: number;
  }>;
  strategy?: "weighted" | "first" | "consensus";
}

/** Output from decide operations */
export interface DecideResult {
  decision: string;
  confidence: number;
  reasoning: string[];
  alternatives?: string[];
}

/** Orchestration request */
export interface OrchestrationRequest {
  type: "scatter" | "sequence" | "parallel";
  targets: PortNumber[];
  payload: unknown;
}

/** Port 7 - DECIDE - The spider weaves the web that weaves the spider */
export interface DecidePort extends HFOPort<7> {
  /** Primary verb: Strategic decisions, orchestration */
  decide(input: DecideInput): Promise<DecideResult>;
  
  /** Orchestrate multi-port workflow */
  orchestrate(request: OrchestrationRequest): Promise<{ results: Record<PortNumber, unknown> }>;
  
  /** Route request to appropriate commander */
  route(request: unknown): Promise<{ targetPort: PortNumber; reason: string }>;
  
  /** OODA Loop: Observe→Orient→Decide→Act */
  ooda(observation: unknown): Promise<{ action: string; nextPhase: HIVEPhase }>;
  
  /** Determine HIVE phase for request */
  determinePhase(request: unknown): Promise<{ phase: HIVEPhase; confidence: number }>;
}

// ============================================================================
// DISCRIMINATED UNION TYPE
// ============================================================================

/** Union of all port types */
export type AnyHFOPort =
  | SensePort
  | FusePort
  | ShapePort
  | DeliverPort
  | TestPort
  | DefendPort
  | StorePort
  | DecidePort;

// ============================================================================
// PORT FACTORY
// ============================================================================

/** Factory for creating port instances */
export interface HFOPortFactory {
  /** Create a port by number */
  create<T extends PortNumber>(portNumber: T): Promise<
    T extends 0 ? SensePort :
    T extends 1 ? FusePort :
    T extends 2 ? ShapePort :
    T extends 3 ? DeliverPort :
    T extends 4 ? TestPort :
    T extends 5 ? DefendPort :
    T extends 6 ? StorePort :
    T extends 7 ? DecidePort :
    never
  >;
  
  /** Get metadata for a port */
  getMetadata(portNumber: PortNumber): HFOPortMetadata;
  
  /** Get anti-diagonal pair */
  getPair(portNumber: PortNumber): PortNumber;
  
  /** Get HIVE phase pair */
  getHIVEPair(phase: HIVEPhase): [PortNumber, PortNumber];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/** Get anti-diagonal pair (ports that sum to 7) */
export function getAntiDiagonalPair(port: PortNumber): PortNumber {
  return (7 - port) as PortNumber;
}

/** Get HIVE phase for a port */
export function getHIVEPhase(port: PortNumber): HIVEPhase {
  return PORT_METADATA[port].hivePhase;
}

/** Get both ports for a HIVE phase */
export function getHIVEPorts(phase: HIVEPhase): [PortNumber, PortNumber] {
  const phases: Record<HIVEPhase, [PortNumber, PortNumber]> = {
    H: [0, 7], // Hunt: Lidless Legion + Spider Sovereign
    I: [1, 6], // Interlock: Web Weaver + Kraken Keeper
    V: [2, 5], // Validate: Mirror Magus + Pyre Praetorian
    E: [3, 4], // Evolve: Spore Storm + Red Regnant
  };
  return phases[phase];
}

/** Get commander name for a port */
export function getCommander(port: PortNumber): Commander {
  return PORT_METADATA[port].commander as Commander;
}

/** Get verb for a port */
export function getVerb(port: PortNumber): HFOVerb {
  return PORT_METADATA[port].verb;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  PORT_METADATA,
  getAntiDiagonalPair,
  getHIVEPhase,
  getHIVEPorts,
  getCommander,
  getVerb,
};
