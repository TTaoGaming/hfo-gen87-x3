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
import * as fc from 'fast-check';
/**
 * SMOOTHER PIPELINE RED TESTS
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | TDD RED
 *
 * REQUIREMENT: 4-stage cursor pipeline with swappable smoothers
 * 1. Raw MediaPipe fingertip
 * 2. 1€ Filter (snappy/smooth)
 * 3. Physics spring-dampening cursor
 * 4. Predictive physics cursor
 *
 * HEXAGONAL CDD PRINCIPLE: Each smoother implements SmootherPort
 * and can be swapped via dependency injection.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { SmootherPort } from '../contracts/ports.js';
import type { SensorFrame } from '../contracts/schemas.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

/** Create a valid SensorFrame for testing */
function createSensorFrame(overrides?: Partial<SensorFrame>): SensorFrame {
  if (stryMutAct_9fa48("244")) {
    {}
  } else {
    stryCov_9fa48("244");
    return stryMutAct_9fa48("245") ? {} : (stryCov_9fa48("245"), {
      ts: 16.67,
      handId: 'right',
      trackingOk: stryMutAct_9fa48("247") ? false : (stryCov_9fa48("247"), true),
      palmFacing: stryMutAct_9fa48("248") ? false : (stryCov_9fa48("248"), true),
      label: 'Open_Palm',
      confidence: 0.95,
      indexTip: stryMutAct_9fa48("250") ? {} : (stryCov_9fa48("250"), {
        x: 0.5,
        y: 0.5,
        z: 0,
        visibility: 1
      }),
      landmarks: null,
      ...overrides
    });
  }
}

/** Arbitrary for SensorFrame position */
const arbPosition = fc.record(stryMutAct_9fa48("251") ? {} : (stryCov_9fa48("251"), {
  x: fc.double(stryMutAct_9fa48("252") ? {} : (stryCov_9fa48("252"), {
    min: 0.001,
    max: 0.999,
    noNaN: stryMutAct_9fa48("253") ? false : (stryCov_9fa48("253"), true)
  })),
  y: fc.double(stryMutAct_9fa48("254") ? {} : (stryCov_9fa48("254"), {
    min: 0.001,
    max: 0.999,
    noNaN: stryMutAct_9fa48("255") ? false : (stryCov_9fa48("255"), true)
  }))
}));

// ============================================================================
// RED TEST 1: OneEuroSmoother implements SmootherPort
// ============================================================================

