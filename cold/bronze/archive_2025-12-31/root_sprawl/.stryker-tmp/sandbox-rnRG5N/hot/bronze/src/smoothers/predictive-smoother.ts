/**
 * Predictive Smoother - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Dead Reckoning / Motion Prediction
 * Used in gaming for lag compensation and in touch interfaces for
 * reducing perceived latency.
 *
 * Predicts future position based on:
 * - Current position
 * - Current velocity
 * - Optional: acceleration (jerk-aware prediction)
 *
 * Formula: predicted = position + velocity * lookAhead + 0.5 * acceleration * lookAhead²
 *
 * TRL 9: Standard technique in game networking, touch interfaces, robotics
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import type { SmoothedFrame, SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';
import { SmoothedFrameSchema } from '../contracts/schemas.js';
export interface PredictiveConfig {
  /** How far ahead to predict (ms) */
  predictionMs: number;
  /** Whether to use physics-based prediction */
  usePhysics: boolean;
  /** Velocity smoothing factor (0-1) - optional */
  velocitySmoothing?: number;
}

/**
 * PredictiveSmoother - Motion Prediction
 *
 * Predicts future position using velocity (and optionally acceleration).
 * Reduces perceived latency by rendering where the cursor WILL be.
 */
export class PredictiveSmoother implements SmootherPort {
  private config: PredictiveConfig;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastTs: number | null = null;
  private velX = 0;
  private velY = 0;
  private lastVelX = 0;
  private lastVelY = 0;
  private accelX = 0;
  private accelY = 0;
  constructor(config: PredictiveConfig) {
    if (stryMutAct_9fa48("80")) {
      {}
    } else {
      stryCov_9fa48("80");
      this.config = config;
    }
  }
  smooth(frame: SensorFrame): SmoothedFrame {
    if (stryMutAct_9fa48("81")) {
      {}
    } else {
      stryCov_9fa48("81");
      // If no valid tracking, pass through with null position
      if (stryMutAct_9fa48("84") ? !frame.trackingOk && !frame.indexTip : stryMutAct_9fa48("83") ? false : stryMutAct_9fa48("82") ? true : (stryCov_9fa48("82", "83", "84"), (stryMutAct_9fa48("85") ? frame.trackingOk : (stryCov_9fa48("85"), !frame.trackingOk)) || (stryMutAct_9fa48("86") ? frame.indexTip : (stryCov_9fa48("86"), !frame.indexTip)))) {
        if (stryMutAct_9fa48("87")) {
          {}
        } else {
          stryCov_9fa48("87");
          this.reset();
          return SmoothedFrameSchema.parse(stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
            ts: frame.ts,
            handId: frame.handId,
            trackingOk: stryMutAct_9fa48("89") ? true : (stryCov_9fa48("89"), false),
            palmFacing: frame.palmFacing,
            label: frame.label,
            confidence: frame.confidence,
            position: null,
            velocity: null,
            prediction: null
          }));
        }
      }

      // Clamp position to [0,1] for schema validation
      const x = stryMutAct_9fa48("90") ? Math.min(0, Math.min(1, frame.indexTip.x)) : (stryCov_9fa48("90"), Math.max(0, stryMutAct_9fa48("91") ? Math.max(1, frame.indexTip.x) : (stryCov_9fa48("91"), Math.min(1, frame.indexTip.x))));
      const y = stryMutAct_9fa48("92") ? Math.min(0, Math.min(1, frame.indexTip.y)) : (stryCov_9fa48("92"), Math.max(0, stryMutAct_9fa48("93") ? Math.max(1, frame.indexTip.y) : (stryCov_9fa48("93"), Math.min(1, frame.indexTip.y))));

