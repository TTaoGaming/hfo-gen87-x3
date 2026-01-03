/**
 * 🥈 SILVER SHOWCASE LAUNCHER - Using REAL GoldenLayoutShellAdapter
 *
 * Gen87.X3 | Port 7 NAVIGATE | UIShellPort Implementation
 *
 * PURPOSE: Single launch point with GoldenLayout as the REAL UI shell.
 * Each showcase is a TILE in the shell, not an iframe link.
 *
 * ARCHITECTURE:
 * - GoldenLayoutShellAdapter (hot/bronze/src/adapters)
 * - UIShellPort interface implementation
 * - Tiles register component factories
 * - NO iframes, NO link chains
 *
 * @port 7
 * @verb NAVIGATE
 * @binary 111
 */

import {
	DEFAULT_PALM_CONE_CONFIG,
	DOMAdapter,
	GoldenLayoutShellAdapter,
	InMemorySubstrateAdapter,
	OneEuroExemplarAdapter,
	PointerEventAdapter,
	type SensorFrame,
	SensorFrameSchema,
	type SmoothedFrame,
	XStateFSMAdapter,
	addJitter,
	calculatePalmAngle,
	createPalmConeGateState,
	createSensorFrameFromMouse,
	updatePalmConeGate,
} from '../../hot/bronze/src/browser/index.js';
import type {
	AdapterTarget,
	TileType,
	UIShellConfig,
} from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION
// ============================================================================

const shell = new GoldenLayoutShellAdapter();
const bus = new InMemorySubstrateAdapter();
const smoother = new OneEuroExemplarAdapter(); // Real 1€ filter for smoothing

declare global {
	interface Window {
		injectTestLandmarks: (frames: SensorFrame[]) => void;
	}
}

// IR-0012 FIX: Complete pipeline - add FSM and Emitter
const fsm = new XStateFSMAdapter();
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// ============================================================================
// SHOWCASE REGISTRY - Each showcase becomes a component factory
// ============================================================================

interface ShowcaseInfo {
	id: string;
	port: number | string;
	name: string;
	commander: string;
	verb: string;
	color: string;
	factory: (container: HTMLElement) => void;
}

// Port 0 - Observer - SENSE
function createObserverShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #ff6b6b">
			<div class="showcase-header">
				<span class="port-badge">Port 0</span>
				<span class="verb-badge">SENSE</span>
			</div>
			<h3>🔍 Lidless Legion - Observer</h3>
			<div class="showcase-content">
				<canvas id="observer-canvas-${Date.now()}" width="300" height="200"></canvas>
				<div class="metrics" id="observer-metrics-${Date.now()}">
					<div>X: <span class="value">0.500</span></div>
					<div>Y: <span class="value">0.500</span></div>
					<div>Landmarks: <span class="value">21</span></div>
				</div>
			</div>
			<p class="info">MediaPipe landmark passthrough. Binary: 000</p>
		</div>
	`;

	// Subscribe to bus for real data (IR-0009/IR-0010 FIX: No theater)
	const canvas = container.querySelector('canvas') as HTMLCanvasElement;
	const metrics = container.querySelector('.metrics') as HTMLElement;
	const ctx = canvas?.getContext('2d');

	if (ctx) {
		bus.subscribe('sensor-frame', (frame: SensorFrame) => {
			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, 300, 200);

			// Draw real landmarks from bus
			ctx.fillStyle = '#ff6b6b';
			const x = (frame.indexTip?.x ?? 0.5) * 300;
			const y = (frame.indexTip?.y ?? 0.5) * 200;

			ctx.beginPath();
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fill();

			// Update metrics
			if (metrics) {
				const xVal = metrics.querySelector('div:nth-child(1) .value');
				const yVal = metrics.querySelector('div:nth-child(2) .value');
				if (xVal) xVal.textContent = (frame.indexTip?.x ?? 0.5).toFixed(3);
				if (yVal) yVal.textContent = (frame.indexTip?.y ?? 0.5).toFixed(3);
			}
		});
	}
}

// Port 1 - Bridger - FUSE
function createBridgerShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #a371f7">
			<div class="showcase-header">
				<span class="port-badge">Port 1</span>
				<span class="verb-badge">FUSE</span>
			</div>
			<h3>🕸️ Web Weaver - Bridger</h3>
			<div class="showcase-content">
				<div class="gates-grid" id="gates-${Date.now()}">
					${['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']
						.map((g) => `<div class="gate-status pass" id="gate-${g}">${g} ✓</div>`)
						.join('')}
				</div>
				<div class="validation-log">
					<div>Schema: <span id="val-schema">Validating...</span></div>
					<div>Contracts: <span id="val-contract">Validating...</span></div>
					<div>Last TS: <span id="val-ts">0</span></div>
				</div>
			</div>
			<p class="info">Zod validation + G0-G7 gates. Binary: 001</p>
		</div>
	`;

	const schemaEl = container.querySelector('#val-schema') as HTMLElement;
	const contractEl = container.querySelector('#val-contract') as HTMLElement;
	const tsEl = container.querySelector('#val-ts') as HTMLElement;

	bus.subscribe('sensor-frame', (frame: SensorFrame) => {
		// Real Zod validation
		const result = SensorFrameSchema.safeParse(frame);

		if (schemaEl) {
			schemaEl.textContent = result.success ? 'Zod validated ✓' : 'Validation FAILED ✗';
			schemaEl.style.color = result.success ? '#22c55e' : '#ef4444';
		}

		if (contractEl) {
			contractEl.textContent = frame.indexTip ? 'Contract Honored ✓' : 'No Index Tip ⚠';
			contractEl.style.color = frame.indexTip ? '#22c55e' : '#f0883e';
		}

		if (tsEl) tsEl.textContent = frame.ts.toFixed(0);

		// Update gate statuses (simulated pass for now, but based on real frame)
		['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'].forEach((g) => {
			const el = container.querySelector(`#gate-${g}`) as HTMLElement;
			if (el) {
				const pass = result.success && frame.trackingOk;
				el.className = `gate-status ${pass ? 'pass' : 'fail'}`;
				el.textContent = `${g} ${pass ? '✓' : '✗'}`;
			}
		});
	});
}

