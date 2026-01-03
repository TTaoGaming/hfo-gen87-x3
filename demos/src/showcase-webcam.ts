/**
 * Webcam → W3C Pointer Level 3 Pipeline Demo
 *
 * Gen87.X3 | COMPLETE PIPELINE | Real MediaPipe Integration
 *
 * This demo shows the COMPLETE pipeline:
 * 1. Webcam → getUserMedia()
 * 2. MediaPipe → sense() → SensorFrame
 * 3. 1€ Filter → smooth() → SmoothedFrame
 * 4. FSM → process() → FSMAction
 * 5. Pointer → emit() → W3C PointerEvent Level 3
 * 6. DOM → inject() → Real DOM Events
 *
 * ARCHITECTURE ENFORCEMENT:
 * - Uses REAL MediaPipeAdapter (not mocks)
 * - Full pipeline from webcam to DOM injection
 * - W3C Pointer Events Level 3 compliance
 *
 * @port ALL (0→2→3→5 pipeline)
 * @verb SENSE→SHAPE→DELIVER→DEFEND
 */

import { MediaPipeAdapter } from '../../hot/bronze/src/adapters/mediapipe.adapter.js';
import { SimulatedSensorAdapter } from '../../hot/bronze/src/adapters/quarantine/mock-sensor.adapter.js';
import {
	DOMAdapter,
	OneEuroExemplarAdapter,
	PointerEventAdapter,
	XStateFSMAdapter,
} from '../../hot/bronze/src/browser/index.js';
import type {
	FSMAction,
	PointerEventOut,
	SensorFrame,
	SmoothedFrame,
} from '../../hot/bronze/src/contracts/schemas.js';

declare global {
	interface Window {
		injectTestLandmarks: (frames: SensorFrame[]) => void;
		playbackLandmarks: (frames: SensorFrame[]) => void;
	}
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
	/** Use real MediaPipe or mock sensor for testing */
	useMockSensor: false,
	/** Target FPS for frame processing */
	targetFps: 30,
	/** MediaPipe model path */
	modelPath:
		'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
	/** MediaPipe WASM path */
	wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
};

// ============================================================================
// TYPE EXTENSION FOR GLOBAL WINDOW (Test injection)
// ============================================================================

declare global {
	interface Window {
		/** IR-0013 FIX: Injection point for golden fixture playback */
		injectTestLandmarks?: (frames: SensorFrame[]) => void;
		/** IR-0013 FIX: Playback mode for landmark fixtures */
		playbackLandmarks?: (frames: SensorFrame[]) => void;
	}
}

// ============================================================================
// STATE
// ============================================================================

interface PipelineState {
	isRunning: boolean;
	isInitialized: boolean;
	lastFrame: SensorFrame | null;
	lastSmoothed: SmoothedFrame | null;
	lastAction: FSMAction | null;
	lastEvent: PointerEventOut | null;
	frameCount: number;
	fps: number;
	errors: string[];
	/** IR-0013 FIX: Injected test frames for golden fixture playback */
	testFrameQueue: SensorFrame[];
}

const state: PipelineState = {
	isRunning: false,
	isInitialized: false,
	lastFrame: null,
	lastSmoothed: null,
	lastAction: null,
	lastEvent: null,
	frameCount: 0,
	fps: 0,
	errors: [],
	testFrameQueue: [],
};

// ============================================================================
// ADAPTERS (Real pipeline instances)
// ============================================================================

// Port 0: SENSE - MediaPipe sensor
let sensor: MediaPipeAdapter | SimulatedSensorAdapter;

// Port 2: SHAPE - 1€ Filter smoother
const smoother = new OneEuroExemplarAdapter();

// Port 3: DELIVER - FSM state machine
const fsm = new XStateFSMAdapter();

// Port 5: DEFEND - Pointer event emitter
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// DOM injection adapter (set after UI init)
let domAdapter: DOMAdapter | null = null;

// Video element
let videoElement: HTMLVideoElement | null = null;

// ============================================================================
// IR-0013 FIX: TEST INJECTION POINTS FOR GOLDEN FIXTURE PLAYBACK
// ============================================================================

