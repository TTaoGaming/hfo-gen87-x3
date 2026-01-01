/**
 * W3C Pointer FSM - Adapter Tests (TDD)
 * 
 * Gen87.X3 | Hot Silver | Integration Testing
 */
// @ts-nocheck


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SyntheticFrameAdapter,
  LoggerAdapter,
  PointerOrchestrator,
  OrchestratorFactory,
} from './adapters.js';
import {
  createDefaultFrame,
  createFacingFrame,
  createLostFrame,
  type PointerFrame,
  type W3CPointerAction,
  type FSMSnapshot,
  type IPointerFSMPort,
  type IPointerActionPort,
  type NormalizedPosition,
  type FSMState,
  type GateConfig,
} from './contracts.js';

// ============================================================================
// MOCK FSM (for testing adapters in isolation)
// ============================================================================

class MockFSM implements IPointerFSMPort {
  private state: FSMState = 'IDLE';
  private position: NormalizedPosition = { x: 0.5, y: 0.5 };
  private processedFrames: PointerFrame[] = [];
  private nextAction: W3CPointerAction = { type: 'none' };

  process(frame: PointerFrame): W3CPointerAction {
    this.processedFrames.push(frame);
    this.position = frame.position;
    return this.nextAction;
  }

  getState(): FSMState {
    return this.state;
  }

  getSnapshot(): FSMSnapshot {
    return {
      state: this.state,
      position: this.position,
      velocity: { vx: 0, vy: 0 },
      wasFacing: false,
      pointerId: 1,
      palmStableAt: null,
      coastStartAt: null,
    };
  }

  getPosition(): NormalizedPosition {
    return this.position;
  }

  cancel(): void {
    this.state = 'IDLE';
  }

  dispose(): void {
    this.processedFrames = [];
  }

  getConfig(): GateConfig {
    return {
      palm: { enterThreshold: 30, exitThreshold: 45, cancelThreshold: 70 },
      confidence: { armThreshold: 0.7, maintainThreshold: 0.5, dropThreshold: 0.25 },
      timing: { noneDebounceMs: 80, armStableMs: 150, coastingMaxMs: 2000 },
      coasting: { damping: 0.92, minVelocity: 0.0005 },
    };
  }

  // Test helpers
  setState(state: FSMState): void {
    this.state = state;
  }

  setNextAction(action: W3CPointerAction): void {
    this.nextAction = action;
  }

  getProcessedFrames(): PointerFrame[] {
    return this.processedFrames;
  }
}

// ============================================================================
// SyntheticFrameAdapter Tests
// ============================================================================

describe('SyntheticFrameAdapter', () => {
  let adapter: SyntheticFrameAdapter;

  beforeEach(() => {
    adapter = new SyntheticFrameAdapter('test', 10);
  });

  afterEach(async () => {
    await adapter.stop();
  });

  describe('Lifecycle', () => {
    it('should start and stop correctly', async () => {
      expect(adapter.isRunning()).toBe(false);
      await adapter.start();
      expect(adapter.isRunning()).toBe(true);
      await adapter.stop();
      expect(adapter.isRunning()).toBe(false);
    });

    it('should be idempotent on multiple starts', async () => {
      await adapter.start();
      await adapter.start();
      expect(adapter.isRunning()).toBe(true);
    });

    it('should handle stop when not running', async () => {
      await adapter.stop();
      expect(adapter.isRunning()).toBe(false);
    });
  });

  describe('Frame Injection', () => {
    it('should deliver injected frames to callback', () => {
      const frames: PointerFrame[] = [];
      adapter.onFrame((frame) => frames.push(frame));

      const testFrame = createDefaultFrame({ ts: 1000 });
      adapter.injectFrame(testFrame);

      expect(frames).toHaveLength(1);
      expect(frames[0].ts).toBe(1000);
    });

    it('should handle injection without callback', () => {
      const testFrame = createDefaultFrame({ ts: 1000 });
      expect(() => adapter.injectFrame(testFrame)).not.toThrow();
    });
  });

  describe('Sequence Playback', () => {
    it('should play sequence once without loop', async () => {
      const receivedFrames: PointerFrame[] = [];
      adapter.onFrame((frame) => receivedFrames.push(frame));

      const sequence = [
        createDefaultFrame({ ts: 1000 }),
        createDefaultFrame({ ts: 1016 }),
        createDefaultFrame({ ts: 1032 }),
      ];

      adapter.loadSequence({ frames: sequence, loop: false });
      await adapter.start();

      // Wait for playback
      await new Promise((r) => setTimeout(r, 50));

      expect(receivedFrames.length).toBe(3);
      expect(adapter.isRunning()).toBe(false);
    });

    it('should loop sequence when loop=true', async () => {
      const receivedFrames: PointerFrame[] = [];
      adapter.onFrame((frame) => receivedFrames.push(frame));

      const sequence = [
        createDefaultFrame({ ts: 1000 }),
        createDefaultFrame({ ts: 1016 }),
      ];

      adapter.loadSequence({ frames: sequence, loop: true });
      await adapter.start();

      // Wait for 2+ loops
      await new Promise((r) => setTimeout(r, 60));
      await adapter.stop();

      expect(receivedFrames.length).toBeGreaterThan(2);
    });

    it('should reset index when restarting', async () => {
      const receivedFrames: PointerFrame[] = [];
      adapter.onFrame((frame) => receivedFrames.push(frame));

      const sequence = [
        createDefaultFrame({ ts: 1000 }),
        createDefaultFrame({ ts: 1016 }),
      ];

      adapter.loadSequence({ frames: sequence, loop: false });
      
      await adapter.start();
      await new Promise((r) => setTimeout(r, 50));
      
      // Restart
      receivedFrames.length = 0;
      await adapter.start();
      await new Promise((r) => setTimeout(r, 50));

      expect(receivedFrames.length).toBe(2);
    });
  });

  describe('Unsubscribe', () => {
    it('should stop delivering frames after unsubscribe', () => {
      const frames: PointerFrame[] = [];
      const unsub = adapter.onFrame((frame) => frames.push(frame));

      adapter.injectFrame(createDefaultFrame({ ts: 1000 }));
      expect(frames.length).toBe(1);

      unsub();

      adapter.injectFrame(createDefaultFrame({ ts: 1016 }));
      expect(frames.length).toBe(1); // Still 1
    });
  });
});

