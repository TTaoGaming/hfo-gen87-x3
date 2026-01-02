/**
 * Port 3 - Injector Demo (Spore Storm)
 *
 * Gen87.X3 | DELIVER | Output Emission & Pointer Events
 *
 * @port 3
 * @verb DELIVER
 * @binary 011
 * @element Wind - Carries seeds, spreads influence
 *
 * This demo shows:
 * 1. Pointer event emission (pointermove, pointerdown, pointerup)
 * 2. FSM action → DOM event translation
 * 3. Blackboard signal emission
 * 4. Event stream visualization
 *
 * CAN: read, emit_output, invoke_external, tag
 * CANNOT: decide, persist, validate, transform
 */

import {
	type TraceContext,
	createTraceContext,
	propagateTrace,
} from '../../hot/bronze/src/shared/trace-context.js';

// ============================================================================
// POINTER EVENT TYPES
// ============================================================================

interface HFOPointerEvent {
	type: 'pointermove' | 'pointerdown' | 'pointerup' | 'pointercancel';
	clientX: number;
	clientY: number;
	button: number; // 0 = primary, 1 = middle, 2 = secondary
	pressure: number;
	timestamp: number;
	traceId: string;
}

interface BlackboardSignal {
	ts: string;
	mark: number;
	pull: 'upstream' | 'downstream' | 'lateral';
	msg: string;
	type: 'signal' | 'event' | 'error' | 'metric';
	hive: 'H' | 'I' | 'V' | 'E' | 'X';
	gen: number;
	port: number;
}

// ============================================================================
// EVENT STREAM
// ============================================================================

class EventStream {
	private events: HFOPointerEvent[] = [];
	private signals: BlackboardSignal[] = [];
	private maxEvents = 50;
	private listeners: Set<(events: HFOPointerEvent[], signals: BlackboardSignal[]) => void> =
		new Set();

	emit(event: HFOPointerEvent): void {
		this.events.push(event);
		if (this.events.length > this.maxEvents) {
			this.events.shift();
		}
		this.notify();
	}

	emitSignal(signal: BlackboardSignal): void {
		this.signals.push(signal);
		if (this.signals.length > this.maxEvents) {
			this.signals.shift();
		}
		this.notify();
	}

	subscribe(fn: (events: HFOPointerEvent[], signals: BlackboardSignal[]) => void): () => void {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	private notify(): void {
		this.listeners.forEach((fn) => fn(this.events, this.signals));
	}

	getEvents(): HFOPointerEvent[] {
		return [...this.events];
	}

	getSignals(): BlackboardSignal[] {
		return [...this.signals];
	}

	clear(): void {
		this.events = [];
		this.signals = [];
		this.notify();
	}
}

// ============================================================================
// POINTER EVENT EMITTER
// ============================================================================

class PointerEventEmitter {
	private trace: TraceContext;
	private eventStream: EventStream;
	private isDown = false;
	private currentButton = 0;

	constructor(eventStream: EventStream) {
		this.trace = createTraceContext();
		this.eventStream = eventStream;
	}

	private propagate(): void {
		this.trace = propagateTrace(this.trace);
	}

	move(x: number, y: number): HFOPointerEvent {
		this.propagate();
		const event: HFOPointerEvent = {
			type: 'pointermove',
			clientX: x,
			clientY: y,
			button: this.currentButton,
			pressure: this.isDown ? 0.5 : 0,
			timestamp: performance.now(),
			traceId: this.trace.traceparent,
		};
		this.eventStream.emit(event);
		return event;
	}

	down(x: number, y: number, button = 0): HFOPointerEvent {
		this.propagate();
		this.isDown = true;
		this.currentButton = button;
		const event: HFOPointerEvent = {
			type: 'pointerdown',
			clientX: x,
			clientY: y,
			button,
			pressure: 0.5,
			timestamp: performance.now(),
			traceId: this.trace.traceparent,
		};
		this.eventStream.emit(event);

		// Emit blackboard signal
		this.eventStream.emitSignal({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: `DELIVER: pointerdown button=${button} at (${x.toFixed(0)}, ${y.toFixed(0)})`,
			type: 'event',
			hive: 'E',
			gen: 87,
			port: 3,
		});

		return event;
	}

	up(x: number, y: number): HFOPointerEvent {
		this.propagate();
		const event: HFOPointerEvent = {
			type: 'pointerup',
			clientX: x,
			clientY: y,
			button: this.currentButton,
			pressure: 0,
			timestamp: performance.now(),
			traceId: this.trace.traceparent,
		};
		this.isDown = false;
		this.eventStream.emit(event);

		// Emit blackboard signal
		this.eventStream.emitSignal({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: `DELIVER: pointerup at (${x.toFixed(0)}, ${y.toFixed(0)})`,
			type: 'event',
			hive: 'E',
			gen: 87,
			port: 3,
		});

		return event;
	}