/**
 * Inject test landmark frames for golden fixture playback.
 * Used by E2E tests to verify pipeline WITHOUT real MediaPipe.
 *
 * @example
 * // In Playwright test:
 * await page.evaluate((frames) => {
 *   window.injectTestLandmarks(frames);
 * }, goldenFixtures);
 */
function injectTestLandmarks(frames: SensorFrame[]): void {
	state.testFrameQueue = [...frames];
	CONFIG.useMockSensor = true;

	if (sensor instanceof SimulatedSensorAdapter) {
		sensor.loadMockFrames(frames);
	}
}

/**
 * Playback landmark frames through the full pipeline.
 * Returns when all frames have been processed.
 */
function playbackLandmarks(frames: SensorFrame[]): void {
	injectTestLandmarks(frames);
	// Auto-start if not running
	if (!state.isRunning && state.isInitialized) {
		startPipeline();
	}
}

// Expose injection points globally for E2E tests (IR-0011 FIX)
if (typeof window !== 'undefined') {
	window.injectTestLandmarks = injectTestLandmarks;
	window.playbackLandmarks = playbackLandmarks;
}

// ============================================================================
// UI CREATION
// ============================================================================

function createUI(): void {
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
        padding: 4px 12px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
        font-weight: bold; 
      }
      .badge-sense { background: #ff6b6b; color: #000; }
      .badge-shape { background: #4dabf7; color: #000; }
      .badge-deliver { background: #69db7c; color: #000; }
      .badge-defend { background: #ffd43b; color: #000; }
      
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
      .panel h2 { 
        font-size: 0.9rem; 
        color: #8b949e; 
        margin-bottom: 12px; 
        text-transform: uppercase; 
      }
      
      .video-container { 
        position: relative;
        aspect-ratio: 4/3;
        background: #000;
        border-radius: 4px;
        overflow: hidden;
      }
      video { 
        width: 100%; 
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1); /* Mirror */
      }
      canvas { 
        position: absolute; 
        top: 0; 
        left: 0; 
        width: 100%;
        height: 100%;
        transform: scaleX(-1); /* Mirror */
      }
      
      .pointer-target {
        width: 100%;
        height: 300px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #30363d;
        border-radius: 8px;
        position: relative;
        cursor: none;
        overflow: hidden;
      }
      
      .cursor-dot {
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: radial-gradient(circle, #ff6b6b 0%, #f0883e 100%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
        transition: transform 0.05s ease-out;
      }
      .cursor-dot.pressed {
        transform: translate(-50%, -50%) scale(0.7);
        background: radial-gradient(circle, #69db7c 0%, #38d9a9 100%);
        box-shadow: 0 0 30px rgba(105, 219, 124, 0.7);
      }
      
      .event-log {
        font-family: monospace;
        font-size: 0.75rem;
        max-height: 200px;
        overflow-y: auto;
        background: #0d1117;
        padding: 8px;
        border-radius: 4px;
      }
      .event-log .event {
        padding: 4px 0;
        border-bottom: 1px solid #21262d;
      }
      .event-log .event-type { color: #58a6ff; }
      .event-log .event-coords { color: #8b949e; }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
        margin-top: 12px;
      }
      .stat {
        text-align: center;
        padding: 12px;
        background: #21262d;
        border-radius: 6px;
      }
      .stat-label { font-size: 0.7rem; color: #8b949e; }
      .stat-value { font-size: 1.2rem; color: #58a6ff; font-weight: bold; }
      
      .controls {
        display: flex;
        gap: 12px;
        margin-top: 16px;
      }
      button { 
        padding: 10px 20px; 
        background: #238636; 
        color: #fff; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer; 
        font-size: 0.9rem;
      }
      button:hover { background: #2ea043; }
      button:disabled { background: #484f58; cursor: not-allowed; }
      button.danger { background: #f85149; }
      button.danger:hover { background: #da3633; }
      
      .status { 
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px; 
        border-radius: 12px; 
        font-size: 0.75rem;
        margin-left: auto;
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .status.ready { background: #238636; }
      .status.ready .status-dot { background: #69db7c; }
      .status.loading { background: #f0883e; }
      .status.loading .status-dot { background: #ffd43b; }
      .status.error { background: #f85149; }
      .status.error .status-dot { background: #ff8787; }
      
      .pipeline-flow {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0;
        font-size: 0.8rem;
      }
      .pipeline-stage {
        padding: 6px 12px;
        border-radius: 4px;
        background: #21262d;
      }
      .pipeline-stage.active { background: #238636; }
      .pipeline-arrow { color: #8b949e; }
    </style>
    
    <div class="header">
      <h1>📹 Webcam → W3C Pointer Level 3</h1>
      <span class="badge badge-sense">Port 0: SENSE</span>
      <span class="badge badge-shape">Port 2: SHAPE</span>
      <span class="badge badge-deliver">Port 3: DELIVER</span>
      <span class="badge badge-defend">Port 5: DEFEND</span>
      <span id="status" class="status loading">
        <span class="status-dot"></span>
        Initializing...
      </span>
    </div>
    
    <div class="pipeline-flow">
      <span id="stage-sense" class="pipeline-stage">Webcam/MediaPipe</span>
      <span class="pipeline-arrow">→</span>
      <span id="stage-shape" class="pipeline-stage">1€ Filter</span>
      <span class="pipeline-arrow">→</span>
      <span id="stage-deliver" class="pipeline-stage">FSM</span>
      <span class="pipeline-arrow">→</span>
      <span id="stage-defend" class="pipeline-stage">W3C Pointer</span>
      <span class="pipeline-arrow">→</span>
      <span id="stage-dom" class="pipeline-stage">DOM</span>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h2>📹 Camera Input (Port 0: SENSE)</h2>
        <div class="video-container">
          <video id="video" autoplay playsinline muted></video>
          <canvas id="canvas"></canvas>
        </div>
        <div class="controls">
          <button id="startBtn">Start Pipeline</button>
          <button id="stopBtn" class="danger" disabled>Stop</button>
        </div>
      </div>
      
      <div class="panel">
        <h2>🎯 Pointer Target (Port 5: DEFEND)</h2>
        <div id="pointer-target" class="pointer-target">
          <div id="cursor" class="cursor-dot" style="left: 50%; top: 50%;"></div>
        </div>
      </div>
      
      <div class="panel">
        <h2>📊 Pipeline Stats</h2>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-label">FPS</div>
            <div id="fps" class="stat-value">0</div>
          </div>
          <div class="stat">
            <div class="stat-label">State</div>
            <div id="fsm-state" class="stat-value">-</div>
          </div>
          <div class="stat">
            <div class="stat-label">Gesture</div>
            <div id="gesture" class="stat-value">-</div>
          </div>
          <div class="stat">
            <div class="stat-label">Confidence</div>
            <div id="confidence" class="stat-value">0%</div>
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h2>📋 Event Log (W3C Level 3)</h2>
        <div id="event-log" class="event-log"></div>
      </div>
    </div>
  `;
}

// ============================================================================
// RENDERING
// ============================================================================

function renderLandmarks(
	ctx: CanvasRenderingContext2D,
	frame: SensorFrame,
	width: number,
	height: number,
): void {
	ctx.clearRect(0, 0, width, height);

	if (!frame.trackingOk || !frame.landmarks) return;

	// Draw connections
	ctx.strokeStyle = '#ff6b6b';
	ctx.lineWidth = 2;

	const connections = [
		[0, 1],
		[1, 2],
		[2, 3],
		[3, 4], // Thumb
		[0, 5],
		[5, 6],
		[6, 7],
		[7, 8], // Index
		[0, 9],
		[9, 10],
		[10, 11],
		[11, 12], // Middle
		[0, 13],
		[13, 14],
		[14, 15],
		[15, 16], // Ring
		[0, 17],
		[17, 18],
		[18, 19],
		[19, 20], // Pinky
		[5, 9],
		[9, 13],
		[13, 17], // Palm
	];

	for (const [from, to] of connections) {
		const p1 = frame.landmarks[from];
		const p2 = frame.landmarks[to];
		if (p1 && p2) {
			ctx.beginPath();
			ctx.moveTo(p1.x * width, p1.y * height);
			ctx.lineTo(p2.x * width, p2.y * height);
			ctx.stroke();
		}
	}

	// Draw landmarks
	for (let i = 0; i < frame.landmarks.length; i++) {
		const lm = frame.landmarks[i];
		if (!lm) continue;

		const isIndexTip = i === 8;
		ctx.fillStyle = isIndexTip ? '#00ff88' : '#ff6b6b';
		ctx.beginPath();
		ctx.arc(lm.x * width, lm.y * height, isIndexTip ? 8 : 4, 0, Math.PI * 2);
		ctx.fill();
	}
}

function updateCursor(target: HTMLElement, smoothed: SmoothedFrame): void {
	const cursor = document.getElementById('cursor');
	if (!cursor || !smoothed.position) return;

	const x = smoothed.position.x * 100;
	const y = smoothed.position.y * 100;
	cursor.style.left = `${x}%`;
	cursor.style.top = `${y}%`;
}

function updateEventLog(event: PointerEventOut): void {
	const log = document.getElementById('event-log');
	if (!log) return;

	const entry = document.createElement('div');
	entry.className = 'event';

	let coords = '';
	if ('clientX' in event && 'clientY' in event) {
		coords = `(${Math.round(event.clientX)}, ${Math.round(event.clientY)})`;
	}

	entry.innerHTML = `
		<span class="event-type">${event.type}</span>
		<span class="event-coords">${coords}</span>
	`;

	log.insertBefore(entry, log.firstChild);

	// Keep only last 20 events
	while (log.children.length > 20) {
		log.removeChild(log.lastChild!);
	}
}

function updateStats(): void {
	const fpsEl = document.getElementById('fps');
	const stateEl = document.getElementById('fsm-state');
	const gestureEl = document.getElementById('gesture');
	const confEl = document.getElementById('confidence');

	if (fpsEl) fpsEl.textContent = state.fps.toString();
	if (stateEl) stateEl.textContent = fsm.getState()?.value?.toString() ?? '-';
	if (gestureEl) gestureEl.textContent = state.lastFrame?.label ?? '-';
	if (confEl) confEl.textContent = `${Math.round((state.lastFrame?.confidence ?? 0) * 100)}%`;
}

function updatePipelineStages(activeStage: string): void {
	const stages = ['sense', 'shape', 'deliver', 'defend', 'dom'];
	for (const s of stages) {
		const el = document.getElementById(`stage-${s}`);
		if (el) {
			el.classList.toggle('active', s === activeStage);
		}
	}
}

// ============================================================================
// PIPELINE PROCESSING
// ============================================================================

let lastFrameTime = 0;

async function processFrame(): Promise<void> {
	if (!state.isRunning || !videoElement || !sensor.isReady) return;

	const now = performance.now();
	const elapsed = now - lastFrameTime;

	// Throttle to target FPS
	if (elapsed < 1000 / CONFIG.targetFps) {
		requestAnimationFrame(processFrame);
		return;
	}
	lastFrameTime = now;

	try {
		// Stage 1: SENSE - Get sensor frame from MediaPipe
		updatePipelineStages('sense');
		const sensorFrame = await sensor.sense(videoElement, now);
		state.lastFrame = sensorFrame;
		state.frameCount++;

		// Render landmarks on canvas
		const canvas = document.getElementById('canvas') as HTMLCanvasElement;
		const ctx = canvas.getContext('2d');
		if (ctx && canvas.width && canvas.height) {
			renderLandmarks(ctx, sensorFrame, canvas.width, canvas.height);
		}

		// Stage 2: SHAPE - Smooth with 1€ filter
		updatePipelineStages('shape');
		const smoothed = smoother.smooth(sensorFrame);
		state.lastSmoothed = smoothed;

		// Update cursor position
		const target = document.getElementById('pointer-target');
		if (target) {
			updateCursor(target, smoothed);
		}

		// Stage 3: DELIVER - FSM state machine
		updatePipelineStages('deliver');
		const action = fsm.process(smoothed);
		state.lastAction = action;

		// Stage 4: DEFEND - Emit W3C Pointer Event
		updatePipelineStages('defend');
		if (target && domAdapter) {
			const targetBounds = target.getBoundingClientRect();
			const pointerEvent = pointerEmitter.emit(action, {
				id: 'pointer-target',
				bounds: {
					left: targetBounds.left,
					top: targetBounds.top,
					width: targetBounds.width,
					height: targetBounds.height,
				},
			});

			if (pointerEvent) {
				state.lastEvent = pointerEvent;

				// Stage 5: DOM - Inject into DOM
				updatePipelineStages('dom');
				domAdapter.inject(pointerEvent);
				updateEventLog(pointerEvent);

				// Update cursor visual state
				const cursor = document.getElementById('cursor');
				if (cursor) {
					cursor.classList.toggle(
						'pressed',
						pointerEvent.type === 'pointerdown' ||
							(state.lastAction?.action === 'move' && fsm.getState()?.value === 'DOWN_COMMIT'),
					);
				}
			}
		}

		// Update stats
		updateStats();
	} catch (err) {
		console.error('Pipeline error:', err);
		state.errors.push(String(err));
	}

	requestAnimationFrame(processFrame);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializePipeline(): Promise<void> {
	const statusEl = document.getElementById('status');

	try {
		// Create sensor (real or mock)
		if (CONFIG.useMockSensor) {
			sensor = new SimulatedSensorAdapter();
			// Using SimulatedSensorAdapter for testing
		} else {
			sensor = new MediaPipeAdapter(CONFIG.modelPath, CONFIG.wasmPath);
			// Using real MediaPipeAdapter
		}

		// Initialize sensor (loads WASM model)
		if (statusEl) {
			statusEl.innerHTML = '<span class="status-dot"></span>Loading MediaPipe model...';
		}
		await sensor.initialize();

		// Setup video element
		videoElement = document.getElementById('video') as HTMLVideoElement;
		const canvas = document.getElementById('canvas') as HTMLCanvasElement;

		// Get webcam stream
		if (statusEl) {
			statusEl.innerHTML = '<span class="status-dot"></span>Requesting camera...';
		}
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 640, height: 480, facingMode: 'user' },
			audio: false,
		});

		videoElement.srcObject = stream;
		await videoElement.play();

		// Setup canvas size
		canvas.width = videoElement.videoWidth || 640;
		canvas.height = videoElement.videoHeight || 480;

		// Setup DOM adapter for pointer injection
		const target = document.getElementById('pointer-target');
		if (target) {
			domAdapter = new DOMAdapter(target);
		}

		state.isInitialized = true;

		if (statusEl) {
			statusEl.className = 'status ready';
			statusEl.innerHTML = '<span class="status-dot"></span>Ready';
		}
	} catch (err) {
		console.error('Initialization error:', err);
		state.errors.push(String(err));

		if (statusEl) {
			statusEl.className = 'status error';
			statusEl.innerHTML = `<span class="status-dot"></span>Error: ${err}`;
		}
	}
}

function startPipeline(): void {
	if (!state.isInitialized) {
		console.error('Pipeline not initialized');
		return;
	}

	state.isRunning = true;
	lastFrameTime = performance.now();

	// Update UI
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
	const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
	if (startBtn) startBtn.disabled = true;
	if (stopBtn) stopBtn.disabled = false;

	// Start FPS counter
	setInterval(() => {
		state.fps = state.frameCount;
		state.frameCount = 0;
	}, 1000);

	// Start processing
	requestAnimationFrame(processFrame);
}

function stopPipeline(): void {
	state.isRunning = false;

	// Update UI
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
	const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
	if (startBtn) startBtn.disabled = false;
	if (stopBtn) stopBtn.disabled = true;
}

// ============================================================================
// MAIN
// ============================================================================

export async function startWebcamDemo(): Promise<void> {
	createUI();

	// Wire up controls
	const startBtn = document.getElementById('startBtn');
	const stopBtn = document.getElementById('stopBtn');

	startBtn?.addEventListener('click', () => {
		if (!state.isInitialized) {
			initializePipeline().then(startPipeline);
		} else {
			startPipeline();
		}
	});

	stopBtn?.addEventListener('click', stopPipeline);

	// Setup pointer target event listeners for feedback
	const target = document.getElementById('pointer-target');
	if (target) {
		target.addEventListener('pointerdown', () => {
			const cursor = document.getElementById('cursor');
			if (cursor) cursor.classList.add('pressed');
		});
		target.addEventListener('pointerup', () => {
			const cursor = document.getElementById('cursor');
			if (cursor) cursor.classList.remove('pressed');
		});
	}
}

// Auto-start
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', startWebcamDemo);
}
