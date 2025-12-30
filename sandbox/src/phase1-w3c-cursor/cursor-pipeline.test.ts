/**
 * @fileoverview PHASE 1 RED Tests - W3C Physics Cursor MVP
 * 
 * GOAL: Stateful, reliable, physics-driven cursor
 * 
 * Pipeline: MediaPipe → Normalize → 1€ → Spring → W3C PointerEvent → Target
 * 
 * PHASE 1 SCOPE (MVP):
 * ✅ Single hand, single cursor
 * ✅ Index finger tip as pointer
 * ✅ 1€ filter for jitter removal
 * ✅ Spring physics for smooth feel
 * ✅ Tracking state (tracking/lost/snaplock)
 * ✅ W3C PointerEvent output
 * 
 * DEFERRED (Phase 2+):
 * ❌ Multi-hand
 * ❌ Predictive cursor
 * ❌ Palm orientation arming
 * ❌ Commit gestures
 * ❌ Directional modifiers
 * 
 * @module phase1-w3c-cursor/cursor-pipeline.test
 * @hive I (Interlock)
 * @tdd RED
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ============================================================================
// PHASE 1 PORT INTERFACES (Hexagonal CDD)
// ============================================================================

/**
 * Input: Raw MediaPipe landmark (21 points per hand)
 */
interface MediaPipeLandmark {
  x: number;  // 0-1 normalized to image width
  y: number;  // 0-1 normalized to image height
  z: number;  // Depth relative to wrist
}

/**
 * Input: Single frame from MediaPipe
 */
interface HandFrame {
  landmarks: MediaPipeLandmark[];  // 21 landmarks
  handedness: 'Left' | 'Right';
  confidence: number;  // 0-1
  timestampMs: number;
}

/**
 * Normalized 2D position for cursor
 */
interface CursorPosition {
  x: number;  // 0-1 viewport normalized
  y: number;  // 0-1 viewport normalized
  confidence: number;
  timestampMs: number;
}

/**
 * PORT: Input normalizer - extracts cursor position from landmarks
 */
interface InputNormalizerPort {
  /** Extract index finger tip position */
  normalize(frame: HandFrame): CursorPosition | null;
  /** Configure which landmark to track (default: index tip = 8) */
  setLandmarkIndex(index: number): void;
}

/**
 * PORT: Smoother - single stage filter
 */
interface SmootherPort {
  /** Process position, return smoothed */
  smooth(pos: CursorPosition): CursorPosition;
  /** Reset filter state */
  reset(): void;
  /** Get current state for debugging */
  getState(): unknown;
}

/**
 * PORT: Smoother chain - composable smoothers
 */
interface SmootherChainPort {
  /** Add smoother to chain */
  add(smoother: SmootherPort): void;
  /** Process through all smoothers */
  process(pos: CursorPosition): CursorPosition;
  /** Reset all smoothers */
  reset(): void;
  /** Get intermediate positions (for debugging) */
  getIntermediates(): CursorPosition[];
}

/**
 * Tracking state
 */
type TrackingState = 'tracking' | 'lost' | 'snaplock';

/**
 * PORT: Tracking state manager
 */
interface TrackingStatePort {
  /** Current state */
  readonly state: TrackingState;
  /** Update with new frame (or null if no hand) */
  update(frame: HandFrame | null, timestampMs: number): void;
  /** Get last known good position (for snaplock) */
  getSnaplockPosition(): CursorPosition | null;
  /** Time since tracking lost (ms) */
  getLostDuration(): number;
  /** Configure timeouts */
  configure(opts: { snaplockTimeoutMs: number; lostTimeoutMs: number }): void;
}

/**
 * W3C PointerEvent output (subset we generate)
 */
interface W3CPointerEventInit {
  pointerId: number;
  pointerType: 'touch' | 'pen' | 'mouse';
  isPrimary: boolean;
  clientX: number;
  clientY: number;
  pressure: number;
  width: number;
  height: number;
  tiltX: number;
  tiltY: number;
}

/**
 * PORT: W3C PointerEvent factory
 */
