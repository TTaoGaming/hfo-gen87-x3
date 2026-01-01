/**
 * HIVE/8 Phase Validator
 *
 * ENFORCES sequential phase transitions: H → I → V → E → H(N+1)
 * This is a HARD GATE - out-of-sequence signals are BLOCKED.
 *
 * TRL Lineage: Custom enforcement for HIVE/8 workflow
 * Source: Gen87.X3 AGENTS.md, GEN85.1_ENRICHED_GOLD_BATON_QUINE.md
 *
 * Phase Rules:
 * - H (Hunt): Research only. NO file creation, NO code.
 * - I (Interlock): TDD RED - Write failing tests, define contracts.
 * - V (Validate): TDD GREEN - Make tests pass, implement.
 * - E (Evolve): TDD REFACTOR - Clean up, commit, prepare next cycle.
 * - X (Handoff): Can occur at phase boundaries only.
 *
 * @module enforcement/hive-validator
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
import { z } from 'zod';

// =============================================================================
// SCHEMAS
// =============================================================================

export const HIVEPhaseSchema = z.enum(stryMutAct_9fa48("0") ? [] : (stryCov_9fa48("0"), [stryMutAct_9fa48("1") ? "" : (stryCov_9fa48("1"), 'H'), stryMutAct_9fa48("2") ? "" : (stryCov_9fa48("2"), 'I'), stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), 'V'), stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'E'), stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), 'X')]));
export type HIVEPhase = z.infer<typeof HIVEPhaseSchema>;
export const SignalSchema = z.object(stryMutAct_9fa48("6") ? {} : (stryCov_9fa48("6"), {
  ts: z.string().datetime(),
  mark: stryMutAct_9fa48("8") ? z.number().max(0).max(1) : stryMutAct_9fa48("7") ? z.number().min(0).min(1) : (stryCov_9fa48("7", "8"), z.number().min(0).max(1)),
  pull: z.enum(stryMutAct_9fa48("9") ? [] : (stryCov_9fa48("9"), [stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), 'upstream'), stryMutAct_9fa48("11") ? "" : (stryCov_9fa48("11"), 'downstream'), stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), 'lateral')])),
  msg: stryMutAct_9fa48("13") ? z.string().max(1) : (stryCov_9fa48("13"), z.string().min(1)),
  type: z.enum(stryMutAct_9fa48("14") ? [] : (stryCov_9fa48("14"), [stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), 'signal'), stryMutAct_9fa48("16") ? "" : (stryCov_9fa48("16"), 'event'), stryMutAct_9fa48("17") ? "" : (stryCov_9fa48("17"), 'error'), stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), 'metric'), stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), 'handoff')])),
  hive: HIVEPhaseSchema,
  gen: stryMutAct_9fa48("20") ? z.number().int().max(1) : (stryCov_9fa48("20"), z.number().int().min(1)),
  port: stryMutAct_9fa48("22") ? z.number().int().max(0).max(7) : stryMutAct_9fa48("21") ? z.number().int().min(0).min(7) : (stryCov_9fa48("21", "22"), z.number().int().min(0).max(7))
}));
export type Signal = z.infer<typeof SignalSchema>;
export const TransitionResultSchema = z.object(stryMutAct_9fa48("23") ? {} : (stryCov_9fa48("23"), {
  valid: z.boolean(),
  from: HIVEPhaseSchema,
  to: HIVEPhaseSchema,
  reason: z.string().optional(),
  violation: z.enum(stryMutAct_9fa48("24") ? [] : (stryCov_9fa48("24"), [stryMutAct_9fa48("25") ? "" : (stryCov_9fa48("25"), 'SKIPPED_HUNT'), stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'SKIPPED_INTERLOCK'), stryMutAct_9fa48("27") ? "" : (stryCov_9fa48("27"), 'SKIPPED_VALIDATE'), stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'REWARD_HACK'), stryMutAct_9fa48("29") ? "" : (stryCov_9fa48("29"), 'INVALID_HANDOFF'), stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), 'UNKNOWN_PHASE')])).optional()
}));
export type TransitionResult = z.infer<typeof TransitionResultSchema>;

// =============================================================================
// ALLOWED TRANSITIONS
// =============================================================================

/**
 * HIVE Phase Transition Matrix
 *
 * Key insight: Phases can repeat (H→H, I→I, etc.) but cannot skip.
 * X (Handoff) is allowed only at phase boundaries.
 */
