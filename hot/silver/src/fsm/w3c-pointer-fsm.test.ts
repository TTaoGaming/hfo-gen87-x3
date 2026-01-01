/**
 * W3C Pointer FSM Tests
 * Gen87.X3 | Hot Silver | TDD RED→GREEN
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { W3CPointerFSM, DEFAULT_GATE_CONFIG, type PointerFrame, type GateConfig } from './w3c-pointer-fsm.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createFrame(overrides: Partial<PointerFrame> = {}): PointerFrame {
  return {
    ts: Date.now(),
    trackingOk: true,
    palmAngle: 15, // Facing camera by default
    gesture: 'Open_Palm',
    confidence: 0.9,
    position: { x: 0.5, y: 0.5 },
    velocity: { vx: 0, vy: 0 },
    ...overrides,
  };
}

// ============================================================================
// BASIC STATE MACHINE TESTS
// ============================================================================

describe('W3CPointerFSM', () => {
  let fsm: W3CPointerFSM;

  beforeEach(() => {
    fsm = new W3CPointerFSM();
  });

  afterEach(() => {
    fsm.dispose();
  });

  describe('Initial State', () => {
    it('should start in IDLE state', () => {
      expect(fsm.getState()).toBe('IDLE');
    });

    it('should have default configuration', () => {
      const config = fsm.getConfig();
      expect(config.palm.enterThreshold).toBe(30);
      expect(config.palm.exitThreshold).toBe(45);
      expect(config.palm.cancelThreshold).toBe(70);
    });
  });

  describe('IDLE → TRACKING transition', () => {
    it('should transition to TRACKING when palm faces camera', () => {
      const frame = createFrame({ palmAngle: 20 }); // Below 30° threshold
      const action = fsm.process(frame);

      expect(fsm.getState()).toBe('TRACKING');
      expect(action.type).toBe('enter');
    });

    it('should stay in IDLE when palm is not facing', () => {
      const frame = createFrame({ palmAngle: 50 }); // Above 30° threshold
      const action = fsm.process(frame);

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('none');
    });

    it('should stay in IDLE when tracking is lost', () => {
      const frame = createFrame({ trackingOk: false, palmAngle: 20 });
      const action = fsm.process(frame);

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('none');
    });
  });

  describe('TRACKING state', () => {
    beforeEach(() => {
      // Get into TRACKING state
      fsm.process(createFrame({ palmAngle: 20 }));
      expect(fsm.getState()).toBe('TRACKING');
    });

    it('should emit pointermove while tracking', () => {
      const action = fsm.process(createFrame({ 
        palmAngle: 25, 
        position: { x: 0.6, y: 0.4 } 
      }));

      expect(fsm.getState()).toBe('TRACKING');
      expect(action.type).toBe('move');
      if (action.type === 'move') {
        expect(action.x).toBe(0.6);
        expect(action.y).toBe(0.4);
      }
    });

    it('should return to IDLE when palm rolls away (> cancelThreshold)', () => {
      const action = fsm.process(createFrame({ palmAngle: 80 })); // > 70° cancel

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('leave');
    });

    it('should use hysteresis - stay in TRACKING when palmAngle between thresholds', () => {
      // Currently in TRACKING (wasFacing = true)
      // Exit threshold is 45°, so 40° should still be tracking
      const action = fsm.process(createFrame({ palmAngle: 40 }));

      expect(fsm.getState()).toBe('TRACKING');
      expect(action.type).toBe('move');
    });

    it('should exit TRACKING when palmAngle exceeds exit threshold', () => {
      // Exit threshold is 45°
      const action = fsm.process(createFrame({ palmAngle: 50 }));

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('leave');
    });

    it('should transition to COASTING when tracking lost', () => {
      const action = fsm.process(createFrame({ trackingOk: false }));

      expect(fsm.getState()).toBe('COASTING');
      expect(action.type).toBe('none');
    });
  });

  describe('TRACKING → ARMED transition', () => {
    beforeEach(() => {
      // Get into TRACKING state
      fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      expect(fsm.getState()).toBe('TRACKING');
    });

    it('should transition to ARMED after stable Open_Palm', () => {
      // Need to hold Open_Palm for armStableMs (150ms default)
      fsm.process(createFrame({ ts: 1050, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('TRACKING'); // Not yet stable

      fsm.process(createFrame({ ts: 1100, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('TRACKING'); // Still not 150ms

      const action = fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('ARMED'); // Now stable (200ms > 150ms)
      expect(action.type).toBe('move');
    });

    it('should reset stability timer when gesture changes', () => {
      fsm.process(createFrame({ ts: 1050, palmAngle: 20, gesture: 'Open_Palm' }));
      fsm.process(createFrame({ ts: 1100, palmAngle: 20, gesture: 'Closed_Fist' })); // Changes
      fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' })); // Reset timer
      
      // Should not be ARMED yet because timer was reset
      expect(fsm.getState()).toBe('TRACKING');
    });
  });

  describe('ARMED state', () => {
    beforeEach(() => {
      // Get into ARMED state
      fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('ARMED');
    });

    it('should emit pointermove while armed', () => {
      const action = fsm.process(createFrame({ 
        ts: 1300,
        palmAngle: 20, 
        gesture: 'Open_Palm',
        position: { x: 0.7, y: 0.3 } 
      }));

      expect(fsm.getState()).toBe('ARMED');
      expect(action.type).toBe('move');
    });

    it('should transition to ENGAGED when pointing', () => {
      const action = fsm.process(createFrame({ 
        ts: 1300,
        palmAngle: 20, 
        gesture: 'Pointing_Up',
        confidence: 0.9
      }));

      expect(fsm.getState()).toBe('ENGAGED');
      expect(action.type).toBe('down');
    });

    it('should return to IDLE when palm rolls away', () => {
      const action = fsm.process(createFrame({ 
        ts: 1300,
        palmAngle: 80, // Cancel threshold
        gesture: 'Open_Palm'
      }));

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('leave');
    });
  });

  describe('ENGAGED state', () => {
    beforeEach(() => {
      // Get into ENGAGED state
      fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      fsm.process(createFrame({ ts: 1300, palmAngle: 20, gesture: 'Pointing_Up' }));
      expect(fsm.getState()).toBe('ENGAGED');
    });

    it('should emit pointermove while engaged (dragging)', () => {
      const action = fsm.process(createFrame({ 
        ts: 1400,
        palmAngle: 20, 
        gesture: 'Pointing_Up',
        position: { x: 0.8, y: 0.2 } 
      }));

      expect(fsm.getState()).toBe('ENGAGED');
      expect(action.type).toBe('move');
    });

    it('should transition to ARMED (pointerup) when returning to Open_Palm', () => {
      const action = fsm.process(createFrame({ 
        ts: 1400,
        palmAngle: 20, 
        gesture: 'Open_Palm',
        confidence: 0.9
      }));

      expect(fsm.getState()).toBe('ARMED');
      expect(action.type).toBe('up');
    });

    it('should return to IDLE with pointercancel when palm rolls away', () => {
      const action = fsm.process(createFrame({ 
        ts: 1400,
        palmAngle: 80, // Cancel threshold
        gesture: 'Pointing_Up'
      }));

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('cancel'); // Cancel the drag
    });
  });

  describe('COASTING state', () => {
    beforeEach(() => {
      // Get into TRACKING, then lose tracking
      fsm.process(createFrame({ ts: 1000, palmAngle: 20, velocity: { vx: 0.01, vy: 0.01 } }));
      fsm.process(createFrame({ ts: 1100, trackingOk: false }));
      expect(fsm.getState()).toBe('COASTING');
    });

    it('should continue coasting with damped velocity', () => {
      const ctx1 = fsm.getContext();
      const pos1 = { ...ctx1.position };

      fsm.process(createFrame({ ts: 1200, trackingOk: false }));
      
      const ctx2 = fsm.getContext();
      // Position should have moved based on velocity
      expect(ctx2.position.x).not.toBe(pos1.x);
    });

    it('should recover to TRACKING when tracking returns', () => {
      const action = fsm.process(createFrame({ ts: 1200, trackingOk: true, palmAngle: 20 }));

      expect(fsm.getState()).toBe('TRACKING');
      expect(action.type).toBe('move');
    });

    it('should timeout to IDLE after coastingMaxMs', () => {
      const ctx = fsm.getContext();
      const startTs = ctx.coastStartAt!;
      
      // Exceed coasting timeout (2000ms default)
      const action = fsm.process(createFrame({ 
        ts: startTs + 2500, 
        trackingOk: false 
      }));

      expect(fsm.getState()).toBe('IDLE');
      expect(action.type).toBe('leave');
    });
  });

  describe('Schmitt Trigger Hysteresis', () => {
    it('should not oscillate at boundary', () => {
      // Start facing camera
      fsm.process(createFrame({ palmAngle: 25 }));
      expect(fsm.getState()).toBe('TRACKING');

      // Move to boundary - should stay due to hysteresis
      fsm.process(createFrame({ palmAngle: 35 })); // Between 30-45
      expect(fsm.getState()).toBe('TRACKING');

      fsm.process(createFrame({ palmAngle: 40 })); // Still between thresholds
      expect(fsm.getState()).toBe('TRACKING');

      // Now exceed exit threshold
      fsm.process(createFrame({ palmAngle: 50 })); // > 45
      expect(fsm.getState()).toBe('IDLE');

      // Now at boundary from below - should NOT enter yet
      fsm.process(createFrame({ palmAngle: 35 })); // Between 30-45 but not < 30
      expect(fsm.getState()).toBe('IDLE');

      // Go below enter threshold
      fsm.process(createFrame({ palmAngle: 25 })); // < 30
      expect(fsm.getState()).toBe('TRACKING');
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom thresholds', () => {
      const customConfig: Partial<GateConfig> = {
        palm: {
          enterThreshold: 20,
          exitThreshold: 35,
          cancelThreshold: 60,
        },
        confidence: DEFAULT_GATE_CONFIG.confidence,
        timing: DEFAULT_GATE_CONFIG.timing,
        coasting: DEFAULT_GATE_CONFIG.coasting,
      };

      const customFsm = new W3CPointerFSM(customConfig);
      
      try {
        // 25° should NOT enter with custom threshold (need < 20)
        customFsm.process(createFrame({ palmAngle: 25 }));
        expect(customFsm.getState()).toBe('IDLE');

        // 15° should enter
        customFsm.process(createFrame({ palmAngle: 15 }));
        expect(customFsm.getState()).toBe('TRACKING');
      } finally {
        customFsm.dispose();
      }
    });
  });

  describe('Manual Cancel', () => {
    it('should cancel from any state', () => {
      // Get to ARMED
      fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('ARMED');

      // Manual cancel
      fsm.cancel();
      expect(fsm.getState()).toBe('IDLE');
    });
  });
});

// ============================================================================
// INTEGRATION: Full Gesture Flow
// ============================================================================

describe('W3CPointerFSM Integration', () => {
  it('should complete full click flow: enter → arm → down → up → leave', () => {
    const fsm = new W3CPointerFSM();
    const events: string[] = [];

    try {
      // Hand enters, facing camera
      let action = fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      events.push(action.type);
      expect(action.type).toBe('enter');

      // Open palm held - tracking
      action = fsm.process(createFrame({ ts: 1100, palmAngle: 20, gesture: 'Open_Palm' }));
      events.push(action.type);
      expect(action.type).toBe('move');

      // Open palm stable - armed
      action = fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      events.push(action.type);
      expect(action.type).toBe('move');
      expect(fsm.getState()).toBe('ARMED');

      // Point to click
      action = fsm.process(createFrame({ ts: 1300, palmAngle: 20, gesture: 'Pointing_Up' }));
      events.push(action.type);
      expect(action.type).toBe('down');

      // Return to open palm
      action = fsm.process(createFrame({ ts: 1400, palmAngle: 20, gesture: 'Open_Palm', confidence: 0.9 }));
      events.push(action.type);
      expect(action.type).toBe('up');

      // Roll palm away to leave
      action = fsm.process(createFrame({ ts: 1500, palmAngle: 80 }));
      events.push(action.type);
      expect(action.type).toBe('leave');

      expect(events).toEqual(['enter', 'move', 'move', 'down', 'up', 'leave']);
    } finally {
      fsm.dispose();
    }
  });

  it('should complete drag flow: enter → arm → down → move → move → cancel', () => {
    const fsm = new W3CPointerFSM();

    try {
      // Enter and arm
      fsm.process(createFrame({ ts: 1000, palmAngle: 20 }));
      fsm.process(createFrame({ ts: 1200, palmAngle: 20, gesture: 'Open_Palm' }));
      expect(fsm.getState()).toBe('ARMED');

      // Start drag
      fsm.process(createFrame({ ts: 1300, palmAngle: 20, gesture: 'Pointing_Up' }));
      expect(fsm.getState()).toBe('ENGAGED');

      // Drag
      let action = fsm.process(createFrame({ 
        ts: 1400, 
        palmAngle: 20, 
        gesture: 'Pointing_Up',
        position: { x: 0.7, y: 0.3 }
      }));
      expect(action.type).toBe('move');

      // More drag
      action = fsm.process(createFrame({ 
        ts: 1500, 
        palmAngle: 20, 
        gesture: 'Pointing_Up',
        position: { x: 0.8, y: 0.2 }
      }));
      expect(action.type).toBe('move');

      // Cancel by rolling palm away
      action = fsm.process(createFrame({ 
        ts: 1600, 
        palmAngle: 80, 
        gesture: 'Pointing_Up'
      }));
      expect(action.type).toBe('cancel');
      expect(fsm.getState()).toBe('IDLE');
    } finally {
      fsm.dispose();
    }
  });
});