interface W3CPointerEventFactoryPort {
  /** Create pointerdown event */
  createPointerDown(pos: CursorPosition, viewport: { width: number; height: number }): W3CPointerEventInit;
  /** Create pointermove event */
  createPointerMove(pos: CursorPosition, viewport: { width: number; height: number }): W3CPointerEventInit;
  /** Create pointerup event */
  createPointerUp(pos: CursorPosition, viewport: { width: number; height: number }): W3CPointerEventInit;
  /** Create pointercancel (tracking lost) */
  createPointerCancel(): W3CPointerEventInit;
  /** Set pointer ID for this cursor */
  setPointerId(id: number): void;
}

/**
 * PORT: Event dispatcher to target
 */
interface EventDispatcherPort {
  /** Dispatch pointer event to target */
  dispatch(eventType: string, init: W3CPointerEventInit): boolean;
  /** Set target element/context */
  setTarget(target: EventTarget): void;
  /** Get dispatch count (for testing) */
  getDispatchCount(): number;
}

/**
 * Full cursor pipeline config
 */
interface CursorPipelineConfig {
  normalizer: InputNormalizerPort;
  smootherChain: SmootherChainPort;
  trackingState: TrackingStatePort;
  eventFactory: W3CPointerEventFactoryPort;
  dispatcher: EventDispatcherPort;
  viewport: { width: number; height: number };
}

/**
 * PORT: Complete cursor pipeline
 */
interface CursorPipelinePort {
  /** Process a frame, dispatch events */
  processFrame(frame: HandFrame | null): void;
  /** Get current cursor position */
  getCurrentPosition(): CursorPosition | null;
  /** Get tracking state */
  getTrackingState(): TrackingState;
  /** Reset pipeline */
  reset(): void;
}

// ============================================================================
// PLACEHOLDER IMPLEMENTATIONS (Will fail - RED phase)
// ============================================================================

let IndexFingerNormalizer: any;
let OneEuroFilter: any;
let SpringDamperFilter: any;
let SmootherChain: any;
let TrackingStateManager: any;
let W3CPointerEventFactory: any;
let DOMEventDispatcher: any;
let CursorPipeline: any;

try { IndexFingerNormalizer = require('./index-finger-normalizer.js').IndexFingerNormalizer; }
catch { IndexFingerNormalizer = class { constructor() { throw new Error('IndexFingerNormalizer not implemented'); } }; }

try { OneEuroFilter = require('./one-euro-filter.js').OneEuroFilter; }
catch { OneEuroFilter = class { constructor() { throw new Error('OneEuroFilter not implemented'); } }; }

try { SpringDamperFilter = require('./spring-damper-filter.js').SpringDamperFilter; }
catch { SpringDamperFilter = class { constructor() { throw new Error('SpringDamperFilter not implemented'); } }; }

try { SmootherChain = require('./smoother-chain.js').SmootherChain; }
catch { SmootherChain = class { constructor() { throw new Error('SmootherChain not implemented'); } }; }

try { TrackingStateManager = require('./tracking-state.js').TrackingStateManager; }
catch { TrackingStateManager = class { constructor() { throw new Error('TrackingStateManager not implemented'); } }; }

try { W3CPointerEventFactory = require('./w3c-pointer-factory.js').W3CPointerEventFactory; }
catch { W3CPointerEventFactory = class { constructor() { throw new Error('W3CPointerEventFactory not implemented'); } }; }

try { DOMEventDispatcher = require('./dom-event-dispatcher.js').DOMEventDispatcher; }
catch { DOMEventDispatcher = class { constructor() { throw new Error('DOMEventDispatcher not implemented'); } }; }

try { CursorPipeline = require('./cursor-pipeline.js').CursorPipeline; }
catch { CursorPipeline = class { constructor() { throw new Error('CursorPipeline not implemented'); } }; }

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

const landmarkArb = fc.record({
  x: fc.float({ min: 0, max: 1, noNaN: true }),
  y: fc.float({ min: 0, max: 1, noNaN: true }),
  z: fc.float({ min: Math.fround(-0.3), max: Math.fround(0.3), noNaN: true }),
});

const handFrameArb = fc.record({
  landmarks: fc.array(landmarkArb, { minLength: 21, maxLength: 21 }),
  handedness: fc.constantFrom('Left' as const, 'Right' as const),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  timestampMs: fc.integer({ min: 0, max: 1000000 }),
});

