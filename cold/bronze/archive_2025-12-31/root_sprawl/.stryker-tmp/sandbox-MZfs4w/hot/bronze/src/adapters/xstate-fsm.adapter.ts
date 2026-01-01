/**
 * XState FSM Adapter
 *
 * Gen87.X3 | Port 3 (DELIVER) | Implements FSMPort
 *
 * EXEMPLAR SOURCE: https://stately.ai/docs/setup
 * Machine design from: W3C_GESTURE_CONTROL_PLANE_SPEC.md Section 4
 *
 * Grounded: Tavily research 2025-12-29
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
import { type ActorRefFrom, type SnapshotFrom, assign, createActor, setup } from 'xstate';
import type { FSMPort } from '../contracts/ports.js';
import { type FSMAction, FSMActionSchema, type FSMState, type SmoothedFrame } from '../contracts/schemas.js';

// ============================================================================
// FSM TYPES
// ============================================================================

type GestureContext = {
  /** Time when baseline became stable */
  baselineStableAt: number | null;
  /** Whether we entered ARMED from baseline (not from command state) */
  armedFromBaseline: boolean;
  /** Last valid position */
  lastPosition: {
    x: number;
    y: number;
  } | null;
  /** Current frame timestamp */
  currentTs: number;
};
type GestureEvent = {
  type: 'FRAME';
  frame: SmoothedFrame;
} | {
  type: 'DISARM';
};

// ============================================================================
// FSM CONFIGURATION
// ============================================================================

const DEFAULT_ARM_STABLE_MS = 200;
const DEFAULT_CMD_WINDOW_MS = 500;
const DEFAULT_MIN_CONFIDENCE = 0.7;

// ============================================================================
// GUARDS
// ============================================================================