      // Calculate velocity
      if (stryMutAct_9fa48("96") ? this.lastX !== null && this.lastY !== null || this.lastTs !== null : stryMutAct_9fa48("95") ? false : stryMutAct_9fa48("94") ? true : (stryCov_9fa48("94", "95", "96"), (stryMutAct_9fa48("98") ? this.lastX !== null || this.lastY !== null : stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97", "98"), (stryMutAct_9fa48("100") ? this.lastX === null : stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99", "100"), this.lastX !== null)) && (stryMutAct_9fa48("102") ? this.lastY === null : stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101", "102"), this.lastY !== null)))) && (stryMutAct_9fa48("104") ? this.lastTs === null : stryMutAct_9fa48("103") ? true : (stryCov_9fa48("103", "104"), this.lastTs !== null)))) {
        if (stryMutAct_9fa48("105")) {
          {}
        } else {
          stryCov_9fa48("105");
          let dt = stryMutAct_9fa48("106") ? (frame.ts - this.lastTs) * 1000 : (stryCov_9fa48("106"), (stryMutAct_9fa48("107") ? frame.ts + this.lastTs : (stryCov_9fa48("107"), frame.ts - this.lastTs)) / 1000);
          if (stryMutAct_9fa48("111") ? dt > 0 : stryMutAct_9fa48("110") ? dt < 0 : stryMutAct_9fa48("109") ? false : stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108", "109", "110", "111"), dt <= 0)) dt = stryMutAct_9fa48("112") ? 1 * 60 : (stryCov_9fa48("112"), 1 / 60);

          // Raw velocity
          const rawVelX = stryMutAct_9fa48("113") ? (x - this.lastX) * dt : (stryCov_9fa48("113"), (stryMutAct_9fa48("114") ? x + this.lastX : (stryCov_9fa48("114"), x - this.lastX)) / dt);
          const rawVelY = stryMutAct_9fa48("115") ? (y - this.lastY) * dt : (stryCov_9fa48("115"), (stryMutAct_9fa48("116") ? y + this.lastY : (stryCov_9fa48("116"), y - this.lastY)) / dt);

          // Smooth velocity with exponential moving average
          const alpha = stryMutAct_9fa48("117") ? this.config.velocitySmoothing && 0.5 : (stryCov_9fa48("117"), this.config.velocitySmoothing ?? 0.5);
          this.velX = stryMutAct_9fa48("118") ? alpha * rawVelX - (1 - alpha) * this.velX : (stryCov_9fa48("118"), (stryMutAct_9fa48("119") ? alpha / rawVelX : (stryCov_9fa48("119"), alpha * rawVelX)) + (stryMutAct_9fa48("120") ? (1 - alpha) / this.velX : (stryCov_9fa48("120"), (stryMutAct_9fa48("121") ? 1 + alpha : (stryCov_9fa48("121"), 1 - alpha)) * this.velX)));
          this.velY = stryMutAct_9fa48("122") ? alpha * rawVelY - (1 - alpha) * this.velY : (stryCov_9fa48("122"), (stryMutAct_9fa48("123") ? alpha / rawVelY : (stryCov_9fa48("123"), alpha * rawVelY)) + (stryMutAct_9fa48("124") ? (1 - alpha) / this.velY : (stryCov_9fa48("124"), (stryMutAct_9fa48("125") ? 1 + alpha : (stryCov_9fa48("125"), 1 - alpha)) * this.velY)));

          // Calculate acceleration if enabled
          if (stryMutAct_9fa48("127") ? false : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127"), this.config.useAcceleration)) {
            if (stryMutAct_9fa48("128")) {
              {}
            } else {
              stryCov_9fa48("128");
              const rawAccelX = stryMutAct_9fa48("129") ? (this.velX - this.lastVelX) * dt : (stryCov_9fa48("129"), (stryMutAct_9fa48("130") ? this.velX + this.lastVelX : (stryCov_9fa48("130"), this.velX - this.lastVelX)) / dt);
              const rawAccelY = stryMutAct_9fa48("131") ? (this.velY - this.lastVelY) * dt : (stryCov_9fa48("131"), (stryMutAct_9fa48("132") ? this.velY + this.lastVelY : (stryCov_9fa48("132"), this.velY - this.lastVelY)) / dt);
              this.accelX = stryMutAct_9fa48("133") ? alpha * rawAccelX - (1 - alpha) * this.accelX : (stryCov_9fa48("133"), (stryMutAct_9fa48("134") ? alpha / rawAccelX : (stryCov_9fa48("134"), alpha * rawAccelX)) + (stryMutAct_9fa48("135") ? (1 - alpha) / this.accelX : (stryCov_9fa48("135"), (stryMutAct_9fa48("136") ? 1 + alpha : (stryCov_9fa48("136"), 1 - alpha)) * this.accelX)));
              this.accelY = stryMutAct_9fa48("137") ? alpha * rawAccelY - (1 - alpha) * this.accelY : (stryCov_9fa48("137"), (stryMutAct_9fa48("138") ? alpha / rawAccelY : (stryCov_9fa48("138"), alpha * rawAccelY)) + (stryMutAct_9fa48("139") ? (1 - alpha) / this.accelY : (stryCov_9fa48("139"), (stryMutAct_9fa48("140") ? 1 + alpha : (stryCov_9fa48("140"), 1 - alpha)) * this.accelY)));
            }
          }
          this.lastVelX = this.velX;
          this.lastVelY = this.velY;
        }
      }

      // Store current values for next frame
      this.lastX = x;
      this.lastY = y;
      this.lastTs = frame.ts;

      // Calculate prediction
      const lookAhead = stryMutAct_9fa48("141") ? this.config.predictionMs * 1000 : (stryCov_9fa48("141"), this.config.predictionMs / 1000);
      let predX = stryMutAct_9fa48("142") ? x - this.velX * lookAhead : (stryCov_9fa48("142"), x + (stryMutAct_9fa48("143") ? this.velX / lookAhead : (stryCov_9fa48("143"), this.velX * lookAhead)));
      let predY = stryMutAct_9fa48("144") ? y - this.velY * lookAhead : (stryCov_9fa48("144"), y + (stryMutAct_9fa48("145") ? this.velY / lookAhead : (stryCov_9fa48("145"), this.velY * lookAhead)));

      // Add acceleration term if physics enabled
      if (stryMutAct_9fa48("147") ? false : stryMutAct_9fa48("146") ? true : (stryCov_9fa48("146", "147"), this.config.usePhysics)) {
        if (stryMutAct_9fa48("148")) {
          {}
        } else {
          stryCov_9fa48("148");
          stryMutAct_9fa48("149") ? predX -= 0.5 * this.accelX * lookAhead * lookAhead : (stryCov_9fa48("149"), predX += stryMutAct_9fa48("150") ? 0.5 * this.accelX * lookAhead / lookAhead : (stryCov_9fa48("150"), (stryMutAct_9fa48("151") ? 0.5 * this.accelX / lookAhead : (stryCov_9fa48("151"), (stryMutAct_9fa48("152") ? 0.5 / this.accelX : (stryCov_9fa48("152"), 0.5 * this.accelX)) * lookAhead)) * lookAhead));
          stryMutAct_9fa48("153") ? predY -= 0.5 * this.accelY * lookAhead * lookAhead : (stryCov_9fa48("153"), predY += stryMutAct_9fa48("154") ? 0.5 * this.accelY * lookAhead / lookAhead : (stryCov_9fa48("154"), (stryMutAct_9fa48("155") ? 0.5 * this.accelY / lookAhead : (stryCov_9fa48("155"), (stryMutAct_9fa48("156") ? 0.5 / this.accelY : (stryCov_9fa48("156"), 0.5 * this.accelY)) * lookAhead)) * lookAhead));
        }
      }

      // Clamp prediction to [0,1]
      predX = stryMutAct_9fa48("157") ? Math.min(0, Math.min(1, predX)) : (stryCov_9fa48("157"), Math.max(0, stryMutAct_9fa48("158") ? Math.max(1, predX) : (stryCov_9fa48("158"), Math.min(1, predX))));
      predY = stryMutAct_9fa48("159") ? Math.min(0, Math.min(1, predY)) : (stryCov_9fa48("159"), Math.max(0, stryMutAct_9fa48("160") ? Math.max(1, predY) : (stryCov_9fa48("160"), Math.min(1, predY))));
      return SmoothedFrameSchema.parse(stryMutAct_9fa48("161") ? {} : (stryCov_9fa48("161"), {
        ts: frame.ts,
        handId: frame.handId,
        trackingOk: stryMutAct_9fa48("162") ? false : (stryCov_9fa48("162"), true),
        palmFacing: frame.palmFacing,
        label: frame.label,
        confidence: frame.confidence,
        position: stryMutAct_9fa48("163") ? {} : (stryCov_9fa48("163"), {
          x,
          y
        }),
        velocity: stryMutAct_9fa48("164") ? {} : (stryCov_9fa48("164"), {
          x: this.velX,
          y: this.velY
        }),
        prediction: stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
          x: predX,
          y: predY
        })
      }));
    }
  }
  reset(): void {
    if (stryMutAct_9fa48("166")) {
      {}
    } else {
      stryCov_9fa48("166");
      this.lastX = null;
      this.lastY = null;
      this.lastTs = null;
      this.velX = 0;
      this.velY = 0;
      this.lastVelX = 0;
      this.lastVelY = 0;
      this.accelX = 0;
      this.accelY = 0;
    }
  }
  setParams(params: Partial<PredictiveConfig>): void {
    if (stryMutAct_9fa48("167")) {
      {}
    } else {
      stryCov_9fa48("167");
      if (stryMutAct_9fa48("170") ? params.predictionMs === undefined : stryMutAct_9fa48("169") ? false : stryMutAct_9fa48("168") ? true : (stryCov_9fa48("168", "169", "170"), params.predictionMs !== undefined)) this.config.predictionMs = params.predictionMs;
      if (stryMutAct_9fa48("173") ? params.velocitySmoothing === undefined : stryMutAct_9fa48("172") ? false : stryMutAct_9fa48("171") ? true : (stryCov_9fa48("171", "172", "173"), params.velocitySmoothing !== undefined)) this.config.velocitySmoothing = params.velocitySmoothing;
      if (stryMutAct_9fa48("176") ? params.usePhysics === undefined : stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175", "176"), params.usePhysics !== undefined)) this.config.usePhysics = params.usePhysics;
    }
  }
}