const cursorPositionArb = fc.record({
  x: fc.float({ min: 0, max: 1, noNaN: true }),
  y: fc.float({ min: 0, max: 1, noNaN: true }),
  confidence: fc.float({ min: 0, max: 1, noNaN: true }),
  timestampMs: fc.integer({ min: 0, max: 1000000 }),
});

// ============================================================================
// SECTION 1: INPUT NORMALIZATION TESTS
// ============================================================================

describe('PHASE 1 - INPUT: IndexFingerNormalizer', () => {
  describe('Interface compliance', () => {
    it('should implement InputNormalizerPort', () => {
      const normalizer = new IndexFingerNormalizer();
      expect(normalizer.normalize).toBeInstanceOf(Function);
      expect(normalizer.setLandmarkIndex).toBeInstanceOf(Function);
    });
  });

  describe('Position extraction', () => {
    it('should extract index finger tip (landmark 8) by default', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ indexTip: { x: 0.5, y: 0.3, z: 0 } });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos).not.toBeNull();
      expect(pos!.x).toBeCloseTo(0.5, 2);
      expect(pos!.y).toBeCloseTo(0.3, 2);
    });

    it('should return null for low confidence frames', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ confidence: 0.1 });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos).toBeNull();
    });

    it('should pass through confidence value', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ confidence: 0.95 });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.confidence).toBe(0.95);
    });

    it('should pass through timestamp', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ timestampMs: 12345 });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.timestampMs).toBe(12345);
    });

    it('should allow configuring different landmark index', () => {
      const normalizer = new IndexFingerNormalizer();
      normalizer.setLandmarkIndex(12); // Middle finger tip
      
      const frame = createMockHandFrame({ 
        middleTip: { x: 0.7, y: 0.4, z: 0 } 
      });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.x).toBeCloseTo(0.7, 2);
    });
  });

  describe('Edge cases', () => {
    it('should handle landmarks at boundaries (0,0)', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ indexTip: { x: 0, y: 0, z: 0 } });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.x).toBe(0);
      expect(pos!.y).toBe(0);
    });

    it('should handle landmarks at boundaries (1,1)', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ indexTip: { x: 1, y: 1, z: 0 } });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.x).toBe(1);
      expect(pos!.y).toBe(1);
    });

    it('should clamp out-of-bounds landmarks', () => {
      const normalizer = new IndexFingerNormalizer();
      const frame = createMockHandFrame({ indexTip: { x: 1.5, y: -0.2, z: 0 } });
      
      const pos = normalizer.normalize(frame);
      
      expect(pos!.x).toBeLessThanOrEqual(1);
      expect(pos!.x).toBeGreaterThanOrEqual(0);
      expect(pos!.y).toBeLessThanOrEqual(1);
      expect(pos!.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Property-based tests', () => {
    it('should always return position in [0,1] range', () => {
      fc.assert(fc.property(handFrameArb, (frame) => {
        const normalizer = new IndexFingerNormalizer();
        const pos = normalizer.normalize(frame);
        
        if (pos === null) return true; // Low confidence is valid
        
        return pos.x >= 0 && pos.x <= 1 && pos.y >= 0 && pos.y <= 1;
      }));
    });
  });
});

// ============================================================================
// SECTION 2: SMOOTHING FILTER TESTS
// ============================================================================