export const guards = stryMutAct_9fa48("0") ? {} : (stryCov_9fa48("0"), {
  /** GATE_BASELINE_OK: Open_Palm + palmFacing + conf >= Cmin */
  isBaselineOk: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("1")) {
      {}
    } else {
      stryCov_9fa48("1");
      if (stryMutAct_9fa48("4") ? event.type === 'FRAME' : stryMutAct_9fa48("3") ? false : stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2", "3", "4"), event.type !== 'FRAME')) return stryMutAct_9fa48("6") ? true : (stryCov_9fa48("6"), false);
      const {
        frame
      } = event;
      return stryMutAct_9fa48("9") ? frame.trackingOk && frame.palmFacing && frame.label === 'Open_Palm' || frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("8") ? false : stryMutAct_9fa48("7") ? true : (stryCov_9fa48("7", "8", "9"), (stryMutAct_9fa48("11") ? frame.trackingOk && frame.palmFacing || frame.label === 'Open_Palm' : stryMutAct_9fa48("10") ? true : (stryCov_9fa48("10", "11"), (stryMutAct_9fa48("13") ? frame.trackingOk || frame.palmFacing : stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12", "13"), frame.trackingOk && frame.palmFacing)) && (stryMutAct_9fa48("15") ? frame.label !== 'Open_Palm' : stryMutAct_9fa48("14") ? true : (stryCov_9fa48("14", "15"), frame.label === 'Open_Palm')))) && (stryMutAct_9fa48("19") ? frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("18") ? frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("17") ? true : (stryCov_9fa48("17", "18", "19"), frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
    }
  },
  /** GATE_BASELINE_STABLE: Baseline maintained for ARM_STABLE_MS */
  isBaselineStable: ({
    context,
    event
  }: {
    context: GestureContext;
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("20")) {
      {}
    } else {
      stryCov_9fa48("20");
      if (stryMutAct_9fa48("23") ? event.type === 'FRAME' : stryMutAct_9fa48("22") ? false : stryMutAct_9fa48("21") ? true : (stryCov_9fa48("21", "22", "23"), event.type !== 'FRAME')) return stryMutAct_9fa48("25") ? true : (stryCov_9fa48("25"), false);
      if (stryMutAct_9fa48("28") ? context.baselineStableAt !== null : stryMutAct_9fa48("27") ? false : stryMutAct_9fa48("26") ? true : (stryCov_9fa48("26", "27", "28"), context.baselineStableAt === null)) return stryMutAct_9fa48("29") ? true : (stryCov_9fa48("29"), false);
      return stryMutAct_9fa48("33") ? event.frame.ts - context.baselineStableAt < DEFAULT_ARM_STABLE_MS : stryMutAct_9fa48("32") ? event.frame.ts - context.baselineStableAt > DEFAULT_ARM_STABLE_MS : stryMutAct_9fa48("31") ? false : stryMutAct_9fa48("30") ? true : (stryCov_9fa48("30", "31", "32", "33"), (stryMutAct_9fa48("34") ? event.frame.ts + context.baselineStableAt : (stryCov_9fa48("34"), event.frame.ts - context.baselineStableAt)) >= DEFAULT_ARM_STABLE_MS);
    }
  },
  /** GATE_CMD_WINDOW_OK: Within command window from baseline */
  isCmdWindowOk: ({
    context,
    event
  }: {
    context: GestureContext;
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("35")) {
      {}
    } else {
      stryCov_9fa48("35");
      if (stryMutAct_9fa48("38") ? event.type === 'FRAME' : stryMutAct_9fa48("37") ? false : stryMutAct_9fa48("36") ? true : (stryCov_9fa48("36", "37", "38"), event.type !== 'FRAME')) return stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40"), false);
      if (stryMutAct_9fa48("43") ? false : stryMutAct_9fa48("42") ? true : stryMutAct_9fa48("41") ? context.armedFromBaseline : (stryCov_9fa48("41", "42", "43"), !context.armedFromBaseline)) return stryMutAct_9fa48("44") ? true : (stryCov_9fa48("44"), false);
      if (stryMutAct_9fa48("47") ? context.baselineStableAt !== null : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47"), context.baselineStableAt === null)) return stryMutAct_9fa48("48") ? true : (stryCov_9fa48("48"), false);
      return stryMutAct_9fa48("52") ? event.frame.ts - context.baselineStableAt > DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("51") ? event.frame.ts - context.baselineStableAt < DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("50") ? false : stryMutAct_9fa48("49") ? true : (stryCov_9fa48("49", "50", "51", "52"), (stryMutAct_9fa48("53") ? event.frame.ts + context.baselineStableAt : (stryCov_9fa48("53"), event.frame.ts - context.baselineStableAt)) <= DEFAULT_CMD_WINDOW_MS);
    }
  },
  /** GATE_TRACKING_OK: Hand is being tracked */
  isTrackingOk: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("54")) {
      {}
    } else {
      stryCov_9fa48("54");
      if (stryMutAct_9fa48("57") ? event.type === 'FRAME' : stryMutAct_9fa48("56") ? false : stryMutAct_9fa48("55") ? true : (stryCov_9fa48("55", "56", "57"), event.type !== 'FRAME')) return stryMutAct_9fa48("59") ? true : (stryCov_9fa48("59"), false);
      return event.frame.trackingOk;
    }
  },
  /** GATE_PALM_FACING: Palm facing camera */
  isPalmFacing: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("60")) {
      {}
    } else {
      stryCov_9fa48("60");
      if (stryMutAct_9fa48("63") ? event.type === 'FRAME' : stryMutAct_9fa48("62") ? false : stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61", "62", "63"), event.type !== 'FRAME')) return stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65"), false);
      return event.frame.palmFacing;
    }
  },
  /** Is Pointing_Up gesture (primary click) */
  isPointingUp: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("66")) {
      {}
    } else {
      stryCov_9fa48("66");
      if (stryMutAct_9fa48("69") ? event.type === 'FRAME' : stryMutAct_9fa48("68") ? false : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68", "69"), event.type !== 'FRAME')) return stryMutAct_9fa48("71") ? true : (stryCov_9fa48("71"), false);
      return stryMutAct_9fa48("74") ? event.frame.label === 'Pointing_Up' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("73") ? false : stryMutAct_9fa48("72") ? true : (stryCov_9fa48("72", "73", "74"), (stryMutAct_9fa48("76") ? event.frame.label !== 'Pointing_Up' : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76"), event.frame.label === 'Pointing_Up')) && (stryMutAct_9fa48("80") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("79") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
    }
  },
  /** Is Victory gesture (navigation/pan) */
  isVictory: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("81")) {
      {}
    } else {
      stryCov_9fa48("81");
      if (stryMutAct_9fa48("84") ? event.type === 'FRAME' : stryMutAct_9fa48("83") ? false : stryMutAct_9fa48("82") ? true : (stryCov_9fa48("82", "83", "84"), event.type !== 'FRAME')) return stryMutAct_9fa48("86") ? true : (stryCov_9fa48("86"), false);
      return stryMutAct_9fa48("89") ? event.frame.label === 'Victory' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("88") ? false : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88", "89"), (stryMutAct_9fa48("91") ? event.frame.label !== 'Victory' : stryMutAct_9fa48("90") ? true : (stryCov_9fa48("90", "91"), event.frame.label === 'Victory')) && (stryMutAct_9fa48("95") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("94") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("93") ? true : (stryCov_9fa48("93", "94", "95"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
    }
  },
  /** Is Thumb_Up/Down gesture (zoom) */
  isZoomGesture: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("96")) {
      {}
    } else {
      stryCov_9fa48("96");
      if (stryMutAct_9fa48("99") ? event.type === 'FRAME' : stryMutAct_9fa48("98") ? false : stryMutAct_9fa48("97") ? true : (stryCov_9fa48("97", "98", "99"), event.type !== 'FRAME')) return stryMutAct_9fa48("101") ? true : (stryCov_9fa48("101"), false);
      return stryMutAct_9fa48("104") ? event.frame.label === 'Thumb_Up' || event.frame.label === 'Thumb_Down' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("103") ? false : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103", "104"), (stryMutAct_9fa48("106") ? event.frame.label === 'Thumb_Up' && event.frame.label === 'Thumb_Down' : stryMutAct_9fa48("105") ? true : (stryCov_9fa48("105", "106"), (stryMutAct_9fa48("108") ? event.frame.label !== 'Thumb_Up' : stryMutAct_9fa48("107") ? false : (stryCov_9fa48("107", "108"), event.frame.label === 'Thumb_Up')) || (stryMutAct_9fa48("111") ? event.frame.label !== 'Thumb_Down' : stryMutAct_9fa48("110") ? false : (stryCov_9fa48("110", "111"), event.frame.label === 'Thumb_Down')))) && (stryMutAct_9fa48("115") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("114") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("113") ? true : (stryCov_9fa48("113", "114", "115"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
    }
  },
  /** Is returning to baseline from command state */
  isReturningToBaseline: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("116")) {
      {}
    } else {
      stryCov_9fa48("116");
      if (stryMutAct_9fa48("119") ? event.type === 'FRAME' : stryMutAct_9fa48("118") ? false : stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117", "118", "119"), event.type !== 'FRAME')) return stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121"), false);
      const {
        frame
      } = event;
      return stryMutAct_9fa48("124") ? frame.trackingOk && frame.palmFacing || frame.label === 'Open_Palm' : stryMutAct_9fa48("123") ? false : stryMutAct_9fa48("122") ? true : (stryCov_9fa48("122", "123", "124"), (stryMutAct_9fa48("126") ? frame.trackingOk || frame.palmFacing : stryMutAct_9fa48("125") ? true : (stryCov_9fa48("125", "126"), frame.trackingOk && frame.palmFacing)) && (stryMutAct_9fa48("128") ? frame.label !== 'Open_Palm' : stryMutAct_9fa48("127") ? true : (stryCov_9fa48("127", "128"), frame.label === 'Open_Palm')));
    }
  },
  // Inverse guards (XState v5 doesn't have built-in 'not')
  isNotBaselineOk: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("130")) {
      {}
    } else {
      stryCov_9fa48("130");
      if (stryMutAct_9fa48("133") ? event.type === 'FRAME' : stryMutAct_9fa48("132") ? false : stryMutAct_9fa48("131") ? true : (stryCov_9fa48("131", "132", "133"), event.type !== 'FRAME')) return stryMutAct_9fa48("135") ? false : (stryCov_9fa48("135"), true);
      const {
        frame
      } = event;
      return stryMutAct_9fa48("136") ? frame.trackingOk && frame.palmFacing && frame.label === 'Open_Palm' && frame.confidence >= DEFAULT_MIN_CONFIDENCE : (stryCov_9fa48("136"), !(stryMutAct_9fa48("139") ? frame.trackingOk && frame.palmFacing && frame.label === 'Open_Palm' || frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("138") ? false : stryMutAct_9fa48("137") ? true : (stryCov_9fa48("137", "138", "139"), (stryMutAct_9fa48("141") ? frame.trackingOk && frame.palmFacing || frame.label === 'Open_Palm' : stryMutAct_9fa48("140") ? true : (stryCov_9fa48("140", "141"), (stryMutAct_9fa48("143") ? frame.trackingOk || frame.palmFacing : stryMutAct_9fa48("142") ? true : (stryCov_9fa48("142", "143"), frame.trackingOk && frame.palmFacing)) && (stryMutAct_9fa48("145") ? frame.label !== 'Open_Palm' : stryMutAct_9fa48("144") ? true : (stryCov_9fa48("144", "145"), frame.label === 'Open_Palm')))) && (stryMutAct_9fa48("149") ? frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("148") ? frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("147") ? true : (stryCov_9fa48("147", "148", "149"), frame.confidence >= DEFAULT_MIN_CONFIDENCE)))));
    }
  },
  isNotTrackingOk: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("150")) {
      {}
    } else {
      stryCov_9fa48("150");
      if (stryMutAct_9fa48("153") ? event.type === 'FRAME' : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153"), event.type !== 'FRAME')) return stryMutAct_9fa48("155") ? false : (stryCov_9fa48("155"), true);
      return stryMutAct_9fa48("156") ? event.frame.trackingOk : (stryCov_9fa48("156"), !event.frame.trackingOk);
    }
  },
  isNotPalmFacing: ({
    event
  }: {
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("157")) {
      {}
    } else {
      stryCov_9fa48("157");
      if (stryMutAct_9fa48("160") ? event.type === 'FRAME' : stryMutAct_9fa48("159") ? false : stryMutAct_9fa48("158") ? true : (stryCov_9fa48("158", "159", "160"), event.type !== 'FRAME')) return stryMutAct_9fa48("162") ? false : (stryCov_9fa48("162"), true);
      return stryMutAct_9fa48("163") ? event.frame.palmFacing : (stryCov_9fa48("163"), !event.frame.palmFacing);
    }
  },
  // Compound guards (XState v5 doesn't have built-in 'and')
  isPointingUpInWindow: ({
    context,
    event
  }: {
    context: GestureContext;
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("164")) {
      {}
    } else {
      stryCov_9fa48("164");
      if (stryMutAct_9fa48("167") ? event.type === 'FRAME' : stryMutAct_9fa48("166") ? false : stryMutAct_9fa48("165") ? true : (stryCov_9fa48("165", "166", "167"), event.type !== 'FRAME')) return stryMutAct_9fa48("169") ? true : (stryCov_9fa48("169"), false);
      const isPointingUp = stryMutAct_9fa48("172") ? event.frame.label === 'Pointing_Up' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("171") ? false : stryMutAct_9fa48("170") ? true : (stryCov_9fa48("170", "171", "172"), (stryMutAct_9fa48("174") ? event.frame.label !== 'Pointing_Up' : stryMutAct_9fa48("173") ? true : (stryCov_9fa48("173", "174"), event.frame.label === 'Pointing_Up')) && (stryMutAct_9fa48("178") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("177") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("176") ? true : (stryCov_9fa48("176", "177", "178"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
      const isCmdWindowOk = stryMutAct_9fa48("181") ? context.armedFromBaseline && context.baselineStableAt !== null || event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("180") ? false : stryMutAct_9fa48("179") ? true : (stryCov_9fa48("179", "180", "181"), (stryMutAct_9fa48("183") ? context.armedFromBaseline || context.baselineStableAt !== null : stryMutAct_9fa48("182") ? true : (stryCov_9fa48("182", "183"), context.armedFromBaseline && (stryMutAct_9fa48("185") ? context.baselineStableAt === null : stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184", "185"), context.baselineStableAt !== null)))) && (stryMutAct_9fa48("188") ? event.frame.ts - context.baselineStableAt > DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("187") ? event.frame.ts - context.baselineStableAt < DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("186") ? true : (stryCov_9fa48("186", "187", "188"), (stryMutAct_9fa48("189") ? event.frame.ts + context.baselineStableAt : (stryCov_9fa48("189"), event.frame.ts - context.baselineStableAt)) <= DEFAULT_CMD_WINDOW_MS)));
      return stryMutAct_9fa48("192") ? isPointingUp || isCmdWindowOk : stryMutAct_9fa48("191") ? false : stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190", "191", "192"), isPointingUp && isCmdWindowOk);
    }
  },
  isVictoryInWindow: ({
    context,
    event
  }: {
    context: GestureContext;
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("193")) {
      {}
    } else {
      stryCov_9fa48("193");
      if (stryMutAct_9fa48("196") ? event.type === 'FRAME' : stryMutAct_9fa48("195") ? false : stryMutAct_9fa48("194") ? true : (stryCov_9fa48("194", "195", "196"), event.type !== 'FRAME')) return stryMutAct_9fa48("198") ? true : (stryCov_9fa48("198"), false);
      const isVictory = stryMutAct_9fa48("201") ? event.frame.label === 'Victory' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("200") ? false : stryMutAct_9fa48("199") ? true : (stryCov_9fa48("199", "200", "201"), (stryMutAct_9fa48("203") ? event.frame.label !== 'Victory' : stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202", "203"), event.frame.label === 'Victory')) && (stryMutAct_9fa48("207") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("206") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("205") ? true : (stryCov_9fa48("205", "206", "207"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
      const isCmdWindowOk = stryMutAct_9fa48("210") ? context.armedFromBaseline && context.baselineStableAt !== null || event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("209") ? false : stryMutAct_9fa48("208") ? true : (stryCov_9fa48("208", "209", "210"), (stryMutAct_9fa48("212") ? context.armedFromBaseline || context.baselineStableAt !== null : stryMutAct_9fa48("211") ? true : (stryCov_9fa48("211", "212"), context.armedFromBaseline && (stryMutAct_9fa48("214") ? context.baselineStableAt === null : stryMutAct_9fa48("213") ? true : (stryCov_9fa48("213", "214"), context.baselineStableAt !== null)))) && (stryMutAct_9fa48("217") ? event.frame.ts - context.baselineStableAt > DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("216") ? event.frame.ts - context.baselineStableAt < DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), (stryMutAct_9fa48("218") ? event.frame.ts + context.baselineStableAt : (stryCov_9fa48("218"), event.frame.ts - context.baselineStableAt)) <= DEFAULT_CMD_WINDOW_MS)));
      return stryMutAct_9fa48("221") ? isVictory || isCmdWindowOk : stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220", "221"), isVictory && isCmdWindowOk);
    }
  },
  isZoomInWindow: ({
    context,
    event
  }: {
    context: GestureContext;
    event: GestureEvent;
  }) => {
    if (stryMutAct_9fa48("222")) {
      {}
    } else {
      stryCov_9fa48("222");
      if (stryMutAct_9fa48("225") ? event.type === 'FRAME' : stryMutAct_9fa48("224") ? false : stryMutAct_9fa48("223") ? true : (stryCov_9fa48("223", "224", "225"), event.type !== 'FRAME')) return stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227"), false);
      const isZoom = stryMutAct_9fa48("230") ? event.frame.label === 'Thumb_Up' || event.frame.label === 'Thumb_Down' || event.frame.confidence >= DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("229") ? false : stryMutAct_9fa48("228") ? true : (stryCov_9fa48("228", "229", "230"), (stryMutAct_9fa48("232") ? event.frame.label === 'Thumb_Up' && event.frame.label === 'Thumb_Down' : stryMutAct_9fa48("231") ? true : (stryCov_9fa48("231", "232"), (stryMutAct_9fa48("234") ? event.frame.label !== 'Thumb_Up' : stryMutAct_9fa48("233") ? false : (stryCov_9fa48("233", "234"), event.frame.label === 'Thumb_Up')) || (stryMutAct_9fa48("237") ? event.frame.label !== 'Thumb_Down' : stryMutAct_9fa48("236") ? false : (stryCov_9fa48("236", "237"), event.frame.label === 'Thumb_Down')))) && (stryMutAct_9fa48("241") ? event.frame.confidence < DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("240") ? event.frame.confidence > DEFAULT_MIN_CONFIDENCE : stryMutAct_9fa48("239") ? true : (stryCov_9fa48("239", "240", "241"), event.frame.confidence >= DEFAULT_MIN_CONFIDENCE)));
      const isCmdWindowOk = stryMutAct_9fa48("244") ? context.armedFromBaseline && context.baselineStableAt !== null || event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("243") ? false : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243", "244"), (stryMutAct_9fa48("246") ? context.armedFromBaseline || context.baselineStableAt !== null : stryMutAct_9fa48("245") ? true : (stryCov_9fa48("245", "246"), context.armedFromBaseline && (stryMutAct_9fa48("248") ? context.baselineStableAt === null : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248"), context.baselineStableAt !== null)))) && (stryMutAct_9fa48("251") ? event.frame.ts - context.baselineStableAt > DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("250") ? event.frame.ts - context.baselineStableAt < DEFAULT_CMD_WINDOW_MS : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250", "251"), (stryMutAct_9fa48("252") ? event.frame.ts + context.baselineStableAt : (stryCov_9fa48("252"), event.frame.ts - context.baselineStableAt)) <= DEFAULT_CMD_WINDOW_MS)));
      return stryMutAct_9fa48("255") ? isZoom || isCmdWindowOk : stryMutAct_9fa48("254") ? false : stryMutAct_9fa48("253") ? true : (stryCov_9fa48("253", "254", "255"), isZoom && isCmdWindowOk);
    }
  }
});

// ============================================================================
// ACTIONS
// ============================================================================

const actions = stryMutAct_9fa48("256") ? {} : (stryCov_9fa48("256"), {
  recordBaselineTime: assign(stryMutAct_9fa48("257") ? {} : (stryCov_9fa48("257"), {
    baselineStableAt: ({
      event
    }) => {
      if (stryMutAct_9fa48("258")) {
        {}
      } else {
        stryCov_9fa48("258");
        if (stryMutAct_9fa48("261") ? event.type !== 'FRAME' : stryMutAct_9fa48("260") ? false : stryMutAct_9fa48("259") ? true : (stryCov_9fa48("259", "260", "261"), event.type === 'FRAME')) return event.frame.ts;
        return null;
      }
    }
  })),
  clearBaselineTime: assign(stryMutAct_9fa48("263") ? {} : (stryCov_9fa48("263"), {
    baselineStableAt: null
  })),
  setArmedFromBaseline: assign(stryMutAct_9fa48("264") ? {} : (stryCov_9fa48("264"), {
    armedFromBaseline: stryMutAct_9fa48("265") ? false : (stryCov_9fa48("265"), true)
  })),
  clearArmedFromBaseline: assign(stryMutAct_9fa48("266") ? {} : (stryCov_9fa48("266"), {
    armedFromBaseline: stryMutAct_9fa48("267") ? true : (stryCov_9fa48("267"), false)
  })),
  updatePosition: assign(stryMutAct_9fa48("268") ? {} : (stryCov_9fa48("268"), {
    lastPosition: ({
      event
    }) => {
      if (stryMutAct_9fa48("269")) {
        {}
      } else {
        stryCov_9fa48("269");
        if (stryMutAct_9fa48("272") ? event.type === 'FRAME' || event.frame.position : stryMutAct_9fa48("271") ? false : stryMutAct_9fa48("270") ? true : (stryCov_9fa48("270", "271", "272"), (stryMutAct_9fa48("274") ? event.type !== 'FRAME' : stryMutAct_9fa48("273") ? true : (stryCov_9fa48("273", "274"), event.type === 'FRAME')) && event.frame.position)) {
          if (stryMutAct_9fa48("276")) {
            {}
          } else {
            stryCov_9fa48("276");
            return stryMutAct_9fa48("277") ? {} : (stryCov_9fa48("277"), {
              x: event.frame.position.x,
              y: event.frame.position.y
            });
          }
        }
        return null;
      }
    },
    currentTs: ({
      event
    }) => {
      if (stryMutAct_9fa48("278")) {
        {}
      } else {
        stryCov_9fa48("278");
        if (stryMutAct_9fa48("281") ? event.type !== 'FRAME' : stryMutAct_9fa48("280") ? false : stryMutAct_9fa48("279") ? true : (stryCov_9fa48("279", "280", "281"), event.type === 'FRAME')) return event.frame.ts;
        return 0;
      }
    }
  }))
});

// ============================================================================
// STATE MACHINE
// ============================================================================

const gestureMachine = setup(stryMutAct_9fa48("283") ? {} : (stryCov_9fa48("283"), {
  types: stryMutAct_9fa48("284") ? {} : (stryCov_9fa48("284"), {
    context: {} as GestureContext,
    events: {} as GestureEvent
  }),
  guards,
  actions
})).createMachine(stryMutAct_9fa48("285") ? {} : (stryCov_9fa48("285"), {
  id: 'gestureFSM',
  initial: 'DISARMED',
  context: stryMutAct_9fa48("288") ? {} : (stryCov_9fa48("288"), {
    baselineStableAt: null,
    armedFromBaseline: stryMutAct_9fa48("289") ? true : (stryCov_9fa48("289"), false),
    lastPosition: null,
    currentTs: 0
  }),
  states: stryMutAct_9fa48("290") ? {} : (stryCov_9fa48("290"), {
    // System inactive - no pointer events
    DISARMED: stryMutAct_9fa48("291") ? {} : (stryCov_9fa48("291"), {
      on: stryMutAct_9fa48("292") ? {} : (stryCov_9fa48("292"), {
        FRAME: [stryMutAct_9fa48("294") ? {} : (stryCov_9fa48("294"), {
          guard: 'isBaselineOk',
          target: 'ARMING',
          actions: ['recordBaselineTime', 'updatePosition']
        }), stryMutAct_9fa48("300") ? {} : (stryCov_9fa48("300"), {
          actions: 'updatePosition'
        })]
      })
    }),
    // Baseline hysteresis - waiting for stable Open_Palm
    ARMING: stryMutAct_9fa48("302") ? {} : (stryCov_9fa48("302"), {
      on: stryMutAct_9fa48("303") ? {} : (stryCov_9fa48("303"), {
        FRAME: [stryMutAct_9fa48("305") ? {} : (stryCov_9fa48("305"), {
          guard: 'isNotBaselineOk',
          target: 'DISARMED',
          actions: 'clearBaselineTime'
        }), stryMutAct_9fa48("309") ? {} : (stryCov_9fa48("309"), {
          guard: 'isBaselineStable',
          target: 'ARMED',
          actions: ['setArmedFromBaseline', 'updatePosition']
        }), stryMutAct_9fa48("315") ? {} : (stryCov_9fa48("315"), {
          actions: 'updatePosition'
        })],
        DISARM: stryMutAct_9fa48("317") ? {} : (stryCov_9fa48("317"), {
          target: 'DISARMED',
          actions: 'clearBaselineTime'
        })
      })
    }),
    // Cursor aim mode - emit pointermove
    ARMED: stryMutAct_9fa48("320") ? {} : (stryCov_9fa48("320"), {
      on: stryMutAct_9fa48("321") ? {} : (stryCov_9fa48("321"), {
        FRAME: [// Lost tracking → DISARMED
        stryMutAct_9fa48("323") ? {} : (stryCov_9fa48("323"), {
          guard: 'isNotTrackingOk',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Lost palm facing → DISARMED
        stryMutAct_9fa48("329") ? {} : (stryCov_9fa48("329"), {
          guard: 'isNotPalmFacing',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Pointing_Up + in command window → DOWN_COMMIT
        stryMutAct_9fa48("335") ? {} : (stryCov_9fa48("335"), {
          guard: 'isPointingUpInWindow',
          target: 'DOWN_COMMIT',
          actions: 'updatePosition'
        }), // Victory + in command window → DOWN_NAV
        stryMutAct_9fa48("339") ? {} : (stryCov_9fa48("339"), {
          guard: 'isVictoryInWindow',
          target: 'DOWN_NAV',
          actions: 'updatePosition'
        }), // Zoom gesture + in command window → ZOOM
        stryMutAct_9fa48("343") ? {} : (stryCov_9fa48("343"), {
          guard: 'isZoomInWindow',
          target: 'ZOOM',
          actions: 'updatePosition'
        }), // Stay in ARMED, emit move
        stryMutAct_9fa48("347") ? {} : (stryCov_9fa48("347"), {
          actions: 'updatePosition'
        })],
        DISARM: stryMutAct_9fa48("349") ? {} : (stryCov_9fa48("349"), {
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        })
      })
    }),
    // Primary click/drag (button=0)
    DOWN_COMMIT: stryMutAct_9fa48("354") ? {} : (stryCov_9fa48("354"), {
      on: stryMutAct_9fa48("355") ? {} : (stryCov_9fa48("355"), {
        FRAME: [// Lost tracking → pointercancel → DISARMED
        stryMutAct_9fa48("357") ? {} : (stryCov_9fa48("357"), {
          guard: 'isNotTrackingOk',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Return to baseline → pointerup → ARMED (but not from baseline)
        stryMutAct_9fa48("363") ? {} : (stryCov_9fa48("363"), {
          guard: 'isReturningToBaseline',
          target: 'ARMED',
          actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition']
        }), // Lost palm facing → pointerup → DISARMED
        stryMutAct_9fa48("370") ? {} : (stryCov_9fa48("370"), {
          guard: 'isNotPalmFacing',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Stay in DOWN_COMMIT, emit move
        stryMutAct_9fa48("376") ? {} : (stryCov_9fa48("376"), {
          actions: 'updatePosition'
        })],
        DISARM: stryMutAct_9fa48("378") ? {} : (stryCov_9fa48("378"), {
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        })
      })
    }),
    // Middle-click drag (button=1) for pan
    DOWN_NAV: stryMutAct_9fa48("383") ? {} : (stryCov_9fa48("383"), {
      on: stryMutAct_9fa48("384") ? {} : (stryCov_9fa48("384"), {
        FRAME: [// Lost tracking → pointercancel → DISARMED
        stryMutAct_9fa48("386") ? {} : (stryCov_9fa48("386"), {
          guard: 'isNotTrackingOk',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Return to baseline → pointerup → ARMED (but not from baseline)
        stryMutAct_9fa48("392") ? {} : (stryCov_9fa48("392"), {
          guard: 'isReturningToBaseline',
          target: 'ARMED',
          actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition']
        }), // Lost palm facing → pointerup → DISARMED
        stryMutAct_9fa48("399") ? {} : (stryCov_9fa48("399"), {
          guard: 'isNotPalmFacing',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Stay in DOWN_NAV, emit move
        stryMutAct_9fa48("405") ? {} : (stryCov_9fa48("405"), {
          actions: 'updatePosition'
        })],
        DISARM: stryMutAct_9fa48("407") ? {} : (stryCov_9fa48("407"), {
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        })
      })
    }),
    // Wheel emission for zoom
    ZOOM: stryMutAct_9fa48("412") ? {} : (stryCov_9fa48("412"), {
      on: stryMutAct_9fa48("413") ? {} : (stryCov_9fa48("413"), {
        FRAME: [// Lost tracking → DISARMED
        stryMutAct_9fa48("415") ? {} : (stryCov_9fa48("415"), {
          guard: 'isNotTrackingOk',
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        }), // Return to baseline → ARMED
        stryMutAct_9fa48("421") ? {} : (stryCov_9fa48("421"), {
          guard: 'isReturningToBaseline',
          target: 'ARMED',
          actions: ['clearArmedFromBaseline', 'recordBaselineTime', 'updatePosition']
        }), // Stay in ZOOM
        stryMutAct_9fa48("428") ? {} : (stryCov_9fa48("428"), {
          actions: 'updatePosition'
        })],
        DISARM: stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
          target: 'DISARMED',
          actions: ['clearBaselineTime', 'clearArmedFromBaseline']
        })
      })
    })
  })
}));

// ============================================================================
// FSM ADAPTER
// ============================================================================

type GestureActor = ActorRefFrom<typeof gestureMachine>;
type GestureSnapshot = SnapshotFrom<typeof gestureMachine>;
export class XStateFSMAdapter implements FSMPort {
  private actor: GestureActor;
  private previousState: FSMState = 'DISARMED';
  private previousFrame: SmoothedFrame | null = null;
  private subscribers: Set<(state: string, action: FSMAction) => void> = new Set();
  constructor() {
    if (stryMutAct_9fa48("436")) {
      {}
    } else {
      stryCov_9fa48("436");
      this.actor = createActor(gestureMachine);
      this.actor.start();

      // Subscribe to state changes
      this.actor.subscribe(snapshot => {
        if (stryMutAct_9fa48("437")) {
          {}
        } else {
          stryCov_9fa48("437");
          const newState = snapshot.value as FSMState;
          if (stryMutAct_9fa48("441") ? this.subscribers.size <= 0 : stryMutAct_9fa48("440") ? this.subscribers.size >= 0 : stryMutAct_9fa48("439") ? false : stryMutAct_9fa48("438") ? true : (stryCov_9fa48("438", "439", "440", "441"), this.subscribers.size > 0)) {
            if (stryMutAct_9fa48("442")) {
              {}
            } else {
              stryCov_9fa48("442");
              const action = this.computeAction(newState, snapshot.context);
              this.subscribers.forEach(stryMutAct_9fa48("443") ? () => undefined : (stryCov_9fa48("443"), cb => cb(newState, action)));
            }
          }
        }
      });
    }
  }
  process(frame: SmoothedFrame): FSMAction {
    if (stryMutAct_9fa48("444")) {
      {}
    } else {
      stryCov_9fa48("444");
      const previousSnapshot = this.actor.getSnapshot();
      this.previousState = previousSnapshot.value as FSMState;

      // Send frame event to machine
      this.actor.send(stryMutAct_9fa48("445") ? {} : (stryCov_9fa48("445"), {
        type: 'FRAME',
        frame
      }));

      // Get new state
      const snapshot = this.actor.getSnapshot();
      const newState = snapshot.value as FSMState;

      // Compute action based on state transition (pass current frame for label access)
      const action = this.computeAction(newState, snapshot.context, frame);
      this.previousFrame = frame;

      // CDD: Validate output at port boundary
      return FSMActionSchema.parse(action);
    }
  }
  private computeAction(newState: FSMState, context: GestureContext, currentFrame: SmoothedFrame): FSMAction {
    if (stryMutAct_9fa48("447")) {
      {}
    } else {
      stryCov_9fa48("447");
      const position = stryMutAct_9fa48("448") ? context.lastPosition && {
        x: 0.5,
        y: 0.5
      } : (stryCov_9fa48("448"), context.lastPosition ?? (stryMutAct_9fa48("449") ? {} : (stryCov_9fa48("449"), {
        x: 0.5,
        y: 0.5
      })));
      const previousState = this.previousState;

      // State transition matrix
      if (stryMutAct_9fa48("452") ? newState !== 'DISARMED' : stryMutAct_9fa48("451") ? false : stryMutAct_9fa48("450") ? true : (stryCov_9fa48("450", "451", "452"), newState === 'DISARMED')) {
        if (stryMutAct_9fa48("454")) {
          {}
        } else {
          stryCov_9fa48("454");
          // If coming from DOWN state, emit cancel
          if (stryMutAct_9fa48("457") ? previousState === 'DOWN_COMMIT' && previousState === 'DOWN_NAV' : stryMutAct_9fa48("456") ? false : stryMutAct_9fa48("455") ? true : (stryCov_9fa48("455", "456", "457"), (stryMutAct_9fa48("459") ? previousState !== 'DOWN_COMMIT' : stryMutAct_9fa48("458") ? false : (stryCov_9fa48("458", "459"), previousState === 'DOWN_COMMIT')) || (stryMutAct_9fa48("462") ? previousState !== 'DOWN_NAV' : stryMutAct_9fa48("461") ? false : (stryCov_9fa48("461", "462"), previousState === 'DOWN_NAV')))) {
            if (stryMutAct_9fa48("464")) {
              {}
            } else {
              stryCov_9fa48("464");
              return stryMutAct_9fa48("465") ? {} : (stryCov_9fa48("465"), {
                action: 'cancel',
                state: newState
              });
            }
          }
          return stryMutAct_9fa48("467") ? {} : (stryCov_9fa48("467"), {
            action: 'none',
            state: newState
          });
        }
      }
      if (stryMutAct_9fa48("471") ? newState !== 'ARMING' : stryMutAct_9fa48("470") ? false : stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469", "470", "471"), newState === 'ARMING')) {
        if (stryMutAct_9fa48("473")) {
          {}
        } else {
          stryCov_9fa48("473");
          return stryMutAct_9fa48("474") ? {} : (stryCov_9fa48("474"), {
            action: 'none',
            state: newState
          });
        }
      }
      if (stryMutAct_9fa48("478") ? newState !== 'ARMED' : stryMutAct_9fa48("477") ? false : stryMutAct_9fa48("476") ? true : (stryCov_9fa48("476", "477", "478"), newState === 'ARMED')) {
        if (stryMutAct_9fa48("480")) {
          {}
        } else {
          stryCov_9fa48("480");
          // If coming from DOWN state, emit up
          if (stryMutAct_9fa48("483") ? previousState !== 'DOWN_COMMIT' : stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482", "483"), previousState === 'DOWN_COMMIT')) {
            if (stryMutAct_9fa48("485")) {
              {}
            } else {
              stryCov_9fa48("485");
              return stryMutAct_9fa48("486") ? {} : (stryCov_9fa48("486"), {
                action: 'up',
                state: newState,
                x: position.x,
                y: position.y,
                button: 0
              });
            }
          }
          if (stryMutAct_9fa48("490") ? previousState !== 'DOWN_NAV' : stryMutAct_9fa48("489") ? false : stryMutAct_9fa48("488") ? true : (stryCov_9fa48("488", "489", "490"), previousState === 'DOWN_NAV')) {
            if (stryMutAct_9fa48("492")) {
              {}
            } else {
              stryCov_9fa48("492");
              return stryMutAct_9fa48("493") ? {} : (stryCov_9fa48("493"), {
                action: 'up',
                state: newState,
                x: position.x,
                y: position.y,
                button: 1
              });
            }
          }
          // Normal move
          return stryMutAct_9fa48("495") ? {} : (stryCov_9fa48("495"), {
            action: 'move',
            state: newState,
            x: position.x,
            y: position.y
          });
        }
      }
      if (stryMutAct_9fa48("499") ? newState !== 'DOWN_COMMIT' : stryMutAct_9fa48("498") ? false : stryMutAct_9fa48("497") ? true : (stryCov_9fa48("497", "498", "499"), newState === 'DOWN_COMMIT')) {
        if (stryMutAct_9fa48("501")) {
          {}
        } else {
          stryCov_9fa48("501");
          // If just entered, emit down
          if (stryMutAct_9fa48("504") ? previousState !== 'ARMED' : stryMutAct_9fa48("503") ? false : stryMutAct_9fa48("502") ? true : (stryCov_9fa48("502", "503", "504"), previousState === 'ARMED')) {
            if (stryMutAct_9fa48("506")) {
              {}
            } else {
              stryCov_9fa48("506");
              return stryMutAct_9fa48("507") ? {} : (stryCov_9fa48("507"), {
                action: 'down',
                state: newState,
                x: position.x,
                y: position.y,
                button: 0
              });
            }
          }
          // Continuing drag, emit move
          return stryMutAct_9fa48("509") ? {} : (stryCov_9fa48("509"), {
            action: 'move',
            state: newState,
            x: position.x,
            y: position.y
          });
        }
      }
      if (stryMutAct_9fa48("513") ? newState !== 'DOWN_NAV' : stryMutAct_9fa48("512") ? false : stryMutAct_9fa48("511") ? true : (stryCov_9fa48("511", "512", "513"), newState === 'DOWN_NAV')) {
        if (stryMutAct_9fa48("515")) {
          {}
        } else {
          stryCov_9fa48("515");
          // If just entered, emit down
          if (stryMutAct_9fa48("518") ? previousState !== 'ARMED' : stryMutAct_9fa48("517") ? false : stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516", "517", "518"), previousState === 'ARMED')) {
            if (stryMutAct_9fa48("520")) {
              {}
            } else {
              stryCov_9fa48("520");
              return stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
                action: 'down',
                state: newState,
                x: position.x,
                y: position.y,
                button: 1
              });
            }
          }
          // Continuing drag, emit move
          return stryMutAct_9fa48("523") ? {} : (stryCov_9fa48("523"), {
            action: 'move',
            state: newState,
            x: position.x,
            y: position.y
          });
        }
      }
      if (stryMutAct_9fa48("527") ? newState !== 'ZOOM' : stryMutAct_9fa48("526") ? false : stryMutAct_9fa48("525") ? true : (stryCov_9fa48("525", "526", "527"), newState === 'ZOOM')) {
        if (stryMutAct_9fa48("529")) {
          {}
        } else {
          stryCov_9fa48("529");
          // Determine direction from current gesture
          const label = currentFrame.label;
          const deltaY = (stryMutAct_9fa48("532") ? label !== 'Thumb_Up' : stryMutAct_9fa48("531") ? false : stryMutAct_9fa48("530") ? true : (stryCov_9fa48("530", "531", "532"), label === 'Thumb_Up')) ? stryMutAct_9fa48("534") ? +100 : (stryCov_9fa48("534"), -100) : (stryMutAct_9fa48("537") ? label !== 'Thumb_Down' : stryMutAct_9fa48("536") ? false : stryMutAct_9fa48("535") ? true : (stryCov_9fa48("535", "536", "537"), label === 'Thumb_Down')) ? 100 : 0;
          return stryMutAct_9fa48("539") ? {} : (stryCov_9fa48("539"), {
            action: 'wheel',
            state: newState,
            deltaY,
            ctrl: stryMutAct_9fa48("541") ? false : (stryCov_9fa48("541"), true)
          });
        }
      }
      return stryMutAct_9fa48("542") ? {} : (stryCov_9fa48("542"), {
        action: 'none',
        state: newState
      });
    }
  }
  getState(): string {
    if (stryMutAct_9fa48("544")) {
      {}
    } else {
      stryCov_9fa48("544");
      return this.actor.getSnapshot().value as string;
    }
  }
  getContext(): GestureContext {
    if (stryMutAct_9fa48("545")) {
      {}
    } else {
      stryCov_9fa48("545");
      return this.actor.getSnapshot().context;
    }
  }
  disarm(): void {
    if (stryMutAct_9fa48("546")) {
      {}
    } else {
      stryCov_9fa48("546");
      this.actor.send(stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
        type: 'DISARM'
      }));
    }
  }
  subscribe(callback: (state: string, action: FSMAction) => void): () => void {
    if (stryMutAct_9fa48("549")) {
      {}
    } else {
      stryCov_9fa48("549");
      this.subscribers.add(callback);
      return stryMutAct_9fa48("550") ? () => undefined : (stryCov_9fa48("550"), () => this.subscribers.delete(callback));
    }
  }

  /**
   * Stop the actor (cleanup)
   */
  dispose(): void {
    if (stryMutAct_9fa48("551")) {
      {}
    } else {
      stryCov_9fa48("551");
      this.actor.stop();
      this.subscribers.clear();
    }
  }
}