describe('OneEuroSmoother (1€ Filter)', () => {
  if (stryMutAct_9fa48("257")) {
    {}
  } else {
    stryCov_9fa48("257");
    // These will FAIL until we create OneEuroSmoother class
    let smoother: SmootherPort;
    beforeEach(async () => {
      if (stryMutAct_9fa48("258")) {
        {}
      } else {
        stryCov_9fa48("258");
        // Dynamic import to test if module exists
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');
        smoother = new OneEuroSmoother(stryMutAct_9fa48("260") ? {} : (stryCov_9fa48("260"), {
          mincutoff: 1.0,
          beta: 0.007
        }));
      }
    });
    it('implements SmootherPort interface', () => {
      if (stryMutAct_9fa48("262")) {
        {}
      } else {
        stryCov_9fa48("262");
        expect(smoother.smooth).toBeTypeOf('function');
        expect(smoother.reset).toBeTypeOf('function');
        expect(smoother.setParams).toBeTypeOf('function');
      }
    });
    it('smooth() returns valid SmoothedFrame', () => {
      if (stryMutAct_9fa48("267")) {
        {}
      } else {
        stryCov_9fa48("267");
        const frame = createSensorFrame();
        const result = smoother.smooth(frame);
        expect(result.ts).toBe(frame.ts);
        expect(result.position).not.toBeNull();
        expect(result.velocity).not.toBeNull();
      }
    });
    it('first frame returns position equal to input (no history)', () => {
      if (stryMutAct_9fa48("269")) {
        {}
      } else {
        stryCov_9fa48("269");
        smoother.reset();
        const frame = createSensorFrame(stryMutAct_9fa48("270") ? {} : (stryCov_9fa48("270"), {
          indexTip: stryMutAct_9fa48("271") ? {} : (stryCov_9fa48("271"), {
            x: 0.3,
            y: 0.7,
            z: 0,
            visibility: 1
          })
        }));
        const result = smoother.smooth(frame);
        expect(stryMutAct_9fa48("272") ? result.position.x : (stryCov_9fa48("272"), result.position?.x)).toBeCloseTo(0.3, 2);
        expect(stryMutAct_9fa48("273") ? result.position.y : (stryCov_9fa48("273"), result.position?.y)).toBeCloseTo(0.7, 2);
      }
    });
    it('smooths between consecutive positions', () => {
      if (stryMutAct_9fa48("275")) {
        {}
      } else {
        stryCov_9fa48("275");
        fc.assert(fc.property(arbPosition, arbPosition, (pos1, pos2) => {
          if (stryMutAct_9fa48("276")) {
            {}
          } else {
            stryCov_9fa48("276");
            smoother.reset();
            const frame1 = createSensorFrame(stryMutAct_9fa48("277") ? {} : (stryCov_9fa48("277"), {
              ts: 0,
              indexTip: stryMutAct_9fa48("278") ? {} : (stryCov_9fa48("278"), {
                x: pos1.x,
                y: pos1.y,
                z: 0,
                visibility: 1
              })
            }));
            const frame2 = createSensorFrame(stryMutAct_9fa48("279") ? {} : (stryCov_9fa48("279"), {
              ts: 16.67,
              indexTip: stryMutAct_9fa48("280") ? {} : (stryCov_9fa48("280"), {
                x: pos2.x,
                y: pos2.y,
                z: 0,
                visibility: 1
              })
            }));
            smoother.smooth(frame1);
            const result = smoother.smooth(frame2);

            // Smoothed position should be between raw positions (lag)
            expect(result.position).not.toBeNull();
            // Velocity should be calculated
            expect(result.velocity).not.toBeNull();
          }
        }));
      }
    });
    it('reset() clears filter state', () => {
      if (stryMutAct_9fa48("282")) {
        {}
      } else {
        stryCov_9fa48("282");
        const frame1 = createSensorFrame(stryMutAct_9fa48("283") ? {} : (stryCov_9fa48("283"), {
          ts: 0
        }));
        const frame2 = createSensorFrame(stryMutAct_9fa48("284") ? {} : (stryCov_9fa48("284"), {
          ts: 16.67
        }));
        smoother.smooth(frame1);
        smoother.smooth(frame2);
        smoother.reset();

        // After reset, next frame should be treated as first frame
        const frame3 = createSensorFrame(stryMutAct_9fa48("285") ? {} : (stryCov_9fa48("285"), {
          ts: 100,
          indexTip: stryMutAct_9fa48("286") ? {} : (stryCov_9fa48("286"), {
            x: 0.9,
            y: 0.1,
            z: 0,
            visibility: 1
          })
        }));
        const result = smoother.smooth(frame3);

        // First frame after reset = no smoothing
        expect(stryMutAct_9fa48("287") ? result.position.x : (stryCov_9fa48("287"), result.position?.x)).toBeCloseTo(0.9, 2);
        expect(stryMutAct_9fa48("288") ? result.position.y : (stryCov_9fa48("288"), result.position?.y)).toBeCloseTo(0.1, 2);
      }
    });
    it('setParams() changes filter behavior', () => {
      if (stryMutAct_9fa48("290")) {
        {}
      } else {
        stryCov_9fa48("290");
        smoother.reset();

        // High beta = more responsive to velocity
        smoother.setParams(1.0, 1.0);
        const frame1 = createSensorFrame(stryMutAct_9fa48("291") ? {} : (stryCov_9fa48("291"), {
          ts: 0,
          indexTip: stryMutAct_9fa48("292") ? {} : (stryCov_9fa48("292"), {
            x: 0,
            y: 0,
            z: 0,
            visibility: 1
          })
        }));
        const frame2 = createSensorFrame(stryMutAct_9fa48("293") ? {} : (stryCov_9fa48("293"), {
          ts: 16.67,
          indexTip: stryMutAct_9fa48("294") ? {} : (stryCov_9fa48("294"), {
            x: 1,
            y: 1,
            z: 0,
            visibility: 1
          })
        }));
        smoother.smooth(frame1);
        const highBetaResult = smoother.smooth(frame2);
        smoother.reset();

        // Low beta = more lag
        smoother.setParams(1.0, 0.0);
        smoother.smooth(frame1);
        const lowBetaResult = smoother.smooth(frame2);

        // High beta should track faster (closer to target)
        expect(stryMutAct_9fa48("295") ? highBetaResult.position.x : (stryCov_9fa48("295"), highBetaResult.position?.x)).toBeGreaterThan(lowBetaResult.position!.x);
      }
    });
  }
});

