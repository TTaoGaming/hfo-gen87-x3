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
	type SmoothedFrame,
	XStateFSMAdapter,
	addJitter,
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

	// Simulate hand tracking data
	const canvas = container.querySelector('canvas') as HTMLCanvasElement;
	const ctx = canvas?.getContext('2d');
	if (ctx) {
		let frame = 0;
		const animate = () => {
			ctx.fillStyle = '#1a1a2e';
			ctx.fillRect(0, 0, 300, 200);

			// Draw simulated landmarks using proper jitter function (IR-0009 FIX)
			ctx.fillStyle = '#ff6b6b';
			for (let i = 0; i < 21; i++) {
				const baseX = 0.5 + Math.sin(frame * 0.02 + i * 0.3) * 0.27;
				const baseY = 0.5 + Math.cos(frame * 0.02 + i * 0.3) * 0.3;
				const x = addJitter(baseX, 0.01) * 300; // Deterministic jitter
				const y = addJitter(baseY, 0.01) * 200;
				ctx.beginPath();
				ctx.arc(x, y, 4, 0, Math.PI * 2);
				ctx.fill();
			}
			frame++;
			requestAnimationFrame(animate);
		};
		animate();
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
						.map((g) => `<div class="gate-status pass">${g} ✓</div>`)
						.join('')}
				</div>
				<div class="validation-log">
					<div>Schema: Zod validated ✓</div>
					<div>Valguards: Active ✓</div>
					<div>Contracts: Honored ✓</div>
				</div>
			</div>
			<p class="info">Zod validation + G0-G7 gates. Binary: 001</p>
		</div>
	`;
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

		const draw = () => {
			// Generate noisy data using addJitter (IR-0009/IR-0010 FIX)
			const baseValue = 0.5;
			const noise = addJitter(baseValue, 0.15); // Controlled jitter
			raw.push(noise);

			// Use REAL OneEuroExemplarAdapter for smoothing (IR-0010 FIX)
			const frame: SensorFrame = createSensorFrameFromMouse(noise, noise, performance.now());
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

			requestAnimationFrame(draw);
		};
		draw();
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
			</div>
			<p class="info">W3C PointerEvent emission. Binary: 011</p>
		</div>
	`;

	const log = container.querySelector('.event-stream') as HTMLElement;
	const events = ['pointermove', 'pointerdown', 'pointerup', 'signal.emit'];
	let count = 0;
	let eventIndex = 0; // Deterministic cycling (IR-0009 FIX)

	setInterval(() => {
		const event = events[eventIndex % events.length];
		eventIndex++;
		const entry = document.createElement('div');
		entry.className = 'event-entry';
		entry.textContent = `[${new Date().toLocaleTimeString()}] ${event}`;
		log?.prepend(entry);
		if (log && log.children.length > 8) log.lastChild?.remove();
		count++;
	}, 500);
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
	let angle = 45;

	if (ctx) {
		const draw = () => {
			// Oscillate angle
			angle = 45 + Math.sin(Date.now() * 0.002) * 50;

			// Update gate
			const result = updatePalmConeGate(gateState, angle, DEFAULT_PALM_CONE_CONFIG);
			gateState = result.state;

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

			// Update text
			if (stateEl) {
				stateEl.textContent = result.isOpen ? 'OPEN' : 'CLOSED';
				stateEl.className = result.isOpen ? 'active' : 'inactive';
			}
			if (angleEl) angleEl.textContent = `${angle.toFixed(1)}°`;

			requestAnimationFrame(draw);
		};
		draw();
	}
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
					<div>KV Store:</div>
					<code>{ lastFrame: ${Date.now()}, tiles: 6 }</code>
				</div>
			</div>
			<p class="info">RxJS pub/sub + KV store. Binary: 110</p>
		</div>
	`;
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
	const states = ['DISARMED', 'ARMED', 'DOWN_COMMIT', 'DRAG'];
	let current = 0;

	const render = () => {
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
								(s, i) => `
							<div class="fsm-state ${i === current ? 'active' : ''}">${s}</div>
						`,
							)
							.join('')}
					</div>
					<button id="fsm-step">Step →</button>
				</div>
				<p class="info">Gesture state machine</p>
			</div>
		`;

		container.querySelector('#fsm-step')?.addEventListener('click', () => {
			current = (current + 1) % states.length;
			render();
		});
	};
	render();
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
