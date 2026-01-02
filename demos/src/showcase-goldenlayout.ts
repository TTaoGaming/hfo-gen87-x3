/**
 * GoldenLayout Shell Showcase Demo - Port 7 NAVIGATE
 *
 * Gen87.X3 | GoldenLayoutShellAdapter Showcase
 *
 * PURPOSE: Demonstrate GoldenLayoutShellAdapter in ISOLATION
 * This demo uses the REAL GoldenLayoutShellAdapter from hot/bronze/src/adapters
 *
 * ARCHITECTURE ENFORCEMENT:
 * - Uses GoldenLayoutShellAdapter (not raw GL API)
 * - Demonstrates UIShellPort interface
 * - Shows tiling window management
 *
 * @port 7
 * @verb NAVIGATE
 * @binary 111
 * @element Heaven - Pure will, strategic direction
 */

import {
	GoldenLayoutShellAdapter,
	InMemorySubstrateAdapter,
	OneEuroExemplarAdapter,
	PointerEventAdapter,
	XStateFSMAdapter,
	addJitter,
	createSensorFrameFromMouse,
} from '../../hot/bronze/src/browser/index.js';
import type {
	AdapterTarget,
	LayoutState,
	TileConfig,
	TileType,
	UIShellConfig,
} from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION (Constraint Test Will Verify This)
// ============================================================================

// Port 7 - UI Shell (GoldenLayout)
const shell = new GoldenLayoutShellAdapter();

// Message Bus (for inter-component communication)
const bus = new InMemorySubstrateAdapter();

// IR-0012 FIX: Complete pipeline for architecture compliance
const smoother = new OneEuroExemplarAdapter();
const fsm = new XStateFSMAdapter();
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// ============================================================================
// STATE
// ============================================================================

interface DemoState {
	initialized: boolean;
	tileCount: number;
	layoutHistory: string[];
}

const state: DemoState = {
	initialized: false,
	tileCount: 0,
	layoutHistory: [],
};

// ============================================================================
// COMPONENT FACTORY FUNCTIONS (for 'dom' tile type)
// ============================================================================

/**
 * All components use TileType 'dom' - the registered factory creates the content
 */
function createDOMContent(container: HTMLElement, tileId: string): void {
	// Determine content based on tile ID prefix
	if (tileId.startsWith('sensor')) {
		createSensorContent(container);
	} else if (tileId.startsWith('fsm')) {
		createFSMContent(container);
	} else if (tileId.startsWith('viz')) {
		createVisualizerContent(container);
	} else if (tileId.startsWith('log')) {
		createLogContent(container);
	} else {
		container.innerHTML = `<div class="panel"><h3>Tile: ${tileId}</h3></div>`;
	}
}

function createSensorContent(container: HTMLElement): void {
	container.innerHTML = `
		<div class="panel sensor-panel">
			<h3>🔍 Sensor Data</h3>
			<div class="metrics">
				<div class="metric">
					<span class="label">X Position</span>
					<span class="value" id="sensor-x">0.500</span>
				</div>
				<div class="metric">
					<span class="label">Y Position</span>
					<span class="value" id="sensor-y">0.500</span>
				</div>
				<div class="metric">
					<span class="label">Timestamp</span>
					<span class="value" id="sensor-ts">${Date.now()}</span>
				</div>
			</div>
			<p class="info">Port 0 - Observer - SENSE</p>
		</div>
	`;

	// Simulate sensor updates using addJitter (IR-0009 FIX)
	let baseX = 0.5;
	let baseY = 0.5;
	setInterval(() => {
		const xEl = container.querySelector('#sensor-x');
		const yEl = container.querySelector('#sensor-y');
		const tsEl = container.querySelector('#sensor-ts');
		// Use addJitter for controlled deterministic noise
		baseX = Math.max(0, Math.min(1, baseX + addJitter(0, 0.02)));
		baseY = Math.max(0, Math.min(1, baseY + addJitter(0, 0.02)));
		if (xEl) xEl.textContent = baseX.toFixed(3);
		if (yEl) yEl.textContent = baseY.toFixed(3);
		if (tsEl) tsEl.textContent = Date.now().toString();

		// IR-0012 FIX: Full pipeline - Sensor → Smooth → FSM → Emit
		const sensorFrame = createSensorFrameFromMouse(baseX, baseY, performance.now());
		const smoothed = smoother.smooth(sensorFrame);
		const action = fsm.process(smoothed);
		const target: AdapterTarget = {
			id: 'gl-sensor',
			bounds: { left: 0, top: 0, width: 300, height: 200 },
		};
		pointerEmitter.emit(action, target);
	}, 100);
}

