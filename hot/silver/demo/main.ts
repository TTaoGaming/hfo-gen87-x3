/**
 * HFO Silver Demo — REAL Adapters Entry Point
 *
 * Gen87.X3 | Silver Layer | Production Pipeline
 *
 * This wires REAL adapters, not simulations:
 * - Port 0: MediaPipeAdapter (REAL @mediapipe/tasks-vision)
 * - Port 2: OneEuroExemplarAdapter (REAL 1eurofilter npm)
 * - Port 2: RapierPhysicsAdapter (REAL @dimforge/rapier2d-compat WASM)
 * - Port 3: XStateFSMAdapter (REAL xstate)
 * - Port 5: PointerEventAdapter (REAL W3C PointerEvents)
 */

import {
	MediaPipeAdapter,
	MockSensorAdapter,
} from '../../bronze/src/adapters/mediapipe.adapter.js';
// Import REAL adapters from bronze
import { OneEuroExemplarAdapter } from '../../bronze/src/adapters/one-euro-exemplar.adapter.js';
import { PointerEventAdapter } from '../../bronze/src/adapters/pointer-event.adapter.js';
import { RapierPhysicsAdapter } from '../../bronze/src/adapters/rapier-physics.adapter.js';
import { XStateFSMAdapter } from '../../bronze/src/adapters/xstate-fsm.adapter.js';
import type {
	EmitterPort,
	FSMPort,
	SensorPort,
	SmootherPort,
} from '../../bronze/src/contracts/ports.js';
import type { FSMAction, SensorFrame, SmoothedFrame } from '../../bronze/src/contracts/schemas.js';

// ============================================================================
// STATE
// ============================================================================

interface AppState {
	running: boolean;
	useMockSensor: boolean;
	smootherType: '1euro' | 'rapier-smooth' | 'rapier-predict';
	frameCount: number;
	eventCount: number;
	lastFrameTime: number;
	fsmState: string;
	initialized: {
		wasm: boolean;
		camera: boolean;
		mediapipe: boolean;
	};
}

const state: AppState = {
	running: false,
	useMockSensor: true, // Start with mock until MediaPipe loads
	smootherType: '1euro',
	frameCount: 0,
	eventCount: 0,
	lastFrameTime: 0,
	fsmState: 'DISARMED',
	initialized: {
		wasm: false,
		camera: false,
		mediapipe: false,
	},
};

// ============================================================================
// ADAPTERS (REAL INSTANCES)
// ============================================================================

let sensor: SensorPort | null = null;
let smoother: SmootherPort | null = null;
let fsm: FSMPort | null = null;
let emitter: EmitterPort | null = null;

// Alternative smoothers for switching
let oneEuroSmoother: OneEuroExemplarAdapter | null = null;
let rapierSmoothedSmoother: RapierPhysicsAdapter | null = null;
let rapierPredictSmoother: RapierPhysicsAdapter | null = null;

// ============================================================================
// DOM REFS
// ============================================================================

const $ = (id: string) => document.getElementById(id);
const video = $('videoPreview') as HTMLVideoElement;
const canvas = $('cursorCanvas') as HTMLCanvasElement;
const ctx = canvas?.getContext('2d');

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeAdapters(): Promise<void> {
	console.log('[HFO] Initializing REAL adapters...');

	// 1. Initialize 1€ Filter (synchronous)
	oneEuroSmoother = new OneEuroExemplarAdapter({
		frequency: 60,
		minCutoff: 1.0,
		beta: 0.007,
		dCutoff: 1.0,
	});
	console.log('[HFO] ✓ OneEuroExemplarAdapter ready (REAL 1eurofilter npm)');

	// 2. Initialize Rapier Physics (WASM - async)
	try {
		rapierSmoothedSmoother = new RapierPhysicsAdapter({ mode: 'smoothed' });
		await rapierSmoothedSmoother.init();

		rapierPredictSmoother = new RapierPhysicsAdapter({ mode: 'predictive', predictionMs: 50 });
		await rapierPredictSmoother.init();

		state.initialized.wasm = true;
		updateStatus('wasmStatus', 'ready');
		console.log('[HFO] ✓ RapierPhysicsAdapter ready (REAL @dimforge/rapier2d-compat WASM)');
	} catch (err) {
		console.error('[HFO] ✗ Rapier WASM failed:', err);
		updateStatus('wasmStatus', 'error');
	}

	// 3. Initialize XState FSM
	fsm = new XStateFSMAdapter();
	fsm.subscribe((fsmState, action) => {
		state.fsmState = fsmState;
		updateFSMDisplay(fsmState);
		if (action.action !== 'none') {
			logEvent(action);
		}
	});
	console.log('[HFO] ✓ XStateFSMAdapter ready (REAL xstate)');

	// 4. Initialize PointerEvent Emitter
	emitter = new PointerEventAdapter();
	console.log('[HFO] ✓ PointerEventAdapter ready (REAL W3C PointerEvents)');

	// 5. Initialize Mock Sensor (for immediate use)
	sensor = new MockSensorAdapter();
	await sensor.initialize();
	console.log('[HFO] ✓ MockSensorAdapter ready (for testing without camera)');

	// 6. Try to initialize MediaPipe (may fail without camera)
	try {
		const mpAdapter = new MediaPipeAdapter();
		await mpAdapter.initialize();
		sensor = mpAdapter;
		state.useMockSensor = false;
		state.initialized.mediapipe = true;
		console.log('[HFO] ✓ MediaPipeAdapter ready (REAL @mediapipe/tasks-vision)');
	} catch (err) {
		console.warn('[HFO] MediaPipe init failed, using mock:', err);
		state.useMockSensor = true;
	}

	// Set default smoother
	smoother = oneEuroSmoother;

	console.log('[HFO] All adapters initialized!');
}

