/**
 * Rapier Physics Showcase Demo - Port 2 SHAPE
 *
 * Gen87.X3 | RapierPhysicsAdapter Showcase
 *
 * PURPOSE: Demonstrate RapierPhysicsAdapter in ISOLATION
 * This demo uses the REAL RapierPhysicsAdapter from hot/bronze/src/adapters
 *
 * ARCHITECTURE ENFORCEMENT:
 * - Uses RapierPhysicsAdapter (REAL WASM physics, not theater)
 * - Demonstrates SmootherPort interface
 * - Shows three modes: smoothed, predictive, adaptive
 *
 * @port 2
 * @verb SHAPE
 * @binary 010
 * @element Water - Flowing, taking shape of container
 */

import {
	GestureLabels,
	InMemorySubstrateAdapter,
	PointerEventAdapter,
	RapierPhysicsAdapter,
	XStateFSMAdapter,
	createSensorFrameFromMouse,
} from '../../hot/bronze/src/browser/index.js';
import type { AdapterTarget } from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION (Constraint Test Will Verify This)
// ============================================================================

// Port 2 - Rapier Physics (THREE MODES)
// Store configs for type-safe display (adapters have private config)
const rapierSmoothedConfig = { mode: 'smoothed' as const, stiffness: 200, damping: 1.2 };
const rapierPredictiveConfig = { mode: 'predictive' as const, predictionMs: 50 };
const rapierAdaptiveConfig = {
	mode: 'adaptive' as const,
	minStiffness: 50,
	speedCoefficient: 300,
};

const rapierSmoothed = new RapierPhysicsAdapter(rapierSmoothedConfig);
const rapierPredictive = new RapierPhysicsAdapter(rapierPredictiveConfig);
const rapierAdaptive = new RapierPhysicsAdapter(rapierAdaptiveConfig);

// Port 3 - FSM (IR-0012 FIX: Complete pipeline)
const fsm = new XStateFSMAdapter();

// Port 5 - Pointer Event Emitter (IR-0012 FIX: Complete pipeline)
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// Message Bus
const bus = new InMemorySubstrateAdapter();

// ============================================================================
// STATE
// ============================================================================

interface DemoState {
	initialized: boolean;
	activeMode: 'smoothed' | 'predictive' | 'adaptive';
	rawPosition: { x: number; y: number };
	smoothedPosition: { x: number; y: number };
	frameCount: number;
	lastTs: number;
	trail: Array<{ x: number; y: number; mode: string }>;
}

const state: DemoState = {
	initialized: false,
	activeMode: 'smoothed',
	rawPosition: { x: 0.5, y: 0.5 },
	smoothedPosition: { x: 0.5, y: 0.5 },
	frameCount: 0,
	lastTs: 0,
	trail: [],
};

// ============================================================================
// CANVAS RENDERING
// ============================================================================

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

function initCanvas(): void {
	canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('Canvas 2D context not available');
	ctx = context;

	// Handle resize
	function resize(): void {
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * window.devicePixelRatio;
		canvas.height = rect.height * window.devicePixelRatio;
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
	}
	resize();
	window.addEventListener('resize', resize);
}