// ============================================================================
// RED TEST 2: PhysicsSpringDamperSmoother
// ============================================================================

describe('PhysicsSpringDamperSmoother', () => {
  if (stryMutAct_9fa48("297")) {
    {}
  } else {
    stryCov_9fa48("297");
    let smoother: SmootherPort;
    beforeEach(async () => {
      if (stryMutAct_9fa48("298")) {
        {}
      } else {
        stryCov_9fa48("298");
        // This will FAIL - module doesn't exist yet
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');
        smoother = new PhysicsSpringDamperSmoother(stryMutAct_9fa48("300") ? {} : (stryCov_9fa48("300"), {
          stiffness: 300,
          // Spring constant (higher = snappier)
          damping: 20,
          // Damping ratio (higher = less oscillation)
          mass: 1 // Virtual mass
        }));
      }
    });
    it('implements SmootherPort interface', () => {
      if (stryMutAct_9fa48("302")) {
        {}
      } else {
        stryCov_9fa48("302");
        expect(smoother.smooth).toBeTypeOf('function');
        expect(smoother.reset).toBeTypeOf('function');
        expect(smoother.setParams).toBeTypeOf('function');
      }
    });
    it('smooth() returns valid SmoothedFrame with spring physics', () => {
      if (stryMutAct_9fa48("307")) {
        {}
      } else {
        stryCov_9fa48("307");
        const frame = createSensorFrame();
        const result = smoother.smooth(frame);
        expect(result.ts).toBe(frame.ts);
        expect(result.position).not.toBeNull();
        expect(result.velocity).not.toBeNull();
      }
    });
    it('exhibits spring behavior - overshoots then settles', () => {
      if (stryMutAct_9fa48("309")) {
        {}
      } else {
        stryCov_9fa48("309");
        smoother.reset();

        // Start at origin
        const frame1 = createSensorFrame(stryMutAct_9fa48("310") ? {} : (stryCov_9fa48("310"), {
          ts: 0,
          indexTip: stryMutAct_9fa48("311") ? {} : (stryCov_9fa48("311"), {
            x: 0.5,
            y: 0.5,
            z: 0,
            visibility: 1
          })
        }));
        smoother.smooth(frame1);

        // Jump to new position - spring should follow
        const targetX = 0.8;
        const positions: number[] = [];
        for (let t = 16.67; stryMutAct_9fa48("315") ? t >= 500 : stryMutAct_9fa48("314") ? t <= 500 : stryMutAct_9fa48("313") ? false : (stryCov_9fa48("313", "314", "315"), t < 500); stryMutAct_9fa48("316") ? t -= 16.67 : (stryCov_9fa48("316"), t += 16.67)) {
          if (stryMutAct_9fa48("317")) {
            {}
          } else {
            stryCov_9fa48("317");
            const frame = createSensorFrame(stryMutAct_9fa48("318") ? {} : (stryCov_9fa48("318"), {
              ts: t,
              indexTip: stryMutAct_9fa48("319") ? {} : (stryCov_9fa48("319"), {
                x: targetX,
                y: 0.5,
                z: 0,
                visibility: 1
              })
            }));
            const result = smoother.smooth(frame);
            positions.push(result.position!.x);
          }
        }

        // Should eventually converge to target
        const finalPos = positions[stryMutAct_9fa48("320") ? positions.length + 1 : (stryCov_9fa48("320"), positions.length - 1)];
        expect(finalPos).toBeCloseTo(targetX, 1);

        // Should show spring dynamics (not just exponential decay)
        // This is the key difference from 1€ filter
      }
    });
    it('damping prevents oscillation when critically damped', async () => {
      if (stryMutAct_9fa48("322")) {
        {}
      } else {
        stryCov_9fa48("322");
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');

        // Critically damped: zeta = c / (2 * sqrt(k * m)) = 1
        // c = 2 * sqrt(300 * 1) ≈ 34.6
        const criticallyDamped = new PhysicsSpringDamperSmoother(stryMutAct_9fa48("324") ? {} : (stryCov_9fa48("324"), {
          stiffness: 300,
          damping: 34.6,
          mass: 1
        }));
        criticallyDamped.reset();
        const frame1 = createSensorFrame(stryMutAct_9fa48("325") ? {} : (stryCov_9fa48("325"), {
          ts: 0,
          indexTip: stryMutAct_9fa48("326") ? {} : (stryCov_9fa48("326"), {
            x: 0.2,
            y: 0.5,
            z: 0,
            visibility: 1
          })
        }));
        criticallyDamped.smooth(frame1);
        const targetX = 0.8;
        let crossedTarget = 0;
        for (let t = 16.67; stryMutAct_9fa48("329") ? t >= 500 : stryMutAct_9fa48("328") ? t <= 500 : stryMutAct_9fa48("327") ? false : (stryCov_9fa48("327", "328", "329"), t < 500); stryMutAct_9fa48("330") ? t -= 16.67 : (stryCov_9fa48("330"), t += 16.67)) {
          if (stryMutAct_9fa48("331")) {
            {}
          } else {
            stryCov_9fa48("331");
            const frame = createSensorFrame(stryMutAct_9fa48("332") ? {} : (stryCov_9fa48("332"), {
              ts: t,
              indexTip: stryMutAct_9fa48("333") ? {} : (stryCov_9fa48("333"), {
                x: targetX,
                y: 0.5,
                z: 0,
                visibility: 1
              })
            }));
            const result = criticallyDamped.smooth(frame);
            if (stryMutAct_9fa48("337") ? result.position!.x <= targetX : stryMutAct_9fa48("336") ? result.position!.x >= targetX : stryMutAct_9fa48("335") ? false : stryMutAct_9fa48("334") ? true : (stryCov_9fa48("334", "335", "336", "337"), result.position!.x > targetX)) stryMutAct_9fa48("338") ? crossedTarget-- : (stryCov_9fa48("338"), crossedTarget++);
          }
        }

        // Critically damped should not overshoot significantly
        expect(crossedTarget).toBeLessThan(3);
      }
    });
  }
});

