/**
 * Smoother Demo - Port 2 SHAPE
 *
 * Gen87.X3 | TypeScript Demo with REAL Enforcement
 *
 * This demo uses TypeScript to ENFORCE correct API usage:
 * - smooth(frame: SensorFrame): SmoothedFrame
 * - NOT smooth({value, timestamp}) - that's a TYPE ERROR
 *
 * Build: npx vite build --config demos/vite.config.ts
 * Dev: npx vite --config demos/vite.config.ts
 */

import {
	InMemorySubstrateAdapter,
	ONE_EURO_BETA_DEFAULT,
	ONE_EURO_MINCUTOFF_DEFAULT,
	OneEuroExemplarAdapter,
	PointerEventAdapter,
	type SensorFrame,
	type SmoothedFrame,
	XStateFSMAdapter,
	addJitter,
	createSensorFrameFromMouse,
} from '../../hot/bronze/src/browser/index.js';
import type { AdapterTarget } from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// CONTRACT ENFORCEMENT: TypeScript catches wrong API at compile time
// ============================================================================

// The smoother requires a SensorFrame, not a simple {value, timestamp} object.
// TypeScript will error if you try to pass the wrong type.
// Example of CORRECT usage:
const smoother = new OneEuroExemplarAdapter();

// IR-0012 FIX: Complete pipeline - add FSM and Emitter
const fsm = new XStateFSMAdapter();
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// CORRECT - createSensorFrameFromMouse returns SensorFrame:
const frame: SensorFrame = createSensorFrameFromMouse(0.5, 0.5, performance.now());
const smoothed: SmoothedFrame = smoother.smooth(frame);

// ============================================================================
// DEMO STATE
// ============================================================================

interface DemoState {
	bus: InMemorySubstrateAdapter;
	smoother: OneEuroExemplarAdapter;
	params: {
		minCutoff: number;
		beta: number;
		jitterAmount: number;
	};
	trails: {
		raw: Array<{ x: number; y: number }>;
		smooth: Array<{ x: number; y: number }>;
	};
	stats: {
		rawJitter: number;
		smoothJitter: number;
		reduction: number;
		fps: number;
	};
}

const TRAIL_LENGTH = 100;

const state: DemoState = {
	bus: new InMemorySubstrateAdapter(),
	smoother: new OneEuroExemplarAdapter(),
	params: {
		minCutoff: ONE_EURO_MINCUTOFF_DEFAULT,
		beta: ONE_EURO_BETA_DEFAULT,
		jitterAmount: 0.02,
	},
	trails: {
		raw: [],
		smooth: [],
	},
	stats: {
		rawJitter: 0,
		smoothJitter: 0,
		reduction: 0,
		fps: 0,
	},
};

// ============================================================================
// PROCESSING PIPELINE (CORRECT API USAGE)
// ============================================================================

/**
 * Process mouse input through the smoother
 * Uses createSensorFrameFromMouse to create proper SensorFrame
 */
function processInput(x: number, y: number): void {
	const ts = performance.now();

	// Add jitter to raw input for demonstration
	const jitteredX = addJitter(x, state.params.jitterAmount);
	const jitteredY = addJitter(y, state.params.jitterAmount);

	// Create PROPER SensorFrame using the helper
	// This is type-safe - TypeScript enforces correct structure
	const sensorFrame: SensorFrame = createSensorFrameFromMouse(jitteredX, jitteredY, ts);

	// Smooth using CORRECT API: smooth(SensorFrame) -> SmoothedFrame
	const smoothedFrame: SmoothedFrame = state.smoother.smooth(sensorFrame);

	// IR-0012 FIX: Complete pipeline - FSM + Emit
	const action = fsm.process(smoothedFrame);
	const target: AdapterTarget = {
		id: 'smoother-canvas',
		bounds: { left: 0, top: 0, width: 800, height: 600 },
	};
	pointerEmitter.emit(action, target);

	// Update trails
	state.trails.raw.push({ x: jitteredX, y: jitteredY });
	if (state.trails.raw.length > TRAIL_LENGTH) state.trails.raw.shift();

	if (smoothedFrame.position) {
		state.trails.smooth.push({ x: smoothedFrame.position.x, y: smoothedFrame.position.y });
		if (state.trails.smooth.length > TRAIL_LENGTH) state.trails.smooth.shift();
	}

	// Publish to message bus
	state.bus.publish('sensor.raw', sensorFrame);
	state.bus.publish('smoother.output', smoothedFrame);

	// Update stats
	updateStats();
}