export const ALLOWED_TRANSITIONS: Record<HIVEPhase, HIVEPhase[]> = stryMutAct_9fa48("31") ? {} : (stryCov_9fa48("31"), {
  H: stryMutAct_9fa48("32") ? [] : (stryCov_9fa48("32"), [stryMutAct_9fa48("33") ? "" : (stryCov_9fa48("33"), 'H'), stryMutAct_9fa48("34") ? "" : (stryCov_9fa48("34"), 'I'), stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'X')]),
  // Hunt can continue or move to Interlock
  I: stryMutAct_9fa48("36") ? [] : (stryCov_9fa48("36"), [stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), 'I'), stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), 'V'), stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'X')]),
  // Interlock can continue or move to Validate
  V: stryMutAct_9fa48("40") ? [] : (stryCov_9fa48("40"), [stryMutAct_9fa48("41") ? "" : (stryCov_9fa48("41"), 'V'), stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), 'E'), stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), 'X')]),
  // Validate can continue or move to Evolve
  E: stryMutAct_9fa48("44") ? [] : (stryCov_9fa48("44"), [stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), 'E'), stryMutAct_9fa48("46") ? "" : (stryCov_9fa48("46"), 'H'), stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), 'X')]),
  // Evolve can continue or STRANGE LOOP back to Hunt
  X: stryMutAct_9fa48("48") ? [] : (stryCov_9fa48("48"), [stryMutAct_9fa48("49") ? "" : (stryCov_9fa48("49"), 'H'), stryMutAct_9fa48("50") ? "" : (stryCov_9fa48("50"), 'I'), stryMutAct_9fa48("51") ? "" : (stryCov_9fa48("51"), 'V'), stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), 'E')]) // Handoff can transition to any phase (boundary marker)
});

/**
 * Violation messages for clarity
 */
export const VIOLATION_MESSAGES: Record<string, string> = stryMutAct_9fa48("53") ? {} : (stryCov_9fa48("53"), {
  SKIPPED_HUNT: stryMutAct_9fa48("54") ? "" : (stryCov_9fa48("54"), 'Cannot start HIVE cycle without Hunt phase. Search first!'),
  SKIPPED_INTERLOCK: stryMutAct_9fa48("55") ? "" : (stryCov_9fa48("55"), 'Cannot jump to Validate without Interlock. Write failing tests first!'),
  SKIPPED_VALIDATE: stryMutAct_9fa48("56") ? "" : (stryCov_9fa48("56"), 'Cannot jump to Evolve without Validate. Make tests pass first!'),
  REWARD_HACK: stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), 'REWARD HACK DETECTED: Going GREEN without prior RED is forbidden!'),
  INVALID_HANDOFF: stryMutAct_9fa48("58") ? "" : (stryCov_9fa48("58"), 'Handoff (X) must occur at phase boundaries, not mid-phase.'),
  UNKNOWN_PHASE: stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), 'Unknown HIVE phase encountered.')
});

// =============================================================================
// VALIDATOR CLASS
// =============================================================================

export class HIVEValidator {
  private signalHistory: Signal[] = stryMutAct_9fa48("60") ? ["Stryker was here"] : (stryCov_9fa48("60"), []);
  private maxHistorySize: number;
  constructor(maxHistorySize = 100) {
    if (stryMutAct_9fa48("61")) {
      {}
    } else {
      stryCov_9fa48("61");
      this.maxHistorySize = maxHistorySize;
    }
  }

