/**
 * Physics Spring-Damper Smoother - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Rapier Physics Engine - Spring-Damper Model
 * https://rapier.rs/docs/user_guides/javascript/rigid_body_simulation
 *
 * Uses a critically damped spring system to create smooth cursor movement:
 * - Spring constant (k): Stiffness - higher = snappier
 * - Damping coefficient (c): Energy dissipation - higher = less oscillation
 * - Mass (m): Inertia - higher = more sluggish
 *
 * For critical damping: c = 2 * sqrt(k * m)
 *
 * TRL 9: Industry-standard physics model used in games, UI, robotics
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
export interface SpringDamperConfig {
  /** Spring constant (stiffness) - higher = snappier */
  stiffness: number;
  /** Damping coefficient - higher = less oscillation */
  damping: number;
  /** Mass - higher = more sluggish */
  mass: number;
}

/**
 * PhysicsSpringDamperSmoother - Spring-Damper Physics
 *
 * Simulates a critically damped spring pulling cursor toward target.
 * Natural feel with momentum and deceleration.
 */
export class PhysicsSpringDamperSmoother implements SmootherPort {
  private stiffness: number;
  private damping: number;
  private mass: number;
  private posX = 0;
  private posY = 0;
  private velX = 0;
  private velY = 0;
  private lastTs: number | null = null;
  private initialized = stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2"), false);
  constructor(config: SpringDamperConfig) {
    if (stryMutAct_9fa48("3")) {
      {}
    } else {
      stryCov_9fa48("3");
      this.stiffness = config.stiffness;
      this.damping = config.damping;
      this.mass = config.mass;
    }
  }
  smooth(frame: SensorFrame): SmoothedFrame {
    if (stryMutAct_9fa48("4")) {
      {}
    } else {
      stryCov_9fa48("4");
      // If no valid tracking, pass through with null position
      if (stryMutAct_9fa48("7") ? !frame.trackingOk && !frame.indexTip : stryMutAct_9fa48("6") ? false : stryMutAct_9fa48("5") ? true : (stryCov_9fa48("5", "6", "7"), (stryMutAct_9fa48("8") ? frame.trackingOk : (stryCov_9fa48("8"), !frame.trackingOk)) || (stryMutAct_9fa48("9") ? frame.indexTip : (stryCov_9fa48("9"), !frame.indexTip)))) {
        if (stryMutAct_9fa48("10")) {
          {}
        } else {
          stryCov_9fa48("10");
          this.reset();
          return SmoothedFrameSchema.parse(stryMutAct_9fa48("11") ? {} : (stryCov_9fa48("11"), {
            ts: frame.ts,
            handId: frame.handId,
            trackingOk: stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12"), false),
            palmFacing: frame.palmFacing,
            label: frame.label,
            confidence: frame.confidence,
            position: null,
            velocity: null,
            prediction: null
          }));
        }
      }
      const targetX = frame.indexTip.x;
      const targetY = frame.indexTip.y;

      // Initialize on first frame
      if (stryMutAct_9fa48("15") ? false : stryMutAct_9fa48("14") ? true : stryMutAct_9fa48("13") ? this.initialized : (stryCov_9fa48("13", "14", "15"), !this.initialized)) {
        if (stryMutAct_9fa48("16")) {
          {}
        } else {
          stryCov_9fa48("16");
          this.posX = targetX;
          this.posY = targetY;
          this.velX = 0;
          this.velY = 0;
          this.lastTs = frame.ts;
          this.initialized = stryMutAct_9fa48("17") ? false : (stryCov_9fa48("17"), true);
        }
      }

      // Calculate time delta
      let dt = (stryMutAct_9fa48("20") ? this.lastTs === null : stryMutAct_9fa48("19") ? false : stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18", "19", "20"), this.lastTs !== null)) ? stryMutAct_9fa48("21") ? (frame.ts - this.lastTs) * 1000 : (stryCov_9fa48("21"), (stryMutAct_9fa48("22") ? frame.ts + this.lastTs : (stryCov_9fa48("22"), frame.ts - this.lastTs)) / 1000) : stryMutAct_9fa48("23") ? 1 * 60 : (stryCov_9fa48("23"), 1 / 60);
      if (stryMutAct_9fa48("27") ? dt > 0 : stryMutAct_9fa48("26") ? dt < 0 : stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25", "26", "27"), dt <= 0)) dt = stryMutAct_9fa48("28") ? 1 * 60 : (stryCov_9fa48("28"), 1 / 60);
      this.lastTs = frame.ts;

      // Spring-damper physics: F = -k*x - c*v
      // a = F/m
      // v += a * dt
      // x += v * dt

      // X axis
      const forceX = stryMutAct_9fa48("29") ? -this.stiffness * (this.posX - targetX) + this.damping * this.velX : (stryCov_9fa48("29"), (stryMutAct_9fa48("30") ? -this.stiffness / (this.posX - targetX) : (stryCov_9fa48("30"), (stryMutAct_9fa48("31") ? +this.stiffness : (stryCov_9fa48("31"), -this.stiffness)) * (stryMutAct_9fa48("32") ? this.posX + targetX : (stryCov_9fa48("32"), this.posX - targetX)))) - (stryMutAct_9fa48("33") ? this.damping / this.velX : (stryCov_9fa48("33"), this.damping * this.velX)));
      const accelX = stryMutAct_9fa48("34") ? forceX * this.mass : (stryCov_9fa48("34"), forceX / this.mass);
      stryMutAct_9fa48("35") ? this.velX -= accelX * dt : (stryCov_9fa48("35"), this.velX += stryMutAct_9fa48("36") ? accelX / dt : (stryCov_9fa48("36"), accelX * dt));
      stryMutAct_9fa48("37") ? this.posX -= this.velX * dt : (stryCov_9fa48("37"), this.posX += stryMutAct_9fa48("38") ? this.velX / dt : (stryCov_9fa48("38"), this.velX * dt));

      // Y axis
      const forceY = stryMutAct_9fa48("39") ? -this.stiffness * (this.posY - targetY) + this.damping * this.velY : (stryCov_9fa48("39"), (stryMutAct_9fa48("40") ? -this.stiffness / (this.posY - targetY) : (stryCov_9fa48("40"), (stryMutAct_9fa48("41") ? +this.stiffness : (stryCov_9fa48("41"), -this.stiffness)) * (stryMutAct_9fa48("42") ? this.posY + targetY : (stryCov_9fa48("42"), this.posY - targetY)))) - (stryMutAct_9fa48("43") ? this.damping / this.velY : (stryCov_9fa48("43"), this.damping * this.velY)));
      const accelY = stryMutAct_9fa48("44") ? forceY * this.mass : (stryCov_9fa48("44"), forceY / this.mass);
      stryMutAct_9fa48("45") ? this.velY -= accelY * dt : (stryCov_9fa48("45"), this.velY += stryMutAct_9fa48("46") ? accelY / dt : (stryCov_9fa48("46"), accelY * dt));
      stryMutAct_9fa48("47") ? this.posY -= this.velY * dt : (stryCov_9fa48("47"), this.posY += stryMutAct_9fa48("48") ? this.velY / dt : (stryCov_9fa48("48"), this.velY * dt));

      // Clamp to [0,1] range
      this.posX = stryMutAct_9fa48("49") ? Math.min(0, Math.min(1, this.posX)) : (stryCov_9fa48("49"), Math.max(0, stryMutAct_9fa48("50") ? Math.max(1, this.posX) : (stryCov_9fa48("50"), Math.min(1, this.posX))));
      this.posY = stryMutAct_9fa48("51") ? Math.min(0, Math.min(1, this.posY)) : (stryCov_9fa48("51"), Math.max(0, stryMutAct_9fa48("52") ? Math.max(1, this.posY) : (stryCov_9fa48("52"), Math.min(1, this.posY))));

      // Predict one frame ahead
      const predX = stryMutAct_9fa48("53") ? Math.min(0, Math.min(1, this.posX + this.velX * (1 / 60))) : (stryCov_9fa48("53"), Math.max(0, stryMutAct_9fa48("54") ? Math.max(1, this.posX + this.velX * (1 / 60)) : (stryCov_9fa48("54"), Math.min(1, stryMutAct_9fa48("55") ? this.posX - this.velX * (1 / 60) : (stryCov_9fa48("55"), this.posX + (stryMutAct_9fa48("56") ? this.velX / (1 / 60) : (stryCov_9fa48("56"), this.velX * (stryMutAct_9fa48("57") ? 1 * 60 : (stryCov_9fa48("57"), 1 / 60)))))))));
      const predY = stryMutAct_9fa48("58") ? Math.min(0, Math.min(1, this.posY + this.velY * (1 / 60))) : (stryCov_9fa48("58"), Math.max(0, stryMutAct_9fa48("59") ? Math.max(1, this.posY + this.velY * (1 / 60)) : (stryCov_9fa48("59"), Math.min(1, stryMutAct_9fa48("60") ? this.posY - this.velY * (1 / 60) : (stryCov_9fa48("60"), this.posY + (stryMutAct_9fa48("61") ? this.velY / (1 / 60) : (stryCov_9fa48("61"), this.velY * (stryMutAct_9fa48("62") ? 1 * 60 : (stryCov_9fa48("62"), 1 / 60)))))))));
      return SmoothedFrameSchema.parse(stryMutAct_9fa48("63") ? {} : (stryCov_9fa48("63"), {
        ts: frame.ts,
        handId: frame.handId,
        trackingOk: stryMutAct_9fa48("64") ? false : (stryCov_9fa48("64"), true),
        palmFacing: frame.palmFacing,
        label: frame.label,
        confidence: frame.confidence,
        position: stryMutAct_9fa48("65") ? {} : (stryCov_9fa48("65"), {
          x: this.posX,
          y: this.posY
        }),
        velocity: stryMutAct_9fa48("66") ? {} : (stryCov_9fa48("66"), {
          x: this.velX,
          y: this.velY
        }),
        prediction: stryMutAct_9fa48("67") ? {} : (stryCov_9fa48("67"), {
          x: predX,
          y: predY
        })
      }));
    }
  }
  reset(): void {
    if (stryMutAct_9fa48("68")) {
      {}
    } else {
      stryCov_9fa48("68");
      this.posX = 0;
      this.posY = 0;
      this.velX = 0;
      this.velY = 0;
      this.lastTs = null;
      this.initialized = stryMutAct_9fa48("69") ? true : (stryCov_9fa48("69"), false);
    }
  }
  setParams(params: Partial<SpringDamperConfig>): void {
    if (stryMutAct_9fa48("70")) {
      {}
    } else {
      stryCov_9fa48("70");
      if (stryMutAct_9fa48("73") ? params.stiffness === undefined : stryMutAct_9fa48("72") ? false : stryMutAct_9fa48("71") ? true : (stryCov_9fa48("71", "72", "73"), params.stiffness !== undefined)) this.stiffness = params.stiffness;
      if (stryMutAct_9fa48("76") ? params.damping === undefined : stryMutAct_9fa48("75") ? false : stryMutAct_9fa48("74") ? true : (stryCov_9fa48("74", "75", "76"), params.damping !== undefined)) this.damping = params.damping;
      if (stryMutAct_9fa48("79") ? params.mass === undefined : stryMutAct_9fa48("78") ? false : stryMutAct_9fa48("77") ? true : (stryCov_9fa48("77", "78", "79"), params.mass !== undefined)) this.mass = params.mass;
    }
  }
}