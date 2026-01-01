/**
 * MediaPipe Hand Gesture Adapter - Input Port Implementation
 * 
 * Gen87.X3 | Hot Silver | Anti-Reward-Hacking
 * 
 * DESIGN: Converts MediaPipe HandLandmarkerResult → PointerFrame
 * 
 * ANTI-THEATER DETECTION (Catches Lazy AI / Fake Gestures):
 * 1. VELOCITY_SPIKE: Impossible human hand acceleration
 * 2. PERFECT_TRACKING: No natural jitter = synthetic input
 * 3. TELEPORTATION: Position jumps > threshold
 * 4. CONFIDENCE_FLATLINE: Constant confidence = mocked data
 * 5. ANGLE_IMPOSSIBILITY: Palm angles that break physics
 * 6. FRAME_TIMING: Frames too perfect = replay attack
 */

import type {
  IPointerFramePort,
  PointerFrame,
  NormalizedPosition,
  Velocity2D,
  GestureLabel,
} from './contracts.js';

import { safeValidateFrame, createLostFrame } from './contracts.js';

// ============================================================================
// ANTI-REWARD-HACKING CONFIGURATION
// ============================================================================

export interface AntiTheaterConfig {
  /** Max velocity magnitude before flagging (normalized units/ms) */
  maxVelocity: number;
  /** Min variance in position to be considered "natural" */
  minJitter: number;
  /** Max position jump in single frame */
  maxTeleport: number;
  /** Confidence must vary by at least this much */
  minConfidenceVariance: number;
  /** Window size for variance calculation */
  varianceWindowSize: number;
  /** Strict timing variance check (ms) */
  framingToleranceMs: number;
  /** How many violations before quarantine */
  quarantineThreshold: number;
}

export const DEFAULT_ANTI_THEATER: AntiTheaterConfig = {
  maxVelocity: 0.05,           // 5% of screen per ms is superhuman
  minJitter: 0.0001,           // Must have SOME natural noise
  maxTeleport: 0.15,           // 15% screen jump = teleport
  minConfidenceVariance: 0.01, // Confidence must wobble
  varianceWindowSize: 30,      // ~500ms at 60fps
  framingToleranceMs: 2,       // Perfect 16.666ms = suspicious
  quarantineThreshold: 5,      // 5 violations = quarantine
};

// ============================================================================
// VIOLATION TYPES
// ============================================================================

export type ViolationType =
  | 'VELOCITY_SPIKE'
  | 'PERFECT_TRACKING'
  | 'TELEPORTATION'
  | 'CONFIDENCE_FLATLINE'
  | 'ANGLE_IMPOSSIBILITY'
  | 'FRAME_TIMING'
  | 'REPLAY_DETECTED';

export interface TheaterViolation {
  ts: number;
  type: ViolationType;
  severity: 'warn' | 'error' | 'quarantine';
  details: string;
  frame?: Partial<PointerFrame>;
}

// ============================================================================
// MEDIAPIPE TYPES (subset we care about)
// ============================================================================

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandGesture {
  categoryName: string;
  score: number;
}

export interface HandLandmarkerResult {
  landmarks: HandLandmark[][];
  worldLandmarks: HandLandmark[][];
  handednesses: Array<Array<{ categoryName: string; score: number }>>;
  gestures: HandGesture[][];
}

// Landmark indices
const WRIST = 0;
const INDEX_FINGER_TIP = 8;
const MIDDLE_FINGER_MCP = 9;

// ============================================================================
// MEDIAPIPE ADAPTER
// ============================================================================

export class MediaPipeAdapter implements IPointerFramePort {
  readonly id: string;
  readonly name = 'MediaPipe Hand Gesture Adapter';

  private running = false;
  private frameCallback: ((frame: PointerFrame) => void) | null = null;
  private antiTheaterConfig: AntiTheaterConfig;

  // Anti-theater state
  private violations: TheaterViolation[] = [];
  private quarantined = false;
  private recentPositions: NormalizedPosition[] = [];
  private recentConfidences: number[] = [];
  private recentTimestamps: number[] = [];
  private lastPosition: NormalizedPosition = { x: 0.5, y: 0.5 };
  private lastVelocity: Velocity2D = { vx: 0, vy: 0 };
  private lastTs = 0;

  // Video/MediaPipe state
  private videoElement: HTMLVideoElement | null = null;
  private handLandmarker: any = null; // MediaPipe HandLandmarker
  private animationFrameId: number | null = null;