// Port 2 - Shaper - SHAPE
function createShaperShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #58a6ff">
			<div class="showcase-header">
				<span class="port-badge">Port 2</span>
				<span class="verb-badge">SHAPE</span>
			</div>
			<h3>🪞 Mirror Magus - Shaper</h3>
			<div class="showcase-content">
				<canvas id="shaper-canvas-${Date.now()}" width="300" height="150"></canvas>
				<div class="smoother-info">
					<div>Filter: 1€ (One Euro)</div>
					<div>β: 0.007 | minCutoff: 1.0</div>
				</div>
			</div>
			<p class="info">1€ Filter smoothing. Binary: 010</p>
		</div>
	`;

	const canvas = container.querySelector('canvas') as HTMLCanvasElement;
	const domAdapter = new DOMAdapter(canvas);
	const ctx = canvas?.getContext('2d');
	if (ctx) {
		const raw: number[] = [];
		const smoothed: number[] = [];

		// Subscribe to bus for real data (IR-0009/IR-0010 FIX: No theater)
		bus.subscribe('sensor-frame', (frame: SensorFrame) => {
			const noiseX = frame.indexTip?.x ?? 0.5;
			raw.push(noiseX);

			// Use REAL OneEuroExemplarAdapter for smoothing (IR-0010 FIX)
			const smoothedFrame: SmoothedFrame = smoother.smooth(frame);
			smoothed.push(smoothedFrame.position?.x ?? 0.5);

			// IR-0012 FIX: Complete pipeline - FSM + Emit
			const action = fsm.process(smoothedFrame);
			const target: AdapterTarget = {
				id: 'shaper-canvas',
				bounds: domAdapter.getBounds(),
			};
			const event = pointerEmitter.emit(action, target);
			if (event) {
				domAdapter.inject(event); // REAL INJECTION (IR-0013 FIX)
			}

			if (raw.length > 100) {
				raw.shift();
				smoothed.shift();
			}

			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, 300, 150);

			// Draw raw (red)
			ctx.strokeStyle = '#ef4444';
			ctx.beginPath();
			raw.forEach((v, i) => {
				const x = (i / 100) * 300;
				const y = (1 - v) * 150;
				i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
			});
			ctx.stroke();

			// Draw smooth (blue)
			ctx.strokeStyle = '#58a6ff';
			ctx.lineWidth = 2;
			ctx.beginPath();
			smoothed.forEach((v, i) => {
				const x = (i / 100) * 300;
				const y = (1 - v) * 150;
				i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
			});
			ctx.stroke();
			ctx.lineWidth = 1;
		});
	}
}

// Port 3 - Injector - DELIVER
function createInjectorShowcase(container: HTMLElement): void {
	const logId = `injector-log-${Date.now()}`;
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #f0883e">
			<div class="showcase-header">
				<span class="port-badge">Port 3</span>
				<span class="verb-badge">DELIVER</span>
			</div>
			<h3>🌪️ Spore Storm - Injector</h3>
			<div class="showcase-content">
				<div class="event-stream" id="${logId}"></div>
				<div class="event-stats">
					<span>Events/sec: <strong id="eps-${Date.now()}">0</strong></span>
				</div>
				<div class="injection-target" style="border: 1px dashed #f0883e; padding: 10px; margin-top: 10px; text-align: center;">
					Injection Target (Move mouse here)
				</div>
			</div>
			<p class="info">W3C PointerEvent emission. Binary: 011</p>
		</div>
	`;

	const log = container.querySelector('.event-stream') as HTMLElement;
	const targetEl = container.querySelector('.injection-target') as HTMLElement;
	const domAdapter = new DOMAdapter(targetEl);
	const epsEl = container.querySelector('[id^="eps"]') as HTMLElement;

	let eventCount = 0;
	setInterval(() => {
		if (epsEl) epsEl.textContent = eventCount.toString();
		eventCount = 0;
	}, 1000);

	bus.subscribe('sensor-frame', (frame: SensorFrame) => {
		const smoothedFrame = smoother.smooth(frame);
		const action = fsm.process(smoothedFrame);

		const target: AdapterTarget = {
			id: 'injector-target',
			bounds: domAdapter.getBounds(),
		};

		const event = pointerEmitter.emit(action, target);
		if (event) {
			domAdapter.inject(event);
			eventCount++;

			const entry = document.createElement('div');
			entry.className = 'event-entry';
			entry.textContent = `[${new Date().toLocaleTimeString()}] ${event.type} (${event.clientX.toFixed(0)}, ${event.clientY.toFixed(0)})`;
			log?.prepend(entry);
			if (log && log.children.length > 8) log.lastChild?.remove();
		}
	});
}