// ============================================================================
// RED TEST 3: PredictiveSmoother (physics-based prediction)
// ============================================================================

describe('PredictiveSmoother', () => {
  if (stryMutAct_9fa48("340")) {
    {}
  } else {
    stryCov_9fa48("340");
    let smoother: SmootherPort;
    beforeEach(async () => {
      if (stryMutAct_9fa48("341")) {
        {}
      } else {
        stryCov_9fa48("341");
        // This will FAIL - module doesn't exist yet
        const {
          PredictiveSmoother
        } = await import('./predictive-smoother.js');
        smoother = new PredictiveSmoother(stryMutAct_9fa48("343") ? {} : (stryCov_9fa48("343"), {
          predictionMs: 50,
          // How far ahead to predict
          usePhysics: stryMutAct_9fa48("344") ? false : (stryCov_9fa48("344"), true) // Use spring model for prediction
        }));
      }
    });
    it('implements SmootherPort interface', () => {
      if (stryMutAct_9fa48("346")) {
        {}
      } else {
        stryCov_9fa48("346");
        expect(smoother.smooth).toBeTypeOf('function');
        expect(smoother.reset).toBeTypeOf('function');
        expect(smoother.setParams).toBeTypeOf('function');
      }
    });
    it('smooth() returns prediction field', () => {
      if (stryMutAct_9fa48("351")) {
        {}
      } else {
        stryCov_9fa48("351");
        const frame = createSensorFrame();
        const result = smoother.smooth(frame);
        expect(result.prediction).not.toBeNull();
        expect(stryMutAct_9fa48("352") ? result.prediction.x : (stryCov_9fa48("352"), result.prediction?.x)).toBeTypeOf('number');
        expect(stryMutAct_9fa48("354") ? result.prediction.y : (stryCov_9fa48("354"), result.prediction?.y)).toBeTypeOf('number');
      }
    });
    it('prediction is ahead of current position when moving', () => {
      if (stryMutAct_9fa48("357")) {
        {}
      } else {
        stryCov_9fa48("357");
        smoother.reset();

        // Build up velocity moving right
        for (let t = 0; stryMutAct_9fa48("360") ? t >= 100 : stryMutAct_9fa48("359") ? t <= 100 : stryMutAct_9fa48("358") ? false : (stryCov_9fa48("358", "359", "360"), t < 100); stryMutAct_9fa48("361") ? t -= 16.67 : (stryCov_9fa48("361"), t += 16.67)) {
          if (stryMutAct_9fa48("362")) {
            {}
          } else {
            stryCov_9fa48("362");
            const frame = createSensorFrame(stryMutAct_9fa48("363") ? {} : (stryCov_9fa48("363"), {
              ts: t,
              indexTip: stryMutAct_9fa48("364") ? {} : (stryCov_9fa48("364"), {
                x: stryMutAct_9fa48("365") ? 0.3 - t * 0.001 : (stryCov_9fa48("365"), 0.3 + (stryMutAct_9fa48("366") ? t / 0.001 : (stryCov_9fa48("366"), t * 0.001))),
                y: 0.5,
                z: 0,
                visibility: 1
              })
            }));
            smoother.smooth(frame);
          }
        }

        // Now check prediction
        const frame = createSensorFrame(stryMutAct_9fa48("367") ? {} : (stryCov_9fa48("367"), {
          ts: 100,
          indexTip: stryMutAct_9fa48("368") ? {} : (stryCov_9fa48("368"), {
            x: 0.4,
            y: 0.5,
            z: 0,
            visibility: 1
          })
        }));
        const result = smoother.smooth(frame);

        // Prediction should be ahead of current position (to the right)
        expect(result.prediction!.x).toBeGreaterThan(result.position!.x);
      }
    });
    it('prediction bounds stay within 0-1 range', () => {
      if (stryMutAct_9fa48("370")) {
        {}
      } else {
        stryCov_9fa48("370");
        smoother.reset();

        // Moving fast toward edge
        for (let t = 0; stryMutAct_9fa48("373") ? t >= 100 : stryMutAct_9fa48("372") ? t <= 100 : stryMutAct_9fa48("371") ? false : (stryCov_9fa48("371", "372", "373"), t < 100); stryMutAct_9fa48("374") ? t -= 16.67 : (stryCov_9fa48("374"), t += 16.67)) {
          if (stryMutAct_9fa48("375")) {
            {}
          } else {
            stryCov_9fa48("375");
            const frame = createSensorFrame(stryMutAct_9fa48("376") ? {} : (stryCov_9fa48("376"), {
              ts: t,
              indexTip: stryMutAct_9fa48("377") ? {} : (stryCov_9fa48("377"), {
                x: stryMutAct_9fa48("378") ? 0.9 - t * 0.002 : (stryCov_9fa48("378"), 0.9 + (stryMutAct_9fa48("379") ? t / 0.002 : (stryCov_9fa48("379"), t * 0.002))),
                y: 0.5,
                z: 0,
                visibility: 1
              })
            }));
            const result = smoother.smooth(frame);

            // Even with high velocity, prediction should be clamped
            if (stryMutAct_9fa48("381") ? false : stryMutAct_9fa48("380") ? true : (stryCov_9fa48("380", "381"), result.prediction)) {
              if (stryMutAct_9fa48("382")) {
                {}
              } else {
                stryCov_9fa48("382");
                expect(result.prediction.x).toBeLessThanOrEqual(1);
                expect(result.prediction.x).toBeGreaterThanOrEqual(0);
              }
            }
          }
        }
      }
    });
  }
});