  /**
   * Get the current HIVE phase from the last non-handoff signal
   */
  getCurrentPhase(): HIVEPhase | null {
    if (stryMutAct_9fa48("62")) {
      {}
    } else {
      stryCov_9fa48("62");
      for (let i = stryMutAct_9fa48("63") ? this.signalHistory.length + 1 : (stryCov_9fa48("63"), this.signalHistory.length - 1); stryMutAct_9fa48("66") ? i < 0 : stryMutAct_9fa48("65") ? i > 0 : stryMutAct_9fa48("64") ? false : (stryCov_9fa48("64", "65", "66"), i >= 0); stryMutAct_9fa48("67") ? i++ : (stryCov_9fa48("67"), i--)) {
        if (stryMutAct_9fa48("68")) {
          {}
        } else {
          stryCov_9fa48("68");
          const signal = this.signalHistory[i];
          if (stryMutAct_9fa48("71") ? signal.hive === 'X' : stryMutAct_9fa48("70") ? false : stryMutAct_9fa48("69") ? true : (stryCov_9fa48("69", "70", "71"), signal.hive !== (stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), 'X')))) {
            if (stryMutAct_9fa48("73")) {
              {}
            } else {
              stryCov_9fa48("73");
              return signal.hive;
            }
          }
        }
      }
      return null; // No signals yet, start is allowed
    }
  }

  /**
   * Validate a phase transition
   */
  validateTransition(from: HIVEPhase | null, to: HIVEPhase): TransitionResult {
    if (stryMutAct_9fa48("74")) {
      {}
    } else {
      stryCov_9fa48("74");
      // First signal can be H only (start with Hunt)
      if (stryMutAct_9fa48("77") ? from !== null : stryMutAct_9fa48("76") ? false : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76", "77"), from === null)) {
        if (stryMutAct_9fa48("78")) {
          {}
        } else {
          stryCov_9fa48("78");
          if (stryMutAct_9fa48("81") ? to !== 'H' : stryMutAct_9fa48("80") ? false : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80", "81"), to === (stryMutAct_9fa48("82") ? "" : (stryCov_9fa48("82"), 'H')))) {
            if (stryMutAct_9fa48("83")) {
              {}
            } else {
              stryCov_9fa48("83");
              return stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
                valid: stryMutAct_9fa48("85") ? false : (stryCov_9fa48("85"), true),
                from: stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), 'H'),
                to,
                reason: stryMutAct_9fa48("87") ? "" : (stryCov_9fa48("87"), 'Starting HIVE cycle with Hunt')
              });
            }
          }
          return stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
            valid: stryMutAct_9fa48("89") ? true : (stryCov_9fa48("89"), false),
            from: stryMutAct_9fa48("90") ? "" : (stryCov_9fa48("90"), 'H'),
            to,
            reason: VIOLATION_MESSAGES.SKIPPED_HUNT,
            violation: stryMutAct_9fa48("91") ? "" : (stryCov_9fa48("91"), 'SKIPPED_HUNT')
          });
        }
      }

      // Check if transition is allowed
      const allowed = ALLOWED_TRANSITIONS[from];
      if (stryMutAct_9fa48("93") ? false : stryMutAct_9fa48("92") ? true : (stryCov_9fa48("92", "93"), allowed.includes(to))) {
        if (stryMutAct_9fa48("94")) {
          {}
        } else {
          stryCov_9fa48("94");
          return stryMutAct_9fa48("95") ? {} : (stryCov_9fa48("95"), {
            valid: stryMutAct_9fa48("96") ? false : (stryCov_9fa48("96"), true),
            from,
            to,
            reason: stryMutAct_9fa48("97") ? `` : (stryCov_9fa48("97"), `Valid transition: ${from} → ${to}`)
          });
        }
      }

      // Determine specific violation
      let violation: TransitionResult['violation'] = stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), 'UNKNOWN_PHASE');
      if (stryMutAct_9fa48("101") ? from === 'H' || to === 'V' : stryMutAct_9fa48("100") ? false : stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99", "100", "101"), (stryMutAct_9fa48("103") ? from !== 'H' : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103"), from === (stryMutAct_9fa48("104") ? "" : (stryCov_9fa48("104"), 'H')))) && (stryMutAct_9fa48("106") ? to !== 'V' : stryMutAct_9fa48("105") ? true : (stryCov_9fa48("105", "106"), to === (stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), 'V')))))) {
        if (stryMutAct_9fa48("108")) {
          {}
        } else {
          stryCov_9fa48("108");
          violation = stryMutAct_9fa48("109") ? "" : (stryCov_9fa48("109"), 'SKIPPED_INTERLOCK');
        }
      } else if (stryMutAct_9fa48("112") ? from === 'H' || to === 'E' : stryMutAct_9fa48("111") ? false : stryMutAct_9fa48("110") ? true : (stryCov_9fa48("110", "111", "112"), (stryMutAct_9fa48("114") ? from !== 'H' : stryMutAct_9fa48("113") ? true : (stryCov_9fa48("113", "114"), from === (stryMutAct_9fa48("115") ? "" : (stryCov_9fa48("115"), 'H')))) && (stryMutAct_9fa48("117") ? to !== 'E' : stryMutAct_9fa48("116") ? true : (stryCov_9fa48("116", "117"), to === (stryMutAct_9fa48("118") ? "" : (stryCov_9fa48("118"), 'E')))))) {
        if (stryMutAct_9fa48("119")) {
          {}
        } else {
          stryCov_9fa48("119");
          violation = stryMutAct_9fa48("120") ? "" : (stryCov_9fa48("120"), 'SKIPPED_INTERLOCK');
        }
      } else if (stryMutAct_9fa48("123") ? from === 'I' || to === 'E' : stryMutAct_9fa48("122") ? false : stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121", "122", "123"), (stryMutAct_9fa48("125") ? from !== 'I' : stryMutAct_9fa48("124") ? true : (stryCov_9fa48("124", "125"), from === (stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'I')))) && (stryMutAct_9fa48("128") ? to !== 'E' : stryMutAct_9fa48("127") ? true : (stryCov_9fa48("127", "128"), to === (stryMutAct_9fa48("129") ? "" : (stryCov_9fa48("129"), 'E')))))) {
        if (stryMutAct_9fa48("130")) {
          {}
        } else {
          stryCov_9fa48("130");
          violation = stryMutAct_9fa48("131") ? "" : (stryCov_9fa48("131"), 'SKIPPED_VALIDATE');
        }
      } else if (stryMutAct_9fa48("134") ? from === 'H' || to === 'V' : stryMutAct_9fa48("133") ? false : stryMutAct_9fa48("132") ? true : (stryCov_9fa48("132", "133", "134"), (stryMutAct_9fa48("136") ? from !== 'H' : stryMutAct_9fa48("135") ? true : (stryCov_9fa48("135", "136"), from === (stryMutAct_9fa48("137") ? "" : (stryCov_9fa48("137"), 'H')))) && (stryMutAct_9fa48("139") ? to !== 'V' : stryMutAct_9fa48("138") ? true : (stryCov_9fa48("138", "139"), to === (stryMutAct_9fa48("140") ? "" : (stryCov_9fa48("140"), 'V')))))) {
        if (stryMutAct_9fa48("141")) {
          {}
        } else {
          stryCov_9fa48("141");
          violation = stryMutAct_9fa48("142") ? "" : (stryCov_9fa48("142"), 'REWARD_HACK'); // Trying to go GREEN without RED
        }
      }
      return stryMutAct_9fa48("143") ? {} : (stryCov_9fa48("143"), {
        valid: stryMutAct_9fa48("144") ? true : (stryCov_9fa48("144"), false),
        from,
        to,
        reason: stryMutAct_9fa48("147") ? VIOLATION_MESSAGES[violation] && `Invalid transition: ${from} → ${to}` : stryMutAct_9fa48("146") ? false : stryMutAct_9fa48("145") ? true : (stryCov_9fa48("145", "146", "147"), VIOLATION_MESSAGES[violation] || (stryMutAct_9fa48("148") ? `` : (stryCov_9fa48("148"), `Invalid transition: ${from} → ${to}`))),
        violation
      });
    }
  }

  /**
   * Check if a proposed signal can be emitted
   */
  canEmitSignal(proposed: Signal): TransitionResult {
    if (stryMutAct_9fa48("149")) {
      {}
    } else {
      stryCov_9fa48("149");
      const currentPhase = this.getCurrentPhase();
      return this.validateTransition(currentPhase, proposed.hive);
    }
  }

  /**
   * Record a signal (after validation)
   */
  recordSignal(signal: Signal): void {
    if (stryMutAct_9fa48("150")) {
      {}
    } else {
      stryCov_9fa48("150");
      this.signalHistory.push(signal);

      // Trim history if needed
      if (stryMutAct_9fa48("154") ? this.signalHistory.length <= this.maxHistorySize : stryMutAct_9fa48("153") ? this.signalHistory.length >= this.maxHistorySize : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153", "154"), this.signalHistory.length > this.maxHistorySize)) {
        if (stryMutAct_9fa48("155")) {
          {}
        } else {
          stryCov_9fa48("155");
          this.signalHistory = stryMutAct_9fa48("156") ? this.signalHistory : (stryCov_9fa48("156"), this.signalHistory.slice(stryMutAct_9fa48("157") ? +this.maxHistorySize : (stryCov_9fa48("157"), -this.maxHistorySize)));
        }
      }
    }
  }

  /**
   * Get the last N signals
   */
  getLastNSignals(n: number): Signal[] {
    if (stryMutAct_9fa48("158")) {
      {}
    } else {
      stryCov_9fa48("158");
      return stryMutAct_9fa48("159") ? this.signalHistory : (stryCov_9fa48("159"), this.signalHistory.slice(stryMutAct_9fa48("160") ? +n : (stryCov_9fa48("160"), -n)));
    }
  }

  /**
   * Load signal history (e.g., from blackboard file)
   */
  loadHistory(signals: Signal[]): void {
    if (stryMutAct_9fa48("161")) {
      {}
    } else {
      stryCov_9fa48("161");
      this.signalHistory = stryMutAct_9fa48("162") ? signals : (stryCov_9fa48("162"), signals.slice(stryMutAct_9fa48("163") ? +this.maxHistorySize : (stryCov_9fa48("163"), -this.maxHistorySize)));
    }
  }

  /**
   * Get HIVE cycle statistics
   */
  getCycleStats(): {
    totalSignals: number;
    byPhase: Record<HIVEPhase, number>;
    currentPhase: HIVEPhase | null;
    completedCycles: number;
  } {
    if (stryMutAct_9fa48("164")) {
      {}
    } else {
      stryCov_9fa48("164");
      const byPhase: Record<HIVEPhase, number> = stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
        H: 0,
        I: 0,
        V: 0,
        E: 0,
        X: 0
      });
      for (const signal of this.signalHistory) {
        if (stryMutAct_9fa48("166")) {
          {}
        } else {
          stryCov_9fa48("166");
          stryMutAct_9fa48("167") ? byPhase[signal.hive]-- : (stryCov_9fa48("167"), byPhase[signal.hive]++);
        }
      }

      // Count completed cycles (H→I→V→E sequences)
      let completedCycles = 0;
      let lastPhase: HIVEPhase | null = null;
      const cyclePhases: HIVEPhase[] = stryMutAct_9fa48("168") ? ["Stryker was here"] : (stryCov_9fa48("168"), []);
      for (const signal of this.signalHistory) {
        if (stryMutAct_9fa48("169")) {
          {}
        } else {
          stryCov_9fa48("169");
          if (stryMutAct_9fa48("172") ? signal.hive !== 'X' : stryMutAct_9fa48("171") ? false : stryMutAct_9fa48("170") ? true : (stryCov_9fa48("170", "171", "172"), signal.hive === (stryMutAct_9fa48("173") ? "" : (stryCov_9fa48("173"), 'X')))) continue;
          if (stryMutAct_9fa48("176") ? signal.hive === lastPhase : stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175", "176"), signal.hive !== lastPhase)) {
            if (stryMutAct_9fa48("177")) {
              {}
            } else {
              stryCov_9fa48("177");
              cyclePhases.push(signal.hive);
              lastPhase = signal.hive;

              // Check for completed cycle
              if (stryMutAct_9fa48("181") ? cyclePhases.length < 4 : stryMutAct_9fa48("180") ? cyclePhases.length > 4 : stryMutAct_9fa48("179") ? false : stryMutAct_9fa48("178") ? true : (stryCov_9fa48("178", "179", "180", "181"), cyclePhases.length >= 4)) {
                if (stryMutAct_9fa48("182")) {
                  {}
                } else {
                  stryCov_9fa48("182");
                  const last4 = stryMutAct_9fa48("183") ? cyclePhases : (stryCov_9fa48("183"), cyclePhases.slice(stryMutAct_9fa48("184") ? +4 : (stryCov_9fa48("184"), -4)));
                  if (stryMutAct_9fa48("187") ? last4[0] === 'H' && last4[1] === 'I' && last4[2] === 'V' || last4[3] === 'E' : stryMutAct_9fa48("186") ? false : stryMutAct_9fa48("185") ? true : (stryCov_9fa48("185", "186", "187"), (stryMutAct_9fa48("189") ? last4[0] === 'H' && last4[1] === 'I' || last4[2] === 'V' : stryMutAct_9fa48("188") ? true : (stryCov_9fa48("188", "189"), (stryMutAct_9fa48("191") ? last4[0] === 'H' || last4[1] === 'I' : stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190", "191"), (stryMutAct_9fa48("193") ? last4[0] !== 'H' : stryMutAct_9fa48("192") ? true : (stryCov_9fa48("192", "193"), last4[0] === (stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), 'H')))) && (stryMutAct_9fa48("196") ? last4[1] !== 'I' : stryMutAct_9fa48("195") ? true : (stryCov_9fa48("195", "196"), last4[1] === (stryMutAct_9fa48("197") ? "" : (stryCov_9fa48("197"), 'I')))))) && (stryMutAct_9fa48("199") ? last4[2] !== 'V' : stryMutAct_9fa48("198") ? true : (stryCov_9fa48("198", "199"), last4[2] === (stryMutAct_9fa48("200") ? "" : (stryCov_9fa48("200"), 'V')))))) && (stryMutAct_9fa48("202") ? last4[3] !== 'E' : stryMutAct_9fa48("201") ? true : (stryCov_9fa48("201", "202"), last4[3] === (stryMutAct_9fa48("203") ? "" : (stryCov_9fa48("203"), 'E')))))) {
                    if (stryMutAct_9fa48("204")) {
                      {}
                    } else {
                      stryCov_9fa48("204");
                      stryMutAct_9fa48("205") ? completedCycles-- : (stryCov_9fa48("205"), completedCycles++);
                    }
                  }
                }
              }
            }
          }
        }
      }
      return stryMutAct_9fa48("206") ? {} : (stryCov_9fa48("206"), {
        totalSignals: this.signalHistory.length,
        byPhase,
        currentPhase: this.getCurrentPhase(),
        completedCycles
      });
    }
  }

  /**
   * Reset the validator (for testing)
   */
  reset(): void {
    if (stryMutAct_9fa48("207")) {
      {}
    } else {
      stryCov_9fa48("207");
      this.signalHistory = stryMutAct_9fa48("208") ? ["Stryker was here"] : (stryCov_9fa48("208"), []);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalValidator: HIVEValidator | null = null;
export function getHIVEValidator(): HIVEValidator {
  if (stryMutAct_9fa48("209")) {
    {}
  } else {
    stryCov_9fa48("209");
    if (stryMutAct_9fa48("212") ? false : stryMutAct_9fa48("211") ? true : stryMutAct_9fa48("210") ? globalValidator : (stryCov_9fa48("210", "211", "212"), !globalValidator)) {
      if (stryMutAct_9fa48("213")) {
        {}
      } else {
        stryCov_9fa48("213");
        globalValidator = new HIVEValidator();
      }
    }
    return globalValidator;
  }
}
export function resetHIVEValidator(): void {
  if (stryMutAct_9fa48("214")) {
    {}
  } else {
    stryCov_9fa48("214");
    globalValidator = null;
  }
}

// =============================================================================
// PORT-PHASE MAPPING (HIVE/8 Anti-Diagonal)
// =============================================================================

/**
 * Maps HIVE phases to their primary ports (anti-diagonal sum = 7)
 */
export const PHASE_PORT_MAP: Record<HIVEPhase, [number, number]> = stryMutAct_9fa48("215") ? {} : (stryCov_9fa48("215"), {
  H: stryMutAct_9fa48("216") ? [] : (stryCov_9fa48("216"), [0, 7]),
  // Lidless Legion + Spider Sovereign
  I: stryMutAct_9fa48("217") ? [] : (stryCov_9fa48("217"), [1, 6]),
  // Web Weaver + Kraken Keeper
  V: stryMutAct_9fa48("218") ? [] : (stryCov_9fa48("218"), [2, 5]),
  // Mirror Magus + Pyre Praetorian
  E: stryMutAct_9fa48("219") ? [] : (stryCov_9fa48("219"), [3, 4]),
  // Spore Storm + Red Regnant
  X: stryMutAct_9fa48("220") ? [] : (stryCov_9fa48("220"), [7, 7]) // Spider Sovereign handles handoffs
});

/**
 * Check if a port is valid for a given phase
 */
export function isPortValidForPhase(port: number, phase: HIVEPhase): boolean {
  if (stryMutAct_9fa48("221")) {
    {}
  } else {
    stryCov_9fa48("221");
    const validPorts = PHASE_PORT_MAP[phase];
    return validPorts.includes(port);
  }
}

/**
 * Get recommended port for a phase
 */
export function getRecommendedPort(phase: HIVEPhase): number {
  if (stryMutAct_9fa48("222")) {
    {}
  } else {
    stryCov_9fa48("222");
    return PHASE_PORT_MAP[phase][0];
  }
}