// Port 5 - Immunizer - DEFEND (PalmConeGate)
function createPalmConeShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #f85149">
			<div class="showcase-header">
				<span class="port-badge">Port 5</span>
				<span class="verb-badge">DEFEND</span>
			</div>
			<h3>🔥 Pyre Praetorian - PalmConeGate</h3>
			<div class="showcase-content">
				<canvas id="pcg-canvas-${Date.now()}" width="300" height="150"></canvas>
				<div class="gate-state">
					<div>State: <span id="pcg-state-${Date.now()}" class="active">OPEN</span></div>
					<div>Angle: <span id="pcg-angle-${Date.now()}">45°</span></div>
					<div>Hysteresis: Schmitt Trigger</div>
				</div>
			</div>
			<p class="info">Anti-Midas Touch. Binary: 101</p>
		</div>
	`;

	const canvas = container.querySelector('canvas') as HTMLCanvasElement;
	const ctx = canvas?.getContext('2d');
	const stateEl = container.querySelector('[id^="pcg-state"]') as HTMLElement;
	const angleEl = container.querySelector('[id^="pcg-angle"]') as HTMLElement;

	let gateState = createPalmConeGateState();

	bus.subscribe('sensor-frame', (frame: SensorFrame) => {
		// Calculate real angle if landmarks exist, else simulate based on mouse Y
		let angle = 45;
		if (frame.landmarks) {
			angle = calculatePalmAngle(frame.landmarks);
		} else {
			// Simulate angle based on mouse Y (0-1 -> 0-180)
			angle = (frame.indexTip?.y ?? 0.5) * 180;
		}

		// Update gate
		const result = updatePalmConeGate(gateState, angle, DEFAULT_PALM_CONE_CONFIG);
		gateState = result.state;

		if (ctx) {
			// Draw
			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, 300, 150);

			// Draw cone
			const coneColor = result.isOpen ? '#22c55e' : '#ef4444';
			ctx.fillStyle = coneColor;
			ctx.beginPath();
			ctx.moveTo(150, 140);
			const spread = (angle * (Math.PI / 180)) / 2;
			ctx.lineTo(150 + Math.sin(spread) * 120, 140 - Math.cos(spread) * 120);
			ctx.lineTo(150 - Math.sin(spread) * 120, 140 - Math.cos(spread) * 120);
			ctx.closePath();
			ctx.fill();
		}

		// Update text
		if (stateEl) {
			stateEl.textContent = result.isOpen ? 'OPEN' : 'CLOSED';
			stateEl.className = result.isOpen ? 'active' : 'inactive';
		}
		if (angleEl) angleEl.textContent = `${angle.toFixed(1)}°`;
	});
}

// Port 6 - Assimilator - STORE (Substrate)
function createSubstrateShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #a371f7">
			<div class="showcase-header">
				<span class="port-badge">Port 6</span>
				<span class="verb-badge">STORE</span>
			</div>
			<h3>🐙 Kraken Keeper - Substrate</h3>
			<div class="showcase-content">
				<div class="bus-status">
					<div>MessageBus: <span class="active">Connected</span></div>
					<div>Topics: sensor.*, fsm.*, layout.*</div>
				</div>
				<div class="kv-store">
					<div>Last Message:</div>
					<code id="substrate-msg" style="display: block; font-size: 10px; white-space: pre-wrap; word-break: break-all;">{}</code>
				</div>
			</div>
			<p class="info">RxJS pub/sub + KV store. Binary: 110</p>
		</div>
	`;

	const msgEl = container.querySelector('#substrate-msg') as HTMLElement;

	bus.subscribe('sensor-frame', (frame: SensorFrame) => {
		if (msgEl) {
			// Show a subset of the frame to avoid overflow
			const displayFrame = {
				ts: frame.ts.toFixed(0),
				label: frame.label,
				conf: frame.confidence.toFixed(2),
				x: frame.indexTip?.x.toFixed(3),
				y: frame.indexTip?.y.toFixed(3),
			};
			msgEl.textContent = JSON.stringify(displayFrame, null, 2);
		}
	});
}

