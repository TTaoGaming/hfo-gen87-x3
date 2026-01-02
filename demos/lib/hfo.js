var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/1eurofilter/dist/OneEuroFilter.js
var require_OneEuroFilter = __commonJS({
  "node_modules/1eurofilter/dist/OneEuroFilter.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OneEuroFilter = void 0;
    var LowPassFilter = class {
      setAlpha(alpha) {
        if (alpha <= 0 || alpha > 1)
          console.log("alpha should be in (0.0., 1.0]");
        this.a = alpha;
      }
      constructor(alpha, initval = 0) {
        this.y = this.s = initval;
        this.setAlpha(alpha);
        this.initialized = false;
      }
      filter(value) {
        let result;
        if (this.initialized)
          result = this.a * value + (1 - this.a) * this.s;
        else {
          result = value;
          this.initialized = true;
        }
        this.y = value;
        this.s = result;
        return result;
      }
      filterWithAlpha(value, alpha) {
        this.setAlpha(alpha);
        return this.filter(value);
      }
      hasLastRawValue() {
        return this.initialized;
      }
      lastRawValue() {
        return this.y;
      }
      lastFilteredValue() {
        return this.s;
      }
      reset() {
        this.initialized = false;
      }
    };
    var OneEuroFilter3 = class {
      alpha(cutoff) {
        let te2 = 1 / this.freq;
        let tau = 1 / (2 * Math.PI * cutoff);
        return 1 / (1 + tau / te2);
      }
      /**
       * Sets the frequency of the signal
       *
       * @param freq An estimate of the frequency in Hz of the signal (> 0), if timestamps are not available.
       */
      setFrequency(freq) {
        if (freq <= 0)
          console.log("freq should be >0");
        this.freq = freq;
      }
      /**
       * Sets the filter min cutoff frequency
       *
       * @param mincutoff Min cutoff frequency in Hz (> 0). Lower values allow to remove more jitter.
       */
      setMinCutoff(mincutoff) {
        if (mincutoff <= 0)
          console.log("mincutoff should be >0");
        this.mincutoff = mincutoff;
      }
      /**
       * Sets the Beta parameter
       *
       * @param beta Parameter to reduce latency (> 0).
       */
      setBeta(beta) {
        this.beta = beta;
      }
      /**
       * Sets the dcutoff parameter
       *
       * @param dcutoff Used to filter the derivates. 1 Hz by default. Change this parameter if you know what you are doing.
       */
      setDerivateCutoff(dcutoff) {
        if (dcutoff <= 0)
          console.log("dcutoff should be >0");
        this.dcutoff = dcutoff;
      }
      /**
         * Sets the parameters of the 1 euro filter.
         *
         * @param freq - An estimate of the frequency in Hz of the signal (> 0), if timestamps are not available.
         * @param mincutoff - Min cutoff frequency in Hz (> 0). Lower values allow to remove more jitter.
         * @param beta - Parameter to reduce latency (> 0).
         *
         */
      setParameters(freq, mincutoff, beta) {
        this.setFrequency(freq);
        this.setMinCutoff(mincutoff);
        this.setBeta(beta);
      }
      /**
         * Constructs a 1 euro filter.
         *
         * @param freq - An estimate of the frequency in Hz of the signal (> 0), if timestamps are not available.
         * @param mincutoff - Min cutoff frequency in Hz (> 0). Lower values allow to remove more jitter.
         * @param beta - Parameter to reduce latency (> 0).
         * @param dcutoff - Used to filter the derivates. 1 Hz by default. Change this parameter if you know what you are doing.
         *
         */
      constructor(freq, mincutoff = 1, beta = 0, dcutoff = 1) {
        this.setFrequency(freq);
        this.setMinCutoff(mincutoff);
        this.setBeta(beta);
        this.setDerivateCutoff(dcutoff);
        this.x = new LowPassFilter(this.alpha(mincutoff));
        this.dx = new LowPassFilter(this.alpha(dcutoff));
        this.lasttime = void 0;
      }
      /**
       * Resets the internal state of the filter.
       */
      reset() {
        this.x.reset();
        this.dx.reset();
        this.lasttime = void 0;
      }
      /**
       * Returns the filtered value.
       *
       * @param value - Noisy value to filter
       * @param timestamp - (optional) timestamp in seconds
       * @returns The filtered value
       *
       */
      filter(value, timestamp) {
        if (this.lasttime != void 0 && timestamp != void 0)
          this.freq = 1 / (timestamp - this.lasttime);
        this.lasttime = timestamp;
        let dvalue = this.x.hasLastRawValue() ? (value - this.x.lastFilteredValue()) * this.freq : 0;
        let edvalue = this.dx.filterWithAlpha(dvalue, this.alpha(this.dcutoff));
        let cutoff = this.mincutoff + this.beta * Math.abs(edvalue);
        return this.x.filterWithAlpha(value, this.alpha(cutoff));
      }
    };
    exports.OneEuroFilter = OneEuroFilter3;
  }
});

// node_modules/1eurofilter/dist/index.js
var require_dist = __commonJS({
  "node_modules/1eurofilter/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OneEuroFilter = void 0;
    var OneEuroFilter_1 = require_OneEuroFilter();
    Object.defineProperty(exports, "OneEuroFilter", { enumerable: true, get: function() {
      return OneEuroFilter_1.OneEuroFilter;
    } });
  }
});

// node_modules/@mediapipe/tasks-vision/vision_bundle.mjs
var vision_bundle_exports = {};
__export(vision_bundle_exports, {
  DrawingUtils: () => Ia,
  FaceDetector: () => Za,
  FaceLandmarker: () => uc,
  FaceStylizer: () => lc,
  FilesetResolver: () => Uo,
  GestureRecognizer: () => mc,
  HandLandmarker: () => _c,
  HolisticLandmarker: () => Ac,
  ImageClassifier: () => bc,
  ImageEmbedder: () => kc,
  ImageSegmenter: () => Rc,
  ImageSegmenterResult: () => Sc,
  InteractiveSegmenter: () => Vc,
  InteractiveSegmenterResult: () => Fc,
  MPImage: () => Ga,
  MPMask: () => Ea,
  ObjectDetector: () => Xc,
  PoseLandmarker: () => Kc,
  TaskRunner: () => Zo,
  VisionTaskRunner: () => Ja
});
function e() {
  throw Error("Invalid UTF8");
}
function n(t2, e2) {
  return e2 = String.fromCharCode.apply(null, e2), null == t2 ? e2 : t2 + e2;
}
function c(t2) {
  if (a) t2 = (o || (o = new TextEncoder())).encode(t2);
  else {
    let n2 = 0;
    const r2 = new Uint8Array(3 * t2.length);
    for (let i2 = 0; i2 < t2.length; i2++) {
      var e2 = t2.charCodeAt(i2);
      if (e2 < 128) r2[n2++] = e2;
      else {
        if (e2 < 2048) r2[n2++] = e2 >> 6 | 192;
        else {
          if (e2 >= 55296 && e2 <= 57343) {
            if (e2 <= 56319 && i2 < t2.length) {
              const s2 = t2.charCodeAt(++i2);
              if (s2 >= 56320 && s2 <= 57343) {
                e2 = 1024 * (e2 - 55296) + s2 - 56320 + 65536, r2[n2++] = e2 >> 18 | 240, r2[n2++] = e2 >> 12 & 63 | 128, r2[n2++] = e2 >> 6 & 63 | 128, r2[n2++] = 63 & e2 | 128;
                continue;
              }
              i2--;
            }
            e2 = 65533;
          }
          r2[n2++] = e2 >> 12 | 224, r2[n2++] = e2 >> 6 & 63 | 128;
        }
        r2[n2++] = 63 & e2 | 128;
      }
    }
    t2 = n2 === r2.length ? r2 : r2.subarray(0, n2);
  }
  return t2;
}
function y(t2) {
  return !!h && (!!p && p.brands.some((({ brand: e2 }) => e2 && -1 != e2.indexOf(t2))));
}
function _(e2) {
  var n2;
  return (n2 = t.navigator) && (n2 = n2.userAgent) || (n2 = ""), -1 != n2.indexOf(e2);
}
function v() {
  return !!h && (!!p && p.brands.length > 0);
}
function E() {
  return v() ? y("Chromium") : (_("Chrome") || _("CriOS")) && !(!v() && _("Edge")) || _("Silk");
}
function w(t2) {
  return w[" "](t2), t2;
}
function k(t2) {
  const e2 = t2.length;
  let n2 = 3 * e2 / 4;
  n2 % 3 ? n2 = Math.floor(n2) : -1 != "=.".indexOf(t2[e2 - 1]) && (n2 = -1 != "=.".indexOf(t2[e2 - 2]) ? n2 - 2 : n2 - 1);
  const r2 = new Uint8Array(n2);
  let i2 = 0;
  return (function(t3, e3) {
    function n3(e4) {
      for (; r3 < t3.length; ) {
        const e5 = t3.charAt(r3++), n4 = b[e5];
        if (null != n4) return n4;
        if (!/^[\s\xa0]*$/.test(e5)) throw Error("Unknown base64 encoding at char: " + e5);
      }
      return e4;
    }
    S();
    let r3 = 0;
    for (; ; ) {
      const t4 = n3(-1), r4 = n3(0), i3 = n3(64), s2 = n3(64);
      if (64 === s2 && -1 === t4) break;
      e3(t4 << 2 | r4 >> 4), 64 != i3 && (e3(r4 << 4 & 240 | i3 >> 2), 64 != s2 && e3(i3 << 6 & 192 | s2));
    }
  })(t2, (function(t3) {
    r2[i2++] = t3;
  })), i2 !== n2 ? r2.subarray(0, i2) : r2;
}
function S() {
  if (!b) {
    b = {};
    var t2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""), e2 = ["+/=", "+/", "-_=", "-_.", "-_"];
    for (let n2 = 0; n2 < 5; n2++) {
      const r2 = t2.concat(e2[n2].split(""));
      A[n2] = r2;
      for (let t3 = 0; t3 < r2.length; t3++) {
        const e3 = r2[t3];
        void 0 === b[e3] && (b[e3] = t3);
      }
    }
  }
}
function R(t2) {
  if (!L) {
    var e2;
    void 0 === e2 && (e2 = 0), S(), e2 = A[e2];
    var n2 = Array(Math.floor(t2.length / 3)), r2 = e2[64] || "";
    let c2 = 0, h2 = 0;
    for (; c2 < t2.length - 2; c2 += 3) {
      var i2 = t2[c2], s2 = t2[c2 + 1], o2 = t2[c2 + 2], a2 = e2[i2 >> 2];
      i2 = e2[(3 & i2) << 4 | s2 >> 4], s2 = e2[(15 & s2) << 2 | o2 >> 6], o2 = e2[63 & o2], n2[h2++] = a2 + i2 + s2 + o2;
    }
    switch (a2 = 0, o2 = r2, t2.length - c2) {
      case 2:
        o2 = e2[(15 & (a2 = t2[c2 + 1])) << 2] || r2;
      case 1:
        t2 = t2[c2], n2[h2] = e2[t2 >> 2] + e2[(3 & t2) << 4 | a2 >> 4] + o2 + r2;
    }
    return n2.join("");
  }
  for (e2 = "", n2 = 0, r2 = t2.length - 10240; n2 < r2; ) e2 += String.fromCharCode.apply(null, t2.subarray(n2, n2 += 10240));
  return e2 += String.fromCharCode.apply(null, n2 ? t2.subarray(n2) : t2), btoa(e2);
}
function M(t2) {
  return I[t2] || "";
}
function P(t2) {
  if (!L) return k(t2);
  F.test(t2) && (t2 = t2.replace(F, M)), t2 = atob(t2);
  const e2 = new Uint8Array(t2.length);
  for (let n2 = 0; n2 < t2.length; n2++) e2[n2] = t2.charCodeAt(n2);
  return e2;
}
function C(t2) {
  return x && null != t2 && t2 instanceof Uint8Array;
}
function U() {
  return B || (B = new N(null, O));
}
function D(t2) {
  j(O);
  var e2 = t2.g;
  return null == (e2 = null == e2 || C(e2) ? e2 : "string" == typeof e2 ? P(e2) : null) ? e2 : t2.g = e2;
}
function j(t2) {
  if (t2 !== O) throw Error("illegal external caller");
}
function V(t2, e2) {
  t2.__closure__error__context__984382 || (t2.__closure__error__context__984382 = {}), t2.__closure__error__context__984382.severity = e2;
}
function X(t2) {
  return V(t2 = Error(t2), "warning"), t2;
}
function H(e2) {
  if (null != e2) {
    var n2 = G ?? (G = {}), r2 = n2[e2] || 0;
    r2 >= 5 || (n2[e2] = r2 + 1, V(e2 = Error(), "incident"), (function(e3) {
      t.setTimeout((() => {
        throw e3;
      }), 0);
    })(e2));
  }
}
function z(t2, e2, n2 = false) {
  return "function" == typeof Symbol && "symbol" == typeof /* @__PURE__ */ Symbol() ? n2 && Symbol.for && t2 ? Symbol.for(t2) : null != t2 ? Symbol(t2) : /* @__PURE__ */ Symbol() : e2;
}
function nt(t2, e2) {
  W || Q in t2 || et(t2, tt), t2[Q] |= e2;
}
function rt(t2, e2) {
  W || Q in t2 || et(t2, tt), t2[Q] = e2;
}
function it(t2) {
  return nt(t2, 34), t2;
}
function st(t2, e2) {
  rt(e2, -15615 & (0 | t2));
}
function ot(t2, e2) {
  rt(e2, -15581 & (34 | t2));
}
function at() {
  return "function" == typeof BigInt;
}
function ct(t2) {
  return Array.prototype.slice.call(t2);
}
function lt(t2) {
  return null !== t2 && "object" == typeof t2 && !Array.isArray(t2) && t2.constructor === Object;
}
function dt(t2, e2) {
  if (null != t2) {
    if ("string" == typeof t2) t2 = t2 ? new N(t2, O) : U();
    else if (t2.constructor !== N) if (C(t2)) t2 = t2.length ? new N(new Uint8Array(t2), O) : U();
    else {
      if (!e2) throw Error();
      t2 = void 0;
    }
  }
  return t2;
}
function pt(t2) {
  if (2 & t2) throw Error();
}
function mt(t2) {
  return q ? t2[q] : void 0;
}
function _t(t2) {
  return t2.Na = true, t2;
}
function At(t2) {
  var e2 = t2;
  if (Et(e2)) {
    if (!/^\s*(?:-?[1-9]\d*|0)?\s*$/.test(e2)) throw Error(String(e2));
  } else if (vt(e2) && !Number.isSafeInteger(e2)) throw Error(String(e2));
  return Tt ? BigInt(t2) : t2 = wt(t2) ? t2 ? "1" : "0" : Et(t2) ? t2.trim() || "0" : String(t2);
}
function Rt(t2, e2) {
  if (t2.length > e2.length) return false;
  if (t2.length < e2.length || t2 === e2) return true;
  for (let n2 = 0; n2 < t2.length; n2++) {
    const r2 = t2[n2], i2 = e2[n2];
    if (r2 > i2) return false;
    if (r2 < i2) return true;
  }
}
function Ct(t2) {
  const e2 = t2 >>> 0;
  Mt = e2, Pt = (t2 - e2) / 4294967296 >>> 0;
}
function Ot(t2) {
  if (t2 < 0) {
    Ct(-t2);
    const [e2, n2] = Xt(Mt, Pt);
    Mt = e2 >>> 0, Pt = n2 >>> 0;
  } else Ct(t2);
}
function Ut(t2) {
  const e2 = It || (It = new DataView(new ArrayBuffer(8)));
  e2.setFloat32(0, +t2, true), Pt = 0, Mt = e2.getUint32(0, true);
}
function Dt(t2, e2) {
  const n2 = 4294967296 * e2 + (t2 >>> 0);
  return Number.isSafeInteger(n2) ? n2 : Bt(t2, e2);
}
function Nt(t2, e2) {
  const n2 = 2147483648 & e2;
  return n2 && (e2 = ~e2 >>> 0, 0 == (t2 = 1 + ~t2 >>> 0) && (e2 = e2 + 1 >>> 0)), "number" == typeof (t2 = Dt(t2, e2)) ? n2 ? -t2 : t2 : n2 ? "-" + t2 : t2;
}
function Bt(t2, e2) {
  if (t2 >>>= 0, (e2 >>>= 0) <= 2097151) var n2 = "" + (4294967296 * e2 + t2);
  else at() ? n2 = "" + (BigInt(e2) << BigInt(32) | BigInt(t2)) : (t2 = (16777215 & t2) + 6777216 * (n2 = 16777215 & (t2 >>> 24 | e2 << 8)) + 6710656 * (e2 = e2 >> 16 & 65535), n2 += 8147497 * e2, e2 *= 2, t2 >= 1e7 && (n2 += t2 / 1e7 >>> 0, t2 %= 1e7), n2 >= 1e7 && (e2 += n2 / 1e7 >>> 0, n2 %= 1e7), n2 = e2 + Gt(n2) + Gt(t2));
  return n2;
}
function Gt(t2) {
  return t2 = String(t2), "0000000".slice(t2.length) + t2;
}
function jt() {
  var t2 = Mt, e2 = Pt;
  if (2147483648 & e2) if (at()) t2 = "" + (BigInt(0 | e2) << BigInt(32) | BigInt(t2 >>> 0));
  else {
    const [n2, r2] = Xt(t2, e2);
    t2 = "-" + Bt(n2, r2);
  }
  else t2 = Bt(t2, e2);
  return t2;
}
function Vt(t2) {
  if (t2.length < 16) Ot(Number(t2));
  else if (at()) t2 = BigInt(t2), Mt = Number(t2 & BigInt(4294967295)) >>> 0, Pt = Number(t2 >> BigInt(32) & BigInt(4294967295));
  else {
    const e2 = +("-" === t2[0]);
    Pt = Mt = 0;
    const n2 = t2.length;
    for (let r2 = e2, i2 = (n2 - e2) % 6 + e2; i2 <= n2; r2 = i2, i2 += 6) {
      const e3 = Number(t2.slice(r2, i2));
      Pt *= 1e6, Mt = 1e6 * Mt + e3, Mt >= 4294967296 && (Pt += Math.trunc(Mt / 4294967296), Pt >>>= 0, Mt >>>= 0);
    }
    if (e2) {
      const [t3, e3] = Xt(Mt, Pt);
      Mt = t3, Pt = e3;
    }
  }
}
function Xt(t2, e2) {
  return e2 = ~e2, t2 ? t2 = 1 + ~t2 : e2 += 1, [t2, e2];
}
function qt(t2) {
  return null == t2 || "number" == typeof t2 ? t2 : "NaN" === t2 || "Infinity" === t2 || "-Infinity" === t2 ? Number(t2) : void 0;
}
function Jt(t2) {
  return null == t2 || "boolean" == typeof t2 ? t2 : "number" == typeof t2 ? !!t2 : void 0;
}
function Qt(t2) {
  switch (typeof t2) {
    case "bigint":
      return true;
    case "number":
      return Kt(t2);
    case "string":
      return Zt.test(t2);
    default:
      return false;
  }
}
function te(t2) {
  if (null == t2) return t2;
  if ("string" == typeof t2 && t2) t2 = +t2;
  else if ("number" != typeof t2) return;
  return Kt(t2) ? 0 | t2 : void 0;
}
function ee(t2) {
  if (null == t2) return t2;
  if ("string" == typeof t2 && t2) t2 = +t2;
  else if ("number" != typeof t2) return;
  return Kt(t2) ? t2 >>> 0 : void 0;
}
function ne(t2) {
  if ("-" === t2[0]) return false;
  const e2 = t2.length;
  return e2 < 20 || 20 === e2 && Number(t2.substring(0, 6)) < 184467;
}
function re(t2) {
  const e2 = t2.length;
  return "-" === t2[0] ? e2 < 20 || 20 === e2 && Number(t2.substring(0, 7)) > -922337 : e2 < 19 || 19 === e2 && Number(t2.substring(0, 6)) < 922337;
}
function ie(t2) {
  return re(t2) ? t2 : (Vt(t2), jt());
}
function se(t2) {
  return t2 = Yt(t2), zt(t2) || (Ot(t2), t2 = Nt(Mt, Pt)), t2;
}
function oe(t2) {
  var e2 = Yt(Number(t2));
  return zt(e2) ? String(e2) : (-1 !== (e2 = t2.indexOf(".")) && (t2 = t2.substring(0, e2)), ie(t2));
}
function ae(t2) {
  var e2 = Yt(Number(t2));
  return zt(e2) ? At(e2) : (-1 !== (e2 = t2.indexOf(".")) && (t2 = t2.substring(0, e2)), at() ? At(Ht(64, BigInt(t2))) : At(ie(t2)));
}
function ce(t2) {
  if (zt(t2)) t2 = At(se(t2));
  else {
    if (t2 = Yt(t2), zt(t2)) t2 = String(t2);
    else {
      const e2 = String(t2);
      re(e2) ? t2 = e2 : (Ot(t2), t2 = jt());
    }
    t2 = At(t2);
  }
  return t2;
}
function he(t2) {
  return null == t2 ? t2 : "bigint" == typeof t2 ? (bt(t2) ? t2 = Number(t2) : (t2 = Ht(64, t2), t2 = bt(t2) ? Number(t2) : String(t2)), t2) : Qt(t2) ? "number" == typeof t2 ? se(t2) : oe(t2) : void 0;
}
function ue(t2) {
  if (null == t2) return t2;
  var e2 = typeof t2;
  if ("bigint" === e2) return String(Wt(64, t2));
  if (Qt(t2)) {
    if ("string" === e2) return e2 = Yt(Number(t2)), zt(e2) && e2 >= 0 ? t2 = String(e2) : (-1 !== (e2 = t2.indexOf(".")) && (t2 = t2.substring(0, e2)), ne(t2) || (Vt(t2), t2 = Bt(Mt, Pt))), t2;
    if ("number" === e2) return (t2 = Yt(t2)) >= 0 && zt(t2) ? t2 : (function(t3) {
      if (t3 < 0) {
        Ot(t3);
        var e3 = Bt(Mt, Pt);
        return t3 = Number(e3), zt(t3) ? t3 : e3;
      }
      return ne(e3 = String(t3)) ? e3 : (Ot(t3), Dt(Mt, Pt));
    })(t2);
  }
}
function le(t2) {
  if ("string" != typeof t2) throw Error();
  return t2;
}
function de(t2) {
  if (null != t2 && "string" != typeof t2) throw Error();
  return t2;
}
function fe(t2) {
  return null == t2 || "string" == typeof t2 ? t2 : void 0;
}
function pe(t2, e2, n2, r2) {
  if (null != t2 && "object" == typeof t2 && t2.W === ut) return t2;
  if (!Array.isArray(t2)) return n2 ? 2 & r2 ? ((t2 = e2[Y]) || (it((t2 = new e2()).u), t2 = e2[Y] = t2), e2 = t2) : e2 = new e2() : e2 = void 0, e2;
  let i2 = n2 = 0 | t2[Q];
  return 0 === i2 && (i2 |= 32 & r2), i2 |= 2 & r2, i2 !== n2 && rt(t2, i2), new e2(t2);
}
function ge(t2, e2, n2) {
  if (e2) t: {
    if (!Qt(e2 = t2)) throw X("int64");
    switch (typeof e2) {
      case "string":
        e2 = ae(e2);
        break t;
      case "bigint":
        e2 = At(Ht(64, e2));
        break t;
      default:
        e2 = ce(e2);
    }
  }
  else t2 = typeof (e2 = t2), e2 = null == e2 ? e2 : "bigint" === t2 ? At(Ht(64, e2)) : Qt(e2) ? "string" === t2 ? ae(e2) : ce(e2) : void 0;
  return null == (t2 = e2) ? n2 ? $t : void 0 : t2;
}
function me(t2) {
  return t2;
}
function we(t2) {
  return t2;
}
function Te(t2) {
  if (2 & t2.M) throw Error("Cannot mutate an immutable Map");
}
function be(t2, e2, n2, r2, i2, s2) {
  return t2 = pe(t2, r2, n2, s2), i2 && (t2 = je(t2)), t2;
}
function ke(t2) {
  return t2;
}
function Se(t2) {
  return [t2, this.get(t2)];
}
function Ie() {
  return xe || (xe = new Ae(it([]), void 0, void 0, void 0, ye));
}
function Me(t2, e2, n2, r2, i2) {
  if (null != t2) {
    if (Array.isArray(t2)) {
      const s2 = 0 | t2[Q];
      return 0 === t2.length && 1 & s2 ? void 0 : i2 && 2 & s2 ? t2 : Pe(t2, e2, n2, void 0 !== r2, i2);
    }
    return e2(t2, r2);
  }
}
function Pe(t2, e2, n2, r2, i2) {
  const s2 = r2 || n2 ? 0 | t2[Q] : 0, o2 = r2 ? !!(32 & s2) : void 0;
  let a2 = 0;
  const c2 = (r2 = ct(t2)).length;
  for (let t3 = 0; t3 < c2; t3++) {
    var h2 = r2[t3];
    if (t3 === c2 - 1 && lt(h2)) {
      var u2 = e2, l = n2, d = o2, f = i2;
      let t4;
      for (let e3 in h2) {
        const n3 = Me(h2[e3], u2, l, d, f);
        null != n3 && ((t4 ?? (t4 = {}))[e3] = n3);
      }
      h2 = t4;
    } else h2 = Me(r2[t3], e2, n2, o2, i2);
    r2[t3] = h2, null != h2 && (a2 = t3 + 1);
  }
  return a2 < c2 && (r2.length = a2), n2 && ((t2 = mt(t2)) && (r2[q] = ct(t2)), n2(s2, r2)), r2;
}
function Ce(t2) {
  return Me(t2, Oe, void 0, void 0, false);
}
function Oe(t2) {
  switch (typeof t2) {
    case "number":
      return Number.isFinite(t2) ? t2 : "" + t2;
    case "bigint":
      return bt(t2) ? Number(t2) : "" + t2;
    case "boolean":
      return t2 ? 1 : 0;
    case "object":
      if (C(t2)) return C(t2) && H(Z), R(t2);
      if (t2.W === ut) return Ue(t2);
      if (t2 instanceof N) {
        const e2 = t2.g;
        return null == e2 ? "" : "string" == typeof e2 ? e2 : t2.g = R(e2);
      }
      return t2 instanceof Ae ? t2.La() : void 0;
  }
  return t2;
}
function Ue(t2) {
  var e2 = t2.u;
  t2 = Pe(e2, Oe, void 0, void 0, false);
  var n2 = 0 | e2[Q];
  if ((e2 = t2.length) && !(512 & n2)) {
    var r2 = t2[e2 - 1], i2 = false;
    lt(r2) ? (e2--, i2 = true) : r2 = void 0;
    var s2 = e2 - (n2 = 512 & n2 ? 0 : -1), o2 = (Le ?? me)(s2, n2, t2, r2);
    if (r2 && (t2[e2] = void 0), s2 < o2 && r2) {
      for (var a2 in s2 = true, r2) {
        const c2 = +a2;
        c2 <= o2 ? (t2[i2 = c2 + n2] = r2[a2], e2 = Math.max(i2 + 1, e2), i2 = false, delete r2[a2]) : s2 = false;
      }
      s2 && (r2 = void 0);
    }
    for (s2 = e2 - 1; e2 > 0; s2 = e2 - 1) if (null == (a2 = t2[s2])) e2--, i2 = true;
    else {
      if (!((s2 -= n2) >= o2)) break;
      (r2 ?? (r2 = {}))[s2] = a2, e2--, i2 = true;
    }
    i2 && (t2.length = e2), r2 && t2.push(r2);
  }
  return t2;
}
function De(t2, e2, n2) {
  return t2 = Ne(t2, e2[0], e2[1], n2 ? 1 : 2), e2 !== Re && n2 && nt(t2, 8192), t2;
}
function Ne(t2, e2, n2, r2) {
  if (null == t2) {
    var i2 = 96;
    n2 ? (t2 = [n2], i2 |= 512) : t2 = [], e2 && (i2 = -16760833 & i2 | (1023 & e2) << 14);
  } else {
    if (!Array.isArray(t2)) throw Error("narr");
    if (8192 & (i2 = 0 | t2[Q]) || !(64 & i2) || 2 & i2 || H(J), 1024 & i2) throw Error("farr");
    if (64 & i2) return t2;
    if (1 === r2 || 2 === r2 || (i2 |= 64), n2 && (i2 |= 512, n2 !== t2[0])) throw Error("mid");
    t: {
      var s2 = (n2 = t2).length;
      if (s2) {
        var o2 = s2 - 1;
        if (lt(r2 = n2[o2])) {
          if ((o2 -= e2 = 512 & (i2 |= 256) ? 0 : -1) >= 1024) throw Error("pvtlmt");
          for (var a2 in r2) (s2 = +a2) < o2 && (n2[s2 + e2] = r2[a2], delete r2[a2]);
          i2 = -16760833 & i2 | (1023 & o2) << 14;
          break t;
        }
      }
      if (e2) {
        if ((a2 = Math.max(e2, s2 - (512 & i2 ? 0 : -1))) > 1024) throw Error("spvt");
        i2 = -16760833 & i2 | (1023 & a2) << 14;
      }
    }
  }
  return rt(t2, i2), t2;
}
function Be(t2, e2, n2 = ot) {
  if (null != t2) {
    if (x && t2 instanceof Uint8Array) return e2 ? t2 : new Uint8Array(t2);
    if (Array.isArray(t2)) {
      var r2 = 0 | t2[Q];
      return 2 & r2 ? t2 : (e2 && (e2 = 0 === r2 || !!(32 & r2) && !(64 & r2 || !(16 & r2))), e2 ? (rt(t2, 34 | r2), 4 & r2 && Object.freeze(t2), t2) : Pe(t2, Be, 4 & r2 ? ot : n2, true, true));
    }
    return t2.W === ut ? t2 = 2 & (r2 = 0 | (n2 = t2.u)[Q]) ? t2 : new t2.constructor(Ge(n2, r2, true)) : t2 instanceof Ae && !(2 & t2.M) && (n2 = it(t2.da(Be)), t2 = new Ae(n2, t2.I, t2.S, t2.X)), t2;
  }
}
function Ge(t2, e2, n2) {
  const r2 = n2 || 2 & e2 ? ot : st, i2 = !!(32 & e2);
  return t2 = (function(t3, e3, n3) {
    const r3 = ct(t3);
    var i3 = r3.length;
    const s2 = 256 & e3 ? r3[i3 - 1] : void 0;
    for (i3 += s2 ? -1 : 0, e3 = 512 & e3 ? 1 : 0; e3 < i3; e3++) r3[e3] = n3(r3[e3]);
    if (s2) {
      e3 = r3[e3] = {};
      for (const t4 in s2) e3[t4] = n3(s2[t4]);
    }
    return (t3 = mt(t3)) && (r3[q] = ct(t3)), r3;
  })(t2, e2, ((t3) => Be(t3, i2, r2))), nt(t2, 32 | (n2 ? 2 : 0)), t2;
}
function je(t2) {
  const e2 = t2.u, n2 = 0 | e2[Q];
  return 2 & n2 ? new t2.constructor(Ge(e2, n2, false)) : t2;
}
function Ve(t2, e2) {
  return Xe(t2 = t2.u, 0 | t2[Q], e2);
}
function Xe(t2, e2, n2) {
  if (-1 === n2) return null;
  const r2 = n2 + (512 & e2 ? 0 : -1), i2 = t2.length - 1;
  return r2 >= i2 && 256 & e2 ? t2[i2][n2] : r2 <= i2 ? t2[r2] : void 0;
}
function He(t2, e2, n2) {
  const r2 = t2.u;
  let i2 = 0 | r2[Q];
  return pt(i2), We(r2, i2, e2, n2), t2;
}
function We(t2, e2, n2, r2) {
  const i2 = 512 & e2 ? 0 : -1, s2 = n2 + i2;
  var o2 = t2.length - 1;
  return s2 >= o2 && 256 & e2 ? (t2[o2][n2] = r2, e2) : s2 <= o2 ? (t2[s2] = r2, e2) : (void 0 !== r2 && (n2 >= (o2 = e2 >> 14 & 1023 || 536870912) ? null != r2 && (t2[o2 + i2] = { [n2]: r2 }, rt(t2, e2 |= 256)) : t2[s2] = r2), e2);
}
function ze(t2, e2) {
  let n2 = 0 | (t2 = t2.u)[Q];
  const r2 = Xe(t2, n2, e2), i2 = qt(r2);
  return null != i2 && i2 !== r2 && We(t2, n2, e2, i2), i2;
}
function Ke(t2) {
  let e2 = 0 | (t2 = t2.u)[Q];
  const n2 = Xe(t2, e2, 1), r2 = dt(n2, true);
  return null != r2 && r2 !== n2 && We(t2, e2, 1, r2), r2;
}
function Ye() {
  return void 0 === yt ? 2 : 4;
}
function $e(t2, e2, n2, r2, i2) {
  const s2 = t2.u, o2 = 2 & (t2 = 0 | s2[Q]) ? 1 : r2;
  i2 = !!i2;
  let a2 = 0 | (r2 = qe(s2, t2, e2))[Q];
  if (!(4 & a2)) {
    4 & a2 && (r2 = ct(r2), a2 = pn(a2, t2), t2 = We(s2, t2, e2, r2));
    let i3 = 0, o3 = 0;
    for (; i3 < r2.length; i3++) {
      const t3 = n2(r2[i3]);
      null != t3 && (r2[o3++] = t3);
    }
    o3 < i3 && (r2.length = o3), a2 = Je(a2, t2), n2 = -2049 & (20 | a2), a2 = n2 &= -4097, rt(r2, a2), 2 & a2 && Object.freeze(r2);
  }
  return 1 === o2 || 4 === o2 && 32 & a2 ? Ze(a2) || (i2 = a2, a2 |= 2, a2 !== i2 && rt(r2, a2), Object.freeze(r2)) : (2 === o2 && Ze(a2) && (r2 = ct(r2), a2 = pn(a2, t2), a2 = gn(a2, t2, i2), rt(r2, a2), t2 = We(s2, t2, e2, r2)), Ze(a2) || (e2 = a2, a2 = gn(a2, t2, i2), a2 !== e2 && rt(r2, a2))), r2;
}
function qe(t2, e2, n2) {
  return t2 = Xe(t2, e2, n2), Array.isArray(t2) ? t2 : ht;
}
function Je(t2, e2) {
  return 0 === t2 && (t2 = pn(t2, e2)), 1 | t2;
}
function Ze(t2) {
  return !!(2 & t2) && !!(4 & t2) || !!(1024 & t2);
}
function Qe(t2) {
  t2 = ct(t2);
  for (let e2 = 0; e2 < t2.length; e2++) {
    const n2 = t2[e2] = ct(t2[e2]);
    Array.isArray(n2[1]) && (n2[1] = it(n2[1]));
  }
  return t2;
}
function tn(t2, e2, n2, r2) {
  let i2 = 0 | (t2 = t2.u)[Q];
  pt(i2), We(t2, i2, e2, ("0" === r2 ? 0 === Number(n2) : n2 === r2) ? void 0 : n2);
}
function en(t2, e2, n2, r2) {
  pt(e2);
  let i2 = qe(t2, e2, n2);
  const s2 = i2 !== ht;
  if (64 & e2 || !(8192 & e2) || !s2) {
    const o2 = s2 ? 0 | i2[Q] : 0;
    let a2 = o2;
    (!s2 || 2 & a2 || Ze(a2) || 4 & a2 && !(32 & a2)) && (i2 = ct(i2), a2 = pn(a2, e2), e2 = We(t2, e2, n2, i2)), a2 = -13 & Je(a2, e2), a2 = gn(r2 ? -17 & a2 : 16 | a2, e2, true), a2 !== o2 && rt(i2, a2);
  }
  return i2;
}
function nn(t2, e2) {
  var n2 = Ts;
  return on(rn(t2 = t2.u), t2, 0 | t2[Q], n2) === e2 ? e2 : -1;
}
function rn(t2) {
  if (W) return t2[$] ?? (t2[$] = /* @__PURE__ */ new Map());
  if ($ in t2) return t2[$];
  const e2 = /* @__PURE__ */ new Map();
  return Object.defineProperty(t2, $, { value: e2 }), e2;
}
function sn(t2, e2, n2, r2) {
  const i2 = rn(t2), s2 = on(i2, t2, e2, n2);
  return s2 !== r2 && (s2 && (e2 = We(t2, e2, s2)), i2.set(n2, r2)), e2;
}
function on(t2, e2, n2, r2) {
  let i2 = t2.get(r2);
  if (null != i2) return i2;
  i2 = 0;
  for (let t3 = 0; t3 < r2.length; t3++) {
    const s2 = r2[t3];
    null != Xe(e2, n2, s2) && (0 !== i2 && (n2 = We(e2, n2, i2)), i2 = s2);
  }
  return t2.set(r2, i2), i2;
}
function an(t2, e2, n2) {
  let r2 = 0 | t2[Q];
  const i2 = Xe(t2, r2, n2);
  let s2;
  if (null != i2 && i2.W === ut) return (e2 = je(i2)) !== i2 && We(t2, r2, n2, e2), e2.u;
  if (Array.isArray(i2)) {
    const t3 = 0 | i2[Q];
    s2 = 2 & t3 ? De(Ge(i2, t3, false), e2, true) : 64 & t3 ? i2 : De(s2, e2, true);
  } else s2 = De(void 0, e2, true);
  return s2 !== i2 && We(t2, r2, n2, s2), s2;
}
function cn(t2, e2, n2) {
  let r2 = 0 | (t2 = t2.u)[Q];
  const i2 = Xe(t2, r2, n2);
  return (e2 = pe(i2, e2, false, r2)) !== i2 && null != e2 && We(t2, r2, n2, e2), e2;
}
function hn(t2, e2, n2) {
  if (null == (e2 = cn(t2, e2, n2))) return e2;
  let r2 = 0 | (t2 = t2.u)[Q];
  if (!(2 & r2)) {
    const i2 = je(e2);
    i2 !== e2 && We(t2, r2, n2, e2 = i2);
  }
  return e2;
}
function un(t2, e2, n2, r2, i2, s2, o2) {
  t2 = t2.u;
  var a2 = !!(2 & e2);
  const c2 = a2 ? 1 : i2;
  s2 = !!s2, o2 && (o2 = !a2);
  var h2 = 0 | (i2 = qe(t2, e2, r2))[Q];
  if (!(a2 = !!(4 & h2))) {
    var u2 = i2, l = e2;
    const t3 = !!(2 & (h2 = Je(h2, e2)));
    t3 && (l |= 2);
    let r3 = !t3, s3 = true, o3 = 0, a3 = 0;
    for (; o3 < u2.length; o3++) {
      const e3 = pe(u2[o3], n2, false, l);
      if (e3 instanceof n2) {
        if (!t3) {
          const t4 = !!(2 & (0 | e3.u[Q]));
          r3 && (r3 = !t4), s3 && (s3 = t4);
        }
        u2[a3++] = e3;
      }
    }
    a3 < o3 && (u2.length = a3), h2 |= 4, h2 = s3 ? 16 | h2 : -17 & h2, rt(u2, h2 = r3 ? 8 | h2 : -9 & h2), t3 && Object.freeze(u2);
  }
  if (o2 && !(8 & h2 || !i2.length && (1 === c2 || 4 === c2 && 32 & h2))) {
    for (Ze(h2) && (i2 = ct(i2), h2 = pn(h2, e2), e2 = We(t2, e2, r2, i2)), n2 = i2, o2 = h2, u2 = 0; u2 < n2.length; u2++) (h2 = n2[u2]) !== (l = je(h2)) && (n2[u2] = l);
    o2 |= 8, rt(n2, o2 = n2.length ? -17 & o2 : 16 | o2), h2 = o2;
  }
  return 1 === c2 || 4 === c2 && 32 & h2 ? Ze(h2) || (e2 = h2, (h2 |= !i2.length || 16 & h2 && (!a2 || 32 & h2) ? 2 : 1024) !== e2 && rt(i2, h2), Object.freeze(i2)) : (2 === c2 && Ze(h2) && (rt(i2 = ct(i2), h2 = gn(h2 = pn(h2, e2), e2, s2)), e2 = We(t2, e2, r2, i2)), Ze(h2) || (r2 = h2, (h2 = gn(h2, e2, s2)) !== r2 && rt(i2, h2))), i2;
}
function ln(t2, e2, n2) {
  const r2 = 0 | t2.u[Q];
  return un(t2, r2, e2, n2, Ye(), false, !(2 & r2));
}
function dn(t2, e2, n2, r2) {
  return null == r2 && (r2 = void 0), He(t2, n2, r2);
}
function fn(t2, e2, n2, r2) {
  null == r2 && (r2 = void 0);
  t: {
    let i2 = 0 | (t2 = t2.u)[Q];
    if (pt(i2), null == r2) {
      const r3 = rn(t2);
      if (on(r3, t2, i2, n2) !== e2) break t;
      r3.set(n2, 0);
    } else i2 = sn(t2, i2, n2, e2);
    We(t2, i2, e2, r2);
  }
}
function pn(t2, e2) {
  return -1025 & (t2 = 32 | (2 & e2 ? 2 | t2 : -3 & t2));
}
function gn(t2, e2, n2) {
  return 32 & e2 && n2 || (t2 &= -33), t2;
}
function mn(t2, e2, n2) {
  pt(0 | t2.u[Q]), $e(t2, e2, fe, 2, true).push(le(n2));
}
function yn(t2, e2, n2, r2) {
  const i2 = 0 | t2.u[Q];
  pt(i2), t2 = un(t2, i2, n2, e2, 2, true), r2 = null != r2 ? r2 : new n2(), t2.push(r2), t2[Q] = 2 & (0 | r2.u[Q]) ? -9 & t2[Q] : -17 & t2[Q];
}
function _n(t2, e2) {
  return te(Ve(t2, e2));
}
function vn(t2, e2) {
  return fe(Ve(t2, e2));
}
function En(t2, e2) {
  return ze(t2, e2) ?? 0;
}
function wn(t2, e2, n2) {
  if (null != n2 && "boolean" != typeof n2) throw t2 = typeof n2, Error(`Expected boolean but got ${"object" != t2 ? t2 : n2 ? Array.isArray(n2) ? "array" : t2 : "null"}: ${n2}`);
  He(t2, e2, n2);
}
function Tn(t2, e2, n2) {
  if (null != n2) {
    if ("number" != typeof n2) throw X("int32");
    if (!Kt(n2)) throw X("int32");
    n2 |= 0;
  }
  He(t2, e2, n2);
}
function An(t2, e2, n2) {
  if (null != n2 && "number" != typeof n2) throw Error(`Value of float/double field must be a number, found ${typeof n2}: ${n2}`);
  He(t2, e2, n2);
}
function bn(t2, e2, n2) {
  {
    const o2 = t2.u;
    let a2 = 0 | o2[Q];
    if (pt(a2), null == n2) We(o2, a2, e2);
    else {
      var r2 = t2 = 0 | n2[Q], i2 = Ze(t2), s2 = i2 || Object.isFrozen(n2);
      for (i2 || (t2 = 0), s2 || (n2 = ct(n2), r2 = 0, t2 = gn(t2 = pn(t2, a2), a2, true), s2 = false), t2 |= 21, i2 = 0; i2 < n2.length; i2++) {
        const e3 = n2[i2], o3 = le(e3);
        Object.is(e3, o3) || (s2 && (n2 = ct(n2), r2 = 0, t2 = gn(t2 = pn(t2, a2), a2, true), s2 = false), n2[i2] = o3);
      }
      t2 !== r2 && (s2 && (n2 = ct(n2), t2 = gn(t2 = pn(t2, a2), a2, true)), rt(n2, t2)), We(o2, a2, e2, n2);
    }
  }
}
function kn(t2, e2) {
  return Error(`Invalid wire type: ${t2} (at position ${e2})`);
}
function Sn() {
  return Error("Failed to read varint, encoding is invalid.");
}
function xn(t2, e2) {
  return Error(`Tried to read past the end of the data ${e2} > ${t2}`);
}
function Ln(t2) {
  if ("string" == typeof t2) return { buffer: P(t2), O: false };
  if (Array.isArray(t2)) return { buffer: new Uint8Array(t2), O: false };
  if (t2.constructor === Uint8Array) return { buffer: t2, O: false };
  if (t2.constructor === ArrayBuffer) return { buffer: new Uint8Array(t2), O: false };
  if (t2.constructor === N) return { buffer: D(t2) || new Uint8Array(0), O: true };
  if (t2 instanceof Uint8Array) return { buffer: new Uint8Array(t2.buffer, t2.byteOffset, t2.byteLength), O: false };
  throw Error("Type not convertible to a Uint8Array, expected a Uint8Array, an ArrayBuffer, a base64 encoded string, a ByteString or an Array of numbers");
}
function Rn(t2, e2) {
  let n2, r2 = 0, i2 = 0, s2 = 0;
  const o2 = t2.h;
  let a2 = t2.g;
  do {
    n2 = o2[a2++], r2 |= (127 & n2) << s2, s2 += 7;
  } while (s2 < 32 && 128 & n2);
  for (s2 > 32 && (i2 |= (127 & n2) >> 4), s2 = 3; s2 < 32 && 128 & n2; s2 += 7) n2 = o2[a2++], i2 |= (127 & n2) << s2;
  if (Dn(t2, a2), n2 < 128) return e2(r2 >>> 0, i2 >>> 0);
  throw Sn();
}
function Fn(t2) {
  let e2 = 0, n2 = t2.g;
  const r2 = n2 + 10, i2 = t2.h;
  for (; n2 < r2; ) {
    const r3 = i2[n2++];
    if (e2 |= r3, 0 == (128 & r3)) return Dn(t2, n2), !!(127 & e2);
  }
  throw Sn();
}
function In(t2) {
  const e2 = t2.h;
  let n2 = t2.g, r2 = e2[n2++], i2 = 127 & r2;
  if (128 & r2 && (r2 = e2[n2++], i2 |= (127 & r2) << 7, 128 & r2 && (r2 = e2[n2++], i2 |= (127 & r2) << 14, 128 & r2 && (r2 = e2[n2++], i2 |= (127 & r2) << 21, 128 & r2 && (r2 = e2[n2++], i2 |= r2 << 28, 128 & r2 && 128 & e2[n2++] && 128 & e2[n2++] && 128 & e2[n2++] && 128 & e2[n2++] && 128 & e2[n2++]))))) throw Sn();
  return Dn(t2, n2), i2;
}
function Mn(t2) {
  return In(t2) >>> 0;
}
function Pn(t2) {
  var e2 = t2.h;
  const n2 = t2.g, r2 = e2[n2], i2 = e2[n2 + 1], s2 = e2[n2 + 2];
  return e2 = e2[n2 + 3], Dn(t2, t2.g + 4), (r2 << 0 | i2 << 8 | s2 << 16 | e2 << 24) >>> 0;
}
function Cn(t2) {
  var e2 = Pn(t2);
  t2 = 2 * (e2 >> 31) + 1;
  const n2 = e2 >>> 23 & 255;
  return e2 &= 8388607, 255 == n2 ? e2 ? NaN : t2 * (1 / 0) : 0 == n2 ? 1401298464324817e-60 * t2 * e2 : t2 * Math.pow(2, n2 - 150) * (e2 + 8388608);
}
function On(t2) {
  return In(t2);
}
function Un(t2, e2, { aa: n2 = false } = {}) {
  t2.aa = n2, e2 && (e2 = Ln(e2), t2.h = e2.buffer, t2.m = e2.O, t2.j = 0, t2.l = t2.h.length, t2.g = t2.j);
}
function Dn(t2, e2) {
  if (t2.g = e2, e2 > t2.l) throw xn(t2.l, e2);
}
function Nn(t2, e2) {
  if (e2 < 0) throw Error(`Tried to read a negative byte length: ${e2}`);
  const n2 = t2.g, r2 = n2 + e2;
  if (r2 > t2.l) throw xn(e2, t2.l - n2);
  return t2.g = r2, n2;
}
function Bn(t2, e2) {
  if (0 == e2) return U();
  var n2 = Nn(t2, e2);
  return t2.aa && t2.m ? n2 = t2.h.subarray(n2, n2 + e2) : (t2 = t2.h, n2 = n2 === (e2 = n2 + e2) ? new Uint8Array(0) : Ft ? t2.slice(n2, e2) : new Uint8Array(t2.subarray(n2, e2))), 0 == n2.length ? U() : new N(n2, O);
}
function jn(t2) {
  var e2 = t2.g;
  if (e2.g == e2.l) return false;
  t2.l = t2.g.g;
  var n2 = Mn(t2.g);
  if (e2 = n2 >>> 3, !((n2 &= 7) >= 0 && n2 <= 5)) throw kn(n2, t2.l);
  if (e2 < 1) throw Error(`Invalid field number: ${e2} (at position ${t2.l})`);
  return t2.m = e2, t2.h = n2, true;
}
function Vn(t2) {
  switch (t2.h) {
    case 0:
      0 != t2.h ? Vn(t2) : Fn(t2.g);
      break;
    case 1:
      Dn(t2 = t2.g, t2.g + 8);
      break;
    case 2:
      if (2 != t2.h) Vn(t2);
      else {
        var e2 = Mn(t2.g);
        Dn(t2 = t2.g, t2.g + e2);
      }
      break;
    case 5:
      Dn(t2 = t2.g, t2.g + 4);
      break;
    case 3:
      for (e2 = t2.m; ; ) {
        if (!jn(t2)) throw Error("Unmatched start-group tag: stream EOF");
        if (4 == t2.h) {
          if (t2.m != e2) throw Error("Unmatched end-group tag");
          break;
        }
        Vn(t2);
      }
      break;
    default:
      throw kn(t2.h, t2.l);
  }
}
function Xn(t2, e2, n2) {
  const r2 = t2.g.l, i2 = Mn(t2.g), s2 = t2.g.g + i2;
  let o2 = s2 - r2;
  if (o2 <= 0 && (t2.g.l = s2, n2(e2, t2, void 0, void 0, void 0), o2 = s2 - t2.g.g), o2) throw Error(`Message parsing ended unexpectedly. Expected to read ${i2} bytes, instead read ${i2 - o2} bytes, either the data ended unexpectedly or the message misreported its own length`);
  return t2.g.g = s2, t2.g.l = r2, e2;
}
function Hn(t2) {
  var o2 = Mn(t2.g), a2 = Nn(t2 = t2.g, o2);
  if (t2 = t2.h, s) {
    var c2, h2 = t2;
    (c2 = i) || (c2 = i = new TextDecoder("utf-8", { fatal: true })), o2 = a2 + o2, h2 = 0 === a2 && o2 === h2.length ? h2 : h2.subarray(a2, o2);
    try {
      var u2 = c2.decode(h2);
    } catch (t3) {
      if (void 0 === r) {
        try {
          c2.decode(new Uint8Array([128]));
        } catch (t4) {
        }
        try {
          c2.decode(new Uint8Array([97])), r = true;
        } catch (t4) {
          r = false;
        }
      }
      throw !r && (i = void 0), t3;
    }
  } else {
    o2 = (u2 = a2) + o2, a2 = [];
    let r2, i2 = null;
    for (; u2 < o2; ) {
      var l = t2[u2++];
      l < 128 ? a2.push(l) : l < 224 ? u2 >= o2 ? e() : (r2 = t2[u2++], l < 194 || 128 != (192 & r2) ? (u2--, e()) : a2.push((31 & l) << 6 | 63 & r2)) : l < 240 ? u2 >= o2 - 1 ? e() : (r2 = t2[u2++], 128 != (192 & r2) || 224 === l && r2 < 160 || 237 === l && r2 >= 160 || 128 != (192 & (c2 = t2[u2++])) ? (u2--, e()) : a2.push((15 & l) << 12 | (63 & r2) << 6 | 63 & c2)) : l <= 244 ? u2 >= o2 - 2 ? e() : (r2 = t2[u2++], 128 != (192 & r2) || r2 - 144 + (l << 28) >> 30 != 0 || 128 != (192 & (c2 = t2[u2++])) || 128 != (192 & (h2 = t2[u2++])) ? (u2--, e()) : (l = (7 & l) << 18 | (63 & r2) << 12 | (63 & c2) << 6 | 63 & h2, l -= 65536, a2.push(55296 + (l >> 10 & 1023), 56320 + (1023 & l)))) : e(), a2.length >= 8192 && (i2 = n(i2, a2), a2.length = 0);
    }
    u2 = n(i2, a2);
  }
  return u2;
}
function Wn(t2) {
  const e2 = Mn(t2.g);
  return Bn(t2.g, e2);
}
function zn(t2, e2, n2) {
  var r2 = Mn(t2.g);
  for (r2 = t2.g.g + r2; t2.g.g < r2; ) n2.push(e2(t2.g));
}
function Yn(t2, e2, n2) {
  e2.g ? e2.m(t2, e2.g, e2.h, n2) : e2.m(t2, e2.h, n2);
}
function qn(t2) {
  return t2 ? /^\d+$/.test(t2) ? (Vt(t2), new Jn(Mt, Pt)) : null : Zn || (Zn = new Jn(0, 0));
}
function Qn(t2) {
  return t2 ? /^-?\d+$/.test(t2) ? (Vt(t2), new tr(Mt, Pt)) : null : er || (er = new tr(0, 0));
}
function nr(t2, e2, n2) {
  for (; n2 > 0 || e2 > 127; ) t2.g.push(127 & e2 | 128), e2 = (e2 >>> 7 | n2 << 25) >>> 0, n2 >>>= 7;
  t2.g.push(e2);
}
function rr(t2, e2) {
  for (; e2 > 127; ) t2.g.push(127 & e2 | 128), e2 >>>= 7;
  t2.g.push(e2);
}
function ir(t2, e2) {
  if (e2 >= 0) rr(t2, e2);
  else {
    for (let n2 = 0; n2 < 9; n2++) t2.g.push(127 & e2 | 128), e2 >>= 7;
    t2.g.push(1);
  }
}
function sr(t2, e2) {
  t2.g.push(e2 >>> 0 & 255), t2.g.push(e2 >>> 8 & 255), t2.g.push(e2 >>> 16 & 255), t2.g.push(e2 >>> 24 & 255);
}
function or2(t2, e2) {
  0 !== e2.length && (t2.l.push(e2), t2.h += e2.length);
}
function ar(t2, e2, n2) {
  rr(t2.g, 8 * e2 + n2);
}
function cr(t2, e2) {
  return ar(t2, e2, 2), e2 = t2.g.end(), or2(t2, e2), e2.push(t2.h), e2;
}
function hr(t2, e2) {
  var n2 = e2.pop();
  for (n2 = t2.h + t2.g.length() - n2; n2 > 127; ) e2.push(127 & n2 | 128), n2 >>>= 7, t2.h++;
  e2.push(n2), t2.h++;
}
function ur(t2, e2, n2) {
  ar(t2, e2, 2), rr(t2.g, n2.length), or2(t2, t2.g.end()), or2(t2, n2);
}
function lr(t2, e2, n2, r2) {
  null != n2 && (e2 = cr(t2, e2), r2(n2, t2), hr(t2, e2));
}
function dr() {
  const t2 = class {
    constructor() {
      throw Error();
    }
  };
  return Object.setPrototypeOf(t2, t2.prototype), t2;
}
function Ar(t2, e2) {
  return new Tr(t2, e2, fr);
}
function br(t2, e2, n2, r2, i2) {
  lr(t2, n2, Or(e2, r2), i2);
}
function Pr(t2, e2, n2, r2) {
  var i2 = r2[t2];
  if (i2) return i2;
  (i2 = {}).Ma = r2, i2.T = (function(t3) {
    switch (typeof t3) {
      case "boolean":
        return Re || (Re = [0, void 0, true]);
      case "number":
        return t3 > 0 ? void 0 : 0 === t3 ? Fe || (Fe = [0, void 0]) : [-t3, void 0];
      case "string":
        return [0, t3];
      case "object":
        return t3;
    }
  })(r2[0]);
  var s2 = r2[1];
  let o2 = 1;
  s2 && s2.constructor === Object && (i2.ga = s2, "function" == typeof (s2 = r2[++o2]) && (i2.la = true, Ir ?? (Ir = s2), Mr ?? (Mr = r2[o2 + 1]), s2 = r2[o2 += 2]));
  const a2 = {};
  for (; s2 && Array.isArray(s2) && s2.length && "number" == typeof s2[0] && s2[0] > 0; ) {
    for (var c2 = 0; c2 < s2.length; c2++) a2[s2[c2]] = s2;
    s2 = r2[++o2];
  }
  for (c2 = 1; void 0 !== s2; ) {
    let t3;
    "number" == typeof s2 && (c2 += s2, s2 = r2[++o2]);
    var h2 = void 0;
    if (s2 instanceof Tr ? t3 = s2 : (t3 = kr, o2--), t3?.l) {
      s2 = r2[++o2], h2 = r2;
      var u2 = o2;
      "function" == typeof s2 && (s2 = s2(), h2[u2] = s2), h2 = s2;
    }
    for (u2 = c2 + 1, "number" == typeof (s2 = r2[++o2]) && s2 < 0 && (u2 -= s2, s2 = r2[++o2]); c2 < u2; c2++) {
      const r3 = a2[c2];
      h2 ? n2(i2, c2, t3, h2, r3) : e2(i2, c2, t3, r3);
    }
  }
  return r2[t2] = i2;
}
function Cr(t2) {
  return Array.isArray(t2) ? t2[0] instanceof Tr ? t2 : [Sr, t2] : [t2, void 0];
}
function Or(t2, e2) {
  return t2 instanceof $n ? t2.u : Array.isArray(t2) ? De(t2, e2, false) : void 0;
}
function Ur(t2, e2, n2, r2) {
  const i2 = n2.g;
  t2[e2] = r2 ? (t3, e3, n3) => i2(t3, e3, n3, r2) : i2;
}
function Dr(t2, e2, n2, r2, i2) {
  const s2 = n2.g;
  let o2, a2;
  t2[e2] = (t3, e3, n3) => s2(t3, e3, n3, a2 || (a2 = Pr(Lr, Ur, Dr, r2).T), o2 || (o2 = Nr(r2)), i2);
}
function Nr(t2) {
  let e2 = t2[Rr];
  if (null != e2) return e2;
  const n2 = Pr(Lr, Ur, Dr, t2);
  return e2 = n2.la ? (t3, e3) => Ir(t3, e3, n2) : (t3, e3) => {
    const r2 = 0 | t3[Q];
    for (; jn(e3) && 4 != e3.h; ) {
      var i2 = e3.m, s2 = n2[i2];
      if (null == s2) {
        var o2 = n2.ga;
        o2 && (o2 = o2[i2]) && (null != (o2 = Br(o2)) && (s2 = n2[i2] = o2));
      }
      null != s2 && s2(e3, t3, i2) || (i2 = (s2 = e3).l, Vn(s2), s2.fa ? s2 = void 0 : (o2 = s2.g.g - i2, s2.g.g = i2, s2 = Bn(s2.g, o2)), i2 = t3, s2 && ((o2 = i2[q]) ? o2.push(s2) : i2[q] = [s2]));
    }
    return 8192 & r2 && it(t3), true;
  }, t2[Rr] = e2;
}
function Br(t2) {
  const e2 = (t2 = Cr(t2))[0].g;
  if (t2 = t2[1]) {
    const n2 = Nr(t2), r2 = Pr(Lr, Ur, Dr, t2).T;
    return (t3, i2, s2) => e2(t3, i2, s2, r2, n2);
  }
  return e2;
}
function Gr(t2, e2, n2) {
  t2[e2] = n2.h;
}
function jr(t2, e2, n2, r2) {
  let i2, s2;
  const o2 = n2.h;
  t2[e2] = (t3, e3, n3) => o2(t3, e3, n3, s2 || (s2 = Pr(xr, Gr, jr, r2).T), i2 || (i2 = Vr(r2)));
}
function Vr(t2) {
  let e2 = t2[Fr];
  if (!e2) {
    const n2 = Pr(xr, Gr, jr, t2);
    e2 = (t3, e3) => Xr(t3, e3, n2), t2[Fr] = e2;
  }
  return e2;
}
function Xr(t2, e2, n2) {
  !(function(t3, e3, n3) {
    const r2 = 512 & e3 ? 0 : -1, i2 = t3.length, s2 = i2 + ((e3 = 64 & e3 ? 256 & e3 : !!i2 && lt(t3[i2 - 1])) ? -1 : 0);
    for (let e4 = 0; e4 < s2; e4++) n3(e4 - r2, t3[e4]);
    if (e3) {
      t3 = t3[i2 - 1];
      for (const e4 in t3) !isNaN(e4) && n3(+e4, t3[e4]);
    }
  })(t2, 0 | t2[Q] | (n2.T[1] ? 512 : 0), ((t3, r2) => {
    if (null != r2) {
      var i2 = (function(t4, e3) {
        var n3 = t4[e3];
        if (n3) return n3;
        if ((n3 = t4.ga) && (n3 = n3[e3])) {
          var r3 = (n3 = Cr(n3))[0].h;
          if (n3 = n3[1]) {
            const e4 = Vr(n3), i3 = Pr(xr, Gr, jr, n3).T;
            n3 = t4.la ? Mr(i3, e4) : (t5, n4, s2) => r3(t5, n4, s2, i3, e4);
          } else n3 = r3;
          return t4[e3] = n3;
        }
      })(n2, t3);
      i2 && i2(e2, r2, t3);
    }
  })), (t2 = mt(t2)) && (function(t3, e3) {
    or2(t3, t3.g.end());
    for (let n3 = 0; n3 < e3.length; n3++) or2(t3, D(e3[n3]) || new Uint8Array(0));
  })(e2, t2);
}
function Hr(t2, e2) {
  if (Array.isArray(e2)) {
    var n2 = 0 | e2[Q];
    if (4 & n2) return e2;
    for (var r2 = 0, i2 = 0; r2 < e2.length; r2++) {
      const n3 = t2(e2[r2]);
      null != n3 && (e2[i2++] = n3);
    }
    return i2 < r2 && (e2.length = i2), rt(e2, -6145 & (5 | n2)), 2 & n2 && Object.freeze(e2), e2;
  }
}
function Wr(t2, e2, n2) {
  return new Tr(t2, e2, n2);
}
function zr(t2, e2, n2) {
  return new Tr(t2, e2, n2);
}
function Kr(t2, e2, n2) {
  We(t2, 0 | t2[Q], e2, n2);
}
function $r(t2, e2, n2) {
  if (e2 = (function(t3) {
    if (null == t3) return t3;
    const e3 = typeof t3;
    if ("bigint" === e3) return String(Ht(64, t3));
    if (Qt(t3)) {
      if ("string" === e3) return oe(t3);
      if ("number" === e3) return se(t3);
    }
  })(e2), null != e2) {
    if ("string" == typeof e2) Qn(e2);
    if (null != e2) switch (ar(t2, n2, 0), typeof e2) {
      case "number":
        t2 = t2.g, Ot(e2), nr(t2, Mt, Pt);
        break;
      case "bigint":
        n2 = BigInt.asUintN(64, e2), n2 = new tr(Number(n2 & BigInt(4294967295)), Number(n2 >> BigInt(32))), nr(t2.g, n2.h, n2.g);
        break;
      default:
        n2 = Qn(e2), nr(t2.g, n2.h, n2.g);
    }
  }
}
function qr(t2, e2, n2) {
  null != (e2 = te(e2)) && null != e2 && (ar(t2, n2, 0), ir(t2.g, e2));
}
function Jr(t2, e2, n2) {
  null != (e2 = Jt(e2)) && (ar(t2, n2, 0), t2.g.g.push(e2 ? 1 : 0));
}
function Zr(t2, e2, n2) {
  null != (e2 = fe(e2)) && ur(t2, n2, c(e2));
}
function Qr(t2, e2, n2, r2, i2) {
  lr(t2, n2, Or(e2, r2), i2);
}
function ti(t2, e2, n2) {
  null == e2 || "string" == typeof e2 || e2 instanceof N || (C(e2) ? C(e2) && H(Z) : e2 = void 0), null != e2 && ur(t2, n2, Ln(e2).buffer);
}
function ei(t2, e2, n2) {
  return (5 === t2.h || 2 === t2.h) && (e2 = en(e2, 0 | e2[Q], n2, false), 2 == t2.h ? zn(t2, Cn, e2) : e2.push(Cn(t2.g)), true);
}
function bi(t2, e2) {
  return new Ai(t2, e2);
}
function ki(t2, e2) {
  return (n2, r2) => {
    if (Kn.length) {
      const t3 = Kn.pop();
      t3.o(r2), Un(t3.g, n2, r2), n2 = t3;
    } else n2 = new class {
      constructor(t3, e3) {
        if (Gn.length) {
          const n3 = Gn.pop();
          Un(n3, t3, e3), t3 = n3;
        } else t3 = new class {
          constructor(t4, e4) {
            this.h = null, this.m = false, this.g = this.l = this.j = 0, Un(this, t4, e4);
          }
          clear() {
            this.h = null, this.m = false, this.g = this.l = this.j = 0, this.aa = false;
          }
        }(t3, e3);
        this.g = t3, this.l = this.g.g, this.h = this.m = -1, this.o(e3);
      }
      o({ fa: t3 = false } = {}) {
        this.fa = t3;
      }
    }(n2, r2);
    try {
      const r3 = new t2(), s2 = r3.u;
      Nr(e2)(s2, n2);
      var i2 = r3;
    } finally {
      n2.g.clear(), n2.m = -1, n2.h = -1, Kn.length < 100 && Kn.push(n2);
    }
    return i2;
  };
}
function Si(t2) {
  return function() {
    const e2 = new class {
      constructor() {
        this.l = [], this.h = 0, this.g = new class {
          constructor() {
            this.g = [];
          }
          length() {
            return this.g.length;
          }
          end() {
            const t3 = this.g;
            return this.g = [], t3;
          }
        }();
      }
    }();
    Xr(this.u, e2, Pr(xr, Gr, jr, t2)), or2(e2, e2.g.end());
    const n2 = new Uint8Array(e2.h), r2 = e2.l, i2 = r2.length;
    let s2 = 0;
    for (let t3 = 0; t3 < i2; t3++) {
      const e3 = r2[t3];
      n2.set(e3, s2), s2 += e3.length;
    }
    return e2.l = [n2], n2;
  };
}
function Ii(t2) {
  void 0 === Ri && (Ri = (function() {
    let t3 = null;
    if (!Fi) return t3;
    try {
      const e3 = (t4) => t4;
      t3 = Fi.createPolicy("goog#html", { createHTML: e3, createScript: e3, createScriptURL: e3 });
    } catch (t4) {
    }
    return t3;
  })());
  var e2 = Ri;
  return new class {
    constructor(t3) {
      this.g = t3;
    }
    toString() {
      return this.g + "";
    }
  }(e2 ? e2.createScriptURL(t2) : t2);
}
function Mi(t2, ...e2) {
  if (0 === e2.length) return Ii(t2[0]);
  let n2 = t2[0];
  for (let r2 = 0; r2 < e2.length; r2++) n2 += encodeURIComponent(e2[r2]) + t2[r2 + 1];
  return Ii(n2);
}
function Xi(t2, e2) {
  tn(t2, 2, de(e2), "");
}
function Hi(t2, e2) {
  mn(t2, 3, e2);
}
function Wi(t2, e2) {
  mn(t2, 4, e2);
}
function qi(t2, e2) {
  yn(t2, 1, zi, e2);
}
function Ji(t2, e2) {
  mn(t2, 10, e2);
}
function Zi(t2, e2) {
  mn(t2, 15, e2);
}
function ko(t2, e2) {
  return e2 = e2 ? e2.clone() : new bs(), void 0 !== t2.displayNamesLocale ? He(e2, 1, de(t2.displayNamesLocale)) : void 0 === t2.displayNamesLocale && He(e2, 1), void 0 !== t2.maxResults ? Tn(e2, 2, t2.maxResults) : "maxResults" in t2 && He(e2, 2), void 0 !== t2.scoreThreshold ? An(e2, 3, t2.scoreThreshold) : "scoreThreshold" in t2 && He(e2, 3), void 0 !== t2.categoryAllowlist ? bn(e2, 4, t2.categoryAllowlist) : "categoryAllowlist" in t2 && He(e2, 4), void 0 !== t2.categoryDenylist ? bn(e2, 5, t2.categoryDenylist) : "categoryDenylist" in t2 && He(e2, 5), e2;
}
function So(t2, e2 = -1, n2 = "") {
  return { categories: t2.map(((t3) => ({ index: _n(t3, 1) ?? 0 ?? -1, score: En(t3, 2) ?? 0, categoryName: vn(t3, 3) ?? "" ?? "", displayName: vn(t3, 4) ?? "" ?? "" }))), headIndex: e2, headName: n2 };
}
function xo(t2) {
  var e2 = $e(t2, 3, qt, Ye()), n2 = $e(t2, 2, te, Ye()), r2 = $e(t2, 1, fe, Ye()), i2 = $e(t2, 9, fe, Ye());
  const s2 = { categories: [], keypoints: [] };
  for (let t3 = 0; t3 < e2.length; t3++) s2.categories.push({ score: e2[t3], index: n2[t3] ?? -1, categoryName: r2[t3] ?? "", displayName: i2[t3] ?? "" });
  if ((e2 = hn(t2, cs, 4)?.h()) && (s2.boundingBox = { originX: _n(e2, 1) ?? 0, originY: _n(e2, 2) ?? 0, width: _n(e2, 3) ?? 0, height: _n(e2, 4) ?? 0, angle: 0 }), hn(t2, cs, 4)?.g().length) for (const e3 of hn(t2, cs, 4).g()) s2.keypoints.push({ x: ze(e3, 1) ?? 0, y: ze(e3, 2) ?? 0, score: ze(e3, 4) ?? 0, label: vn(e3, 3) ?? "" });
  return s2;
}
function Lo(t2) {
  const e2 = [];
  for (const n2 of ln(t2, ds, 1)) e2.push({ x: En(n2, 1) ?? 0, y: En(n2, 2) ?? 0, z: En(n2, 3) ?? 0, visibility: En(n2, 4) ?? 0 });
  return e2;
}
function Ro(t2) {
  const e2 = [];
  for (const n2 of ln(t2, us, 1)) e2.push({ x: En(n2, 1) ?? 0, y: En(n2, 2) ?? 0, z: En(n2, 3) ?? 0, visibility: En(n2, 4) ?? 0 });
  return e2;
}
function Fo(t2) {
  return Array.from(t2, ((t3) => t3 > 127 ? t3 - 256 : t3));
}
function Io(t2, e2) {
  if (t2.length !== e2.length) throw Error(`Cannot compute cosine similarity between embeddings of different sizes (${t2.length} vs. ${e2.length}).`);
  let n2 = 0, r2 = 0, i2 = 0;
  for (let s2 = 0; s2 < t2.length; s2++) n2 += t2[s2] * e2[s2], r2 += t2[s2] * t2[s2], i2 += e2[s2] * e2[s2];
  if (r2 <= 0 || i2 <= 0) throw Error("Cannot compute cosine similarity on embedding with 0 norm.");
  return n2 / Math.sqrt(r2 * i2);
}
async function Co() {
  if (void 0 === Mo) try {
    await WebAssembly.instantiate(Po), Mo = true;
  } catch {
    Mo = false;
  }
  return Mo;
}
async function Oo(t2, e2 = Mi``) {
  const n2 = await Co() ? "wasm_internal" : "wasm_nosimd_internal";
  return { wasmLoaderPath: `${e2}/${t2}_${n2}.js`, wasmBinaryPath: `${e2}/${t2}_${n2}.wasm` };
}
function Do() {
  var t2 = navigator;
  return "undefined" != typeof OffscreenCanvas && (!(function(t3 = navigator) {
    return (t3 = t3.userAgent).includes("Safari") && !t3.includes("Chrome");
  })(t2) || !!((t2 = t2.userAgent.match(/Version\/([\d]+).*Safari/)) && t2.length >= 1 && Number(t2[1]) >= 17));
}
async function No(t2) {
  if ("function" != typeof importScripts) {
    const e2 = document.createElement("script");
    return e2.src = t2.toString(), e2.crossOrigin = "anonymous", new Promise(((t3, n2) => {
      e2.addEventListener("load", (() => {
        t3();
      }), false), e2.addEventListener("error", ((t4) => {
        n2(t4);
      }), false), document.body.appendChild(e2);
    }));
  }
  importScripts(t2.toString());
}
function Bo(t2) {
  return void 0 !== t2.videoWidth ? [t2.videoWidth, t2.videoHeight] : void 0 !== t2.naturalWidth ? [t2.naturalWidth, t2.naturalHeight] : void 0 !== t2.displayWidth ? [t2.displayWidth, t2.displayHeight] : [t2.width, t2.height];
}
function Go(t2, e2, n2) {
  t2.m || console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target"), n2(e2 = t2.i.stringToNewUTF8(e2)), t2.i._free(e2);
}
function jo(t2, e2, n2) {
  if (!t2.i.canvas) throw Error("No OpenGL canvas configured.");
  if (n2 ? t2.i._bindTextureToStream(n2) : t2.i._bindTextureToCanvas(), !(n2 = t2.i.canvas.getContext("webgl2") || t2.i.canvas.getContext("webgl"))) throw Error("Failed to obtain WebGL context from the provided canvas. `getContext()` should only be invoked with `webgl` or `webgl2`.");
  t2.i.gpuOriginForWebTexturesIsBottomLeft && n2.pixelStorei(n2.UNPACK_FLIP_Y_WEBGL, true), n2.texImage2D(n2.TEXTURE_2D, 0, n2.RGBA, n2.RGBA, n2.UNSIGNED_BYTE, e2), t2.i.gpuOriginForWebTexturesIsBottomLeft && n2.pixelStorei(n2.UNPACK_FLIP_Y_WEBGL, false);
  const [r2, i2] = Bo(e2);
  return !t2.l || r2 === t2.i.canvas.width && i2 === t2.i.canvas.height || (t2.i.canvas.width = r2, t2.i.canvas.height = i2), [r2, i2];
}
function Vo(t2, e2, n2) {
  t2.m || console.error("No wasm multistream support detected: ensure dependency inclusion of :gl_graph_runner_internal_multi_input target");
  const r2 = new Uint32Array(e2.length);
  for (let n3 = 0; n3 < e2.length; n3++) r2[n3] = t2.i.stringToNewUTF8(e2[n3]);
  e2 = t2.i._malloc(4 * r2.length), t2.i.HEAPU32.set(r2, e2 >> 2), n2(e2);
  for (const e3 of r2) t2.i._free(e3);
  t2.i._free(e2);
}
function Xo(t2, e2, n2) {
  t2.i.simpleListeners = t2.i.simpleListeners || {}, t2.i.simpleListeners[e2] = n2;
}
function Ho(t2, e2, n2) {
  let r2 = [];
  t2.i.simpleListeners = t2.i.simpleListeners || {}, t2.i.simpleListeners[e2] = (t3, e3, i2) => {
    e3 ? (n2(r2, i2), r2 = []) : r2.push(t3);
  };
}
async function Wo(t2, e2, n2, r2) {
  return t2 = await (async (t3, e3, n3, r3, i2) => {
    if (e3 && await No(e3), !self.ModuleFactory) throw Error("ModuleFactory not set.");
    if (n3 && (await No(n3), !self.ModuleFactory)) throw Error("ModuleFactory not set.");
    return self.Module && i2 && ((e3 = self.Module).locateFile = i2.locateFile, i2.mainScriptUrlOrBlob && (e3.mainScriptUrlOrBlob = i2.mainScriptUrlOrBlob)), i2 = await self.ModuleFactory(self.Module || i2), self.ModuleFactory = self.Module = void 0, new t3(i2, r3);
  })(t2, n2.wasmLoaderPath, n2.assetLoaderPath, e2, { locateFile: (t3) => t3.endsWith(".wasm") ? n2.wasmBinaryPath.toString() : n2.assetBinaryPath && t3.endsWith(".data") ? n2.assetBinaryPath.toString() : t3 }), await t2.o(r2), t2;
}
function zo(t2, e2) {
  const n2 = hn(t2.baseOptions, Fs, 1) || new Fs();
  "string" == typeof e2 ? (He(n2, 2, de(e2)), He(n2, 1)) : e2 instanceof Uint8Array && (He(n2, 1, dt(e2, false)), He(n2, 2)), dn(t2.baseOptions, 0, 1, n2);
}
function Ko(t2) {
  try {
    const e2 = t2.G.length;
    if (1 === e2) throw Error(t2.G[0].message);
    if (e2 > 1) throw Error("Encountered multiple errors: " + t2.G.map(((t3) => t3.message)).join(", "));
  } finally {
    t2.G = [];
  }
}
function Yo(t2, e2) {
  t2.B = Math.max(t2.B, e2);
}
function $o(t2, e2) {
  t2.A = new zi(), Xi(t2.A, "PassThroughCalculator"), Hi(t2.A, "free_memory"), Wi(t2.A, "free_memory_unused_out"), Ji(e2, "free_memory"), qi(e2, t2.A);
}
function qo(t2, e2) {
  Hi(t2.A, e2), Wi(t2.A, e2 + "_unused_out");
}
function Jo(t2) {
  t2.g.addBoolToStream(true, "free_memory", t2.B);
}
function Qo(t2, e2) {
  if (!t2) throw Error(`Unable to obtain required WebGL resource: ${e2}`);
  return t2;
}
function ea(t2, e2, n2) {
  const r2 = t2.g;
  if (n2 = Qo(r2.createShader(n2), "Failed to create WebGL shader"), r2.shaderSource(n2, e2), r2.compileShader(n2), !r2.getShaderParameter(n2, r2.COMPILE_STATUS)) throw Error(`Could not compile WebGL shader: ${r2.getShaderInfoLog(n2)}`);
  return r2.attachShader(t2.h, n2), n2;
}
function na(t2, e2) {
  const n2 = t2.g, r2 = Qo(n2.createVertexArray(), "Failed to create vertex array");
  n2.bindVertexArray(r2);
  const i2 = Qo(n2.createBuffer(), "Failed to create buffer");
  n2.bindBuffer(n2.ARRAY_BUFFER, i2), n2.enableVertexAttribArray(t2.P), n2.vertexAttribPointer(t2.P, 2, n2.FLOAT, false, 0, 0), n2.bufferData(n2.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), n2.STATIC_DRAW);
  const s2 = Qo(n2.createBuffer(), "Failed to create buffer");
  return n2.bindBuffer(n2.ARRAY_BUFFER, s2), n2.enableVertexAttribArray(t2.J), n2.vertexAttribPointer(t2.J, 2, n2.FLOAT, false, 0, 0), n2.bufferData(n2.ARRAY_BUFFER, new Float32Array(e2 ? [0, 1, 0, 0, 1, 0, 1, 1] : [0, 0, 0, 1, 1, 1, 1, 0]), n2.STATIC_DRAW), n2.bindBuffer(n2.ARRAY_BUFFER, null), n2.bindVertexArray(null), new ta(n2, r2, i2, s2);
}
function ra(t2, e2) {
  if (t2.g) {
    if (e2 !== t2.g) throw Error("Cannot change GL context once initialized");
  } else t2.g = e2;
}
function ia(t2, e2, n2, r2) {
  return ra(t2, e2), t2.h || (t2.m(), t2.C()), n2 ? (t2.s || (t2.s = na(t2, true)), n2 = t2.s) : (t2.v || (t2.v = na(t2, false)), n2 = t2.v), e2.useProgram(t2.h), n2.bind(), t2.l(), t2 = r2(), n2.g.bindVertexArray(null), t2;
}
function sa(t2, e2, n2) {
  return ra(t2, e2), t2 = Qo(e2.createTexture(), "Failed to create texture"), e2.bindTexture(e2.TEXTURE_2D, t2), e2.texParameteri(e2.TEXTURE_2D, e2.TEXTURE_WRAP_S, e2.CLAMP_TO_EDGE), e2.texParameteri(e2.TEXTURE_2D, e2.TEXTURE_WRAP_T, e2.CLAMP_TO_EDGE), e2.texParameteri(e2.TEXTURE_2D, e2.TEXTURE_MIN_FILTER, n2 ?? e2.LINEAR), e2.texParameteri(e2.TEXTURE_2D, e2.TEXTURE_MAG_FILTER, n2 ?? e2.LINEAR), e2.bindTexture(e2.TEXTURE_2D, null), t2;
}
function oa(t2, e2, n2) {
  ra(t2, e2), t2.A || (t2.A = Qo(e2.createFramebuffer(), "Failed to create framebuffe.")), e2.bindFramebuffer(e2.FRAMEBUFFER, t2.A), e2.framebufferTexture2D(e2.FRAMEBUFFER, e2.COLOR_ATTACHMENT0, e2.TEXTURE_2D, n2, 0);
}
function aa(t2) {
  t2.g?.bindFramebuffer(t2.g.FRAMEBUFFER, null);
}
function la(t2, e2) {
  switch (e2) {
    case 0:
      return t2.g.find(((t3) => t3 instanceof Uint8Array));
    case 1:
      return t2.g.find(((t3) => t3 instanceof Float32Array));
    case 2:
      return t2.g.find(((t3) => "undefined" != typeof WebGLTexture && t3 instanceof WebGLTexture));
    default:
      throw Error(`Type is not supported: ${e2}`);
  }
}
function da(t2) {
  var e2 = la(t2, 1);
  if (!e2) {
    if (e2 = la(t2, 0)) e2 = new Float32Array(e2).map(((t3) => t3 / 255));
    else {
      e2 = new Float32Array(t2.width * t2.height);
      const r2 = pa(t2);
      var n2 = ma(t2);
      if (oa(n2, r2, fa(t2)), "iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform) || navigator.userAgent.includes("Mac") && "document" in self && "ontouchend" in self.document) {
        n2 = new Float32Array(t2.width * t2.height * 4), r2.readPixels(0, 0, t2.width, t2.height, r2.RGBA, r2.FLOAT, n2);
        for (let t3 = 0, r3 = 0; t3 < e2.length; ++t3, r3 += 4) e2[t3] = n2[r3];
      } else r2.readPixels(0, 0, t2.width, t2.height, r2.RED, r2.FLOAT, e2);
    }
    t2.g.push(e2);
  }
  return e2;
}
function fa(t2) {
  let e2 = la(t2, 2);
  if (!e2) {
    const n2 = pa(t2);
    e2 = ya(t2);
    const r2 = da(t2), i2 = ga(t2);
    n2.texImage2D(n2.TEXTURE_2D, 0, i2, t2.width, t2.height, 0, n2.RED, n2.FLOAT, r2), _a(t2);
  }
  return e2;
}
function pa(t2) {
  if (!t2.canvas) throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");
  return t2.h || (t2.h = Qo(t2.canvas.getContext("webgl2"), "You cannot use a canvas that is already bound to a different type of rendering context.")), t2.h;
}
function ga(t2) {
  if (t2 = pa(t2), !va) if (t2.getExtension("EXT_color_buffer_float") && t2.getExtension("OES_texture_float_linear") && t2.getExtension("EXT_float_blend")) va = t2.R32F;
  else {
    if (!t2.getExtension("EXT_color_buffer_half_float")) throw Error("GPU does not fully support 4-channel float32 or float16 formats");
    va = t2.R16F;
  }
  return va;
}
function ma(t2) {
  return t2.l || (t2.l = new ca()), t2.l;
}
function ya(t2) {
  const e2 = pa(t2);
  e2.viewport(0, 0, t2.width, t2.height), e2.activeTexture(e2.TEXTURE0);
  let n2 = la(t2, 2);
  return n2 || (n2 = sa(ma(t2), e2, t2.m ? e2.LINEAR : e2.NEAREST), t2.g.push(n2), t2.j = true), e2.bindTexture(e2.TEXTURE_2D, n2), n2;
}
function _a(t2) {
  t2.h.bindTexture(t2.h.TEXTURE_2D, null);
}
function Aa(t2) {
  return { ...Ta, fillColor: (t2 = t2 || {}).color, ...t2 };
}
function ba(t2, e2) {
  return t2 instanceof Function ? t2(e2) : t2;
}
function ka(t2, e2, n2) {
  return Math.max(Math.min(e2, n2), Math.min(Math.max(e2, n2), t2));
}
function Sa(t2) {
  if (!t2.l) throw Error("CPU rendering requested but CanvasRenderingContext2D not provided.");
  return t2.l;
}
function xa(t2) {
  if (!t2.j) throw Error("GPU rendering requested but WebGL2RenderingContext not provided.");
  return t2.j;
}
function La(t2, e2, n2) {
  if (e2.R()) n2(e2.N());
  else {
    const r2 = e2.ja() ? e2.ha() : e2.ia();
    t2.m = t2.m ?? new ca();
    const i2 = xa(t2);
    n2((t2 = new Ea([r2], e2.m, false, i2.canvas, t2.m, e2.width, e2.height)).N()), t2.close();
  }
}
function Ra(t2, e2, n2, r2) {
  const i2 = (function(t3) {
    return t3.g || (t3.g = new ha()), t3.g;
  })(t2), s2 = xa(t2), o2 = Array.isArray(n2) ? new ImageData(new Uint8ClampedArray(n2), 1, 1) : n2;
  ia(i2, s2, true, (() => {
    !(function(t4, e3, n3, r3) {
      const i3 = t4.g;
      if (i3.activeTexture(i3.TEXTURE0), i3.bindTexture(i3.TEXTURE_2D, e3), i3.activeTexture(i3.TEXTURE1), i3.bindTexture(i3.TEXTURE_2D, t4.B), i3.texImage2D(i3.TEXTURE_2D, 0, i3.RGBA, i3.RGBA, i3.UNSIGNED_BYTE, n3), t4.H && (function(t5, e4) {
        if (t5 !== e4) return false;
        t5 = t5.entries(), e4 = e4.entries();
        for (const [r4, i4] of t5) {
          t5 = r4;
          const s3 = i4;
          var n4 = e4.next();
          if (n4.done) return false;
          const [o3, a2] = n4.value;
          if (n4 = a2, t5 !== o3 || s3[0] !== n4[0] || s3[1] !== n4[1] || s3[2] !== n4[2] || s3[3] !== n4[3]) return false;
        }
        return !!e4.next().done;
      })(t4.H, r3)) i3.activeTexture(i3.TEXTURE2), i3.bindTexture(i3.TEXTURE_2D, t4.j);
      else {
        t4.H = r3;
        const e4 = Array(1024).fill(0);
        r3.forEach(((t5, n4) => {
          if (4 !== t5.length) throw Error(`Color at index ${n4} is not a four-channel value.`);
          e4[4 * n4] = t5[0], e4[4 * n4 + 1] = t5[1], e4[4 * n4 + 2] = t5[2], e4[4 * n4 + 3] = t5[3];
        })), i3.activeTexture(i3.TEXTURE2), i3.bindTexture(i3.TEXTURE_2D, t4.j), i3.texImage2D(i3.TEXTURE_2D, 0, i3.RGBA, 256, 1, 0, i3.RGBA, i3.UNSIGNED_BYTE, new Uint8Array(e4));
      }
    })(i2, e2, o2, r2), s2.clearColor(0, 0, 0, 0), s2.clear(s2.COLOR_BUFFER_BIT), s2.drawArrays(s2.TRIANGLE_FAN, 0, 4);
    const t3 = i2.g;
    t3.activeTexture(t3.TEXTURE0), t3.bindTexture(t3.TEXTURE_2D, null), t3.activeTexture(t3.TEXTURE1), t3.bindTexture(t3.TEXTURE_2D, null), t3.activeTexture(t3.TEXTURE2), t3.bindTexture(t3.TEXTURE_2D, null);
  }));
}
function Fa(t2, e2, n2, r2) {
  const i2 = xa(t2), s2 = (function(t3) {
    return t3.h || (t3.h = new ua()), t3.h;
  })(t2), o2 = Array.isArray(n2) ? new ImageData(new Uint8ClampedArray(n2), 1, 1) : n2, a2 = Array.isArray(r2) ? new ImageData(new Uint8ClampedArray(r2), 1, 1) : r2;
  ia(s2, i2, true, (() => {
    var t3 = s2.g;
    t3.activeTexture(t3.TEXTURE0), t3.bindTexture(t3.TEXTURE_2D, e2), t3.activeTexture(t3.TEXTURE1), t3.bindTexture(t3.TEXTURE_2D, s2.j), t3.texImage2D(t3.TEXTURE_2D, 0, t3.RGBA, t3.RGBA, t3.UNSIGNED_BYTE, o2), t3.activeTexture(t3.TEXTURE2), t3.bindTexture(t3.TEXTURE_2D, s2.B), t3.texImage2D(t3.TEXTURE_2D, 0, t3.RGBA, t3.RGBA, t3.UNSIGNED_BYTE, a2), i2.clearColor(0, 0, 0, 0), i2.clear(i2.COLOR_BUFFER_BIT), i2.drawArrays(i2.TRIANGLE_FAN, 0, 4), i2.bindTexture(i2.TEXTURE_2D, null), (t3 = s2.g).activeTexture(t3.TEXTURE0), t3.bindTexture(t3.TEXTURE_2D, null), t3.activeTexture(t3.TEXTURE1), t3.bindTexture(t3.TEXTURE_2D, null), t3.activeTexture(t3.TEXTURE2), t3.bindTexture(t3.TEXTURE_2D, null);
  }));
}
function Ma(t2, e2) {
  switch (e2) {
    case 0:
      return t2.g.find(((t3) => t3 instanceof ImageData));
    case 1:
      return t2.g.find(((t3) => "undefined" != typeof ImageBitmap && t3 instanceof ImageBitmap));
    case 2:
      return t2.g.find(((t3) => "undefined" != typeof WebGLTexture && t3 instanceof WebGLTexture));
    default:
      throw Error(`Type is not supported: ${e2}`);
  }
}
function Pa(t2) {
  var e2 = Ma(t2, 0);
  if (!e2) {
    e2 = Oa(t2);
    const n2 = Ua(t2), r2 = new Uint8Array(t2.width * t2.height * 4);
    oa(n2, e2, Ca(t2)), e2.readPixels(0, 0, t2.width, t2.height, e2.RGBA, e2.UNSIGNED_BYTE, r2), aa(n2), e2 = new ImageData(new Uint8ClampedArray(r2.buffer), t2.width, t2.height), t2.g.push(e2);
  }
  return e2;
}
function Ca(t2) {
  let e2 = Ma(t2, 2);
  if (!e2) {
    const n2 = Oa(t2);
    e2 = Da(t2);
    const r2 = Ma(t2, 1) || Pa(t2);
    n2.texImage2D(n2.TEXTURE_2D, 0, n2.RGBA, n2.RGBA, n2.UNSIGNED_BYTE, r2), Na(t2);
  }
  return e2;
}
function Oa(t2) {
  if (!t2.canvas) throw Error("Conversion to different image formats require that a canvas is passed when initializing the image.");
  return t2.h || (t2.h = Qo(t2.canvas.getContext("webgl2"), "You cannot use a canvas that is already bound to a different type of rendering context.")), t2.h;
}
function Ua(t2) {
  return t2.l || (t2.l = new ca()), t2.l;
}
function Da(t2) {
  const e2 = Oa(t2);
  e2.viewport(0, 0, t2.width, t2.height), e2.activeTexture(e2.TEXTURE0);
  let n2 = Ma(t2, 2);
  return n2 || (n2 = sa(Ua(t2), e2), t2.g.push(n2), t2.m = true), e2.bindTexture(e2.TEXTURE_2D, n2), n2;
}
function Na(t2) {
  t2.h.bindTexture(t2.h.TEXTURE_2D, null);
}
function Ba(t2) {
  const e2 = Oa(t2);
  return ia(Ua(t2), e2, true, (() => (function(t3, e3) {
    const n2 = t3.canvas;
    if (n2.width === t3.width && n2.height === t3.height) return e3();
    const r2 = n2.width, i2 = n2.height;
    return n2.width = t3.width, n2.height = t3.height, t3 = e3(), n2.width = r2, n2.height = i2, t3;
  })(t2, (() => {
    if (e2.bindFramebuffer(e2.FRAMEBUFFER, null), e2.clearColor(0, 0, 0, 0), e2.clear(e2.COLOR_BUFFER_BIT), e2.drawArrays(e2.TRIANGLE_FAN, 0, 4), !(t2.canvas instanceof OffscreenCanvas)) throw Error("Conversion to ImageBitmap requires that the MediaPipe Tasks is initialized with an OffscreenCanvas");
    return t2.canvas.transferToImageBitmap();
  }))));
}
function Va(...t2) {
  return t2.map((([t3, e2]) => ({ start: t3, end: e2 })));
}
async function za(t2, e2, n2) {
  return (async function(t3, e3, n3, r2) {
    return Wo(t3, e3, n3, r2);
  })(t2, n2.canvas ?? (Do() ? void 0 : document.createElement("canvas")), e2, n2);
}
function Ka(t2, e2, n2, r2) {
  if (t2.U) {
    const s2 = new ms();
    if (n2?.regionOfInterest) {
      if (!t2.na) throw Error("This task doesn't support region-of-interest.");
      var i2 = n2.regionOfInterest;
      if (i2.left >= i2.right || i2.top >= i2.bottom) throw Error("Expected RectF with left < right and top < bottom.");
      if (i2.left < 0 || i2.top < 0 || i2.right > 1 || i2.bottom > 1) throw Error("Expected RectF values to be in [0,1].");
      An(s2, 1, (i2.left + i2.right) / 2), An(s2, 2, (i2.top + i2.bottom) / 2), An(s2, 4, i2.right - i2.left), An(s2, 3, i2.bottom - i2.top);
    } else An(s2, 1, 0.5), An(s2, 2, 0.5), An(s2, 4, 1), An(s2, 3, 1);
    if (n2?.rotationDegrees) {
      if (n2?.rotationDegrees % 90 != 0) throw Error("Expected rotation to be a multiple of 90\xB0.");
      if (An(s2, 5, -Math.PI * n2.rotationDegrees / 180), n2?.rotationDegrees % 180 != 0) {
        const [t3, r3] = Bo(e2);
        n2 = En(s2, 3) * r3 / t3, i2 = En(s2, 4) * t3 / r3, An(s2, 4, n2), An(s2, 3, i2);
      }
    }
    t2.g.addProtoToStream(s2.g(), "mediapipe.NormalizedRect", t2.U, r2);
  }
  t2.g.oa(e2, t2.Z, r2 ?? performance.now()), t2.finishProcessing();
}
function Ya(t2, e2, n2) {
  if (t2.baseOptions?.g()) throw Error("Task is not initialized with image mode. 'runningMode' must be set to 'IMAGE'.");
  Ka(t2, e2, n2, t2.B + 1);
}
function $a(t2, e2, n2, r2) {
  if (!t2.baseOptions?.g()) throw Error("Task is not initialized with video mode. 'runningMode' must be set to 'VIDEO'.");
  Ka(t2, e2, n2, r2);
}
function qa(t2, e2, n2, r2) {
  var i2 = e2.data;
  const s2 = e2.width, o2 = s2 * (e2 = e2.height);
  if ((i2 instanceof Uint8Array || i2 instanceof Float32Array) && i2.length !== o2) throw Error("Unsupported channel count: " + i2.length / o2);
  return t2 = new Ea([i2], n2, false, t2.g.i.canvas, t2.P, s2, e2), r2 ? t2.clone() : t2;
}
function hc(t2) {
  t2.j = { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] };
}
function fc(t2) {
  t2.gestures = [], t2.landmarks = [], t2.worldLandmarks = [], t2.handedness = [];
}
function pc(t2) {
  return 0 === t2.gestures.length ? { gestures: [], landmarks: [], worldLandmarks: [], handedness: [], handednesses: [] } : { gestures: t2.gestures, landmarks: t2.landmarks, worldLandmarks: t2.worldLandmarks, handedness: t2.handedness, handednesses: t2.handedness };
}
function gc(t2, e2 = true) {
  const n2 = [];
  for (const i2 of t2) {
    var r2 = ss(i2);
    t2 = [];
    for (const n3 of r2.g()) r2 = e2 && null != _n(n3, 1) ? _n(n3, 1) ?? 0 : -1, t2.push({ score: En(n3, 2) ?? 0, index: r2, categoryName: vn(n3, 3) ?? "" ?? "", displayName: vn(n3, 4) ?? "" ?? "" });
    n2.push(t2);
  }
  return n2;
}
function yc(t2) {
  return { landmarks: t2.landmarks, worldLandmarks: t2.worldLandmarks, handednesses: t2.handedness, handedness: t2.handedness };
}
function Ec(t2) {
  t2.h = { faceLandmarks: [], faceBlendshapes: [], poseLandmarks: [], poseWorldLandmarks: [], poseSegmentationMasks: [], leftHandLandmarks: [], leftHandWorldLandmarks: [], rightHandLandmarks: [], rightHandWorldLandmarks: [] };
}
function wc(t2) {
  try {
    if (!t2.C) return t2.h;
    t2.C(t2.h);
  } finally {
    Jo(t2);
  }
}
function Tc(t2, e2) {
  t2 = fs(t2), e2.push(Lo(t2));
}
function xc(t2) {
  t2.categoryMask = void 0, t2.confidenceMasks = void 0, t2.qualityScores = void 0;
}
function Lc(t2) {
  try {
    const e2 = new Sc(t2.confidenceMasks, t2.categoryMask, t2.qualityScores);
    if (!t2.j) return e2;
    t2.j(e2);
  } finally {
    Jo(t2);
  }
}
function Wc(t2) {
  t2.landmarks = [], t2.worldLandmarks = [], t2.segmentationMasks = void 0;
}
function zc(t2) {
  try {
    const e2 = new Hc(t2.landmarks, t2.worldLandmarks, t2.segmentationMasks);
    if (!t2.s) return e2;
    t2.s(e2);
  } finally {
    Jo(t2);
  }
}
var t, r, i, s, o, a, h, u, l, d, f, p, g, m, T, A, b, x, L, F, I, O, N, B, G, W, K, Y, $, q, J, Z, Q, tt, et, ht, ut, ft, gt, yt, vt, Et, wt, Tt, bt, kt, St, xt, Lt, Ft, It, Mt, Pt, Ht, Wt, zt, Kt, Yt, $t, Zt, ye, _e, ve, Ee, Ae, xe, Le, Re, Fe, Gn, Kn, $n, Jn, Zn, tr, er, fr, pr, gr, mr, yr, _r, vr, Er, wr, Tr, kr, Sr, xr, Lr, Rr, Fr, Ir, Mr, Yr, ni, ri, ii, si, oi, ai, ci, hi, ui, li, di, fi, pi, gi, mi, yi, _i, vi, Ei, wi, Ti, Ai, xi, Li, Ri, Fi, Pi, Ci, Oi, Ui, Di, Ni, Bi, Gi, ji, Vi, zi, Ki, Yi, $i, Qi, ts, es, ns, rs, is, ss, os, as, cs, hs, us, ls, ds, fs, ps, gs, ms, ys, _s, vs, Es, ws, Ts, As, bs, ks, Ss, xs, Ls, Rs, Fs, Is, Ms, Ps, Cs, Os, Us, Ds, Ns, Bs, Gs, js, Vs, Xs, Hs, Ws, zs, Ks, Ys, $s, qs, Js, Zs, Qs, to, eo, no, ro, io, so, oo, ao, co, ho, uo, lo, fo, po, go, mo, yo, _o, vo, Eo, wo, To, Ao, bo, Mo, Po, Uo, Zo, ta, ca, ha, ua, va, Ea, wa, Ta, Ia, Ga, ja, Xa, Ha, Wa, Ja, Za, Qa, tc, ec, nc, rc, ic, sc, oc, ac, cc, uc, lc, dc, mc, _c, vc, Ac, bc, kc, Sc, Rc, Fc, Ic, Mc, Pc, Cc, Oc, Uc, Dc, Nc, Bc, Gc, jc, Vc, Xc, Hc, Kc;
var init_vision_bundle = __esm({
  "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs"() {
    t = "undefined" != typeof self ? self : {};
    s = "undefined" != typeof TextDecoder;
    a = "undefined" != typeof TextEncoder;
    t: {
      for (l = ["CLOSURE_FLAGS"], d = t, f = 0; f < l.length; f++) if (null == (d = d[l[f]])) {
        u = null;
        break t;
      }
      u = d;
    }
    g = u && u[610401301];
    h = null != g && g;
    m = t.navigator;
    p = m && m.userAgentData || null, w[" "] = function() {
    };
    T = !v() && (_("Trident") || _("MSIE"));
    !_("Android") || E(), E(), _("Safari") && (E() || !v() && _("Coast") || !v() && _("Opera") || !v() && _("Edge") || (v() ? y("Microsoft Edge") : _("Edg/")) || v() && y("Opera"));
    A = {};
    b = null;
    x = "undefined" != typeof Uint8Array;
    L = !T && "function" == typeof btoa;
    F = /[-_.]/g;
    I = { "-": "+", _: "/", ".": "=" };
    O = {};
    N = class {
      h() {
        return new Uint8Array(D(this) || 0);
      }
      constructor(t2, e2) {
        if (j(e2), this.g = t2, null != t2 && 0 === t2.length) throw Error("ByteString should be constructed with non-empty values");
      }
    };
    W = "function" == typeof Symbol && "symbol" == typeof /* @__PURE__ */ Symbol();
    K = z("jas", void 0, true);
    Y = z(void 0, "0di");
    $ = z(void 0, "1oa");
    q = z(void 0, /* @__PURE__ */ Symbol());
    J = z(void 0, "0actk");
    Z = z(void 0, "8utk");
    Q = W ? K : "Ea";
    tt = { Ea: { value: 0, configurable: true, writable: true, enumerable: false } };
    et = Object.defineProperties;
    ut = {};
    ft = [];
    rt(ft, 55), ht = Object.freeze(ft);
    gt = class {
      constructor(t2, e2, n2) {
        this.g = t2, this.h = e2, this.l = n2;
      }
      next() {
        const t2 = this.g.next();
        return t2.done || (t2.value = this.h.call(this.l, t2.value)), t2;
      }
      [Symbol.iterator]() {
        return this;
      }
    };
    yt = Object.freeze({});
    vt = _t(((t2) => "number" == typeof t2));
    Et = _t(((t2) => "string" == typeof t2));
    wt = _t(((t2) => "boolean" == typeof t2));
    Tt = "function" == typeof t.BigInt && "bigint" == typeof t.BigInt(0);
    bt = _t(((t2) => Tt ? t2 >= St && t2 <= Lt : "-" === t2[0] ? Rt(t2, kt) : Rt(t2, xt)));
    kt = Number.MIN_SAFE_INTEGER.toString();
    St = Tt ? BigInt(Number.MIN_SAFE_INTEGER) : void 0;
    xt = Number.MAX_SAFE_INTEGER.toString();
    Lt = Tt ? BigInt(Number.MAX_SAFE_INTEGER) : void 0;
    Ft = "function" == typeof Uint8Array.prototype.slice;
    Mt = 0;
    Pt = 0;
    Ht = "function" == typeof BigInt ? BigInt.asIntN : void 0;
    Wt = "function" == typeof BigInt ? BigInt.asUintN : void 0;
    zt = Number.isSafeInteger;
    Kt = Number.isFinite;
    Yt = Math.trunc;
    $t = At(0);
    Zt = /^-?([1-9][0-9]*|0)(\.[0-9]+)?$/;
    ye = {};
    _e = (function() {
      try {
        return w(new class extends Map {
          constructor() {
            super();
          }
        }()), false;
      } catch {
        return true;
      }
    })();
    ve = class {
      constructor() {
        this.g = /* @__PURE__ */ new Map();
      }
      get(t2) {
        return this.g.get(t2);
      }
      set(t2, e2) {
        return this.g.set(t2, e2), this.size = this.g.size, this;
      }
      delete(t2) {
        return t2 = this.g.delete(t2), this.size = this.g.size, t2;
      }
      clear() {
        this.g.clear(), this.size = this.g.size;
      }
      has(t2) {
        return this.g.has(t2);
      }
      entries() {
        return this.g.entries();
      }
      keys() {
        return this.g.keys();
      }
      values() {
        return this.g.values();
      }
      forEach(t2, e2) {
        return this.g.forEach(t2, e2);
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    };
    Ee = _e ? (Object.setPrototypeOf(ve.prototype, Map.prototype), Object.defineProperties(ve.prototype, { size: { value: 0, configurable: true, enumerable: true, writable: true } }), ve) : class extends Map {
      constructor() {
        super();
      }
    };
    Ae = class extends Ee {
      constructor(t2, e2, n2 = we, r2 = we) {
        super();
        let i2 = 0 | t2[Q];
        i2 |= 64, rt(t2, i2), this.M = i2, this.I = e2, this.S = n2, this.X = this.I ? be : r2;
        for (let s2 = 0; s2 < t2.length; s2++) {
          const o2 = t2[s2], a2 = n2(o2[0], false, true);
          let c2 = o2[1];
          e2 ? void 0 === c2 && (c2 = null) : c2 = r2(o2[1], false, true, void 0, void 0, i2), super.set(a2, c2);
        }
      }
      La() {
        var t2 = Ce;
        if (0 !== this.size) return Array.from(super.entries(), ((e2) => (e2[0] = t2(e2[0]), e2[1] = t2(e2[1]), e2)));
      }
      da(t2 = ke) {
        const e2 = [], n2 = super.entries();
        for (var r2; !(r2 = n2.next()).done; ) (r2 = r2.value)[0] = t2(r2[0]), r2[1] = t2(r2[1]), e2.push(r2);
        return e2;
      }
      clear() {
        Te(this), super.clear();
      }
      delete(t2) {
        return Te(this), super.delete(this.S(t2, true, false));
      }
      entries() {
        if (this.I) {
          var t2 = super.keys();
          t2 = new gt(t2, Se, this);
        } else t2 = super.entries();
        return t2;
      }
      values() {
        if (this.I) {
          var t2 = super.keys();
          t2 = new gt(t2, Ae.prototype.get, this);
        } else t2 = super.values();
        return t2;
      }
      forEach(t2, e2) {
        this.I ? super.forEach(((n2, r2, i2) => {
          t2.call(e2, i2.get(r2), r2, i2);
        })) : super.forEach(t2, e2);
      }
      set(t2, e2) {
        return Te(this), null == (t2 = this.S(t2, true, false)) ? this : null == e2 ? (super.delete(t2), this) : super.set(t2, this.X(e2, true, true, this.I, false, this.M));
      }
      Ja(t2) {
        const e2 = this.S(t2[0], false, true);
        t2 = t2[1], t2 = this.I ? void 0 === t2 ? null : t2 : this.X(t2, false, true, void 0, false, this.M), super.set(e2, t2);
      }
      has(t2) {
        return super.has(this.S(t2, false, false));
      }
      get(t2) {
        t2 = this.S(t2, false, false);
        const e2 = super.get(t2);
        if (void 0 !== e2) {
          var n2 = this.I;
          return n2 ? ((n2 = this.X(e2, false, true, n2, this.pa, this.M)) !== e2 && super.set(t2, n2), n2) : e2;
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
    };
    Ae.prototype.toJSON = void 0;
    Gn = [];
    Kn = [];
    $n = class {
      constructor(t2, e2) {
        this.u = Ne(t2, e2);
      }
      toJSON() {
        try {
          var t2 = Ue(this);
        } finally {
          Le = void 0;
        }
        return t2;
      }
      l() {
        var t2 = _o;
        return t2.g ? t2.l(this, t2.g, t2.h) : t2.l(this, t2.h, t2.defaultValue);
      }
      clone() {
        const t2 = this.u;
        return new this.constructor(Ge(t2, 0 | t2[Q], false));
      }
      O() {
        return !!(2 & (0 | this.u[Q]));
      }
    };
    $n.prototype.W = ut, $n.prototype.toString = function() {
      return this.u.toString();
    };
    Jn = class {
      constructor(t2, e2) {
        this.h = t2 >>> 0, this.g = e2 >>> 0;
      }
    };
    tr = class {
      constructor(t2, e2) {
        this.h = t2 >>> 0, this.g = e2 >>> 0;
      }
    };
    fr = dr();
    pr = dr();
    gr = dr();
    mr = dr();
    yr = dr();
    _r = dr();
    vr = dr();
    Er = dr();
    wr = dr();
    Tr = class {
      constructor(t2, e2, n2) {
        this.g = t2, this.h = e2, t2 = fr, this.l = !!t2 && n2 === t2 || false;
      }
    };
    kr = Ar((function(t2, e2, n2, r2, i2) {
      return 2 === t2.h && (Xn(t2, an(e2, r2, n2), i2), true);
    }), br);
    Sr = Ar((function(t2, e2, n2, r2, i2) {
      return 2 === t2.h && (Xn(t2, an(e2, r2, n2), i2), true);
    }), br);
    xr = /* @__PURE__ */ Symbol();
    Lr = /* @__PURE__ */ Symbol();
    Rr = /* @__PURE__ */ Symbol();
    Fr = /* @__PURE__ */ Symbol();
    Yr = Ar((function(t2, e2, n2, r2, i2) {
      return 2 === t2.h && (t2 = Xn(t2, De([void 0, void 0], r2, true), i2), pt(r2 = 0 | e2[Q]), (i2 = Xe(e2, r2, n2)) instanceof Ae ? 0 != (2 & i2.M) ? ((i2 = i2.da()).push(t2), We(e2, r2, n2, i2)) : i2.Ja(t2) : Array.isArray(i2) ? (2 & (0 | i2[Q]) && We(e2, r2, n2, i2 = Qe(i2)), i2.push(t2)) : We(e2, r2, n2, [t2]), true);
    }), (function(t2, e2, n2, r2, i2) {
      if (e2 instanceof Ae) e2.forEach(((e3, s2) => {
        lr(t2, n2, De([s2, e3], r2, false), i2);
      }));
      else if (Array.isArray(e2)) for (let s2 = 0; s2 < e2.length; s2++) {
        const o2 = e2[s2];
        Array.isArray(o2) && lr(t2, n2, De(o2, r2, false), i2);
      }
    }));
    ni = Wr((function(t2, e2, n2) {
      if (1 !== t2.h) return false;
      var r2 = t2.g;
      t2 = Pn(r2);
      const i2 = Pn(r2);
      r2 = 2 * (i2 >> 31) + 1;
      const s2 = i2 >>> 20 & 2047;
      return t2 = 4294967296 * (1048575 & i2) + t2, Kr(e2, n2, 2047 == s2 ? t2 ? NaN : r2 * (1 / 0) : 0 == s2 ? 5e-324 * r2 * t2 : r2 * Math.pow(2, s2 - 1075) * (t2 + 4503599627370496)), true;
    }), (function(t2, e2, n2) {
      null != (e2 = qt(e2)) && (ar(t2, n2, 1), t2 = t2.g, (n2 = It || (It = new DataView(new ArrayBuffer(8)))).setFloat64(0, +e2, true), Mt = n2.getUint32(0, true), Pt = n2.getUint32(4, true), sr(t2, Mt), sr(t2, Pt));
    }), dr());
    ri = Wr((function(t2, e2, n2) {
      return 5 === t2.h && (Kr(e2, n2, Cn(t2.g)), true);
    }), (function(t2, e2, n2) {
      null != (e2 = qt(e2)) && (ar(t2, n2, 5), t2 = t2.g, Ut(e2), sr(t2, Mt));
    }), vr);
    ii = zr(ei, (function(t2, e2, n2) {
      if (null != (e2 = Hr(qt, e2))) for (let o2 = 0; o2 < e2.length; o2++) {
        var r2 = t2, i2 = n2, s2 = e2[o2];
        null != s2 && (ar(r2, i2, 5), r2 = r2.g, Ut(s2), sr(r2, Mt));
      }
    }), vr);
    si = zr(ei, (function(t2, e2, n2) {
      if (null != (e2 = Hr(qt, e2)) && e2.length) {
        ar(t2, n2, 2), rr(t2.g, 4 * e2.length);
        for (let r2 = 0; r2 < e2.length; r2++) n2 = t2.g, Ut(e2[r2]), sr(n2, Mt);
      }
    }), vr);
    oi = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, Rn(t2.g, Nt)), true);
    }), $r, _r);
    ai = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, 0 === (t2 = Rn(t2.g, Nt)) ? void 0 : t2), true);
    }), $r, _r);
    ci = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, Rn(t2.g, Dt)), true);
    }), (function(t2, e2, n2) {
      if (null != (e2 = ue(e2))) {
        if ("string" == typeof e2) qn(e2);
        if (null != e2) switch (ar(t2, n2, 0), typeof e2) {
          case "number":
            t2 = t2.g, Ot(e2), nr(t2, Mt, Pt);
            break;
          case "bigint":
            n2 = BigInt.asUintN(64, e2), n2 = new Jn(Number(n2 & BigInt(4294967295)), Number(n2 >> BigInt(32))), nr(t2.g, n2.h, n2.g);
            break;
          default:
            n2 = qn(e2), nr(t2.g, n2.h, n2.g);
        }
      }
    }), dr());
    hi = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, In(t2.g)), true);
    }), qr, mr);
    ui = zr((function(t2, e2, n2) {
      return (0 === t2.h || 2 === t2.h) && (e2 = en(e2, 0 | e2[Q], n2, false), 2 == t2.h ? zn(t2, In, e2) : e2.push(In(t2.g)), true);
    }), (function(t2, e2, n2) {
      if (null != (e2 = Hr(te, e2)) && e2.length) {
        n2 = cr(t2, n2);
        for (let n3 = 0; n3 < e2.length; n3++) ir(t2.g, e2[n3]);
        hr(t2, n2);
      }
    }), mr);
    li = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, 0 === (t2 = In(t2.g)) ? void 0 : t2), true);
    }), qr, mr);
    di = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, Fn(t2.g)), true);
    }), Jr, pr);
    fi = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, false === (t2 = Fn(t2.g)) ? void 0 : t2), true);
    }), Jr, pr);
    pi = zr((function(t2, e2, n2) {
      return 2 === t2.h && (t2 = Hn(t2), en(e2, 0 | e2[Q], n2, false).push(t2), true);
    }), (function(t2, e2, n2) {
      if (null != (e2 = Hr(fe, e2))) for (let o2 = 0; o2 < e2.length; o2++) {
        var r2 = t2, i2 = n2, s2 = e2[o2];
        null != s2 && ur(r2, i2, c(s2));
      }
    }), gr);
    gi = Wr((function(t2, e2, n2) {
      return 2 === t2.h && (Kr(e2, n2, "" === (t2 = Hn(t2)) ? void 0 : t2), true);
    }), Zr, gr);
    mi = Wr((function(t2, e2, n2) {
      return 2 === t2.h && (Kr(e2, n2, Hn(t2)), true);
    }), Zr, gr);
    yi = (function(t2, e2, n2 = fr) {
      return new Tr(t2, e2, n2);
    })((function(t2, e2, n2, r2, i2) {
      return 2 === t2.h && (r2 = De(void 0, r2, true), en(e2, 0 | e2[Q], n2, true).push(r2), Xn(t2, r2, i2), true);
    }), (function(t2, e2, n2, r2, i2) {
      if (Array.isArray(e2)) for (let s2 = 0; s2 < e2.length; s2++) Qr(t2, e2[s2], n2, r2, i2);
    }));
    _i = Ar((function(t2, e2, n2, r2, i2, s2) {
      return 2 === t2.h && (sn(e2, 0 | e2[Q], s2, n2), Xn(t2, e2 = an(e2, r2, n2), i2), true);
    }), Qr);
    vi = Wr((function(t2, e2, n2) {
      return 2 === t2.h && (Kr(e2, n2, Wn(t2)), true);
    }), ti, Er);
    Ei = zr((function(t2, e2, n2) {
      return (0 === t2.h || 2 === t2.h) && (e2 = en(e2, 0 | e2[Q], n2, false), 2 == t2.h ? zn(t2, Mn, e2) : e2.push(Mn(t2.g)), true);
    }), (function(t2, e2, n2) {
      if (null != (e2 = Hr(ee, e2))) for (let o2 = 0; o2 < e2.length; o2++) {
        var r2 = t2, i2 = n2, s2 = e2[o2];
        null != s2 && (ar(r2, i2, 0), rr(r2.g, s2));
      }
    }), yr);
    wi = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, 0 === (t2 = Mn(t2.g)) ? void 0 : t2), true);
    }), (function(t2, e2, n2) {
      null != (e2 = ee(e2)) && null != e2 && (ar(t2, n2, 0), rr(t2.g, e2));
    }), yr);
    Ti = Wr((function(t2, e2, n2) {
      return 0 === t2.h && (Kr(e2, n2, In(t2.g)), true);
    }), (function(t2, e2, n2) {
      null != (e2 = te(e2)) && (e2 = parseInt(e2, 10), ar(t2, n2, 0), ir(t2.g, e2));
    }), wr);
    Ai = class {
      constructor(t2, e2) {
        this.h = t2, this.g = e2, this.l = hn, this.m = dn, this.defaultValue = void 0;
      }
      register() {
        w(this);
      }
    };
    xi = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Li = [0, gi, Wr((function(t2, e2, n2) {
      return 2 === t2.h && (Kr(e2, n2, (t2 = Wn(t2)) === U() ? void 0 : t2), true);
    }), (function(t2, e2, n2) {
      if (null != e2) {
        if (e2 instanceof $n) {
          const r2 = e2.Oa;
          return void (r2 && (e2 = r2(e2), null != e2 && ur(t2, n2, Ln(e2).buffer)));
        }
        if (Array.isArray(e2)) return;
      }
      ti(t2, e2, n2);
    }), Er)];
    Fi = globalThis.trustedTypes;
    Pi = [0, hi, Ti, di, -1, ui, Ti, -1];
    Ci = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Oi = [0, di, mi, di, Ti, -1, zr((function(t2, e2, n2) {
      return (0 === t2.h || 2 === t2.h) && (e2 = en(e2, 0 | e2[Q], n2, false), 2 == t2.h ? zn(t2, On, e2) : e2.push(In(t2.g)), true);
    }), (function(t2, e2, n2) {
      if (null != (e2 = Hr(te, e2)) && e2.length) {
        n2 = cr(t2, n2);
        for (let n3 = 0; n3 < e2.length; n3++) ir(t2.g, e2[n3]);
        hr(t2, n2);
      }
    }), wr), mi, -1, [0, di, -1], Ti, di, -1];
    Ui = [0, mi, -2];
    Di = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Ni = [0];
    Bi = [0, hi, di, 1, di, -3];
    Gi = class extends $n {
      constructor(t2) {
        super(t2, 2);
      }
    };
    ji = {};
    ji[336783863] = [0, mi, di, -1, hi, [0, [1, 2, 3, 4, 5, 6, 7, 8, 9], _i, Ni, _i, Oi, _i, Ui, _i, Bi, _i, Pi, _i, [0, mi, -2], _i, [0, mi, Ti], _i, [0, Ti, mi, -1], _i, [0, Ti, -1]], [0, mi], di, [0, [1, 3], [2, 4], _i, [0, ui], -1, _i, [0, pi], -1, yi, [0, mi, -1]], mi];
    Vi = [0, ai, -1, fi, -3, ai, ui, gi, li, ai, -1, fi, li, fi, -2, gi];
    zi = class extends $n {
      constructor(t2) {
        super(t2, 500);
      }
      o(t2) {
        return dn(this, 0, 7, t2);
      }
    };
    Ki = [-1, {}];
    Yi = [0, mi, 1, Ki];
    $i = [0, mi, pi, Ki];
    Qi = class extends $n {
      constructor(t2) {
        super(t2, 500);
      }
      o(t2) {
        return dn(this, 0, 1001, t2);
      }
    };
    ts = [-500, yi, [-500, gi, -1, pi, -3, [-2, ji, di], yi, Li, li, -1, Yi, $i, yi, [0, gi, fi], gi, Vi, li, pi, 987, pi], 4, yi, [-500, mi, -1, [-1, {}], 998, mi], yi, [-500, mi, pi, -1, [-2, {}, di], 997, pi, -1], li, yi, [-500, mi, pi, Ki, 998, pi], pi, li, Yi, $i, yi, [0, gi, -1, Ki], pi, -2, Vi, gi, -1, fi, [0, fi, wi], 978, Ki, yi, Li];
    Qi.prototype.g = Si(ts);
    es = ki(Qi, ts);
    ns = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    rs = class extends $n {
      constructor(t2) {
        super(t2);
      }
      g() {
        return ln(this, ns, 1);
      }
    };
    is = [0, yi, [0, hi, ri, mi, -1]];
    ss = ki(rs, is);
    os = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    as = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    cs = class extends $n {
      constructor(t2) {
        super(t2);
      }
      h() {
        return hn(this, os, 2);
      }
      g() {
        return ln(this, as, 5);
      }
    };
    hs = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, pi, ui, si, [0, Ti, [0, hi, -3], [0, ri, -3], [0, hi, -1, [0, yi, [0, hi, -2]]], yi, [0, ri, -1, mi, ri]], mi, -1, oi, yi, [0, hi, ri], pi, oi]);
    us = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    ls = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, yi, [0, ri, -4]]);
    ds = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    fs = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, yi, [0, ri, -4]]);
    ps = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    gs = [0, hi, -1, si, Ti];
    ms = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    ms.prototype.g = Si([0, ri, -4, oi]);
    ys = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    _s = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, yi, [0, 1, hi, mi, is], oi]);
    vs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Es = class extends $n {
      constructor(t2) {
        super(t2);
      }
      ma() {
        const t2 = Ke(this);
        return null == t2 ? U() : t2;
      }
    };
    ws = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Ts = [1, 2];
    As = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, yi, [0, Ts, _i, [0, si], _i, [0, vi], hi, mi], oi]);
    bs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    ks = [0, mi, hi, ri, pi, -1];
    Ss = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    xs = [0, di, -1];
    Ls = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Rs = [1, 2, 3, 4, 5];
    Fs = class extends $n {
      constructor(t2) {
        super(t2);
      }
      g() {
        return null != Ke(this);
      }
      h() {
        return null != vn(this, 2);
      }
    };
    Is = class extends $n {
      constructor(t2) {
        super(t2);
      }
      g() {
        return Jt(Ve(this, 2)) ?? false;
      }
    };
    Ms = [0, vi, mi, [0, hi, oi, -1], [0, ci, oi]];
    Ps = [0, Ms, di, [0, Rs, _i, Bi, _i, Oi, _i, Pi, _i, Ni, _i, Ui], Ti];
    Cs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Os = [0, Ps, ri, -1, hi];
    Us = bi(502141897, Cs);
    ji[502141897] = Os;
    Ds = ki(class extends $n {
      constructor(t2) {
        super(t2);
      }
    }, [0, [0, Ti, -1, ii, Ei], gs]);
    Ns = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Bs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Gs = [0, Ps, ri, [0, Ps], di];
    js = [0, Ps, Os, Gs, ri, [0, [0, Ms]]];
    Vs = bi(508968150, Bs);
    ji[508968150] = js, ji[508968149] = Gs;
    Xs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Hs = bi(513916220, Xs);
    ji[513916220] = [0, Ps, js, hi];
    Ws = class extends $n {
      constructor(t2) {
        super(t2);
      }
      h() {
        return hn(this, bs, 2);
      }
      g() {
        He(this, 2);
      }
    };
    zs = [0, Ps, ks];
    ji[478825465] = zs;
    Ks = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Ys = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    $s = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    qs = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Js = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Zs = [0, Ps, [0, Ps], zs, -1];
    Qs = [0, Ps, ri, hi];
    to = [0, Ps, ri];
    eo = [0, Ps, Qs, to, ri];
    no = bi(479097054, Js);
    ji[479097054] = [0, Ps, eo, Zs], ji[463370452] = Zs, ji[464864288] = Qs;
    ro = bi(462713202, qs);
    ji[462713202] = eo, ji[474472470] = to;
    io = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    so = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    oo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    ao = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    co = [0, Ps, ri, -1, hi];
    ho = [0, Ps, ri, di];
    ao.prototype.g = Si([0, Ps, to, [0, Ps], Os, Gs, co, ho]);
    uo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    lo = bi(456383383, uo);
    ji[456383383] = [0, Ps, ks];
    fo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    po = bi(476348187, fo);
    ji[476348187] = [0, Ps, xs];
    go = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    mo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    yo = [0, Ti, -1];
    _o = bi(458105876, class extends $n {
      constructor(t2) {
        super(t2);
      }
      g() {
        var t2 = this.u;
        const e2 = 0 | t2[Q], n2 = 2 & e2;
        return t2 = (function(t3, e3, n3) {
          var r2 = mo;
          const i2 = 2 & e3;
          let s2 = false;
          if (null == n3) {
            if (i2) return Ie();
            n3 = [];
          } else if (n3.constructor === Ae) {
            if (0 == (2 & n3.M) || i2) return n3;
            n3 = n3.da();
          } else Array.isArray(n3) ? s2 = !!(2 & (0 | n3[Q])) : n3 = [];
          if (i2) {
            if (!n3.length) return Ie();
            s2 || (s2 = true, it(n3));
          } else s2 && (s2 = false, n3 = Qe(n3));
          return s2 || (64 & (0 | n3[Q]) ? n3[Q] &= -33 : 32 & e3 && nt(n3, 32)), We(t3, e3, 2, r2 = new Ae(n3, r2, ge, void 0)), r2;
        })(t2, e2, Xe(t2, e2, 2)), !n2 && mo && (t2.pa = true), t2;
      }
    });
    ji[458105876] = [0, yo, Yr, [true, oi, [0, mi, -1, pi]]];
    vo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Eo = bi(458105758, vo);
    ji[458105758] = [0, Ps, mi, yo];
    wo = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    To = bi(443442058, wo);
    ji[443442058] = [0, Ps, mi, hi, ri, pi, -1, di, ri], ji[514774813] = co;
    Ao = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    bo = bi(516587230, Ao);
    ji[516587230] = [0, Ps, co, ho, ri], ji[518928384] = ho;
    Po = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
    Uo = class {
    };
    Uo.forVisionTasks = function(t2) {
      return Oo("vision", t2);
    }, Uo.forTextTasks = function(t2) {
      return Oo("text", t2);
    }, Uo.forGenAiExperimentalTasks = function(t2) {
      return Oo("genai_experimental", t2);
    }, Uo.forGenAiTasks = function(t2) {
      return Oo("genai", t2);
    }, Uo.forAudioTasks = function(t2) {
      return Oo("audio", t2);
    }, Uo.isSimdSupported = function() {
      return Co();
    };
    Zo = class {
      constructor(t2) {
        this.g = t2, this.G = [], this.B = 0, this.g.setAutoRenderToScreen(false);
      }
      l(t2, e2 = true) {
        if (e2) {
          const e3 = t2.baseOptions || {};
          if (t2.baseOptions?.modelAssetBuffer && t2.baseOptions?.modelAssetPath) throw Error("Cannot set both baseOptions.modelAssetPath and baseOptions.modelAssetBuffer");
          if (!(hn(this.baseOptions, Fs, 1)?.g() || hn(this.baseOptions, Fs, 1)?.h() || t2.baseOptions?.modelAssetBuffer || t2.baseOptions?.modelAssetPath)) throw Error("Either baseOptions.modelAssetPath or baseOptions.modelAssetBuffer must be set");
          if ((function(t3, e4) {
            let n2 = hn(t3.baseOptions, Ls, 3);
            if (!n2) {
              var r2 = n2 = new Ls(), i2 = new Di();
              fn(r2, 4, Rs, i2);
            }
            "delegate" in e4 && ("GPU" === e4.delegate ? (e4 = n2, r2 = new Ci(), fn(e4, 2, Rs, r2)) : (e4 = n2, r2 = new Di(), fn(e4, 4, Rs, r2))), dn(t3.baseOptions, 0, 3, n2);
          })(this, e3), e3.modelAssetPath) return fetch(e3.modelAssetPath.toString()).then(((t3) => {
            if (t3.ok) return t3.arrayBuffer();
            throw Error(`Failed to fetch model: ${e3.modelAssetPath} (${t3.status})`);
          })).then(((t3) => {
            try {
              this.g.i.FS_unlink("/model.dat");
            } catch {
            }
            this.g.i.FS_createDataFile("/", "model.dat", new Uint8Array(t3), true, false, false), zo(this, "/model.dat"), this.m(), this.J();
          }));
          if (e3.modelAssetBuffer instanceof Uint8Array) zo(this, e3.modelAssetBuffer);
          else if (e3.modelAssetBuffer) return (async function(t3) {
            const e4 = [];
            for (var n2 = 0; ; ) {
              const { done: r2, value: i2 } = await t3.read();
              if (r2) break;
              e4.push(i2), n2 += i2.length;
            }
            if (0 === e4.length) return new Uint8Array(0);
            if (1 === e4.length) return e4[0];
            t3 = new Uint8Array(n2), n2 = 0;
            for (const r2 of e4) t3.set(r2, n2), n2 += r2.length;
            return t3;
          })(e3.modelAssetBuffer).then(((t3) => {
            zo(this, t3), this.m(), this.J();
          }));
        }
        return this.m(), this.J(), Promise.resolve();
      }
      J() {
      }
      ca() {
        let t2;
        if (this.g.ca(((e2) => {
          t2 = es(e2);
        })), !t2) throw Error("Failed to retrieve CalculatorGraphConfig");
        return t2;
      }
      setGraph(t2, e2) {
        this.g.attachErrorListener(((t3, e3) => {
          this.G.push(Error(e3));
        })), this.g.Ha(), this.g.setGraph(t2, e2), this.A = void 0, Ko(this);
      }
      finishProcessing() {
        this.g.finishProcessing(), Ko(this);
      }
      close() {
        this.A = void 0, this.g.closeGraph();
      }
    };
    Zo.prototype.close = Zo.prototype.close;
    ta = class {
      constructor(t2, e2, n2, r2) {
        this.g = t2, this.h = e2, this.m = n2, this.l = r2;
      }
      bind() {
        this.g.bindVertexArray(this.h);
      }
      close() {
        this.g.deleteVertexArray(this.h), this.g.deleteBuffer(this.m), this.g.deleteBuffer(this.l);
      }
    };
    ca = class {
      G() {
        return "\n  precision mediump float;\n  varying vec2 vTex;\n  uniform sampler2D inputTexture;\n  void main() {\n    gl_FragColor = texture2D(inputTexture, vTex);\n  }\n ";
      }
      m() {
        const t2 = this.g;
        if (this.h = Qo(t2.createProgram(), "Failed to create WebGL program"), this.Z = ea(this, "\n  attribute vec2 aVertex;\n  attribute vec2 aTex;\n  varying vec2 vTex;\n  void main(void) {\n    gl_Position = vec4(aVertex, 0.0, 1.0);\n    vTex = aTex;\n  }", t2.VERTEX_SHADER), this.Y = ea(this, this.G(), t2.FRAGMENT_SHADER), t2.linkProgram(this.h), !t2.getProgramParameter(this.h, t2.LINK_STATUS)) throw Error(`Error during program linking: ${t2.getProgramInfoLog(this.h)}`);
        this.P = t2.getAttribLocation(this.h, "aVertex"), this.J = t2.getAttribLocation(this.h, "aTex");
      }
      C() {
      }
      l() {
      }
      close() {
        if (this.h) {
          const t2 = this.g;
          t2.deleteProgram(this.h), t2.deleteShader(this.Z), t2.deleteShader(this.Y);
        }
        this.A && this.g.deleteFramebuffer(this.A), this.v && this.v.close(), this.s && this.s.close();
      }
    };
    ha = class extends ca {
      G() {
        return "\n  precision mediump float;\n  uniform sampler2D backgroundTexture;\n  uniform sampler2D maskTexture;\n  uniform sampler2D colorMappingTexture;\n  varying vec2 vTex;\n  void main() {\n    vec4 backgroundColor = texture2D(backgroundTexture, vTex);\n    float category = texture2D(maskTexture, vTex).r;\n    vec4 categoryColor = texture2D(colorMappingTexture, vec2(category, 0.0));\n    gl_FragColor = mix(backgroundColor, categoryColor, categoryColor.a);\n  }\n ";
      }
      C() {
        const t2 = this.g;
        t2.activeTexture(t2.TEXTURE1), this.B = sa(this, t2, t2.LINEAR), t2.activeTexture(t2.TEXTURE2), this.j = sa(this, t2, t2.NEAREST);
      }
      m() {
        super.m();
        const t2 = this.g;
        this.L = Qo(t2.getUniformLocation(this.h, "backgroundTexture"), "Uniform location"), this.U = Qo(t2.getUniformLocation(this.h, "colorMappingTexture"), "Uniform location"), this.K = Qo(t2.getUniformLocation(this.h, "maskTexture"), "Uniform location");
      }
      l() {
        super.l();
        const t2 = this.g;
        t2.uniform1i(this.K, 0), t2.uniform1i(this.L, 1), t2.uniform1i(this.U, 2);
      }
      close() {
        this.B && this.g.deleteTexture(this.B), this.j && this.g.deleteTexture(this.j), super.close();
      }
    };
    ua = class extends ca {
      G() {
        return "\n  precision mediump float;\n  uniform sampler2D maskTexture;\n  uniform sampler2D defaultTexture;\n  uniform sampler2D overlayTexture;\n  varying vec2 vTex;\n  void main() {\n    float confidence = texture2D(maskTexture, vTex).r;\n    vec4 defaultColor = texture2D(defaultTexture, vTex);\n    vec4 overlayColor = texture2D(overlayTexture, vTex);\n    // Apply the alpha from the overlay and merge in the default color\n    overlayColor = mix(defaultColor, overlayColor, overlayColor.a);\n    gl_FragColor = mix(defaultColor, overlayColor, confidence);\n  }\n ";
      }
      C() {
        const t2 = this.g;
        t2.activeTexture(t2.TEXTURE1), this.j = sa(this, t2), t2.activeTexture(t2.TEXTURE2), this.B = sa(this, t2);
      }
      m() {
        super.m();
        const t2 = this.g;
        this.K = Qo(t2.getUniformLocation(this.h, "defaultTexture"), "Uniform location"), this.L = Qo(t2.getUniformLocation(this.h, "overlayTexture"), "Uniform location"), this.H = Qo(t2.getUniformLocation(this.h, "maskTexture"), "Uniform location");
      }
      l() {
        super.l();
        const t2 = this.g;
        t2.uniform1i(this.H, 0), t2.uniform1i(this.K, 1), t2.uniform1i(this.L, 2);
      }
      close() {
        this.j && this.g.deleteTexture(this.j), this.B && this.g.deleteTexture(this.B), super.close();
      }
    };
    Ea = class {
      constructor(t2, e2, n2, r2, i2, s2, o2) {
        this.g = t2, this.m = e2, this.j = n2, this.canvas = r2, this.l = i2, this.width = s2, this.height = o2, this.j && (0 === --wa && console.error("You seem to be creating MPMask instances without invoking .close(). This leaks resources."));
      }
      Da() {
        return !!la(this, 0);
      }
      ja() {
        return !!la(this, 1);
      }
      R() {
        return !!la(this, 2);
      }
      ia() {
        return (e2 = la(t2 = this, 0)) || (e2 = da(t2), e2 = new Uint8Array(e2.map(((t3) => 255 * t3))), t2.g.push(e2)), e2;
        var t2, e2;
      }
      ha() {
        return da(this);
      }
      N() {
        return fa(this);
      }
      clone() {
        const t2 = [];
        for (const e2 of this.g) {
          let n2;
          if (e2 instanceof Uint8Array) n2 = new Uint8Array(e2);
          else if (e2 instanceof Float32Array) n2 = new Float32Array(e2);
          else {
            if (!(e2 instanceof WebGLTexture)) throw Error(`Type is not supported: ${e2}`);
            {
              const t3 = pa(this), e3 = ma(this);
              t3.activeTexture(t3.TEXTURE1), n2 = sa(e3, t3, this.m ? t3.LINEAR : t3.NEAREST), t3.bindTexture(t3.TEXTURE_2D, n2);
              const r2 = ga(this);
              t3.texImage2D(t3.TEXTURE_2D, 0, r2, this.width, this.height, 0, t3.RED, t3.FLOAT, null), t3.bindTexture(t3.TEXTURE_2D, null), oa(e3, t3, n2), ia(e3, t3, false, (() => {
                ya(this), t3.clearColor(0, 0, 0, 0), t3.clear(t3.COLOR_BUFFER_BIT), t3.drawArrays(t3.TRIANGLE_FAN, 0, 4), _a(this);
              })), aa(e3), _a(this);
            }
          }
          t2.push(n2);
        }
        return new Ea(t2, this.m, this.R(), this.canvas, this.l, this.width, this.height);
      }
      close() {
        this.j && pa(this).deleteTexture(la(this, 2)), wa = -1;
      }
    };
    Ea.prototype.close = Ea.prototype.close, Ea.prototype.clone = Ea.prototype.clone, Ea.prototype.getAsWebGLTexture = Ea.prototype.N, Ea.prototype.getAsFloat32Array = Ea.prototype.ha, Ea.prototype.getAsUint8Array = Ea.prototype.ia, Ea.prototype.hasWebGLTexture = Ea.prototype.R, Ea.prototype.hasFloat32Array = Ea.prototype.ja, Ea.prototype.hasUint8Array = Ea.prototype.Da;
    wa = 250;
    Ta = { color: "white", lineWidth: 4, radius: 6 };
    Ia = class {
      constructor(t2, e2) {
        "undefined" != typeof CanvasRenderingContext2D && t2 instanceof CanvasRenderingContext2D || t2 instanceof OffscreenCanvasRenderingContext2D ? (this.l = t2, this.j = e2) : this.j = t2;
      }
      wa(t2, e2) {
        if (t2) {
          var n2 = Sa(this);
          e2 = Aa(e2), n2.save();
          var r2 = n2.canvas, i2 = 0;
          for (const s2 of t2) n2.fillStyle = ba(e2.fillColor, { index: i2, from: s2 }), n2.strokeStyle = ba(e2.color, { index: i2, from: s2 }), n2.lineWidth = ba(e2.lineWidth, { index: i2, from: s2 }), (t2 = new Path2D()).arc(s2.x * r2.width, s2.y * r2.height, ba(e2.radius, { index: i2, from: s2 }), 0, 2 * Math.PI), n2.fill(t2), n2.stroke(t2), ++i2;
          n2.restore();
        }
      }
      va(t2, e2, n2) {
        if (t2 && e2) {
          var r2 = Sa(this);
          n2 = Aa(n2), r2.save();
          var i2 = r2.canvas, s2 = 0;
          for (const o2 of e2) {
            r2.beginPath(), e2 = t2[o2.start];
            const a2 = t2[o2.end];
            e2 && a2 && (r2.strokeStyle = ba(n2.color, { index: s2, from: e2, to: a2 }), r2.lineWidth = ba(n2.lineWidth, { index: s2, from: e2, to: a2 }), r2.moveTo(e2.x * i2.width, e2.y * i2.height), r2.lineTo(a2.x * i2.width, a2.y * i2.height)), ++s2, r2.stroke();
          }
          r2.restore();
        }
      }
      sa(t2, e2) {
        const n2 = Sa(this);
        e2 = Aa(e2), n2.save(), n2.beginPath(), n2.lineWidth = ba(e2.lineWidth, {}), n2.strokeStyle = ba(e2.color, {}), n2.fillStyle = ba(e2.fillColor, {}), n2.moveTo(t2.originX, t2.originY), n2.lineTo(t2.originX + t2.width, t2.originY), n2.lineTo(t2.originX + t2.width, t2.originY + t2.height), n2.lineTo(t2.originX, t2.originY + t2.height), n2.lineTo(t2.originX, t2.originY), n2.stroke(), n2.fill(), n2.restore();
      }
      ta(t2, e2, n2 = [0, 0, 0, 255]) {
        this.l ? (function(t3, e3, n3, r2) {
          const i2 = xa(t3);
          La(t3, e3, ((e4) => {
            Ra(t3, e4, n3, r2), (e4 = Sa(t3)).drawImage(i2.canvas, 0, 0, e4.canvas.width, e4.canvas.height);
          }));
        })(this, t2, n2, e2) : Ra(this, t2.N(), n2, e2);
      }
      ua(t2, e2, n2) {
        this.l ? (function(t3, e3, n3, r2) {
          const i2 = xa(t3);
          La(t3, e3, ((e4) => {
            Fa(t3, e4, n3, r2), (e4 = Sa(t3)).drawImage(i2.canvas, 0, 0, e4.canvas.width, e4.canvas.height);
          }));
        })(this, t2, e2, n2) : Fa(this, t2.N(), e2, n2);
      }
      close() {
        this.g?.close(), this.g = void 0, this.h?.close(), this.h = void 0, this.m?.close(), this.m = void 0;
      }
    };
    Ia.prototype.close = Ia.prototype.close, Ia.prototype.drawConfidenceMask = Ia.prototype.ua, Ia.prototype.drawCategoryMask = Ia.prototype.ta, Ia.prototype.drawBoundingBox = Ia.prototype.sa, Ia.prototype.drawConnectors = Ia.prototype.va, Ia.prototype.drawLandmarks = Ia.prototype.wa, Ia.lerp = function(t2, e2, n2, r2, i2) {
      return ka(r2 * (1 - (t2 - e2) / (n2 - e2)) + i2 * (1 - (n2 - t2) / (n2 - e2)), r2, i2);
    }, Ia.clamp = ka;
    Ga = class {
      constructor(t2, e2, n2, r2, i2, s2, o2) {
        this.g = t2, this.j = e2, this.m = n2, this.canvas = r2, this.l = i2, this.width = s2, this.height = o2, (this.j || this.m) && (0 === --ja && console.error("You seem to be creating MPImage instances without invoking .close(). This leaks resources."));
      }
      Ca() {
        return !!Ma(this, 0);
      }
      ka() {
        return !!Ma(this, 1);
      }
      R() {
        return !!Ma(this, 2);
      }
      Aa() {
        return Pa(this);
      }
      za() {
        var t2 = Ma(this, 1);
        return t2 || (Ca(this), Da(this), t2 = Ba(this), Na(this), this.g.push(t2), this.j = true), t2;
      }
      N() {
        return Ca(this);
      }
      clone() {
        const t2 = [];
        for (const e2 of this.g) {
          let n2;
          if (e2 instanceof ImageData) n2 = new ImageData(e2.data, this.width, this.height);
          else if (e2 instanceof WebGLTexture) {
            const t3 = Oa(this), e3 = Ua(this);
            t3.activeTexture(t3.TEXTURE1), n2 = sa(e3, t3), t3.bindTexture(t3.TEXTURE_2D, n2), t3.texImage2D(t3.TEXTURE_2D, 0, t3.RGBA, this.width, this.height, 0, t3.RGBA, t3.UNSIGNED_BYTE, null), t3.bindTexture(t3.TEXTURE_2D, null), oa(e3, t3, n2), ia(e3, t3, false, (() => {
              Da(this), t3.clearColor(0, 0, 0, 0), t3.clear(t3.COLOR_BUFFER_BIT), t3.drawArrays(t3.TRIANGLE_FAN, 0, 4), Na(this);
            })), aa(e3), Na(this);
          } else {
            if (!(e2 instanceof ImageBitmap)) throw Error(`Type is not supported: ${e2}`);
            Ca(this), Da(this), n2 = Ba(this), Na(this);
          }
          t2.push(n2);
        }
        return new Ga(t2, this.ka(), this.R(), this.canvas, this.l, this.width, this.height);
      }
      close() {
        this.j && Ma(this, 1).close(), this.m && Oa(this).deleteTexture(Ma(this, 2)), ja = -1;
      }
    };
    Ga.prototype.close = Ga.prototype.close, Ga.prototype.clone = Ga.prototype.clone, Ga.prototype.getAsWebGLTexture = Ga.prototype.N, Ga.prototype.getAsImageBitmap = Ga.prototype.za, Ga.prototype.getAsImageData = Ga.prototype.Aa, Ga.prototype.hasWebGLTexture = Ga.prototype.R, Ga.prototype.hasImageBitmap = Ga.prototype.ka, Ga.prototype.hasImageData = Ga.prototype.Ca;
    ja = 250;
    Xa = /* @__PURE__ */ (function(t2) {
      return class extends t2 {
        Ha() {
          this.i._registerModelResourcesGraphService();
        }
      };
    })((Ha = class {
      constructor(t2, e2) {
        this.l = true, this.i = t2, this.g = null, this.h = 0, this.m = "function" == typeof this.i._addIntToInputStream, void 0 !== e2 ? this.i.canvas = e2 : Do() ? this.i.canvas = new OffscreenCanvas(1, 1) : (console.warn("OffscreenCanvas not supported and GraphRunner constructor glCanvas parameter is undefined. Creating backup canvas."), this.i.canvas = document.createElement("canvas"));
      }
      async initializeGraph(t2) {
        const e2 = await (await fetch(t2)).arrayBuffer();
        t2 = !(t2.endsWith(".pbtxt") || t2.endsWith(".textproto")), this.setGraph(new Uint8Array(e2), t2);
      }
      setGraphFromString(t2) {
        this.setGraph(new TextEncoder().encode(t2), false);
      }
      setGraph(t2, e2) {
        const n2 = t2.length, r2 = this.i._malloc(n2);
        this.i.HEAPU8.set(t2, r2), e2 ? this.i._changeBinaryGraph(n2, r2) : this.i._changeTextGraph(n2, r2), this.i._free(r2);
      }
      configureAudio(t2, e2, n2, r2, i2) {
        this.i._configureAudio || console.warn('Attempting to use configureAudio without support for input audio. Is build dep ":gl_graph_runner_audio" missing?'), Go(this, r2 || "input_audio", ((r3) => {
          Go(this, i2 = i2 || "audio_header", ((i3) => {
            this.i._configureAudio(r3, i3, t2, e2 ?? 0, n2);
          }));
        }));
      }
      setAutoResizeCanvas(t2) {
        this.l = t2;
      }
      setAutoRenderToScreen(t2) {
        this.i._setAutoRenderToScreen(t2);
      }
      setGpuBufferVerticalFlip(t2) {
        this.i.gpuOriginForWebTexturesIsBottomLeft = t2;
      }
      ca(t2) {
        Xo(this, "__graph_config__", ((e2) => {
          t2(e2);
        })), Go(this, "__graph_config__", ((t3) => {
          this.i._getGraphConfig(t3, void 0);
        })), delete this.i.simpleListeners.__graph_config__;
      }
      attachErrorListener(t2) {
        this.i.errorListener = t2;
      }
      attachEmptyPacketListener(t2, e2) {
        this.i.emptyPacketListeners = this.i.emptyPacketListeners || {}, this.i.emptyPacketListeners[t2] = e2;
      }
      addAudioToStream(t2, e2, n2) {
        this.addAudioToStreamWithShape(t2, 0, 0, e2, n2);
      }
      addAudioToStreamWithShape(t2, e2, n2, r2, i2) {
        const s2 = 4 * t2.length;
        this.h !== s2 && (this.g && this.i._free(this.g), this.g = this.i._malloc(s2), this.h = s2), this.i.HEAPF32.set(t2, this.g / 4), Go(this, r2, ((t3) => {
          this.i._addAudioToInputStream(this.g, e2, n2, t3, i2);
        }));
      }
      addGpuBufferToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const [r2, i2] = jo(this, t2, e3);
          this.i._addBoundTextureToStream(e3, r2, i2, n2);
        }));
      }
      addBoolToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          this.i._addBoolToInputStream(t2, e3, n2);
        }));
      }
      addDoubleToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          this.i._addDoubleToInputStream(t2, e3, n2);
        }));
      }
      addFloatToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          this.i._addFloatToInputStream(t2, e3, n2);
        }));
      }
      addIntToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          this.i._addIntToInputStream(t2, e3, n2);
        }));
      }
      addUintToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          this.i._addUintToInputStream(t2, e3, n2);
        }));
      }
      addStringToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          Go(this, t2, ((t3) => {
            this.i._addStringToInputStream(t3, e3, n2);
          }));
        }));
      }
      addStringRecordToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          Vo(this, Object.keys(t2), ((r2) => {
            Vo(this, Object.values(t2), ((i2) => {
              this.i._addFlatHashMapToInputStream(r2, i2, Object.keys(t2).length, e3, n2);
            }));
          }));
        }));
      }
      addProtoToStream(t2, e2, n2, r2) {
        Go(this, n2, ((n3) => {
          Go(this, e2, ((e3) => {
            const i2 = this.i._malloc(t2.length);
            this.i.HEAPU8.set(t2, i2), this.i._addProtoToInputStream(i2, t2.length, e3, n3, r2), this.i._free(i2);
          }));
        }));
      }
      addEmptyPacketToStream(t2, e2) {
        Go(this, t2, ((t3) => {
          this.i._addEmptyPacketToInputStream(t3, e2);
        }));
      }
      addBoolVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateBoolVector(t2.length);
          if (!r2) throw Error("Unable to allocate new bool vector on heap.");
          for (const e4 of t2) this.i._addBoolVectorEntry(r2, e4);
          this.i._addBoolVectorToInputStream(r2, e3, n2);
        }));
      }
      addDoubleVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateDoubleVector(t2.length);
          if (!r2) throw Error("Unable to allocate new double vector on heap.");
          for (const e4 of t2) this.i._addDoubleVectorEntry(r2, e4);
          this.i._addDoubleVectorToInputStream(r2, e3, n2);
        }));
      }
      addFloatVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateFloatVector(t2.length);
          if (!r2) throw Error("Unable to allocate new float vector on heap.");
          for (const e4 of t2) this.i._addFloatVectorEntry(r2, e4);
          this.i._addFloatVectorToInputStream(r2, e3, n2);
        }));
      }
      addIntVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateIntVector(t2.length);
          if (!r2) throw Error("Unable to allocate new int vector on heap.");
          for (const e4 of t2) this.i._addIntVectorEntry(r2, e4);
          this.i._addIntVectorToInputStream(r2, e3, n2);
        }));
      }
      addUintVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateUintVector(t2.length);
          if (!r2) throw Error("Unable to allocate new unsigned int vector on heap.");
          for (const e4 of t2) this.i._addUintVectorEntry(r2, e4);
          this.i._addUintVectorToInputStream(r2, e3, n2);
        }));
      }
      addStringVectorToStream(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const r2 = this.i._allocateStringVector(t2.length);
          if (!r2) throw Error("Unable to allocate new string vector on heap.");
          for (const e4 of t2) Go(this, e4, ((t3) => {
            this.i._addStringVectorEntry(r2, t3);
          }));
          this.i._addStringVectorToInputStream(r2, e3, n2);
        }));
      }
      addBoolToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          this.i._addBoolToInputSidePacket(t2, e3);
        }));
      }
      addDoubleToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          this.i._addDoubleToInputSidePacket(t2, e3);
        }));
      }
      addFloatToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          this.i._addFloatToInputSidePacket(t2, e3);
        }));
      }
      addIntToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          this.i._addIntToInputSidePacket(t2, e3);
        }));
      }
      addUintToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          this.i._addUintToInputSidePacket(t2, e3);
        }));
      }
      addStringToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          Go(this, t2, ((t3) => {
            this.i._addStringToInputSidePacket(t3, e3);
          }));
        }));
      }
      addProtoToInputSidePacket(t2, e2, n2) {
        Go(this, n2, ((n3) => {
          Go(this, e2, ((e3) => {
            const r2 = this.i._malloc(t2.length);
            this.i.HEAPU8.set(t2, r2), this.i._addProtoToInputSidePacket(r2, t2.length, e3, n3), this.i._free(r2);
          }));
        }));
      }
      addBoolVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateBoolVector(t2.length);
          if (!n2) throw Error("Unable to allocate new bool vector on heap.");
          for (const e4 of t2) this.i._addBoolVectorEntry(n2, e4);
          this.i._addBoolVectorToInputSidePacket(n2, e3);
        }));
      }
      addDoubleVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateDoubleVector(t2.length);
          if (!n2) throw Error("Unable to allocate new double vector on heap.");
          for (const e4 of t2) this.i._addDoubleVectorEntry(n2, e4);
          this.i._addDoubleVectorToInputSidePacket(n2, e3);
        }));
      }
      addFloatVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateFloatVector(t2.length);
          if (!n2) throw Error("Unable to allocate new float vector on heap.");
          for (const e4 of t2) this.i._addFloatVectorEntry(n2, e4);
          this.i._addFloatVectorToInputSidePacket(n2, e3);
        }));
      }
      addIntVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateIntVector(t2.length);
          if (!n2) throw Error("Unable to allocate new int vector on heap.");
          for (const e4 of t2) this.i._addIntVectorEntry(n2, e4);
          this.i._addIntVectorToInputSidePacket(n2, e3);
        }));
      }
      addUintVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateUintVector(t2.length);
          if (!n2) throw Error("Unable to allocate new unsigned int vector on heap.");
          for (const e4 of t2) this.i._addUintVectorEntry(n2, e4);
          this.i._addUintVectorToInputSidePacket(n2, e3);
        }));
      }
      addStringVectorToInputSidePacket(t2, e2) {
        Go(this, e2, ((e3) => {
          const n2 = this.i._allocateStringVector(t2.length);
          if (!n2) throw Error("Unable to allocate new string vector on heap.");
          for (const e4 of t2) Go(this, e4, ((t3) => {
            this.i._addStringVectorEntry(n2, t3);
          }));
          this.i._addStringVectorToInputSidePacket(n2, e3);
        }));
      }
      attachBoolListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachBoolListener(t3);
        }));
      }
      attachBoolVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachBoolVectorListener(t3);
        }));
      }
      attachIntListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachIntListener(t3);
        }));
      }
      attachIntVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachIntVectorListener(t3);
        }));
      }
      attachUintListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachUintListener(t3);
        }));
      }
      attachUintVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachUintVectorListener(t3);
        }));
      }
      attachDoubleListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachDoubleListener(t3);
        }));
      }
      attachDoubleVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachDoubleVectorListener(t3);
        }));
      }
      attachFloatListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachFloatListener(t3);
        }));
      }
      attachFloatVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachFloatVectorListener(t3);
        }));
      }
      attachStringListener(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachStringListener(t3);
        }));
      }
      attachStringVectorListener(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachStringVectorListener(t3);
        }));
      }
      attachProtoListener(t2, e2, n2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachProtoListener(t3, n2 || false);
        }));
      }
      attachProtoVectorListener(t2, e2, n2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.i._attachProtoVectorListener(t3, n2 || false);
        }));
      }
      attachAudioListener(t2, e2, n2) {
        this.i._attachAudioListener || console.warn('Attempting to use attachAudioListener without support for output audio. Is build dep ":gl_graph_runner_audio_out" missing?'), Xo(this, t2, ((t3, n3) => {
          t3 = new Float32Array(t3.buffer, t3.byteOffset, t3.length / 4), e2(t3, n3);
        })), Go(this, t2, ((t3) => {
          this.i._attachAudioListener(t3, n2 || false);
        }));
      }
      finishProcessing() {
        this.i._waitUntilIdle();
      }
      closeGraph() {
        this.i._closeGraph(), this.i.simpleListeners = void 0, this.i.emptyPacketListeners = void 0;
      }
    }, class extends Ha {
      get ea() {
        return this.i;
      }
      oa(t2, e2, n2) {
        Go(this, e2, ((e3) => {
          const [r2, i2] = jo(this, t2, e3);
          this.ea._addBoundTextureAsImageToStream(e3, r2, i2, n2);
        }));
      }
      V(t2, e2) {
        Xo(this, t2, e2), Go(this, t2, ((t3) => {
          this.ea._attachImageListener(t3);
        }));
      }
      ba(t2, e2) {
        Ho(this, t2, e2), Go(this, t2, ((t3) => {
          this.ea._attachImageVectorListener(t3);
        }));
      }
    }));
    Wa = class extends Xa {
    };
    Ja = class extends Zo {
      constructor(t2, e2, n2, r2) {
        super(t2), this.g = t2, this.Z = e2, this.U = n2, this.na = r2, this.P = new ca();
      }
      l(t2, e2 = true) {
        if ("runningMode" in t2 && wn(this.baseOptions, 2, !!t2.runningMode && "IMAGE" !== t2.runningMode), void 0 !== t2.canvas && this.g.i.canvas !== t2.canvas) throw Error("You must create a new task to reset the canvas.");
        return super.l(t2, e2);
      }
      close() {
        this.P.close(), super.close();
      }
    };
    Ja.prototype.close = Ja.prototype.close;
    Za = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect_in", false), this.j = { detections: [] }, dn(t2 = this.h = new Cs(), 0, 1, e2 = new Is()), An(this.h, 2, 0.5), An(this.h, 3, 0.3);
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return "minDetectionConfidence" in t2 && An(this.h, 2, t2.minDetectionConfidence ?? 0.5), "minSuppressionThreshold" in t2 && An(this.h, 3, t2.minSuppressionThreshold ?? 0.3), this.l(t2);
      }
      D(t2, e2) {
        return this.j = { detections: [] }, Ya(this, t2, e2), this.j;
      }
      F(t2, e2, n2) {
        return this.j = { detections: [] }, $a(this, t2, n2, e2), this.j;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect_in"), Zi(t2, "detections");
        const e2 = new Gi();
        Yn(e2, Us, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.face_detector.FaceDetectorGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect_in"), Wi(n2, "DETECTIONS:detections"), n2.o(e2), qi(t2, n2), this.g.attachProtoVectorListener("detections", ((t3, e3) => {
          for (const e4 of t3) t3 = hs(e4), this.j.detections.push(xo(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("detections", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Za.prototype.detectForVideo = Za.prototype.F, Za.prototype.detect = Za.prototype.D, Za.prototype.setOptions = Za.prototype.o, Za.createFromModelPath = async function(t2, e2) {
      return za(Za, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Za.createFromModelBuffer = function(t2, e2) {
      return za(Za, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Za.createFromOptions = function(t2, e2) {
      return za(Za, t2, e2);
    };
    Qa = Va([61, 146], [146, 91], [91, 181], [181, 84], [84, 17], [17, 314], [314, 405], [405, 321], [321, 375], [375, 291], [61, 185], [185, 40], [40, 39], [39, 37], [37, 0], [0, 267], [267, 269], [269, 270], [270, 409], [409, 291], [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318], [318, 324], [324, 308], [78, 191], [191, 80], [80, 81], [81, 82], [82, 13], [13, 312], [312, 311], [311, 310], [310, 415], [415, 308]);
    tc = Va([263, 249], [249, 390], [390, 373], [373, 374], [374, 380], [380, 381], [381, 382], [382, 362], [263, 466], [466, 388], [388, 387], [387, 386], [386, 385], [385, 384], [384, 398], [398, 362]);
    ec = Va([276, 283], [283, 282], [282, 295], [295, 285], [300, 293], [293, 334], [334, 296], [296, 336]);
    nc = Va([474, 475], [475, 476], [476, 477], [477, 474]);
    rc = Va([33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133], [33, 246], [246, 161], [161, 160], [160, 159], [159, 158], [158, 157], [157, 173], [173, 133]);
    ic = Va([46, 53], [53, 52], [52, 65], [65, 55], [70, 63], [63, 105], [105, 66], [66, 107]);
    sc = Va([469, 470], [470, 471], [471, 472], [472, 469]);
    oc = Va([10, 338], [338, 297], [297, 332], [332, 284], [284, 251], [251, 389], [389, 356], [356, 454], [454, 323], [323, 361], [361, 288], [288, 397], [397, 365], [365, 379], [379, 378], [378, 400], [400, 377], [377, 152], [152, 148], [148, 176], [176, 149], [149, 150], [150, 136], [136, 172], [172, 58], [58, 132], [132, 93], [93, 234], [234, 127], [127, 162], [162, 21], [21, 54], [54, 103], [103, 67], [67, 109], [109, 10]);
    ac = [...Qa, ...tc, ...ec, ...rc, ...ic, ...oc];
    cc = Va([127, 34], [34, 139], [139, 127], [11, 0], [0, 37], [37, 11], [232, 231], [231, 120], [120, 232], [72, 37], [37, 39], [39, 72], [128, 121], [121, 47], [47, 128], [232, 121], [121, 128], [128, 232], [104, 69], [69, 67], [67, 104], [175, 171], [171, 148], [148, 175], [118, 50], [50, 101], [101, 118], [73, 39], [39, 40], [40, 73], [9, 151], [151, 108], [108, 9], [48, 115], [115, 131], [131, 48], [194, 204], [204, 211], [211, 194], [74, 40], [40, 185], [185, 74], [80, 42], [42, 183], [183, 80], [40, 92], [92, 186], [186, 40], [230, 229], [229, 118], [118, 230], [202, 212], [212, 214], [214, 202], [83, 18], [18, 17], [17, 83], [76, 61], [61, 146], [146, 76], [160, 29], [29, 30], [30, 160], [56, 157], [157, 173], [173, 56], [106, 204], [204, 194], [194, 106], [135, 214], [214, 192], [192, 135], [203, 165], [165, 98], [98, 203], [21, 71], [71, 68], [68, 21], [51, 45], [45, 4], [4, 51], [144, 24], [24, 23], [23, 144], [77, 146], [146, 91], [91, 77], [205, 50], [50, 187], [187, 205], [201, 200], [200, 18], [18, 201], [91, 106], [106, 182], [182, 91], [90, 91], [91, 181], [181, 90], [85, 84], [84, 17], [17, 85], [206, 203], [203, 36], [36, 206], [148, 171], [171, 140], [140, 148], [92, 40], [40, 39], [39, 92], [193, 189], [189, 244], [244, 193], [159, 158], [158, 28], [28, 159], [247, 246], [246, 161], [161, 247], [236, 3], [3, 196], [196, 236], [54, 68], [68, 104], [104, 54], [193, 168], [168, 8], [8, 193], [117, 228], [228, 31], [31, 117], [189, 193], [193, 55], [55, 189], [98, 97], [97, 99], [99, 98], [126, 47], [47, 100], [100, 126], [166, 79], [79, 218], [218, 166], [155, 154], [154, 26], [26, 155], [209, 49], [49, 131], [131, 209], [135, 136], [136, 150], [150, 135], [47, 126], [126, 217], [217, 47], [223, 52], [52, 53], [53, 223], [45, 51], [51, 134], [134, 45], [211, 170], [170, 140], [140, 211], [67, 69], [69, 108], [108, 67], [43, 106], [106, 91], [91, 43], [230, 119], [119, 120], [120, 230], [226, 130], [130, 247], [247, 226], [63, 53], [53, 52], [52, 63], [238, 20], [20, 242], [242, 238], [46, 70], [70, 156], [156, 46], [78, 62], [62, 96], [96, 78], [46, 53], [53, 63], [63, 46], [143, 34], [34, 227], [227, 143], [123, 117], [117, 111], [111, 123], [44, 125], [125, 19], [19, 44], [236, 134], [134, 51], [51, 236], [216, 206], [206, 205], [205, 216], [154, 153], [153, 22], [22, 154], [39, 37], [37, 167], [167, 39], [200, 201], [201, 208], [208, 200], [36, 142], [142, 100], [100, 36], [57, 212], [212, 202], [202, 57], [20, 60], [60, 99], [99, 20], [28, 158], [158, 157], [157, 28], [35, 226], [226, 113], [113, 35], [160, 159], [159, 27], [27, 160], [204, 202], [202, 210], [210, 204], [113, 225], [225, 46], [46, 113], [43, 202], [202, 204], [204, 43], [62, 76], [76, 77], [77, 62], [137, 123], [123, 116], [116, 137], [41, 38], [38, 72], [72, 41], [203, 129], [129, 142], [142, 203], [64, 98], [98, 240], [240, 64], [49, 102], [102, 64], [64, 49], [41, 73], [73, 74], [74, 41], [212, 216], [216, 207], [207, 212], [42, 74], [74, 184], [184, 42], [169, 170], [170, 211], [211, 169], [170, 149], [149, 176], [176, 170], [105, 66], [66, 69], [69, 105], [122, 6], [6, 168], [168, 122], [123, 147], [147, 187], [187, 123], [96, 77], [77, 90], [90, 96], [65, 55], [55, 107], [107, 65], [89, 90], [90, 180], [180, 89], [101, 100], [100, 120], [120, 101], [63, 105], [105, 104], [104, 63], [93, 137], [137, 227], [227, 93], [15, 86], [86, 85], [85, 15], [129, 102], [102, 49], [49, 129], [14, 87], [87, 86], [86, 14], [55, 8], [8, 9], [9, 55], [100, 47], [47, 121], [121, 100], [145, 23], [23, 22], [22, 145], [88, 89], [89, 179], [179, 88], [6, 122], [122, 196], [196, 6], [88, 95], [95, 96], [96, 88], [138, 172], [172, 136], [136, 138], [215, 58], [58, 172], [172, 215], [115, 48], [48, 219], [219, 115], [42, 80], [80, 81], [81, 42], [195, 3], [3, 51], [51, 195], [43, 146], [146, 61], [61, 43], [171, 175], [175, 199], [199, 171], [81, 82], [82, 38], [38, 81], [53, 46], [46, 225], [225, 53], [144, 163], [163, 110], [110, 144], [52, 65], [65, 66], [66, 52], [229, 228], [228, 117], [117, 229], [34, 127], [127, 234], [234, 34], [107, 108], [108, 69], [69, 107], [109, 108], [108, 151], [151, 109], [48, 64], [64, 235], [235, 48], [62, 78], [78, 191], [191, 62], [129, 209], [209, 126], [126, 129], [111, 35], [35, 143], [143, 111], [117, 123], [123, 50], [50, 117], [222, 65], [65, 52], [52, 222], [19, 125], [125, 141], [141, 19], [221, 55], [55, 65], [65, 221], [3, 195], [195, 197], [197, 3], [25, 7], [7, 33], [33, 25], [220, 237], [237, 44], [44, 220], [70, 71], [71, 139], [139, 70], [122, 193], [193, 245], [245, 122], [247, 130], [130, 33], [33, 247], [71, 21], [21, 162], [162, 71], [170, 169], [169, 150], [150, 170], [188, 174], [174, 196], [196, 188], [216, 186], [186, 92], [92, 216], [2, 97], [97, 167], [167, 2], [141, 125], [125, 241], [241, 141], [164, 167], [167, 37], [37, 164], [72, 38], [38, 12], [12, 72], [38, 82], [82, 13], [13, 38], [63, 68], [68, 71], [71, 63], [226, 35], [35, 111], [111, 226], [101, 50], [50, 205], [205, 101], [206, 92], [92, 165], [165, 206], [209, 198], [198, 217], [217, 209], [165, 167], [167, 97], [97, 165], [220, 115], [115, 218], [218, 220], [133, 112], [112, 243], [243, 133], [239, 238], [238, 241], [241, 239], [214, 135], [135, 169], [169, 214], [190, 173], [173, 133], [133, 190], [171, 208], [208, 32], [32, 171], [125, 44], [44, 237], [237, 125], [86, 87], [87, 178], [178, 86], [85, 86], [86, 179], [179, 85], [84, 85], [85, 180], [180, 84], [83, 84], [84, 181], [181, 83], [201, 83], [83, 182], [182, 201], [137, 93], [93, 132], [132, 137], [76, 62], [62, 183], [183, 76], [61, 76], [76, 184], [184, 61], [57, 61], [61, 185], [185, 57], [212, 57], [57, 186], [186, 212], [214, 207], [207, 187], [187, 214], [34, 143], [143, 156], [156, 34], [79, 239], [239, 237], [237, 79], [123, 137], [137, 177], [177, 123], [44, 1], [1, 4], [4, 44], [201, 194], [194, 32], [32, 201], [64, 102], [102, 129], [129, 64], [213, 215], [215, 138], [138, 213], [59, 166], [166, 219], [219, 59], [242, 99], [99, 97], [97, 242], [2, 94], [94, 141], [141, 2], [75, 59], [59, 235], [235, 75], [24, 110], [110, 228], [228, 24], [25, 130], [130, 226], [226, 25], [23, 24], [24, 229], [229, 23], [22, 23], [23, 230], [230, 22], [26, 22], [22, 231], [231, 26], [112, 26], [26, 232], [232, 112], [189, 190], [190, 243], [243, 189], [221, 56], [56, 190], [190, 221], [28, 56], [56, 221], [221, 28], [27, 28], [28, 222], [222, 27], [29, 27], [27, 223], [223, 29], [30, 29], [29, 224], [224, 30], [247, 30], [30, 225], [225, 247], [238, 79], [79, 20], [20, 238], [166, 59], [59, 75], [75, 166], [60, 75], [75, 240], [240, 60], [147, 177], [177, 215], [215, 147], [20, 79], [79, 166], [166, 20], [187, 147], [147, 213], [213, 187], [112, 233], [233, 244], [244, 112], [233, 128], [128, 245], [245, 233], [128, 114], [114, 188], [188, 128], [114, 217], [217, 174], [174, 114], [131, 115], [115, 220], [220, 131], [217, 198], [198, 236], [236, 217], [198, 131], [131, 134], [134, 198], [177, 132], [132, 58], [58, 177], [143, 35], [35, 124], [124, 143], [110, 163], [163, 7], [7, 110], [228, 110], [110, 25], [25, 228], [356, 389], [389, 368], [368, 356], [11, 302], [302, 267], [267, 11], [452, 350], [350, 349], [349, 452], [302, 303], [303, 269], [269, 302], [357, 343], [343, 277], [277, 357], [452, 453], [453, 357], [357, 452], [333, 332], [332, 297], [297, 333], [175, 152], [152, 377], [377, 175], [347, 348], [348, 330], [330, 347], [303, 304], [304, 270], [270, 303], [9, 336], [336, 337], [337, 9], [278, 279], [279, 360], [360, 278], [418, 262], [262, 431], [431, 418], [304, 408], [408, 409], [409, 304], [310, 415], [415, 407], [407, 310], [270, 409], [409, 410], [410, 270], [450, 348], [348, 347], [347, 450], [422, 430], [430, 434], [434, 422], [313, 314], [314, 17], [17, 313], [306, 307], [307, 375], [375, 306], [387, 388], [388, 260], [260, 387], [286, 414], [414, 398], [398, 286], [335, 406], [406, 418], [418, 335], [364, 367], [367, 416], [416, 364], [423, 358], [358, 327], [327, 423], [251, 284], [284, 298], [298, 251], [281, 5], [5, 4], [4, 281], [373, 374], [374, 253], [253, 373], [307, 320], [320, 321], [321, 307], [425, 427], [427, 411], [411, 425], [421, 313], [313, 18], [18, 421], [321, 405], [405, 406], [406, 321], [320, 404], [404, 405], [405, 320], [315, 16], [16, 17], [17, 315], [426, 425], [425, 266], [266, 426], [377, 400], [400, 369], [369, 377], [322, 391], [391, 269], [269, 322], [417, 465], [465, 464], [464, 417], [386, 257], [257, 258], [258, 386], [466, 260], [260, 388], [388, 466], [456, 399], [399, 419], [419, 456], [284, 332], [332, 333], [333, 284], [417, 285], [285, 8], [8, 417], [346, 340], [340, 261], [261, 346], [413, 441], [441, 285], [285, 413], [327, 460], [460, 328], [328, 327], [355, 371], [371, 329], [329, 355], [392, 439], [439, 438], [438, 392], [382, 341], [341, 256], [256, 382], [429, 420], [420, 360], [360, 429], [364, 394], [394, 379], [379, 364], [277, 343], [343, 437], [437, 277], [443, 444], [444, 283], [283, 443], [275, 440], [440, 363], [363, 275], [431, 262], [262, 369], [369, 431], [297, 338], [338, 337], [337, 297], [273, 375], [375, 321], [321, 273], [450, 451], [451, 349], [349, 450], [446, 342], [342, 467], [467, 446], [293, 334], [334, 282], [282, 293], [458, 461], [461, 462], [462, 458], [276, 353], [353, 383], [383, 276], [308, 324], [324, 325], [325, 308], [276, 300], [300, 293], [293, 276], [372, 345], [345, 447], [447, 372], [352, 345], [345, 340], [340, 352], [274, 1], [1, 19], [19, 274], [456, 248], [248, 281], [281, 456], [436, 427], [427, 425], [425, 436], [381, 256], [256, 252], [252, 381], [269, 391], [391, 393], [393, 269], [200, 199], [199, 428], [428, 200], [266, 330], [330, 329], [329, 266], [287, 273], [273, 422], [422, 287], [250, 462], [462, 328], [328, 250], [258, 286], [286, 384], [384, 258], [265, 353], [353, 342], [342, 265], [387, 259], [259, 257], [257, 387], [424, 431], [431, 430], [430, 424], [342, 353], [353, 276], [276, 342], [273, 335], [335, 424], [424, 273], [292, 325], [325, 307], [307, 292], [366, 447], [447, 345], [345, 366], [271, 303], [303, 302], [302, 271], [423, 266], [266, 371], [371, 423], [294, 455], [455, 460], [460, 294], [279, 278], [278, 294], [294, 279], [271, 272], [272, 304], [304, 271], [432, 434], [434, 427], [427, 432], [272, 407], [407, 408], [408, 272], [394, 430], [430, 431], [431, 394], [395, 369], [369, 400], [400, 395], [334, 333], [333, 299], [299, 334], [351, 417], [417, 168], [168, 351], [352, 280], [280, 411], [411, 352], [325, 319], [319, 320], [320, 325], [295, 296], [296, 336], [336, 295], [319, 403], [403, 404], [404, 319], [330, 348], [348, 349], [349, 330], [293, 298], [298, 333], [333, 293], [323, 454], [454, 447], [447, 323], [15, 16], [16, 315], [315, 15], [358, 429], [429, 279], [279, 358], [14, 15], [15, 316], [316, 14], [285, 336], [336, 9], [9, 285], [329, 349], [349, 350], [350, 329], [374, 380], [380, 252], [252, 374], [318, 402], [402, 403], [403, 318], [6, 197], [197, 419], [419, 6], [318, 319], [319, 325], [325, 318], [367, 364], [364, 365], [365, 367], [435, 367], [367, 397], [397, 435], [344, 438], [438, 439], [439, 344], [272, 271], [271, 311], [311, 272], [195, 5], [5, 281], [281, 195], [273, 287], [287, 291], [291, 273], [396, 428], [428, 199], [199, 396], [311, 271], [271, 268], [268, 311], [283, 444], [444, 445], [445, 283], [373, 254], [254, 339], [339, 373], [282, 334], [334, 296], [296, 282], [449, 347], [347, 346], [346, 449], [264, 447], [447, 454], [454, 264], [336, 296], [296, 299], [299, 336], [338, 10], [10, 151], [151, 338], [278, 439], [439, 455], [455, 278], [292, 407], [407, 415], [415, 292], [358, 371], [371, 355], [355, 358], [340, 345], [345, 372], [372, 340], [346, 347], [347, 280], [280, 346], [442, 443], [443, 282], [282, 442], [19, 94], [94, 370], [370, 19], [441, 442], [442, 295], [295, 441], [248, 419], [419, 197], [197, 248], [263, 255], [255, 359], [359, 263], [440, 275], [275, 274], [274, 440], [300, 383], [383, 368], [368, 300], [351, 412], [412, 465], [465, 351], [263, 467], [467, 466], [466, 263], [301, 368], [368, 389], [389, 301], [395, 378], [378, 379], [379, 395], [412, 351], [351, 419], [419, 412], [436, 426], [426, 322], [322, 436], [2, 164], [164, 393], [393, 2], [370, 462], [462, 461], [461, 370], [164, 0], [0, 267], [267, 164], [302, 11], [11, 12], [12, 302], [268, 12], [12, 13], [13, 268], [293, 300], [300, 301], [301, 293], [446, 261], [261, 340], [340, 446], [330, 266], [266, 425], [425, 330], [426, 423], [423, 391], [391, 426], [429, 355], [355, 437], [437, 429], [391, 327], [327, 326], [326, 391], [440, 457], [457, 438], [438, 440], [341, 382], [382, 362], [362, 341], [459, 457], [457, 461], [461, 459], [434, 430], [430, 394], [394, 434], [414, 463], [463, 362], [362, 414], [396, 369], [369, 262], [262, 396], [354, 461], [461, 457], [457, 354], [316, 403], [403, 402], [402, 316], [315, 404], [404, 403], [403, 315], [314, 405], [405, 404], [404, 314], [313, 406], [406, 405], [405, 313], [421, 418], [418, 406], [406, 421], [366, 401], [401, 361], [361, 366], [306, 408], [408, 407], [407, 306], [291, 409], [409, 408], [408, 291], [287, 410], [410, 409], [409, 287], [432, 436], [436, 410], [410, 432], [434, 416], [416, 411], [411, 434], [264, 368], [368, 383], [383, 264], [309, 438], [438, 457], [457, 309], [352, 376], [376, 401], [401, 352], [274, 275], [275, 4], [4, 274], [421, 428], [428, 262], [262, 421], [294, 327], [327, 358], [358, 294], [433, 416], [416, 367], [367, 433], [289, 455], [455, 439], [439, 289], [462, 370], [370, 326], [326, 462], [2, 326], [326, 370], [370, 2], [305, 460], [460, 455], [455, 305], [254, 449], [449, 448], [448, 254], [255, 261], [261, 446], [446, 255], [253, 450], [450, 449], [449, 253], [252, 451], [451, 450], [450, 252], [256, 452], [452, 451], [451, 256], [341, 453], [453, 452], [452, 341], [413, 464], [464, 463], [463, 413], [441, 413], [413, 414], [414, 441], [258, 442], [442, 441], [441, 258], [257, 443], [443, 442], [442, 257], [259, 444], [444, 443], [443, 259], [260, 445], [445, 444], [444, 260], [467, 342], [342, 445], [445, 467], [459, 458], [458, 250], [250, 459], [289, 392], [392, 290], [290, 289], [290, 328], [328, 460], [460, 290], [376, 433], [433, 435], [435, 376], [250, 290], [290, 392], [392, 250], [411, 416], [416, 433], [433, 411], [341, 463], [463, 464], [464, 341], [453, 464], [464, 465], [465, 453], [357, 465], [465, 412], [412, 357], [343, 412], [412, 399], [399, 343], [360, 363], [363, 440], [440, 360], [437, 399], [399, 456], [456, 437], [420, 456], [456, 363], [363, 420], [401, 435], [435, 288], [288, 401], [372, 383], [383, 353], [353, 372], [339, 255], [255, 249], [249, 339], [448, 261], [261, 255], [255, 448], [133, 243], [243, 190], [190, 133], [133, 155], [155, 112], [112, 133], [33, 246], [246, 247], [247, 33], [33, 130], [130, 25], [25, 33], [398, 384], [384, 286], [286, 398], [362, 398], [398, 414], [414, 362], [362, 463], [463, 341], [341, 362], [263, 359], [359, 467], [467, 263], [263, 249], [249, 255], [255, 263], [466, 467], [467, 260], [260, 466], [75, 60], [60, 166], [166, 75], [238, 239], [239, 79], [79, 238], [162, 127], [127, 139], [139, 162], [72, 11], [11, 37], [37, 72], [121, 232], [232, 120], [120, 121], [73, 72], [72, 39], [39, 73], [114, 128], [128, 47], [47, 114], [233, 232], [232, 128], [128, 233], [103, 104], [104, 67], [67, 103], [152, 175], [175, 148], [148, 152], [119, 118], [118, 101], [101, 119], [74, 73], [73, 40], [40, 74], [107, 9], [9, 108], [108, 107], [49, 48], [48, 131], [131, 49], [32, 194], [194, 211], [211, 32], [184, 74], [74, 185], [185, 184], [191, 80], [80, 183], [183, 191], [185, 40], [40, 186], [186, 185], [119, 230], [230, 118], [118, 119], [210, 202], [202, 214], [214, 210], [84, 83], [83, 17], [17, 84], [77, 76], [76, 146], [146, 77], [161, 160], [160, 30], [30, 161], [190, 56], [56, 173], [173, 190], [182, 106], [106, 194], [194, 182], [138, 135], [135, 192], [192, 138], [129, 203], [203, 98], [98, 129], [54, 21], [21, 68], [68, 54], [5, 51], [51, 4], [4, 5], [145, 144], [144, 23], [23, 145], [90, 77], [77, 91], [91, 90], [207, 205], [205, 187], [187, 207], [83, 201], [201, 18], [18, 83], [181, 91], [91, 182], [182, 181], [180, 90], [90, 181], [181, 180], [16, 85], [85, 17], [17, 16], [205, 206], [206, 36], [36, 205], [176, 148], [148, 140], [140, 176], [165, 92], [92, 39], [39, 165], [245, 193], [193, 244], [244, 245], [27, 159], [159, 28], [28, 27], [30, 247], [247, 161], [161, 30], [174, 236], [236, 196], [196, 174], [103, 54], [54, 104], [104, 103], [55, 193], [193, 8], [8, 55], [111, 117], [117, 31], [31, 111], [221, 189], [189, 55], [55, 221], [240, 98], [98, 99], [99, 240], [142, 126], [126, 100], [100, 142], [219, 166], [166, 218], [218, 219], [112, 155], [155, 26], [26, 112], [198, 209], [209, 131], [131, 198], [169, 135], [135, 150], [150, 169], [114, 47], [47, 217], [217, 114], [224, 223], [223, 53], [53, 224], [220, 45], [45, 134], [134, 220], [32, 211], [211, 140], [140, 32], [109, 67], [67, 108], [108, 109], [146, 43], [43, 91], [91, 146], [231, 230], [230, 120], [120, 231], [113, 226], [226, 247], [247, 113], [105, 63], [63, 52], [52, 105], [241, 238], [238, 242], [242, 241], [124, 46], [46, 156], [156, 124], [95, 78], [78, 96], [96, 95], [70, 46], [46, 63], [63, 70], [116, 143], [143, 227], [227, 116], [116, 123], [123, 111], [111, 116], [1, 44], [44, 19], [19, 1], [3, 236], [236, 51], [51, 3], [207, 216], [216, 205], [205, 207], [26, 154], [154, 22], [22, 26], [165, 39], [39, 167], [167, 165], [199, 200], [200, 208], [208, 199], [101, 36], [36, 100], [100, 101], [43, 57], [57, 202], [202, 43], [242, 20], [20, 99], [99, 242], [56, 28], [28, 157], [157, 56], [124, 35], [35, 113], [113, 124], [29, 160], [160, 27], [27, 29], [211, 204], [204, 210], [210, 211], [124, 113], [113, 46], [46, 124], [106, 43], [43, 204], [204, 106], [96, 62], [62, 77], [77, 96], [227, 137], [137, 116], [116, 227], [73, 41], [41, 72], [72, 73], [36, 203], [203, 142], [142, 36], [235, 64], [64, 240], [240, 235], [48, 49], [49, 64], [64, 48], [42, 41], [41, 74], [74, 42], [214, 212], [212, 207], [207, 214], [183, 42], [42, 184], [184, 183], [210, 169], [169, 211], [211, 210], [140, 170], [170, 176], [176, 140], [104, 105], [105, 69], [69, 104], [193, 122], [122, 168], [168, 193], [50, 123], [123, 187], [187, 50], [89, 96], [96, 90], [90, 89], [66, 65], [65, 107], [107, 66], [179, 89], [89, 180], [180, 179], [119, 101], [101, 120], [120, 119], [68, 63], [63, 104], [104, 68], [234, 93], [93, 227], [227, 234], [16, 15], [15, 85], [85, 16], [209, 129], [129, 49], [49, 209], [15, 14], [14, 86], [86, 15], [107, 55], [55, 9], [9, 107], [120, 100], [100, 121], [121, 120], [153, 145], [145, 22], [22, 153], [178, 88], [88, 179], [179, 178], [197, 6], [6, 196], [196, 197], [89, 88], [88, 96], [96, 89], [135, 138], [138, 136], [136, 135], [138, 215], [215, 172], [172, 138], [218, 115], [115, 219], [219, 218], [41, 42], [42, 81], [81, 41], [5, 195], [195, 51], [51, 5], [57, 43], [43, 61], [61, 57], [208, 171], [171, 199], [199, 208], [41, 81], [81, 38], [38, 41], [224, 53], [53, 225], [225, 224], [24, 144], [144, 110], [110, 24], [105, 52], [52, 66], [66, 105], [118, 229], [229, 117], [117, 118], [227, 34], [34, 234], [234, 227], [66, 107], [107, 69], [69, 66], [10, 109], [109, 151], [151, 10], [219, 48], [48, 235], [235, 219], [183, 62], [62, 191], [191, 183], [142, 129], [129, 126], [126, 142], [116, 111], [111, 143], [143, 116], [118, 117], [117, 50], [50, 118], [223, 222], [222, 52], [52, 223], [94, 19], [19, 141], [141, 94], [222, 221], [221, 65], [65, 222], [196, 3], [3, 197], [197, 196], [45, 220], [220, 44], [44, 45], [156, 70], [70, 139], [139, 156], [188, 122], [122, 245], [245, 188], [139, 71], [71, 162], [162, 139], [149, 170], [170, 150], [150, 149], [122, 188], [188, 196], [196, 122], [206, 216], [216, 92], [92, 206], [164, 2], [2, 167], [167, 164], [242, 141], [141, 241], [241, 242], [0, 164], [164, 37], [37, 0], [11, 72], [72, 12], [12, 11], [12, 38], [38, 13], [13, 12], [70, 63], [63, 71], [71, 70], [31, 226], [226, 111], [111, 31], [36, 101], [101, 205], [205, 36], [203, 206], [206, 165], [165, 203], [126, 209], [209, 217], [217, 126], [98, 165], [165, 97], [97, 98], [237, 220], [220, 218], [218, 237], [237, 239], [239, 241], [241, 237], [210, 214], [214, 169], [169, 210], [140, 171], [171, 32], [32, 140], [241, 125], [125, 237], [237, 241], [179, 86], [86, 178], [178, 179], [180, 85], [85, 179], [179, 180], [181, 84], [84, 180], [180, 181], [182, 83], [83, 181], [181, 182], [194, 201], [201, 182], [182, 194], [177, 137], [137, 132], [132, 177], [184, 76], [76, 183], [183, 184], [185, 61], [61, 184], [184, 185], [186, 57], [57, 185], [185, 186], [216, 212], [212, 186], [186, 216], [192, 214], [214, 187], [187, 192], [139, 34], [34, 156], [156, 139], [218, 79], [79, 237], [237, 218], [147, 123], [123, 177], [177, 147], [45, 44], [44, 4], [4, 45], [208, 201], [201, 32], [32, 208], [98, 64], [64, 129], [129, 98], [192, 213], [213, 138], [138, 192], [235, 59], [59, 219], [219, 235], [141, 242], [242, 97], [97, 141], [97, 2], [2, 141], [141, 97], [240, 75], [75, 235], [235, 240], [229, 24], [24, 228], [228, 229], [31, 25], [25, 226], [226, 31], [230, 23], [23, 229], [229, 230], [231, 22], [22, 230], [230, 231], [232, 26], [26, 231], [231, 232], [233, 112], [112, 232], [232, 233], [244, 189], [189, 243], [243, 244], [189, 221], [221, 190], [190, 189], [222, 28], [28, 221], [221, 222], [223, 27], [27, 222], [222, 223], [224, 29], [29, 223], [223, 224], [225, 30], [30, 224], [224, 225], [113, 247], [247, 225], [225, 113], [99, 60], [60, 240], [240, 99], [213, 147], [147, 215], [215, 213], [60, 20], [20, 166], [166, 60], [192, 187], [187, 213], [213, 192], [243, 112], [112, 244], [244, 243], [244, 233], [233, 245], [245, 244], [245, 128], [128, 188], [188, 245], [188, 114], [114, 174], [174, 188], [134, 131], [131, 220], [220, 134], [174, 217], [217, 236], [236, 174], [236, 198], [198, 134], [134, 236], [215, 177], [177, 58], [58, 215], [156, 143], [143, 124], [124, 156], [25, 110], [110, 7], [7, 25], [31, 228], [228, 25], [25, 31], [264, 356], [356, 368], [368, 264], [0, 11], [11, 267], [267, 0], [451, 452], [452, 349], [349, 451], [267, 302], [302, 269], [269, 267], [350, 357], [357, 277], [277, 350], [350, 452], [452, 357], [357, 350], [299, 333], [333, 297], [297, 299], [396, 175], [175, 377], [377, 396], [280, 347], [347, 330], [330, 280], [269, 303], [303, 270], [270, 269], [151, 9], [9, 337], [337, 151], [344, 278], [278, 360], [360, 344], [424, 418], [418, 431], [431, 424], [270, 304], [304, 409], [409, 270], [272, 310], [310, 407], [407, 272], [322, 270], [270, 410], [410, 322], [449, 450], [450, 347], [347, 449], [432, 422], [422, 434], [434, 432], [18, 313], [313, 17], [17, 18], [291, 306], [306, 375], [375, 291], [259, 387], [387, 260], [260, 259], [424, 335], [335, 418], [418, 424], [434, 364], [364, 416], [416, 434], [391, 423], [423, 327], [327, 391], [301, 251], [251, 298], [298, 301], [275, 281], [281, 4], [4, 275], [254, 373], [373, 253], [253, 254], [375, 307], [307, 321], [321, 375], [280, 425], [425, 411], [411, 280], [200, 421], [421, 18], [18, 200], [335, 321], [321, 406], [406, 335], [321, 320], [320, 405], [405, 321], [314, 315], [315, 17], [17, 314], [423, 426], [426, 266], [266, 423], [396, 377], [377, 369], [369, 396], [270, 322], [322, 269], [269, 270], [413, 417], [417, 464], [464, 413], [385, 386], [386, 258], [258, 385], [248, 456], [456, 419], [419, 248], [298, 284], [284, 333], [333, 298], [168, 417], [417, 8], [8, 168], [448, 346], [346, 261], [261, 448], [417, 413], [413, 285], [285, 417], [326, 327], [327, 328], [328, 326], [277, 355], [355, 329], [329, 277], [309, 392], [392, 438], [438, 309], [381, 382], [382, 256], [256, 381], [279, 429], [429, 360], [360, 279], [365, 364], [364, 379], [379, 365], [355, 277], [277, 437], [437, 355], [282, 443], [443, 283], [283, 282], [281, 275], [275, 363], [363, 281], [395, 431], [431, 369], [369, 395], [299, 297], [297, 337], [337, 299], [335, 273], [273, 321], [321, 335], [348, 450], [450, 349], [349, 348], [359, 446], [446, 467], [467, 359], [283, 293], [293, 282], [282, 283], [250, 458], [458, 462], [462, 250], [300, 276], [276, 383], [383, 300], [292, 308], [308, 325], [325, 292], [283, 276], [276, 293], [293, 283], [264, 372], [372, 447], [447, 264], [346, 352], [352, 340], [340, 346], [354, 274], [274, 19], [19, 354], [363, 456], [456, 281], [281, 363], [426, 436], [436, 425], [425, 426], [380, 381], [381, 252], [252, 380], [267, 269], [269, 393], [393, 267], [421, 200], [200, 428], [428, 421], [371, 266], [266, 329], [329, 371], [432, 287], [287, 422], [422, 432], [290, 250], [250, 328], [328, 290], [385, 258], [258, 384], [384, 385], [446, 265], [265, 342], [342, 446], [386, 387], [387, 257], [257, 386], [422, 424], [424, 430], [430, 422], [445, 342], [342, 276], [276, 445], [422, 273], [273, 424], [424, 422], [306, 292], [292, 307], [307, 306], [352, 366], [366, 345], [345, 352], [268, 271], [271, 302], [302, 268], [358, 423], [423, 371], [371, 358], [327, 294], [294, 460], [460, 327], [331, 279], [279, 294], [294, 331], [303, 271], [271, 304], [304, 303], [436, 432], [432, 427], [427, 436], [304, 272], [272, 408], [408, 304], [395, 394], [394, 431], [431, 395], [378, 395], [395, 400], [400, 378], [296, 334], [334, 299], [299, 296], [6, 351], [351, 168], [168, 6], [376, 352], [352, 411], [411, 376], [307, 325], [325, 320], [320, 307], [285, 295], [295, 336], [336, 285], [320, 319], [319, 404], [404, 320], [329, 330], [330, 349], [349, 329], [334, 293], [293, 333], [333, 334], [366, 323], [323, 447], [447, 366], [316, 15], [15, 315], [315, 316], [331, 358], [358, 279], [279, 331], [317, 14], [14, 316], [316, 317], [8, 285], [285, 9], [9, 8], [277, 329], [329, 350], [350, 277], [253, 374], [374, 252], [252, 253], [319, 318], [318, 403], [403, 319], [351, 6], [6, 419], [419, 351], [324, 318], [318, 325], [325, 324], [397, 367], [367, 365], [365, 397], [288, 435], [435, 397], [397, 288], [278, 344], [344, 439], [439, 278], [310, 272], [272, 311], [311, 310], [248, 195], [195, 281], [281, 248], [375, 273], [273, 291], [291, 375], [175, 396], [396, 199], [199, 175], [312, 311], [311, 268], [268, 312], [276, 283], [283, 445], [445, 276], [390, 373], [373, 339], [339, 390], [295, 282], [282, 296], [296, 295], [448, 449], [449, 346], [346, 448], [356, 264], [264, 454], [454, 356], [337, 336], [336, 299], [299, 337], [337, 338], [338, 151], [151, 337], [294, 278], [278, 455], [455, 294], [308, 292], [292, 415], [415, 308], [429, 358], [358, 355], [355, 429], [265, 340], [340, 372], [372, 265], [352, 346], [346, 280], [280, 352], [295, 442], [442, 282], [282, 295], [354, 19], [19, 370], [370, 354], [285, 441], [441, 295], [295, 285], [195, 248], [248, 197], [197, 195], [457, 440], [440, 274], [274, 457], [301, 300], [300, 368], [368, 301], [417, 351], [351, 465], [465, 417], [251, 301], [301, 389], [389, 251], [394, 395], [395, 379], [379, 394], [399, 412], [412, 419], [419, 399], [410, 436], [436, 322], [322, 410], [326, 2], [2, 393], [393, 326], [354, 370], [370, 461], [461, 354], [393, 164], [164, 267], [267, 393], [268, 302], [302, 12], [12, 268], [312, 268], [268, 13], [13, 312], [298, 293], [293, 301], [301, 298], [265, 446], [446, 340], [340, 265], [280, 330], [330, 425], [425, 280], [322, 426], [426, 391], [391, 322], [420, 429], [429, 437], [437, 420], [393, 391], [391, 326], [326, 393], [344, 440], [440, 438], [438, 344], [458, 459], [459, 461], [461, 458], [364, 434], [434, 394], [394, 364], [428, 396], [396, 262], [262, 428], [274, 354], [354, 457], [457, 274], [317, 316], [316, 402], [402, 317], [316, 315], [315, 403], [403, 316], [315, 314], [314, 404], [404, 315], [314, 313], [313, 405], [405, 314], [313, 421], [421, 406], [406, 313], [323, 366], [366, 361], [361, 323], [292, 306], [306, 407], [407, 292], [306, 291], [291, 408], [408, 306], [291, 287], [287, 409], [409, 291], [287, 432], [432, 410], [410, 287], [427, 434], [434, 411], [411, 427], [372, 264], [264, 383], [383, 372], [459, 309], [309, 457], [457, 459], [366, 352], [352, 401], [401, 366], [1, 274], [274, 4], [4, 1], [418, 421], [421, 262], [262, 418], [331, 294], [294, 358], [358, 331], [435, 433], [433, 367], [367, 435], [392, 289], [289, 439], [439, 392], [328, 462], [462, 326], [326, 328], [94, 2], [2, 370], [370, 94], [289, 305], [305, 455], [455, 289], [339, 254], [254, 448], [448, 339], [359, 255], [255, 446], [446, 359], [254, 253], [253, 449], [449, 254], [253, 252], [252, 450], [450, 253], [252, 256], [256, 451], [451, 252], [256, 341], [341, 452], [452, 256], [414, 413], [413, 463], [463, 414], [286, 441], [441, 414], [414, 286], [286, 258], [258, 441], [441, 286], [258, 257], [257, 442], [442, 258], [257, 259], [259, 443], [443, 257], [259, 260], [260, 444], [444, 259], [260, 467], [467, 445], [445, 260], [309, 459], [459, 250], [250, 309], [305, 289], [289, 290], [290, 305], [305, 290], [290, 460], [460, 305], [401, 376], [376, 435], [435, 401], [309, 250], [250, 392], [392, 309], [376, 411], [411, 433], [433, 376], [453, 341], [341, 464], [464, 453], [357, 453], [453, 465], [465, 357], [343, 357], [357, 412], [412, 343], [437, 343], [343, 399], [399, 437], [344, 360], [360, 440], [440, 344], [420, 437], [437, 456], [456, 420], [360, 420], [420, 363], [363, 360], [361, 401], [401, 288], [288, 361], [265, 372], [372, 353], [353, 265], [390, 339], [339, 249], [249, 390], [339, 448], [448, 255], [255, 339]);
    uc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", false), this.j = { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] }, this.outputFacialTransformationMatrixes = this.outputFaceBlendshapes = false, dn(t2 = this.h = new Bs(), 0, 1, e2 = new Is()), this.v = new Ns(), dn(this.h, 0, 3, this.v), this.s = new Cs(), dn(this.h, 0, 2, this.s), Tn(this.s, 4, 1), An(this.s, 2, 0.5), An(this.v, 2, 0.5), An(this.h, 4, 0.5);
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return "numFaces" in t2 && Tn(this.s, 4, t2.numFaces ?? 1), "minFaceDetectionConfidence" in t2 && An(this.s, 2, t2.minFaceDetectionConfidence ?? 0.5), "minTrackingConfidence" in t2 && An(this.h, 4, t2.minTrackingConfidence ?? 0.5), "minFacePresenceConfidence" in t2 && An(this.v, 2, t2.minFacePresenceConfidence ?? 0.5), "outputFaceBlendshapes" in t2 && (this.outputFaceBlendshapes = !!t2.outputFaceBlendshapes), "outputFacialTransformationMatrixes" in t2 && (this.outputFacialTransformationMatrixes = !!t2.outputFacialTransformationMatrixes), this.l(t2);
      }
      D(t2, e2) {
        return hc(this), Ya(this, t2, e2), this.j;
      }
      F(t2, e2, n2) {
        return hc(this), $a(this, t2, n2, e2), this.j;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "face_landmarks");
        const e2 = new Gi();
        Yn(e2, Vs, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.face_landmarker.FaceLandmarkerGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "NORM_LANDMARKS:face_landmarks"), n2.o(e2), qi(t2, n2), this.g.attachProtoVectorListener("face_landmarks", ((t3, e3) => {
          for (const e4 of t3) t3 = fs(e4), this.j.faceLandmarks.push(Lo(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("face_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.outputFaceBlendshapes && (Zi(t2, "blendshapes"), Wi(n2, "BLENDSHAPES:blendshapes"), this.g.attachProtoVectorListener("blendshapes", ((t3, e3) => {
          if (this.outputFaceBlendshapes) for (const e4 of t3) t3 = ss(e4), this.j.faceBlendshapes.push(So(t3.g() ?? []));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("blendshapes", ((t3) => {
          Yo(this, t3);
        }))), this.outputFacialTransformationMatrixes && (Zi(t2, "face_geometry"), Wi(n2, "FACE_GEOMETRY:face_geometry"), this.g.attachProtoVectorListener("face_geometry", ((t3, e3) => {
          if (this.outputFacialTransformationMatrixes) for (const e4 of t3) (t3 = hn(Ds(e4), ps, 2)) && this.j.facialTransformationMatrixes.push({ rows: _n(t3, 1) ?? 0 ?? 0, columns: _n(t3, 2) ?? 0 ?? 0, data: $e(t3, 3, qt, Ye()).slice() ?? [] });
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("face_geometry", ((t3) => {
          Yo(this, t3);
        }))), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    uc.prototype.detectForVideo = uc.prototype.F, uc.prototype.detect = uc.prototype.D, uc.prototype.setOptions = uc.prototype.o, uc.createFromModelPath = function(t2, e2) {
      return za(uc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, uc.createFromModelBuffer = function(t2, e2) {
      return za(uc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, uc.createFromOptions = function(t2, e2) {
      return za(uc, t2, e2);
    }, uc.FACE_LANDMARKS_LIPS = Qa, uc.FACE_LANDMARKS_LEFT_EYE = tc, uc.FACE_LANDMARKS_LEFT_EYEBROW = ec, uc.FACE_LANDMARKS_LEFT_IRIS = nc, uc.FACE_LANDMARKS_RIGHT_EYE = rc, uc.FACE_LANDMARKS_RIGHT_EYEBROW = ic, uc.FACE_LANDMARKS_RIGHT_IRIS = sc, uc.FACE_LANDMARKS_FACE_OVAL = oc, uc.FACE_LANDMARKS_CONTOURS = ac, uc.FACE_LANDMARKS_TESSELATION = cc;
    lc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", true), dn(t2 = this.j = new Xs(), 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.j, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.j, 0, 1, t2);
      }
      o(t2) {
        return super.l(t2);
      }
      Ka(t2, e2, n2) {
        const r2 = "function" != typeof e2 ? e2 : {};
        if (this.h = "function" == typeof e2 ? e2 : n2, Ya(this, t2, r2 ?? {}), !this.h) return this.s;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "stylized_image");
        const e2 = new Gi();
        Yn(e2, Hs, this.j);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.face_stylizer.FaceStylizerGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "STYLIZED_IMAGE:stylized_image"), n2.o(e2), qi(t2, n2), this.g.V("stylized_image", ((t3, e3) => {
          var n3 = !this.h, r2 = t3.data, i2 = t3.width;
          const s2 = i2 * (t3 = t3.height);
          if (r2 instanceof Uint8Array) if (r2.length === 3 * s2) {
            const e4 = new Uint8ClampedArray(4 * s2);
            for (let t4 = 0; t4 < s2; ++t4) e4[4 * t4] = r2[3 * t4], e4[4 * t4 + 1] = r2[3 * t4 + 1], e4[4 * t4 + 2] = r2[3 * t4 + 2], e4[4 * t4 + 3] = 255;
            r2 = new ImageData(e4, i2, t3);
          } else {
            if (r2.length !== 4 * s2) throw Error("Unsupported channel count: " + r2.length / s2);
            r2 = new ImageData(new Uint8ClampedArray(r2.buffer, r2.byteOffset, r2.length), i2, t3);
          }
          else if (!(r2 instanceof WebGLTexture)) throw Error(`Unsupported format: ${r2.constructor.name}`);
          i2 = new Ga([r2], false, false, this.g.i.canvas, this.P, i2, t3), this.s = n3 = n3 ? i2.clone() : i2, this.h && this.h(n3), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("stylized_image", ((t3) => {
          this.s = null, this.h && this.h(null), Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    lc.prototype.stylize = lc.prototype.Ka, lc.prototype.setOptions = lc.prototype.o, lc.createFromModelPath = function(t2, e2) {
      return za(lc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, lc.createFromModelBuffer = function(t2, e2) {
      return za(lc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, lc.createFromOptions = function(t2, e2) {
      return za(lc, t2, e2);
    };
    dc = Va([0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]);
    mc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", false), this.gestures = [], this.landmarks = [], this.worldLandmarks = [], this.handedness = [], dn(t2 = this.j = new Js(), 0, 1, e2 = new Is()), this.s = new qs(), dn(this.j, 0, 2, this.s), this.C = new $s(), dn(this.s, 0, 3, this.C), this.v = new Ys(), dn(this.s, 0, 2, this.v), this.h = new Ks(), dn(this.j, 0, 3, this.h), An(this.v, 2, 0.5), An(this.s, 4, 0.5), An(this.C, 2, 0.5);
      }
      get baseOptions() {
        return hn(this.j, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.j, 0, 1, t2);
      }
      o(t2) {
        if (Tn(this.v, 3, t2.numHands ?? 1), "minHandDetectionConfidence" in t2 && An(this.v, 2, t2.minHandDetectionConfidence ?? 0.5), "minTrackingConfidence" in t2 && An(this.s, 4, t2.minTrackingConfidence ?? 0.5), "minHandPresenceConfidence" in t2 && An(this.C, 2, t2.minHandPresenceConfidence ?? 0.5), t2.cannedGesturesClassifierOptions) {
          var e2 = new Ws(), n2 = e2, r2 = ko(t2.cannedGesturesClassifierOptions, hn(this.h, Ws, 3)?.h());
          dn(n2, 0, 2, r2), dn(this.h, 0, 3, e2);
        } else void 0 === t2.cannedGesturesClassifierOptions && hn(this.h, Ws, 3)?.g();
        return t2.customGesturesClassifierOptions ? (dn(n2 = e2 = new Ws(), 0, 2, r2 = ko(t2.customGesturesClassifierOptions, hn(this.h, Ws, 4)?.h())), dn(this.h, 0, 4, e2)) : void 0 === t2.customGesturesClassifierOptions && hn(this.h, Ws, 4)?.g(), this.l(t2);
      }
      Fa(t2, e2) {
        return fc(this), Ya(this, t2, e2), pc(this);
      }
      Ga(t2, e2, n2) {
        return fc(this), $a(this, t2, n2, e2), pc(this);
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "hand_gestures"), Zi(t2, "hand_landmarks"), Zi(t2, "world_hand_landmarks"), Zi(t2, "handedness");
        const e2 = new Gi();
        Yn(e2, no, this.j);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.gesture_recognizer.GestureRecognizerGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "HAND_GESTURES:hand_gestures"), Wi(n2, "LANDMARKS:hand_landmarks"), Wi(n2, "WORLD_LANDMARKS:world_hand_landmarks"), Wi(n2, "HANDEDNESS:handedness"), n2.o(e2), qi(t2, n2), this.g.attachProtoVectorListener("hand_landmarks", ((t3, e3) => {
          for (const e4 of t3) {
            t3 = fs(e4);
            const n3 = [];
            for (const e5 of ln(t3, ds, 1)) n3.push({ x: En(e5, 1) ?? 0, y: En(e5, 2) ?? 0, z: En(e5, 3) ?? 0, visibility: En(e5, 4) ?? 0 });
            this.landmarks.push(n3);
          }
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoVectorListener("world_hand_landmarks", ((t3, e3) => {
          for (const e4 of t3) {
            t3 = ls(e4);
            const n3 = [];
            for (const e5 of ln(t3, us, 1)) n3.push({ x: En(e5, 1) ?? 0, y: En(e5, 2) ?? 0, z: En(e5, 3) ?? 0, visibility: En(e5, 4) ?? 0 });
            this.worldLandmarks.push(n3);
          }
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("world_hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoVectorListener("hand_gestures", ((t3, e3) => {
          this.gestures.push(...gc(t3, false)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("hand_gestures", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoVectorListener("handedness", ((t3, e3) => {
          this.handedness.push(...gc(t3)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("handedness", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    mc.prototype.recognizeForVideo = mc.prototype.Ga, mc.prototype.recognize = mc.prototype.Fa, mc.prototype.setOptions = mc.prototype.o, mc.createFromModelPath = function(t2, e2) {
      return za(mc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, mc.createFromModelBuffer = function(t2, e2) {
      return za(mc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, mc.createFromOptions = function(t2, e2) {
      return za(mc, t2, e2);
    }, mc.HAND_CONNECTIONS = dc;
    _c = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", false), this.landmarks = [], this.worldLandmarks = [], this.handedness = [], dn(t2 = this.h = new qs(), 0, 1, e2 = new Is()), this.s = new $s(), dn(this.h, 0, 3, this.s), this.j = new Ys(), dn(this.h, 0, 2, this.j), Tn(this.j, 3, 1), An(this.j, 2, 0.5), An(this.s, 2, 0.5), An(this.h, 4, 0.5);
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return "numHands" in t2 && Tn(this.j, 3, t2.numHands ?? 1), "minHandDetectionConfidence" in t2 && An(this.j, 2, t2.minHandDetectionConfidence ?? 0.5), "minTrackingConfidence" in t2 && An(this.h, 4, t2.minTrackingConfidence ?? 0.5), "minHandPresenceConfidence" in t2 && An(this.s, 2, t2.minHandPresenceConfidence ?? 0.5), this.l(t2);
      }
      D(t2, e2) {
        return this.landmarks = [], this.worldLandmarks = [], this.handedness = [], Ya(this, t2, e2), yc(this);
      }
      F(t2, e2, n2) {
        return this.landmarks = [], this.worldLandmarks = [], this.handedness = [], $a(this, t2, n2, e2), yc(this);
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "hand_landmarks"), Zi(t2, "world_hand_landmarks"), Zi(t2, "handedness");
        const e2 = new Gi();
        Yn(e2, ro, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.hand_landmarker.HandLandmarkerGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "LANDMARKS:hand_landmarks"), Wi(n2, "WORLD_LANDMARKS:world_hand_landmarks"), Wi(n2, "HANDEDNESS:handedness"), n2.o(e2), qi(t2, n2), this.g.attachProtoVectorListener("hand_landmarks", ((t3, e3) => {
          for (const e4 of t3) t3 = fs(e4), this.landmarks.push(Lo(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoVectorListener("world_hand_landmarks", ((t3, e3) => {
          for (const e4 of t3) t3 = ls(e4), this.worldLandmarks.push(Ro(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("world_hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoVectorListener("handedness", ((t3, e3) => {
          var n3 = this.handedness, r2 = n3.push;
          const i2 = [];
          for (const e4 of t3) {
            t3 = ss(e4);
            const n4 = [];
            for (const e5 of t3.g()) n4.push({ score: En(e5, 2) ?? 0, index: _n(e5, 1) ?? 0 ?? -1, categoryName: vn(e5, 3) ?? "" ?? "", displayName: vn(e5, 4) ?? "" ?? "" });
            i2.push(n4);
          }
          r2.call(n3, ...i2), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("handedness", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    _c.prototype.detectForVideo = _c.prototype.F, _c.prototype.detect = _c.prototype.D, _c.prototype.setOptions = _c.prototype.o, _c.createFromModelPath = function(t2, e2) {
      return za(_c, t2, { baseOptions: { modelAssetPath: e2 } });
    }, _c.createFromModelBuffer = function(t2, e2) {
      return za(_c, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, _c.createFromOptions = function(t2, e2) {
      return za(_c, t2, e2);
    }, _c.HAND_CONNECTIONS = dc;
    vc = Va([0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19], [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]);
    Ac = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "input_frames_image", null, false), this.h = { faceLandmarks: [], faceBlendshapes: [], poseLandmarks: [], poseWorldLandmarks: [], poseSegmentationMasks: [], leftHandLandmarks: [], leftHandWorldLandmarks: [], rightHandLandmarks: [], rightHandWorldLandmarks: [] }, this.outputPoseSegmentationMasks = this.outputFaceBlendshapes = false, dn(t2 = this.j = new ao(), 0, 1, e2 = new Is()), this.K = new $s(), dn(this.j, 0, 2, this.K), this.Y = new io(), dn(this.j, 0, 3, this.Y), this.s = new Cs(), dn(this.j, 0, 4, this.s), this.H = new Ns(), dn(this.j, 0, 5, this.H), this.v = new so(), dn(this.j, 0, 6, this.v), this.L = new oo(), dn(this.j, 0, 7, this.L), An(this.s, 2, 0.5), An(this.s, 3, 0.3), An(this.H, 2, 0.5), An(this.v, 2, 0.5), An(this.v, 3, 0.3), An(this.L, 2, 0.5), An(this.K, 2, 0.5);
      }
      get baseOptions() {
        return hn(this.j, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.j, 0, 1, t2);
      }
      o(t2) {
        return "minFaceDetectionConfidence" in t2 && An(this.s, 2, t2.minFaceDetectionConfidence ?? 0.5), "minFaceSuppressionThreshold" in t2 && An(this.s, 3, t2.minFaceSuppressionThreshold ?? 0.3), "minFacePresenceConfidence" in t2 && An(this.H, 2, t2.minFacePresenceConfidence ?? 0.5), "outputFaceBlendshapes" in t2 && (this.outputFaceBlendshapes = !!t2.outputFaceBlendshapes), "minPoseDetectionConfidence" in t2 && An(this.v, 2, t2.minPoseDetectionConfidence ?? 0.5), "minPoseSuppressionThreshold" in t2 && An(this.v, 3, t2.minPoseSuppressionThreshold ?? 0.3), "minPosePresenceConfidence" in t2 && An(this.L, 2, t2.minPosePresenceConfidence ?? 0.5), "outputPoseSegmentationMasks" in t2 && (this.outputPoseSegmentationMasks = !!t2.outputPoseSegmentationMasks), "minHandLandmarksConfidence" in t2 && An(this.K, 2, t2.minHandLandmarksConfidence ?? 0.5), this.l(t2);
      }
      D(t2, e2, n2) {
        const r2 = "function" != typeof e2 ? e2 : {};
        return this.C = "function" == typeof e2 ? e2 : n2, Ec(this), Ya(this, t2, r2), wc(this);
      }
      F(t2, e2, n2, r2) {
        const i2 = "function" != typeof n2 ? n2 : {};
        return this.C = "function" == typeof n2 ? n2 : r2, Ec(this), $a(this, t2, i2, e2), wc(this);
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "input_frames_image"), Zi(t2, "pose_landmarks"), Zi(t2, "pose_world_landmarks"), Zi(t2, "face_landmarks"), Zi(t2, "left_hand_landmarks"), Zi(t2, "left_hand_world_landmarks"), Zi(t2, "right_hand_landmarks"), Zi(t2, "right_hand_world_landmarks");
        const e2 = new Gi(), n2 = new xi();
        tn(n2, 1, de("type.googleapis.com/mediapipe.tasks.vision.holistic_landmarker.proto.HolisticLandmarkerGraphOptions"), ""), (function(t3, e3) {
          if (null != e3) if (Array.isArray(e3)) He(t3, 2, Pe(e3, Oe, void 0, void 0, false));
          else {
            if (!("string" == typeof e3 || e3 instanceof N || C(e3))) throw Error("invalid value in Any.value field: " + e3 + " expected a ByteString, a base64 encoded string, a Uint8Array or a jspb array");
            tn(t3, 2, dt(e3, false), U());
          }
        })(n2, this.j.g());
        const r2 = new zi();
        Xi(r2, "mediapipe.tasks.vision.holistic_landmarker.HolisticLandmarkerGraph"), yn(r2, 8, xi, n2), Hi(r2, "IMAGE:input_frames_image"), Wi(r2, "POSE_LANDMARKS:pose_landmarks"), Wi(r2, "POSE_WORLD_LANDMARKS:pose_world_landmarks"), Wi(r2, "FACE_LANDMARKS:face_landmarks"), Wi(r2, "LEFT_HAND_LANDMARKS:left_hand_landmarks"), Wi(r2, "LEFT_HAND_WORLD_LANDMARKS:left_hand_world_landmarks"), Wi(r2, "RIGHT_HAND_LANDMARKS:right_hand_landmarks"), Wi(r2, "RIGHT_HAND_WORLD_LANDMARKS:right_hand_world_landmarks"), r2.o(e2), qi(t2, r2), $o(this, t2), this.g.attachProtoListener("pose_landmarks", ((t3, e3) => {
          Tc(t3, this.h.poseLandmarks), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("pose_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoListener("pose_world_landmarks", ((t3, e3) => {
          var n3 = this.h.poseWorldLandmarks;
          t3 = ls(t3), n3.push(Ro(t3)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("pose_world_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.outputPoseSegmentationMasks && (Wi(r2, "POSE_SEGMENTATION_MASK:pose_segmentation_mask"), qo(this, "pose_segmentation_mask"), this.g.V("pose_segmentation_mask", ((t3, e3) => {
          this.h.poseSegmentationMasks = [qa(this, t3, true, !this.C)], Yo(this, e3);
        })), this.g.attachEmptyPacketListener("pose_segmentation_mask", ((t3) => {
          this.h.poseSegmentationMasks = [], Yo(this, t3);
        }))), this.g.attachProtoListener("face_landmarks", ((t3, e3) => {
          Tc(t3, this.h.faceLandmarks), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("face_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.outputFaceBlendshapes && (Zi(t2, "extra_blendshapes"), Wi(r2, "FACE_BLENDSHAPES:extra_blendshapes"), this.g.attachProtoListener("extra_blendshapes", ((t3, e3) => {
          var n3 = this.h.faceBlendshapes;
          this.outputFaceBlendshapes && (t3 = ss(t3), n3.push(So(t3.g() ?? []))), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("extra_blendshapes", ((t3) => {
          Yo(this, t3);
        }))), this.g.attachProtoListener("left_hand_landmarks", ((t3, e3) => {
          Tc(t3, this.h.leftHandLandmarks), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("left_hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoListener("left_hand_world_landmarks", ((t3, e3) => {
          var n3 = this.h.leftHandWorldLandmarks;
          t3 = ls(t3), n3.push(Ro(t3)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("left_hand_world_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoListener("right_hand_landmarks", ((t3, e3) => {
          Tc(t3, this.h.rightHandLandmarks), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("right_hand_landmarks", ((t3) => {
          Yo(this, t3);
        })), this.g.attachProtoListener("right_hand_world_landmarks", ((t3, e3) => {
          var n3 = this.h.rightHandWorldLandmarks;
          t3 = ls(t3), n3.push(Ro(t3)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("right_hand_world_landmarks", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Ac.prototype.detectForVideo = Ac.prototype.F, Ac.prototype.detect = Ac.prototype.D, Ac.prototype.setOptions = Ac.prototype.o, Ac.createFromModelPath = function(t2, e2) {
      return za(Ac, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Ac.createFromModelBuffer = function(t2, e2) {
      return za(Ac, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Ac.createFromOptions = function(t2, e2) {
      return za(Ac, t2, e2);
    }, Ac.HAND_CONNECTIONS = dc, Ac.POSE_CONNECTIONS = vc, Ac.FACE_LANDMARKS_LIPS = Qa, Ac.FACE_LANDMARKS_LEFT_EYE = tc, Ac.FACE_LANDMARKS_LEFT_EYEBROW = ec, Ac.FACE_LANDMARKS_LEFT_IRIS = nc, Ac.FACE_LANDMARKS_RIGHT_EYE = rc, Ac.FACE_LANDMARKS_RIGHT_EYEBROW = ic, Ac.FACE_LANDMARKS_RIGHT_IRIS = sc, Ac.FACE_LANDMARKS_FACE_OVAL = oc, Ac.FACE_LANDMARKS_CONTOURS = ac, Ac.FACE_LANDMARKS_TESSELATION = cc;
    bc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "input_image", "norm_rect", true), this.j = { classifications: [] }, dn(t2 = this.h = new uo(), 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return dn(this.h, 0, 2, ko(t2, hn(this.h, bs, 2))), this.l(t2);
      }
      qa(t2, e2) {
        return this.j = { classifications: [] }, Ya(this, t2, e2), this.j;
      }
      ra(t2, e2, n2) {
        return this.j = { classifications: [] }, $a(this, t2, n2, e2), this.j;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "input_image"), Ji(t2, "norm_rect"), Zi(t2, "classifications");
        const e2 = new Gi();
        Yn(e2, lo, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.image_classifier.ImageClassifierGraph"), Hi(n2, "IMAGE:input_image"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "CLASSIFICATIONS:classifications"), n2.o(e2), qi(t2, n2), this.g.attachProtoListener("classifications", ((t3, e3) => {
          this.j = (function(t4) {
            const e4 = { classifications: ln(t4, ys, 1).map(((t5) => So(hn(t5, rs, 4)?.g() ?? [], _n(t5, 2) ?? 0, vn(t5, 3) ?? ""))) };
            return null != he(Ve(t4, 2)) && (e4.timestampMs = he(Ve(t4, 2)) ?? 0), e4;
          })(_s(t3)), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("classifications", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    bc.prototype.classifyForVideo = bc.prototype.ra, bc.prototype.classify = bc.prototype.qa, bc.prototype.setOptions = bc.prototype.o, bc.createFromModelPath = function(t2, e2) {
      return za(bc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, bc.createFromModelBuffer = function(t2, e2) {
      return za(bc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, bc.createFromOptions = function(t2, e2) {
      return za(bc, t2, e2);
    };
    kc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", true), this.h = new fo(), this.embeddings = { embeddings: [] }, dn(t2 = this.h, 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        var e2 = this.h, n2 = hn(this.h, Ss, 2);
        return n2 = n2 ? n2.clone() : new Ss(), void 0 !== t2.l2Normalize ? wn(n2, 1, t2.l2Normalize) : "l2Normalize" in t2 && He(n2, 1), void 0 !== t2.quantize ? wn(n2, 2, t2.quantize) : "quantize" in t2 && He(n2, 2), dn(e2, 0, 2, n2), this.l(t2);
      }
      xa(t2, e2) {
        return Ya(this, t2, e2), this.embeddings;
      }
      ya(t2, e2, n2) {
        return $a(this, t2, n2, e2), this.embeddings;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "embeddings_out");
        const e2 = new Gi();
        Yn(e2, po, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.image_embedder.ImageEmbedderGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "EMBEDDINGS:embeddings_out"), n2.o(e2), qi(t2, n2), this.g.attachProtoListener("embeddings_out", ((t3, e3) => {
          t3 = As(t3), this.embeddings = (function(t4) {
            return { embeddings: ln(t4, ws, 1).map(((t5) => {
              const e4 = { headIndex: _n(t5, 3) ?? 0 ?? -1, headName: vn(t5, 4) ?? "" ?? "" };
              if (void 0 !== cn(t5, vs, nn(t5, 1))) t5 = $e(t5 = hn(t5, vs, nn(t5, 1)), 1, qt, Ye()), e4.floatEmbedding = t5.slice();
              else {
                const n3 = new Uint8Array(0);
                e4.quantizedEmbedding = hn(t5, Es, nn(t5, 2))?.ma()?.h() ?? n3;
              }
              return e4;
            })), timestampMs: he(Ve(t4, 2)) ?? 0 };
          })(t3), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("embeddings_out", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    kc.cosineSimilarity = function(t2, e2) {
      if (t2.floatEmbedding && e2.floatEmbedding) t2 = Io(t2.floatEmbedding, e2.floatEmbedding);
      else {
        if (!t2.quantizedEmbedding || !e2.quantizedEmbedding) throw Error("Cannot compute cosine similarity between quantized and float embeddings.");
        t2 = Io(Fo(t2.quantizedEmbedding), Fo(e2.quantizedEmbedding));
      }
      return t2;
    }, kc.prototype.embedForVideo = kc.prototype.ya, kc.prototype.embed = kc.prototype.xa, kc.prototype.setOptions = kc.prototype.o, kc.createFromModelPath = function(t2, e2) {
      return za(kc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, kc.createFromModelBuffer = function(t2, e2) {
      return za(kc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, kc.createFromOptions = function(t2, e2) {
      return za(kc, t2, e2);
    };
    Sc = class {
      constructor(t2, e2, n2) {
        this.confidenceMasks = t2, this.categoryMask = e2, this.qualityScores = n2;
      }
      close() {
        this.confidenceMasks?.forEach(((t2) => {
          t2.close();
        })), this.categoryMask?.close();
      }
    };
    Sc.prototype.close = Sc.prototype.close;
    Rc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", false), this.s = [], this.outputCategoryMask = false, this.outputConfidenceMasks = true, this.h = new vo(), this.v = new go(), dn(this.h, 0, 3, this.v), dn(t2 = this.h, 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return void 0 !== t2.displayNamesLocale ? He(this.h, 2, de(t2.displayNamesLocale)) : "displayNamesLocale" in t2 && He(this.h, 2), "outputCategoryMask" in t2 && (this.outputCategoryMask = t2.outputCategoryMask ?? false), "outputConfidenceMasks" in t2 && (this.outputConfidenceMasks = t2.outputConfidenceMasks ?? true), super.l(t2);
      }
      J() {
        !(function(t2) {
          const e2 = ln(t2.ca(), zi, 1).filter(((t3) => (vn(t3, 1) ?? "").includes("mediapipe.tasks.TensorsToSegmentationCalculator")));
          if (t2.s = [], e2.length > 1) throw Error("The graph has more than one mediapipe.tasks.TensorsToSegmentationCalculator.");
          1 === e2.length && (hn(e2[0], Gi, 7)?.l()?.g() ?? /* @__PURE__ */ new Map()).forEach(((e3, n2) => {
            t2.s[Number(n2)] = vn(e3, 1) ?? "";
          }));
        })(this);
      }
      segment(t2, e2, n2) {
        const r2 = "function" != typeof e2 ? e2 : {};
        return this.j = "function" == typeof e2 ? e2 : n2, xc(this), Ya(this, t2, r2), Lc(this);
      }
      Ia(t2, e2, n2, r2) {
        const i2 = "function" != typeof n2 ? n2 : {};
        return this.j = "function" == typeof n2 ? n2 : r2, xc(this), $a(this, t2, i2, e2), Lc(this);
      }
      Ba() {
        return this.s;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect");
        const e2 = new Gi();
        Yn(e2, Eo, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.image_segmenter.ImageSegmenterGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), n2.o(e2), qi(t2, n2), $o(this, t2), this.outputConfidenceMasks && (Zi(t2, "confidence_masks"), Wi(n2, "CONFIDENCE_MASKS:confidence_masks"), qo(this, "confidence_masks"), this.g.ba("confidence_masks", ((t3, e3) => {
          this.confidenceMasks = t3.map(((t4) => qa(this, t4, true, !this.j))), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("confidence_masks", ((t3) => {
          this.confidenceMasks = [], Yo(this, t3);
        }))), this.outputCategoryMask && (Zi(t2, "category_mask"), Wi(n2, "CATEGORY_MASK:category_mask"), qo(this, "category_mask"), this.g.V("category_mask", ((t3, e3) => {
          this.categoryMask = qa(this, t3, false, !this.j), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("category_mask", ((t3) => {
          this.categoryMask = void 0, Yo(this, t3);
        }))), Zi(t2, "quality_scores"), Wi(n2, "QUALITY_SCORES:quality_scores"), this.g.attachFloatVectorListener("quality_scores", ((t3, e3) => {
          this.qualityScores = t3, Yo(this, e3);
        })), this.g.attachEmptyPacketListener("quality_scores", ((t3) => {
          this.categoryMask = void 0, Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Rc.prototype.getLabels = Rc.prototype.Ba, Rc.prototype.segmentForVideo = Rc.prototype.Ia, Rc.prototype.segment = Rc.prototype.segment, Rc.prototype.setOptions = Rc.prototype.o, Rc.createFromModelPath = function(t2, e2) {
      return za(Rc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Rc.createFromModelBuffer = function(t2, e2) {
      return za(Rc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Rc.createFromOptions = function(t2, e2) {
      return za(Rc, t2, e2);
    };
    Fc = class {
      constructor(t2, e2, n2) {
        this.confidenceMasks = t2, this.categoryMask = e2, this.qualityScores = n2;
      }
      close() {
        this.confidenceMasks?.forEach(((t2) => {
          t2.close();
        })), this.categoryMask?.close();
      }
    };
    Fc.prototype.close = Fc.prototype.close;
    Ic = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Mc = [0, hi, -2];
    Pc = [0, ni, -3, di, ni, -1];
    Cc = [0, Pc];
    Oc = [0, Pc, hi, -1];
    Uc = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Dc = [0, ni, -1, di];
    Nc = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Bc = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    Gc = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15];
    jc = class extends $n {
      constructor(t2) {
        super(t2);
      }
    };
    jc.prototype.g = Si([0, yi, [0, Gc, _i, Pc, _i, [0, Pc, Mc], _i, Cc, _i, [0, Cc, Mc], _i, Dc, _i, [0, ni, -3, di, Ti], _i, [0, ni, -3, di], _i, [0, mi, ni, -2, di, hi, di, -1, 2, ni, Mc], _i, Oc, _i, [0, Oc, Mc], ni, Mc, mi, _i, [0, ni, -3, di, Mc, -1], _i, [0, yi, Dc]], mi, [0, mi, hi, -1, di]]);
    Vc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect_in", false), this.outputCategoryMask = false, this.outputConfidenceMasks = true, this.h = new vo(), this.s = new go(), dn(this.h, 0, 3, this.s), dn(t2 = this.h, 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return "outputCategoryMask" in t2 && (this.outputCategoryMask = t2.outputCategoryMask ?? false), "outputConfidenceMasks" in t2 && (this.outputConfidenceMasks = t2.outputConfidenceMasks ?? true), super.l(t2);
      }
      segment(t2, e2, n2, r2) {
        const i2 = "function" != typeof n2 ? n2 : {};
        this.j = "function" == typeof n2 ? n2 : r2, this.qualityScores = this.categoryMask = this.confidenceMasks = void 0, n2 = this.B + 1, r2 = new jc();
        const s2 = new Bc();
        var o2 = new Ic();
        if (Tn(o2, 1, 255), dn(s2, 0, 12, o2), e2.keypoint && e2.scribble) throw Error("Cannot provide both keypoint and scribble.");
        if (e2.keypoint) {
          var a2 = new Uc();
          wn(a2, 3, true), An(a2, 1, e2.keypoint.x), An(a2, 2, e2.keypoint.y), fn(s2, 5, Gc, a2);
        } else {
          if (!e2.scribble) throw Error("Must provide either a keypoint or a scribble.");
          for (a2 of (o2 = new Nc(), e2.scribble)) wn(e2 = new Uc(), 3, true), An(e2, 1, a2.x), An(e2, 2, a2.y), yn(o2, 1, Uc, e2);
          fn(s2, 15, Gc, o2);
        }
        yn(r2, 1, Bc, s2), this.g.addProtoToStream(r2.g(), "drishti.RenderData", "roi_in", n2), Ya(this, t2, i2);
        t: {
          try {
            const t3 = new Fc(this.confidenceMasks, this.categoryMask, this.qualityScores);
            if (!this.j) {
              var c2 = t3;
              break t;
            }
            this.j(t3);
          } finally {
            Jo(this);
          }
          c2 = void 0;
        }
        return c2;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "roi_in"), Ji(t2, "norm_rect_in");
        const e2 = new Gi();
        Yn(e2, Eo, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.interactive_segmenter.InteractiveSegmenterGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "ROI:roi_in"), Hi(n2, "NORM_RECT:norm_rect_in"), n2.o(e2), qi(t2, n2), $o(this, t2), this.outputConfidenceMasks && (Zi(t2, "confidence_masks"), Wi(n2, "CONFIDENCE_MASKS:confidence_masks"), qo(this, "confidence_masks"), this.g.ba("confidence_masks", ((t3, e3) => {
          this.confidenceMasks = t3.map(((t4) => qa(this, t4, true, !this.j))), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("confidence_masks", ((t3) => {
          this.confidenceMasks = [], Yo(this, t3);
        }))), this.outputCategoryMask && (Zi(t2, "category_mask"), Wi(n2, "CATEGORY_MASK:category_mask"), qo(this, "category_mask"), this.g.V("category_mask", ((t3, e3) => {
          this.categoryMask = qa(this, t3, false, !this.j), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("category_mask", ((t3) => {
          this.categoryMask = void 0, Yo(this, t3);
        }))), Zi(t2, "quality_scores"), Wi(n2, "QUALITY_SCORES:quality_scores"), this.g.attachFloatVectorListener("quality_scores", ((t3, e3) => {
          this.qualityScores = t3, Yo(this, e3);
        })), this.g.attachEmptyPacketListener("quality_scores", ((t3) => {
          this.categoryMask = void 0, Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Vc.prototype.segment = Vc.prototype.segment, Vc.prototype.setOptions = Vc.prototype.o, Vc.createFromModelPath = function(t2, e2) {
      return za(Vc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Vc.createFromModelBuffer = function(t2, e2) {
      return za(Vc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Vc.createFromOptions = function(t2, e2) {
      return za(Vc, t2, e2);
    };
    Xc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "input_frame_gpu", "norm_rect", false), this.j = { detections: [] }, dn(t2 = this.h = new wo(), 0, 1, e2 = new Is());
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return void 0 !== t2.displayNamesLocale ? He(this.h, 2, de(t2.displayNamesLocale)) : "displayNamesLocale" in t2 && He(this.h, 2), void 0 !== t2.maxResults ? Tn(this.h, 3, t2.maxResults) : "maxResults" in t2 && He(this.h, 3), void 0 !== t2.scoreThreshold ? An(this.h, 4, t2.scoreThreshold) : "scoreThreshold" in t2 && He(this.h, 4), void 0 !== t2.categoryAllowlist ? bn(this.h, 5, t2.categoryAllowlist) : "categoryAllowlist" in t2 && He(this.h, 5), void 0 !== t2.categoryDenylist ? bn(this.h, 6, t2.categoryDenylist) : "categoryDenylist" in t2 && He(this.h, 6), this.l(t2);
      }
      D(t2, e2) {
        return this.j = { detections: [] }, Ya(this, t2, e2), this.j;
      }
      F(t2, e2, n2) {
        return this.j = { detections: [] }, $a(this, t2, n2, e2), this.j;
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "input_frame_gpu"), Ji(t2, "norm_rect"), Zi(t2, "detections");
        const e2 = new Gi();
        Yn(e2, To, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.ObjectDetectorGraph"), Hi(n2, "IMAGE:input_frame_gpu"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "DETECTIONS:detections"), n2.o(e2), qi(t2, n2), this.g.attachProtoVectorListener("detections", ((t3, e3) => {
          for (const e4 of t3) t3 = hs(e4), this.j.detections.push(xo(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("detections", ((t3) => {
          Yo(this, t3);
        })), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Xc.prototype.detectForVideo = Xc.prototype.F, Xc.prototype.detect = Xc.prototype.D, Xc.prototype.setOptions = Xc.prototype.o, Xc.createFromModelPath = async function(t2, e2) {
      return za(Xc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Xc.createFromModelBuffer = function(t2, e2) {
      return za(Xc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Xc.createFromOptions = function(t2, e2) {
      return za(Xc, t2, e2);
    };
    Hc = class {
      constructor(t2, e2, n2) {
        this.landmarks = t2, this.worldLandmarks = e2, this.segmentationMasks = n2;
      }
      close() {
        this.segmentationMasks?.forEach(((t2) => {
          t2.close();
        }));
      }
    };
    Hc.prototype.close = Hc.prototype.close;
    Kc = class extends Ja {
      constructor(t2, e2) {
        super(new Wa(t2, e2), "image_in", "norm_rect", false), this.landmarks = [], this.worldLandmarks = [], this.outputSegmentationMasks = false, dn(t2 = this.h = new Ao(), 0, 1, e2 = new Is()), this.v = new oo(), dn(this.h, 0, 3, this.v), this.j = new so(), dn(this.h, 0, 2, this.j), Tn(this.j, 4, 1), An(this.j, 2, 0.5), An(this.v, 2, 0.5), An(this.h, 4, 0.5);
      }
      get baseOptions() {
        return hn(this.h, Is, 1);
      }
      set baseOptions(t2) {
        dn(this.h, 0, 1, t2);
      }
      o(t2) {
        return "numPoses" in t2 && Tn(this.j, 4, t2.numPoses ?? 1), "minPoseDetectionConfidence" in t2 && An(this.j, 2, t2.minPoseDetectionConfidence ?? 0.5), "minTrackingConfidence" in t2 && An(this.h, 4, t2.minTrackingConfidence ?? 0.5), "minPosePresenceConfidence" in t2 && An(this.v, 2, t2.minPosePresenceConfidence ?? 0.5), "outputSegmentationMasks" in t2 && (this.outputSegmentationMasks = t2.outputSegmentationMasks ?? false), this.l(t2);
      }
      D(t2, e2, n2) {
        const r2 = "function" != typeof e2 ? e2 : {};
        return this.s = "function" == typeof e2 ? e2 : n2, Wc(this), Ya(this, t2, r2), zc(this);
      }
      F(t2, e2, n2, r2) {
        const i2 = "function" != typeof n2 ? n2 : {};
        return this.s = "function" == typeof n2 ? n2 : r2, Wc(this), $a(this, t2, i2, e2), zc(this);
      }
      m() {
        var t2 = new Qi();
        Ji(t2, "image_in"), Ji(t2, "norm_rect"), Zi(t2, "normalized_landmarks"), Zi(t2, "world_landmarks"), Zi(t2, "segmentation_masks");
        const e2 = new Gi();
        Yn(e2, bo, this.h);
        const n2 = new zi();
        Xi(n2, "mediapipe.tasks.vision.pose_landmarker.PoseLandmarkerGraph"), Hi(n2, "IMAGE:image_in"), Hi(n2, "NORM_RECT:norm_rect"), Wi(n2, "NORM_LANDMARKS:normalized_landmarks"), Wi(n2, "WORLD_LANDMARKS:world_landmarks"), n2.o(e2), qi(t2, n2), $o(this, t2), this.g.attachProtoVectorListener("normalized_landmarks", ((t3, e3) => {
          this.landmarks = [];
          for (const e4 of t3) t3 = fs(e4), this.landmarks.push(Lo(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("normalized_landmarks", ((t3) => {
          this.landmarks = [], Yo(this, t3);
        })), this.g.attachProtoVectorListener("world_landmarks", ((t3, e3) => {
          this.worldLandmarks = [];
          for (const e4 of t3) t3 = ls(e4), this.worldLandmarks.push(Ro(t3));
          Yo(this, e3);
        })), this.g.attachEmptyPacketListener("world_landmarks", ((t3) => {
          this.worldLandmarks = [], Yo(this, t3);
        })), this.outputSegmentationMasks && (Wi(n2, "SEGMENTATION_MASK:segmentation_masks"), qo(this, "segmentation_masks"), this.g.ba("segmentation_masks", ((t3, e3) => {
          this.segmentationMasks = t3.map(((t4) => qa(this, t4, true, !this.s))), Yo(this, e3);
        })), this.g.attachEmptyPacketListener("segmentation_masks", ((t3) => {
          this.segmentationMasks = [], Yo(this, t3);
        }))), t2 = t2.g(), this.setGraph(new Uint8Array(t2), true);
      }
    };
    Kc.prototype.detectForVideo = Kc.prototype.F, Kc.prototype.detect = Kc.prototype.D, Kc.prototype.setOptions = Kc.prototype.o, Kc.createFromModelPath = function(t2, e2) {
      return za(Kc, t2, { baseOptions: { modelAssetPath: e2 } });
    }, Kc.createFromModelBuffer = function(t2, e2) {
      return za(Kc, t2, { baseOptions: { modelAssetBuffer: e2 } });
    }, Kc.createFromOptions = function(t2, e2) {
      return za(Kc, t2, e2);
    }, Kc.POSE_CONNECTIONS = vc;
  }
});

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_2) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k2) => typeof obj[obj[k2]] !== "number");
    const filtered = {};
    for (const k2 of validKeys) {
      filtered[k2] = obj[k2];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e2) {
      return obj[e2];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_2, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t2 = typeof data;
  switch (t2) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i2 = 0;
          while (i2 < issue.path.length) {
            const el = issue.path[i2];
            const terminal = i2 === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i2++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m2) => !!m2).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x2) => !!x2)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s2 of results) {
      if (s2.status === "aborted")
        return INVALID;
      if (s2.status === "dirty")
        status.dirty();
      arrayValue.push(s2.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x2) => x2.status === "aborted";
var isDirty = (x2) => x2.status === "dirty";
var isValid = (x2) => x2.status === "valid";
var isAsync = (x2) => typeof Promise !== "undefined" && x2 instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i2) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i2) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i2));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a2, b2) {
  const aType = getParsedType(a2);
  const bType = getParsedType(b2);
  if (a2 === b2) {
    return { valid: true, data: a2 };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b2);
    const sharedKeys = util.objectKeys(a2).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a2, ...b2 };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a2[key], b2[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a2.length !== b2.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a2.length; index++) {
      const itemA = a2[index];
      const itemB = b2[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a2 === +b2) {
    return { valid: true, data: a2 };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x2) => !!x2);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i2) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i2)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x2) => !!x2),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn2 = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me2 = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me2._def.args.parseAsync(args, params).catch((e2) => {
          error.addIssue(makeArgsIssue(args, e2));
          throw error;
        });
        const result = await Reflect.apply(fn2, this, parsedArgs);
        const parsedReturns = await me2._def.returns._def.type.parseAsync(result, params).catch((e2) => {
          error.addIssue(makeReturnsIssue(result, e2));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me2 = this;
      return OK(function(...args) {
        const parsedArgs = me2._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn2, this, parsedArgs.data);
        const parsedReturns = me2._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a2, b2) {
    return new _ZodPipeline({
      in: a2,
      out: b2,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p2 = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p22 = typeof p2 === "string" ? { message: p2 } : p2;
  return p22;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r2 = check(data);
      if (r2 instanceof Promise) {
        return r2.then((r3) => {
          if (!r3) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r2) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// hot/bronze/src/contracts/schemas.ts
var GestureLabels = [
  "Open_Palm",
  // Baseline / arming gesture
  "Pointing_Up",
  // Commit action (click/drag)
  "Victory",
  // Navigation action (pan/scroll)
  "Thumb_Up",
  // Zoom in
  "Thumb_Down",
  // Zoom out
  "Closed_Fist",
  // Alternative commit
  "ILoveYou",
  // Optional: tool switch
  "None"
  // No gesture detected
];
var VideoFrameSchema = external_exports.object({
  timestamp: external_exports.number().nonnegative().describe("Performance.now() in ms"),
  width: external_exports.number().int().positive(),
  height: external_exports.number().int().positive()
});
var NormalizedLandmarkSchema = external_exports.object({
  x: external_exports.number().min(0).max(1),
  y: external_exports.number().min(0).max(1),
  z: external_exports.number(),
  // depth relative to wrist
  visibility: external_exports.number().min(0).max(1).nullish()
  // Allow null or undefined
});
var SensorFrameSchema = external_exports.object({
  ts: external_exports.number().nonnegative().describe("Timestamp in ms"),
  handId: external_exports.enum(["left", "right", "none"]),
  trackingOk: external_exports.boolean(),
  palmFacing: external_exports.boolean(),
  label: external_exports.enum(GestureLabels),
  confidence: external_exports.number().min(0).max(1),
  indexTip: NormalizedLandmarkSchema.nullable(),
  landmarks: external_exports.array(NormalizedLandmarkSchema).length(21).nullable()
});
var SmoothedFrameSchema = external_exports.object({
  ts: external_exports.number().nonnegative(),
  handId: external_exports.enum(["left", "right", "none"]),
  trackingOk: external_exports.boolean(),
  palmFacing: external_exports.boolean(),
  label: external_exports.enum(GestureLabels),
  confidence: external_exports.number().min(0).max(1),
  /** Filtered position (0-1 normalized) */
  position: external_exports.object({
    x: external_exports.number().min(0).max(1),
    y: external_exports.number().min(0).max(1)
  }).nullable(),
  /** Estimated velocity (units/second) */
  velocity: external_exports.object({
    x: external_exports.number(),
    y: external_exports.number()
  }).nullable(),
  /** Predicted position for next frame (latency compensation) */
  prediction: external_exports.object({
    x: external_exports.number().min(0).max(1),
    y: external_exports.number().min(0).max(1)
  }).nullable()
});
var FSMStates = [
  "DISARMED",
  // System inactive
  "ARMING",
  // Baseline hysteresis
  "ARMED",
  // Cursor aim mode
  "DOWN_COMMIT",
  // Primary click/drag (button=0)
  "DOWN_NAV",
  // Middle-click drag (button=1)
  "ZOOM"
  // Wheel emission
];
var FSMActionSchema = external_exports.discriminatedUnion("action", [
  external_exports.object({
    action: external_exports.literal("none"),
    state: external_exports.enum(FSMStates)
  }),
  external_exports.object({
    action: external_exports.literal("move"),
    state: external_exports.enum(FSMStates),
    x: external_exports.number(),
    y: external_exports.number()
  }),
  external_exports.object({
    action: external_exports.literal("down"),
    state: external_exports.enum(FSMStates),
    x: external_exports.number(),
    y: external_exports.number(),
    button: external_exports.union([external_exports.literal(0), external_exports.literal(1)])
  }),
  external_exports.object({
    action: external_exports.literal("up"),
    state: external_exports.enum(FSMStates),
    x: external_exports.number(),
    y: external_exports.number(),
    button: external_exports.union([external_exports.literal(0), external_exports.literal(1)])
  }),
  external_exports.object({
    action: external_exports.literal("cancel"),
    state: external_exports.enum(FSMStates)
  }),
  external_exports.object({
    action: external_exports.literal("wheel"),
    state: external_exports.enum(FSMStates),
    deltaY: external_exports.number(),
    ctrl: external_exports.boolean().nullish()
    // Allow null or undefined
  })
]);
var PointerEventOutSchema = external_exports.discriminatedUnion("type", [
  external_exports.object({
    type: external_exports.literal("pointermove"),
    pointerId: external_exports.number().int().nonnegative(),
    clientX: external_exports.number(),
    clientY: external_exports.number(),
    pointerType: external_exports.enum(["mouse", "pen", "touch"]),
    pressure: external_exports.number().min(0).max(1),
    isPrimary: external_exports.boolean()
  }),
  external_exports.object({
    type: external_exports.literal("pointerdown"),
    pointerId: external_exports.number().int().nonnegative(),
    clientX: external_exports.number(),
    clientY: external_exports.number(),
    pointerType: external_exports.enum(["mouse", "pen", "touch"]),
    button: external_exports.number().int().min(0).max(2),
    buttons: external_exports.number().int().nonnegative(),
    pressure: external_exports.number().min(0).max(1),
    isPrimary: external_exports.boolean()
  }),
  external_exports.object({
    type: external_exports.literal("pointerup"),
    pointerId: external_exports.number().int().nonnegative(),
    clientX: external_exports.number(),
    clientY: external_exports.number(),
    pointerType: external_exports.enum(["mouse", "pen", "touch"]),
    button: external_exports.number().int().min(0).max(2),
    buttons: external_exports.number().int().nonnegative(),
    pressure: external_exports.number().min(0).max(1),
    isPrimary: external_exports.boolean()
  }),
  external_exports.object({
    type: external_exports.literal("pointercancel"),
    pointerId: external_exports.number().int().nonnegative(),
    pointerType: external_exports.enum(["mouse", "pen", "touch"])
  }),
  external_exports.object({
    type: external_exports.literal("wheel"),
    deltaY: external_exports.number(),
    deltaMode: external_exports.number().int(),
    ctrlKey: external_exports.boolean(),
    clientX: external_exports.number(),
    clientY: external_exports.number()
  })
]);
var AdapterTargetSchema = external_exports.object({
  type: external_exports.enum(["canvas", "element", "iframe", "document", "puter"]),
  selector: external_exports.string().optional(),
  bounds: external_exports.object({
    width: external_exports.number().positive(),
    height: external_exports.number().positive(),
    left: external_exports.number(),
    top: external_exports.number()
  })
});
var PuterWindowOptionsSchema = external_exports.object({
  title: external_exports.string().optional(),
  content: external_exports.string().optional(),
  width: external_exports.number().positive().optional(),
  height: external_exports.number().positive().optional(),
  x: external_exports.number().optional(),
  y: external_exports.number().optional(),
  is_resizable: external_exports.boolean().default(true),
  has_head: external_exports.boolean().default(true),
  center: external_exports.boolean().default(false),
  show_in_taskbar: external_exports.boolean().default(true),
  disable_parent_window: external_exports.boolean().default(false)
});
var PuterWindowStateSchema = external_exports.object({
  id: external_exports.string(),
  title: external_exports.string(),
  bounds: external_exports.object({
    width: external_exports.number().positive(),
    height: external_exports.number().positive(),
    x: external_exports.number(),
    y: external_exports.number()
  }),
  isMinimized: external_exports.boolean(),
  isMaximized: external_exports.boolean(),
  isFocused: external_exports.boolean()
});
var PuterShellConfigSchema = external_exports.object({
  shell: external_exports.literal("puter"),
  autoArrange: external_exports.boolean().default(true),
  showInTaskbar: external_exports.boolean().default(true),
  enableSnapping: external_exports.boolean().default(true),
  defaultWindowSize: external_exports.object({
    width: external_exports.number().positive().default(800),
    height: external_exports.number().positive().default(600)
  }).optional()
});
var PipelineConfigSchema = external_exports.object({
  /** 1€ Filter parameters */
  filter: external_exports.object({
    mincutoff: external_exports.number().positive().default(1),
    beta: external_exports.number().nonnegative().default(7e-3),
    dcutoff: external_exports.number().positive().default(1)
  }),
  /** FSM timing parameters */
  fsm: external_exports.object({
    armStableMs: external_exports.number().positive().default(200),
    cmdWindowMs: external_exports.number().positive().default(500),
    minConfidence: external_exports.number().min(0).max(1).default(0.7)
  }),
  /** Pointer ID for synthetic events */
  pointerId: external_exports.number().int().nonnegative().default(1),
  /** Pointer type to simulate */
  pointerType: external_exports.enum(["mouse", "pen", "touch"]).default("touch")
});
var CursorStateSchema = external_exports.enum([
  "hidden",
  // No cursor
  "tracking",
  // Hand detected, not armed
  "armed",
  // Ready to commit gesture
  "active",
  // Gesture in progress
  "error"
  // Tracking lost
]);
var OverlayConfigSchema = external_exports.object({
  /** Show raw (unfiltered) cursor */
  showRaw: external_exports.boolean().default(false),
  /** Show smoothed cursor */
  showSmoothed: external_exports.boolean().default(true),
  /** Show predicted cursor */
  showPredicted: external_exports.boolean().default(false),
  /** Show hand skeleton */
  showSkeleton: external_exports.boolean().default(true),
  /** Cursor size in pixels */
  cursorSize: external_exports.number().positive().default(20),
  /** Colors for cursor states */
  colors: external_exports.object({
    raw: external_exports.string().default("#ff0000"),
    smoothed: external_exports.string().default("#00ff00"),
    predicted: external_exports.string().default("#0000ff"),
    skeleton: external_exports.string().default("#ffff00")
  }).default({})
});
var TileTypeSchema = external_exports.enum([
  "pixi",
  // PixiJS canvas
  "canvas",
  // Raw Canvas2D
  "dom",
  // DOM element
  "iframe",
  // Iframe (for emulators)
  "excalidraw",
  // Excalidraw whiteboard
  "tldraw",
  // tldraw whiteboard
  "v86",
  // v86 x86 emulator
  "jsdos",
  // js-dos emulator
  "puter",
  // Puter cloud OS
  "custom"
  // Custom adapter
]);
var TileConfigSchema = external_exports.object({
  id: external_exports.string(),
  type: TileTypeSchema,
  title: external_exports.string().optional(),
  /** Adapter-specific configuration */
  config: external_exports.record(external_exports.unknown()).default({})
});
var ShellTypeSchema = external_exports.enum([
  "mosaic",
  // react-mosaic tiling
  "golden",
  // golden-layout
  "daedalos",
  // daedalOS desktop
  "raw"
  // Raw HTML divs
]);
var LayoutNodeSchema = external_exports.lazy(
  () => external_exports.union([
    external_exports.string(),
    // Leaf node (tile ID)
    external_exports.object({
      direction: external_exports.enum(["row", "column"]),
      first: LayoutNodeSchema,
      second: LayoutNodeSchema,
      splitPercentage: external_exports.number().min(0).max(100).default(50)
    })
  ])
);
var LayoutStateSchema = external_exports.object({
  tiles: external_exports.array(TileConfigSchema),
  arrangement: LayoutNodeSchema,
  shell: ShellTypeSchema
});
var UIShellConfigSchema = external_exports.object({
  shell: ShellTypeSchema.default("raw"),
  initialLayout: LayoutStateSchema.optional(),
  /** Enable drag-drop tile rearrangement */
  allowDragDrop: external_exports.boolean().default(true),
  /** Enable tile splitting */
  allowSplit: external_exports.boolean().default(true),
  /** Enable tile closing */
  allowClose: external_exports.boolean().default(true)
});

// hot/bronze/src/adapters/one-euro-exemplar.adapter.ts
var import_eurofilter = __toESM(require_dist(), 1);
var DEFAULT_CONFIG = {
  frequency: 60,
  minCutoff: 1,
  beta: 7e-3,
  dCutoff: 1
};
var OneEuroExemplarAdapter = class {
  constructor(config = {}) {
    __publicField(this, "config");
    __publicField(this, "filters", /* @__PURE__ */ new Map());
    __publicField(this, "lastTimestamp", null);
    __publicField(this, "lastPosition", null);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  /**
   * Smooth a sensor frame using 1€ filter
   * @param frame Raw sensor frame from MediaPipe
   * @returns Smoothed frame with filtered positions and velocity
   */
  smooth(frame) {
    if (!frame.indexTip) {
      return this.createPassthroughFrame(frame);
    }
    const dt2 = this.lastTimestamp !== null ? Math.max((frame.ts - this.lastTimestamp) / 1e3, 1e-3) : 1 / this.config.frequency;
    this.lastTimestamp = frame.ts;
    const timestampSec = Math.max(frame.ts / 1e3, 1e-3);
    const smoothedTip = this.smoothLandmark("indexTip", frame.indexTip, timestampSec);
    let velocity = { x: 0, y: 0 };
    if (this.lastPosition && dt2 > 0) {
      velocity = {
        x: (smoothedTip.x - this.lastPosition.x) / dt2,
        y: (smoothedTip.y - this.lastPosition.y) / dt2
      };
    }
    if (Number.isNaN(smoothedTip.x) || Number.isNaN(smoothedTip.y)) {
      this.reset();
      return this.createPassthroughFrame(frame);
    }
    this.lastPosition = { x: smoothedTip.x, y: smoothedTip.y };
    const output = {
      ts: frame.ts,
      handId: frame.handId,
      trackingOk: frame.trackingOk,
      palmFacing: frame.palmFacing,
      label: frame.label,
      confidence: frame.confidence,
      position: { x: smoothedTip.x, y: smoothedTip.y },
      velocity,
      prediction: null
      // Could add Kalman prediction here
    };
    return SmoothedFrameSchema.parse(output);
  }
  /**
   * Smooth a single landmark using paired X/Y filters
   * @param key - Landmark identifier for filter caching
   * @param landmark - Raw landmark position
   * @param timestampSec - Absolute timestamp in seconds (frame.ts / 1000)
   */
  smoothLandmark(key, landmark, timestampSec) {
    if (!this.filters.has(key)) {
      this.filters.set(key, {
        x: new import_eurofilter.OneEuroFilter(
          this.config.frequency,
          this.config.minCutoff,
          this.config.beta,
          this.config.dCutoff
        ),
        y: new import_eurofilter.OneEuroFilter(
          this.config.frequency,
          this.config.minCutoff,
          this.config.beta,
          this.config.dCutoff
        )
      });
    }
    const filter = this.filters.get(key);
    return {
      x: Math.max(0, Math.min(1, filter.x.filter(landmark.x, timestampSec))),
      y: Math.max(0, Math.min(1, filter.y.filter(landmark.y, timestampSec))),
      z: landmark.z,
      visibility: landmark.visibility
    };
  }
  /**
   * Create passthrough frame when filtering fails or no landmarks available
   * If indexTip exists, uses raw values. Otherwise null position.
   */
  createPassthroughFrame(frame) {
    const position = frame.indexTip ? { x: Math.max(0, Math.min(1, frame.indexTip.x)), y: Math.max(0, Math.min(1, frame.indexTip.y)) } : null;
    return SmoothedFrameSchema.parse({
      ts: frame.ts,
      handId: frame.handId,
      trackingOk: frame.trackingOk,
      palmFacing: frame.palmFacing,
      label: frame.label,
      confidence: frame.confidence,
      position,
      velocity: position ? { x: 0, y: 0 } : null,
      prediction: null
    });
  }
  /**
   * Reset all filters (e.g., when hand tracking is lost)
   */
  reset() {
    this.filters.clear();
    this.lastTimestamp = null;
    this.lastPosition = null;
  }
  /**
   * Update filter parameters at runtime
   * @param mincutoff - Min cutoff frequency in Hz (> 0). Lower = more smoothing.
   * @param beta - Speed coefficient (> 0). Higher = less lag at high speeds.
   */
  setParams(mincutoff, beta) {
    this.config.minCutoff = mincutoff;
    this.config.beta = beta;
    this.filters.forEach((filterPair) => {
      filterPair.x.setMinCutoff(mincutoff);
      filterPair.x.setBeta(beta);
      filterPair.y.setMinCutoff(mincutoff);
      filterPair.y.setBeta(beta);
    });
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};

// hot/bronze/src/adapters/rapier-physics.adapter.ts
import RAPIER from "@dimforge/rapier2d-compat";

// hot/bronze/src/constants/magic-numbers.ts
var ONE_EURO_MINCUTOFF_DEFAULT = 1;
var ONE_EURO_MINCUTOFF_MIN = 0.1;
var ONE_EURO_MINCUTOFF_MAX = 10;
var ONE_EURO_BETA_DEFAULT = 0;
var ONE_EURO_BETA_MIN = 0;
var ONE_EURO_BETA_MAX = 1;
var ONE_EURO_DCUTOFF_DEFAULT = 1;
var ONE_EURO_DCUTOFF_MIN = 0.1;
var ONE_EURO_DCUTOFF_MAX = 10;
var DEAD_ZONE_DEFAULT = 0.1;
var DEAD_ZONE_MIN = 0.05;
var DEAD_ZONE_MAX = 0.25;
var RAPIER_DAMPING_DEFAULT = 1.2;
var RAPIER_DAMPING_MIN = 0.5;
var RAPIER_DAMPING_MAX = 2;
var RAPIER_STIFFNESS_DEFAULT = 200;
var RAPIER_STIFFNESS_MIN = 100;
var RAPIER_STIFFNESS_MAX = 500;
var RAPIER_SUBSTEPS_DEFAULT = 4;
var RAPIER_SUBSTEPS_MIN = 1;
var RAPIER_SUBSTEPS_MAX = 8;
var TTI_DISTANCE_THRESHOLD = 1e-3;
var TTI_SPEED_THRESHOLD = 1e-3;
var OneEuroTunablesSchema = external_exports.object({
  mincutoff: external_exports.number().min(ONE_EURO_MINCUTOFF_MIN).max(ONE_EURO_MINCUTOFF_MAX).default(ONE_EURO_MINCUTOFF_DEFAULT),
  beta: external_exports.number().min(ONE_EURO_BETA_MIN).max(ONE_EURO_BETA_MAX).default(ONE_EURO_BETA_DEFAULT),
  dcutoff: external_exports.number().min(ONE_EURO_DCUTOFF_MIN).max(ONE_EURO_DCUTOFF_MAX).default(ONE_EURO_DCUTOFF_DEFAULT)
});
var DeadZoneTunablesSchema = external_exports.object({
  deadZone: external_exports.number().min(DEAD_ZONE_MIN).max(DEAD_ZONE_MAX).default(DEAD_ZONE_DEFAULT)
});
var RapierTunablesSchema = external_exports.object({
  damping: external_exports.number().min(RAPIER_DAMPING_MIN).max(RAPIER_DAMPING_MAX).default(RAPIER_DAMPING_DEFAULT),
  stiffness: external_exports.number().min(RAPIER_STIFFNESS_MIN).max(RAPIER_STIFFNESS_MAX).default(RAPIER_STIFFNESS_DEFAULT),
  substeps: external_exports.number().int().min(RAPIER_SUBSTEPS_MIN).max(RAPIER_SUBSTEPS_MAX).default(RAPIER_SUBSTEPS_DEFAULT)
});
var AllTunablesSchema = external_exports.object({
  oneEuro: OneEuroTunablesSchema.optional(),
  deadZone: DeadZoneTunablesSchema.optional(),
  rapier: RapierTunablesSchema.optional()
});

// hot/bronze/src/adapters/rapier-physics.adapter.ts
var DEFAULT_CONFIG2 = {
  mode: "smoothed",
  stiffness: RAPIER_STIFFNESS_DEFAULT,
  // 200 - Tuned for ~50ms settling time
  damping: RAPIER_DAMPING_DEFAULT,
  // 1.2 - Critically damped+ to prevent oscillation
  predictionMs: 50,
  // 3 frames at 60fps
  substeps: RAPIER_SUBSTEPS_DEFAULT,
  // 4 - Balance accuracy vs performance
  // Velocity dead zone - XInput standard (see MAGIC_NUMBERS_REGISTRY.md)
  velocityDeadZone: DEAD_ZONE_DEFAULT,
  // 0.10 (10%) - Hardware noise floor
  // Adaptive mode defaults (tuned for cursor tracking)
  minStiffness: 50,
  // Lower minimum for smoother rest behavior
  speedCoefficient: 300,
  // Gentler ramp-up
  maxStiffness: 400
  // Lower cap for stability
};
var RapierPhysicsAdapter = class {
  constructor(config = {}) {
    __publicField(this, "config");
    __publicField(this, "initialized", false);
    __publicField(this, "world", null);
    __publicField(this, "cursorBody", null);
    __publicField(this, "targetPosition", { x: 0.5, y: 0.5 });
    __publicField(this, "lastTimestamp", null);
    __publicField(this, "velocity", { x: 0, y: 0 });
    // Track effective stiffness for debugging/testing
    __publicField(this, "_lastEffectiveStiffness", 0);
    this.config = { ...DEFAULT_CONFIG2, ...config };
  }
  /**
   * Initialize Rapier WASM - MUST be called before use
   */
  async init() {
    if (this.initialized) return;
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: 0 });
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0.5, 0.5).setLinearDamping(this.config.damping * 10);
    this.cursorBody = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.ball(0.01);
    this.world.createCollider(colliderDesc, this.cursorBody);
    this.initialized = true;
  }
  /**
   * Smooth a sensor frame using Rapier physics
   */
  smooth(frame) {
    if (!this.initialized || !this.world || !this.cursorBody) {
      return this.createPassthroughFrame(frame);
    }
    if (frame.indexTip) {
      this.targetPosition = { x: frame.indexTip.x, y: frame.indexTip.y };
    }
    const rawDt = this.lastTimestamp !== null ? (frame.ts - this.lastTimestamp) / 1e3 : 1 / 60;
    const dt2 = Math.min(rawDt, 0.1);
    this.lastTimestamp = frame.ts;
    const currentPos = this.cursorBody.translation();
    const dx = this.targetPosition.x - currentPos.x;
    const dy = this.targetPosition.y - currentPos.y;
    let effectiveStiffness;
    if (this.config.mode === "adaptive") {
      const speed2 = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
      effectiveStiffness = Math.min(
        this.config.minStiffness + this.config.speedCoefficient * speed2,
        this.config.maxStiffness
      );
    } else {
      effectiveStiffness = this.config.stiffness;
    }
    this._lastEffectiveStiffness = effectiveStiffness;
    const forceScale = 1e-3;
    const forceX = dx * effectiveStiffness * forceScale;
    const forceY = dy * effectiveStiffness * forceScale;
    this.cursorBody.applyImpulse({ x: forceX * dt2, y: forceY * dt2 }, true);
    for (let i2 = 0; i2 < this.config.substeps; i2++) {
      this.world.step();
    }
    const smoothedPos = this.cursorBody.translation();
    const smoothedVel = this.cursorBody.linvel();
    if (Number.isNaN(smoothedPos.x) || Number.isNaN(smoothedPos.y) || Number.isNaN(smoothedVel.x) || Number.isNaN(smoothedVel.y)) {
      this.reset();
      return this.createPassthroughFrame(frame);
    }
    const speed = Math.sqrt(smoothedVel.x * smoothedVel.x + smoothedVel.y * smoothedVel.y);
    if (speed < this.config.velocityDeadZone) {
      this.cursorBody.setLinvel({ x: 0, y: 0 }, true);
      this.velocity = { x: 0, y: 0 };
    } else {
      this.velocity = { x: smoothedVel.x, y: smoothedVel.y };
    }
    let outputPosition = { x: smoothedPos.x, y: smoothedPos.y };
    if (this.config.mode === "predictive") {
      const predictionSec = this.config.predictionMs / 1e3;
      outputPosition = {
        x: smoothedPos.x + smoothedVel.x * predictionSec,
        y: smoothedPos.y + smoothedVel.y * predictionSec
      };
    }
    const clampedPosition = {
      x: Math.max(0, Math.min(1, outputPosition.x)),
      y: Math.max(0, Math.min(1, outputPosition.y))
    };
    return {
      ts: frame.ts,
      handId: frame.handId,
      position: clampedPosition,
      velocity: this.velocity,
      prediction: this.config.mode === "predictive" ? clampedPosition : null,
      trackingOk: frame.trackingOk,
      label: frame.label ?? "None",
      confidence: frame.confidence ?? 0,
      palmFacing: frame.palmFacing ?? false
    };
  }
  /**
   * Reset the physics state
   */
  reset() {
    if (this.cursorBody) {
      this.cursorBody.setTranslation({ x: 0.5, y: 0.5 }, true);
      this.cursorBody.setLinvel({ x: 0, y: 0 }, true);
    }
    this.lastTimestamp = null;
    this.velocity = { x: 0, y: 0 };
  }
  /**
   * Update configuration (SmootherPort interface compatibility)
   * @param mincutoff - Maps to stiffness (higher = less smoothing)
   * @param beta - Maps to damping (higher = more damping)
   */
  setParams(mincutoff, beta) {
    if (this.config.mode === "adaptive") {
      this.config = {
        ...this.config,
        minStiffness: mincutoff * 50,
        // Scale for minStiffness
        speedCoefficient: beta * 1e3
        // Scale for velocity sensitivity
      };
    } else {
      this.config = {
        ...this.config,
        stiffness: mincutoff * 100,
        damping: 0.5 + beta * 0.45
      };
    }
    if (this.cursorBody) {
      this.cursorBody.setLinearDamping(this.config.damping * 10);
    }
  }
  /**
   * Get current physics state for debugging
   */
  getState() {
    if (!this.cursorBody) {
      return {
        position: { x: 0.5, y: 0.5 },
        velocity: { x: 0, y: 0 },
        effectiveStiffness: 0,
        mode: this.config.mode
      };
    }
    const pos = this.cursorBody.translation();
    const vel = this.cursorBody.linvel();
    return {
      position: { x: pos.x, y: pos.y },
      velocity: { x: vel.x, y: vel.y },
      effectiveStiffness: this._lastEffectiveStiffness,
      mode: this.config.mode
    };
  }
  /**
   * Get current configuration (for testing)
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Calculate Time-to-Impact (TTI) to a target point
   *
   * Uses current velocity to estimate when cursor will reach target.
   * Returns Infinity if cursor is moving away from target.
   *
   * @param targetX - Target X coordinate (0-1)
   * @param targetY - Target Y coordinate (0-1)
   * @returns TTI in milliseconds, or Infinity if moving away
   */
  calculateTTI(targetX, targetY) {
    if (!this.cursorBody) return Number.POSITIVE_INFINITY;
    const pos = this.cursorBody.translation();
    const vel = this.cursorBody.linvel();
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1e-3) return 0;
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2);
    if (speed < 1e-3) return Number.POSITIVE_INFINITY;
    const dot = dx * vel.x + dy * vel.y;
    if (dot <= 0) return Number.POSITIVE_INFINITY;
    const velocityTowardTarget = dot / distance;
    return distance / velocityTowardTarget * 1e3;
  }
  /**
   * Get predicted trajectory points for visualization
   *
   * @param durationMs - How far to predict (ms)
   * @param steps - Number of trajectory points
   * @returns Array of predicted positions with timestamps
   */
  getPredictedTrajectory(durationMs, steps) {
    const trajectory = [];
    if (!this.cursorBody) {
      return trajectory;
    }
    const pos = this.cursorBody.translation();
    const vel = this.cursorBody.linvel();
    for (let i2 = 0; i2 <= steps; i2++) {
      const t2 = i2 / steps * durationMs;
      const \u03C4 = t2 / 1e3;
      let x2 = pos.x + vel.x * \u03C4;
      let y2 = pos.y + vel.y * \u03C4;
      x2 = Math.max(0, Math.min(1, x2));
      y2 = Math.max(0, Math.min(1, y2));
      trajectory.push({ x: x2, y: y2, t: t2 });
    }
    return trajectory;
  }
  createPassthroughFrame(frame) {
    return {
      ts: frame.ts,
      handId: frame.handId,
      position: frame.indexTip ?? { x: 0.5, y: 0.5 },
      velocity: { x: 0, y: 0 },
      prediction: null,
      trackingOk: frame.trackingOk,
      label: frame.label ?? "None",
      confidence: frame.confidence ?? 0,
      palmFacing: frame.palmFacing ?? false
    };
  }
};
async function createPredictiveRapierAdapter(config = {}) {
  const adapter = new RapierPhysicsAdapter({ ...config, mode: "predictive" });
  await adapter.init();
  return adapter;
}
async function createAdaptiveRapierAdapter(config = {}) {
  const adapter = new RapierPhysicsAdapter({ ...config, mode: "adaptive" });
  await adapter.init();
  return adapter;
}

// hot/bronze/src/adapters/double-exponential-predictor.adapter.ts
var DEFAULT_CONFIG3 = {
  alpha: 0.5,
  // LaViola paper suggests tuning per application
  predictionMs: 50,
  clampOutput: true
};
var DoubleExponentialPredictor = class {
  constructor(config = {}) {
    __publicField(this, "config");
    // Single-smoothed statistics (Sp)
    __publicField(this, "Sp_x", 0.5);
    __publicField(this, "Sp_y", 0.5);
    // Double-smoothed statistics (Sp')
    __publicField(this, "Spp_x", 0.5);
    __publicField(this, "Spp_y", 0.5);
    // Velocity estimates (computed from slope)
    __publicField(this, "velocity", { x: 0, y: 0 });
    // Timestamp tracking
    __publicField(this, "lastTs", null);
    __publicField(this, "initialized", false);
    this.config = { ...DEFAULT_CONFIG3, ...config };
    if (this.config.alpha <= 0 || this.config.alpha >= 1) {
      throw new Error(`alpha must be in (0,1), got ${this.config.alpha}`);
    }
  }
  /**
   * Smooth and predict a sensor frame
   *
   * @param frame - Raw sensor input
   * @returns SmoothedFrame with prediction
   */
  smooth(frame) {
    if (!frame.indexTip) {
      return this.createPassthroughFrame(frame);
    }
    const x2 = frame.indexTip.x;
    const y2 = frame.indexTip.y;
    const \u03B1 = this.config.alpha;
    if (!this.initialized) {
      this.Sp_x = x2;
      this.Sp_y = y2;
      this.Spp_x = x2;
      this.Spp_y = y2;
      this.lastTs = frame.ts;
      this.initialized = true;
      return this.createFrame(frame, x2, y2, x2, y2);
    }
    const dt2 = this.lastTs !== null ? (frame.ts - this.lastTs) / 1e3 : 1 / 60;
    this.lastTs = frame.ts;
    this.Sp_x = \u03B1 * x2 + (1 - \u03B1) * this.Sp_x;
    this.Sp_y = \u03B1 * y2 + (1 - \u03B1) * this.Sp_y;
    this.Spp_x = \u03B1 * this.Sp_x + (1 - \u03B1) * this.Spp_x;
    this.Spp_y = \u03B1 * this.Sp_y + (1 - \u03B1) * this.Spp_y;
    const \u03B1Ratio = \u03B1 / (1 - \u03B1);
    const b1_x = \u03B1Ratio * (this.Sp_x - this.Spp_x);
    const b1_y = \u03B1Ratio * (this.Sp_y - this.Spp_y);
    const b0_x = 2 * this.Sp_x - this.Spp_x;
    const b0_y = 2 * this.Sp_y - this.Spp_y;
    this.velocity = {
      x: b1_x / dt2,
      y: b1_y / dt2
    };
    const \u03C4 = this.config.predictionMs / 1e3;
    let predicted_x = b0_x + b1_x * \u03C4;
    let predicted_y = b0_y + b1_y * \u03C4;
    if (this.config.clampOutput) {
      predicted_x = this.clamp(predicted_x, 0, 1);
      predicted_y = this.clamp(predicted_y, 0, 1);
    }
    const smoothed_x = this.config.clampOutput ? this.clamp(b0_x, 0, 1) : b0_x;
    const smoothed_y = this.config.clampOutput ? this.clamp(b0_y, 0, 1) : b0_y;
    return this.createFrame(frame, smoothed_x, smoothed_y, predicted_x, predicted_y);
  }
  /**
   * Reset predictor state
   */
  reset() {
    this.Sp_x = 0.5;
    this.Sp_y = 0.5;
    this.Spp_x = 0.5;
    this.Spp_y = 0.5;
    this.velocity = { x: 0, y: 0 };
    this.lastTs = null;
    this.initialized = false;
  }
  /**
   * SmootherPort compatibility - maps params to alpha/predictionMs
   * @param mincutoff - Maps to predictionMs (higher = shorter prediction)
   * @param beta - Maps to alpha (higher = more responsive)
   */
  setParams(mincutoff, beta) {
    this.config.predictionMs = Math.max(10, 110 - mincutoff * 10);
    this.config.alpha = Math.max(0.1, Math.min(0.9, 0.1 + beta * 0.8));
  }
  /**
   * Get current predictor state for debugging
   */
  getState() {
    return {
      Sp: { x: this.Sp_x, y: this.Sp_y },
      Spp: { x: this.Spp_x, y: this.Spp_y },
      velocity: { ...this.velocity },
      config: { ...this.config }
    };
  }
  /**
   * Calculate Time-to-Impact (TTI) to a target point
   *
   * @param targetX - Target X coordinate (0-1)
   * @param targetY - Target Y coordinate (0-1)
   * @returns TTI in ms, or Infinity if moving away
   */
  calculateTTI(targetX, targetY) {
    const posX = 2 * this.Sp_x - this.Spp_x;
    const posY = 2 * this.Sp_y - this.Spp_y;
    const dx = targetX - posX;
    const dy = targetY - posY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < TTI_DISTANCE_THRESHOLD) return 0;
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    if (speed < TTI_SPEED_THRESHOLD) return Number.POSITIVE_INFINITY;
    const dot = dx * this.velocity.x + dy * this.velocity.y;
    if (dot <= 0) return Number.POSITIVE_INFINITY;
    const velocityTowardTarget = dot / distance;
    return distance / velocityTowardTarget * 1e3;
  }
  /**
   * Get predicted trajectory points for visualization
   *
   * @param durationMs - How far to predict (ms)
   * @param steps - Number of points
   * @returns Array of predicted positions
   */
  getPredictedTrajectory(durationMs, steps) {
    const trajectory = [];
    const \u03B1Ratio = this.config.alpha / (1 - this.config.alpha);
    const b0_x = 2 * this.Sp_x - this.Spp_x;
    const b0_y = 2 * this.Sp_y - this.Spp_y;
    const b1_x = \u03B1Ratio * (this.Sp_x - this.Spp_x);
    const b1_y = \u03B1Ratio * (this.Sp_y - this.Spp_y);
    for (let i2 = 0; i2 <= steps; i2++) {
      const t2 = i2 / steps * durationMs;
      const \u03C4 = t2 / 1e3;
      let x2 = b0_x + b1_x * \u03C4;
      let y2 = b0_y + b1_y * \u03C4;
      if (this.config.clampOutput) {
        x2 = this.clamp(x2, 0, 1);
        y2 = this.clamp(y2, 0, 1);
      }
      trajectory.push({ x: x2, y: y2, t: t2 });
    }
    return trajectory;
  }
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  createPassthroughFrame(frame) {
    return {
      ts: frame.ts,
      handId: frame.handId,
      position: null,
      velocity: null,
      prediction: null,
      trackingOk: frame.trackingOk,
      label: frame.label,
      confidence: frame.confidence,
      palmFacing: frame.palmFacing
    };
  }
  createFrame(frame, smoothX, smoothY, predX, predY) {
    return {
      ts: frame.ts,
      handId: frame.handId,
      position: { x: smoothX, y: smoothY },
      velocity: { ...this.velocity },
      prediction: { x: predX, y: predY },
      trackingOk: frame.trackingOk,
      label: frame.label,
      confidence: frame.confidence,
      palmFacing: frame.palmFacing
    };
  }
};

// node_modules/xstate/dev/dist/xstate-dev.esm.js
function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
}
function getDevTools() {
  const w2 = getGlobal();
  if (w2.__xstate__) {
    return w2.__xstate__;
  }
  return void 0;
}
var devToolsAdapter = (service) => {
  if (typeof window === "undefined") {
    return;
  }
  const devTools = getDevTools();
  if (devTools) {
    devTools.register(service);
  }
};

// node_modules/xstate/dist/raise-da2ff7ca.esm.js
var Mailbox = class {
  constructor(_process) {
    this._process = _process;
    this._active = false;
    this._current = null;
    this._last = null;
  }
  start() {
    this._active = true;
    this.flush();
  }
  clear() {
    if (this._current) {
      this._current.next = null;
      this._last = this._current;
    }
  }
  enqueue(event) {
    const enqueued = {
      value: event,
      next: null
    };
    if (this._current) {
      this._last.next = enqueued;
      this._last = enqueued;
      return;
    }
    this._current = enqueued;
    this._last = enqueued;
    if (this._active) {
      this.flush();
    }
  }
  flush() {
    while (this._current) {
      const consumed = this._current;
      this._process(consumed.value);
      this._current = consumed.next;
    }
    this._last = null;
  }
};
var STATE_DELIMITER = ".";
var TARGETLESS_KEY = "";
var NULL_EVENT = "";
var STATE_IDENTIFIER = "#";
var WILDCARD = "*";
var XSTATE_INIT = "xstate.init";
var XSTATE_ERROR = "xstate.error";
var XSTATE_STOP = "xstate.stop";
function createAfterEvent(delayRef, id) {
  return {
    type: `xstate.after.${delayRef}.${id}`
  };
}
function createDoneStateEvent(id, output) {
  return {
    type: `xstate.done.state.${id}`,
    output
  };
}
function createDoneActorEvent(invokeId, output) {
  return {
    type: `xstate.done.actor.${invokeId}`,
    output,
    actorId: invokeId
  };
}
function createErrorActorEvent(id, error) {
  return {
    type: `xstate.error.actor.${id}`,
    error,
    actorId: id
  };
}
function createInitEvent(input) {
  return {
    type: XSTATE_INIT,
    input
  };
}
function reportUnhandledError(err) {
  setTimeout(() => {
    throw err;
  });
}
var symbolObservable = (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
function matchesState(parentStateId, childStateId) {
  const parentStateValue = toStateValue(parentStateId);
  const childStateValue = toStateValue(childStateId);
  if (typeof childStateValue === "string") {
    if (typeof parentStateValue === "string") {
      return childStateValue === parentStateValue;
    }
    return false;
  }
  if (typeof parentStateValue === "string") {
    return parentStateValue in childStateValue;
  }
  return Object.keys(parentStateValue).every((key) => {
    if (!(key in childStateValue)) {
      return false;
    }
    return matchesState(parentStateValue[key], childStateValue[key]);
  });
}
function toStatePath(stateId) {
  if (isArray(stateId)) {
    return stateId;
  }
  const result = [];
  let segment = "";
  for (let i2 = 0; i2 < stateId.length; i2++) {
    const char = stateId.charCodeAt(i2);
    switch (char) {
      // \
      case 92:
        segment += stateId[i2 + 1];
        i2++;
        continue;
      // .
      case 46:
        result.push(segment);
        segment = "";
        continue;
    }
    segment += stateId[i2];
  }
  result.push(segment);
  return result;
}
function toStateValue(stateValue) {
  if (isMachineSnapshot(stateValue)) {
    return stateValue.value;
  }
  if (typeof stateValue !== "string") {
    return stateValue;
  }
  const statePath = toStatePath(stateValue);
  return pathToStateValue(statePath);
}
function pathToStateValue(statePath) {
  if (statePath.length === 1) {
    return statePath[0];
  }
  const value = {};
  let marker = value;
  for (let i2 = 0; i2 < statePath.length - 1; i2++) {
    if (i2 === statePath.length - 2) {
      marker[statePath[i2]] = statePath[i2 + 1];
    } else {
      const previous = marker;
      marker = {};
      previous[statePath[i2]] = marker;
    }
  }
  return value;
}
function mapValues(collection, iteratee) {
  const result = {};
  const collectionKeys = Object.keys(collection);
  for (let i2 = 0; i2 < collectionKeys.length; i2++) {
    const key = collectionKeys[i2];
    result[key] = iteratee(collection[key], key, collection, i2);
  }
  return result;
}
function toArrayStrict(value) {
  if (isArray(value)) {
    return value;
  }
  return [value];
}
function toArray(value) {
  if (value === void 0) {
    return [];
  }
  return toArrayStrict(value);
}
function resolveOutput(mapper, context, event, self2) {
  if (typeof mapper === "function") {
    return mapper({
      context,
      event,
      self: self2
    });
  }
  return mapper;
}
function isArray(value) {
  return Array.isArray(value);
}
function isErrorActorEvent(event) {
  return event.type.startsWith("xstate.error.actor");
}
function toTransitionConfigArray(configLike) {
  return toArrayStrict(configLike).map((transitionLike) => {
    if (typeof transitionLike === "undefined" || typeof transitionLike === "string") {
      return {
        target: transitionLike
      };
    }
    return transitionLike;
  });
}
function normalizeTarget(target) {
  if (target === void 0 || target === TARGETLESS_KEY) {
    return void 0;
  }
  return toArray(target);
}
function toObserver(nextHandler, errorHandler, completionHandler) {
  const isObserver = typeof nextHandler === "object";
  const self2 = isObserver ? nextHandler : void 0;
  return {
    next: (isObserver ? nextHandler.next : nextHandler)?.bind(self2),
    error: (isObserver ? nextHandler.error : errorHandler)?.bind(self2),
    complete: (isObserver ? nextHandler.complete : completionHandler)?.bind(self2)
  };
}
function createInvokeId(stateNodeId, index) {
  return `${index}.${stateNodeId}`;
}
function resolveReferencedActor(machine, src) {
  const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/);
  if (!match) {
    return machine.implementations.actors[src];
  }
  const [, indexStr, nodeId] = match;
  const node = machine.getStateNodeById(nodeId);
  const invokeConfig = node.config.invoke;
  return (Array.isArray(invokeConfig) ? invokeConfig[indexStr] : invokeConfig).src;
}
function matchesEventDescriptor(eventType, descriptor) {
  if (descriptor === eventType) {
    return true;
  }
  if (descriptor === WILDCARD) {
    return true;
  }
  if (!descriptor.endsWith(".*")) {
    return false;
  }
  const partialEventTokens = descriptor.split(".");
  const eventTokens = eventType.split(".");
  for (let tokenIndex = 0; tokenIndex < partialEventTokens.length; tokenIndex++) {
    const partialEventToken = partialEventTokens[tokenIndex];
    const eventToken = eventTokens[tokenIndex];
    if (partialEventToken === "*") {
      const isLastToken = tokenIndex === partialEventTokens.length - 1;
      return isLastToken;
    }
    if (partialEventToken !== eventToken) {
      return false;
    }
  }
  return true;
}
function createScheduledEventId(actorRef, id) {
  return `${actorRef.sessionId}.${id}`;
}
var idCounter = 0;
function createSystem(rootActor, options) {
  const children = /* @__PURE__ */ new Map();
  const keyedActors = /* @__PURE__ */ new Map();
  const reverseKeyedActors = /* @__PURE__ */ new WeakMap();
  const inspectionObservers = /* @__PURE__ */ new Set();
  const timerMap = {};
  const {
    clock,
    logger
  } = options;
  const scheduler = {
    schedule: (source, target, event, delay, id = Math.random().toString(36).slice(2)) => {
      const scheduledEvent = {
        source,
        target,
        event,
        delay,
        id,
        startedAt: Date.now()
      };
      const scheduledEventId = createScheduledEventId(source, id);
      system._snapshot._scheduledEvents[scheduledEventId] = scheduledEvent;
      const timeout = clock.setTimeout(() => {
        delete timerMap[scheduledEventId];
        delete system._snapshot._scheduledEvents[scheduledEventId];
        system._relay(source, target, event);
      }, delay);
      timerMap[scheduledEventId] = timeout;
    },
    cancel: (source, id) => {
      const scheduledEventId = createScheduledEventId(source, id);
      const timeout = timerMap[scheduledEventId];
      delete timerMap[scheduledEventId];
      delete system._snapshot._scheduledEvents[scheduledEventId];
      if (timeout !== void 0) {
        clock.clearTimeout(timeout);
      }
    },
    cancelAll: (actorRef) => {
      for (const scheduledEventId in system._snapshot._scheduledEvents) {
        const scheduledEvent = system._snapshot._scheduledEvents[scheduledEventId];
        if (scheduledEvent.source === actorRef) {
          scheduler.cancel(actorRef, scheduledEvent.id);
        }
      }
    }
  };
  const sendInspectionEvent = (event) => {
    if (!inspectionObservers.size) {
      return;
    }
    const resolvedInspectionEvent = {
      ...event,
      rootId: rootActor.sessionId
    };
    inspectionObservers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
  };
  const system = {
    _snapshot: {
      _scheduledEvents: (options?.snapshot && options.snapshot.scheduler) ?? {}
    },
    _bookId: () => `x:${idCounter++}`,
    _register: (sessionId, actorRef) => {
      children.set(sessionId, actorRef);
      return sessionId;
    },
    _unregister: (actorRef) => {
      children.delete(actorRef.sessionId);
      const systemId = reverseKeyedActors.get(actorRef);
      if (systemId !== void 0) {
        keyedActors.delete(systemId);
        reverseKeyedActors.delete(actorRef);
      }
    },
    get: (systemId) => {
      return keyedActors.get(systemId);
    },
    getAll: () => {
      return Object.fromEntries(keyedActors.entries());
    },
    _set: (systemId, actorRef) => {
      const existing = keyedActors.get(systemId);
      if (existing && existing !== actorRef) {
        throw new Error(`Actor with system ID '${systemId}' already exists.`);
      }
      keyedActors.set(systemId, actorRef);
      reverseKeyedActors.set(actorRef, systemId);
    },
    inspect: (observerOrFn) => {
      const observer = toObserver(observerOrFn);
      inspectionObservers.add(observer);
      return {
        unsubscribe() {
          inspectionObservers.delete(observer);
        }
      };
    },
    _sendInspectionEvent: sendInspectionEvent,
    _relay: (source, target, event) => {
      system._sendInspectionEvent({
        type: "@xstate.event",
        sourceRef: source,
        actorRef: target,
        event
      });
      target._send(event);
    },
    scheduler,
    getSnapshot: () => {
      return {
        _scheduledEvents: {
          ...system._snapshot._scheduledEvents
        }
      };
    },
    start: () => {
      const scheduledEvents = system._snapshot._scheduledEvents;
      system._snapshot._scheduledEvents = {};
      for (const scheduledId in scheduledEvents) {
        const {
          source,
          target,
          event,
          delay,
          id
        } = scheduledEvents[scheduledId];
        scheduler.schedule(source, target, event, delay, id);
      }
    },
    _clock: clock,
    _logger: logger
  };
  return system;
}
var executingCustomAction = false;
var $$ACTOR_TYPE = 1;
var ProcessingStatus = /* @__PURE__ */ (function(ProcessingStatus2) {
  ProcessingStatus2[ProcessingStatus2["NotStarted"] = 0] = "NotStarted";
  ProcessingStatus2[ProcessingStatus2["Running"] = 1] = "Running";
  ProcessingStatus2[ProcessingStatus2["Stopped"] = 2] = "Stopped";
  return ProcessingStatus2;
})({});
var defaultOptions = {
  clock: {
    setTimeout: (fn2, ms2) => {
      return setTimeout(fn2, ms2);
    },
    clearTimeout: (id) => {
      return clearTimeout(id);
    }
  },
  logger: console.log.bind(console),
  devTools: false
};
var Actor = class {
  /**
   * Creates a new actor instance for the given logic with the provided options,
   * if any.
   *
   * @param logic The logic to create an actor from
   * @param options Actor options
   */
  constructor(logic, options) {
    this.logic = logic;
    this._snapshot = void 0;
    this.clock = void 0;
    this.options = void 0;
    this.id = void 0;
    this.mailbox = new Mailbox(this._process.bind(this));
    this.observers = /* @__PURE__ */ new Set();
    this.eventListeners = /* @__PURE__ */ new Map();
    this.logger = void 0;
    this._processingStatus = ProcessingStatus.NotStarted;
    this._parent = void 0;
    this._syncSnapshot = void 0;
    this.ref = void 0;
    this._actorScope = void 0;
    this.systemId = void 0;
    this.sessionId = void 0;
    this.system = void 0;
    this._doneEvent = void 0;
    this.src = void 0;
    this._deferred = [];
    const resolvedOptions = {
      ...defaultOptions,
      ...options
    };
    const {
      clock,
      logger,
      parent,
      syncSnapshot,
      id,
      systemId,
      inspect
    } = resolvedOptions;
    this.system = parent ? parent.system : createSystem(this, {
      clock,
      logger
    });
    if (inspect && !parent) {
      this.system.inspect(toObserver(inspect));
    }
    this.sessionId = this.system._bookId();
    this.id = id ?? this.sessionId;
    this.logger = options?.logger ?? this.system._logger;
    this.clock = options?.clock ?? this.system._clock;
    this._parent = parent;
    this._syncSnapshot = syncSnapshot;
    this.options = resolvedOptions;
    this.src = resolvedOptions.src ?? logic;
    this.ref = this;
    this._actorScope = {
      self: this,
      id: this.id,
      sessionId: this.sessionId,
      logger: this.logger,
      defer: (fn2) => {
        this._deferred.push(fn2);
      },
      system: this.system,
      stopChild: (child) => {
        if (child._parent !== this) {
          throw new Error(`Cannot stop child actor ${child.id} of ${this.id} because it is not a child`);
        }
        child._stop();
      },
      emit: (emittedEvent) => {
        const listeners = this.eventListeners.get(emittedEvent.type);
        const wildcardListener = this.eventListeners.get("*");
        if (!listeners && !wildcardListener) {
          return;
        }
        const allListeners = [...listeners ? listeners.values() : [], ...wildcardListener ? wildcardListener.values() : []];
        for (const handler of allListeners) {
          try {
            handler(emittedEvent);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
      },
      actionExecutor: (action) => {
        const exec = () => {
          this._actorScope.system._sendInspectionEvent({
            type: "@xstate.action",
            actorRef: this,
            action: {
              type: action.type,
              params: action.params
            }
          });
          if (!action.exec) {
            return;
          }
          const saveExecutingCustomAction = executingCustomAction;
          try {
            executingCustomAction = true;
            action.exec(action.info, action.params);
          } finally {
            executingCustomAction = saveExecutingCustomAction;
          }
        };
        if (this._processingStatus === ProcessingStatus.Running) {
          exec();
        } else {
          this._deferred.push(exec);
        }
      }
    };
    this.send = this.send.bind(this);
    this.system._sendInspectionEvent({
      type: "@xstate.actor",
      actorRef: this
    });
    if (systemId) {
      this.systemId = systemId;
      this.system._set(systemId, this);
    }
    this._initState(options?.snapshot ?? options?.state);
    if (systemId && this._snapshot.status !== "active") {
      this.system._unregister(this);
    }
  }
  _initState(persistedState) {
    try {
      this._snapshot = persistedState ? this.logic.restoreSnapshot ? this.logic.restoreSnapshot(persistedState, this._actorScope) : persistedState : this.logic.getInitialSnapshot(this._actorScope, this.options?.input);
    } catch (err) {
      this._snapshot = {
        status: "error",
        output: void 0,
        error: err
      };
    }
  }
  update(snapshot, event) {
    this._snapshot = snapshot;
    let deferredFn;
    while (deferredFn = this._deferred.shift()) {
      try {
        deferredFn();
      } catch (err) {
        this._deferred.length = 0;
        this._snapshot = {
          ...snapshot,
          status: "error",
          error: err
        };
      }
    }
    switch (this._snapshot.status) {
      case "active":
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        break;
      case "done":
        for (const observer of this.observers) {
          try {
            observer.next?.(snapshot);
          } catch (err) {
            reportUnhandledError(err);
          }
        }
        this._stopProcedure();
        this._complete();
        this._doneEvent = createDoneActorEvent(this.id, this._snapshot.output);
        if (this._parent) {
          this.system._relay(this, this._parent, this._doneEvent);
        }
        break;
      case "error":
        this._error(this._snapshot.error);
        break;
    }
    this.system._sendInspectionEvent({
      type: "@xstate.snapshot",
      actorRef: this,
      event,
      snapshot
    });
  }
  /**
   * Subscribe an observer to an actor’s snapshot values.
   *
   * @remarks
   * The observer will receive the actor’s snapshot value when it is emitted.
   * The observer can be:
   *
   * - A plain function that receives the latest snapshot, or
   * - An observer object whose `.next(snapshot)` method receives the latest
   *   snapshot
   *
   * @example
   *
   * ```ts
   * // Observer as a plain function
   * const subscription = actor.subscribe((snapshot) => {
   *   console.log(snapshot);
   * });
   * ```
   *
   * @example
   *
   * ```ts
   * // Observer as an object
   * const subscription = actor.subscribe({
   *   next(snapshot) {
   *     console.log(snapshot);
   *   },
   *   error(err) {
   *     // ...
   *   },
   *   complete() {
   *     // ...
   *   }
   * });
   * ```
   *
   * The return value of `actor.subscribe(observer)` is a subscription object
   * that has an `.unsubscribe()` method. You can call
   * `subscription.unsubscribe()` to unsubscribe the observer:
   *
   * @example
   *
   * ```ts
   * const subscription = actor.subscribe((snapshot) => {
   *   // ...
   * });
   *
   * // Unsubscribe the observer
   * subscription.unsubscribe();
   * ```
   *
   * When the actor is stopped, all of its observers will automatically be
   * unsubscribed.
   *
   * @param observer - Either a plain function that receives the latest
   *   snapshot, or an observer object whose `.next(snapshot)` method receives
   *   the latest snapshot
   */
  subscribe(nextListenerOrObserver, errorListener, completeListener) {
    const observer = toObserver(nextListenerOrObserver, errorListener, completeListener);
    if (this._processingStatus !== ProcessingStatus.Stopped) {
      this.observers.add(observer);
    } else {
      switch (this._snapshot.status) {
        case "done":
          try {
            observer.complete?.();
          } catch (err) {
            reportUnhandledError(err);
          }
          break;
        case "error": {
          const err = this._snapshot.error;
          if (!observer.error) {
            reportUnhandledError(err);
          } else {
            try {
              observer.error(err);
            } catch (err2) {
              reportUnhandledError(err2);
            }
          }
          break;
        }
      }
    }
    return {
      unsubscribe: () => {
        this.observers.delete(observer);
      }
    };
  }
  on(type, handler) {
    let listeners = this.eventListeners.get(type);
    if (!listeners) {
      listeners = /* @__PURE__ */ new Set();
      this.eventListeners.set(type, listeners);
    }
    const wrappedHandler = handler.bind(void 0);
    listeners.add(wrappedHandler);
    return {
      unsubscribe: () => {
        listeners.delete(wrappedHandler);
      }
    };
  }
  /** Starts the Actor from the initial state */
  start() {
    if (this._processingStatus === ProcessingStatus.Running) {
      return this;
    }
    if (this._syncSnapshot) {
      this.subscribe({
        next: (snapshot) => {
          if (snapshot.status === "active") {
            this.system._relay(this, this._parent, {
              type: `xstate.snapshot.${this.id}`,
              snapshot
            });
          }
        },
        error: () => {
        }
      });
    }
    this.system._register(this.sessionId, this);
    if (this.systemId) {
      this.system._set(this.systemId, this);
    }
    this._processingStatus = ProcessingStatus.Running;
    const initEvent = createInitEvent(this.options.input);
    this.system._sendInspectionEvent({
      type: "@xstate.event",
      sourceRef: this._parent,
      actorRef: this,
      event: initEvent
    });
    const status = this._snapshot.status;
    switch (status) {
      case "done":
        this.update(this._snapshot, initEvent);
        return this;
      case "error":
        this._error(this._snapshot.error);
        return this;
    }
    if (!this._parent) {
      this.system.start();
    }
    if (this.logic.start) {
      try {
        this.logic.start(this._snapshot, this._actorScope);
      } catch (err) {
        this._snapshot = {
          ...this._snapshot,
          status: "error",
          error: err
        };
        this._error(err);
        return this;
      }
    }
    this.update(this._snapshot, initEvent);
    if (this.options.devTools) {
      this.attachDevTools();
    }
    this.mailbox.start();
    return this;
  }
  _process(event) {
    let nextState;
    let caughtError;
    try {
      nextState = this.logic.transition(this._snapshot, event, this._actorScope);
    } catch (err) {
      caughtError = {
        err
      };
    }
    if (caughtError) {
      const {
        err
      } = caughtError;
      this._snapshot = {
        ...this._snapshot,
        status: "error",
        error: err
      };
      this._error(err);
      return;
    }
    this.update(nextState, event);
    if (event.type === XSTATE_STOP) {
      this._stopProcedure();
      this._complete();
    }
  }
  _stop() {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return this;
    }
    this.mailbox.clear();
    if (this._processingStatus === ProcessingStatus.NotStarted) {
      this._processingStatus = ProcessingStatus.Stopped;
      return this;
    }
    this.mailbox.enqueue({
      type: XSTATE_STOP
    });
    return this;
  }
  /** Stops the Actor and unsubscribe all listeners. */
  stop() {
    if (this._parent) {
      throw new Error("A non-root actor cannot be stopped directly.");
    }
    return this._stop();
  }
  _complete() {
    for (const observer of this.observers) {
      try {
        observer.complete?.();
      } catch (err) {
        reportUnhandledError(err);
      }
    }
    this.observers.clear();
  }
  _reportError(err) {
    if (!this.observers.size) {
      if (!this._parent) {
        reportUnhandledError(err);
      }
      return;
    }
    let reportError = false;
    for (const observer of this.observers) {
      const errorListener = observer.error;
      reportError || (reportError = !errorListener);
      try {
        errorListener?.(err);
      } catch (err2) {
        reportUnhandledError(err2);
      }
    }
    this.observers.clear();
    if (reportError) {
      reportUnhandledError(err);
    }
  }
  _error(err) {
    this._stopProcedure();
    this._reportError(err);
    if (this._parent) {
      this.system._relay(this, this._parent, createErrorActorEvent(this.id, err));
    }
  }
  // TODO: atm children don't belong entirely to the actor so
  // in a way - it's not even super aware of them
  // so we can't stop them from here but we really should!
  // right now, they are being stopped within the machine's transition
  // but that could throw and leave us with "orphaned" active actors
  _stopProcedure() {
    if (this._processingStatus !== ProcessingStatus.Running) {
      return this;
    }
    this.system.scheduler.cancelAll(this);
    this.mailbox.clear();
    this.mailbox = new Mailbox(this._process.bind(this));
    this._processingStatus = ProcessingStatus.Stopped;
    this.system._unregister(this);
    return this;
  }
  /** @internal */
  _send(event) {
    if (this._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    this.mailbox.enqueue(event);
  }
  /**
   * Sends an event to the running Actor to trigger a transition.
   *
   * @param event The event to send
   */
  send(event) {
    this.system._relay(void 0, this, event);
  }
  attachDevTools() {
    const {
      devTools
    } = this.options;
    if (devTools) {
      const resolvedDevToolsAdapter = typeof devTools === "function" ? devTools : devToolsAdapter;
      resolvedDevToolsAdapter(this);
    }
  }
  toJSON() {
    return {
      xstate$$type: $$ACTOR_TYPE,
      id: this.id
    };
  }
  /**
   * Obtain the internal state of the actor, which can be persisted.
   *
   * @remarks
   * The internal state can be persisted from any actor, not only machines.
   *
   * Note that the persisted state is not the same as the snapshot from
   * {@link Actor.getSnapshot}. Persisted state represents the internal state of
   * the actor, while snapshots represent the actor's last emitted value.
   *
   * Can be restored with {@link ActorOptions.state}
   * @see https://stately.ai/docs/persistence
   */
  getPersistedSnapshot(options) {
    return this.logic.getPersistedSnapshot(this._snapshot, options);
  }
  [symbolObservable]() {
    return this;
  }
  /**
   * Read an actor’s snapshot synchronously.
   *
   * @remarks
   * The snapshot represent an actor's last emitted value.
   *
   * When an actor receives an event, its internal state may change. An actor
   * may emit a snapshot when a state transition occurs.
   *
   * Note that some actors, such as callback actors generated with
   * `fromCallback`, will not emit snapshots.
   * @see {@link Actor.subscribe} to subscribe to an actor’s snapshot values.
   * @see {@link Actor.getPersistedSnapshot} to persist the internal state of an actor (which is more than just a snapshot).
   */
  getSnapshot() {
    return this._snapshot;
  }
};
function createActor(logic, ...[options]) {
  return new Actor(logic, options);
}
function resolveCancel(_2, snapshot, actionArgs, actionParams, {
  sendId
}) {
  const resolvedSendId = typeof sendId === "function" ? sendId(actionArgs, actionParams) : sendId;
  return [snapshot, {
    sendId: resolvedSendId
  }, void 0];
}
function executeCancel(actorScope, params) {
  actorScope.defer(() => {
    actorScope.system.scheduler.cancel(actorScope.self, params.sendId);
  });
}
function cancel(sendId) {
  function cancel2(_args, _params) {
  }
  cancel2.type = "xstate.cancel";
  cancel2.sendId = sendId;
  cancel2.resolve = resolveCancel;
  cancel2.execute = executeCancel;
  return cancel2;
}
function resolveSpawn(actorScope, snapshot, actionArgs, _actionParams, {
  id,
  systemId,
  src,
  input,
  syncSnapshot
}) {
  const logic = typeof src === "string" ? resolveReferencedActor(snapshot.machine, src) : src;
  const resolvedId = typeof id === "function" ? id(actionArgs) : id;
  let actorRef;
  let resolvedInput = void 0;
  if (logic) {
    resolvedInput = typeof input === "function" ? input({
      context: snapshot.context,
      event: actionArgs.event,
      self: actorScope.self
    }) : input;
    actorRef = createActor(logic, {
      id: resolvedId,
      src,
      parent: actorScope.self,
      syncSnapshot,
      systemId,
      input: resolvedInput
    });
  }
  return [cloneMachineSnapshot(snapshot, {
    children: {
      ...snapshot.children,
      [resolvedId]: actorRef
    }
  }), {
    id,
    systemId,
    actorRef,
    src,
    input: resolvedInput
  }, void 0];
}
function executeSpawn(actorScope, {
  actorRef
}) {
  if (!actorRef) {
    return;
  }
  actorScope.defer(() => {
    if (actorRef._processingStatus === ProcessingStatus.Stopped) {
      return;
    }
    actorRef.start();
  });
}
function spawnChild(...[src, {
  id,
  systemId,
  input,
  syncSnapshot = false
} = {}]) {
  function spawnChild2(_args, _params) {
  }
  spawnChild2.type = "xstate.spawnChild";
  spawnChild2.id = id;
  spawnChild2.systemId = systemId;
  spawnChild2.src = src;
  spawnChild2.input = input;
  spawnChild2.syncSnapshot = syncSnapshot;
  spawnChild2.resolve = resolveSpawn;
  spawnChild2.execute = executeSpawn;
  return spawnChild2;
}
function resolveStop(_2, snapshot, args, actionParams, {
  actorRef
}) {
  const actorRefOrString = typeof actorRef === "function" ? actorRef(args, actionParams) : actorRef;
  const resolvedActorRef = typeof actorRefOrString === "string" ? snapshot.children[actorRefOrString] : actorRefOrString;
  let children = snapshot.children;
  if (resolvedActorRef) {
    children = {
      ...children
    };
    delete children[resolvedActorRef.id];
  }
  return [cloneMachineSnapshot(snapshot, {
    children
  }), resolvedActorRef, void 0];
}
function executeStop(actorScope, actorRef) {
  if (!actorRef) {
    return;
  }
  actorScope.system._unregister(actorRef);
  if (actorRef._processingStatus !== ProcessingStatus.Running) {
    actorScope.stopChild(actorRef);
    return;
  }
  actorScope.defer(() => {
    actorScope.stopChild(actorRef);
  });
}
function stopChild(actorRef) {
  function stop2(_args, _params) {
  }
  stop2.type = "xstate.stopChild";
  stop2.actorRef = actorRef;
  stop2.resolve = resolveStop;
  stop2.execute = executeStop;
  return stop2;
}
function evaluateGuard(guard, context, event, snapshot) {
  const {
    machine
  } = snapshot;
  const isInline = typeof guard === "function";
  const resolved = isInline ? guard : machine.implementations.guards[typeof guard === "string" ? guard : guard.type];
  if (!isInline && !resolved) {
    throw new Error(`Guard '${typeof guard === "string" ? guard : guard.type}' is not implemented.'.`);
  }
  if (typeof resolved !== "function") {
    return evaluateGuard(resolved, context, event, snapshot);
  }
  const guardArgs = {
    context,
    event
  };
  const guardParams = isInline || typeof guard === "string" ? void 0 : "params" in guard ? typeof guard.params === "function" ? guard.params({
    context,
    event
  }) : guard.params : void 0;
  if (!("check" in resolved)) {
    return resolved(guardArgs, guardParams);
  }
  const builtinGuard = resolved;
  return builtinGuard.check(
    snapshot,
    guardArgs,
    resolved
    // this holds all params
  );
}
var isAtomicStateNode = (stateNode) => stateNode.type === "atomic" || stateNode.type === "final";
function getChildren(stateNode) {
  return Object.values(stateNode.states).filter((sn2) => sn2.type !== "history");
}
function getProperAncestors(stateNode, toStateNode) {
  const ancestors = [];
  if (toStateNode === stateNode) {
    return ancestors;
  }
  let m2 = stateNode.parent;
  while (m2 && m2 !== toStateNode) {
    ancestors.push(m2);
    m2 = m2.parent;
  }
  return ancestors;
}
function getAllStateNodes(stateNodes) {
  const nodeSet = new Set(stateNodes);
  const adjList = getAdjList(nodeSet);
  for (const s2 of nodeSet) {
    if (s2.type === "compound" && (!adjList.get(s2) || !adjList.get(s2).length)) {
      getInitialStateNodesWithTheirAncestors(s2).forEach((sn2) => nodeSet.add(sn2));
    } else {
      if (s2.type === "parallel") {
        for (const child of getChildren(s2)) {
          if (child.type === "history") {
            continue;
          }
          if (!nodeSet.has(child)) {
            const initialStates = getInitialStateNodesWithTheirAncestors(child);
            for (const initialStateNode of initialStates) {
              nodeSet.add(initialStateNode);
            }
          }
        }
      }
    }
  }
  for (const s2 of nodeSet) {
    let m2 = s2.parent;
    while (m2) {
      nodeSet.add(m2);
      m2 = m2.parent;
    }
  }
  return nodeSet;
}
function getValueFromAdj(baseNode, adjList) {
  const childStateNodes = adjList.get(baseNode);
  if (!childStateNodes) {
    return {};
  }
  if (baseNode.type === "compound") {
    const childStateNode = childStateNodes[0];
    if (childStateNode) {
      if (isAtomicStateNode(childStateNode)) {
        return childStateNode.key;
      }
    } else {
      return {};
    }
  }
  const stateValue = {};
  for (const childStateNode of childStateNodes) {
    stateValue[childStateNode.key] = getValueFromAdj(childStateNode, adjList);
  }
  return stateValue;
}
function getAdjList(stateNodes) {
  const adjList = /* @__PURE__ */ new Map();
  for (const s2 of stateNodes) {
    if (!adjList.has(s2)) {
      adjList.set(s2, []);
    }
    if (s2.parent) {
      if (!adjList.has(s2.parent)) {
        adjList.set(s2.parent, []);
      }
      adjList.get(s2.parent).push(s2);
    }
  }
  return adjList;
}
function getStateValue(rootNode, stateNodes) {
  const config = getAllStateNodes(stateNodes);
  return getValueFromAdj(rootNode, getAdjList(config));
}
function isInFinalState(stateNodeSet, stateNode) {
  if (stateNode.type === "compound") {
    return getChildren(stateNode).some((s2) => s2.type === "final" && stateNodeSet.has(s2));
  }
  if (stateNode.type === "parallel") {
    return getChildren(stateNode).every((sn2) => isInFinalState(stateNodeSet, sn2));
  }
  return stateNode.type === "final";
}
var isStateId = (str) => str[0] === STATE_IDENTIFIER;
function getCandidates(stateNode, receivedEventType) {
  const candidates = stateNode.transitions.get(receivedEventType) || [...stateNode.transitions.keys()].filter((eventDescriptor) => matchesEventDescriptor(receivedEventType, eventDescriptor)).sort((a2, b2) => b2.length - a2.length).flatMap((key) => stateNode.transitions.get(key));
  return candidates;
}
function getDelayedTransitions(stateNode) {
  const afterConfig = stateNode.config.after;
  if (!afterConfig) {
    return [];
  }
  const mutateEntryExit = (delay) => {
    const afterEvent = createAfterEvent(delay, stateNode.id);
    const eventType = afterEvent.type;
    stateNode.entry.push(raise(afterEvent, {
      id: eventType,
      delay
    }));
    stateNode.exit.push(cancel(eventType));
    return eventType;
  };
  const delayedTransitions = Object.keys(afterConfig).flatMap((delay) => {
    const configTransition = afterConfig[delay];
    const resolvedTransition = typeof configTransition === "string" ? {
      target: configTransition
    } : configTransition;
    const resolvedDelay = Number.isNaN(+delay) ? delay : +delay;
    const eventType = mutateEntryExit(resolvedDelay);
    return toArray(resolvedTransition).map((transition) => ({
      ...transition,
      event: eventType,
      delay: resolvedDelay
    }));
  });
  return delayedTransitions.map((delayedTransition) => {
    const {
      delay
    } = delayedTransition;
    return {
      ...formatTransition(stateNode, delayedTransition.event, delayedTransition),
      delay
    };
  });
}
function formatTransition(stateNode, descriptor, transitionConfig) {
  const normalizedTarget = normalizeTarget(transitionConfig.target);
  const reenter = transitionConfig.reenter ?? false;
  const target = resolveTarget(stateNode, normalizedTarget);
  const transition = {
    ...transitionConfig,
    actions: toArray(transitionConfig.actions),
    guard: transitionConfig.guard,
    target,
    source: stateNode,
    reenter,
    eventType: descriptor,
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: target ? target.map((t2) => `#${t2.id}`) : void 0
    })
  };
  return transition;
}
function formatTransitions(stateNode) {
  const transitions = /* @__PURE__ */ new Map();
  if (stateNode.config.on) {
    for (const descriptor of Object.keys(stateNode.config.on)) {
      if (descriptor === NULL_EVENT) {
        throw new Error('Null events ("") cannot be specified as a transition key. Use `always: { ... }` instead.');
      }
      const transitionsConfig = stateNode.config.on[descriptor];
      transitions.set(descriptor, toTransitionConfigArray(transitionsConfig).map((t2) => formatTransition(stateNode, descriptor, t2)));
    }
  }
  if (stateNode.config.onDone) {
    const descriptor = `xstate.done.state.${stateNode.id}`;
    transitions.set(descriptor, toTransitionConfigArray(stateNode.config.onDone).map((t2) => formatTransition(stateNode, descriptor, t2)));
  }
  for (const invokeDef of stateNode.invoke) {
    if (invokeDef.onDone) {
      const descriptor = `xstate.done.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onDone).map((t2) => formatTransition(stateNode, descriptor, t2)));
    }
    if (invokeDef.onError) {
      const descriptor = `xstate.error.actor.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onError).map((t2) => formatTransition(stateNode, descriptor, t2)));
    }
    if (invokeDef.onSnapshot) {
      const descriptor = `xstate.snapshot.${invokeDef.id}`;
      transitions.set(descriptor, toTransitionConfigArray(invokeDef.onSnapshot).map((t2) => formatTransition(stateNode, descriptor, t2)));
    }
  }
  for (const delayedTransition of stateNode.after) {
    let existing = transitions.get(delayedTransition.eventType);
    if (!existing) {
      existing = [];
      transitions.set(delayedTransition.eventType, existing);
    }
    existing.push(delayedTransition);
  }
  return transitions;
}
function formatInitialTransition(stateNode, _target) {
  const resolvedTarget = typeof _target === "string" ? stateNode.states[_target] : _target ? stateNode.states[_target.target] : void 0;
  if (!resolvedTarget && _target) {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
      `Initial state node "${_target}" not found on parent state node #${stateNode.id}`
    );
  }
  const transition = {
    source: stateNode,
    actions: !_target || typeof _target === "string" ? [] : toArray(_target.actions),
    eventType: null,
    reenter: false,
    target: resolvedTarget ? [resolvedTarget] : [],
    toJSON: () => ({
      ...transition,
      source: `#${stateNode.id}`,
      target: resolvedTarget ? [`#${resolvedTarget.id}`] : []
    })
  };
  return transition;
}
function resolveTarget(stateNode, targets) {
  if (targets === void 0) {
    return void 0;
  }
  return targets.map((target) => {
    if (typeof target !== "string") {
      return target;
    }
    if (isStateId(target)) {
      return stateNode.machine.getStateNodeById(target);
    }
    const isInternalTarget = target[0] === STATE_DELIMITER;
    if (isInternalTarget && !stateNode.parent) {
      return getStateNodeByPath(stateNode, target.slice(1));
    }
    const resolvedTarget = isInternalTarget ? stateNode.key + target : target;
    if (stateNode.parent) {
      try {
        const targetStateNode = getStateNodeByPath(stateNode.parent, resolvedTarget);
        return targetStateNode;
      } catch (err) {
        throw new Error(`Invalid transition definition for state node '${stateNode.id}':
${err.message}`);
      }
    } else {
      throw new Error(`Invalid target: "${target}" is not a valid target from the root node. Did you mean ".${target}"?`);
    }
  });
}
function resolveHistoryDefaultTransition(stateNode) {
  const normalizedTarget = normalizeTarget(stateNode.config.target);
  if (!normalizedTarget) {
    return stateNode.parent.initial;
  }
  return {
    target: normalizedTarget.map((t2) => typeof t2 === "string" ? getStateNodeByPath(stateNode.parent, t2) : t2)
  };
}
function isHistoryNode(stateNode) {
  return stateNode.type === "history";
}
function getInitialStateNodesWithTheirAncestors(stateNode) {
  const states = getInitialStateNodes(stateNode);
  for (const initialState of states) {
    for (const ancestor of getProperAncestors(initialState, stateNode)) {
      states.add(ancestor);
    }
  }
  return states;
}
function getInitialStateNodes(stateNode) {
  const set = /* @__PURE__ */ new Set();
  function iter(descStateNode) {
    if (set.has(descStateNode)) {
      return;
    }
    set.add(descStateNode);
    if (descStateNode.type === "compound") {
      iter(descStateNode.initial.target[0]);
    } else if (descStateNode.type === "parallel") {
      for (const child of getChildren(descStateNode)) {
        iter(child);
      }
    }
  }
  iter(stateNode);
  return set;
}
function getStateNode(stateNode, stateKey) {
  if (isStateId(stateKey)) {
    return stateNode.machine.getStateNodeById(stateKey);
  }
  if (!stateNode.states) {
    throw new Error(`Unable to retrieve child state '${stateKey}' from '${stateNode.id}'; no child states exist.`);
  }
  const result = stateNode.states[stateKey];
  if (!result) {
    throw new Error(`Child state '${stateKey}' does not exist on '${stateNode.id}'`);
  }
  return result;
}
function getStateNodeByPath(stateNode, statePath) {
  if (typeof statePath === "string" && isStateId(statePath)) {
    try {
      return stateNode.machine.getStateNodeById(statePath);
    } catch {
    }
  }
  const arrayStatePath = toStatePath(statePath).slice();
  let currentStateNode = stateNode;
  while (arrayStatePath.length) {
    const key = arrayStatePath.shift();
    if (!key.length) {
      break;
    }
    currentStateNode = getStateNode(currentStateNode, key);
  }
  return currentStateNode;
}
function getStateNodes(stateNode, stateValue) {
  if (typeof stateValue === "string") {
    const childStateNode = stateNode.states[stateValue];
    if (!childStateNode) {
      throw new Error(`State '${stateValue}' does not exist on '${stateNode.id}'`);
    }
    return [stateNode, childStateNode];
  }
  const childStateKeys = Object.keys(stateValue);
  const childStateNodes = childStateKeys.map((subStateKey) => getStateNode(stateNode, subStateKey)).filter(Boolean);
  return [stateNode.machine.root, stateNode].concat(childStateNodes, childStateKeys.reduce((allSubStateNodes, subStateKey) => {
    const subStateNode = getStateNode(stateNode, subStateKey);
    if (!subStateNode) {
      return allSubStateNodes;
    }
    const subStateNodes = getStateNodes(subStateNode, stateValue[subStateKey]);
    return allSubStateNodes.concat(subStateNodes);
  }, []));
}
function transitionAtomicNode(stateNode, stateValue, snapshot, event) {
  const childStateNode = getStateNode(stateNode, stateValue);
  const next = childStateNode.next(snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionCompoundNode(stateNode, stateValue, snapshot, event) {
  const subStateKeys = Object.keys(stateValue);
  const childStateNode = getStateNode(stateNode, subStateKeys[0]);
  const next = transitionNode(childStateNode, stateValue[subStateKeys[0]], snapshot, event);
  if (!next || !next.length) {
    return stateNode.next(snapshot, event);
  }
  return next;
}
function transitionParallelNode(stateNode, stateValue, snapshot, event) {
  const allInnerTransitions = [];
  for (const subStateKey of Object.keys(stateValue)) {
    const subStateValue = stateValue[subStateKey];
    if (!subStateValue) {
      continue;
    }
    const subStateNode = getStateNode(stateNode, subStateKey);
    const innerTransitions = transitionNode(subStateNode, subStateValue, snapshot, event);
    if (innerTransitions) {
      allInnerTransitions.push(...innerTransitions);
    }
  }
  if (!allInnerTransitions.length) {
    return stateNode.next(snapshot, event);
  }
  return allInnerTransitions;
}
function transitionNode(stateNode, stateValue, snapshot, event) {
  if (typeof stateValue === "string") {
    return transitionAtomicNode(stateNode, stateValue, snapshot, event);
  }
  if (Object.keys(stateValue).length === 1) {
    return transitionCompoundNode(stateNode, stateValue, snapshot, event);
  }
  return transitionParallelNode(stateNode, stateValue, snapshot, event);
}
function getHistoryNodes(stateNode) {
  return Object.keys(stateNode.states).map((key) => stateNode.states[key]).filter((sn2) => sn2.type === "history");
}
function isDescendant(childStateNode, parentStateNode) {
  let marker = childStateNode;
  while (marker.parent && marker.parent !== parentStateNode) {
    marker = marker.parent;
  }
  return marker.parent === parentStateNode;
}
function hasIntersection(s1, s2) {
  const set1 = new Set(s1);
  const set2 = new Set(s2);
  for (const item of set1) {
    if (set2.has(item)) {
      return true;
    }
  }
  for (const item of set2) {
    if (set1.has(item)) {
      return true;
    }
  }
  return false;
}
function removeConflictingTransitions(enabledTransitions, stateNodeSet, historyValue) {
  const filteredTransitions = /* @__PURE__ */ new Set();
  for (const t1 of enabledTransitions) {
    let t1Preempted = false;
    const transitionsToRemove = /* @__PURE__ */ new Set();
    for (const t2 of filteredTransitions) {
      if (hasIntersection(computeExitSet([t1], stateNodeSet, historyValue), computeExitSet([t2], stateNodeSet, historyValue))) {
        if (isDescendant(t1.source, t2.source)) {
          transitionsToRemove.add(t2);
        } else {
          t1Preempted = true;
          break;
        }
      }
    }
    if (!t1Preempted) {
      for (const t3 of transitionsToRemove) {
        filteredTransitions.delete(t3);
      }
      filteredTransitions.add(t1);
    }
  }
  return Array.from(filteredTransitions);
}
function findLeastCommonAncestor(stateNodes) {
  const [head, ...tail] = stateNodes;
  for (const ancestor of getProperAncestors(head, void 0)) {
    if (tail.every((sn2) => isDescendant(sn2, ancestor))) {
      return ancestor;
    }
  }
}
function getEffectiveTargetStates(transition, historyValue) {
  if (!transition.target) {
    return [];
  }
  const targets = /* @__PURE__ */ new Set();
  for (const targetNode of transition.target) {
    if (isHistoryNode(targetNode)) {
      if (historyValue[targetNode.id]) {
        for (const node of historyValue[targetNode.id]) {
          targets.add(node);
        }
      } else {
        for (const node of getEffectiveTargetStates(resolveHistoryDefaultTransition(targetNode), historyValue)) {
          targets.add(node);
        }
      }
    } else {
      targets.add(targetNode);
    }
  }
  return [...targets];
}
function getTransitionDomain(transition, historyValue) {
  const targetStates = getEffectiveTargetStates(transition, historyValue);
  if (!targetStates) {
    return;
  }
  if (!transition.reenter && targetStates.every((target) => target === transition.source || isDescendant(target, transition.source))) {
    return transition.source;
  }
  const lca = findLeastCommonAncestor(targetStates.concat(transition.source));
  if (lca) {
    return lca;
  }
  if (transition.reenter) {
    return;
  }
  return transition.source.machine.root;
}
function computeExitSet(transitions, stateNodeSet, historyValue) {
  const statesToExit = /* @__PURE__ */ new Set();
  for (const t2 of transitions) {
    if (t2.target?.length) {
      const domain = getTransitionDomain(t2, historyValue);
      if (t2.reenter && t2.source === domain) {
        statesToExit.add(domain);
      }
      for (const stateNode of stateNodeSet) {
        if (isDescendant(stateNode, domain)) {
          statesToExit.add(stateNode);
        }
      }
    }
  }
  return [...statesToExit];
}
function areStateNodeCollectionsEqual(prevStateNodes, nextStateNodeSet) {
  if (prevStateNodes.length !== nextStateNodeSet.size) {
    return false;
  }
  for (const node of prevStateNodes) {
    if (!nextStateNodeSet.has(node)) {
      return false;
    }
  }
  return true;
}
function microstep(transitions, currentSnapshot, actorScope, event, isInitial, internalQueue) {
  if (!transitions.length) {
    return currentSnapshot;
  }
  const mutStateNodeSet = new Set(currentSnapshot._nodes);
  let historyValue = currentSnapshot.historyValue;
  const filteredTransitions = removeConflictingTransitions(transitions, mutStateNodeSet, historyValue);
  let nextState = currentSnapshot;
  if (!isInitial) {
    [nextState, historyValue] = exitStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, historyValue, internalQueue, actorScope.actionExecutor);
  }
  nextState = resolveActionsAndContext(nextState, event, actorScope, filteredTransitions.flatMap((t2) => t2.actions), internalQueue, void 0);
  nextState = enterStates(nextState, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial);
  const nextStateNodes = [...mutStateNodeSet];
  if (nextState.status === "done") {
    nextState = resolveActionsAndContext(nextState, event, actorScope, nextStateNodes.sort((a2, b2) => b2.order - a2.order).flatMap((state) => state.exit), internalQueue, void 0);
  }
  try {
    if (historyValue === currentSnapshot.historyValue && areStateNodeCollectionsEqual(currentSnapshot._nodes, mutStateNodeSet)) {
      return nextState;
    }
    return cloneMachineSnapshot(nextState, {
      _nodes: nextStateNodes,
      historyValue
    });
  } catch (e2) {
    throw e2;
  }
}
function getMachineOutput(snapshot, event, actorScope, rootNode, rootCompletionNode) {
  if (rootNode.output === void 0) {
    return;
  }
  const doneStateEvent = createDoneStateEvent(rootCompletionNode.id, rootCompletionNode.output !== void 0 && rootCompletionNode.parent ? resolveOutput(rootCompletionNode.output, snapshot.context, event, actorScope.self) : void 0);
  return resolveOutput(rootNode.output, snapshot.context, doneStateEvent, actorScope.self);
}
function enterStates(currentSnapshot, event, actorScope, filteredTransitions, mutStateNodeSet, internalQueue, historyValue, isInitial) {
  let nextSnapshot = currentSnapshot;
  const statesToEnter = /* @__PURE__ */ new Set();
  const statesForDefaultEntry = /* @__PURE__ */ new Set();
  computeEntrySet(filteredTransitions, historyValue, statesForDefaultEntry, statesToEnter);
  if (isInitial) {
    statesForDefaultEntry.add(currentSnapshot.machine.root);
  }
  const completedNodes = /* @__PURE__ */ new Set();
  for (const stateNodeToEnter of [...statesToEnter].sort((a2, b2) => a2.order - b2.order)) {
    mutStateNodeSet.add(stateNodeToEnter);
    const actions = [];
    actions.push(...stateNodeToEnter.entry);
    for (const invokeDef of stateNodeToEnter.invoke) {
      actions.push(spawnChild(invokeDef.src, {
        ...invokeDef,
        syncSnapshot: !!invokeDef.onSnapshot
      }));
    }
    if (statesForDefaultEntry.has(stateNodeToEnter)) {
      const initialActions = stateNodeToEnter.initial.actions;
      actions.push(...initialActions);
    }
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, actions, internalQueue, stateNodeToEnter.invoke.map((invokeDef) => invokeDef.id));
    if (stateNodeToEnter.type === "final") {
      const parent = stateNodeToEnter.parent;
      let ancestorMarker = parent?.type === "parallel" ? parent : parent?.parent;
      let rootCompletionNode = ancestorMarker || stateNodeToEnter;
      if (parent?.type === "compound") {
        internalQueue.push(createDoneStateEvent(parent.id, stateNodeToEnter.output !== void 0 ? resolveOutput(stateNodeToEnter.output, nextSnapshot.context, event, actorScope.self) : void 0));
      }
      while (ancestorMarker?.type === "parallel" && !completedNodes.has(ancestorMarker) && isInFinalState(mutStateNodeSet, ancestorMarker)) {
        completedNodes.add(ancestorMarker);
        internalQueue.push(createDoneStateEvent(ancestorMarker.id));
        rootCompletionNode = ancestorMarker;
        ancestorMarker = ancestorMarker.parent;
      }
      if (ancestorMarker) {
        continue;
      }
      nextSnapshot = cloneMachineSnapshot(nextSnapshot, {
        status: "done",
        output: getMachineOutput(nextSnapshot, event, actorScope, nextSnapshot.machine.root, rootCompletionNode)
      });
    }
  }
  return nextSnapshot;
}
function computeEntrySet(transitions, historyValue, statesForDefaultEntry, statesToEnter) {
  for (const t2 of transitions) {
    const domain = getTransitionDomain(t2, historyValue);
    for (const s2 of t2.target || []) {
      if (!isHistoryNode(s2) && // if the target is different than the source then it will *definitely* be entered
      (t2.source !== s2 || // we know that the domain can't lie within the source
      // if it's different than the source then it's outside of it and it means that the target has to be entered as well
      t2.source !== domain || // reentering transitions always enter the target, even if it's the source itself
      t2.reenter)) {
        statesToEnter.add(s2);
        statesForDefaultEntry.add(s2);
      }
      addDescendantStatesToEnter(s2, historyValue, statesForDefaultEntry, statesToEnter);
    }
    const targetStates = getEffectiveTargetStates(t2, historyValue);
    for (const s2 of targetStates) {
      const ancestors = getProperAncestors(s2, domain);
      if (domain?.type === "parallel") {
        ancestors.push(domain);
      }
      addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, !t2.source.parent && t2.reenter ? void 0 : domain);
    }
  }
}
function addDescendantStatesToEnter(stateNode, historyValue, statesForDefaultEntry, statesToEnter) {
  if (isHistoryNode(stateNode)) {
    if (historyValue[stateNode.id]) {
      const historyStateNodes = historyValue[stateNode.id];
      for (const s2 of historyStateNodes) {
        statesToEnter.add(s2);
        addDescendantStatesToEnter(s2, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s2 of historyStateNodes) {
        addProperAncestorStatesToEnter(s2, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    } else {
      const historyDefaultTransition = resolveHistoryDefaultTransition(stateNode);
      for (const s2 of historyDefaultTransition.target) {
        statesToEnter.add(s2);
        if (historyDefaultTransition === stateNode.parent?.initial) {
          statesForDefaultEntry.add(stateNode.parent);
        }
        addDescendantStatesToEnter(s2, historyValue, statesForDefaultEntry, statesToEnter);
      }
      for (const s2 of historyDefaultTransition.target) {
        addProperAncestorStatesToEnter(s2, stateNode.parent, statesToEnter, historyValue, statesForDefaultEntry);
      }
    }
  } else {
    if (stateNode.type === "compound") {
      const [initialState] = stateNode.initial.target;
      if (!isHistoryNode(initialState)) {
        statesToEnter.add(initialState);
        statesForDefaultEntry.add(initialState);
      }
      addDescendantStatesToEnter(initialState, historyValue, statesForDefaultEntry, statesToEnter);
      addProperAncestorStatesToEnter(initialState, stateNode, statesToEnter, historyValue, statesForDefaultEntry);
    } else {
      if (stateNode.type === "parallel") {
        for (const child of getChildren(stateNode).filter((sn2) => !isHistoryNode(sn2))) {
          if (![...statesToEnter].some((s2) => isDescendant(s2, child))) {
            if (!isHistoryNode(child)) {
              statesToEnter.add(child);
              statesForDefaultEntry.add(child);
            }
            addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
          }
        }
      }
    }
  }
}
function addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, ancestors, reentrancyDomain) {
  for (const anc of ancestors) {
    if (!reentrancyDomain || isDescendant(anc, reentrancyDomain)) {
      statesToEnter.add(anc);
    }
    if (anc.type === "parallel") {
      for (const child of getChildren(anc).filter((sn2) => !isHistoryNode(sn2))) {
        if (![...statesToEnter].some((s2) => isDescendant(s2, child))) {
          statesToEnter.add(child);
          addDescendantStatesToEnter(child, historyValue, statesForDefaultEntry, statesToEnter);
        }
      }
    }
  }
}
function addProperAncestorStatesToEnter(stateNode, toStateNode, statesToEnter, historyValue, statesForDefaultEntry) {
  addAncestorStatesToEnter(statesToEnter, historyValue, statesForDefaultEntry, getProperAncestors(stateNode, toStateNode));
}
function exitStates(currentSnapshot, event, actorScope, transitions, mutStateNodeSet, historyValue, internalQueue, _actionExecutor) {
  let nextSnapshot = currentSnapshot;
  const statesToExit = computeExitSet(transitions, mutStateNodeSet, historyValue);
  statesToExit.sort((a2, b2) => b2.order - a2.order);
  let changedHistory;
  for (const exitStateNode of statesToExit) {
    for (const historyNode of getHistoryNodes(exitStateNode)) {
      let predicate;
      if (historyNode.history === "deep") {
        predicate = (sn2) => isAtomicStateNode(sn2) && isDescendant(sn2, exitStateNode);
      } else {
        predicate = (sn2) => {
          return sn2.parent === exitStateNode;
        };
      }
      changedHistory ?? (changedHistory = {
        ...historyValue
      });
      changedHistory[historyNode.id] = Array.from(mutStateNodeSet).filter(predicate);
    }
  }
  for (const s2 of statesToExit) {
    nextSnapshot = resolveActionsAndContext(nextSnapshot, event, actorScope, [...s2.exit, ...s2.invoke.map((def) => stopChild(def.id))], internalQueue, void 0);
    mutStateNodeSet.delete(s2);
  }
  return [nextSnapshot, changedHistory || historyValue];
}
function getAction(machine, actionType) {
  return machine.implementations.actions[actionType];
}
function resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, extra, retries) {
  const {
    machine
  } = currentSnapshot;
  let intermediateSnapshot = currentSnapshot;
  for (const action of actions) {
    const isInline = typeof action === "function";
    const resolvedAction = isInline ? action : (
      // the existing type of `.actions` assumes non-nullable `TExpressionAction`
      // it's fine to cast this here to get a common type and lack of errors in the rest of the code
      // our logic below makes sure that we call those 2 "variants" correctly
      getAction(machine, typeof action === "string" ? action : action.type)
    );
    const actionArgs = {
      context: intermediateSnapshot.context,
      event,
      self: actorScope.self,
      system: actorScope.system
    };
    const actionParams = isInline || typeof action === "string" ? void 0 : "params" in action ? typeof action.params === "function" ? action.params({
      context: intermediateSnapshot.context,
      event
    }) : action.params : void 0;
    if (!resolvedAction || !("resolve" in resolvedAction)) {
      actorScope.actionExecutor({
        type: typeof action === "string" ? action : typeof action === "object" ? action.type : action.name || "(anonymous)",
        info: actionArgs,
        params: actionParams,
        exec: resolvedAction
      });
      continue;
    }
    const builtinAction = resolvedAction;
    const [nextState, params, actions2] = builtinAction.resolve(
      actorScope,
      intermediateSnapshot,
      actionArgs,
      actionParams,
      resolvedAction,
      // this holds all params
      extra
    );
    intermediateSnapshot = nextState;
    if ("retryResolve" in builtinAction) {
      retries?.push([builtinAction, params]);
    }
    if ("execute" in builtinAction) {
      actorScope.actionExecutor({
        type: builtinAction.type,
        info: actionArgs,
        params,
        exec: builtinAction.execute.bind(null, actorScope, params)
      });
    }
    if (actions2) {
      intermediateSnapshot = resolveAndExecuteActionsWithContext(intermediateSnapshot, event, actorScope, actions2, extra, retries);
    }
  }
  return intermediateSnapshot;
}
function resolveActionsAndContext(currentSnapshot, event, actorScope, actions, internalQueue, deferredActorIds) {
  const retries = deferredActorIds ? [] : void 0;
  const nextState = resolveAndExecuteActionsWithContext(currentSnapshot, event, actorScope, actions, {
    internalQueue,
    deferredActorIds
  }, retries);
  retries?.forEach(([builtinAction, params]) => {
    builtinAction.retryResolve(actorScope, nextState, params);
  });
  return nextState;
}
function macrostep(snapshot, event, actorScope, internalQueue) {
  let nextSnapshot = snapshot;
  const microstates = [];
  function addMicrostate(microstate, event2, transitions) {
    actorScope.system._sendInspectionEvent({
      type: "@xstate.microstep",
      actorRef: actorScope.self,
      event: event2,
      snapshot: microstate,
      _transitions: transitions
    });
    microstates.push(microstate);
  }
  if (event.type === XSTATE_STOP) {
    nextSnapshot = cloneMachineSnapshot(stopChildren(nextSnapshot, event, actorScope), {
      status: "stopped"
    });
    addMicrostate(nextSnapshot, event, []);
    return {
      snapshot: nextSnapshot,
      microstates
    };
  }
  let nextEvent = event;
  if (nextEvent.type !== XSTATE_INIT) {
    const currentEvent = nextEvent;
    const isErr = isErrorActorEvent(currentEvent);
    const transitions = selectTransitions(currentEvent, nextSnapshot);
    if (isErr && !transitions.length) {
      nextSnapshot = cloneMachineSnapshot(snapshot, {
        status: "error",
        error: currentEvent.error
      });
      addMicrostate(nextSnapshot, currentEvent, []);
      return {
        snapshot: nextSnapshot,
        microstates
      };
    }
    nextSnapshot = microstep(
      transitions,
      snapshot,
      actorScope,
      nextEvent,
      false,
      // isInitial
      internalQueue
    );
    addMicrostate(nextSnapshot, currentEvent, transitions);
  }
  let shouldSelectEventlessTransitions = true;
  while (nextSnapshot.status === "active") {
    let enabledTransitions = shouldSelectEventlessTransitions ? selectEventlessTransitions(nextSnapshot, nextEvent) : [];
    const previousState = enabledTransitions.length ? nextSnapshot : void 0;
    if (!enabledTransitions.length) {
      if (!internalQueue.length) {
        break;
      }
      nextEvent = internalQueue.shift();
      enabledTransitions = selectTransitions(nextEvent, nextSnapshot);
    }
    nextSnapshot = microstep(enabledTransitions, nextSnapshot, actorScope, nextEvent, false, internalQueue);
    shouldSelectEventlessTransitions = nextSnapshot !== previousState;
    addMicrostate(nextSnapshot, nextEvent, enabledTransitions);
  }
  if (nextSnapshot.status !== "active") {
    stopChildren(nextSnapshot, nextEvent, actorScope);
  }
  return {
    snapshot: nextSnapshot,
    microstates
  };
}
function stopChildren(nextState, event, actorScope) {
  return resolveActionsAndContext(nextState, event, actorScope, Object.values(nextState.children).map((child) => stopChild(child)), [], void 0);
}
function selectTransitions(event, nextState) {
  return nextState.machine.getTransitionData(nextState, event);
}
function selectEventlessTransitions(nextState, event) {
  const enabledTransitionSet = /* @__PURE__ */ new Set();
  const atomicStates = nextState._nodes.filter(isAtomicStateNode);
  for (const stateNode of atomicStates) {
    loop: for (const s2 of [stateNode].concat(getProperAncestors(stateNode, void 0))) {
      if (!s2.always) {
        continue;
      }
      for (const transition of s2.always) {
        if (transition.guard === void 0 || evaluateGuard(transition.guard, nextState.context, event, nextState)) {
          enabledTransitionSet.add(transition);
          break loop;
        }
      }
    }
  }
  return removeConflictingTransitions(Array.from(enabledTransitionSet), new Set(nextState._nodes), nextState.historyValue);
}
function resolveStateValue(rootNode, stateValue) {
  const allStateNodes = getAllStateNodes(getStateNodes(rootNode, stateValue));
  return getStateValue(rootNode, [...allStateNodes]);
}
function isMachineSnapshot(value) {
  return !!value && typeof value === "object" && "machine" in value && "value" in value;
}
var machineSnapshotMatches = function matches(testValue) {
  return matchesState(testValue, this.value);
};
var machineSnapshotHasTag = function hasTag(tag) {
  return this.tags.has(tag);
};
var machineSnapshotCan = function can(event) {
  const transitionData = this.machine.getTransitionData(this, event);
  return !!transitionData?.length && // Check that at least one transition is not forbidden
  transitionData.some((t2) => t2.target !== void 0 || t2.actions.length);
};
var machineSnapshotToJSON = function toJSON() {
  const {
    _nodes: nodes,
    tags,
    machine,
    getMeta: getMeta2,
    toJSON: toJSON2,
    can: can2,
    hasTag: hasTag2,
    matches: matches2,
    ...jsonValues
  } = this;
  return {
    ...jsonValues,
    tags: Array.from(tags)
  };
};
var machineSnapshotGetMeta = function getMeta() {
  return this._nodes.reduce((acc, stateNode) => {
    if (stateNode.meta !== void 0) {
      acc[stateNode.id] = stateNode.meta;
    }
    return acc;
  }, {});
};
function createMachineSnapshot(config, machine) {
  return {
    status: config.status,
    output: config.output,
    error: config.error,
    machine,
    context: config.context,
    _nodes: config._nodes,
    value: getStateValue(machine.root, config._nodes),
    tags: new Set(config._nodes.flatMap((sn2) => sn2.tags)),
    children: config.children,
    historyValue: config.historyValue || {},
    matches: machineSnapshotMatches,
    hasTag: machineSnapshotHasTag,
    can: machineSnapshotCan,
    getMeta: machineSnapshotGetMeta,
    toJSON: machineSnapshotToJSON
  };
}
function cloneMachineSnapshot(snapshot, config = {}) {
  return createMachineSnapshot({
    ...snapshot,
    ...config
  }, snapshot.machine);
}
function serializeHistoryValue(historyValue) {
  if (typeof historyValue !== "object" || historyValue === null) {
    return {};
  }
  const result = {};
  for (const key in historyValue) {
    const value = historyValue[key];
    if (Array.isArray(value)) {
      result[key] = value.map((item) => ({
        id: item.id
      }));
    }
  }
  return result;
}
function getPersistedSnapshot(snapshot, options) {
  const {
    _nodes: nodes,
    tags,
    machine,
    children,
    context,
    can: can2,
    hasTag: hasTag2,
    matches: matches2,
    getMeta: getMeta2,
    toJSON: toJSON2,
    ...jsonValues
  } = snapshot;
  const childrenJson = {};
  for (const id in children) {
    const child = children[id];
    childrenJson[id] = {
      snapshot: child.getPersistedSnapshot(options),
      src: child.src,
      systemId: child.systemId,
      syncSnapshot: child._syncSnapshot
    };
  }
  const persisted = {
    ...jsonValues,
    context: persistContext(context),
    children: childrenJson,
    historyValue: serializeHistoryValue(jsonValues.historyValue)
  };
  return persisted;
}
function persistContext(contextPart) {
  let copy;
  for (const key in contextPart) {
    const value = contextPart[key];
    if (value && typeof value === "object") {
      if ("sessionId" in value && "send" in value && "ref" in value) {
        copy ?? (copy = Array.isArray(contextPart) ? contextPart.slice() : {
          ...contextPart
        });
        copy[key] = {
          xstate$$type: $$ACTOR_TYPE,
          id: value.id
        };
      } else {
        const result = persistContext(value);
        if (result !== value) {
          copy ?? (copy = Array.isArray(contextPart) ? contextPart.slice() : {
            ...contextPart
          });
          copy[key] = result;
        }
      }
    }
  }
  return copy ?? contextPart;
}
function resolveRaise(_2, snapshot, args, actionParams, {
  event: eventOrExpr,
  id,
  delay
}, {
  internalQueue
}) {
  const delaysMap = snapshot.machine.implementations.delays;
  if (typeof eventOrExpr === "string") {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Only event objects may be used with raise; use raise({ type: "${eventOrExpr}" }) instead`
    );
  }
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  let resolvedDelay;
  if (typeof delay === "string") {
    const configDelay = delaysMap && delaysMap[delay];
    resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
  } else {
    resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
  }
  if (typeof resolvedDelay !== "number") {
    internalQueue.push(resolvedEvent);
  }
  return [snapshot, {
    event: resolvedEvent,
    id,
    delay: resolvedDelay
  }, void 0];
}
function executeRaise(actorScope, params) {
  const {
    event,
    delay,
    id
  } = params;
  if (typeof delay === "number") {
    actorScope.defer(() => {
      const self2 = actorScope.self;
      actorScope.system.scheduler.schedule(self2, self2, event, delay, id);
    });
    return;
  }
}
function raise(eventOrExpr, options) {
  function raise2(_args, _params) {
  }
  raise2.type = "xstate.raise";
  raise2.event = eventOrExpr;
  raise2.id = options?.id;
  raise2.delay = options?.delay;
  raise2.resolve = resolveRaise;
  raise2.execute = executeRaise;
  return raise2;
}

// node_modules/xstate/actors/dist/xstate-actors.esm.js
function fromTransition(transition, initialContext) {
  return {
    config: transition,
    transition: (snapshot, event, actorScope) => {
      return {
        ...snapshot,
        context: transition(snapshot.context, event, actorScope)
      };
    },
    getInitialSnapshot: (_2, input) => {
      return {
        status: "active",
        output: void 0,
        error: void 0,
        context: typeof initialContext === "function" ? initialContext({
          input
        }) : initialContext
      };
    },
    getPersistedSnapshot: (snapshot) => snapshot,
    restoreSnapshot: (snapshot) => snapshot
  };
}
var emptyLogic = fromTransition((_2) => void 0, void 0);

// node_modules/xstate/dist/assign-fd69c737.esm.js
function createSpawner(actorScope, {
  machine,
  context
}, event, spawnedChildren) {
  const spawn = (src, options) => {
    if (typeof src === "string") {
      const logic = resolveReferencedActor(machine, src);
      if (!logic) {
        throw new Error(`Actor logic '${src}' not implemented in machine '${machine.id}'`);
      }
      const actorRef = createActor(logic, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: typeof options?.input === "function" ? options.input({
          context,
          event,
          self: actorScope.self
        }) : options?.input,
        src,
        systemId: options?.systemId
      });
      spawnedChildren[actorRef.id] = actorRef;
      return actorRef;
    } else {
      const actorRef = createActor(src, {
        id: options?.id,
        parent: actorScope.self,
        syncSnapshot: options?.syncSnapshot,
        input: options?.input,
        src,
        systemId: options?.systemId
      });
      return actorRef;
    }
  };
  return (src, options) => {
    const actorRef = spawn(src, options);
    spawnedChildren[actorRef.id] = actorRef;
    actorScope.defer(() => {
      if (actorRef._processingStatus === ProcessingStatus.Stopped) {
        return;
      }
      actorRef.start();
    });
    return actorRef;
  };
}
function resolveAssign(actorScope, snapshot, actionArgs, actionParams, {
  assignment
}) {
  if (!snapshot.context) {
    throw new Error("Cannot assign to undefined `context`. Ensure that `context` is defined in the machine config.");
  }
  const spawnedChildren = {};
  const assignArgs = {
    context: snapshot.context,
    event: actionArgs.event,
    spawn: createSpawner(actorScope, snapshot, actionArgs.event, spawnedChildren),
    self: actorScope.self,
    system: actorScope.system
  };
  let partialUpdate = {};
  if (typeof assignment === "function") {
    partialUpdate = assignment(assignArgs, actionParams);
  } else {
    for (const key of Object.keys(assignment)) {
      const propAssignment = assignment[key];
      partialUpdate[key] = typeof propAssignment === "function" ? propAssignment(assignArgs, actionParams) : propAssignment;
    }
  }
  const updatedContext = Object.assign({}, snapshot.context, partialUpdate);
  return [cloneMachineSnapshot(snapshot, {
    context: updatedContext,
    children: Object.keys(spawnedChildren).length ? {
      ...snapshot.children,
      ...spawnedChildren
    } : snapshot.children
  }), void 0, void 0];
}
function assign(assignment) {
  function assign2(_args, _params) {
  }
  assign2.type = "xstate.assign";
  assign2.assignment = assignment;
  assign2.resolve = resolveAssign;
  return assign2;
}

// node_modules/xstate/dist/StateMachine-a6d25621.esm.js
var cache = /* @__PURE__ */ new WeakMap();
function memo(object, key, fn2) {
  let memoizedData = cache.get(object);
  if (!memoizedData) {
    memoizedData = {
      [key]: fn2()
    };
    cache.set(object, memoizedData);
  } else if (!(key in memoizedData)) {
    memoizedData[key] = fn2();
  }
  return memoizedData[key];
}
var EMPTY_OBJECT = {};
var toSerializableAction = (action) => {
  if (typeof action === "string") {
    return {
      type: action
    };
  }
  if (typeof action === "function") {
    if ("resolve" in action) {
      return {
        type: action.type
      };
    }
    return {
      type: action.name
    };
  }
  return action;
};
var StateNode = class _StateNode {
  constructor(config, options) {
    this.config = config;
    this.key = void 0;
    this.id = void 0;
    this.type = void 0;
    this.path = void 0;
    this.states = void 0;
    this.history = void 0;
    this.entry = void 0;
    this.exit = void 0;
    this.parent = void 0;
    this.machine = void 0;
    this.meta = void 0;
    this.output = void 0;
    this.order = -1;
    this.description = void 0;
    this.tags = [];
    this.transitions = void 0;
    this.always = void 0;
    this.parent = options._parent;
    this.key = options._key;
    this.machine = options._machine;
    this.path = this.parent ? this.parent.path.concat(this.key) : [];
    this.id = this.config.id || [this.machine.id, ...this.path].join(STATE_DELIMITER);
    this.type = this.config.type || (this.config.states && Object.keys(this.config.states).length ? "compound" : this.config.history ? "history" : "atomic");
    this.description = this.config.description;
    this.order = this.machine.idMap.size;
    this.machine.idMap.set(this.id, this);
    this.states = this.config.states ? mapValues(this.config.states, (stateConfig, key) => {
      const stateNode = new _StateNode(stateConfig, {
        _parent: this,
        _key: key,
        _machine: this.machine
      });
      return stateNode;
    }) : EMPTY_OBJECT;
    if (this.type === "compound" && !this.config.initial) {
      throw new Error(`No initial state specified for compound state node "#${this.id}". Try adding { initial: "${Object.keys(this.states)[0]}" } to the state config.`);
    }
    this.history = this.config.history === true ? "shallow" : this.config.history || false;
    this.entry = toArray(this.config.entry).slice();
    this.exit = toArray(this.config.exit).slice();
    this.meta = this.config.meta;
    this.output = this.type === "final" || !this.parent ? this.config.output : void 0;
    this.tags = toArray(config.tags).slice();
  }
  /** @internal */
  _initialize() {
    this.transitions = formatTransitions(this);
    if (this.config.always) {
      this.always = toTransitionConfigArray(this.config.always).map((t2) => formatTransition(this, NULL_EVENT, t2));
    }
    Object.keys(this.states).forEach((key) => {
      this.states[key]._initialize();
    });
  }
  /** The well-structured state node definition. */
  get definition() {
    return {
      id: this.id,
      key: this.key,
      version: this.machine.version,
      type: this.type,
      initial: this.initial ? {
        target: this.initial.target,
        source: this,
        actions: this.initial.actions.map(toSerializableAction),
        eventType: null,
        reenter: false,
        toJSON: () => ({
          target: this.initial.target.map((t2) => `#${t2.id}`),
          source: `#${this.id}`,
          actions: this.initial.actions.map(toSerializableAction),
          eventType: null
        })
      } : void 0,
      history: this.history,
      states: mapValues(this.states, (state) => {
        return state.definition;
      }),
      on: this.on,
      transitions: [...this.transitions.values()].flat().map((t2) => ({
        ...t2,
        actions: t2.actions.map(toSerializableAction)
      })),
      entry: this.entry.map(toSerializableAction),
      exit: this.exit.map(toSerializableAction),
      meta: this.meta,
      order: this.order || -1,
      output: this.output,
      invoke: this.invoke,
      description: this.description,
      tags: this.tags
    };
  }
  /** @internal */
  toJSON() {
    return this.definition;
  }
  /** The logic invoked as actors by this state node. */
  get invoke() {
    return memo(this, "invoke", () => toArray(this.config.invoke).map((invokeConfig, i2) => {
      const {
        src,
        systemId
      } = invokeConfig;
      const resolvedId = invokeConfig.id ?? createInvokeId(this.id, i2);
      const sourceName = typeof src === "string" ? src : `xstate.invoke.${createInvokeId(this.id, i2)}`;
      return {
        ...invokeConfig,
        src: sourceName,
        id: resolvedId,
        systemId,
        toJSON() {
          const {
            onDone,
            onError,
            ...invokeDefValues
          } = invokeConfig;
          return {
            ...invokeDefValues,
            type: "xstate.invoke",
            src: sourceName,
            id: resolvedId
          };
        }
      };
    }));
  }
  /** The mapping of events to transitions. */
  get on() {
    return memo(this, "on", () => {
      const transitions = this.transitions;
      return [...transitions].flatMap(([descriptor, t2]) => t2.map((t3) => [descriptor, t3])).reduce((map, [descriptor, transition]) => {
        map[descriptor] = map[descriptor] || [];
        map[descriptor].push(transition);
        return map;
      }, {});
    });
  }
  get after() {
    return memo(this, "delayedTransitions", () => getDelayedTransitions(this));
  }
  get initial() {
    return memo(this, "initial", () => formatInitialTransition(this, this.config.initial));
  }
  /** @internal */
  next(snapshot, event) {
    const eventType = event.type;
    const actions = [];
    let selectedTransition;
    const candidates = memo(this, `candidates-${eventType}`, () => getCandidates(this, eventType));
    for (const candidate of candidates) {
      const {
        guard
      } = candidate;
      const resolvedContext = snapshot.context;
      let guardPassed = false;
      try {
        guardPassed = !guard || evaluateGuard(guard, resolvedContext, event, snapshot);
      } catch (err) {
        const guardType = typeof guard === "string" ? guard : typeof guard === "object" ? guard.type : void 0;
        throw new Error(`Unable to evaluate guard ${guardType ? `'${guardType}' ` : ""}in transition for event '${eventType}' in state node '${this.id}':
${err.message}`);
      }
      if (guardPassed) {
        actions.push(...candidate.actions);
        selectedTransition = candidate;
        break;
      }
    }
    return selectedTransition ? [selectedTransition] : void 0;
  }
  /** All the event types accepted by this state node and its descendants. */
  get events() {
    return memo(this, "events", () => {
      const {
        states
      } = this;
      const events = new Set(this.ownEvents);
      if (states) {
        for (const stateId of Object.keys(states)) {
          const state = states[stateId];
          if (state.states) {
            for (const event of state.events) {
              events.add(`${event}`);
            }
          }
        }
      }
      return Array.from(events);
    });
  }
  /**
   * All the events that have transitions directly from this state node.
   *
   * Excludes any inert events.
   */
  get ownEvents() {
    const keys = Object.keys(Object.fromEntries(this.transitions));
    const events = new Set(keys.filter((descriptor) => {
      return this.transitions.get(descriptor).some((transition) => !(!transition.target && !transition.actions.length && !transition.reenter));
    }));
    return Array.from(events);
  }
};
var STATE_IDENTIFIER2 = "#";
var StateMachine = class _StateMachine {
  constructor(config, implementations) {
    this.config = config;
    this.version = void 0;
    this.schemas = void 0;
    this.implementations = void 0;
    this.__xstatenode = true;
    this.idMap = /* @__PURE__ */ new Map();
    this.root = void 0;
    this.id = void 0;
    this.states = void 0;
    this.events = void 0;
    this.id = config.id || "(machine)";
    this.implementations = {
      actors: implementations?.actors ?? {},
      actions: implementations?.actions ?? {},
      delays: implementations?.delays ?? {},
      guards: implementations?.guards ?? {}
    };
    this.version = this.config.version;
    this.schemas = this.config.schemas;
    this.transition = this.transition.bind(this);
    this.getInitialSnapshot = this.getInitialSnapshot.bind(this);
    this.getPersistedSnapshot = this.getPersistedSnapshot.bind(this);
    this.restoreSnapshot = this.restoreSnapshot.bind(this);
    this.start = this.start.bind(this);
    this.root = new StateNode(config, {
      _key: this.id,
      _machine: this
    });
    this.root._initialize();
    this.states = this.root.states;
    this.events = this.root.events;
  }
  /**
   * Clones this state machine with the provided implementations.
   *
   * @param implementations Options (`actions`, `guards`, `actors`, `delays`) to
   *   recursively merge with the existing options.
   * @returns A new `StateMachine` instance with the provided implementations.
   */
  provide(implementations) {
    const {
      actions,
      guards: guards2,
      actors,
      delays
    } = this.implementations;
    return new _StateMachine(this.config, {
      actions: {
        ...actions,
        ...implementations.actions
      },
      guards: {
        ...guards2,
        ...implementations.guards
      },
      actors: {
        ...actors,
        ...implementations.actors
      },
      delays: {
        ...delays,
        ...implementations.delays
      }
    });
  }
  resolveState(config) {
    const resolvedStateValue = resolveStateValue(this.root, config.value);
    const nodeSet = getAllStateNodes(getStateNodes(this.root, resolvedStateValue));
    return createMachineSnapshot({
      _nodes: [...nodeSet],
      context: config.context || {},
      children: {},
      status: isInFinalState(nodeSet, this.root) ? "done" : config.status || "active",
      output: config.output,
      error: config.error,
      historyValue: config.historyValue
    }, this);
  }
  /**
   * Determines the next snapshot given the current `snapshot` and received
   * `event`. Calculates a full macrostep from all microsteps.
   *
   * @param snapshot The current snapshot
   * @param event The received event
   */
  transition(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).snapshot;
  }
  /**
   * Determines the next state given the current `state` and `event`. Calculates
   * a microstep.
   *
   * @param state The current state
   * @param event The received event
   */
  microstep(snapshot, event, actorScope) {
    return macrostep(snapshot, event, actorScope, []).microstates;
  }
  getTransitionData(snapshot, event) {
    return transitionNode(this.root, snapshot.value, snapshot, event) || [];
  }
  /**
   * The initial state _before_ evaluating any microsteps. This "pre-initial"
   * state is provided to initial actions executed in the initial state.
   */
  getPreInitialState(actorScope, initEvent, internalQueue) {
    const {
      context
    } = this.config;
    const preInitial = createMachineSnapshot({
      context: typeof context !== "function" && context ? context : {},
      _nodes: [this.root],
      children: {},
      status: "active"
    }, this);
    if (typeof context === "function") {
      const assignment = ({
        spawn,
        event,
        self: self2
      }) => context({
        spawn,
        input: event.input,
        self: self2
      });
      return resolveActionsAndContext(preInitial, initEvent, actorScope, [assign(assignment)], internalQueue, void 0);
    }
    return preInitial;
  }
  /**
   * Returns the initial `State` instance, with reference to `self` as an
   * `ActorRef`.
   */
  getInitialSnapshot(actorScope, input) {
    const initEvent = createInitEvent(input);
    const internalQueue = [];
    const preInitialState = this.getPreInitialState(actorScope, initEvent, internalQueue);
    const nextState = microstep([{
      target: [...getInitialStateNodes(this.root)],
      source: this.root,
      reenter: true,
      actions: [],
      eventType: null,
      toJSON: null
      // TODO: fix
    }], preInitialState, actorScope, initEvent, true, internalQueue);
    const {
      snapshot: macroState
    } = macrostep(nextState, initEvent, actorScope, internalQueue);
    return macroState;
  }
  start(snapshot) {
    Object.values(snapshot.children).forEach((child) => {
      if (child.getSnapshot().status === "active") {
        child.start();
      }
    });
  }
  getStateNodeById(stateId) {
    const fullPath = toStatePath(stateId);
    const relativePath = fullPath.slice(1);
    const resolvedStateId = isStateId(fullPath[0]) ? fullPath[0].slice(STATE_IDENTIFIER2.length) : fullPath[0];
    const stateNode = this.idMap.get(resolvedStateId);
    if (!stateNode) {
      throw new Error(`Child state node '#${resolvedStateId}' does not exist on machine '${this.id}'`);
    }
    return getStateNodeByPath(stateNode, relativePath);
  }
  get definition() {
    return this.root.definition;
  }
  toJSON() {
    return this.definition;
  }
  getPersistedSnapshot(snapshot, options) {
    return getPersistedSnapshot(snapshot, options);
  }
  restoreSnapshot(snapshot, _actorScope) {
    const children = {};
    const snapshotChildren = snapshot.children;
    Object.keys(snapshotChildren).forEach((actorId) => {
      const actorData = snapshotChildren[actorId];
      const childState = actorData.snapshot;
      const src = actorData.src;
      const logic = typeof src === "string" ? resolveReferencedActor(this, src) : src;
      if (!logic) {
        return;
      }
      const actorRef = createActor(logic, {
        id: actorId,
        parent: _actorScope.self,
        syncSnapshot: actorData.syncSnapshot,
        snapshot: childState,
        src,
        systemId: actorData.systemId
      });
      children[actorId] = actorRef;
    });
    function resolveHistoryReferencedState(root, referenced) {
      if (referenced instanceof StateNode) {
        return referenced;
      }
      try {
        return root.machine.getStateNodeById(referenced.id);
      } catch {
      }
    }
    function reviveHistoryValue(root, historyValue) {
      if (!historyValue || typeof historyValue !== "object") {
        return {};
      }
      const revived = {};
      for (const key in historyValue) {
        const arr = historyValue[key];
        for (const item of arr) {
          const resolved = resolveHistoryReferencedState(root, item);
          if (!resolved) {
            continue;
          }
          revived[key] ?? (revived[key] = []);
          revived[key].push(resolved);
        }
      }
      return revived;
    }
    const revivedHistoryValue = reviveHistoryValue(this.root, snapshot.historyValue);
    const restoredSnapshot = createMachineSnapshot({
      ...snapshot,
      children,
      _nodes: Array.from(getAllStateNodes(getStateNodes(this.root, snapshot.value))),
      historyValue: revivedHistoryValue
    }, this);
    const seen = /* @__PURE__ */ new Set();
    function reviveContext(contextPart, children2) {
      if (seen.has(contextPart)) {
        return;
      }
      seen.add(contextPart);
      for (const key in contextPart) {
        const value = contextPart[key];
        if (value && typeof value === "object") {
          if ("xstate$$type" in value && value.xstate$$type === $$ACTOR_TYPE) {
            contextPart[key] = children2[value.id];
            continue;
          }
          reviveContext(value, children2);
        }
      }
    }
    reviveContext(restoredSnapshot.context, children);
    return restoredSnapshot;
  }
};

// node_modules/xstate/dist/log-fbb00743.esm.js
function resolveEmit(_2, snapshot, args, actionParams, {
  event: eventOrExpr
}) {
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  return [snapshot, {
    event: resolvedEvent
  }, void 0];
}
function executeEmit(actorScope, {
  event
}) {
  actorScope.defer(() => actorScope.emit(event));
}
function emit(eventOrExpr) {
  function emit2(_args, _params) {
  }
  emit2.type = "xstate.emit";
  emit2.event = eventOrExpr;
  emit2.resolve = resolveEmit;
  emit2.execute = executeEmit;
  return emit2;
}
var SpecialTargets = /* @__PURE__ */ (function(SpecialTargets2) {
  SpecialTargets2["Parent"] = "#_parent";
  SpecialTargets2["Internal"] = "#_internal";
  return SpecialTargets2;
})({});
function resolveSendTo(actorScope, snapshot, args, actionParams, {
  to: to2,
  event: eventOrExpr,
  id,
  delay
}, extra) {
  const delaysMap = snapshot.machine.implementations.delays;
  if (typeof eventOrExpr === "string") {
    throw new Error(
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Only event objects may be used with sendTo; use sendTo({ type: "${eventOrExpr}" }) instead`
    );
  }
  const resolvedEvent = typeof eventOrExpr === "function" ? eventOrExpr(args, actionParams) : eventOrExpr;
  let resolvedDelay;
  if (typeof delay === "string") {
    const configDelay = delaysMap && delaysMap[delay];
    resolvedDelay = typeof configDelay === "function" ? configDelay(args, actionParams) : configDelay;
  } else {
    resolvedDelay = typeof delay === "function" ? delay(args, actionParams) : delay;
  }
  const resolvedTarget = typeof to2 === "function" ? to2(args, actionParams) : to2;
  let targetActorRef;
  if (typeof resolvedTarget === "string") {
    if (resolvedTarget === SpecialTargets.Parent) {
      targetActorRef = actorScope.self._parent;
    } else if (resolvedTarget === SpecialTargets.Internal) {
      targetActorRef = actorScope.self;
    } else if (resolvedTarget.startsWith("#_")) {
      targetActorRef = snapshot.children[resolvedTarget.slice(2)];
    } else {
      targetActorRef = extra.deferredActorIds?.includes(resolvedTarget) ? resolvedTarget : snapshot.children[resolvedTarget];
    }
    if (!targetActorRef) {
      throw new Error(`Unable to send event to actor '${resolvedTarget}' from machine '${snapshot.machine.id}'.`);
    }
  } else {
    targetActorRef = resolvedTarget || actorScope.self;
  }
  return [snapshot, {
    to: targetActorRef,
    targetId: typeof resolvedTarget === "string" ? resolvedTarget : void 0,
    event: resolvedEvent,
    id,
    delay: resolvedDelay
  }, void 0];
}
function retryResolveSendTo(_2, snapshot, params) {
  if (typeof params.to === "string") {
    params.to = snapshot.children[params.to];
  }
}
function executeSendTo(actorScope, params) {
  actorScope.defer(() => {
    const {
      to: to2,
      event,
      delay,
      id
    } = params;
    if (typeof delay === "number") {
      actorScope.system.scheduler.schedule(actorScope.self, to2, event, delay, id);
      return;
    }
    actorScope.system._relay(
      actorScope.self,
      // at this point, in a deferred task, it should already be mutated by retryResolveSendTo
      // if it initially started as a string
      to2,
      event.type === XSTATE_ERROR ? createErrorActorEvent(actorScope.self.id, event.data) : event
    );
  });
}
function sendTo(to2, eventOrExpr, options) {
  function sendTo2(_args, _params) {
  }
  sendTo2.type = "xstate.sendTo";
  sendTo2.to = to2;
  sendTo2.event = eventOrExpr;
  sendTo2.id = options?.id;
  sendTo2.delay = options?.delay;
  sendTo2.resolve = resolveSendTo;
  sendTo2.retryResolve = retryResolveSendTo;
  sendTo2.execute = executeSendTo;
  return sendTo2;
}
function sendParent(event, options) {
  return sendTo(SpecialTargets.Parent, event, options);
}
function resolveEnqueueActions(actorScope, snapshot, args, actionParams, {
  collect
}) {
  const actions = [];
  const enqueue = function enqueue2(action) {
    actions.push(action);
  };
  enqueue.assign = (...args2) => {
    actions.push(assign(...args2));
  };
  enqueue.cancel = (...args2) => {
    actions.push(cancel(...args2));
  };
  enqueue.raise = (...args2) => {
    actions.push(raise(...args2));
  };
  enqueue.sendTo = (...args2) => {
    actions.push(sendTo(...args2));
  };
  enqueue.sendParent = (...args2) => {
    actions.push(sendParent(...args2));
  };
  enqueue.spawnChild = (...args2) => {
    actions.push(spawnChild(...args2));
  };
  enqueue.stopChild = (...args2) => {
    actions.push(stopChild(...args2));
  };
  enqueue.emit = (...args2) => {
    actions.push(emit(...args2));
  };
  collect({
    context: args.context,
    event: args.event,
    enqueue,
    check: (guard) => evaluateGuard(guard, snapshot.context, args.event, snapshot),
    self: actorScope.self,
    system: actorScope.system
  }, actionParams);
  return [snapshot, void 0, actions];
}
function enqueueActions(collect) {
  function enqueueActions2(_args, _params) {
  }
  enqueueActions2.type = "xstate.enqueueActions";
  enqueueActions2.collect = collect;
  enqueueActions2.resolve = resolveEnqueueActions;
  return enqueueActions2;
}
function resolveLog(_2, snapshot, actionArgs, actionParams, {
  value,
  label
}) {
  return [snapshot, {
    value: typeof value === "function" ? value(actionArgs, actionParams) : value,
    label
  }, void 0];
}
function executeLog({
  logger
}, {
  value,
  label
}) {
  if (label) {
    logger(label, value);
  } else {
    logger(value);
  }
}
function log(value = ({
  context,
  event
}) => ({
  context,
  event
}), label) {
  function log2(_args, _params) {
  }
  log2.type = "xstate.log";
  log2.value = value;
  log2.label = label;
  log2.resolve = resolveLog;
  log2.execute = executeLog;
  return log2;
}

// node_modules/xstate/dist/xstate.esm.js
function createMachine(config, implementations) {
  return new StateMachine(config, implementations);
}
function setup({
  schemas,
  actors,
  actions,
  guards: guards2,
  delays
}) {
  return {
    assign,
    sendTo,
    raise,
    log,
    cancel,
    stopChild,
    enqueueActions,
    emit,
    spawnChild,
    createStateConfig: (config) => config,
    createAction: (fn2) => fn2,
    createMachine: (config) => createMachine({
      ...config,
      schemas
    }, {
      actors,
      actions,
      guards: guards2,
      delays
    }),
    extend: (extended) => setup({
      schemas,
      actors,
      actions: {
        ...actions,
        ...extended.actions
      },
      guards: {
        ...guards2,
        ...extended.guards
      },
      delays: {
        ...delays,
        ...extended.delays
      }
    })
  };
}

// hot/bronze/src/adapters/xstate-fsm.adapter.ts
var DEFAULT_ARM_STABLE_MS = 200;
var DEFAULT_CMD_WINDOW_MS = 500;
var DEFAULT_MIN_CONFIDENCE = 0.7;
var guards = {
  /** GATE_BASELINE_OK: Open_Palm + palmFacing + conf >= Cmin */
  isBaselineOk: ({ event }) => {
    if (event.type !== "FRAME") return false;
    const { frame } = event;
    return frame.trackingOk && frame.palmFacing && frame.label === "Open_Palm" && frame.confidence >= DEFAULT_MIN_CONFIDENCE;
  },
  /** GATE_BASELINE_STABLE: Baseline maintained for ARM_STABLE_MS */
  isBaselineStable: ({ context, event }) => {
    if (event.type !== "FRAME") return false;
    if (context.baselineStableAt === null) return false;
    return event.frame.ts - context.baselineStableAt >= DEFAULT_ARM_STABLE_MS;
  },
  /** GATE_CMD_WINDOW_OK: Within command window from baseline */
  isCmdWindowOk: ({ context, event }) => {
    if (event.type !== "FRAME") return false;
    if (!context.armedFromBaseline) return false;
    if (context.baselineStableAt === null) return false;
    return event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
  },
  /** GATE_TRACKING_OK: Hand is being tracked */
  isTrackingOk: ({ event }) => {
    if (event.type !== "FRAME") return false;
    return event.frame.trackingOk;
  },
  /** GATE_PALM_FACING: Palm facing camera */
  isPalmFacing: ({ event }) => {
    if (event.type !== "FRAME") return false;
    return event.frame.palmFacing;
  },
  /** Is Pointing_Up gesture (primary click) */
  isPointingUp: ({ event }) => {
    if (event.type !== "FRAME") return false;
    return event.frame.label === "Pointing_Up" && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
  },
  /** Is Victory gesture (navigation/pan) */
  isVictory: ({ event }) => {
    if (event.type !== "FRAME") return false;
    return event.frame.label === "Victory" && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
  },
  /** Is Thumb_Up/Down gesture (zoom) */
  isZoomGesture: ({ event }) => {
    if (event.type !== "FRAME") return false;
    return (event.frame.label === "Thumb_Up" || event.frame.label === "Thumb_Down") && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
  },
  /** Is returning to baseline from command state */
  isReturningToBaseline: ({ event }) => {
    if (event.type !== "FRAME") return false;
    const { frame } = event;
    return frame.trackingOk && frame.palmFacing && frame.label === "Open_Palm";
  },
  // Inverse guards (XState v5 doesn't have built-in 'not')
  isNotBaselineOk: ({ event }) => {
    if (event.type !== "FRAME") return true;
    const { frame } = event;
    return !(frame.trackingOk && frame.palmFacing && frame.label === "Open_Palm" && frame.confidence >= DEFAULT_MIN_CONFIDENCE);
  },
  isNotTrackingOk: ({ event }) => {
    if (event.type !== "FRAME") return true;
    return !event.frame.trackingOk;
  },
  isNotPalmFacing: ({ event }) => {
    if (event.type !== "FRAME") return true;
    return !event.frame.palmFacing;
  },
  // Compound guards (XState v5 doesn't have built-in 'and')
  isPointingUpInWindow: ({ context, event }) => {
    if (event.type !== "FRAME") return false;
    const isPointingUp = event.frame.label === "Pointing_Up" && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
    const isCmdWindowOk = context.armedFromBaseline && context.baselineStableAt !== null && event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
    return isPointingUp && isCmdWindowOk;
  },
  isVictoryInWindow: ({ context, event }) => {
    if (event.type !== "FRAME") return false;
    const isVictory = event.frame.label === "Victory" && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
    const isCmdWindowOk = context.armedFromBaseline && context.baselineStableAt !== null && event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
    return isVictory && isCmdWindowOk;
  },
  isZoomInWindow: ({ context, event }) => {
    if (event.type !== "FRAME") return false;
    const isZoom = (event.frame.label === "Thumb_Up" || event.frame.label === "Thumb_Down") && event.frame.confidence >= DEFAULT_MIN_CONFIDENCE;
    const isCmdWindowOk = context.armedFromBaseline && context.baselineStableAt !== null && event.frame.ts - context.baselineStableAt <= DEFAULT_CMD_WINDOW_MS;
    return isZoom && isCmdWindowOk;
  }
};
var gestureMachine = setup({
  types: {
    context: {},
    events: {}
  },
  guards,
  actions: {
    recordBaselineTime: assign({
      baselineStableAt: ({ event }) => {
        if (event.type === "FRAME") return event.frame.ts;
        return null;
      }
    }),
    clearBaselineTime: assign({
      baselineStableAt: () => null
    }),
    setArmedFromBaseline: assign({
      armedFromBaseline: () => true
    }),
    clearArmedFromBaseline: assign({
      armedFromBaseline: () => false
    }),
    updatePosition: assign({
      lastPosition: ({ event }) => {
        if (event.type === "FRAME" && event.frame.position) {
          return { x: event.frame.position.x, y: event.frame.position.y };
        }
        return null;
      },
      currentTs: ({ event }) => {
        if (event.type === "FRAME") return event.frame.ts;
        return 0;
      }
    })
  }
}).createMachine({
  id: "gestureFSM",
  initial: "DISARMED",
  context: {
    baselineStableAt: null,
    armedFromBaseline: false,
    lastPosition: null,
    currentTs: 0
  },
  states: {
    // System inactive - no pointer events
    DISARMED: {
      on: {
        FRAME: [
          {
            guard: "isBaselineOk",
            target: "ARMING",
            actions: ["recordBaselineTime", "updatePosition"]
          },
          {
            actions: "updatePosition"
          }
        ]
      }
    },
    // Baseline hysteresis - waiting for stable Open_Palm
    ARMING: {
      on: {
        FRAME: [
          {
            guard: "isNotBaselineOk",
            target: "DISARMED",
            actions: "clearBaselineTime"
          },
          {
            guard: "isBaselineStable",
            target: "ARMED",
            actions: ["setArmedFromBaseline", "updatePosition"]
          },
          {
            actions: "updatePosition"
          }
        ],
        DISARM: {
          target: "DISARMED",
          actions: "clearBaselineTime"
        }
      }
    },
    // Cursor aim mode - emit pointermove
    ARMED: {
      on: {
        FRAME: [
          // Lost tracking → DISARMED
          {
            guard: "isNotTrackingOk",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Lost palm facing → DISARMED
          {
            guard: "isNotPalmFacing",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Pointing_Up + in command window → DOWN_COMMIT
          {
            guard: "isPointingUpInWindow",
            target: "DOWN_COMMIT",
            actions: "updatePosition"
          },
          // Victory + in command window → DOWN_NAV
          {
            guard: "isVictoryInWindow",
            target: "DOWN_NAV",
            actions: "updatePosition"
          },
          // Zoom gesture + in command window → ZOOM
          {
            guard: "isZoomInWindow",
            target: "ZOOM",
            actions: "updatePosition"
          },
          // Stay in ARMED, emit move
          {
            actions: "updatePosition"
          }
        ],
        DISARM: {
          target: "DISARMED",
          actions: ["clearBaselineTime", "clearArmedFromBaseline"]
        }
      }
    },
    // Primary click/drag (button=0)
    DOWN_COMMIT: {
      on: {
        FRAME: [
          // Lost tracking → pointercancel → DISARMED
          {
            guard: "isNotTrackingOk",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Return to baseline → pointerup → ARMED (but not from baseline)
          {
            guard: "isReturningToBaseline",
            target: "ARMED",
            actions: ["clearArmedFromBaseline", "recordBaselineTime", "updatePosition"]
          },
          // Lost palm facing → pointerup → DISARMED
          {
            guard: "isNotPalmFacing",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Stay in DOWN_COMMIT, emit move
          {
            actions: "updatePosition"
          }
        ],
        DISARM: {
          target: "DISARMED",
          actions: ["clearBaselineTime", "clearArmedFromBaseline"]
        }
      }
    },
    // Middle-click drag (button=1) for pan
    DOWN_NAV: {
      on: {
        FRAME: [
          // Lost tracking → pointercancel → DISARMED
          {
            guard: "isNotTrackingOk",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Return to baseline → pointerup → ARMED (but not from baseline)
          {
            guard: "isReturningToBaseline",
            target: "ARMED",
            actions: ["clearArmedFromBaseline", "recordBaselineTime", "updatePosition"]
          },
          // Lost palm facing → pointerup → DISARMED
          {
            guard: "isNotPalmFacing",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Stay in DOWN_NAV, emit move
          {
            actions: "updatePosition"
          }
        ],
        DISARM: {
          target: "DISARMED",
          actions: ["clearBaselineTime", "clearArmedFromBaseline"]
        }
      }
    },
    // Wheel emission for zoom
    ZOOM: {
      on: {
        FRAME: [
          // Lost tracking → DISARMED
          {
            guard: "isNotTrackingOk",
            target: "DISARMED",
            actions: ["clearBaselineTime", "clearArmedFromBaseline"]
          },
          // Return to baseline → ARMED
          {
            guard: "isReturningToBaseline",
            target: "ARMED",
            actions: ["clearArmedFromBaseline", "recordBaselineTime", "updatePosition"]
          },
          // Stay in ZOOM
          {
            actions: "updatePosition"
          }
        ],
        DISARM: {
          target: "DISARMED",
          actions: ["clearBaselineTime", "clearArmedFromBaseline"]
        }
      }
    }
  }
});
var XStateFSMAdapter = class {
  constructor() {
    __publicField(this, "actor");
    __publicField(this, "previousState", "DISARMED");
    // @ts-expect-error Reserved for stateful transitions
    __publicField(this, "_previousFrame", null);
    __publicField(this, "subscribers", /* @__PURE__ */ new Set());
    this.actor = createActor(gestureMachine);
    this.actor.start();
    this.actor.subscribe((snapshot) => {
      const newState = snapshot.value;
      if (this.subscribers.size > 0) {
        const position = snapshot.context.lastPosition ?? { x: 0.5, y: 0.5 };
        const action = { action: "move", state: newState, x: position.x, y: position.y };
        this.subscribers.forEach((cb) => cb(newState, action));
      }
    });
  }
  process(frame) {
    const previousSnapshot = this.actor.getSnapshot();
    this.previousState = previousSnapshot.value;
    this.actor.send({ type: "FRAME", frame });
    const snapshot = this.actor.getSnapshot();
    const newState = snapshot.value;
    const action = this.computeAction(newState, snapshot.context, frame);
    this._previousFrame = frame;
    return FSMActionSchema.parse(action);
  }
  computeAction(newState, context, currentFrame) {
    const position = context.lastPosition ?? { x: 0.5, y: 0.5 };
    const previousState = this.previousState;
    if (newState === "DISARMED") {
      if (previousState === "DOWN_COMMIT" || previousState === "DOWN_NAV") {
        return { action: "cancel", state: newState };
      }
      return { action: "none", state: newState };
    }
    if (newState === "ARMING") {
      return { action: "none", state: newState };
    }
    if (newState === "ARMED") {
      if (previousState === "DOWN_COMMIT") {
        return { action: "up", state: newState, x: position.x, y: position.y, button: 0 };
      }
      if (previousState === "DOWN_NAV") {
        return { action: "up", state: newState, x: position.x, y: position.y, button: 1 };
      }
      return { action: "move", state: newState, x: position.x, y: position.y };
    }
    if (newState === "DOWN_COMMIT") {
      if (previousState === "ARMED") {
        return { action: "down", state: newState, x: position.x, y: position.y, button: 0 };
      }
      return { action: "move", state: newState, x: position.x, y: position.y };
    }
    if (newState === "DOWN_NAV") {
      if (previousState === "ARMED") {
        return { action: "down", state: newState, x: position.x, y: position.y, button: 1 };
      }
      return { action: "move", state: newState, x: position.x, y: position.y };
    }
    if (newState === "ZOOM") {
      const label = currentFrame.label;
      const deltaY = label === "Thumb_Up" ? -100 : label === "Thumb_Down" ? 100 : 0;
      return { action: "wheel", state: newState, deltaY, ctrl: true };
    }
    return { action: "none", state: newState };
  }
  getState() {
    return this.actor.getSnapshot().value;
  }
  getContext() {
    return this.actor.getSnapshot().context;
  }
  disarm() {
    this.actor.send({ type: "DISARM" });
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  /**
   * Stop the actor (cleanup)
   */
  dispose() {
    this.actor.stop();
    this.subscribers.clear();
  }
};

// hot/bronze/src/adapters/golden-layout-shell.adapter.ts
var GoldenLayoutShellAdapter = class {
  constructor() {
    // Private state
    __publicField(this, "initialized", false);
    __publicField(this, "rootContainer", null);
    __publicField(this, "_config", null);
    // Component registry - maps tile type to factory
    __publicField(this, "componentRegistry", /* @__PURE__ */ new Map());
    // Tile state tracking
    __publicField(this, "tiles", /* @__PURE__ */ new Map());
    // Current layout arrangement
    __publicField(this, "arrangement", "");
    // Event callbacks
    __publicField(this, "layoutChangeCallbacks", /* @__PURE__ */ new Set());
    __publicField(this, "tileFocusCallbacks", /* @__PURE__ */ new Set());
  }
  /** Get current configuration (for hot-swapping and inspection) */
  get config() {
    return this._config;
  }
  // ============================================================================
  // COMPONENT REGISTRATION
  // ============================================================================
  /**
   * Register a component factory for a tile type
   * Must be called BEFORE initialize() for the factory to be used
   *
   * @param type - The tile type (dom, iframe, canvas, etc.)
   * @param factory - Factory function to create tile content
   */
  registerComponent(type, factory) {
    this.componentRegistry.set(type, factory);
  }
  // ============================================================================
  // UIShellPort IMPLEMENTATION
  // ============================================================================
  /**
   * Initialize the shell with configuration
   * @throws If already initialized or config is invalid
   */
  async initialize(container, config) {
    const validatedConfig = UIShellConfigSchema.parse(config);
    if (this.initialized) {
      throw new Error("GoldenLayoutShellAdapter: Already initialized. Call dispose() first.");
    }
    this.rootContainer = container;
    this._config = validatedConfig;
    this.initialized = true;
    if (validatedConfig.initialLayout) {
      this.setLayoutInternal(validatedConfig.initialLayout, false);
    }
  }
  /**
   * Get the target element/canvas for a tile
   * Used to wire up AdapterPort for each tile
   */
  getTileTarget(tileId) {
    const tileState = this.tiles.get(tileId);
    if (!tileState?.container) {
      return null;
    }
    const rect = tileState.container.getBoundingClientRect();
    return {
      type: "element",
      selector: `[data-tile-id="${tileId}"]`,
      bounds: {
        width: rect.width || 100,
        height: rect.height || 100,
        left: rect.left || 0,
        top: rect.top || 0
      }
    };
  }
  /**
   * Get all tile IDs
   */
  getTileIds() {
    return Array.from(this.tiles.keys());
  }
  /**
   * Add a new tile
   * @throws If tile config is invalid or ID already exists
   */
  addTile(config) {
    const validatedConfig = TileConfigSchema.parse(config);
    if (this.tiles.has(validatedConfig.id)) {
      throw new Error(
        `GoldenLayoutShellAdapter: Tile already exists with ID "${validatedConfig.id}"`
      );
    }
    const tileContainer = this.createTileContainer(validatedConfig);
    this.tiles.set(validatedConfig.id, {
      config: validatedConfig,
      container: tileContainer,
      element: null
    });
    this.updateArrangementWithNewTile(validatedConfig.id);
    this.emitLayoutChange();
  }
  /**
   * Remove a tile
   * @throws If tile not found
   */
  removeTile(tileId) {
    const tileState = this.tiles.get(tileId);
    if (!tileState) {
      throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
    }
    if (tileState.container?.parentElement) {
      tileState.container.remove();
    }
    this.tiles.delete(tileId);
    this.arrangement = this.removeTileFromArrangement(this.arrangement, tileId);
    this.emitLayoutChange();
  }
  /**
   * Split a tile in the given direction
   * @throws If source tile not found or new tile config invalid
   */
  splitTile(tileId, direction, newTile) {
    if (!this.tiles.has(tileId)) {
      throw new Error(`GoldenLayoutShellAdapter: Tile not found with ID "${tileId}"`);
    }
    const validatedNewTile = TileConfigSchema.parse(newTile);
    if (this.tiles.has(validatedNewTile.id)) {
      throw new Error(
        `GoldenLayoutShellAdapter: Tile already exists with ID "${validatedNewTile.id}"`
      );
    }
    const newContainer = this.createTileContainer(validatedNewTile);
    this.tiles.set(validatedNewTile.id, {
      config: validatedNewTile,
      container: newContainer,
      element: null
    });
    const layoutDirection = direction === "horizontal" ? "row" : "column";
    this.arrangement = this.splitInArrangement(
      this.arrangement,
      tileId,
      validatedNewTile.id,
      layoutDirection
    );
    this.emitLayoutChange();
  }
  /**
   * Get current layout state (for serialization)
   */
  getLayout() {
    const tiles = Array.from(this.tiles.values()).map((s2) => s2.config);
    return {
      tiles,
      arrangement: this.arrangement,
      shell: "golden"
    };
  }
  /**
   * Set layout state (for deserialization)
   * @throws If layout is invalid
   */
  setLayout(state) {
    this.setLayoutInternal(state, true);
  }
  /**
   * Subscribe to layout changes
   * @returns Unsubscribe function
   */
  onLayoutChange(callback) {
    this.layoutChangeCallbacks.add(callback);
    return () => {
      this.layoutChangeCallbacks.delete(callback);
    };
  }
  /**
   * Subscribe to tile focus changes
   * @returns Unsubscribe function
   */
  onTileFocus(callback) {
    this.tileFocusCallbacks.add(callback);
    return () => {
      this.tileFocusCallbacks.delete(callback);
    };
  }
  /**
   * Dispose resources
   */
  dispose() {
    for (const [_id, state] of this.tiles) {
      if (state.container?.parentElement) {
        state.container.remove();
      }
    }
    this.tiles.clear();
    this.layoutChangeCallbacks.clear();
    this.tileFocusCallbacks.clear();
    this.arrangement = "";
    this.rootContainer = null;
    this._config = null;
    this.initialized = false;
  }
  // ============================================================================
  // PUBLIC HELPERS (for testing)
  // ============================================================================
  /**
   * Programmatically focus a tile (emits focus event)
   * Used for testing and external focus management
   */
  focusTile(tileId) {
    if (this.tiles.has(tileId)) {
      this.emitTileFocus(tileId);
    }
  }
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  /**
   * Internal setLayout implementation
   */
  setLayoutInternal(state, clearExisting) {
    const validated = LayoutStateSchema.parse(state);
    if (clearExisting) {
      for (const [_id, tileState] of this.tiles) {
        if (tileState.container?.parentElement) {
          tileState.container.remove();
        }
      }
      this.tiles.clear();
    }
    for (const tileConfig of validated.tiles) {
      if (!this.tiles.has(tileConfig.id)) {
        const container = this.createTileContainer(tileConfig);
        this.tiles.set(tileConfig.id, {
          config: tileConfig,
          container,
          element: null
        });
      }
    }
    this.arrangement = validated.arrangement;
    if (clearExisting) {
      this.emitLayoutChange();
    }
  }
  /**
   * Create a tile container element and invoke component factory
   */
  createTileContainer(config) {
    const container = document.createElement("div");
    container.dataset.tileId = config.id;
    container.dataset.tileType = config.type;
    container.className = "gl-tile-container";
    if (config.title) {
      container.dataset.tileTitle = config.title;
    }
    if (this.rootContainer) {
      this.rootContainer.appendChild(container);
    }
    const factory = this.componentRegistry.get(config.type);
    if (factory) {
      factory(container, config.config);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "gl-tile-placeholder";
      placeholder.textContent = `${config.type}: ${config.title ?? config.id}`;
      container.appendChild(placeholder);
    }
    container.addEventListener("click", () => {
      this.emitTileFocus(config.id);
    });
    return container;
  }
  /**
   * Update arrangement to include a new tile (adds to root)
   */
  updateArrangementWithNewTile(tileId) {
    if (this.arrangement === "" || this.tiles.size === 1) {
      this.arrangement = tileId;
    } else {
      this.arrangement = {
        direction: "row",
        first: this.arrangement,
        second: tileId,
        splitPercentage: 50
      };
    }
  }
  /**
   * Remove a tile from arrangement tree
   */
  removeTileFromArrangement(node, tileId) {
    if (typeof node === "string") {
      return node === tileId ? "" : node;
    }
    const first = this.removeTileFromArrangement(node.first, tileId);
    const second = this.removeTileFromArrangement(node.second, tileId);
    if (first === "") return second;
    if (second === "") return first;
    return {
      ...node,
      first,
      second
    };
  }
  /**
   * Split a tile in the arrangement tree
   */
  splitInArrangement(node, sourceTileId, newTileId, direction) {
    if (typeof node === "string") {
      if (node === sourceTileId) {
        return {
          direction,
          first: sourceTileId,
          second: newTileId,
          splitPercentage: 50
        };
      }
      return node;
    }
    return {
      ...node,
      first: this.splitInArrangement(node.first, sourceTileId, newTileId, direction),
      second: this.splitInArrangement(node.second, sourceTileId, newTileId, direction)
    };
  }
  /**
   * Emit layout change event to all subscribers
   */
  emitLayoutChange() {
    const layout = this.getLayout();
    for (const callback of this.layoutChangeCallbacks) {
      callback(layout);
    }
  }
  /**
   * Emit tile focus event to all subscribers
   */
  emitTileFocus(tileId) {
    for (const callback of this.tileFocusCallbacks) {
      callback(tileId);
    }
  }
};

// hot/bronze/src/adapters/mediapipe.adapter.ts
var GestureRecognizerClass = null;
var FilesetResolverClass = null;
function isPalmFacing(landmarks) {
  if (landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  if (!wrist || !indexMcp || !middleMcp) {
    return false;
  }
  const v1 = {
    x: indexMcp.x - wrist.x,
    y: indexMcp.y - wrist.y,
    z: indexMcp.z - wrist.z
  };
  const v2 = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
    z: middleMcp.z - wrist.z
  };
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
  return normal.z < 0;
}
var MediaPipeAdapter = class {
  constructor(modelPath = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task", wasmPath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm") {
    this.modelPath = modelPath;
    this.wasmPath = wasmPath;
    __publicField(this, "recognizer", null);
    __publicField(this, "_isReady", false);
  }
  get isReady() {
    return this._isReady;
  }
  async initialize() {
    if (this._isReady) return;
    const vision = await Promise.resolve().then(() => (init_vision_bundle(), vision_bundle_exports));
    GestureRecognizerClass = vision.GestureRecognizer;
    FilesetResolverClass = vision.FilesetResolver;
    const filesetResolver = await FilesetResolverClass.forVisionTasks(this.wasmPath);
    this.recognizer = await GestureRecognizerClass.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: this.modelPath,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
      // Single hand for gesture control
    });
    this._isReady = true;
  }
  async sense(video, timestamp) {
    if (!this.recognizer) {
      throw new Error("MediaPipeAdapter not initialized. Call initialize() first.");
    }
    const result = this.recognizer.recognizeForVideo(video, timestamp);
    const frame = this.transformResult(result, timestamp);
    return SensorFrameSchema.parse(frame);
  }
  transformResult(result, timestamp) {
    if (result.landmarks.length === 0 || result.gestures.length === 0) {
      return {
        ts: timestamp,
        handId: "none",
        trackingOk: false,
        palmFacing: false,
        label: "None",
        confidence: 0,
        indexTip: null,
        landmarks: null
      };
    }
    const landmarks = result.landmarks[0];
    const gesture = result.gestures[0]?.[0];
    const handedness = result.handedness[0]?.[0];
    if (!landmarks || landmarks.length < 21) {
      return {
        ts: timestamp,
        handId: "none",
        trackingOk: false,
        palmFacing: false,
        label: "None",
        confidence: 0,
        indexTip: null,
        landmarks: null
      };
    }
    const indexTip = landmarks[8];
    if (!indexTip) {
      return {
        ts: timestamp,
        handId: "none",
        trackingOk: false,
        palmFacing: false,
        label: "None",
        confidence: 0,
        indexTip: null,
        landmarks: null
      };
    }
    const label = gesture?.categoryName || "None";
    const confidence = gesture?.score ?? 0;
    return {
      ts: timestamp,
      handId: handedness?.categoryName?.toLowerCase() || "right",
      trackingOk: true,
      palmFacing: isPalmFacing(landmarks),
      label,
      confidence,
      indexTip: {
        x: indexTip.x,
        y: indexTip.y,
        z: indexTip.z,
        visibility: indexTip.visibility
      },
      landmarks: landmarks.map((l) => ({
        x: l.x,
        y: l.y,
        z: l.z,
        visibility: l.visibility
      }))
    };
  }
  dispose() {
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
      this._isReady = false;
    }
  }
};

// hot/bronze/src/adapters/pointer-event.adapter.ts
var PointerEventAdapter = class {
  constructor(pointerId = 1, pointerType = "touch") {
    __publicField(this, "_pointerId");
    __publicField(this, "pointerType");
    this._pointerId = pointerId;
    this.pointerType = pointerType;
  }
  get pointerId() {
    return this._pointerId;
  }
  emit(action, target) {
    if (action.action === "none") {
      return null;
    }
    const clientX = "x" in action ? target.bounds.left + action.x * target.bounds.width : 0;
    const clientY = "y" in action ? target.bounds.top + action.y * target.bounds.height : 0;
    let event;
    switch (action.action) {
      case "move":
        event = {
          type: "pointermove",
          pointerId: this._pointerId,
          clientX,
          clientY,
          pointerType: this.pointerType,
          pressure: 0.5,
          isPrimary: true
        };
        break;
      case "down":
        event = {
          type: "pointerdown",
          pointerId: this._pointerId,
          clientX,
          clientY,
          pointerType: this.pointerType,
          button: action.button,
          buttons: action.button === 0 ? 1 : action.button === 1 ? 4 : 2,
          pressure: 0.5,
          isPrimary: true
        };
        break;
      case "up":
        event = {
          type: "pointerup",
          pointerId: this._pointerId,
          clientX,
          clientY,
          pointerType: this.pointerType,
          button: action.button,
          buttons: 0,
          pressure: 0,
          isPrimary: true
        };
        break;
      case "cancel":
        event = {
          type: "pointercancel",
          pointerId: this._pointerId,
          pointerType: this.pointerType
        };
        break;
      case "wheel":
        event = {
          type: "wheel",
          deltaY: action.deltaY,
          deltaMode: 0,
          // DOM_DELTA_PIXEL
          ctrlKey: action.ctrl ?? false,
          clientX: target.bounds.left + target.bounds.width / 2,
          clientY: target.bounds.top + target.bounds.height / 2
        };
        break;
      default:
        return null;
    }
    return PointerEventOutSchema.parse(event);
  }
};

// hot/bronze/src/adapters/port-factory.ts
var RapierSmootherAdapter = class {
  constructor(rapier) {
    this.rapier = rapier;
  }
  smooth(frame) {
    return this.rapier.smooth(frame);
  }
  reset() {
    this.rapier.reset();
  }
  /**
   * Map 1€ filter params to Rapier physics params
   * Delegates to RapierPhysicsAdapter.setParams which handles mode-specific mapping
   */
  setParams(mincutoff, beta) {
    this.rapier.setParams(mincutoff, beta);
  }
};
var VirtualDOMAdapter = class {
  constructor(target) {
    __publicField(this, "_bounds");
    __publicField(this, "_hasCapture", false);
    this._bounds = target.bounds;
  }
  inject(_event) {
    return true;
  }
  getBounds() {
    return this._bounds;
  }
  setCapture() {
    this._hasCapture = true;
  }
  releaseCapture() {
    this._hasCapture = false;
  }
  hasCapture() {
    return this._hasCapture;
  }
};
var RawHTMLShellAdapter = class {
  constructor() {
    __publicField(this, "container", null);
    __publicField(this, "tiles", /* @__PURE__ */ new Map());
    __publicField(this, "layoutChangeCallbacks", /* @__PURE__ */ new Set());
    __publicField(this, "tileFocusCallbacks", /* @__PURE__ */ new Set());
    __publicField(this, "arrangement", "");
  }
  async initialize(container, config) {
    this.container = container;
    this.container.style.position = "relative";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    if (config.initialLayout) {
      this.setLayout(config.initialLayout);
    }
  }
  getTileTarget(tileId) {
    const tile = this.tiles.get(tileId);
    if (!tile?.element) return null;
    const rect = tile.element.getBoundingClientRect();
    return {
      type: "element",
      bounds: {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top
      }
    };
  }
  getTileIds() {
    return Array.from(this.tiles.keys());
  }
  addTile(config) {
    if (!this.container) return;
    const element = document.createElement("div");
    element.id = `tile-${config.id}`;
    element.style.position = "absolute";
    element.style.border = "1px solid #ccc";
    element.style.overflow = "hidden";
    element.dataset.tileId = config.id;
    const count = this.tiles.size;
    const cols = Math.ceil(Math.sqrt(count + 1));
    const width = 100 / cols;
    element.style.width = `${width}%`;
    element.style.height = "100%";
    element.style.left = `${count % cols * width}%`;
    element.style.top = "0";
    this.container.appendChild(element);
    this.tiles.set(config.id, { config, element });
    this.notifyLayoutChange();
  }
  removeTile(tileId) {
    const tile = this.tiles.get(tileId);
    if (tile?.element) {
      tile.element.remove();
      this.tiles.delete(tileId);
      this.notifyLayoutChange();
    }
  }
  splitTile(_tileId, _direction, newTile) {
    this.addTile(newTile);
  }
  getLayout() {
    const tiles = Array.from(this.tiles.values()).map((t2) => t2.config);
    return {
      tiles,
      arrangement: this.arrangement || "",
      shell: "raw"
    };
  }
  setLayout(state) {
    for (const [id] of this.tiles) {
      this.removeTile(id);
    }
    for (const tileConfig of state.tiles) {
      this.addTile(tileConfig);
    }
    this.arrangement = state.arrangement;
  }
  onLayoutChange(callback) {
    this.layoutChangeCallbacks.add(callback);
    return () => this.layoutChangeCallbacks.delete(callback);
  }
  onTileFocus(callback) {
    this.tileFocusCallbacks.add(callback);
    return () => this.tileFocusCallbacks.delete(callback);
  }
  dispose() {
    if (this.container) {
      for (const [, tile] of this.tiles) {
        tile.element?.remove();
      }
      this.tiles.clear();
    }
    this.layoutChangeCallbacks.clear();
    this.tileFocusCallbacks.clear();
    this.container = null;
  }
  notifyLayoutChange() {
    const layout = this.getLayout();
    for (const callback of this.layoutChangeCallbacks) {
      callback(layout);
    }
  }
};
var StubOverlayAdapter = class {
  constructor() {
    __publicField(this, "config", null);
    __publicField(this, "container", null);
  }
  async initialize(container) {
    this.container = container;
  }
  setCursor(_raw, _smoothed, _predicted, _state) {
  }
  setLandmarks(_landmarks) {
  }
  setVisible(_visible) {
  }
  setConfig(config) {
    this.config = { ...this.config, ...config };
  }
  getBounds() {
    if (this.container) {
      return {
        width: this.container.clientWidth,
        height: this.container.clientHeight
      };
    }
    return { width: 0, height: 0 };
  }
  dispose() {
    this.container = null;
    this.config = null;
  }
};
var HFOPortFactory = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Create a SensorPort (MediaPipeAdapter)
   */
  createSensor() {
    const sensorConfig = this.config.sensor;
    if (sensorConfig?.modelPath && sensorConfig?.wasmPath) {
      return new MediaPipeAdapter(sensorConfig.modelPath, sensorConfig.wasmPath);
    }
    return new MediaPipeAdapter();
  }
  /**
   * Create a SmootherPort based on config type
   * - '1euro': OneEuroExemplarAdapter (npm exemplar)
   * - 'rapier-smooth': RapierPhysicsAdapter in smoothed mode
   * - 'rapier-predict': RapierPhysicsAdapter in predictive mode
   * - 'rapier-adaptive': RapierPhysicsAdapter with 1€-inspired adaptive physics
   */
  createSmoother() {
    const { smoother } = this.config;
    switch (smoother.type) {
      case "1euro": {
        const config = {};
        if (smoother.minCutoff !== void 0) config.minCutoff = smoother.minCutoff;
        if (smoother.beta !== void 0) config.beta = smoother.beta;
        if (smoother.dCutoff !== void 0) config.dCutoff = smoother.dCutoff;
        return new OneEuroExemplarAdapter(config);
      }
      case "rapier-smooth": {
        const config = { mode: "smoothed" };
        if (smoother.stiffness !== void 0) config.stiffness = smoother.stiffness;
        if (smoother.damping !== void 0) config.damping = smoother.damping;
        return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
      }
      case "rapier-predict": {
        const config = { mode: "predictive" };
        if (smoother.stiffness !== void 0) config.stiffness = smoother.stiffness;
        if (smoother.damping !== void 0) config.damping = smoother.damping;
        if (smoother.predictionMs !== void 0) config.predictionMs = smoother.predictionMs;
        return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
      }
      case "rapier-adaptive": {
        const config = { mode: "adaptive" };
        if (smoother.minStiffness !== void 0) config.minStiffness = smoother.minStiffness;
        if (smoother.speedCoefficient !== void 0) config.speedCoefficient = smoother.speedCoefficient;
        if (smoother.maxStiffness !== void 0) config.maxStiffness = smoother.maxStiffness;
        if (smoother.damping !== void 0) config.damping = smoother.damping;
        return new RapierSmootherAdapter(new RapierPhysicsAdapter(config));
      }
      case "desp": {
        const config = {};
        if (smoother.alpha !== void 0) config.alpha = smoother.alpha;
        if (smoother.predictionMs !== void 0) config.predictionMs = smoother.predictionMs;
        return new DoubleExponentialPredictor(config);
      }
      default: {
        const _exhaustive = smoother.type;
        throw new Error(`Unknown smoother type: ${_exhaustive}`);
      }
    }
  }
  /**
   * Create an FSMPort (XStateFSMAdapter)
   */
  createFSM() {
    return new XStateFSMAdapter();
  }
  /**
   * Create an EmitterPort (PointerEventAdapter)
   */
  createEmitter() {
    return new PointerEventAdapter();
  }
  /**
   * Create an AdapterPort for target injection
   */
  createAdapter(target) {
    return new VirtualDOMAdapter(target);
  }
  /**
   * Create an OverlayPort (Stub until Canvas2D/Pixi implemented)
   */
  createOverlay(_config) {
    return new StubOverlayAdapter();
  }
  /**
   * Create a UIShellPort based on shell type
   * - 'golden': GoldenLayoutShellAdapter
   * - 'raw': RawHTMLShellAdapter (simple divs)
   * - others: Fallback to RawHTMLShellAdapter
   */
  createShell(type) {
    switch (type) {
      case "golden":
        return new GoldenLayoutShellAdapter();
      case "raw":
        return new RawHTMLShellAdapter();
      case "mosaic":
      case "daedalos":
        console.warn(`Shell type '${type}' not implemented, falling back to 'raw'`);
        return new RawHTMLShellAdapter();
      default: {
        console.warn(`Unknown shell type '${type}', falling back to 'raw'`);
        return new RawHTMLShellAdapter();
      }
    }
  }
};

// hot/bronze/src/gates/palm-cone-gate.ts
var PalmConeConfigSchema = external_exports.object({
  /** Angle to ENTER tracking (< this = palm facing camera) */
  armThreshold: external_exports.number().min(0).max(90).default(25),
  /** Angle to EXIT tracking (> this = palm facing away) - hysteresis */
  disarmThreshold: external_exports.number().min(0).max(90).default(35),
  /** Angle for IMMEDIATE cancel (intentional roll away) */
  cancelThreshold: external_exports.number().min(0).max(180).default(70)
});
var DEFAULT_PALM_CONE_CONFIG = {
  armThreshold: 25,
  disarmThreshold: 35,
  cancelThreshold: 70
};
function createPalmConeGateState() {
  return {
    isFacing: false,
    lastPalmAngle: 180,
    // Start with palm "away"
    lastUpdateTs: 0
  };
}
var WRIST = 0;
var INDEX_FINGER_MCP = 5;
var PINKY_MCP = 17;
function calculatePalmAngle(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return 180;
  }
  const wrist = landmarks[WRIST];
  const indexMCP = landmarks[INDEX_FINGER_MCP];
  const pinkyMCP = landmarks[PINKY_MCP];
  if (!wrist || !indexMCP || !pinkyMCP) {
    return 180;
  }
  const v1 = {
    x: indexMCP.x - wrist.x,
    y: indexMCP.y - wrist.y,
    z: indexMCP.z - wrist.z
  };
  const v2 = {
    x: pinkyMCP.x - wrist.x,
    y: pinkyMCP.y - wrist.y,
    z: pinkyMCP.z - wrist.z
  };
  const normal = {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
  const mag = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
  if (mag < 1e-10) {
    return 90;
  }
  const unitNormal = {
    x: normal.x / mag,
    y: normal.y / mag,
    z: normal.z / mag
  };
  const cameraAxis = { x: 0, y: 0, z: -1 };
  const dot = unitNormal.x * cameraAxis.x + unitNormal.y * cameraAxis.y + unitNormal.z * cameraAxis.z;
  const clampedDot = Math.max(-1, Math.min(1, dot));
  const angleRadians = Math.acos(clampedDot);
  return angleRadians * (180 / Math.PI);
}
function updatePalmConeGate(landmarks, currentState, config, ts2) {
  if (!landmarks || landmarks.length < 21) {
    return {
      isFacing: false,
      palmAngle: 180,
      shouldCancel: false,
      state: {
        isFacing: false,
        lastPalmAngle: 180,
        lastUpdateTs: ts2
      }
    };
  }
  const palmAngle = calculatePalmAngle(landmarks);
  const shouldCancel = palmAngle >= config.cancelThreshold;
  let isFacing;
  if (currentState.isFacing) {
    isFacing = palmAngle < config.disarmThreshold;
  } else {
    isFacing = palmAngle < config.armThreshold;
  }
  return {
    isFacing,
    palmAngle,
    shouldCancel,
    state: {
      isFacing,
      lastPalmAngle: palmAngle,
      lastUpdateTs: ts2
    }
  };
}
function createPalmConeGate(config = {}) {
  const fullConfig = { ...DEFAULT_PALM_CONE_CONFIG, ...config };
  let state = createPalmConeGateState();
  return {
    /**
     * Process frame and update gate state
     */
    process(landmarks, ts2) {
      const result = updatePalmConeGate(landmarks, state, fullConfig, ts2);
      state = result.state;
      return result;
    },
    /**
     * Reset gate to initial state
     */
    reset() {
      state = createPalmConeGateState();
    },
    /**
     * Get current state (for debugging)
     */
    getState() {
      return { ...state };
    },
    /**
     * Get configuration (for debugging)
     */
    getConfig() {
      return { ...fullConfig };
    }
  };
}

// hot/bronze/src/gates/gesture-transition-predictor.ts
var GestureTransitionConfigSchema = external_exports.object({
  /** Ignore None gesture if held for less than this (transition noise) */
  noneDebounceMs: external_exports.number().min(0).max(500).default(80),
  /** If None lasts longer than this, it's genuine disengagement */
  longNoneMs: external_exports.number().min(50).max(1e3).default(200),
  /** Typical None duration during gesture transitions */
  typicalNoneDurationMs: external_exports.number().min(20).max(150).default(75)
});
var DEFAULT_GESTURE_TRANSITION_CONFIG = {
  noneDebounceMs: 50,
  // Below this is transition noise (very short None)
  longNoneMs: 200,
  // Above this is genuine disengagement
  typicalNoneDurationMs: 75
  // Sweet spot for gesture transitions
};
function createGestureTransitionState() {
  return {
    lastValidGesture: "None",
    noneEnteredAt: null,
    lastValidGestureTs: 0,
    noneFrameCount: 0
  };
}
function predictNextGesture(lastValidGesture) {
  switch (lastValidGesture) {
    case "Open_Palm":
      return "Pointing_Up";
    case "Pointing_Up":
      return "Open_Palm";
    case "Victory":
      return "Open_Palm";
    case "Thumb_Up":
    case "Thumb_Down":
      return "Open_Palm";
    default:
      return "Open_Palm";
  }
}
function calculateConfidence(msInNone, config) {
  if (msInNone < config.noneDebounceMs) {
    return msInNone / config.noneDebounceMs * 0.3;
  }
  if (msInNone >= config.longNoneMs) {
    const overTime = msInNone - config.longNoneMs;
    const decay = Math.exp(-overTime / 200);
    return 0.3 * decay;
  }
  const distFromTypical = Math.abs(msInNone - config.typicalNoneDurationMs);
  const range = config.longNoneMs - config.noneDebounceMs;
  const normalizedDist = distFromTypical / range;
  return 0.5 + 0.5 * Math.exp(-2 * normalizedDist * normalizedDist);
}
function updateGestureTransitionPredictor(currentGesture, currentTs, currentState, config) {
  if (currentGesture === "None") {
    const noneEnteredAt = currentState.noneEnteredAt ?? currentState.lastValidGestureTs;
    const msInNone = currentTs - noneEnteredAt;
    const shouldDebounce = msInNone < config.noneDebounceMs;
    const isDisengagement = msInNone >= config.longNoneMs;
    const likelyNext = predictNextGesture(currentState.lastValidGesture);
    const confidence = calculateConfidence(msInNone, config);
    return {
      likelyNext,
      confidence,
      msInNone,
      isDisengagement,
      shouldDebounce,
      state: {
        lastValidGesture: currentState.lastValidGesture,
        noneEnteredAt,
        lastValidGestureTs: currentState.lastValidGestureTs,
        noneFrameCount: currentState.noneFrameCount + 1
      }
    };
  } else {
    return {
      likelyNext: currentGesture,
      confidence: 1,
      msInNone: 0,
      isDisengagement: false,
      shouldDebounce: false,
      state: {
        lastValidGesture: currentGesture,
        noneEnteredAt: null,
        lastValidGestureTs: currentTs,
        noneFrameCount: 0
      }
    };
  }
}
function createGestureTransitionPredictor(config = {}) {
  const fullConfig = { ...DEFAULT_GESTURE_TRANSITION_CONFIG, ...config };
  let state = createGestureTransitionState();
  return {
    /**
     * Process frame and get prediction
     */
    process(gesture, ts2) {
      const result = updateGestureTransitionPredictor(gesture, ts2, state, fullConfig);
      state = result.state;
      return result;
    },
    /**
     * Reset predictor to initial state
     */
    reset() {
      state = createGestureTransitionState();
    },
    /**
     * Get current state (for debugging)
     */
    getState() {
      return { ...state };
    },
    /**
     * Get configuration (for debugging)
     */
    getConfig() {
      return { ...fullConfig };
    },
    /**
     * Get the last valid gesture
     */
    getLastValidGesture() {
      return state.lastValidGesture;
    },
    /**
     * Check if currently in None state
     */
    isInNone() {
      return state.noneEnteredAt !== null;
    }
  };
}

// hot/bronze/quarantine/one-euro-smoother.ts
var import_eurofilter2 = __toESM(require_dist(), 1);
var SmootherConfigSchema = external_exports.object({
  freq: external_exports.number().min(1).max(1e3).default(60),
  minCutoff: external_exports.number().min(0).max(10).default(1),
  beta: external_exports.number().min(0).max(10).default(7e-3),
  dCutoff: external_exports.number().min(0).max(10).default(1)
});
var Point2DSchema = external_exports.object({
  x: external_exports.number().finite(),
  y: external_exports.number().finite(),
  timestamp: external_exports.number().nonnegative()
});
var SmoothedPointSchema = Point2DSchema.extend({
  smoothedX: external_exports.number().finite(),
  smoothedY: external_exports.number().finite(),
  jitter: external_exports.number().nonnegative()
});
var OneEuroSmoother = class {
  constructor(config = {}) {
    __publicField(this, "filterX");
    __publicField(this, "filterY");
    __publicField(this, "config");
    this.config = SmootherConfigSchema.parse(config);
    this.filterX = new import_eurofilter2.OneEuroFilter(
      this.config.freq,
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    );
    this.filterY = new import_eurofilter2.OneEuroFilter(
      this.config.freq,
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    );
  }
  smooth(point) {
    const validated = Point2DSchema.parse(point);
    const smoothedX = this.filterX.filter(validated.x, validated.timestamp);
    const smoothedY = this.filterY.filter(validated.y, validated.timestamp);
    const dx = validated.x - smoothedX;
    const dy = validated.y - smoothedY;
    const jitter = Math.sqrt(dx * dx + dy * dy);
    return {
      x: validated.x,
      y: validated.y,
      timestamp: validated.timestamp,
      smoothedX,
      smoothedY,
      jitter
    };
  }
  reset() {
    this.filterX = new import_eurofilter2.OneEuroFilter(
      this.config.freq,
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    );
    this.filterY = new import_eurofilter2.OneEuroFilter(
      this.config.freq,
      this.config.minCutoff,
      this.config.beta,
      this.config.dCutoff
    );
  }
  setConfig(config) {
    this.config = SmootherConfigSchema.parse({ ...this.config, ...config });
    this.reset();
  }
  getConfig() {
    return { ...this.config };
  }
};

// hot/bronze/src/shared/trace-context.ts
function createTraceContext() {
  const version = "00";
  const traceId = crypto.randomUUID().replace(/-/g, "");
  const spanId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const flags = "01";
  return {
    traceparent: `${version}-${traceId}-${spanId}-${flags}`,
    tracestate: "hfo=gen87"
  };
}
function propagateTrace(parent) {
  const parts = parent.traceparent.split("-");
  if (parts.length !== 4) {
    return createTraceContext();
  }
  const [version, traceId, , flags] = parts;
  const newSpanId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return {
    traceparent: `${version}-${traceId}-${newSpanId}-${flags}`,
    tracestate: parent.tracestate
  };
}
function extractTraceId(traceparent) {
  const parts = traceparent.split("-");
  return parts.length >= 2 ? parts[1] ?? null : null;
}
function extractSpanId(traceparent) {
  const parts = traceparent.split("-");
  return parts.length >= 3 ? parts[2] ?? null : null;
}
function validateTraceparent(traceparent) {
  const regex = /^00-[a-f0-9]{32}-[a-f0-9]{16}-[a-f0-9]{2}$/;
  return regex.test(traceparent);
}
function isValidTraceparent(traceparent) {
  return validateTraceparent(traceparent);
}
function parseTraceparent(traceparent) {
  if (!validateTraceparent(traceparent)) {
    return null;
  }
  const parts = traceparent.split("-");
  const version = parts[0] ?? "";
  const traceId = parts[1] ?? "";
  const parentId = parts[2] ?? "";
  const flags = parts[3] ?? "";
  return {
    version,
    traceId,
    parentId,
    flags
  };
}
function getTraceId(ctx) {
  return extractTraceId(ctx.traceparent);
}
function getSpanId(ctx) {
  return extractSpanId(ctx.traceparent);
}
function isSampled(ctx) {
  const parsed = parseTraceparent(ctx.traceparent);
  if (!parsed) return false;
  const flags = Number.parseInt(parsed.flags, 16);
  return (flags & 1) === 1;
}
function createDeterministicTrace(seed) {
  const hash = (s2) => {
    let h2 = 0;
    for (let i2 = 0; i2 < s2.length; i2++) {
      h2 = (h2 << 5) - h2 + s2.charCodeAt(i2) | 0;
    }
    return Math.abs(h2).toString(16).padStart(8, "0");
  };
  const traceId = (hash(seed) + hash(seed + "1") + hash(seed + "2") + hash(seed + "3")).slice(
    0,
    32
  );
  const spanId = (hash(seed + "span") + hash(seed + "span2")).slice(0, 16);
  return {
    traceparent: `00-${traceId}-${spanId}-01`,
    tracestate: "hfo=gen87"
  };
}

// hot/bronze/src/pipeline/hfo-pipeline.ts
var NoisyLandmarkSchema = external_exports.object({
  x: external_exports.number().min(0).max(1),
  // Normalized 0-1
  y: external_exports.number().min(0).max(1),
  z: external_exports.number().optional(),
  timestamp: external_exports.number().positive(),
  confidence: external_exports.number().min(0).max(1).default(0.9)
});
var SensedFrameSchema = external_exports.object({
  _port: external_exports.literal(0),
  _verb: external_exports.literal("SENSE"),
  _ts: external_exports.string(),
  landmark: NoisyLandmarkSchema
});
var FusedFrameSchema = external_exports.object({
  _port: external_exports.literal(1),
  _verb: external_exports.literal("FUSE"),
  _ts: external_exports.string(),
  _traceId: external_exports.string(),
  payload: SensedFrameSchema
});
var ShapedFrameSchema = external_exports.object({
  _port: external_exports.literal(2),
  _verb: external_exports.literal("SHAPE"),
  _ts: external_exports.string(),
  raw: external_exports.object({ x: external_exports.number(), y: external_exports.number() }),
  smooth: external_exports.object({ x: external_exports.number(), y: external_exports.number() }),
  jitter: external_exports.number().nonnegative()
});
var SenseAdapter = class {
  sense(input) {
    const landmark = NoisyLandmarkSchema.parse(input);
    return {
      _port: 0,
      _verb: "SENSE",
      _ts: (/* @__PURE__ */ new Date()).toISOString(),
      landmark
    };
  }
};
var FuseAdapter = class {
  constructor() {
    __publicField(this, "currentTrace", null);
  }
  /**
   * Start a new trace (for new gesture sequences)
   */
  startNewTrace() {
    this.currentTrace = createTraceContext();
    return this.currentTrace;
  }
  /**
   * Get current trace context for external use
   */
  getTraceContext() {
    return this.currentTrace;
  }
  fuse(input) {
    SensedFrameSchema.parse(input);
    if (!this.currentTrace) {
      this.currentTrace = createTraceContext();
    } else {
      this.currentTrace = propagateTrace(this.currentTrace);
    }
    return {
      _port: 1,
      _verb: "FUSE",
      _ts: (/* @__PURE__ */ new Date()).toISOString(),
      _traceId: this.currentTrace.traceparent,
      // W3C format: 00-{traceId}-{spanId}-{flags}
      payload: input
    };
  }
  /**
   * Reset trace context (for testing or new sessions)
   */
  reset() {
    this.currentTrace = null;
  }
};
var ShapeSmootherAdapter = class {
  constructor(config) {
    __publicField(this, "smoother");
    this.smoother = new OneEuroSmoother({
      // Stryker disable next-line all: ?? vs && gives same result for undefined (both use default)
      freq: config?.freq ?? 60,
      // @source https://gery.casiez.net/1euro/ - Paper says start at 0, tune up
      // Stryker disable next-line all: ?? vs && gives same result for undefined (both use default)
      beta: config?.beta ?? 0,
      // Casiez default: 0.0 (no speed adaptation initially)
      // @source https://gery.casiez.net/1euro/ - Paper default 1.0 Hz
      minCutoff: config?.minCutoff ?? 1
    });
  }
  shape(input) {
    FusedFrameSchema.parse(input);
    const landmark = input.payload.landmark;
    const point = {
      x: landmark.x,
      y: landmark.y,
      timestamp: landmark.timestamp
    };
    const smoothed = this.smoother.smooth(point);
    return {
      _port: 2,
      _verb: "SHAPE",
      _ts: (/* @__PURE__ */ new Date()).toISOString(),
      raw: { x: landmark.x, y: landmark.y },
      smooth: { x: smoothed.smoothedX, y: smoothed.smoothedY },
      jitter: smoothed.jitter
    };
  }
  reset() {
    this.smoother.reset();
  }
};
var HFOPipeline = class {
  constructor(port0, port1, port2) {
    __publicField(this, "port0");
    __publicField(this, "port1");
    __publicField(this, "port2");
    this.port0 = port0 ?? new SenseAdapter();
    this.port1 = port1 ?? new FuseAdapter();
    this.port2 = port2 ?? new ShapeSmootherAdapter();
  }
  /**
   * Process a single frame through the pipeline
   * Input: Raw noisy landmark
   * Output: Smoothed coordinates
   */
  process(rawInput) {
    const sensed = this.port0.sense(rawInput);
    const fused = this.port1.fuse(sensed);
    const shaped = this.port2.shape(fused);
    return shaped;
  }
  /**
   * Process multiple frames (batch)
   */
  processBatch(inputs) {
    return inputs.map((input) => this.process(input));
  }
};

// hot/bronze/src/browser/index.ts
function createSensorFrameFromMouse(x2, y2, timestamp = performance.now()) {
  return {
    ts: timestamp,
    handId: "right",
    trackingOk: true,
    palmFacing: true,
    label: "Pointing_Up",
    confidence: 1,
    indexTip: { x: x2, y: y2, z: 0, visibility: 1 },
    landmarks: null
  };
}
function addJitter(value, jitterAmount = 0.01) {
  return value + (Math.random() - 0.5) * 2 * jitterAmount;
}
export {
  DEAD_ZONE_DEFAULT,
  DEAD_ZONE_MAX,
  DEAD_ZONE_MIN,
  DEFAULT_GESTURE_TRANSITION_CONFIG,
  DEFAULT_PALM_CONE_CONFIG,
  DoubleExponentialPredictor,
  FSMActionSchema,
  FSMStates,
  FuseAdapter,
  GestureLabels,
  GestureTransitionConfigSchema,
  HFOPipeline,
  HFOPortFactory,
  NormalizedLandmarkSchema,
  ONE_EURO_BETA_DEFAULT,
  ONE_EURO_DCUTOFF_DEFAULT,
  ONE_EURO_MINCUTOFF_DEFAULT,
  OneEuroExemplarAdapter,
  PalmConeConfigSchema,
  RAPIER_DAMPING_DEFAULT,
  RAPIER_STIFFNESS_DEFAULT,
  RAPIER_SUBSTEPS_DEFAULT,
  RapierPhysicsAdapter,
  SenseAdapter,
  SensorFrameSchema,
  ShapeSmootherAdapter,
  SmoothedFrameSchema,
  VideoFrameSchema,
  XStateFSMAdapter,
  addJitter,
  calculatePalmAngle,
  createAdaptiveRapierAdapter,
  createDeterministicTrace,
  createGestureTransitionPredictor,
  createGestureTransitionState,
  createPalmConeGate,
  createPalmConeGateState,
  createPredictiveRapierAdapter,
  createSensorFrameFromMouse,
  createTraceContext,
  extractSpanId,
  extractTraceId,
  getSpanId,
  getTraceId,
  isSampled,
  isValidTraceparent,
  parseTraceparent,
  propagateTrace,
  updateGestureTransitionPredictor,
  updatePalmConeGate,
  validateTraceparent
};
//# sourceMappingURL=hfo.js.map