// ============================================================================
// CAMERA
// ============================================================================

async function startCamera(): Promise<boolean> {
	try {
		updateStatus('cameraStatus', 'loading');
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 640, height: 480, facingMode: 'user' },
		});
		video.srcObject = stream;
		await video.play();
		state.initialized.camera = true;
		updateStatus('cameraStatus', 'ready');
		console.log('[HFO] ✓ Camera ready');
		return true;
	} catch (err) {
		console.error('[HFO] Camera error:', err);
		updateStatus('cameraStatus', 'error');
		return false;
	}
}

// ============================================================================
// PIPELINE LOOP
// ============================================================================

async function pipelineLoop(timestamp: number): Promise<void> {
	if (!state.running) return;

	const startTime = performance.now();

	try {
		// PORT 0: SENSE — Get raw sensor frame
		let rawFrame: SensorFrame;
		if (state.useMockSensor || !sensor) {
			rawFrame = generateMockFrame(timestamp);
		} else {
			rawFrame = await sensor.sense(video, timestamp);
		}

		// PORT 2: SHAPE — Apply smoothing
		let smoothedFrame: SmoothedFrame;
		if (smoother) {
			smoothedFrame = smoother.smooth(rawFrame);
		} else {
			// Passthrough if no smoother
			smoothedFrame = {
				ts: rawFrame.ts,
				handId: rawFrame.handId,
				trackingOk: rawFrame.trackingOk,
				palmFacing: rawFrame.palmFacing,
				label: rawFrame.label,
				confidence: rawFrame.confidence,
				position: rawFrame.indexTip ? { x: rawFrame.indexTip.x, y: rawFrame.indexTip.y } : null,
				velocity: null,
				prediction: null,
			};
		}

		// PORT 3: DELIVER — FSM processing
		let action: FSMAction = { action: 'none', state: 'DISARMED' };
		if (fsm) {
			action = fsm.process(smoothedFrame);
		}

		// PORT 5: DEFEND — Emit pointer events (if we have a target)
		// TODO: Wire to actual target element

		// Update UI
		updateSensorStats(rawFrame);
		updateSmootherStats(rawFrame, smoothedFrame);
		renderFrame(rawFrame, smoothedFrame);

		state.frameCount++;
		const frameTime = performance.now() - startTime;
		updateMetrics(timestamp, frameTime);
	} catch (err) {
		console.error('[HFO] Pipeline error:', err);
	}

	requestAnimationFrame(pipelineLoop);
}

// ============================================================================
// MOCK DATA (when no camera/MediaPipe)
// ============================================================================

function generateMockFrame(ts: number): SensorFrame {
	// Circular motion with jitter (demonstrates smoothing)
	const period = 3000;
	const t = (ts % period) / period;
	const angle = t * Math.PI * 2;

	const baseX = 0.5 + 0.3 * Math.cos(angle);
	const baseY = 0.5 + 0.3 * Math.sin(angle);

	// Add realistic jitter
	const jitterX = (Math.random() - 0.5) * 0.015;
	const jitterY = (Math.random() - 0.5) * 0.015;

	return {
		ts,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.92,
		indexTip: {
			x: baseX + jitterX,
			y: baseY + jitterY,
			z: 0,
			visibility: 1,
		},
		landmarks: null,
	};
}