function createFSMContent(container: HTMLElement): void {
	const states = ['DISARMED', 'ARMED', 'DOWN_COMMIT', 'DRAG'];
	let currentState = 0;

	function render(): void {
		container.innerHTML = `
			<div class="panel fsm-panel">
				<h3>🎛️ FSM State</h3>
				<div class="state-machine">
					${states
						.map(
							(s, i) => `
						<div class="state ${i === currentState ? 'active' : ''}">${s}</div>
					`,
						)
						.join('')}
				</div>
				<button id="fsm-step-btn">Step</button>
				<p class="info">Port 3 - Injector - DELIVER</p>
			</div>
		`;

		const btn = container.querySelector('#fsm-step-btn');
		btn?.addEventListener('click', () => {
			currentState = (currentState + 1) % states.length;
			console.log('[GoldenLayout Demo] FSM transition to', states[currentState]);
			render();
		});
	}

	render();
}

function createVisualizerContent(container: HTMLElement): void {
	container.innerHTML = `
		<div class="panel viz-panel">
			<h3>📊 Visualizer</h3>
			<canvas id="viz-canvas" width="300" height="200"></canvas>
			<p class="info">Port 2 - Shaper - SHAPE</p>
		</div>
	`;

	const canvas = container.querySelector('#viz-canvas') as HTMLCanvasElement;
	const ctx = canvas?.getContext('2d');
	if (!ctx) return;

	const data: number[] = Array(50).fill(0.5);

	function draw(): void {
		if (!ctx) return;
		ctx.fillStyle = '#0f172a';
		ctx.fillRect(0, 0, 300, 200);

		ctx.strokeStyle = '#22c55e';
		ctx.lineWidth = 2;
		ctx.beginPath();

		for (let i = 0; i < data.length; i++) {
			const x = (i / data.length) * 300;
			const y = (1 - data[i]) * 200;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	// Use addJitter for smooth data variation (IR-0009 FIX)
	let vizValue = 0.5;
	setInterval(() => {
		vizValue = Math.max(0, Math.min(1, vizValue + addJitter(0, 0.08)));
		data.push(vizValue);
		data.shift();
		draw();
	}, 50);

	draw();
}

function createLogContent(container: HTMLElement): void {
	const logs: string[] = ['[Init] Event log ready'];

	container.innerHTML = `
		<div class="panel log-panel">
			<h3>📋 Event Log</h3>
			<div id="log-entries"></div>
			<p class="info">Port 6 - Assimilator - STORE</p>
		</div>
	`;

	// Update log periodically with simulated events (IR-0009 FIX)
	let logEventIndex = 0;
	setInterval(() => {
		const events = ['sensor.update', 'fsm.transition', 'layout.change', 'tile.focus'];
		const event = events[logEventIndex % events.length];
		logEventIndex++;
		logs.unshift(`[${new Date().toLocaleTimeString()}] ${event}`);
		if (logs.length > 10) logs.pop();

		const entries = container.querySelector('#log-entries');
		if (entries) {
			entries.innerHTML = logs.map((l) => `<div class="log-entry">${l}</div>`).join('');
		}
	}, 2000);
}

// ============================================================================
// LAYOUT CONFIGURATION (Using correct UIShellConfig schema)
// ============================================================================

function getDefaultConfig(): UIShellConfig {
	return {
		shell: 'golden',
		initialLayout: {
			tiles: [
				{ id: 'sensor-1', type: 'dom' as TileType, title: '🔍 Sensors' },
				{ id: 'fsm-1', type: 'dom' as TileType, title: '🎛️ FSM' },
				{ id: 'viz-1', type: 'dom' as TileType, title: '📊 Visualizer' },
				{ id: 'log-1', type: 'dom' as TileType, title: '📋 Log' },
			],
			arrangement: {
				direction: 'row',
				first: {
					direction: 'column',
					first: 'sensor-1',
					second: 'fsm-1',
					splitPercentage: 50,
				},
				second: {
					direction: 'column',
					first: 'viz-1',
					second: 'log-1',
					splitPercentage: 50,
				},
				splitPercentage: 50,
			},
			shell: 'golden',
		},
		allowDragDrop: true,
		allowSplit: true,
		allowClose: true,
	};
}

function getHorizontalConfig(): UIShellConfig {
	return {
		shell: 'golden',
		initialLayout: {
			tiles: [
				{ id: 'sensor-1', type: 'dom' as TileType, title: '🔍 Sensors' },
				{ id: 'fsm-1', type: 'dom' as TileType, title: '🎛️ FSM' },
				{ id: 'viz-1', type: 'dom' as TileType, title: '📊 Visualizer' },
				{ id: 'log-1', type: 'dom' as TileType, title: '📋 Log' },
			],
			arrangement: {
				direction: 'row',
				first: {
					direction: 'row',
					first: 'sensor-1',
					second: 'fsm-1',
					splitPercentage: 50,
				},
				second: {
					direction: 'row',
					first: 'viz-1',
					second: 'log-1',
					splitPercentage: 50,
				},
				splitPercentage: 50,
			},
			shell: 'golden',
		},
		allowDragDrop: true,
		allowSplit: true,
		allowClose: true,
	};
}

// ============================================================================
// TILE OPERATIONS
// ============================================================================

function addNewTile(prefix: string, title: string): void {
	state.tileCount++;
	const tileId = `${prefix}-${state.tileCount}`;
	const config: TileConfig = {
		id: tileId,
		type: 'dom' as TileType,
		title,
	};

	try {
		shell.addTile(config);
		console.log('[GoldenLayout Demo] Added tile:', tileId);
	} catch (err) {
		console.error('[GoldenLayout Demo] Failed to add tile:', err);
	}
}

// ============================================================================
// RENDERING
// ============================================================================

function renderControls(): void {
	const controls = document.getElementById('layout-controls');
	if (!controls) return;

	controls.innerHTML = `
		<div class="controls-panel">
			<h3>Layout Presets</h3>
			<div class="buttons">
				<button id="btn-grid">⊞ Grid</button>
				<button id="btn-horizontal">⬌ Horizontal</button>
			</div>
			
			<h3>Add Component</h3>
			<div class="buttons">
				<button id="btn-add-sensor">+ Sensors</button>
				<button id="btn-add-fsm">+ FSM</button>
				<button id="btn-add-viz">+ Visualizer</button>
				<button id="btn-add-log">+ Log</button>
			</div>
			
			<h3>Layout History</h3>
			<div class="history">
				${
					state.layoutHistory
						.slice(-5)
						.map((h) => `<span class="history-item">${h}</span>`)
						.join(' → ') || 'None'
				}
			</div>
			
			<div class="adapter-info">
				<h4>GoldenLayoutShellAdapter</h4>
				<div>UIShellPort interface</div>
				<div>Port 7 - Spider Sovereign - NAVIGATE</div>
			</div>
		</div>
	`;

	// Wire up button handlers
	document.getElementById('btn-grid')?.addEventListener('click', () => {
		state.layoutHistory.push('grid');
		shell.setLayout(getDefaultConfig().initialLayout as LayoutState);
		renderControls();
	});

	document.getElementById('btn-horizontal')?.addEventListener('click', () => {
		state.layoutHistory.push('horizontal');
		shell.setLayout(getHorizontalConfig().initialLayout as LayoutState);
		renderControls();
	});

	document.getElementById('btn-add-sensor')?.addEventListener('click', () => {
		addNewTile('sensor', '🔍 New Sensors');
	});

	document.getElementById('btn-add-fsm')?.addEventListener('click', () => {
		addNewTile('fsm', '🎛️ New FSM');
	});

	document.getElementById('btn-add-viz')?.addEventListener('click', () => {
		addNewTile('viz', '📊 New Viz');
	});

	document.getElementById('btn-add-log')?.addEventListener('click', () => {
		addNewTile('log', '📋 New Log');
	});
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init(): Promise<void> {
	const app = document.getElementById('app');
	if (!app) return;

	// Connect bus first (required before any publish operations)
	await bus.connect();

	// Inject styles
	const style = document.createElement('style');
	style.textContent = `
		.gl-page { display: grid; grid-template-columns: 1fr 280px; gap: 20px; padding: 20px; height: 100vh; box-sizing: border-box; }
		#layout-container { background: #0f172a; border-radius: 12px; overflow: hidden; min-height: 600px; }
		.controls-panel { background: #1e293b; padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 15px; }
		.controls-panel h3 { color: #94a3b8; margin: 0 0 8px 0; font-size: 14px; }
		.controls-panel h4 { color: #64748b; margin: 0 0 4px 0; font-size: 12px; }
		.buttons { display: flex; flex-wrap: wrap; gap: 6px; }
		.buttons button { padding: 8px 12px; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #e2e8f0; cursor: pointer; font-size: 12px; }
		.buttons button:hover { background: #475569; }
		.history { color: #64748b; font-size: 11px; word-break: break-all; }
		.history-item { background: #334155; padding: 2px 6px; border-radius: 3px; }
		.adapter-info { margin-top: auto; padding-top: 15px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
		
		/* Panel styles */
		.panel { padding: 15px; height: 100%; box-sizing: border-box; background: #1e293b; }
		.panel h3 { color: #e2e8f0; margin: 0 0 15px 0; font-size: 14px; }
		.panel .info { color: #64748b; font-size: 11px; margin-top: auto; position: absolute; bottom: 10px; }
		
		.sensor-panel .metrics { display: grid; gap: 10px; }
		.sensor-panel .metric { display: flex; justify-content: space-between; }
		.sensor-panel .label { color: #94a3b8; }
		.sensor-panel .value { color: #22c55e; font-family: monospace; }
		
		.fsm-panel .state-machine { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; }
		.fsm-panel .state { padding: 8px; background: #0f172a; border-radius: 4px; color: #64748b; text-align: center; font-size: 12px; }
		.fsm-panel .state.active { background: #3b82f6; color: white; }
		.fsm-panel button { padding: 8px 16px; background: #334155; border: 1px solid #475569; border-radius: 6px; color: #e2e8f0; cursor: pointer; }
		
		.log-panel #log-entries { max-height: 300px; overflow-y: auto; }
		.log-panel .log-entry { font-size: 10px; color: #94a3b8; font-family: monospace; padding: 4px 0; border-bottom: 1px solid #334155; word-break: break-all; }
		
		.viz-panel canvas { border: 1px solid #334155; border-radius: 4px; }
		
		/* Tile container styles */
		[data-tile-id] { background: #1e293b; padding: 10px; height: 100%; box-sizing: border-box; overflow: auto; }
	`;
	document.head.appendChild(style);

	// Create page structure
	app.innerHTML = `
		<div class="gl-page">
			<div id="layout-container"></div>
			<div id="layout-controls"></div>
		</div>
	`;

	// Register the 'dom' component factory BEFORE initializing
	// The factory receives the container and creates the appropriate content
	shell.registerComponent('dom' as TileType, (container: HTMLElement, config?: { id?: string }) => {
		const tileId = config?.id || 'unknown';
		createDOMContent(container, tileId);
	});

	// Initialize with default layout
	const container = document.getElementById('layout-container');
	if (container) {
		await shell.initialize(container, getDefaultConfig());
		state.initialized = true;
		state.layoutHistory.push('default');
		state.tileCount = 4; // We started with 4 tiles

		// Publish init event (bus is now connected)
		await bus.publish('shell.initialized', { preset: 'default', timestamp: Date.now() });
		console.log('[GoldenLayout Demo] Shell initialized with default layout');
	}

	// Render controls
	renderControls();

	// Subscribe to layout changes and log them
	shell.onLayoutChange((layout) => {
		console.log('[GoldenLayout Demo] Layout changed:', layout);
		bus.publish('layout.changed', layout).catch(console.error);
	});
}

// Run on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
} else {
	init().catch(console.error);
}

export { bus, shell, state };
