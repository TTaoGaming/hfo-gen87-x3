/**
 * W3C Pointer FSM - Polymorphic Adapters (SOP)
 * 
 * Gen87.X3 | Hot Silver | Exemplar-based Composition
 * 
 * These are the BASE adapter classes that implement the port interfaces.
 * Each adapter follows the SAME pattern (SOP) for easy composition.
 */
// @ts-nocheck


import type {
  IPointerFramePort,
  IPointerActionPort,
  IPointerFSMPort,
  PointerFrame,
  W3CPointerAction,
  FSMSnapshot,
  NormalizedPosition,
  Velocity2D,
  GateConfig,
  FSMState,
} from './contracts.js';

import {
  createDefaultFrame,
  createLostFrame,
  validateFrame,
  safeValidateFrame,
} from './contracts.js';

// ============================================================================
// INPUT ADAPTER: Synthetic Frame Generator (for testing)
// ============================================================================

export interface SyntheticSequence {
  frames: PointerFrame[];
  loop?: boolean;
}

/**
 * SyntheticFrameAdapter: Plays back pre-recorded or generated sequences
 * 
 * USE CASES:
 * - Unit testing FSM
 * - Replay recorded sessions
 * - Deterministic stress tests
 */
export class SyntheticFrameAdapter implements IPointerFramePort {
  readonly id: string;
  readonly name = 'Synthetic Frame Generator';
  
  private sequence: PointerFrame[] = [];
  private loop: boolean = false;
  private index: number = 0;
  private running: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private frameCallback: ((frame: PointerFrame) => void) | null = null;
  private frameRateMs: number;

  constructor(id: string = 'synthetic-1', frameRateMs: number = 16) {
    this.id = id;
    this.frameRateMs = frameRateMs;
  }

  loadSequence(sequence: SyntheticSequence): void {
    this.sequence = sequence.frames;
    this.loop = sequence.loop ?? false;
    this.index = 0;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.index = 0;

    this.intervalId = setInterval(() => {
      if (!this.frameCallback || this.sequence.length === 0) return;

      const frame = this.sequence[this.index];
      this.frameCallback(frame);

      this.index++;
      if (this.index >= this.sequence.length) {
        if (this.loop) {
          this.index = 0;
        } else {
          this.stop();
        }
      }
    }, this.frameRateMs);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onFrame(callback: (frame: PointerFrame) => void): () => void {
    this.frameCallback = callback;
    return () => {
      this.frameCallback = null;
    };
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Manual frame injection (for tests) */
  injectFrame(frame: PointerFrame): void {
    if (this.frameCallback) {
      this.frameCallback(frame);
    }
  }

  /** Get current sequence position */
  getIndex(): number {
    return this.index;
  }
}

// ============================================================================
// INPUT ADAPTER: Live Frame Source (Abstract)
// ============================================================================

/**
 * Abstract base for live frame sources (MediaPipe, LeapMotion, etc.)
 * 
 * Subclasses must implement:
 * - startCapture(): Start the capture device
 * - stopCapture(): Stop the capture device
 * - convertToFrame(): Convert native data to PointerFrame
 */
export abstract class LiveFrameAdapter implements IPointerFramePort {
  abstract readonly id: string;
  abstract readonly name: string;

  protected running: boolean = false;
  protected frameCallback: ((frame: PointerFrame) => void) | null = null;
  protected lastPosition: NormalizedPosition = { x: 0.5, y: 0.5 };
  protected lastVelocity: Velocity2D = { vx: 0, vy: 0 };
  protected lastTs: number = 0;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.startCapture();
  }

  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    await this.stopCapture();
  }

