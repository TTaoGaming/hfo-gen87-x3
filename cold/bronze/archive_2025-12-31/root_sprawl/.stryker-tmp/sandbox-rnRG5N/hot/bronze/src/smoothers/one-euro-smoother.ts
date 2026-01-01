/**
 * 1€ Filter Smoother - WIRED (TDD GREEN Phase)
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * Reference: Géry Casiez, Nicolas Roussel, Daniel Vogel.
 * "1€ Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems"
 * CHI 2012 - https://dl.acm.org/doi/10.1145/2207676.2208639
 *
 * The 1€ filter is an adaptive low-pass filter that adjusts its cutoff frequency
 * based on the speed of the input signal. This provides:
 * - Low cutoff (smooth) when stationary or slow-moving
 * - High cutoff (snappy) when fast-moving
 *
 * TRL 9: Peer-reviewed, widely deployed in production (MediaPipe, Unity, etc.)
 *
 * VALIDATE: Re-exports the working adapter from one-euro.adapter.ts
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
import { OneEuroAdapter, PassthroughSmootherAdapter } from '../adapters/one-euro.adapter.js';

// Re-export config type for consumers
export interface OneEuroConfig {
  /** Minimum cutoff frequency (Hz) - lower = smoother when slow */
  mincutoff: number;
  /** Speed coefficient - higher = snappier response to fast movement */
  beta: number;
  /** Derivative cutoff frequency (Hz) - smooths velocity estimate */
  dcutoff?: number;
}

/**
 * OneEuroSmoother - 1€ Filter Implementation
 *
 * WIRED: Wraps OneEuroAdapter with config-based construction
 */
export class OneEuroSmoother extends OneEuroAdapter {
  constructor(config: OneEuroConfig) {
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      super(config.mincutoff, config.beta, stryMutAct_9fa48("1") ? config.dcutoff && 1.0 : (stryCov_9fa48("1"), config.dcutoff ?? 1.0));
    }
  }
}

// Re-export for consumers
export { OneEuroAdapter, PassthroughSmootherAdapter };