  constructor(id: string = 'mediapipe-1', config: Partial<AntiTheaterConfig> = {}) {
    this.id = id;
    this.antiTheaterConfig = { ...DEFAULT_ANTI_THEATER, ...config };
  }

  // ==========================================================================
  // IPointerFramePort Implementation
  // ==========================================================================

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.quarantined = false;
    this.violations = [];
    // Note: Actual camera start is triggered externally via startCamera()
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.videoElement?.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
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

  // ==========================================================================
  // MediaPipe Integration
  // ==========================================================================

  async startCamera(videoElement: HTMLVideoElement, handLandmarker: any): Promise<void> {
    this.videoElement = videoElement;
    this.handLandmarker = handLandmarker;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });

    videoElement.srcObject = stream;
    await new Promise<void>((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });

    this.running = true;
    this.processFrame();
  }

  private processFrame(): void {
    if (!this.running || !this.videoElement || !this.handLandmarker) return;

    const ts = performance.now();

    // Get MediaPipe results
    const results: HandLandmarkerResult = this.handLandmarker.detectForVideo(
      this.videoElement,
      ts
    );

    // Convert to PointerFrame
    const frame = this.convertToFrame(results, ts);

    // Anti-theater validation
    if (frame.trackingOk) {
      this.validateFrame(frame);
    }

    // Emit if not quarantined
    if (!this.quarantined && this.frameCallback) {
      const validated = safeValidateFrame(frame);
      if (validated.success) {
        this.frameCallback(validated.data);
      }
    }

    // Update history
    this.updateHistory(frame);

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.processFrame());
  }

  // ==========================================================================
  // Frame Conversion
  // ==========================================================================

  private convertToFrame(results: HandLandmarkerResult, ts: number): PointerFrame {
    // No hands detected
    if (!results.landmarks?.length) {
      return createLostFrame(ts, this.lastPosition, this.lastVelocity);
    }

    const landmarks = results.landmarks[0];
    const worldLandmarks = results.worldLandmarks?.[0];
    const gestures = results.gestures?.[0];

    // Index fingertip position (normalized 0-1)
    const indexTip = landmarks[INDEX_FINGER_TIP];
    const position: NormalizedPosition = {
      x: Math.max(0, Math.min(1, indexTip.x)),
      y: Math.max(0, Math.min(1, indexTip.y)),
    };

    // Compute velocity
    const dt = ts - this.lastTs;
    const velocity: Velocity2D = dt > 0
      ? {
          vx: (position.x - this.lastPosition.x) / dt,
          vy: (position.y - this.lastPosition.y) / dt,
        }
      : { vx: 0, vy: 0 };

    // Palm angle from camera normal
    const palmAngle = this.computePalmAngle(landmarks, worldLandmarks);

    // Gesture label
    const gesture = this.mapGesture(gestures);
    const confidence = gestures?.[0]?.score ?? 0;

    return {
      ts,
      trackingOk: true,
      palmAngle,
      gesture,
      confidence,
      position,
      velocity,
    };
  }

  private computePalmAngle(landmarks: HandLandmark[], worldLandmarks?: HandLandmark[]): number {
    if (!worldLandmarks?.length) {
      // Fallback: estimate from 2D landmarks
      const wrist = landmarks[WRIST];
      const middle = landmarks[MIDDLE_FINGER_MCP];
      
      // Palm "normal" approximation from wrist→middle vector
      const palmZ = Math.abs(middle.z - wrist.z);
      const palmY = Math.abs(middle.y - wrist.y);
      
      // Angle from camera (z=0 is facing camera)
      return Math.atan2(palmY, palmZ) * (180 / Math.PI);
    }

    // Use world landmarks for proper 3D palm angle
    const wrist = worldLandmarks[WRIST];
    const middle = worldLandmarks[MIDDLE_FINGER_MCP];
    const index = worldLandmarks[INDEX_FINGER_TIP];

    // Palm normal via cross product of two vectors on palm
    const v1 = { x: middle.x - wrist.x, y: middle.y - wrist.y, z: middle.z - wrist.z };
    const v2 = { x: index.x - wrist.x, y: index.y - wrist.y, z: index.z - wrist.z };

    const normal = {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x,
    };

    // Angle between palm normal and camera (z-axis)
    const mag = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
    if (mag < 0.001) return 90;

    const cosAngle = Math.abs(normal.z) / mag;
    return Math.acos(Math.min(1, cosAngle)) * (180 / Math.PI);
  }

  private mapGesture(gestures?: HandGesture[]): GestureLabel {
    if (!gestures?.length) return 'None';

    const name = gestures[0].categoryName;
    const validGestures: GestureLabel[] = [
      'None', 'Open_Palm', 'Pointing_Up', 'Victory', 'Thumb_Up', 'Thumb_Down', 'Closed_Fist'
    ];

    return validGestures.includes(name as GestureLabel) 
      ? (name as GestureLabel) 
      : 'None';
  }

  // ==========================================================================
  // ANTI-THEATER VALIDATION (Catches Lazy AI)
  // ==========================================================================

  private validateFrame(frame: PointerFrame): void {
    const config = this.antiTheaterConfig;

    // 1. VELOCITY_SPIKE - Impossible human acceleration
    const velMag = Math.sqrt(frame.velocity!.vx ** 2 + frame.velocity!.vy ** 2);
    if (velMag > config.maxVelocity) {
      this.addViolation({
        ts: frame.ts,
        type: 'VELOCITY_SPIKE',
        severity: 'error',
        details: `Velocity ${velMag.toFixed(4)} > max ${config.maxVelocity}. Superhuman speed detected.`,
        frame,
      });
    }

    // 2. TELEPORTATION - Position jump
    const dx = frame.position.x - this.lastPosition.x;
    const dy = frame.position.y - this.lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > config.maxTeleport && this.lastTs > 0) {
      this.addViolation({
        ts: frame.ts,
        type: 'TELEPORTATION',
        severity: 'error',
        details: `Position jumped ${(distance * 100).toFixed(1)}% of screen. Teleportation detected.`,
        frame,
      });
    }

    // 3. PERFECT_TRACKING - No natural jitter (variance check)
    if (this.recentPositions.length >= config.varianceWindowSize) {
      const variance = this.computePositionVariance();
      if (variance < config.minJitter) {
        this.addViolation({
          ts: frame.ts,
          type: 'PERFECT_TRACKING',
          severity: 'warn',
          details: `Position variance ${variance.toExponential(2)} < min ${config.minJitter}. Too perfect = synthetic.`,
        });
      }
    }

    // 4. CONFIDENCE_FLATLINE - Constant confidence
    if (this.recentConfidences.length >= config.varianceWindowSize) {
      const confVariance = this.computeConfidenceVariance();
      if (confVariance < config.minConfidenceVariance) {
        this.addViolation({
          ts: frame.ts,
          type: 'CONFIDENCE_FLATLINE',
          severity: 'warn',
          details: `Confidence variance ${confVariance.toExponential(2)} < min. Mocked data suspected.`,
        });
      }
    }

    // 5. ANGLE_IMPOSSIBILITY - Physically impossible palm angles
    if (frame.palmAngle < 0 || frame.palmAngle > 180) {
      this.addViolation({
        ts: frame.ts,
        type: 'ANGLE_IMPOSSIBILITY',
        severity: 'quarantine',
        details: `Palm angle ${frame.palmAngle}° outside [0, 180]. Physics violation.`,
        frame,
      });
    }

    // 6. FRAME_TIMING - Perfect intervals = replay
    if (this.recentTimestamps.length >= 10) {
      const intervals = [];
      for (let i = 1; i < this.recentTimestamps.length; i++) {
        intervals.push(this.recentTimestamps[i] - this.recentTimestamps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((s, i) => s + (i - avgInterval) ** 2, 0) / intervals.length;
      
      if (Math.sqrt(intervalVariance) < config.framingToleranceMs) {
        this.addViolation({
          ts: frame.ts,
          type: 'FRAME_TIMING',
          severity: 'warn',
          details: `Frame timing variance ${Math.sqrt(intervalVariance).toFixed(2)}ms < ${config.framingToleranceMs}ms. Replay suspected.`,
        });
      }
    }
  }

  private addViolation(violation: TheaterViolation): void {
    this.violations.push(violation);

    // Emit to console for debugging
    console.warn(`[ANTI-THEATER] ${violation.type}: ${violation.details}`);

    // Check quarantine threshold using frame timestamps (not wall clock)
    const latestTs = this.lastTs > 0 ? this.lastTs : violation.ts;
    const recentViolations = this.violations.filter(v => 
      v.ts > latestTs - 5000 && (v.severity === 'error' || v.severity === 'quarantine')
    );

    if (recentViolations.length >= this.antiTheaterConfig.quarantineThreshold) {
      this.quarantine('Too many violations in 5s window');
    }

    if (violation.severity === 'quarantine') {
      this.quarantine(violation.details);
    }
  }

  private quarantine(reason: string): void {
    this.quarantined = true;
    console.error(`[ANTI-THEATER] 🚨 QUARANTINED: ${reason}`);
    
    // Could emit a special signal to blackboard here
    this.violations.push({
      ts: Date.now(),
      type: 'REPLAY_DETECTED',
      severity: 'quarantine',
      details: `QUARANTINE TRIGGERED: ${reason}`,
    });
  }

  // ==========================================================================
  // History Management
  // ==========================================================================

  private updateHistory(frame: PointerFrame): void {
    const config = this.antiTheaterConfig;

    // Update position history
    this.recentPositions.push(frame.position);
    if (this.recentPositions.length > config.varianceWindowSize) {
      this.recentPositions.shift();
    }

    // Update confidence history
    this.recentConfidences.push(frame.confidence);
    if (this.recentConfidences.length > config.varianceWindowSize) {
      this.recentConfidences.shift();
    }

    // Update timestamp history
    this.recentTimestamps.push(frame.ts);
    if (this.recentTimestamps.length > config.varianceWindowSize) {
      this.recentTimestamps.shift();
    }

    // Update last values
    this.lastPosition = frame.position;
    this.lastVelocity = frame.velocity ?? { vx: 0, vy: 0 };
    this.lastTs = frame.ts;
  }

  private computePositionVariance(): number {
    const positions = this.recentPositions;
    const n = positions.length;
    if (n < 2) return Infinity;

    const avgX = positions.reduce((s, p) => s + p.x, 0) / n;
    const avgY = positions.reduce((s, p) => s + p.y, 0) / n;

    const variance = positions.reduce((s, p) => {
      return s + (p.x - avgX) ** 2 + (p.y - avgY) ** 2;
    }, 0) / n;

    return variance;
  }

  private computeConfidenceVariance(): number {
    const confs = this.recentConfidences;
    const n = confs.length;
    if (n < 2) return Infinity;

    const avg = confs.reduce((a, b) => a + b, 0) / n;
    return confs.reduce((s, c) => s + (c - avg) ** 2, 0) / n;
  }

  // ==========================================================================
  // Public API for External Integration
  // ==========================================================================

  /** Inject a frame manually (for testing or synthetic input) */
  injectFrame(frame: PointerFrame): void {
    if (!this.running) return;

    // ALWAYS compute velocity from frame deltas (ignore provided velocity for synthetic frames)
    // This ensures anti-theater validation catches velocity violations
    let frameWithVelocity = frame;
    if (this.lastTs > 0) {
      const dt = frame.ts - this.lastTs;
      if (dt > 0) {
        frameWithVelocity = {
          ...frame,
          velocity: {
            vx: (frame.position.x - this.lastPosition.x) / dt,
            vy: (frame.position.y - this.lastPosition.y) / dt,
          },
        };
      } else {
        frameWithVelocity = { ...frame, velocity: { vx: 0, vy: 0 } };
      }
    } else {
      // First frame - no velocity yet
      frameWithVelocity = { ...frame, velocity: { vx: 0, vy: 0 } };
    }

    // Still validate injected frames!
    if (frameWithVelocity.trackingOk) {
      this.validateFrame(frameWithVelocity);
    }

    if (!this.quarantined && this.frameCallback) {
      const validated = safeValidateFrame(frameWithVelocity);
      if (validated.success) {
        this.frameCallback(validated.data);
      }
    }

    this.updateHistory(frameWithVelocity);
  }

  /** Get current violation log */
  getViolations(): TheaterViolation[] {
    return [...this.violations];
  }

  /** Check if quarantined */
  isQuarantined(): boolean {
    return this.quarantined;
  }

  /** Reset quarantine (manual override) */
  resetQuarantine(): void {
    this.quarantined = false;
    this.violations = [];
    this.recentPositions = [];
    this.recentConfidences = [];
    this.recentTimestamps = [];
  }

  /** Get anti-theater config */
  getConfig(): AntiTheaterConfig {
    return { ...this.antiTheaterConfig };
  }
}
