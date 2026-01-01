/**
 * Smoother Chain - Composable Pipeline - IMPLEMENTED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Implements the Chain of Responsibility pattern for smoothers.
 * Allows composing multiple smoothers in sequence:
 *
 * Raw → 1€ Filter → Spring-Damper → Predictive → Output
 *
 * Each smoother in the chain processes the output of the previous one,
 * enabling flexible pipeline configurations.
 *
 * HEXAGONAL CDD: SmootherChain itself implements SmootherPort,
 * making the composition transparent to consumers.
 *
 * TRL 9: Chain of Responsibility is a Gang of Four design pattern
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

/**
 * SmootherChain - Composable Smoother Pipeline
 *
 * Chain of smoothers that process frames in sequence.
 */
export class SmootherChain implements SmootherPort {
  private smoothers: SmootherPort[];
  constructor(smoothers: SmootherPort[]) {
    if (stryMutAct_9fa48("197")) {
      {}
    } else {
      stryCov_9fa48("197");
      this.smoothers = [...smoothers];
    }
  }
  smooth(frame: SensorFrame): SmoothedFrame {
    if (stryMutAct_9fa48("199")) {
      {}
    } else {
      stryCov_9fa48("199");
      if (stryMutAct_9fa48("202") ? this.smoothers.length !== 0 : stryMutAct_9fa48("201") ? false : stryMutAct_9fa48("200") ? true : (stryCov_9fa48("200", "201", "202"), this.smoothers.length === 0)) {
        if (stryMutAct_9fa48("203")) {
          {}
        } else {
          stryCov_9fa48("203");
          // Empty chain - return pass-through
          return SmoothedFrameSchema.parse(stryMutAct_9fa48("204") ? {} : (stryCov_9fa48("204"), {
            ts: frame.ts,
            handId: frame.handId,
            trackingOk: frame.trackingOk,
            palmFacing: frame.palmFacing,
            label: frame.label,
            confidence: frame.confidence,
            position: frame.indexTip ? stryMutAct_9fa48("205") ? {} : (stryCov_9fa48("205"), {
              x: frame.indexTip.x,
              y: frame.indexTip.y
            }) : null,
            velocity: null,
            prediction: null
          }));
        }
      }

      // Run first smoother with sensor frame
      let result = this.smoothers[0].smooth(frame);

      // Chain through remaining smoothers
      // Each smoother receives the previous output converted to SensorFrame
      for (let i = 1; stryMutAct_9fa48("208") ? i >= this.smoothers.length : stryMutAct_9fa48("207") ? i <= this.smoothers.length : stryMutAct_9fa48("206") ? false : (stryCov_9fa48("206", "207", "208"), i < this.smoothers.length); stryMutAct_9fa48("209") ? i-- : (stryCov_9fa48("209"), i++)) {
        if (stryMutAct_9fa48("210")) {
          {}
        } else {
          stryCov_9fa48("210");
          // Convert SmoothedFrame back to SensorFrame for chaining
          const chainFrame: SensorFrame = stryMutAct_9fa48("211") ? {} : (stryCov_9fa48("211"), {
            ts: result.ts,
            handId: result.handId,
            trackingOk: result.trackingOk,
            palmFacing: result.palmFacing,
            label: result.label,
            confidence: result.confidence,
            indexTip: result.position ? stryMutAct_9fa48("212") ? {} : (stryCov_9fa48("212"), {
              x: result.position.x,
              y: result.position.y,
              z: 0,
              visibility: 1
            }) : undefined
          });
          result = this.smoothers[i].smooth(chainFrame);
        }
      }
      return result;
    }
  }
  reset(): void {
    if (stryMutAct_9fa48("213")) {
      {}
    } else {
      stryCov_9fa48("213");
      for (const smoother of this.smoothers) {
        if (stryMutAct_9fa48("214")) {
          {}
        } else {
          stryCov_9fa48("214");
          smoother.reset();
        }
      }
    }
  }
  setParams(_params: Record<string, unknown>): void {
    // Chain doesn't have its own params - this is a no-op
    // Individual smoothers can be accessed via getSmoothers()
  }

  /** Add a smoother to the end of the chain */
  addSmoother(smoother: SmootherPort): void {
    if (stryMutAct_9fa48("215")) {
      {}
    } else {
      stryCov_9fa48("215");
      this.smoothers.push(smoother);
    }
  }

  /** Remove a smoother from the chain by index */
  removeSmoother(index: number): void {
    if (stryMutAct_9fa48("216")) {
      {}
    } else {
      stryCov_9fa48("216");
      if (stryMutAct_9fa48("219") ? index >= 0 || index < this.smoothers.length : stryMutAct_9fa48("218") ? false : stryMutAct_9fa48("217") ? true : (stryCov_9fa48("217", "218", "219"), (stryMutAct_9fa48("222") ? index < 0 : stryMutAct_9fa48("221") ? index > 0 : stryMutAct_9fa48("220") ? true : (stryCov_9fa48("220", "221", "222"), index >= 0)) && (stryMutAct_9fa48("225") ? index >= this.smoothers.length : stryMutAct_9fa48("224") ? index <= this.smoothers.length : stryMutAct_9fa48("223") ? true : (stryCov_9fa48("223", "224", "225"), index < this.smoothers.length)))) {
        if (stryMutAct_9fa48("226")) {
          {}
        } else {
          stryCov_9fa48("226");
          this.smoothers.splice(index, 1);
        }
      }
    }
  }

  /** Replace a smoother at a specific index */
  replaceSmoother(index: number, smoother: SmootherPort): void {
    if (stryMutAct_9fa48("227")) {
      {}
    } else {
      stryCov_9fa48("227");
      if (stryMutAct_9fa48("230") ? index >= 0 || index < this.smoothers.length : stryMutAct_9fa48("229") ? false : stryMutAct_9fa48("228") ? true : (stryCov_9fa48("228", "229", "230"), (stryMutAct_9fa48("233") ? index < 0 : stryMutAct_9fa48("232") ? index > 0 : stryMutAct_9fa48("231") ? true : (stryCov_9fa48("231", "232", "233"), index >= 0)) && (stryMutAct_9fa48("236") ? index >= this.smoothers.length : stryMutAct_9fa48("235") ? index <= this.smoothers.length : stryMutAct_9fa48("234") ? true : (stryCov_9fa48("234", "235", "236"), index < this.smoothers.length)))) {
        if (stryMutAct_9fa48("237")) {
          {}
        } else {
          stryCov_9fa48("237");
          this.smoothers[index] = smoother;
        }
      }
    }
  }

  /** Get the current chain length */
  getLength(): number {
    if (stryMutAct_9fa48("238")) {
      {}
    } else {
      stryCov_9fa48("238");
      return this.smoothers.length;
    }
  }

  /** Get all smoothers in the chain */
  getSmoothers(): SmootherPort[] {
    if (stryMutAct_9fa48("239")) {
      {}
    } else {
      stryCov_9fa48("239");
      return [...this.smoothers];
    }
  }

  /** Replace all smoothers in the chain (runtime swap) */
  setSmoothers(smoothers: SmootherPort[]): void {
    if (stryMutAct_9fa48("241")) {
      {}
    } else {
      stryCov_9fa48("241");
      // Reset all new smoothers to ensure clean state
      // This prevents NaN from stale timestamps when reusing smoothers
      for (const smoother of smoothers) {
        if (stryMutAct_9fa48("242")) {
          {}
        } else {
          stryCov_9fa48("242");
          smoother.reset();
        }
      }
      this.smoothers = [...smoothers];
    }
  }
}