// ============================================================================
// RED TEST 4: SmootherChain - Composable pipeline
// ============================================================================

describe('SmootherChain (Composable Pipeline)', () => {
  if (stryMutAct_9fa48("384")) {
    {}
  } else {
    stryCov_9fa48("384");
    it('chains multiple smoothers in sequence', async () => {
      if (stryMutAct_9fa48("386")) {
        {}
      } else {
        stryCov_9fa48("386");
        // This tests the hexagonal swappability
        const {
          SmootherChain
        } = await import('./smoother-chain.js');
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');
        const chain = new SmootherChain([new OneEuroSmoother(stryMutAct_9fa48("391") ? {} : (stryCov_9fa48("391"), {
          mincutoff: 1.0,
          beta: 0.007
        })), new PhysicsSpringDamperSmoother(stryMutAct_9fa48("392") ? {} : (stryCov_9fa48("392"), {
          stiffness: 300,
          damping: 20,
          mass: 1
        }))]);
        const frame = createSensorFrame();
        const result = chain.smooth(frame);
        expect(result.position).not.toBeNull();
      }
    });
    it('allows runtime smoother swap', async () => {
      if (stryMutAct_9fa48("394")) {
        {}
      } else {
        stryCov_9fa48("394");
        const {
          SmootherChain
        } = await import('./smoother-chain.js');
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');
        const euro = new OneEuroSmoother(stryMutAct_9fa48("398") ? {} : (stryCov_9fa48("398"), {
          mincutoff: 1.0,
          beta: 0.007
        }));
        const spring = new PhysicsSpringDamperSmoother(stryMutAct_9fa48("399") ? {} : (stryCov_9fa48("399"), {
          stiffness: 300,
          damping: 20,
          mass: 1
        }));
        const chain = new SmootherChain([euro]);
        const frame = createSensorFrame();

        // Use 1€ filter
        const result1 = chain.smooth(frame);
        expect(result1).toBeDefined();

        // Swap to spring
        chain.setSmoothers([spring]);
        const result2 = chain.smooth(frame);
        expect(result2).toBeDefined();

        // Chain both
        chain.setSmoothers([euro, spring]);
        const result3 = chain.smooth(frame);
        expect(result3).toBeDefined();
      }
    });
    it('reset() resets all smoothers in chain', async () => {
      if (stryMutAct_9fa48("404")) {
        {}
      } else {
        stryCov_9fa48("404");
        const {
          SmootherChain
        } = await import('./smoother-chain.js');
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');
        const chain = new SmootherChain([new OneEuroSmoother(stryMutAct_9fa48("409") ? {} : (stryCov_9fa48("409"), {
          mincutoff: 1.0,
          beta: 0.007
        })), new PhysicsSpringDamperSmoother(stryMutAct_9fa48("410") ? {} : (stryCov_9fa48("410"), {
          stiffness: 300,
          damping: 20,
          mass: 1
        }))]);

        // Build up state
        for (let t = 0; stryMutAct_9fa48("413") ? t >= 100 : stryMutAct_9fa48("412") ? t <= 100 : stryMutAct_9fa48("411") ? false : (stryCov_9fa48("411", "412", "413"), t < 100); stryMutAct_9fa48("414") ? t -= 16.67 : (stryCov_9fa48("414"), t += 16.67)) {
          if (stryMutAct_9fa48("415")) {
            {}
          } else {
            stryCov_9fa48("415");
            chain.smooth(createSensorFrame(stryMutAct_9fa48("416") ? {} : (stryCov_9fa48("416"), {
              ts: t,
              indexTip: stryMutAct_9fa48("417") ? {} : (stryCov_9fa48("417"), {
                x: stryMutAct_9fa48("418") ? t / 0.01 : (stryCov_9fa48("418"), t * 0.01),
                y: 0.5,
                z: 0,
                visibility: 1
              })
            })));
          }
        }
        chain.reset();

        // After reset, first frame should not be smoothed
        const frame = createSensorFrame(stryMutAct_9fa48("419") ? {} : (stryCov_9fa48("419"), {
          ts: 200,
          indexTip: stryMutAct_9fa48("420") ? {} : (stryCov_9fa48("420"), {
            x: 0.9,
            y: 0.1,
            z: 0,
            visibility: 1
          })
        }));
        const result = chain.smooth(frame);
        expect(stryMutAct_9fa48("421") ? result.position.x : (stryCov_9fa48("421"), result.position?.x)).toBeCloseTo(0.9, 1);
      }
    });
  }
});