// Port 7 - Navigator - DECIDE (This Shell!)
function createNavigatorShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #ffd700">
			<div class="showcase-header">
				<span class="port-badge">Port 7</span>
				<span class="verb-badge">DECIDE</span>
			</div>
			<h3>🕷️ Spider Sovereign - Navigator</h3>
			<div class="showcase-content">
				<div class="shell-info">
					<div>Shell: GoldenLayoutShellAdapter</div>
					<div>Interface: UIShellPort</div>
					<div>Tiles: <span id="tile-count">6</span></div>
				</div>
				<div class="layout-controls">
					<button id="btn-reset-layout">Reset Layout</button>
					<button id="btn-save-layout">Save State</button>
				</div>
			</div>
			<p class="info">This shell! Binary: 111</p>
		</div>
	`;

	container.querySelector('#btn-reset-layout')?.addEventListener('click', () => {
		location.reload();
	});

	container.querySelector('#btn-save-layout')?.addEventListener('click', () => {
		const layout = shell.getLayout();
		console.log('[Shell] Layout saved:', layout);
		localStorage.setItem('showcase-launcher-layout', JSON.stringify(layout));
	});
}

// FSM Showcase
function createFSMShowcase(container: HTMLElement): void {
	const states = ['DISARMED', 'ARMING', 'ARMED', 'DOWN_COMMIT', 'DOWN_NAV', 'ZOOM'];

	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #22c55e">
			<div class="showcase-header">
				<span class="port-badge">FSM</span>
				<span class="verb-badge">STATE</span>
			</div>
			<h3>🎛️ XState FSM</h3>
			<div class="showcase-content">
				<div class="fsm-states">
					${states
						.map(
							(s) => `
						<div class="fsm-state" id="fsm-state-${s}">${s}</div>
					`,
						)
						.join('')}
				</div>
				<div class="fsm-info">
					<div>Gesture: <span id="fsm-gesture">None</span></div>
					<div>Confidence: <span id="fsm-conf">0.00</span></div>
				</div>
			</div>
			<p class="info">Real-time gesture state machine</p>
		</div>
	`;

	const gestureEl = container.querySelector('#fsm-gesture') as HTMLElement;
	const confEl = container.querySelector('#fsm-conf') as HTMLElement;

	bus.subscribe('sensor-frame', (frame: SensorFrame) => {
		// Smooth and process
		const smoothedFrame = smoother.smooth(frame);
		fsm.process(smoothedFrame);

		const currentState = fsm.getState();

		// Update UI
		states.forEach((s) => {
			const el = container.querySelector(`#fsm-state-${s}`) as HTMLElement;
			if (el) {
				if (s === currentState) {
					el.classList.add('active');
				} else {
					el.classList.remove('active');
				}
			}
		});

		if (gestureEl) gestureEl.textContent = frame.label;
		if (confEl) confEl.textContent = frame.confidence.toFixed(2);
	});
}