  onFrame(callback: (frame: PointerFrame) => void): () => void {
    this.frameCallback = callback;
    return () => {
      this.frameCallback = null;
    };
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Emit a frame to subscribers */
  protected emitFrame(frame: PointerFrame): void {
    // Compute velocity if not provided
    if (!frame.velocity && this.lastTs > 0) {
      const dt = frame.ts - this.lastTs;
      if (dt > 0) {
        frame.velocity = {
          vx: (frame.position.x - this.lastPosition.x) / dt,
          vy: (frame.position.y - this.lastPosition.y) / dt,
        };
      }
    }

    // Update tracking
    this.lastPosition = frame.position;
    this.lastVelocity = frame.velocity ?? { vx: 0, vy: 0 };
    this.lastTs = frame.ts;

    // Validate and emit
    const result = safeValidateFrame(frame);
    if (result.success && this.frameCallback) {
      this.frameCallback(result.data);
    }
  }

  /** Emit a tracking-lost frame */
  protected emitLostFrame(ts: number): void {
    const frame = createLostFrame(ts, this.lastPosition, this.lastVelocity);
    this.emitFrame(frame);
  }

  // Subclass responsibilities
  protected abstract startCapture(): Promise<void>;
  protected abstract stopCapture(): Promise<void>;
}

// ============================================================================
// OUTPUT ADAPTER: DOM Event Dispatcher
// ============================================================================

/**
 * DOMPointerAdapter: Dispatches W3C PointerEvents to a target element
 * 
 * Maps FSM actions to real browser PointerEvents:
 * - enter → pointerenter
 * - move → pointermove
 * - down → pointerdown
 * - up → pointerup
 * - cancel → pointercancel
 * - leave → pointerleave
 */
export class DOMPointerAdapter implements IPointerActionPort {
  readonly id: string;
  readonly name = 'DOM Pointer Events';

  private target: HTMLElement | null;
  private width: number;
  private height: number;

  constructor(id: string = 'dom-1', target?: HTMLElement, width: number = window.innerWidth, height: number = window.innerHeight) {
    this.id = id;
    this.target = target ?? document.body;
    this.width = width;
    this.height = height;
  }

  setTarget(target: HTMLElement): void {
    this.target = target;
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  handleAction(action: W3CPointerAction, snapshot: FSMSnapshot): void {
    if (!this.target || action.type === 'none') return;

    const eventType = this.mapActionToEventType(action.type);
    if (!eventType) return;

    const options = this.buildEventOptions(action, snapshot);
    const event = new PointerEvent(eventType, options);
    
    this.target.dispatchEvent(event);
  }

  private mapActionToEventType(type: W3CPointerAction['type']): string | null {
    const map: Record<string, string> = {
      enter: 'pointerenter',
      move: 'pointermove',
      down: 'pointerdown',
      up: 'pointerup',
      cancel: 'pointercancel',
      leave: 'pointerleave',
    };
    return map[type] ?? null;
  }

  private buildEventOptions(action: W3CPointerAction, snapshot: FSMSnapshot): PointerEventInit {
    const base: PointerEventInit = {
      bubbles: true,
      cancelable: true,
      pointerType: 'pen', // "pen" for stylus/hand gestures
      isPrimary: true,
      width: 50,  // contact width
      height: 50, // contact height
      pressure: action.type === 'down' ? 0.5 : 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
    };

    // Add coordinates for tracking actions
    if ('x' in action && 'y' in action) {
      base.clientX = action.x * this.width;
      base.clientY = action.y * this.height;
      base.screenX = base.clientX;
      base.screenY = base.clientY;
    }

    // Add pointerId
    if ('pointerId' in action) {
      base.pointerId = action.pointerId;
    }

    // Add button for click actions
    if ('button' in action) {
      base.button = action.button;
      base.buttons = action.type === 'down' ? (1 << action.button) : 0;
    }

    return base;
  }

  dispose(): void {
    this.target = null;
  }
}

// ============================================================================
// OUTPUT ADAPTER: Logger
// ============================================================================

export interface LogEntry {
  ts: number;
  action: W3CPointerAction;
  snapshot: FSMSnapshot;
}

/**
 * LoggerAdapter: Records all FSM actions for replay/debugging
 */
export class LoggerAdapter implements IPointerActionPort {
  readonly id: string;
  readonly name = 'Action Logger';

  private log: LogEntry[] = [];
  private maxEntries: number;

  constructor(id: string = 'logger-1', maxEntries: number = 10000) {
    this.id = id;
    this.maxEntries = maxEntries;
  }

  handleAction(action: W3CPointerAction, snapshot: FSMSnapshot): void {
    if (action.type === 'none') return;

    this.log.push({
      ts: Date.now(),
      action,
      snapshot: { ...snapshot },
    });

    // Trim if over limit
    if (this.log.length > this.maxEntries) {
      this.log = this.log.slice(-this.maxEntries);
    }
  }

  getLog(): LogEntry[] {
    return [...this.log];
  }

  clear(): void {
    this.log = [];
  }

  exportJSON(): string {
    return JSON.stringify(this.log, null, 2);
  }

  dispose(): void {
    this.log = [];
  }
}

// ============================================================================
// OUTPUT ADAPTER: WebSocket (for remote control)
// ============================================================================

/**
 * WebSocketAdapter: Sends actions over WebSocket
 * 
 * Message format: CloudEvents 1.0 with HFO extensions
 */
export class WebSocketAdapter implements IPointerActionPort {
  readonly id: string;
  readonly name = 'WebSocket Relay';

