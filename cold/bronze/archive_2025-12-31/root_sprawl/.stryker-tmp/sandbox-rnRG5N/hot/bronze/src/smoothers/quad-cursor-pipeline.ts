/**
 * Quad Cursor Pipeline - 4-Stage Output - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Outputs 4 cursor positions simultaneously per frame:
 *
 * 1. Raw: Unprocessed MediaPipe fingertip position
 * 2. Euro: 1€ Filter output (snappy/smooth adaptive)
 * 3. Spring: Spring-damper smoothed (natural inertia)
 * 4. Predictive: Motion-predicted position (reduced latency)
 *
 * This allows:
 * - Visual comparison of different smoothing strategies
 * - Runtime selection of preferred cursor
 * - A/B testing for user preference studies
 * - Debugging pipeline behavior
 *
 * Each stage can be independently enabled/disabled via null.
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
import { PassthroughSmootherAdapter } from '../adapters/one-euro.adapter.js';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';
export interface QuadCursorOutput {
  /** Raw MediaPipe position (no smoothing) */
  raw: {
    x: number;
    y: number;
  } | null;
  /** 1€ Filter smoothed position */
  euro: {
    x: number;
    y: number;
  } | null;
  /** Spring-damper physics position */
  spring: {
    x: number;
    y: number;
  } | null;
  /** Motion-predicted position */
  predictive: {
    x: number;
    y: number;
  } | null;
  /** Timestamp of this quad output */
  ts: number;
}
export interface QuadCursorConfig {
  /** 1€ smoother (null to disable) */
  euro: SmootherPort | null;
  /** Spring-damper smoother (null to disable) */
  spring: SmootherPort | null;
  /** Predictive smoother (null to disable) */
  predictive: SmootherPort | null;
}

/**
 * QuadCursorPipeline - 4-Stage Cursor Output
 *
 * Runs frame through all 4 smoothers simultaneously.
 */
export class QuadCursorPipeline {
  private passthrough: PassthroughSmootherAdapter;
  private euro: SmootherPort | null;
  private spring: SmootherPort | null;
  private predictive: SmootherPort | null;
  constructor(config: QuadCursorConfig) {
    if (stryMutAct_9fa48("177")) {
      {}
    } else {
      stryCov_9fa48("177");
      this.passthrough = new PassthroughSmootherAdapter();
      this.euro = config.euro;
      this.spring = config.spring;
      this.predictive = config.predictive;
    }
  }

  /** Process a frame and return all 4 cursor positions */
  process(frame: SensorFrame): QuadCursorOutput {
    if (stryMutAct_9fa48("178")) {
      {}
    } else {
      stryCov_9fa48("178");
      // Raw is always available via passthrough
      const rawFrame = this.passthrough.smooth(frame);
      const raw = rawFrame.position ? stryMutAct_9fa48("179") ? {} : (stryCov_9fa48("179"), {
        x: rawFrame.position.x,
        y: rawFrame.position.y
      }) : null;

      // Euro (1€ filter)
      let euro: {
        x: number;
        y: number;
      } | null = null;
      if (stryMutAct_9fa48("181") ? false : stryMutAct_9fa48("180") ? true : (stryCov_9fa48("180", "181"), this.euro)) {
        if (stryMutAct_9fa48("182")) {
          {}
        } else {
          stryCov_9fa48("182");
          const euroFrame = this.euro.smooth(frame);
          euro = euroFrame.position ? stryMutAct_9fa48("183") ? {} : (stryCov_9fa48("183"), {
            x: euroFrame.position.x,
            y: euroFrame.position.y
          }) : null;
        }
      }

      // Spring-damper
      let spring: {
        x: number;
        y: number;
      } | null = null;
      if (stryMutAct_9fa48("185") ? false : stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184", "185"), this.spring)) {
        if (stryMutAct_9fa48("186")) {
          {}
        } else {
          stryCov_9fa48("186");
          const springFrame = this.spring.smooth(frame);
          spring = springFrame.position ? stryMutAct_9fa48("187") ? {} : (stryCov_9fa48("187"), {
            x: springFrame.position.x,
            y: springFrame.position.y
          }) : null;
        }
      }

      // Predictive
      let predictive: {
        x: number;
        y: number;
      } | null = null;
      if (stryMutAct_9fa48("189") ? false : stryMutAct_9fa48("188") ? true : (stryCov_9fa48("188", "189"), this.predictive)) {
        if (stryMutAct_9fa48("190")) {
          {}
        } else {
          stryCov_9fa48("190");
          const predFrame = this.predictive.smooth(frame);
          predictive = predFrame.prediction ? stryMutAct_9fa48("191") ? {} : (stryCov_9fa48("191"), {
            x: predFrame.prediction.x,
            y: predFrame.prediction.y
          }) : null;
        }
      }
      return stryMutAct_9fa48("192") ? {} : (stryCov_9fa48("192"), {
        raw,
        euro,
        spring,
        predictive,
        ts: frame.ts
      });
    }
  }

  /** Reset all smoothers */
  reset(): void {
    if (stryMutAct_9fa48("193")) {
      {}
    } else {
      stryCov_9fa48("193");
      this.passthrough.reset();
      stryMutAct_9fa48("194") ? this.euro.reset() : (stryCov_9fa48("194"), this.euro?.reset());
      stryMutAct_9fa48("195") ? this.spring.reset() : (stryCov_9fa48("195"), this.spring?.reset());
      stryMutAct_9fa48("196") ? this.predictive.reset() : (stryCov_9fa48("196"), this.predictive?.reset());
    }
  }
}