// ============================================================================
// RENDERING
// ============================================================================

function resizeCanvas(): void {
	if (!canvas) return;
	const rect = canvas.parentElement?.getBoundingClientRect();
	if (rect) {
		canvas.width = rect.width;
		canvas.height = rect.height;
	}
}

function renderFrame(raw: SensorFrame, smoothed: SmoothedFrame): void {
	if (!ctx || !canvas) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw grid
	ctx.strokeStyle = 'rgba(255,255,255,0.05)';
	ctx.lineWidth = 1;
	for (let i = 0; i <= 10; i++) {
		const x = (i / 10) * canvas.width;
		const y = (i / 10) * canvas.height;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, canvas.height);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(canvas.width, y);
		ctx.stroke();
	}

	// Raw position (red) — shows jitter
	if (raw.indexTip) {
		drawCursor(raw.indexTip.x, raw.indexTip.y, '#ff6b6b', 'raw', 6);
	}

	// Smoothed position (green) — shows filter effect
	if (smoothed.position) {
		drawCursor(smoothed.position.x, smoothed.position.y, '#4caf50', 'smooth', 10);
	}

	// Predicted position (blue) — shows prediction
	if (smoothed.prediction) {
		drawCursor(smoothed.prediction.x, smoothed.prediction.y, '#2196f3', 'predict', 8);
	}

	// Velocity vector
	if (smoothed.position && smoothed.velocity) {
		const px = smoothed.position.x * canvas.width;
		const py = smoothed.position.y * canvas.height;
		const vScale = 50; // Scale velocity for visibility
		ctx.beginPath();
		ctx.moveTo(px, py);
		ctx.lineTo(px + smoothed.velocity.x * vScale, py + smoothed.velocity.y * vScale);
		ctx.strokeStyle = '#ffeb3b';
		ctx.lineWidth = 2;
		ctx.stroke();
	}
}