  private ws: WebSocket | null = null;
  private url: string;
  private reconnectMs: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(id: string = 'ws-1', url: string = 'ws://localhost:8080', reconnectMs: number = 3000) {
    this.id = id;
    this.url = url;
    this.reconnectMs = reconnectMs;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log(`[${this.id}] WebSocket connected`);
      };

      this.ws.onclose = () => {
        console.log(`[${this.id}] WebSocket closed, reconnecting...`);
        this.scheduleReconnect();
      };

      this.ws.onerror = (e) => {
        console.error(`[${this.id}] WebSocket error`, e);
      };
    } catch (e) {
      console.error(`[${this.id}] Failed to connect`, e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectMs);
  }

  handleAction(action: W3CPointerAction, snapshot: FSMSnapshot): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (action.type === 'none') return;

    const cloudEvent = {
      specversion: '1.0',
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: `hfo.pointer.${action.type}`,
      source: `/hfo/fsm/${this.id}`,
      time: new Date().toISOString(),
      data: {
        action,
        snapshot,
      },
      // HFO extensions
      hfoport: 1,
      hfohive: 'V',
      hfogen: 87,
    };

    this.ws.send(JSON.stringify(cloudEvent));
  }

  dispose(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ============================================================================
// ORCHESTRATOR: Connects Input → FSM → Output
// ============================================================================

export interface OrchestratorConfig {
  fsm: IPointerFSMPort;
  inputAdapter: IPointerFramePort;
  outputAdapters: IPointerActionPort[];
}

/**
 * PointerOrchestrator: Wires adapters together
 * 
 * This is the composition point where ports are connected.
 */
export class PointerOrchestrator {
  private fsm: IPointerFSMPort;
  private input: IPointerFramePort;
  private outputs: IPointerActionPort[];
  private unsubscribe: (() => void) | null = null;

  constructor(config: OrchestratorConfig) {
    this.fsm = config.fsm;
    this.input = config.inputAdapter;
    this.outputs = config.outputAdapters;
  }

  async start(): Promise<void> {
    // Wire input frames to FSM
    this.unsubscribe = this.input.onFrame((frame) => {
      const action = this.fsm.process(frame);
      const snapshot = this.fsm.getSnapshot();

      // Fan out to all output adapters
      for (const output of this.outputs) {
        output.handleAction(action, snapshot);
      }
    });

    // Start input
    await this.input.start();
  }

  async stop(): Promise<void> {
    // Stop input
    await this.input.stop();

    // Unsubscribe
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Force FSM cancel
    this.fsm.cancel();
  }

  dispose(): void {
    this.stop();
    this.fsm.dispose();
    for (const output of this.outputs) {
      output.dispose();
    }
  }

  // Accessors
  getFSM(): IPointerFSMPort {
    return this.fsm;
  }

  getInput(): IPointerFramePort {
    return this.input;
  }

  getOutputs(): IPointerActionPort[] {
    return this.outputs;
  }
}

// ============================================================================
// FACTORY: Create Pre-configured Orchestrators
// ============================================================================

/**
 * Factory for common orchestrator configurations
 */
export const OrchestratorFactory = {
  /**
   * Create a testing orchestrator with synthetic input and logger output
   */
  createTestOrchestrator(fsm: IPointerFSMPort): {
    orchestrator: PointerOrchestrator;
    input: SyntheticFrameAdapter;
    logger: LoggerAdapter;
  } {
    const input = new SyntheticFrameAdapter('test-input');
    const logger = new LoggerAdapter('test-logger');

    const orchestrator = new PointerOrchestrator({
      fsm,
      inputAdapter: input,
      outputAdapters: [logger],
    });

    return { orchestrator, input, logger };
  },

  /**
   * Create a production orchestrator with DOM events
   */
  createDOMOrchestrator(fsm: IPointerFSMPort, target: HTMLElement): {
    orchestrator: PointerOrchestrator;
    dom: DOMPointerAdapter;
    logger: LoggerAdapter;
  } {
    const dom = new DOMPointerAdapter('dom-output', target);
    const logger = new LoggerAdapter('production-logger');

    // Note: Input adapter must be provided separately (MediaPipe, etc.)
    const input = new SyntheticFrameAdapter('placeholder');

    const orchestrator = new PointerOrchestrator({
      fsm,
      inputAdapter: input,
      outputAdapters: [dom, logger],
    });

    return { orchestrator, dom, logger };
  },
};