// ============================================================================
// LoggerAdapter Tests
// ============================================================================

describe('LoggerAdapter', () => {
  let logger: LoggerAdapter;

  beforeEach(() => {
    logger = new LoggerAdapter('test-logger', 100);
  });

  afterEach(() => {
    logger.dispose();
  });

  describe('Logging', () => {
    it('should log actions', () => {
      const action: W3CPointerAction = { type: 'enter', x: 0.5, y: 0.5, pointerId: 1 };
      const snapshot: FSMSnapshot = {
        state: 'TRACKING',
        position: { x: 0.5, y: 0.5 },
        velocity: { vx: 0, vy: 0 },
        wasFacing: true,
        pointerId: 1,
        palmStableAt: null,
        coastStartAt: null,
      };

      logger.handleAction(action, snapshot);

      const log = logger.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].action).toEqual(action);
      expect(log[0].snapshot.state).toBe('TRACKING');
    });

    it('should skip "none" actions', () => {
      logger.handleAction({ type: 'none' }, {} as FSMSnapshot);
      expect(logger.getLog()).toHaveLength(0);
    });

    it('should trim when over maxEntries', () => {
      const snapshot: FSMSnapshot = {
        state: 'TRACKING',
        position: { x: 0.5, y: 0.5 },
        velocity: { vx: 0, vy: 0 },
        wasFacing: true,
        pointerId: 1,
        palmStableAt: null,
        coastStartAt: null,
      };

      // Add 150 entries (max is 100)
      for (let i = 0; i < 150; i++) {
        logger.handleAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 }, snapshot);
      }

      expect(logger.getLog().length).toBeLessThanOrEqual(100);
    });
  });

  describe('Export', () => {
    it('should export as JSON', () => {
      logger.handleAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 }, {
        state: 'TRACKING',
        position: { x: 0.5, y: 0.5 },
        velocity: { vx: 0, vy: 0 },
        wasFacing: true,
        pointerId: 1,
        palmStableAt: null,
        coastStartAt: null,
      });

      const json = logger.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].action.type).toBe('enter');
    });
  });

  describe('Clear', () => {
    it('should clear log', () => {
      logger.handleAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 }, {} as FSMSnapshot);
      expect(logger.getLog()).toHaveLength(1);

      logger.clear();
      expect(logger.getLog()).toHaveLength(0);
    });
  });
});

// ============================================================================
// PointerOrchestrator Tests
// ============================================================================