describe('PHASE 1 - SMOOTH: OneEuroFilter', () => {
  describe('Interface compliance', () => {
    it('should implement SmootherPort', () => {
      const filter = new OneEuroFilter();
      expect(filter.smooth).toBeInstanceOf(Function);
      expect(filter.reset).toBeInstanceOf(Function);
      expect(filter.getState).toBeInstanceOf(Function);
    });
  });

  describe('Filtering behavior', () => {
    it('should return first position unchanged', () => {
      const filter = new OneEuroFilter();
      const pos = createCursorPosition(0.5, 0.5, 0);
      
      const result = filter.smooth(pos);
      
      expect(result.x).toBeCloseTo(0.5, 2);
      expect(result.y).toBeCloseTo(0.5, 2);
    });

    it('should smooth out jitter (high frequency noise)', () => {
      const filter = new OneEuroFilter({ mincutoff: 1.0, beta: 0.0 });
      
      // Simulate jittery input
      filter.smooth(createCursorPosition(0.5, 0.5, 0));
      filter.smooth(createCursorPosition(0.52, 0.48, 16));
      filter.smooth(createCursorPosition(0.48, 0.52, 32));
      const result = filter.smooth(createCursorPosition(0.51, 0.49, 48));
      
      // Should be close to center, not jumping around
      expect(Math.abs(result.x - 0.5)).toBeLessThan(0.03);
      expect(Math.abs(result.y - 0.5)).toBeLessThan(0.03);
    });

    it('should respond quickly to intentional movement (beta > 0)', () => {
      const filter = new OneEuroFilter({ mincutoff: 1.0, beta: 0.5 });
      
      // Start at center
      filter.smooth(createCursorPosition(0.5, 0.5, 0));
      
      // Move intentionally to right
      filter.smooth(createCursorPosition(0.7, 0.5, 16));
      filter.smooth(createCursorPosition(0.8, 0.5, 32));
      const result = filter.smooth(createCursorPosition(0.9, 0.5, 48));
      
      // Should be tracking the movement, not too far behind
      expect(result.x).toBeGreaterThan(0.7);
    });

    it('should preserve timestamp', () => {
      const filter = new OneEuroFilter();
      const pos = createCursorPosition(0.5, 0.5, 12345);
      
      const result = filter.smooth(pos);
      
      expect(result.timestampMs).toBe(12345);
    });
  });

  describe('Configuration', () => {
    it('should accept mincutoff parameter', () => {
      const filter = new OneEuroFilter({ mincutoff: 0.5 });
      expect(filter).toBeDefined();
    });

    it('should accept beta parameter', () => {
      const filter = new OneEuroFilter({ beta: 0.1 });
      expect(filter).toBeDefined();
    });

    it('should accept dcutoff parameter', () => {
      const filter = new OneEuroFilter({ dcutoff: 1.0 });
      expect(filter).toBeDefined();
    });
  });

  describe('Reset behavior', () => {
    it('should reset internal state', () => {
      const filter = new OneEuroFilter();
      
      filter.smooth(createCursorPosition(0.1, 0.1, 0));
      filter.smooth(createCursorPosition(0.2, 0.2, 16));
      filter.reset();
      
      // After reset, next position should be returned unchanged
      const result = filter.smooth(createCursorPosition(0.9, 0.9, 32));
      expect(result.x).toBeCloseTo(0.9, 2);
    });
  });
});

describe('PHASE 1 - SMOOTH: SpringDamperFilter', () => {
  describe('Interface compliance', () => {
    it('should implement SmootherPort', () => {
      const filter = new SpringDamperFilter();
      expect(filter.smooth).toBeInstanceOf(Function);
      expect(filter.reset).toBeInstanceOf(Function);
      expect(filter.getState).toBeInstanceOf(Function);
    });
  });

  describe('Physics behavior', () => {
    it('should converge to target position', () => {
      const filter = new SpringDamperFilter({ stiffness: 100, damping: 10 });
      
      // Start at origin, target at (0.5, 0.5)
      let result = filter.smooth(createCursorPosition(0.5, 0.5, 0));
      
      // Simulate multiple frames
      for (let t = 16; t < 500; t += 16) {
        result = filter.smooth(createCursorPosition(0.5, 0.5, t));
      }
      
      // Should have converged
      expect(result.x).toBeCloseTo(0.5, 1);
      expect(result.y).toBeCloseTo(0.5, 1);
    });

    it('should have smooth acceleration (no instant jumps)', () => {
      const filter = new SpringDamperFilter({ stiffness: 50, damping: 10 });
      
      const positions: number[] = [];
      
      // Start at origin
      filter.smooth(createCursorPosition(0, 0, 0));
      
      // Jump target to (1, 0)
      for (let t = 16; t < 200; t += 16) {
        const result = filter.smooth(createCursorPosition(1, 0, t));
        positions.push(result.x);
      }
      
      // Check smooth acceleration - differences should increase then decrease
      const velocities = positions.slice(1).map((p, i) => p - positions[i]);
      
      // Early velocities should be increasing (accelerating)
      expect(velocities[1]).toBeGreaterThan(velocities[0]);
    });

    it('should be critically damped (no overshoot) with proper settings', () => {
      // Critical damping: damping = 2 * sqrt(stiffness * mass)
      const filter = new SpringDamperFilter({ 
        stiffness: 100, 
        damping: 20, // 2 * sqrt(100 * 1)
        mass: 1 
      });
      
      filter.smooth(createCursorPosition(0, 0, 0));
      
      let maxX = 0;
      for (let t = 16; t < 500; t += 16) {
        const result = filter.smooth(createCursorPosition(0.5, 0, t));
        maxX = Math.max(maxX, result.x);
      }
      
      // Should not overshoot target
      expect(maxX).toBeLessThanOrEqual(0.51);
    });
  });

  describe('Configuration', () => {
    it('should accept stiffness parameter', () => {
      const filter = new SpringDamperFilter({ stiffness: 200 });
      expect(filter).toBeDefined();
    });

    it('should accept damping parameter', () => {
      const filter = new SpringDamperFilter({ damping: 15 });
      expect(filter).toBeDefined();
    });

    it('should accept mass parameter', () => {
      const filter = new SpringDamperFilter({ mass: 0.5 });
      expect(filter).toBeDefined();
    });
  });

  describe('State access', () => {
    it('should expose velocity in state', () => {
      const filter = new SpringDamperFilter();
      
      filter.smooth(createCursorPosition(0, 0, 0));
      filter.smooth(createCursorPosition(0.5, 0, 16));
      
      const state = filter.getState() as { velocity: { x: number; y: number } };
      expect(state.velocity).toBeDefined();
      expect(state.velocity.x).toBeGreaterThan(0);
    });
  });
});