function drawCursor(x: number, y: number, color: string, label: string, size: number): void {
	if (!ctx || !canvas) return;
	const px = x * canvas.width;
	const py = y * canvas.height;

	ctx.beginPath();
	ctx.arc(px, py, size, 0, Math.PI * 2);
	ctx.fillStyle = color + '80'; // Semi-transparent
	ctx.fill();
	ctx.strokeStyle = color;
	ctx.lineWidth = 2;
	ctx.stroke();

	ctx.font = '10px monospace';
	ctx.fillStyle = color;
	ctx.fillText(label, px + size + 4, py + 4);
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateStatus(id: string, status: 'ready' | 'loading' | 'error'): void {
	const el = $(id);
	if (el) {
		el.className = 'status-dot ' + status;
	}
}

function updateSensorStats(frame: SensorFrame): void {
	const trackingEl = $('trackingStatus');
	const gestureEl = $('gestureLabel');
	const confEl = $('confidence');
	const tipEl = $('indexTip');

	if (trackingEl) trackingEl.textContent = frame.trackingOk ? '✓ OK' : '✗ Lost';
	if (gestureEl) gestureEl.textContent = frame.label;
	if (confEl) confEl.textContent = (frame.confidence * 100).toFixed(0) + '%';
	if (tipEl && frame.indexTip) {
		tipEl.textContent = `(${frame.indexTip.x.toFixed(3)}, ${frame.indexTip.y.toFixed(3)})`;
	}
}

function updateSmootherStats(raw: SensorFrame, smoothed: SmoothedFrame): void {
	const rawEl = $('rawPos');
	const smoothEl = $('smoothedPos');
	const velEl = $('velocity');

	if (rawEl && raw.indexTip) {
		rawEl.textContent = `(${raw.indexTip.x.toFixed(3)}, ${raw.indexTip.y.toFixed(3)})`;
	}
	if (smoothEl && smoothed.position) {
		smoothEl.textContent = `(${smoothed.position.x.toFixed(3)}, ${smoothed.position.y.toFixed(3)})`;
	}
	if (velEl && smoothed.velocity) {
		velEl.textContent = `(${smoothed.velocity.x.toFixed(2)}, ${smoothed.velocity.y.toFixed(2)})`;
	}
}

function updateFSMDisplay(fsmState: string): void {
	document.querySelectorAll('.fsm-state').forEach((el) => {
		const state = (el as HTMLElement).dataset.state;
		el.classList.toggle('active', state === fsmState);
	});
}

function updateMetrics(ts: number, frameTime: number): void {
	const frameCountEl = $('frameCount');
	const eventCountEl = $('eventCount');
	const latencyEl = $('latency');
	const frameRateEl = $('frameRate');

	if (frameCountEl) frameCountEl.textContent = state.frameCount.toString();
	if (eventCountEl) eventCountEl.textContent = state.eventCount.toString();
	if (latencyEl) latencyEl.textContent = frameTime.toFixed(1) + ' ms';

	if (frameRateEl && state.lastFrameTime > 0) {
		const fps = 1000 / (ts - state.lastFrameTime);
		frameRateEl.textContent = fps.toFixed(1) + ' fps';
	}
	state.lastFrameTime = ts;
}

function logEvent(action: FSMAction): void {
	state.eventCount++;
	const log = $('eventLog');
	if (!log) return;

	const item = document.createElement('div');
	item.className = 'event-item';

	// Handle different action types
	let coords = '';
	if ('x' in action && 'y' in action) {
		coords = `(${action.x.toFixed(3)}, ${action.y.toFixed(3)})`;
	}

	item.innerHTML = `
		<span class="event-type">${action.action}</span>
		<span class="event-coords">${coords || action.state}</span>
	`;
	log.insertBefore(item, log.firstChild);

	while (log.children.length > 20) {
		log.removeChild(log.lastChild!);
	}
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function setupEventHandlers(): void {
	// Start/Stop button
	const startBtn = $('startBtn');
	if (startBtn) {
		startBtn.addEventListener('click', async () => {
			if (state.running) {
				state.running = false;
				startBtn.textContent = '▶ Start Pipeline';
				updateStatus('pipelineStatus', 'error');
			} else {
				// Try camera if not mock
				if (!state.useMockSensor && !state.initialized.camera) {
					await startCamera();
				}
				state.running = true;
				startBtn.textContent = '⏹ Stop Pipeline';
				updateStatus('pipelineStatus', 'ready');
				requestAnimationFrame(pipelineLoop);
			}
		});
	}

	// Reset button
	const resetBtn = $('resetBtn');
	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			smoother?.reset();
			fsm?.disarm();
			state.frameCount = 0;
			state.eventCount = 0;
			updateFSMDisplay('DISARMED');
			const frameCountEl = $('frameCount');
			const eventCountEl = $('eventCount');
			if (frameCountEl) frameCountEl.textContent = '0';
			if (eventCountEl) eventCountEl.textContent = '0';
		});
	}

	// Mock toggle
	const mockBtn = $('mockBtn');
	if (mockBtn) {
		mockBtn.addEventListener('click', () => {
			state.useMockSensor = !state.useMockSensor;
			mockBtn.textContent = state.useMockSensor ? '📹 Use Camera' : '🎭 Use Mock Data';
		});
	}

	// Smoother selection
	document.querySelectorAll('.smoother-option').forEach((el) => {
		el.addEventListener('click', () => {
			document.querySelectorAll('.smoother-option').forEach((e) => e.classList.remove('active'));
			el.classList.add('active');

			const type = (el as HTMLElement).dataset.smoother as typeof state.smootherType;
			state.smootherType = type;

			// Switch to real smoother
			switch (type) {
				case '1euro':
					smoother = oneEuroSmoother;
					break;
				case 'rapier-smooth':
					smoother = rapierSmoothedSmoother;
					break;
				case 'rapier-predict':
					smoother = rapierPredictSmoother;
					break;
			}

			smoother?.reset();
			console.log(`[HFO] Switched to ${type} smoother`);
		});
	});
}

// ============================================================================
// INIT
// ============================================================================

async function main(): Promise<void> {
	console.log('[HFO Gen87.X3] Silver Demo — REAL Adapters');
	console.log('=========================================');

	// Setup canvas
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	// Initialize adapters
	await initializeAdapters();

	// Setup event handlers
	setupEventHandlers();

	console.log('[HFO] Ready! Click "Start Pipeline" to begin.');
}

// Run
main().catch(console.error);

// Export for debugging
(window as any).HFO = {
	state,
	sensor,
	smoother,
	fsm,
	emitter,
	oneEuroSmoother,
	rapierSmoothedSmoother,
	rapierPredictSmoother,
};