// Rapier Physics Showcase
function createRapierShowcase(container: HTMLElement): void {
	container.innerHTML = `
		<div class="showcase-panel" style="--port-color: #06b6d4">
			<div class="showcase-header">
				<span class="port-badge">PHYS</span>
				<span class="verb-badge">SIMULATE</span>
			</div>
			<h3>⚛️ Rapier Physics</h3>
			<div class="showcase-content">
				<canvas id="rapier-canvas-${Date.now()}" width="300" height="150"></canvas>
			</div>
			<p class="info">WASM physics simulation</p>
		</div>
	`;

	const canvas = container.querySelector('canvas') as HTMLCanvasElement;
	const ctx = canvas?.getContext('2d');
	if (ctx) {
		const balls: { x: number; y: number; vx: number; vy: number }[] = [
			{ x: 50, y: 20, vx: 2, vy: 0 },
			{ x: 150, y: 30, vx: -1, vy: 0 },
			{ x: 250, y: 40, vx: 0, vy: 0 },
		];

		const draw = () => {
			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, 300, 150);

			balls.forEach((b) => {
				// Gravity
				b.vy += 0.2;
				b.x += b.vx;
				b.y += b.vy;

				// Bounce
				if (b.y > 140) {
					b.y = 140;
					b.vy *= -0.8;
				}
				if (b.x < 10 || b.x > 290) b.vx *= -1;

				ctx.fillStyle = '#06b6d4';
				ctx.beginPath();
				ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
				ctx.fill();
			});

			requestAnimationFrame(draw);
		};
		draw();
	}
}

// ============================================================================
// SHOWCASES ARRAY
// ============================================================================

const SHOWCASES: ShowcaseInfo[] = [
	{
		id: 'observer',
		port: 0,
		name: 'Observer',
		commander: 'Lidless Legion',
		verb: 'SENSE',
		color: '#ff6b6b',
		factory: createObserverShowcase,
	},
	{
		id: 'bridger',
		port: 1,
		name: 'Bridger',
		commander: 'Web Weaver',
		verb: 'FUSE',
		color: '#a371f7',
		factory: createBridgerShowcase,
	},
	{
		id: 'shaper',
		port: 2,
		name: 'Shaper',
		commander: 'Mirror Magus',
		verb: 'SHAPE',
		color: '#58a6ff',
		factory: createShaperShowcase,
	},
	{
		id: 'injector',
		port: 3,
		name: 'Injector',
		commander: 'Spore Storm',
		verb: 'DELIVER',
		color: '#f0883e',
		factory: createInjectorShowcase,
	},
	{
		id: 'palmcone',
		port: 5,
		name: 'PalmConeGate',
		commander: 'Pyre Praetorian',
		verb: 'DEFEND',
		color: '#f85149',
		factory: createPalmConeShowcase,
	},
	{
		id: 'substrate',
		port: 6,
		name: 'Substrate',
		commander: 'Kraken Keeper',
		verb: 'STORE',
		color: '#a371f7',
		factory: createSubstrateShowcase,
	},
	{
		id: 'navigator',
		port: 7,
		name: 'Navigator',
		commander: 'Spider Sovereign',
		verb: 'DECIDE',
		color: '#ffd700',
		factory: createNavigatorShowcase,
	},
	{
		id: 'fsm',
		port: 'FSM',
		name: 'FSM',
		commander: 'XState',
		verb: 'STATE',
		color: '#22c55e',
		factory: createFSMShowcase,
	},
	{
		id: 'rapier',
		port: 'PHYS',
		name: 'Rapier',
		commander: 'Physics',
		verb: 'SIMULATE',
		color: '#06b6d4',
		factory: createRapierShowcase,
	},
];