describe('PHASE 1 - SMOOTH: SmootherChain', () => {
  describe('Interface compliance', () => {
    it('should implement SmootherChainPort', () => {
      const chain = new SmootherChain();
      expect(chain.add).toBeInstanceOf(Function);
      expect(chain.process).toBeInstanceOf(Function);
      expect(chain.reset).toBeInstanceOf(Function);
      expect(chain.getIntermediates).toBeInstanceOf(Function);
    });
  });

  describe('Chaining behavior', () => {
    it('should process through smoothers in order', () => {
      const chain = new SmootherChain();
      chain.add(new OneEuroFilter());
      chain.add(new SpringDamperFilter());
      
      const pos = createCursorPosition(0.5, 0.5, 0);
      const result = chain.process(pos);
      
      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('should work with empty chain (passthrough)', () => {
      const chain = new SmootherChain();
      const pos = createCursorPosition(0.7, 0.3, 100);
      
      const result = chain.process(pos);
      
      expect(result.x).toBe(0.7);
      expect(result.y).toBe(0.3);
    });

    it('should reset all smoothers', () => {
      const chain = new SmootherChain();
      const euro = new OneEuroFilter();
      const spring = new SpringDamperFilter();
      
      chain.add(euro);
      chain.add(spring);
      
      // Process some positions
      chain.process(createCursorPosition(0.1, 0.1, 0));
      chain.process(createCursorPosition(0.2, 0.2, 16));
      
      // Reset
      chain.reset();
      
      // Should behave like fresh chain
      const result = chain.process(createCursorPosition(0.9, 0.9, 32));
      expect(result.x).toBeCloseTo(0.9, 1);
    });

    it('should provide intermediate positions', () => {
      const chain = new SmootherChain();
      chain.add(new OneEuroFilter());
      chain.add(new SpringDamperFilter());
      
      chain.process(createCursorPosition(0.5, 0.5, 0));
      
      const intermediates = chain.getIntermediates();
      
      expect(intermediates.length).toBe(2); // One per smoother
    });
  });
});

// ============================================================================
// SECTION 3: TRACKING STATE TESTS
// ============================================================================

describe('PHASE 1 - STATE: TrackingStateManager', () => {
  describe('Interface compliance', () => {
    it('should implement TrackingStatePort', () => {
      const manager = new TrackingStateManager();
      expect(manager.state).toBeDefined();
      expect(manager.update).toBeInstanceOf(Function);
      expect(manager.getSnaplockPosition).toBeInstanceOf(Function);
      expect(manager.getLostDuration).toBeInstanceOf(Function);
      expect(manager.configure).toBeInstanceOf(Function);
    });
  });

  describe('State transitions', () => {
    it('should start in lost state', () => {
      const manager = new TrackingStateManager();
      expect(manager.state).toBe('lost');
    });

    it('should transition to tracking when hand detected', () => {
      const manager = new TrackingStateManager();
      const frame = createMockHandFrame({ confidence: 0.9 });
      
      manager.update(frame, 0);
      
      expect(manager.state).toBe('tracking');
    });

    it('should transition to snaplock when hand lost (null frame)', () => {
      const manager = new TrackingStateManager();
      
      // First track
      manager.update(createMockHandFrame({}), 0);
      expect(manager.state).toBe('tracking');
      
      // Then lose
      manager.update(null, 100);
      
      expect(manager.state).toBe('snaplock');
    });

    it('should transition to lost after snaplock timeout', () => {
      const manager = new TrackingStateManager();
      manager.configure({ snaplockTimeoutMs: 500, lostTimeoutMs: 2000 });
      
      // Track then lose
      manager.update(createMockHandFrame({}), 0);
      manager.update(null, 100);
      expect(manager.state).toBe('snaplock');
      
      // Wait past snaplock timeout
      manager.update(null, 700);
      
      expect(manager.state).toBe('lost');
    });

    it('should return to tracking from snaplock if hand reappears', () => {
      const manager = new TrackingStateManager();
      
      manager.update(createMockHandFrame({}), 0);
      manager.update(null, 100); // Lose
      expect(manager.state).toBe('snaplock');
      
      manager.update(createMockHandFrame({}), 200); // Reappear
      
      expect(manager.state).toBe('tracking');
    });
  });

  describe('Snaplock behavior', () => {
    it('should store last known position when entering snaplock', () => {
      const manager = new TrackingStateManager();
      
      manager.update(createMockHandFrame({ indexTip: { x: 0.7, y: 0.4, z: 0 } }), 0);
      manager.update(null, 100);
      
      const snapPos = manager.getSnaplockPosition();
      
      expect(snapPos).not.toBeNull();
      expect(snapPos!.x).toBeCloseTo(0.7, 1);
      expect(snapPos!.y).toBeCloseTo(0.4, 1);
    });

    it('should return null snaplock position if never tracked', () => {
      const manager = new TrackingStateManager();
      
      expect(manager.getSnaplockPosition()).toBeNull();
    });
  });

  describe('Lost duration tracking', () => {
    it('should track time since tracking lost', () => {
      const manager = new TrackingStateManager();
      
      manager.update(createMockHandFrame({}), 0);
      manager.update(null, 100); // Lost at 100
      manager.update(null, 350);
      
      expect(manager.getLostDuration()).toBe(250);
    });

    it('should reset duration when tracking resumes', () => {
      const manager = new TrackingStateManager();
      
      manager.update(createMockHandFrame({}), 0);
      manager.update(null, 100);
      manager.update(createMockHandFrame({}), 200);
      
      expect(manager.getLostDuration()).toBe(0);
    });
  });

  describe('Confidence threshold', () => {
    it('should treat low confidence as lost', () => {
      const manager = new TrackingStateManager();
      
      manager.update(createMockHandFrame({ confidence: 0.9 }), 0);
      expect(manager.state).toBe('tracking');
      
      manager.update(createMockHandFrame({ confidence: 0.2 }), 100);
      expect(manager.state).toBe('snaplock');
    });
  });
});

// ============================================================================
// SECTION 4: W3C POINTEREVENT OUTPUT TESTS
// ============================================================================

describe('PHASE 1 - OUTPUT: W3CPointerEventFactory', () => {
  describe('Interface compliance', () => {
    it('should implement W3CPointerEventFactoryPort', () => {
      const factory = new W3CPointerEventFactory();
      expect(factory.createPointerDown).toBeInstanceOf(Function);
      expect(factory.createPointerMove).toBeInstanceOf(Function);
      expect(factory.createPointerUp).toBeInstanceOf(Function);
      expect(factory.createPointerCancel).toBeInstanceOf(Function);
      expect(factory.setPointerId).toBeInstanceOf(Function);
    });
  });

  describe('W3C spec compliance', () => {
    it('should create valid pointermove with required properties', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.5, 0);
      const viewport = { width: 1920, height: 1080 };
      
      const event = factory.createPointerMove(pos, viewport);
      
      // Required W3C properties
      expect(event.pointerId).toBeDefined();
      expect(event.pointerType).toBe('touch');
      expect(typeof event.isPrimary).toBe('boolean');
      expect(typeof event.clientX).toBe('number');
      expect(typeof event.clientY).toBe('number');
      expect(typeof event.pressure).toBe('number');
    });

    it('should convert normalized coords to viewport pixels', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.25, 0);
      const viewport = { width: 1920, height: 1080 };
      
      const event = factory.createPointerMove(pos, viewport);
      
      expect(event.clientX).toBe(960);  // 0.5 * 1920
      expect(event.clientY).toBe(270);  // 0.25 * 1080
    });

    it('should set isPrimary to true for first pointer', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.5, 0);
      
      const event = factory.createPointerMove(pos, { width: 100, height: 100 });
      
      expect(event.isPrimary).toBe(true);
    });

    it('should use confidence as pressure', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.5, 0);
      pos.confidence = 0.85;
      
      const event = factory.createPointerMove(pos, { width: 100, height: 100 });
      
      expect(event.pressure).toBeCloseTo(0.85, 2);
    });

    it('should allow setting custom pointerId', () => {
      const factory = new W3CPointerEventFactory();
      factory.setPointerId(42);
      
      const event = factory.createPointerMove(
        createCursorPosition(0.5, 0.5, 0),
        { width: 100, height: 100 }
      );
      
      expect(event.pointerId).toBe(42);
    });
  });

  describe('Event types', () => {
    it('should create pointerdown event', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.5, 0);
      
      const event = factory.createPointerDown(pos, { width: 100, height: 100 });
      
      expect(event).toBeDefined();
      expect(event.pressure).toBeGreaterThan(0); // Down implies pressure
    });

    it('should create pointerup event', () => {
      const factory = new W3CPointerEventFactory();
      const pos = createCursorPosition(0.5, 0.5, 0);
      
      const event = factory.createPointerUp(pos, { width: 100, height: 100 });
      
      expect(event).toBeDefined();
    });

    it('should create pointercancel event', () => {
      const factory = new W3CPointerEventFactory();
      
      const event = factory.createPointerCancel();
      
      expect(event).toBeDefined();
      expect(event.pointerId).toBeDefined();
    });
  });

  describe('Tilt values', () => {
    it('should default tilt to 0', () => {
      const factory = new W3CPointerEventFactory();
      
      const event = factory.createPointerMove(
        createCursorPosition(0.5, 0.5, 0),
        { width: 100, height: 100 }
      );
      
      expect(event.tiltX).toBe(0);
      expect(event.tiltY).toBe(0);
    });
  });
});

