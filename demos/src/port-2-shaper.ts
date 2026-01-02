/**
 * Port 2 - Shaper Demo (Mirror Magus) - REAL ADAPTERS
 * 
 * Gen87.X3 | SHAPE | Smoothing Algorithms + FSM + W3C Trace
 * 
 * @port 2
 * @verb SHAPE
 * @binary 010
 * @element Water - Flowing, taking shape of container
 * 
 * This demo uses REAL adapters from hot/bronze/src/browser:
 * - OneEuroExemplarAdapter (Casiez CHI 2012)
 * - DoubleExponentialPredictor (LaViola 2003)
 * - Simple Moving Average (baseline, not an HFO adapter)
 * 
 * CAN: read, transform, tag
 * CANNOT: persist, decide, emit_output, invoke_external
 */

import {
  // REAL ADAPTERS
  OneEuroExemplarAdapter,
  DoubleExponentialPredictor,
  // Types
  type SensorFrame,
  type SmoothedFrame,
  // Utilities
  createSensorFrameFromMouse,
} from '../../hot/bronze/src/browser/index.js';

import { 
  createTraceContext, 
  propagateTrace, 
  validateTraceparent,
  extractTraceId,
  extractSpanId,
  type TraceContext 
} from '../../hot/bronze/src/shared/trace-context.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION
// ============================================================================

// Port 2 - 1€ Filter (REAL - npm 1eurofilter by Casiez)
const oneEuroSmoother = new OneEuroExemplarAdapter({ minCutoff: 1.0, beta: 0.007 });

// Port 2 - DESP (REAL - LaViola 2003)
const despSmoother = new DoubleExponentialPredictor({ alpha: 0.5, gamma: 0.5 });

// Simple Moving Average (baseline comparison, not an HFO adapter)
class SimpleMovingAverage {
  private bufferX: number[] = [];
  private bufferY: number[] = [];
  
  constructor(private windowSize: number = 5) {}
  
  smooth(frame: SensorFrame): SmoothedFrame {
    const x = frame.indexTip?.x ?? 0.5;
    const y = frame.indexTip?.y ?? 0.5;
    
    this.bufferX.push(x);
    this.bufferY.push(y);
    
    if (this.bufferX.length > this.windowSize) {
      this.bufferX.shift();
      this.bufferY.shift();
    }
    
    const avgX = this.bufferX.reduce((a, b) => a + b, 0) / this.bufferX.length;
    const avgY = this.bufferY.reduce((a, b) => a + b, 0) / this.bufferY.length;
    
    return {
      ts: frame.ts,
      handId: frame.handId,
      trackingOk: frame.trackingOk,
      palmFacing: frame.palmFacing,
      label: frame.label,
      confidence: frame.confidence,
      position: { x: avgX, y: avgY },
      velocity: { x: 0, y: 0 },
      jitter: 0,
      filterType: 'moving-average',
      source: 'port-2-demo',
    };
  }
  
  reset(): void {
    this.bufferX = [];
    this.bufferY = [];
  }
}

const maSmoother = new SimpleMovingAverage(5);

// ============================================================================
// FSM STATES (W3C Trace Context Demo)
// ============================================================================

type FSMState = 'DISARMED' | 'ARMING' | 'ARMED' | 'DOWN_COMMIT' | 'DOWN_NAV' | 'ZOOM';

interface FSMContext {
  state: FSMState;
  trace: TraceContext;
}

// ============================================================================
// DEMO STATE
// ============================================================================

interface DemoState {
  rawHistory: Array<{ x: number; y: number }>;
  euroHistory: Array<{ x: number; y: number }>;
  despHistory: Array<{ x: number; y: number }>;
  maHistory: Array<{ x: number; y: number }>;
  fsm: FSMContext;
  transitionCount: number;
}

const state: DemoState = {
  rawHistory: [],
  euroHistory: [],
  despHistory: [],
  maHistory: [],
  fsm: {
    state: 'DISARMED',
    trace: createTraceContext(),
  },
  transitionCount: 0,
};

const MAX_HISTORY = 100;

// ============================================================================
// DOM SETUP
// ============================================================================

