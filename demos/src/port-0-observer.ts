/**
 * Port 0 - Observer Demo (Lidless Legion)
 *
 * Gen87.X3 | SENSE | MediaPipe Landmark & Gesture Passthrough
 *
 * @port 0
 * @verb SENSE
 * @binary 000
 * @element Earth - Pure receptivity
 *
 * This demo shows:
 * 1. MediaPipe hand landmark detection (21 points)
 * 2. Gesture recognition passthrough
 * 3. Raw sensor data WITHOUT transformation
 *
 * CAN: read, tag
 * CANNOT: modify, transform, persist, decide, emit
 */

import { addJitter } from '../../hot/bronze/src/browser/index.js'; // IR-0009 FIX
import type { SensorFrame } from '../../hot/bronze/src/contracts/schemas.js';
import { GestureLabels, SensorFrameSchema } from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// DOM SETUP
// ============================================================================

interface DemoElements {
	video: HTMLVideoElement;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	gestureLabel: HTMLElement;
	confidenceBar: HTMLElement;
	landmarkTable: HTMLElement;
	fpsDisplay: HTMLElement;
	statusDisplay: HTMLElement;
}

function createDemoUI(): DemoElements {
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
        background: #ff6b6b; 
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
      .panel h2 { 
        font-size: 0.9rem; 
        color: #8b949e; 
        margin-bottom: 12px; 
        text-transform: uppercase; 
      }
      .video-container { position: relative; }
      video, canvas { 
        width: 100%; 
        border-radius: 4px; 
        background: #000; 
      }
      canvas { 
        position: absolute; 
        top: 0; 
        left: 0; 
      }
      .gesture-display { 
        font-size: 4rem; 
        text-align: center; 
        padding: 20px; 
        color: #ff6b6b; 
      }
      .gesture-name { 
        font-size: 1.2rem; 
        text-align: center; 
        margin-bottom: 12px; 
      }
      .confidence-bar { 
        height: 24px; 
        background: #21262d; 
        border-radius: 4px; 
        overflow: hidden; 
      }
      .confidence-fill { 
        height: 100%; 
        background: linear-gradient(90deg, #ff6b6b, #f0883e); 
        transition: width 0.1s; 
        width: 0%; 
      }
      .landmark-table { 
        font-family: monospace; 
        font-size: 0.75rem; 
        max-height: 300px; 
        overflow-y: auto; 
      }
      .landmark-row { 
        display: flex; 
        justify-content: space-between; 
        padding: 4px 0; 
        border-bottom: 1px solid #21262d; 
      }
      .stats { 
        display: flex; 
        gap: 20px; 
        margin-top: 12px; 
      }
      .stat { font-size: 0.85rem; }
      .stat-value { color: #58a6ff; font-weight: bold; }
      button { 
        padding: 10px 20px; 
        background: #238636; 
        color: #fff; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer; 
        font-size: 0.9rem; 
        margin-top: 12px;
      }
      button:hover { background: #2ea043; }
      button:disabled { background: #484f58; cursor: not-allowed; }
      .status { 
        display: inline-block; 
        padding: 2px 8px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
      }
      .status.ready { background: #238636; }
      .status.loading { background: #f0883e; }
      .status.error { background: #f85149; }
    </style>
    
    <div class="header">
      <h1>👁️ Port 0: Observer</h1>
      <span class="badge">SENSE</span>
      <span class="badge" style="background:#3a3a3a;color:#fff;">JADC2: ISR</span>
      <span id="status" class="status loading">Loading...</span>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h2>📹 Camera Input</h2>
        <div class="video-container">
          <video id="video" autoplay playsinline></video>
          <canvas id="canvas"></canvas>
        </div>
        <button id="startBtn">Start Camera</button>
        <div class="stats">
          <div class="stat">FPS: <span id="fps" class="stat-value">0</span></div>
          <div class="stat">Hand: <span id="handId" class="stat-value">none</span></div>
        </div>
      </div>
      
      <div class="panel">
        <h2>🤚 Gesture Recognition</h2>
        <div id="gestureIcon" class="gesture-display">✋</div>
        <div id="gestureName" class="gesture-name">None</div>
        <div class="confidence-bar">
          <div id="confidenceFill" class="confidence-fill"></div>
        </div>
      </div>
      
      <div class="panel" style="grid-column: span 2;">
        <h2>📍 21 Hand Landmarks (Raw Passthrough)</h2>
        <div id="landmarks" class="landmark-table"></div>
      </div>
    </div>
  `;

	const video = document.getElementById('video') as HTMLVideoElement;
	const canvas = document.getElementById('canvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d')!;

	return {
		video,
		canvas,
		ctx,
		gestureLabel: document.getElementById('gestureName')!,
		confidenceBar: document.getElementById('confidenceFill')!,
		landmarkTable: document.getElementById('landmarks')!,
		fpsDisplay: document.getElementById('fps')!,
		statusDisplay: document.getElementById('status')!,
	};
}

// ============================================================================
// LANDMARK NAMES (MediaPipe 21-point model)
// ============================================================================

const LANDMARK_NAMES = [
	'WRIST',
	'THUMB_CMC',
	'THUMB_MCP',
	'THUMB_IP',
	'THUMB_TIP',
	'INDEX_MCP',
	'INDEX_PIP',
	'INDEX_DIP',
	'INDEX_TIP',
	'MIDDLE_MCP',
	'MIDDLE_PIP',
	'MIDDLE_DIP',
	'MIDDLE_TIP',
	'RING_MCP',
	'RING_PIP',
	'RING_DIP',
	'RING_TIP',
	'PINKY_MCP',
	'PINKY_PIP',
	'PINKY_DIP',
	'PINKY_TIP',
];

const GESTURE_ICONS: Record<string, string> = {
	Open_Palm: '✋',
	Pointing_Up: '☝️',
	Victory: '✌️',
	Thumb_Up: '👍',
	Thumb_Down: '👎',
	Closed_Fist: '✊',
	ILoveYou: '🤟',
	None: '❓',
};

// ============================================================================
// SENSOR FRAME RENDERING (Pure observation - no modification)
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

		const x = lm.x * width;
		const y = lm.y * height;

		// Index tip highlighted
		const isIndexTip = i === 8;
		ctx.fillStyle = isIndexTip ? '#00ff88' : '#ff6b6b';
		ctx.beginPath();
		ctx.arc(x, y, isIndexTip ? 8 : 4, 0, Math.PI * 2);
		ctx.fill();

		// Label for key points
		if (i === 0 || i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
			ctx.fillStyle = '#fff';
			ctx.font = '10px sans-serif';
			ctx.fillText(LANDMARK_NAMES[i] ?? '', x + 8, y - 4);
		}
	}
}

function updateLandmarkTable(table: HTMLElement, frame: SensorFrame): void {
	if (!frame.landmarks) {
		table.innerHTML = '<div style="color:#8b949e;">No landmarks detected</div>';
		return;
	}

	table.innerHTML = frame.landmarks
		.map(
			(lm, i) => `
    <div class="landmark-row">
      <span>${i.toString().padStart(2, '0')} ${LANDMARK_NAMES[i]}</span>
      <span>x: ${lm.x.toFixed(4)} y: ${lm.y.toFixed(4)} z: ${lm.z.toFixed(4)}</span>
    </div>
  `,
		)
		.join('');
}

function updateGestureDisplay(elements: DemoElements, frame: SensorFrame): void {
	const icon = GESTURE_ICONS[frame.label] ?? '❓';
	(document.getElementById('gestureIcon') as HTMLElement).textContent = icon;
	elements.gestureLabel.textContent = frame.label;
	elements.confidenceBar.style.width = `${frame.confidence * 100}%`;

	const handIdEl = document.getElementById('handId');
	if (handIdEl) handIdEl.textContent = frame.handId;
}

// ============================================================================
// MOCK MEDIAPIPE (For demo without actual camera)
// Replace with real MediaPipeAdapter in production
// ============================================================================

function createMockSensorFrame(timestamp: number): SensorFrame {
	// Simulate hand moving in a circle
	const t = timestamp / 1000;
	const cx = 0.5 + Math.cos(t) * 0.2;
	const cy = 0.5 + Math.sin(t) * 0.2;

	// Generate 21 landmarks around the center
	const landmarks = LANDMARK_NAMES.map((_, i) => {
		const angle = (i / 21) * Math.PI * 2;
		const radius = 0.05 + (i % 4) * 0.02;
		return {
			x: Math.max(0, Math.min(1, cx + Math.cos(angle + t) * radius)),
			y: Math.max(0, Math.min(1, cy + Math.sin(angle + t) * radius)),
			z: addJitter(0, 0.05), // IR-0009 FIX: Deterministic jitter
			visibility: 0.95,
		};
	});

	// Cycle through gestures for demo
	const gestures = GestureLabels.filter((g) => g !== 'None');
	const gestureIndex = Math.floor(t / 2) % gestures.length;

	return SensorFrameSchema.parse({
		ts: timestamp,
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: gestures[gestureIndex],
		confidence: addJitter(0.9, 0.05), // IR-0009 FIX: Deterministic jitter
		indexTip: landmarks[8],
		landmarks,
	});
}

// ============================================================================
// MAIN DEMO LOOP
// ============================================================================

export async function startPort0Demo(): Promise<void> {
	const elements = createDemoUI();

	const lastTime = performance.now();
	let frameCount = 0;
	let fps = 0;

	// Update FPS every second
	setInterval(() => {
		fps = frameCount;
		frameCount = 0;
		elements.fpsDisplay.textContent = fps.toString();
	}, 1000);

	elements.statusDisplay.textContent = 'Ready';
	elements.statusDisplay.className = 'status ready';

	// Demo loop with mock data
	function loop(): void {
		const now = performance.now();
		frameCount++;

		// Create sensor frame (mock or real MediaPipe)
		const frame = createMockSensorFrame(now);

		// Resize canvas to match video
		if (elements.canvas.width !== elements.video.clientWidth) {
			elements.canvas.width = elements.video.clientWidth || 640;
			elements.canvas.height = elements.video.clientHeight || 480;
		}

		// Pure observation - render without modification
		renderLandmarks(elements.ctx, frame, elements.canvas.width, elements.canvas.height);
		updateLandmarkTable(elements.landmarkTable, frame);
		updateGestureDisplay(elements, frame);

		requestAnimationFrame(loop);
	}

	// Start button wires up real camera
	const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
	startBtn.addEventListener('click', async () => {
		try {
			startBtn.disabled = true;
			startBtn.textContent = 'Starting...';

			const stream = await navigator.mediaDevices.getUserMedia({
				video: { width: 640, height: 480, facingMode: 'user' },
			});

			elements.video.srcObject = stream;
			await elements.video.play();

			startBtn.textContent = 'Camera Active';
			elements.statusDisplay.textContent = 'Camera Active';
		} catch (err) {
			console.error('Camera error:', err);
			startBtn.disabled = false;
			startBtn.textContent = 'Retry Camera';
			elements.statusDisplay.textContent = 'Camera Error';
			elements.statusDisplay.className = 'status error';
		}
	});

	// Start demo loop immediately with mock data
	loop();
}

// Auto-start if loaded directly
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		// Create app container if not exists
		if (!document.getElementById('app')) {
			const app = document.createElement('div');
			app.id = 'app';
			document.body.appendChild(app);
		}
		startPort0Demo();
	});
}