describe('PHASE 1 - OUTPUT: DOMEventDispatcher', () => {
  describe('Interface compliance', () => {
    it('should implement EventDispatcherPort', () => {
      const dispatcher = new DOMEventDispatcher();
      expect(dispatcher.dispatch).toBeInstanceOf(Function);
      expect(dispatcher.setTarget).toBeInstanceOf(Function);
      expect(dispatcher.getDispatchCount).toBeInstanceOf(Function);
    });
  });

  describe('Dispatch behavior', () => {
    it('should track dispatch count', () => {
      const dispatcher = new DOMEventDispatcher();
      const mockTarget = createMockEventTarget();
      dispatcher.setTarget(mockTarget);
      
      const init: W3CPointerEventInit = {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX: 100,
        clientY: 100,
        pressure: 0.5,
        width: 1,
        height: 1,
        tiltX: 0,
        tiltY: 0,
      };
      
      dispatcher.dispatch('pointermove', init);
      dispatcher.dispatch('pointermove', init);
      
      expect(dispatcher.getDispatchCount()).toBe(2);
    });

    it('should return false if no target set', () => {
      const dispatcher = new DOMEventDispatcher();
      
      const result = dispatcher.dispatch('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        clientX: 100,
        clientY: 100,
        pressure: 0.5,
        width: 1,
        height: 1,
        tiltX: 0,
        tiltY: 0,
      });
      
      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// SECTION 5: FULL PIPELINE INTEGRATION TESTS
// ============================================================================

describe('PHASE 1 - INTEGRATION: CursorPipeline', () => {
  describe('Interface compliance', () => {
    it('should implement CursorPipelinePort', () => {
      const pipeline = new CursorPipeline(createMockPipelineConfig());
      expect(pipeline.processFrame).toBeInstanceOf(Function);
      expect(pipeline.getCurrentPosition).toBeInstanceOf(Function);
      expect(pipeline.getTrackingState).toBeInstanceOf(Function);
      expect(pipeline.reset).toBeInstanceOf(Function);
    });
  });

  describe('Frame processing', () => {
    it('should update cursor position on valid frame', () => {
      const pipeline = new CursorPipeline(createMockPipelineConfig());
      
      pipeline.processFrame(createMockHandFrame({ indexTip: { x: 0.5, y: 0.5, z: 0 } }));
      
      const pos = pipeline.getCurrentPosition();
      expect(pos).not.toBeNull();
    });

    it('should dispatch pointermove events', () => {
      const config = createMockPipelineConfig();
      const pipeline = new CursorPipeline(config);
      
      pipeline.processFrame(createMockHandFrame({}));
      pipeline.processFrame(createMockHandFrame({}));
      
      expect(config.dispatcher.getDispatchCount()).toBeGreaterThan(0);
    });

    it('should handle null frame (tracking lost)', () => {
      const pipeline = new CursorPipeline(createMockPipelineConfig());
      
      pipeline.processFrame(createMockHandFrame({}));
      pipeline.processFrame(null);
      
      expect(pipeline.getTrackingState()).toBe('snaplock');
    });

    it('should dispatch pointercancel when tracking lost', () => {
      const config = createMockPipelineConfig();
      const pipeline = new CursorPipeline(config);
      
      pipeline.processFrame(createMockHandFrame({}));
      pipeline.processFrame(null);
      
      // Should have dispatched cancel event
      // (Implementation detail: check dispatch count or mock)
    });
  });

  describe('Snaplock behavior', () => {
    it('should hold position during snaplock', () => {
      const pipeline = new CursorPipeline(createMockPipelineConfig());
      
      pipeline.processFrame(createMockHandFrame({ indexTip: { x: 0.7, y: 0.3, z: 0 } }));
      const posBeforeLoss = pipeline.getCurrentPosition();
      
      pipeline.processFrame(null); // Lose tracking
      const posDuringSnaplock = pipeline.getCurrentPosition();
      
      expect(posDuringSnaplock!.x).toBeCloseTo(posBeforeLoss!.x, 1);
      expect(posDuringSnaplock!.y).toBeCloseTo(posBeforeLoss!.y, 1);
    });
  });

  describe('Reset behavior', () => {
    it('should reset all components', () => {
      const pipeline = new CursorPipeline(createMockPipelineConfig());
      
      pipeline.processFrame(createMockHandFrame({}));
      pipeline.reset();
      
      expect(pipeline.getTrackingState()).toBe('lost');
      expect(pipeline.getCurrentPosition()).toBeNull();
    });
  });
});

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockHandFrame(overrides: {
  indexTip?: MediaPipeLandmark;
  middleTip?: MediaPipeLandmark;
  confidence?: number;
  timestampMs?: number;
}): HandFrame {
  const defaultLandmark = { x: 0.5, y: 0.5, z: 0 };
  const landmarks: MediaPipeLandmark[] = Array(21).fill(null).map(() => ({ ...defaultLandmark }));
  
  // Set index tip (landmark 8)
  if (overrides.indexTip) {
    landmarks[8] = overrides.indexTip;
  }
  
  // Set middle tip (landmark 12)
  if (overrides.middleTip) {
    landmarks[12] = overrides.middleTip;
  }
  
  return {
    landmarks,
    handedness: 'Right',
    confidence: overrides.confidence ?? 0.9,
    timestampMs: overrides.timestampMs ?? 0,
  };
}

function createCursorPosition(x: number, y: number, timestampMs: number): CursorPosition {
  return { x, y, confidence: 0.9, timestampMs };
}

function createMockEventTarget(): EventTarget {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

function createMockPipelineConfig(): CursorPipelineConfig {
  return {
    normalizer: new IndexFingerNormalizer(),
    smootherChain: new SmootherChain(),
    trackingState: new TrackingStateManager(),
    eventFactory: new W3CPointerEventFactory(),
    dispatcher: new DOMEventDispatcher(),
    viewport: { width: 1920, height: 1080 },
  };
}