// ============================================================================
// RED TEST 5: Quad cursor output (4 positions per frame)
// ============================================================================

describe('QuadCursorPipeline', () => {
  if (stryMutAct_9fa48("423")) {
    {}
  } else {
    stryCov_9fa48("423");
    it('outputs 4 cursor positions per frame', async () => {
      if (stryMutAct_9fa48("425")) {
        {}
      } else {
        stryCov_9fa48("425");
        const {
          QuadCursorPipeline
        } = await import('./quad-cursor-pipeline.js');
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');
        const {
          PhysicsSpringDamperSmoother
        } = await import('./physics-spring-smoother.js');
        const {
          PredictiveSmoother
        } = await import('./predictive-smoother.js');
        const pipeline = new QuadCursorPipeline(stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
          euro: new OneEuroSmoother(stryMutAct_9fa48("431") ? {} : (stryCov_9fa48("431"), {
            mincutoff: 1.0,
            beta: 0.007
          })),
          spring: new PhysicsSpringDamperSmoother(stryMutAct_9fa48("432") ? {} : (stryCov_9fa48("432"), {
            stiffness: 300,
            damping: 20,
            mass: 1
          })),
          predictive: new PredictiveSmoother(stryMutAct_9fa48("433") ? {} : (stryCov_9fa48("433"), {
            predictionMs: 50,
            usePhysics: stryMutAct_9fa48("434") ? false : (stryCov_9fa48("434"), true)
          }))
        }));
        const frame = createSensorFrame(stryMutAct_9fa48("435") ? {} : (stryCov_9fa48("435"), {
          indexTip: stryMutAct_9fa48("436") ? {} : (stryCov_9fa48("436"), {
            x: 0.5,
            y: 0.5,
            z: 0,
            visibility: 1
          })
        }));
        const result = pipeline.process(frame);
        expect(result.raw).toBeDefined();
        expect(result.euro).toBeDefined();
        expect(result.spring).toBeDefined();
        expect(result.predictive).toBeDefined();

        // All 4 positions in valid range
        expect(result.raw.x).toBeGreaterThanOrEqual(0);
        expect(result.euro.x).toBeGreaterThanOrEqual(0);
        expect(result.spring.x).toBeGreaterThanOrEqual(0);
        expect(result.predictive.x).toBeGreaterThanOrEqual(0);
      }
    });
    it('each stage can be independently disabled', async () => {
      if (stryMutAct_9fa48("438")) {
        {}
      } else {
        stryCov_9fa48("438");
        const {
          QuadCursorPipeline
        } = await import('./quad-cursor-pipeline.js');
        const {
          OneEuroSmoother
        } = await import('./one-euro-smoother.js');

        // Only 1€ filter enabled
        const pipeline = new QuadCursorPipeline(stryMutAct_9fa48("441") ? {} : (stryCov_9fa48("441"), {
          euro: new OneEuroSmoother(stryMutAct_9fa48("442") ? {} : (stryCov_9fa48("442"), {
            mincutoff: 1.0,
            beta: 0.007
          })),
          spring: null,
          predictive: null
        }));
        const frame = createSensorFrame();
        const result = pipeline.process(frame);
        expect(result.raw).toBeDefined();
        expect(result.euro).toBeDefined();
        expect(result.spring).toBeNull();
        expect(result.predictive).toBeNull();
      }
    });
  }
});