	cancel(): HFOPointerEvent {
		this.propagate();
		const event: HFOPointerEvent = {
			type: 'pointercancel',
			clientX: 0,
			clientY: 0,
			button: 0,
			pressure: 0,
			timestamp: performance.now(),
			traceId: this.trace.traceparent,
		};
		this.isDown = false;
		this.eventStream.emit(event);
		return event;
	}

	getTrace(): TraceContext {
		return this.trace;
	}
}

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
        background: #f0883e; 
        color: #000; 
        padding: 4px 12px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
        font-weight: bold; 
      }
      .grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
      }
      .panel { 
        background: #161b22; 
        border: 1px solid #30363d; 
        border-radius: 8px; 
        padding: 16px; 
      }
      .panel.full { grid-column: span 2; }
      .panel h2 { 
        font-size: 0.9rem; 
        color: #8b949e; 
        margin-bottom: 12px; 
        text-transform: uppercase; 
      }
      #eventCanvas {
        width: 100%;
        height: 300px;
        background: #0d1117;
        border: 2px dashed #30363d;
        border-radius: 8px;
        cursor: crosshair;
        position: relative;
      }
      .cursor-dot {
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #f0883e;
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: transform 0.05s, background 0.1s;
      }
      .cursor-dot.down {
        background: #3fb950;
        transform: translate(-50%, -50%) scale(1.5);
      }
      .event-log {
        font-family: 'Fira Code', monospace;
        font-size: 0.7rem;
        background: #0d1117;
        padding: 12px;
        border-radius: 4px;
        height: 250px;
        overflow-y: auto;
      }
      .event-item {
        padding: 4px 0;
        border-bottom: 1px solid #21262d;
        display: flex;
        gap: 8px;
      }
      .event-type {
        font-weight: bold;
        min-width: 100px;
      }
      .event-type.move { color: #58a6ff; }
      .event-type.down { color: #3fb950; }
      .event-type.up { color: #f0883e; }
      .event-type.cancel { color: #f85149; }
      .signal-log {
        font-family: 'Fira Code', monospace;
        font-size: 0.7rem;
        background: #0d1117;
        padding: 12px;
        border-radius: 4px;
        height: 250px;
        overflow-y: auto;
      }
      .signal-item {
        padding: 4px 0;
        border-bottom: 1px solid #21262d;
      }
      .signal-hive {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.65rem;
        font-weight: bold;
        margin-right: 8px;
      }
      .signal-hive.H { background: #58a6ff; color: #000; }
      .signal-hive.I { background: #a371f7; color: #000; }
      .signal-hive.V { background: #3fb950; color: #000; }
      .signal-hive.E { background: #f0883e; color: #000; }
      .controls {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
      }
      button {
        padding: 8px 16px;
        background: #238636;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
      }
      button:hover { background: #2ea043; }
      button.secondary {
        background: #21262d;
        border: 1px solid #30363d;
      }
      button.secondary:hover { background: #30363d; }
      .stats {
        display: flex;
        gap: 24px;
        margin-top: 16px;
      }
      .stat {
        text-align: center;
      }
      .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: #f0883e;
      }
      .stat-label {
        font-size: 0.75rem;
        color: #8b949e;
      }
      .trace-preview {
        font-family: monospace;
        font-size: 0.65rem;
        color: #8b949e;
        margin-top: 8px;
        word-break: break-all;
      }
    </style>
    
    <div class="header">
      <h1>🌪️ Port 3: Injector</h1>
      <span class="badge">DELIVER</span>
      <span class="badge" style="background:#3a3a3a;color:#fff;">JADC2: Logistics</span>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h2>🎯 Event Canvas</h2>
        <p style="font-size:0.8rem;color:#8b949e;margin-bottom:8px;">
          Move mouse to emit pointermove. Click for down/up.
        </p>
        <div id="eventCanvas">
          <div id="cursorDot" class="cursor-dot" style="left:50%;top:50%;"></div>
        </div>
        <div class="controls">
          <button id="btnClear">Clear Events</button>
          <button id="btnEmitSignal" class="secondary">Emit Test Signal</button>
        </div>
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="moveCount">0</div>
            <div class="stat-label">Moves</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="downCount">0</div>
            <div class="stat-label">Downs</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="upCount">0</div>
            <div class="stat-label">Ups</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="totalEvents">0</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h2>📋 Pointer Event Stream</h2>
        <div id="eventLog" class="event-log">
          <div style="color:#8b949e;">Interact with canvas to see events...</div>
        </div>
        <div id="tracePreview" class="trace-preview"></div>
      </div>
      
      <div class="panel full">
        <h2>📡 Blackboard Signal Stream</h2>
        <div id="signalLog" class="signal-log">
          <div style="color:#8b949e;">Signals will appear here...</div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// MAIN DEMO LOGIC
// ============================================================================

export function startPort3Demo(): void {
	createDemoUI();

	const eventStream = new EventStream();
	const emitter = new PointerEventEmitter(eventStream);

	const canvas = document.getElementById('eventCanvas')!;
	const cursorDot = document.getElementById('cursorDot')!;
	const eventLog = document.getElementById('eventLog')!;
	const signalLog = document.getElementById('signalLog')!;
	const tracePreview = document.getElementById('tracePreview')!;

	let moveCount = 0;
	let downCount = 0;
	let upCount = 0;

	// Event stream subscriber
	eventStream.subscribe((events, signals) => {
		// Update event log
		if (events.length > 0) {
			eventLog.innerHTML = events
				.slice(-20)
				.reverse()
				.map((e) => {
					const typeClass = e.type.replace('pointer', '');
					return `<div class="event-item">
          <span class="event-type ${typeClass}">${e.type}</span>
          <span>(${e.clientX.toFixed(0)}, ${e.clientY.toFixed(0)})</span>
          <span>btn=${e.button}</span>
        </div>`;
				})
				.join('');
		}

		// Update signal log
		if (signals.length > 0) {
			signalLog.innerHTML = signals
				.slice(-15)
				.reverse()
				.map(
					(s) =>
						`<div class="signal-item">
          <span class="signal-hive ${s.hive}">${s.hive}</span>
          <span>${s.msg}</span>
        </div>`,
				)
				.join('');
		}

		// Update trace preview
		const trace = emitter.getTrace();
		tracePreview.textContent = `Current trace: ${trace.traceparent}`;
	});

	// Canvas interactions
	canvas.addEventListener('mousemove', (e) => {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX;
		const y = e.clientY;

		// Update cursor dot position
		const relX = ((e.clientX - rect.left) / rect.width) * 100;
		const relY = ((e.clientY - rect.top) / rect.height) * 100;
		cursorDot.style.left = `${relX}%`;
		cursorDot.style.top = `${relY}%`;

		emitter.move(x, y);
		moveCount++;
		document.getElementById('moveCount')!.textContent = moveCount.toString();
		document.getElementById('totalEvents')!.textContent = (
			moveCount +
			downCount +
			upCount
		).toString();
	});

	canvas.addEventListener('mousedown', (e) => {
		const x = e.clientX;
		const y = e.clientY;

		cursorDot.classList.add('down');
		emitter.down(x, y, e.button);
		downCount++;
		document.getElementById('downCount')!.textContent = downCount.toString();
		document.getElementById('totalEvents')!.textContent = (
			moveCount +
			downCount +
			upCount
		).toString();
	});

	canvas.addEventListener('mouseup', (e) => {
		const x = e.clientX;
		const y = e.clientY;

		cursorDot.classList.remove('down');
		emitter.up(x, y);
		upCount++;
		document.getElementById('upCount')!.textContent = upCount.toString();
		document.getElementById('totalEvents')!.textContent = (
			moveCount +
			downCount +
			upCount
		).toString();
	});

	canvas.addEventListener('mouseleave', () => {
		if (cursorDot.classList.contains('down')) {
			emitter.cancel();
			cursorDot.classList.remove('down');
		}
	});

	// Prevent context menu
	canvas.addEventListener('contextmenu', (e) => e.preventDefault());

	// Button handlers
	document.getElementById('btnClear')!.addEventListener('click', () => {
		eventStream.clear();
		moveCount = 0;
		downCount = 0;
		upCount = 0;
		document.getElementById('moveCount')!.textContent = '0';
		document.getElementById('downCount')!.textContent = '0';
		document.getElementById('upCount')!.textContent = '0';
		document.getElementById('totalEvents')!.textContent = '0';
		eventLog.innerHTML = '<div style="color:#8b949e;">Events cleared...</div>';
		signalLog.innerHTML = '<div style="color:#8b949e;">Signals cleared...</div>';
	});

	document.getElementById('btnEmitSignal')!.addEventListener('click', () => {
		eventStream.emitSignal({
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg: 'DELIVER: Manual test signal from Port 3 demo',
			type: 'signal',
			hive: 'E',
			gen: 87,
			port: 3,
		});
	});

	// Initial signal
	eventStream.emitSignal({
		ts: new Date().toISOString(),
		mark: 1.0,
		pull: 'downstream',
		msg: 'DELIVER: Port 3 Injector demo initialized',
		type: 'signal',
		hive: 'E',
		gen: 87,
		port: 3,
	});
}

// Auto-start
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		if (!document.getElementById('app')) {
			const app = document.createElement('div');
			app.id = 'app';
			document.body.appendChild(app);
		}
		startPort3Demo();
	});
}