describe('PointerOrchestrator', () => {
  let fsm: MockFSM;
  let input: SyntheticFrameAdapter;
  let output: LoggerAdapter;
  let orchestrator: PointerOrchestrator;

  beforeEach(() => {
    fsm = new MockFSM();
    input = new SyntheticFrameAdapter('test-input', 10);
    output = new LoggerAdapter('test-output');

    orchestrator = new PointerOrchestrator({
      fsm,
      inputAdapter: input,
      outputAdapters: [output],
    });
  });

  afterEach(async () => {
    orchestrator.dispose();
  });

  describe('Wiring', () => {
    it('should wire input → FSM → output', async () => {
      fsm.setNextAction({ type: 'enter', x: 0.5, y: 0.5, pointerId: 1 });

      await orchestrator.start();

      // Inject frame
      input.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }));

      expect(fsm.getProcessedFrames()).toHaveLength(1);
      expect(output.getLog()).toHaveLength(1);
    });

    it('should fan out to multiple outputs', async () => {
      const output2 = new LoggerAdapter('test-output-2');
      const orchestrator2 = new PointerOrchestrator({
        fsm,
        inputAdapter: input,
        outputAdapters: [output, output2],
      });

      fsm.setNextAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 });
      await orchestrator2.start();

      input.injectFrame(createFacingFrame(1000, { x: 0.5, y: 0.5 }));

      expect(output.getLog()).toHaveLength(1);
      expect(output2.getLog()).toHaveLength(1);

      orchestrator2.dispose();
    });

    it('should not deliver "none" actions to outputs', async () => {
      fsm.setNextAction({ type: 'none' });
      await orchestrator.start();

      input.injectFrame(createDefaultFrame({ ts: 1000 }));

      expect(fsm.getProcessedFrames()).toHaveLength(1);
      expect(output.getLog()).toHaveLength(0);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop cleanly', async () => {
      await orchestrator.start();
      expect(input.isRunning()).toBe(true);

      await orchestrator.stop();
      expect(input.isRunning()).toBe(false);
    });

    it('should cancel FSM on stop', async () => {
      fsm.setState('TRACKING');
      await orchestrator.start();
      await orchestrator.stop();

      expect(fsm.getState()).toBe('IDLE');
    });
  });

  describe('Accessors', () => {
    it('should provide access to components', () => {
      expect(orchestrator.getFSM()).toBe(fsm);
      expect(orchestrator.getInput()).toBe(input);
      expect(orchestrator.getOutputs()).toContain(output);
    });
  });
});

// ============================================================================
// OrchestratorFactory Tests
// ============================================================================

describe('OrchestratorFactory', () => {
  describe('createTestOrchestrator', () => {
    it('should create orchestrator with synthetic input and logger', () => {
      const fsm = new MockFSM();
      const { orchestrator, input, logger } = OrchestratorFactory.createTestOrchestrator(fsm);

      expect(orchestrator).toBeDefined();
      expect(input).toBeInstanceOf(SyntheticFrameAdapter);
      expect(logger).toBeInstanceOf(LoggerAdapter);

      orchestrator.dispose();
    });
  });
});

// ============================================================================
// Integration: Full Pipeline
// ============================================================================

describe('Integration: Adapter Pipeline', () => {
  it('should process complete gesture sequence', async () => {
    const fsm = new MockFSM();
    const { orchestrator, input, logger } = OrchestratorFactory.createTestOrchestrator(fsm);

    // Simulate FSM responding to frames
    let frameCount = 0;
    const originalProcess = fsm.process.bind(fsm);
    fsm.process = (frame: PointerFrame) => {
      frameCount++;
      if (frame.trackingOk && frame.palmAngle < 30) {
        fsm.setState('TRACKING');
        return { type: 'enter', x: frame.position.x, y: frame.position.y, pointerId: 1 };
      }
      return { type: 'none' };
    };

    await orchestrator.start();

    // Inject facing frame
    input.injectFrame(createFacingFrame(1000, { x: 0.3, y: 0.4 }));

    expect(frameCount).toBe(1);
    expect(logger.getLog()).toHaveLength(1);
    expect(logger.getLog()[0].action.type).toBe('enter');

    orchestrator.dispose();
  });

  it('should handle rapid frame injection', async () => {
    const fsm = new MockFSM();
    const { orchestrator, input, logger } = OrchestratorFactory.createTestOrchestrator(fsm);

    fsm.setNextAction({ type: 'move', x: 0.5, y: 0.5, pointerId: 1 });
    await orchestrator.start();

    // Inject 100 frames rapidly
    for (let i = 0; i < 100; i++) {
      input.injectFrame(createFacingFrame(1000 + i * 16, { x: 0.5, y: 0.5 }));
    }

    expect(fsm.getProcessedFrames()).toHaveLength(100);
    expect(logger.getLog()).toHaveLength(100);

    orchestrator.dispose();
  });
});