/**
 * Calculate jitter statistics
 */
function updateStats(): void {
	if (state.trails.raw.length < 3) return;

	const rawJitter = calculateJitter(state.trails.raw);
	const smoothJitter = calculateJitter(state.trails.smooth);

	state.stats.rawJitter = rawJitter;
	state.stats.smoothJitter = smoothJitter;
	state.stats.reduction = rawJitter > 0 ? ((rawJitter - smoothJitter) / rawJitter) * 100 : 0;
}

function calculateJitter(trail: Array<{ x: number; y: number }>): number {
	if (trail.length < 3) return 0;

	let totalDelta = 0;
	for (let i = 2; i < trail.length; i++) {
		const prev = trail[i - 1];
		const curr = trail[i];
		const prevPrev = trail[i - 2];

		// Second derivative (acceleration) as jitter metric
		const ax = curr.x - 2 * prev.x + prevPrev.x;
		const ay = curr.y - 2 * prev.y + prevPrev.y;
		totalDelta += Math.sqrt(ax * ax + ay * ay);
	}

	return totalDelta / (trail.length - 2);
}

// ============================================================================
// DOM RENDERING
// ============================================================================

let canvas: HTMLCanvasElement | null = null;
let statsEl: HTMLElement | null = null;

function render(): void {
	if (!canvas) return;

	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const w = canvas.width;
	const h = canvas.height;

	// Clear
	ctx.fillStyle = '#0d1117';
	ctx.fillRect(0, 0, w, h);

	// Draw raw trail (red)
	if (state.trails.raw.length > 1) {
		ctx.beginPath();
		ctx.strokeStyle = '#f85149';
		ctx.lineWidth = 2;
		state.trails.raw.forEach((p, i) => {
			const px = p.x * w;
			const py = p.y * h;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		});
		ctx.stroke();
	}

	// Draw smooth trail (green)
	if (state.trails.smooth.length > 1) {
		ctx.beginPath();
		ctx.strokeStyle = '#3fb950';
		ctx.lineWidth = 3;
		state.trails.smooth.forEach((p, i) => {
			const px = p.x * w;
			const py = p.y * h;
			if (i === 0) ctx.moveTo(px, py);
			else ctx.lineTo(px, py);
		});
		ctx.stroke();
	}

	// Update stats display
	if (statsEl) {
		statsEl.innerHTML = `
			<div>Raw Jitter: ${(state.stats.rawJitter * 1000).toFixed(2)}</div>
			<div>Smooth Jitter: ${(state.stats.smoothJitter * 1000).toFixed(2)}</div>
			<div>Reduction: ${state.stats.reduction.toFixed(1)}%</div>
		`;
	}

	requestAnimationFrame(render);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initSmootherDemo(canvasId: string, statsId: string): Promise<void> {
	canvas = document.getElementById(canvasId) as HTMLCanvasElement;
	statsEl = document.getElementById(statsId);

	if (!canvas) throw new Error(`Canvas element ${canvasId} not found`);

	// Connect message bus
	await state.bus.connect();
	console.log('[SmootherDemo] ✅ InMemorySubstrateAdapter connected');

	// Set canvas size
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;

	// Mouse input handler
	canvas.addEventListener('mousemove', (e) => {
		const rect = canvas?.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;
		processInput(x, y);
	});

	// Start render loop
	render();

	console.log('[SmootherDemo] ✅ Demo initialized with TypeScript enforcement');
	console.log('[SmootherDemo] Using CORRECT API: smoother.smooth(SensorFrame)');
}

// Export for browser
(window as unknown as { initSmootherDemo: typeof initSmootherDemo }).initSmootherDemo =
	initSmootherDemo;