function createDemoUI(): void {
  const container = document.getElementById('app') ?? document.body;
  container.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0d1117; 
        color: #c9d1d9; 
        min-height: 100vh;
        padding: 20px;
      }
      .header { 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #30363d;
      }
      .header h1 { font-size: 1.4rem; }
      .badge { 
        background: #58a6ff; 
        color: #000; 
        padding: 4px 12px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
        font-weight: bold; 
      }
      .badge.real { background: #3fb950; }
      .grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 20px; 
        margin-bottom: 20px;
      }
      .card { 
        background: #161b22; 
        border: 1px solid #30363d; 
        border-radius: 8px; 
        padding: 16px; 
      }
      .card h3 { 
        font-size: 1rem; 
        margin-bottom: 12px; 
        color: #58a6ff;
      }
      canvas { 
        width: 100%; 
        height: 200px; 
        background: #0d1117; 
        border-radius: 4px;
      }
      .stats { 
        display: flex; 
        gap: 20px; 
        margin-top: 12px; 
        font-size: 0.85rem;
      }
      .stat-label { color: #8b949e; }
      .stat-value { color: #f0883e; font-weight: bold; }
      .trace-display {
        font-family: 'Cascadia Code', 'SF Mono', monospace;
        font-size: 0.75rem;
        background: #0d1117;
        padding: 12px;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .trace-valid { color: #3fb950; }
      .trace-invalid { color: #f85149; }
      .fsm-states {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }
      .fsm-state {
        padding: 8px 16px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        font-size: 0.8rem;
        transition: all 0.2s;
      }
      .fsm-state.active {
        background: #238636;
        border-color: #238636;
        color: white;
      }
      .controls {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      button {
        padding: 8px 16px;
        background: #21262d;
        border: 1px solid #30363d;
        border-radius: 4px;
        color: #c9d1d9;
        cursor: pointer;
        font-size: 0.8rem;
      }
      button:hover {
        background: #30363d;
      }
    </style>
    
    <div class="header">
      <h1>Port 2: Shaper — Mirror Magus</h1>
      <span class="badge">SHAPE</span>
      <span class="badge real">REAL ADAPTERS</span>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>1€ Filter (OneEuroExemplarAdapter)</h3>
        <canvas id="canvasEuro"></canvas>
        <div class="stats">
          <span class="stat-label">Jitter:</span>
          <span class="stat-value" id="euroJitter">0.0000</span>
        </div>
      </div>
      
      <div class="card">
        <h3>DESP (DoubleExponentialPredictor)</h3>
        <canvas id="canvasDesp"></canvas>
        <div class="stats">
          <span class="stat-label">Jitter:</span>
          <span class="stat-value" id="despJitter">0.0000</span>
        </div>
      </div>
      
      <div class="card">
        <h3>Moving Average (Baseline)</h3>
        <canvas id="canvasMA"></canvas>
        <div class="stats">
          <span class="stat-label">Jitter:</span>
          <span class="stat-value" id="maJitter">0.0000</span>
        </div>
      </div>
      
      <div class="card">
        <h3>Raw Input</h3>
        <canvas id="canvasRaw"></canvas>
        <div class="stats">
          <span class="stat-label">Jitter:</span>
          <span class="stat-value" id="rawJitter">0.0000</span>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h3>FSM State Machine + W3C Trace Context</h3>
      <div class="fsm-states">
        <div class="fsm-state active" id="fsm-DISARMED">DISARMED</div>
        <div class="fsm-state" id="fsm-ARMING">ARMING</div>
        <div class="fsm-state" id="fsm-ARMED">ARMED</div>
        <div class="fsm-state" id="fsm-DOWN_COMMIT">DOWN_COMMIT</div>
        <div class="fsm-state" id="fsm-DOWN_NAV">DOWN_NAV</div>
        <div class="fsm-state" id="fsm-ZOOM">ZOOM</div>
      </div>
      <div class="trace-display" id="traceDisplay">Loading trace context...</div>
      <div class="controls">
        <button id="btnArm">ARM</button>
        <button id="btnClick">CLICK</button>
        <button id="btnPan">PAN</button>
        <button id="btnDisarm">DISARM</button>
        <button id="btnReset">RESET</button>
      </div>
    </div>
  `;
}

// ============================================================================
// CANVAS RENDERING
// ============================================================================

function drawPath(ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>, color: string): void {
  if (points.length < 2) return;
  
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const padding = 20;
  
  points.forEach((p, i) => {
    const x = padding + (i / (MAX_HISTORY - 1)) * (width - 2 * padding);
    const y = height - padding - p.y * (height - 2 * padding);
    
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.stroke();
}

function renderCanvas(canvasId: string, history: Array<{ x: number; y: number }>, color: string): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Set actual canvas resolution
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  // Clear
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, rect.width, rect.height);
  
  // Draw grid
  ctx.strokeStyle = '#21262d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = rect.height * (i / 10);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }
  
  // Draw path
  drawPath(ctx, history, color);
}

// ============================================================================
// JITTER CALCULATION
// ============================================================================

function calculateJitter(history: Array<{ x: number; y: number }>): number {
  if (history.length < 2) return 0;
  
  let totalJitter = 0;
  for (let i = 1; i < history.length; i++) {
    const dx = history[i].x - history[i - 1].x;
    const dy = history[i].y - history[i - 1].y;
    totalJitter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return totalJitter / (history.length - 1);
}

// ============================================================================
// FSM LOGIC
// ============================================================================

function transitionFSM(newState: FSMState): void {
  if (state.fsm.state !== newState) {
    state.fsm.state = newState;
    state.fsm.trace = propagateTrace(state.fsm.trace);
    state.transitionCount++;
    updateFSMDisplay();
  }
}

function updateFSMDisplay(): void {
  // Update state badges
  document.querySelectorAll('.fsm-state').forEach(el => el.classList.remove('active'));
  document.getElementById(`fsm-${state.fsm.state}`)?.classList.add('active');
  
  // Update trace display
  const traceEl = document.getElementById('traceDisplay');
  if (traceEl) {
    const isValid = validateTraceparent(state.fsm.trace.traceparent);
    traceEl.className = `trace-display ${isValid ? 'trace-valid' : 'trace-invalid'}`;
    traceEl.textContent = 
      `traceparent: ${state.fsm.trace.traceparent}\n` +
      `tracestate:  ${state.fsm.trace.tracestate}\n` +
      `────────────────────────────────────────────\n` +
      `traceId:     ${extractTraceId(state.fsm.trace.traceparent)}\n` +
      `spanId:      ${extractSpanId(state.fsm.trace.traceparent)}\n` +
      `valid:       ${isValid ? '✅ W3C Compliant' : '❌ Invalid'}\n` +
      `transitions: ${state.transitionCount}`;
  }
}

// ============================================================================
// MAIN DEMO LOOP
// ============================================================================

function processFrame(mouseX: number, mouseY: number): void {
  const ts = performance.now();
  
  // Add jitter to simulate noisy input
  const noise = 0.02;
  const rawX = Math.max(0, Math.min(1, mouseX + (Math.random() - 0.5) * noise));
  const rawY = Math.max(0, Math.min(1, mouseY + (Math.random() - 0.5) * noise));
  
  // Create SensorFrame using REAL utility
  const sensorFrame: SensorFrame = createSensorFrameFromMouse(rawX, rawY, ts);
  
  // Apply REAL smoothers
  const euroResult: SmoothedFrame = oneEuroSmoother.smooth(sensorFrame);
  const despResult: SmoothedFrame = despSmoother.smooth(sensorFrame);
  const maResult: SmoothedFrame = maSmoother.smooth(sensorFrame);
  
  // Update histories
  const addToHistory = (arr: Array<{ x: number; y: number }>, x: number, y: number) => {
    arr.push({ x, y });
    if (arr.length > MAX_HISTORY) arr.shift();
  };
  
  addToHistory(state.rawHistory, rawX, rawY);
  addToHistory(state.euroHistory, euroResult.position.x, euroResult.position.y);
  addToHistory(state.despHistory, despResult.position.x, despResult.position.y);
  addToHistory(state.maHistory, maResult.position.x, maResult.position.y);
  
  // Render canvases
  renderCanvas('canvasRaw', state.rawHistory, '#ff6b6b');
  renderCanvas('canvasEuro', state.euroHistory, '#58a6ff');
  renderCanvas('canvasDesp', state.despHistory, '#a371f7');
  renderCanvas('canvasMA', state.maHistory, '#3fb950');
  
  // Update jitter stats
  document.getElementById('rawJitter')!.textContent = calculateJitter(state.rawHistory).toFixed(4);
  document.getElementById('euroJitter')!.textContent = calculateJitter(state.euroHistory).toFixed(4);
  document.getElementById('despJitter')!.textContent = calculateJitter(state.despHistory).toFixed(4);
  document.getElementById('maJitter')!.textContent = calculateJitter(state.maHistory).toFixed(4);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export function startPort2Demo(): void {
  createDemoUI();
  updateFSMDisplay();
  
  // FSM button handlers
  document.getElementById('btnArm')?.addEventListener('click', () => {
    if (state.fsm.state === 'DISARMED') transitionFSM('ARMING');
    else if (state.fsm.state === 'ARMING') transitionFSM('ARMED');
  });
  
  document.getElementById('btnClick')?.addEventListener('click', () => {
    if (state.fsm.state === 'ARMED') transitionFSM('DOWN_COMMIT');
    else if (state.fsm.state === 'DOWN_COMMIT') transitionFSM('ARMED');
  });
  
  document.getElementById('btnPan')?.addEventListener('click', () => {
    if (state.fsm.state === 'ARMED') transitionFSM('DOWN_NAV');
    else if (state.fsm.state === 'DOWN_NAV') transitionFSM('ARMED');
  });
  
  document.getElementById('btnDisarm')?.addEventListener('click', () => {
    transitionFSM('DISARMED');
  });
  
  document.getElementById('btnReset')?.addEventListener('click', () => {
    state.fsm.trace = createTraceContext();
    state.transitionCount = 0;
    transitionFSM('DISARMED');
    oneEuroSmoother.reset();
    despSmoother.reset();
    maSmoother.reset();
    state.rawHistory = [];
    state.euroHistory = [];
    state.despHistory = [];
    state.maHistory = [];
  });
  
  // Mouse tracking
  let mouseX = 0.5;
  let mouseY = 0.5;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = 1 - (e.clientY / window.innerHeight);
  });
  
  // Animation loop
  function loop(): void {
    processFrame(mouseX, mouseY);
    requestAnimationFrame(loop);
  }
  
  loop();
}

// Auto-start
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('app')) {
      const app = document.createElement('div');
      app.id = 'app';
      document.body.appendChild(app);
    }
    startPort2Demo();
  });
}