function render(): void {
	const w = canvas.width / window.devicePixelRatio;
	const h = canvas.height / window.devicePixelRatio;

	// Clear
	ctx.fillStyle = '#0f172a';
	ctx.fillRect(0, 0, w, h);

	// Draw grid
	ctx.strokeStyle = '#1e293b';
	ctx.lineWidth = 1;
	for (let i = 0; i <= 10; i++) {
		ctx.beginPath();
		ctx.moveTo((i / 10) * w, 0);
		ctx.lineTo((i / 10) * w, h);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, (i / 10) * h);
		ctx.lineTo(w, (i / 10) * h);
		ctx.stroke();
	}

	// Draw trail
	if (state.trail.length > 1) {
		ctx.beginPath();
		ctx.strokeStyle = getTrailColor(state.activeMode);
		ctx.lineWidth = 2;
		for (let i = 0; i < state.trail.length; i++) {
			const p = state.trail[i];
			const x = p.x * w;
			const y = p.y * h;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	// Draw raw position (red dot)
	ctx.beginPath();
	ctx.fillStyle = '#ef4444';
	ctx.arc(state.rawPosition.x * w, state.rawPosition.y * h, 8, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 2;
	ctx.stroke();

	// Draw smoothed position (green dot)
	ctx.beginPath();
	ctx.fillStyle = getModeColor(state.activeMode);
	ctx.arc(state.smoothedPosition.x * w, state.smoothedPosition.y * h, 12, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = '#fff';
	ctx.lineWidth = 2;
	ctx.stroke();

	// Labels
	ctx.fillStyle = '#94a3b8';
	ctx.font = '12px monospace';
	ctx.fillText('● Raw Input (Mouse)', 10, 20);
	ctx.fillStyle = getModeColor(state.activeMode);
	ctx.fillText(`● Smoothed (${state.activeMode})`, 10, 40);
}

function getModeColor(mode: string): string {
	switch (mode) {
		case 'smoothed':
			return '#22c55e';
		case 'predictive':
			return '#3b82f6';
		case 'adaptive':
			return '#a855f7';
		default:
			return '#22c55e';
	}
}

function getTrailColor(mode: string): string {
	switch (mode) {
		case 'smoothed':
			return 'rgba(34, 197, 94, 0.3)';
		case 'predictive':
			return 'rgba(59, 130, 246, 0.3)';
		case 'adaptive':
			return 'rgba(168, 85, 247, 0.3)';
		default:
			return 'rgba(34, 197, 94, 0.3)';
	}
}

// ============================================================================
// PHYSICS PROCESSING
// ============================================================================

function getActiveAdapter(): RapierPhysicsAdapter {
	switch (state.activeMode) {
		case 'smoothed':
			return rapierSmoothed;
		case 'predictive':
			return rapierPredictive;
		case 'adaptive':
			return rapierAdaptive;
	}
}

// Type-safe config access (adapters have private config)
function getActiveConfig():
	| typeof rapierSmoothedConfig
	| typeof rapierPredictiveConfig
	| typeof rapierAdaptiveConfig {
	switch (state.activeMode) {
		case 'smoothed':
			return rapierSmoothedConfig;
		case 'predictive':
			return rapierPredictiveConfig;
		case 'adaptive':
			return rapierAdaptiveConfig;
	}
}

async function processFrame(x: number, y: number): Promise<void> {
	const ts = performance.now();
	state.rawPosition = { x, y };

	// Create sensor frame
	const sensorFrame = createSensorFrameFromMouse(x, y, ts, GestureLabels.OPEN_PALM);

	// Smooth with active adapter (Port 2 - SHAPE)
	const adapter = getActiveAdapter();
	const smoothed = adapter.smooth(sensorFrame);

	if (smoothed.position) {
		state.smoothedPosition = { x: smoothed.position.x, y: smoothed.position.y };

		// Add to trail
		state.trail.push({ ...state.smoothedPosition, mode: state.activeMode });
		if (state.trail.length > 100) state.trail.shift();
	}

	// IR-0012 FIX: Complete pipeline - FSM (Port 3)
	const action = fsm.process(smoothed);

	// IR-0012 FIX: Complete pipeline - Emit (Port 5)
	const target: AdapterTarget = {
		id: 'rapier-canvas',
		bounds: canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: 800, height: 600 },
	};
	const pointerEvent = pointerEmitter.emit(action, target);

	state.frameCount++;
	state.lastTs = ts;

	// Publish to bus
	await bus.publish('rapier.frame', {
		mode: state.activeMode,
		raw: state.rawPosition,
		smoothed: state.smoothedPosition,
		action: action.action,
		pointerEvent: pointerEvent?.type,
		ts,
	});

	render();
	updateStats();
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateStats(): void {
	const statsEl = document.getElementById('stats');
	if (!statsEl) return;

	// Type-safe config access (config stored separately to avoid casting)
	const config = getActiveConfig();

	// Build config display based on mode (different modes have different properties)
	let configDisplay = '';
	if ('stiffness' in config && 'damping' in config) {
		configDisplay = `stiffness=${config.stiffness}, damping=${config.damping}`;
	} else if ('predictionMs' in config) {
		configDisplay = `predictionMs=${config.predictionMs}`;
	} else if ('minStiffness' in config && 'speedCoefficient' in config) {
		configDisplay = `minStiffness=${config.minStiffness}, speedCoeff=${config.speedCoefficient}`;
	}

	statsEl.innerHTML = `
		<div class="stat">
			<span class="label">Mode</span>
			<span class="value">${state.activeMode.toUpperCase()}</span>
		</div>
		<div class="stat">
			<span class="label">Raw</span>
			<span class="value">(${state.rawPosition.x.toFixed(3)}, ${state.rawPosition.y.toFixed(3)})</span>
		</div>
		<div class="stat">
			<span class="label">Smoothed</span>
			<span class="value">(${state.smoothedPosition.x.toFixed(3)}, ${state.smoothedPosition.y.toFixed(3)})</span>
		</div>
		<div class="stat">
			<span class="label">Frames</span>
			<span class="value">${state.frameCount}</span>
		</div>
		<div class="stat">
			<span class="label">Config</span>
			<span class="value">${configDisplay}</span>
		</div>
	`;
}

function renderControls(): void {
	const controls = document.getElementById('controls');
	if (!controls) return;

	controls.innerHTML = `
		<div class="controls-panel">
			<h3>Physics Mode</h3>
			<div class="buttons">
				<button id="btn-smoothed" class="${state.activeMode === 'smoothed' ? 'active' : ''}">
					🌊 Smoothed
				</button>
				<button id="btn-predictive" class="${state.activeMode === 'predictive' ? 'active' : ''}">
					🎯 Predictive
				</button>
				<button id="btn-adaptive" class="${state.activeMode === 'adaptive' ? 'active' : ''}">
					⚡ Adaptive
				</button>
			</div>
			
			<h3>Mode Details</h3>
			<div class="mode-info">
				${getModeDescription(state.activeMode)}
			</div>
			
			<button id="btn-clear" class="clear-btn">Clear Trail</button>
			
			<div class="adapter-info">
				<h4>RapierPhysicsAdapter</h4>
				<div>SmootherPort interface</div>
				<div>Port 2 - Mirror Magus - SHAPE</div>
				<div>REAL WASM physics (@dimforge/rapier2d)</div>
			</div>
		</div>
	`;

	// Wire up buttons
	document.getElementById('btn-smoothed')?.addEventListener('click', () => {
		state.activeMode = 'smoothed';
		state.trail = [];
		renderControls();
	});

	document.getElementById('btn-predictive')?.addEventListener('click', () => {
		state.activeMode = 'predictive';
		state.trail = [];
		renderControls();
	});

	document.getElementById('btn-adaptive')?.addEventListener('click', () => {
		state.activeMode = 'adaptive';
		state.trail = [];
		renderControls();
	});

	document.getElementById('btn-clear')?.addEventListener('click', () => {
		state.trail = [];
		render();
	});
}

function getModeDescription(mode: string): string {
	switch (mode) {
		case 'smoothed':
			return `
				<p><strong>Spring-Damper Model</strong></p>
				<p>Classic physics simulation with spring force pulling cursor toward target.</p>
				<ul>
					<li>Stiffness: 200 (snappy response)</li>
					<li>Damping: 1.2 (critically damped)</li>
					<li>Best for: General smoothing</li>
				</ul>
			`;
		case 'predictive':
			return `
				<p><strong>Trajectory Prediction</strong></p>
				<p>Simulates future position for latency compensation.</p>
				<ul>
					<li>Lookahead: 50ms (3 frames @ 60fps)</li>
					<li>Best for: High-latency input</li>
					<li>Trade-off: Can overshoot</li>
				</ul>
			`;
		case 'adaptive':
			return `
				<p><strong>1€ Filter-Inspired Physics</strong></p>
				<p>Velocity-adaptive stiffness (KEY INNOVATION)</p>
				<ul>
					<li>Low speed → Lower stiffness (jitter reduction)</li>
					<li>High speed → Higher stiffness (lag reduction)</li>
					<li>Formula: stiffness = min + β × |velocity|</li>
				</ul>
			`;
		default:
			return '';
	}
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function init(): Promise<void> {
	const app = document.getElementById('app');
	if (!app) return;

	// Connect bus
	await bus.connect();

	// Initialize all adapters (WASM needs async init)
	// NOTE: Method is init(), not initialize()
	await Promise.all([rapierSmoothed.init(), rapierPredictive.init(), rapierAdaptive.init()]);

	// Inject styles
	const style = document.createElement('style');
	style.textContent = `
		.rapier-page { display: grid; grid-template-columns: 1fr 300px; gap: 20px; padding: 20px; height: 100vh; box-sizing: border-box; }
		#physics-canvas { width: 100%; height: 100%; background: #0f172a; border-radius: 12px; cursor: crosshair; }
		.controls-panel { background: #1e293b; padding: 15px; border-radius: 12px; display: flex; flex-direction: column; gap: 15px; }
		.controls-panel h3 { color: #94a3b8; margin: 0 0 8px 0; font-size: 14px; }
		.controls-panel h4 { color: #64748b; margin: 0 0 4px 0; font-size: 12px; }
		.buttons { display: flex; flex-direction: column; gap: 6px; }
		.buttons button { padding: 10px 12px; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #e2e8f0; cursor: pointer; font-size: 12px; text-align: left; }
		.buttons button:hover { background: #475569; }
		.buttons button.active { background: #3b82f6; border-color: #3b82f6; }
		.mode-info { background: #0f172a; padding: 12px; border-radius: 8px; font-size: 12px; color: #94a3b8; }
		.mode-info p { margin: 0 0 8px 0; }
		.mode-info ul { margin: 0; padding-left: 20px; }
		.mode-info li { margin: 4px 0; }
		.clear-btn { padding: 8px 12px; background: #ef4444; border: none; border-radius: 6px; color: white; cursor: pointer; }
		.adapter-info { margin-top: auto; padding-top: 15px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
		#stats { background: #0f172a; padding: 12px; border-radius: 8px; display: grid; gap: 8px; }
		.stat { display: flex; justify-content: space-between; font-size: 11px; }
		.stat .label { color: #64748b; }
		.stat .value { color: #22c55e; font-family: monospace; }
	`;
	document.head.appendChild(style);

	// Create page
	app.innerHTML = `
		<div class="rapier-page">
			<canvas id="physics-canvas"></canvas>
			<div>
				<div id="controls"></div>
				<div id="stats" style="margin-top: 15px;"></div>
			</div>
		</div>
	`;

	// Initialize canvas
	initCanvas();

	// Mouse tracking
	canvas.addEventListener('mousemove', (e) => {
		const rect = canvas.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		processFrame(x, y).catch(console.error);
	});

	// Touch tracking
	canvas.addEventListener(
		'touchmove',
		(e) => {
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const touch = e.touches[0];
			const x = (touch.clientX - rect.left) / rect.width;
			const y = (touch.clientY - rect.top) / rect.height;
			processFrame(x, y).catch(console.error);
		},
		{ passive: false },
	);

	// Render UI
	renderControls();
	updateStats();
	render();

	state.initialized = true;
	await bus.publish('rapier.initialized', { modes: ['smoothed', 'predictive', 'adaptive'] });
	console.log('[Rapier Demo] Initialized with REAL WASM physics');
}

// Run
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => init().catch(console.error));
} else {
	init().catch(console.error);
}

export { bus, rapierAdaptive, rapierPredictive, rapierSmoothed, state };