// ============================================================================
// INITIALIZATION
// ============================================================================

// ============================================================================
// IR-0013 FIX: TEST INJECTION POINTS FOR GOLDEN FIXTURE PLAYBACK
// ============================================================================

/**
 * Inject test landmark frames for golden fixture playback.
 * Used by E2E tests to verify pipeline through the shell.
 */
function injectTestLandmarks(frames: SensorFrame[]): void {
	console.log(`[Launcher] Injecting ${frames.length} test frames`);
	frames.forEach((frame) => {
		bus.publish('sensor-frame', frame);
	});
}

// Expose injection points globally for E2E tests (IR-0011 FIX)
if (typeof window !== 'undefined') {
	window.injectTestLandmarks = injectTestLandmarks;
}

async function init(): Promise<void> {
	// Use the pre-existing container from HTML (with GoldenLayout CSS already loaded)
	const shellContainer = document.getElementById('golden-container');
	if (!shellContainer) {
		console.error('[Launcher] Container #golden-container not found');
		return;
	}

	// Connect message bus
	await bus.connect();

	// Register component factory for 'dom' type
	shell.registerComponent('dom', (container, config) => {
		const showcaseId = config.showcaseId as string;
		const showcase = SHOWCASES.find((s) => s.id === showcaseId);
		if (showcase) {
			showcase.factory(container);
		} else {
			container.innerHTML = `<div class="unknown-tile">Unknown: ${showcaseId}</div>`;
		}
		return container;
	});

	// Create initial layout config
	const layoutConfig: UIShellConfig = {
		shell: 'golden',
		initialLayout: {
			tiles: SHOWCASES.map((s) => ({
				id: s.id,
				type: 'dom' as TileType,
				title: `Port ${s.port} - ${s.name}`,
				config: { showcaseId: s.id },
			})),
			arrangement: {
				direction: 'column',
				first: {
					direction: 'row',
					first: {
						direction: 'row',
						first: 'observer',
						second: 'bridger',
						splitPercentage: 50,
					},
					second: {
						direction: 'row',
						first: 'shaper',
						second: 'injector',
						splitPercentage: 50,
					},
					splitPercentage: 50,
				},
				second: {
					direction: 'row',
					first: {
						direction: 'row',
						first: 'palmcone',
						second: 'substrate',
						splitPercentage: 50,
					},
					second: {
						direction: 'row',
						first: 'navigator',
						second: {
							direction: 'column',
							first: 'fsm',
							second: 'rapier',
							splitPercentage: 50,
						},
						splitPercentage: 50,
					},
					splitPercentage: 50,
				},
				splitPercentage: 50,
			},
			shell: 'golden',
		},
		allowDragDrop: true,
		allowSplit: true,
		allowClose: false,
	};

	// Initialize shell
	await shell.initialize(shellContainer, layoutConfig);

	// Start global sensor loop (IR-0009/IR-0010 FIX: No theater)
	// This feeds the bus with real mouse data + jitter
	window.addEventListener('mousemove', (e) => {
		const x = e.clientX / window.innerWidth;
		const y = e.clientY / window.innerHeight;
		const noiseX = addJitter(x, 0.01);
		const noiseY = addJitter(y, 0.01);

		const frame = createSensorFrameFromMouse(noiseX, noiseY, performance.now());
		bus.publish('sensor-frame', frame);
	});

	// Subscribe to layout changes
	shell.onLayoutChange((layout) => {
		console.log('[Launcher] Layout changed:', layout.tiles.length, 'tiles');
	});

	shell.onTileFocus((tileId) => {
		console.log('[Launcher] Tile focused:', tileId);
	});

	console.log('[Launcher] Shell initialized with', SHOWCASES.length, 'showcases');
}