// ============================================================================
// Property-based test: Smoother contract compliance
// ============================================================================

describe('SmootherPort contract compliance (property-based)', () => {
  if (stryMutAct_9fa48("444")) {
    {}
  } else {
    stryCov_9fa48("444");
    // TODO: Phase V - Enable after all SmootherPort implementations verified
    it.skip('any smoother preserves timestamp', async () => {
      if (stryMutAct_9fa48("446")) {
        {}
      } else {
        stryCov_9fa48("446");
        fc.assert(fc.asyncProperty(arbPosition, async pos => {
          if (stryMutAct_9fa48("447")) {
            {}
          } else {
            stryCov_9fa48("447");
            // This will test all smoothers implement the contract correctly
            const {
              OneEuroSmoother
            } = await import('./one-euro-smoother.js');
            const smoother = new OneEuroSmoother(stryMutAct_9fa48("449") ? {} : (stryCov_9fa48("449"), {
              mincutoff: 1.0,
              beta: 0.007
            }));
            const ts = stryMutAct_9fa48("450") ? Math.random() / 10000 : (stryCov_9fa48("450"), Math.random() * 10000);
            const frame = createSensorFrame(stryMutAct_9fa48("451") ? {} : (stryCov_9fa48("451"), {
              ts,
              indexTip: stryMutAct_9fa48("452") ? {} : (stryCov_9fa48("452"), {
                x: pos.x,
                y: pos.y,
                z: 0,
                visibility: 1
              })
            }));
            const result = smoother.smooth(frame);
            expect(result.ts).toBe(ts);
          }
        }));
      }
    });
  }
});