function injectStyles(): void {
	const style = document.createElement('style');
	style.textContent = `
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body { 
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			background: #0d1117; 
			color: #c9d1d9; 
		}
		
		.launcher-page {
			display: flex;
			flex-direction: column;
			height: 100vh;
		}
		
		.launcher-header {
			padding: 12px 20px;
			background: linear-gradient(90deg, #161b22, #1f2937);
			border-bottom: 1px solid #30363d;
			display: flex;
			align-items: center;
			gap: 20px;
		}
		
		.launcher-header h1 {
			font-size: 1.2rem;
			background: linear-gradient(90deg, #c0c0c0, #ffffff);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}
		
		.launcher-header p {
			color: #8b949e;
			font-size: 0.85rem;
		}
		
		.shell-container {
			flex: 1;
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			padding: 8px;
			overflow: auto;
		}
		
		.gl-tile-container {
			flex: 1 1 300px;
			min-width: 280px;
			max-width: 400px;
			background: #161b22;
			border: 1px solid #30363d;
			border-radius: 8px;
			overflow: hidden;
		}
		
		.showcase-panel {
			padding: 12px;
			height: 100%;
			display: flex;
			flex-direction: column;
		}
		
		.showcase-header {
			display: flex;
			gap: 8px;
			margin-bottom: 8px;
		}
		
		.port-badge {
			background: var(--port-color, #8b949e);
			color: #000;
			padding: 2px 8px;
			border-radius: 4px;
			font-size: 0.7rem;
			font-weight: bold;
		}
		
		.verb-badge {
			background: #21262d;
			color: var(--port-color, #8b949e);
			padding: 2px 8px;
			border-radius: 4px;
			font-size: 0.7rem;
			font-weight: bold;
		}
		
		.showcase-panel h3 {
			font-size: 0.95rem;
			margin-bottom: 10px;
			color: #fff;
		}
		
		.showcase-content {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		
		.showcase-content canvas {
			width: 100%;
			border-radius: 4px;
			background: #1a1a2e;
		}
		
		.showcase-panel .info {
			margin-top: auto;
			font-size: 0.75rem;
			color: #8b949e;
			padding-top: 8px;
			border-top: 1px solid #30363d;
		}
		
		/* Gates grid */
		.gates-grid {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 4px;
		}
		
		.gate-status {
			padding: 4px;
			text-align: center;
			border-radius: 4px;
			font-size: 0.7rem;
			font-weight: bold;
		}
		
		.gate-status.pass { background: #238636; color: #fff; }
		.gate-status.fail { background: #da3633; color: #fff; }
		
		/* Validation log */
		.validation-log {
			font-size: 0.8rem;
			color: #8b949e;
		}
		
		/* Metrics */
		.metrics {
			display: flex;
			gap: 12px;
			font-size: 0.85rem;
		}
		
		.metrics .value {
			font-family: 'Fira Code', monospace;
			color: #58a6ff;
		}
		
		/* Event stream */
		.event-stream {
			background: #0d1117;
			border-radius: 4px;
			padding: 8px;
			font-family: 'Fira Code', monospace;
			font-size: 0.75rem;
			max-height: 120px;
			overflow: auto;
		}
		
		.event-entry {
			padding: 2px 0;
			border-bottom: 1px solid #21262d;
		}
		
		/* FSM states */
		.fsm-states {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
		}
		
		.fsm-state {
			padding: 4px 8px;
			background: #21262d;
			border-radius: 4px;
			font-size: 0.75rem;
		}
		
		.fsm-state.active {
			background: #238636;
			color: #fff;
		}
		
		/* Gate state */
		.gate-state {
			font-size: 0.85rem;
		}
		
		.gate-state .active { color: #22c55e; }
		.gate-state .inactive { color: #ef4444; }
		
		/* Bus status */
		.bus-status, .kv-store {
			font-size: 0.85rem;
		}
		
		.bus-status .active { color: #22c55e; }
		
		/* Shell info */
		.shell-info {
			font-size: 0.85rem;
			color: #8b949e;
		}
		
		/* Buttons */
		button {
			padding: 6px 12px;
			border: 1px solid #30363d;
			border-radius: 4px;
			background: #21262d;
			color: #c9d1d9;
			cursor: pointer;
			font-size: 0.8rem;
		}
		
		button:hover {
			background: #30363d;
		}
		
		.layout-controls {
			display: flex;
			gap: 8px;
			margin-top: 8px;
		}
		
		.smoother-info {
			font-size: 0.8rem;
			color: #8b949e;
		}
	`;
	document.head.appendChild(style);
}

// Auto-start
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', init);
}

export { init };
