/**
 * Gen87.X3 - Puter.js Gesture Control Demo
 *
 * HIVE Phase: V (Validate) - Live Integration
 *
 * Pipeline: MediaPipe → 1€ Filter → FSM → PuterWindowAdapter → Window Targets
 *
 * This demo proves hexagonal polymorphism:
 * - Same gesture pipeline code works with Puter.js windows
 * - Windows receive pointer events via dispatchEvent()
 * - Multiple windows can be controlled
 */
// @ts-nocheck


// ═══════════════════════════════════════════════════════════════════════════
// MediaPipe Imports
// ═══════════════════════════════════════════════════════════════════════════
import {
	DrawingUtils,
	FilesetResolver,
	GestureRecognizer,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/+esm';

// ═══════════════════════════════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════════════════════════════
const video = document.getElementById('videoLayer');
const testVideo = document.getElementById('testVideo');
const landmarkCanvas = document.getElementById('landmarkLayer');
const cursorCanvas = document.getElementById('cursorLayer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingStatus = document.getElementById('loadingStatus');

// Controls
const startBtn = document.getElementById('startBtn');
const createWindowBtn = document.getElementById('createWindowBtn');
const tileWindowsBtn = document.getElementById('tileWindowsBtn');
const injectTestBtn = document.getElementById('injectTestBtn');
const fpsCounter = document.getElementById('fpsCounter');

// Status
const cameraStatus = document.getElementById('cameraStatus');
const mediapipeStatus = document.getElementById('mediapipeStatus');
const handStatus = document.getElementById('handStatus');
const windowCount = document.getElementById('windowCount');
const activeWindowEl = document.getElementById('activeWindow');
const cursorPos = document.getElementById('cursorPos');
const gestureIcon = document.getElementById('gestureIcon');
const gestureLabel = document.getElementById('gestureLabel');
const fsmState = document.getElementById('fsmState');

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════
let gestureRecognizer = null;
let isRunning = false;
const showLandmarks = true;

// Puter window management
const puterWindows = new Map(); // id -> { window, element, title }
let activeWindowId = null;
let windowCounter = 0;

// FPS tracking
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;

// ═══════════════════════════════════════════════════════════════════════════
// 1€ Filter (Smoother)
// ═══════════════════════════════════════════════════════════════════════════
const oneEuroFilter = {
	x: null,
	y: null,
	dx: 0,
	dy: 0,
	lastTime: null,
	mincutoff: 1.0,
	beta: 0.007,
	dcutoff: 1.0,

	reset() {
		this.x = null;
		this.y = null;
		this.dx = 0;
		this.dy = 0;
		this.lastTime = null;
	},

	filter(x, y, timestamp) {
		if (this.x === null || this.lastTime === null) {
			this.x = x;
			this.y = y;
			this.lastTime = timestamp;
			return { x, y, vx: 0, vy: 0 };
		}

		const dt = Math.max((timestamp - this.lastTime) / 1000, 0.001);
		this.lastTime = timestamp;

		// Velocity
		const alpha_d = this.smoothingFactor(dt, this.dcutoff);
		const dxRaw = (x - this.x) / dt;
		const dyRaw = (y - this.y) / dt;
		this.dx = alpha_d * dxRaw + (1 - alpha_d) * this.dx;
		this.dy = alpha_d * dyRaw + (1 - alpha_d) * this.dy;

		// Speed-adaptive cutoff
		const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
		const cutoff = this.mincutoff + this.beta * speed;

		// Position
		const alpha = this.smoothingFactor(dt, cutoff);
		this.x = alpha * x + (1 - alpha) * this.x;
		this.y = alpha * y + (1 - alpha) * this.y;

		return { x: this.x, y: this.y, vx: this.dx, vy: this.dy };
	},

	smoothingFactor(dt, cutoff) {
		const tau = 1.0 / (2 * Math.PI * cutoff);
		return 1.0 / (1.0 + tau / dt);
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// FSM (Finite State Machine)
// ═══════════════════════════════════════════════════════════════════════════
const FSM = {
	state: 'IDLE', // IDLE | TRACKING | ARMED | CLICKING
	lastGesture: null,
	armStartTime: null,
	ARM_DURATION: 500, // ms to hold pinch before click

	transition(gesture, hasHand) {
		const prevState = this.state;

		if (!hasHand) {
			this.state = 'IDLE';
			this.armStartTime = null;
		} else if (gesture === 'Closed_Fist' || gesture === 'Victory') {
			// Pinch/click gesture
			if (this.state === 'TRACKING') {
				this.state = 'ARMED';
				this.armStartTime = performance.now();
			} else if (this.state === 'ARMED') {
				const elapsed = performance.now() - this.armStartTime;
				if (elapsed >= this.ARM_DURATION) {
					this.state = 'CLICKING';
				}
			}
		} else if (gesture === 'Pointing_Up' || gesture === 'Open_Palm') {
			// Tracking gestures
			this.state = 'TRACKING';
			this.armStartTime = null;
		} else {
			// Unknown gesture - stay tracking if hand visible
			if (this.state === 'IDLE') {
				this.state = 'TRACKING';
			}
		}

		this.lastGesture = gesture;
		return { state: this.state, changed: prevState !== this.state };
	},

	getAction() {
		switch (this.state) {
			case 'IDLE':
				return { action: 'none' };
			case 'TRACKING':
				return { action: 'move' };
			case 'ARMED':
				return { action: 'move' }; // Still move while arming
			case 'CLICKING':
				this.state = 'TRACKING'; // Auto-reset after click
				return { action: 'click' };
			default:
				return { action: 'none' };
		}
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// Puter Window Adapter (Polymorphic - implements AdapterPort)
// ═══════════════════════════════════════════════════════════════════════════
const PuterWindowAdapter = {
	/**
	 * Create a Puter window with gesture target content
	 */
	async createWindow(title, x, y, width, height) {
		const id = `puter-win-${++windowCounter}`;

		// Create window with Puter.js
		const win = await puter.ui.createWindow({
			title: title,
			width: width,
			height: height,
			x: x,
			y: y,
			is_resizable: true,
			center: false,
			show_in_taskbar: true,
		});

		// Get content element for event injection
		const contentEl = win.getContentElement();
		if (contentEl) {
			// Create gesture target UI inside window
			contentEl.innerHTML = `
        <div class="window-target" id="target-${id}">
          <h2>🎯 ${title}</h2>
          <div class="coords" id="coords-${id}">x: --, y: --</div>
          <div class="events" id="events-${id}"></div>
        </div>
      `;

			// Apply styles
			const style = document.createElement('style');
			style.textContent = `
        .window-target {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
          font-family: system-ui, sans-serif;
          cursor: crosshair;
          user-select: none;
        }
        .window-target.active { box-shadow: inset 0 0 0 3px #4ade80; }
        .window-target.hover { background: linear-gradient(135deg, #2a2a4e 0%, #26315e 100%); }
        .window-target h2 { font-size: 1.5rem; margin-bottom: 10px; }
        .window-target .coords {
          font-family: monospace;
          font-size: 0.9rem;
          color: #4ade80;
          padding: 8px 16px;
          background: rgba(0,0,0,0.3);
          border-radius: 6px;
          margin-top: 10px;
        }
        .window-target .events {
          font-size: 0.75rem;
          color: #888;
          margin-top: 15px;
          max-height: 100px;
          overflow-y: auto;
          width: 90%;
          text-align: left;
        }
        .window-target .events .event {
          padding: 2px 6px;
          margin: 2px 0;
          background: rgba(0,0,0,0.2);
          border-radius: 3px;
        }
        .window-target .events .event.pointerdown { border-left: 3px solid #4ade80; }
        .window-target .events .event.pointerup { border-left: 3px solid #f87171; }
        .window-target .events .event.pointermove { border-left: 3px solid #60a5fa; }
      `;
			contentEl.appendChild(style);

			// Wire up event listeners
			const target = contentEl.querySelector(`#target-${id}`);
			const coordsEl = contentEl.querySelector(`#coords-${id}`);
			const eventsEl = contentEl.querySelector(`#events-${id}`);

			const addEvent = (type, e) => {
				const div = document.createElement('div');
				div.className = `event ${type}`;
				div.textContent = `${type} @ (${Math.round(e.clientX)}, ${Math.round(e.clientY)})`;
				eventsEl.insertBefore(div, eventsEl.firstChild);
				if (eventsEl.children.length > 20) {
					eventsEl.removeChild(eventsEl.lastChild);
				}
			};

			target.addEventListener('pointermove', (e) => {
				coordsEl.textContent = `x: ${Math.round(e.clientX)}, y: ${Math.round(e.clientY)}`;
				addEvent('pointermove', e);
			});

			target.addEventListener('pointerdown', (e) => {
				target.classList.add('active');
				addEvent('pointerdown', e);
			});

			target.addEventListener('pointerup', (e) => {
				target.classList.remove('active');
				addEvent('pointerup', e);
			});

			target.addEventListener('pointerenter', () => {
				target.classList.add('hover');
			});

			target.addEventListener('pointerleave', () => {
				target.classList.remove('hover');
			});
		}

		// Focus handler - set as active when focused
		win.on('focus', () => {
			activeWindowId = id;
			updateStatus();
		});

		// Store window reference
		puterWindows.set(id, { window: win, element: contentEl, title });

		// Set as active if first window
		if (puterWindows.size === 1) {
			activeWindowId = id;
		}

		updateStatus();
		return id;
	},

	/**
	 * Inject pointer event into active window (AdapterPort.inject)
	 */
	inject(event) {
		if (!activeWindowId) return false;

		const winData = puterWindows.get(activeWindowId);
		if (!winData || !winData.element) return false;

		const target = winData.element.querySelector('.window-target');
		if (!target) return false;

		// Create and dispatch DOM event
		const domEvent = new PointerEvent(event.type, {
			bubbles: true,
			cancelable: true,
			pointerId: event.pointerId || 1,
			clientX: event.clientX,
			clientY: event.clientY,
			pointerType: event.pointerType || 'touch',
			button: event.button || 0,
			buttons: event.buttons || 0,
			pressure: event.pressure || 0.5,
			isPrimary: true,
		});

		return target.dispatchEvent(domEvent);
	},

	/**
	 * Get bounds of active window
	 */
	getBounds() {
		if (!activeWindowId) {
			return { left: 0, top: 0, width: 0, height: 0 };
		}

		const winData = puterWindows.get(activeWindowId);
		if (!winData || !winData.element) {
			return { left: 0, top: 0, width: 0, height: 0 };
		}

		const rect = winData.element.getBoundingClientRect();
		return {
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
		};
	},

	/**
	 * Tile all windows
	 */
	tileWindows() {
		const count = puterWindows.size;
		if (count === 0) return;

		const cols = Math.ceil(Math.sqrt(count));
		const rows = Math.ceil(count / cols);
		const winWidth = Math.floor(window.innerWidth / cols) - 20;
		const winHeight = Math.floor((window.innerHeight - 60) / rows) - 20;

		let i = 0;
		for (const [id, data] of puterWindows) {
			const col = i % cols;
			const row = Math.floor(i / cols);
			const x = col * (winWidth + 20) + 10;
			const y = row * (winHeight + 20) + 60;

			data.window.setPosition(x, y);
			data.window.setSize(winWidth, winHeight);
			i++;
		}
	},
};

// ═══════════════════════════════════════════════════════════════════════════
// Cursor Rendering
// ═══════════════════════════════════════════════════════════════════════════
const cursorCtx = cursorCanvas.getContext('2d');

function renderCursor(x, y, state) {
	cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

	const screenX = x * cursorCanvas.width;
	const screenY = y * cursorCanvas.height;

	// Outer ring
	cursorCtx.beginPath();
	cursorCtx.arc(screenX, screenY, 25, 0, Math.PI * 2);
	cursorCtx.strokeStyle =
		state === 'CLICKING' ? '#4ade80' : state === 'ARMED' ? '#fbbf24' : 'rgba(255,255,255,0.5)';
	cursorCtx.lineWidth = 3;
	cursorCtx.stroke();

	// Inner dot
	cursorCtx.beginPath();
	cursorCtx.arc(screenX, screenY, 8, 0, Math.PI * 2);
	cursorCtx.fillStyle =
		state === 'CLICKING' ? '#4ade80' : state === 'ARMED' ? '#fbbf24' : '#e94560';
	cursorCtx.fill();

	// Armed progress ring
	if (state === 'ARMED' && FSM.armStartTime) {
		const progress = (performance.now() - FSM.armStartTime) / FSM.ARM_DURATION;
		cursorCtx.beginPath();
		cursorCtx.arc(screenX, screenY, 30, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
		cursorCtx.strokeStyle = '#4ade80';
		cursorCtx.lineWidth = 4;
		cursorCtx.stroke();
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Landmark Rendering
// ═══════════════════════════════════════════════════════════════════════════
const landmarkCtx = landmarkCanvas.getContext('2d');
let drawingUtils = null;

function renderLandmarks(landmarks) {
	landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);

	if (!landmarks || !showLandmarks) return;

	landmarkCtx.save();
	landmarkCtx.scale(-1, 1);
	landmarkCtx.translate(-landmarkCanvas.width, 0);

	if (drawingUtils) {
		drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
			color: 'rgba(74, 222, 128, 0.6)',
			lineWidth: 2,
		});
		drawingUtils.drawLandmarks(landmarks, {
			color: '#e94560',
			lineWidth: 1,
			radius: 4,
		});
	}

	landmarkCtx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Pipeline Loop
// ═══════════════════════════════════════════════════════════════════════════
let lastVideoTime = -1;

async function processFrame() {
	if (!isRunning || !gestureRecognizer) {
		requestAnimationFrame(processFrame);
		return;
	}

	const currentVideo = video.srcObject ? video : testVideo.src ? testVideo : video;

	if (currentVideo.currentTime !== lastVideoTime && currentVideo.readyState >= 2) {
		lastVideoTime = currentVideo.currentTime;

		try {
			const results = gestureRecognizer.recognizeForVideo(currentVideo, performance.now());

			// Update FPS
			frameCount++;
			const now = performance.now();
			if (now - lastFpsUpdate >= 1000) {
				currentFps = frameCount;
				frameCount = 0;
				lastFpsUpdate = now;
				fpsCounter.textContent = `${currentFps} FPS`;
			}

			const hasHand = results.landmarks && results.landmarks.length > 0;
			const gesture = results.gestures?.[0]?.[0]?.categoryName || null;

			// Update hand status
			handStatus.textContent = hasHand ? 'Yes ✓' : 'No';
			handStatus.className = `status-value ${hasHand ? 'active' : ''}`;

			// Update gesture display
			updateGestureDisplay(gesture, hasHand);

			if (hasHand) {
				const landmarks = results.landmarks[0];
				const indexTip = landmarks[8]; // Index finger tip

				// Apply 1€ filter (Smoother)
				const smoothed = oneEuroFilter.filter(indexTip.x, indexTip.y, performance.now());

				// Update cursor position display
				cursorPos.textContent = `(${(smoothed.x * 100).toFixed(1)}%, ${(smoothed.y * 100).toFixed(1)}%)`;

				// FSM transition
				const { state, changed } = FSM.transition(gesture, hasHand);
				fsmState.textContent = state;

				// Get action from FSM
				const action = FSM.getAction();

				// Render cursor
				renderCursor(smoothed.x, smoothed.y, state);

				// Render landmarks
				renderLandmarks(landmarks);

				// Map to screen coordinates
				const screenX = smoothed.x * window.innerWidth;
				const screenY = smoothed.y * window.innerHeight;

				// Inject pointer event into Puter window
				if (action.action === 'move') {
					PuterWindowAdapter.inject({
						type: 'pointermove',
						pointerId: 1,
						clientX: screenX,
						clientY: screenY,
						pointerType: 'touch',
						pressure: 0.5,
					});
				} else if (action.action === 'click') {
					PuterWindowAdapter.inject({
						type: 'pointerdown',
						pointerId: 1,
						clientX: screenX,
						clientY: screenY,
						pointerType: 'touch',
						button: 0,
						buttons: 1,
					});
					setTimeout(() => {
						PuterWindowAdapter.inject({
							type: 'pointerup',
							pointerId: 1,
							clientX: screenX,
							clientY: screenY,
							pointerType: 'touch',
							button: 0,
							buttons: 0,
						});
					}, 50);
				}
			} else {
				// No hand - clear cursor
				cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
				landmarkCtx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);
				cursorPos.textContent = '--';
				FSM.transition(null, false);
				fsmState.textContent = 'IDLE';
			}
		} catch (err) {
			console.error('Frame processing error:', err);
		}
	}

	requestAnimationFrame(processFrame);
}

// ═══════════════════════════════════════════════════════════════════════════
// Gesture Display
// ═══════════════════════════════════════════════════════════════════════════
const gestureIcons = {
	Pointing_Up: '☝️',
	Open_Palm: '🖐️',
	Closed_Fist: '✊',
	Victory: '✌️',
	Thumb_Up: '👍',
	Thumb_Down: '👎',
	ILoveYou: '🤟',
	None: '❓',
};

function updateGestureDisplay(gesture, hasHand) {
	if (!hasHand) {
		gestureIcon.textContent = '👋';
		gestureLabel.textContent = 'No hand detected';
		return;
	}

	gestureIcon.textContent = gestureIcons[gesture] || '❓';
	gestureLabel.textContent = gesture || 'Unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// Status Update
// ═══════════════════════════════════════════════════════════════════════════
function updateStatus() {
	windowCount.textContent = puterWindows.size.toString();

	if (activeWindowId) {
		const winData = puterWindows.get(activeWindowId);
		activeWindowEl.textContent = winData?.title || activeWindowId;
		activeWindowEl.className = 'status-value active';
	} else {
		activeWindowEl.textContent = 'None';
		activeWindowEl.className = 'status-value';
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// Canvas Resize
// ═══════════════════════════════════════════════════════════════════════════
function resizeCanvases() {
	landmarkCanvas.width = window.innerWidth;
	landmarkCanvas.height = window.innerHeight;
	cursorCanvas.width = window.innerWidth;
	cursorCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvases);

// ═══════════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════════
async function init() {
	loadingStatus.textContent = 'Initializing Puter.js...';

	// Wait for Puter SDK to be ready
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Resize canvases
	resizeCanvases();

	// Initialize MediaPipe
	loadingStatus.textContent = 'Loading MediaPipe...';
	try {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm',
		);

		gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath:
					'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
				delegate: 'GPU',
			},
			runningMode: 'VIDEO',
			numHands: 1,
		});

		mediapipeStatus.textContent = 'Ready ✓';
		mediapipeStatus.className = 'status-value active';

		// Initialize drawing utils
		drawingUtils = new DrawingUtils(landmarkCtx);
	} catch (err) {
		console.error('MediaPipe init failed:', err);
		mediapipeStatus.textContent = 'Failed ✗';
		mediapipeStatus.className = 'status-value error';
	}

	// Create initial windows
	loadingStatus.textContent = 'Creating Puter windows...';
	await PuterWindowAdapter.createWindow('Target 1', 100, 100, 400, 300);
	await PuterWindowAdapter.createWindow('Target 2', 550, 100, 400, 300);
	await PuterWindowAdapter.createWindow('Target 3', 100, 450, 400, 300);

	// Hide loading overlay
	loadingOverlay.style.display = 'none';

	// Start processing loop
	requestAnimationFrame(processFrame);
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Handlers
// ═══════════════════════════════════════════════════════════════════════════
startBtn.addEventListener('click', async () => {
	if (isRunning) {
		// Stop
		isRunning = false;
		if (video.srcObject) {
			video.srcObject.getTracks().forEach((track) => track.stop());
			video.srcObject = null;
		}
		startBtn.textContent = '▶ Start Camera';
		cameraStatus.textContent = 'Offline';
		cameraStatus.className = 'status-value';
		return;
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 1280, height: 720, facingMode: 'user' },
		});
		video.srcObject = stream;
		await video.play();

		isRunning = true;
		startBtn.textContent = '⏹ Stop Camera';
		cameraStatus.textContent = 'Active ✓';
		cameraStatus.className = 'status-value active';
		oneEuroFilter.reset();
	} catch (err) {
		console.error('Camera access failed:', err);
		cameraStatus.textContent = 'Error ✗';
		cameraStatus.className = 'status-value error';
	}
});

createWindowBtn.addEventListener('click', async () => {
	const count = puterWindows.size + 1;
	await PuterWindowAdapter.createWindow(
		`Target ${count}`,
		Math.random() * 400 + 100,
		Math.random() * 300 + 100,
		400,
		300,
	);
});

tileWindowsBtn.addEventListener('click', () => {
	PuterWindowAdapter.tileWindows();
});

// Test injection button - simulates hand movement using recorded data
injectTestBtn.addEventListener('click', async () => {
	// Simulate a gesture sequence for testing
	console.log('🧪 Starting test injection...');

	// Create synthetic pointer events to test adapter
	const testSequence = [
		{ x: 0.3, y: 0.3, type: 'pointermove' },
		{ x: 0.35, y: 0.35, type: 'pointermove' },
		{ x: 0.4, y: 0.4, type: 'pointermove' },
		{ x: 0.45, y: 0.45, type: 'pointermove' },
		{ x: 0.5, y: 0.5, type: 'pointermove' },
		{ x: 0.5, y: 0.5, type: 'pointerdown' },
		{ x: 0.5, y: 0.5, type: 'pointerup' },
		{ x: 0.55, y: 0.55, type: 'pointermove' },
		{ x: 0.6, y: 0.6, type: 'pointermove' },
		{ x: 0.7, y: 0.5, type: 'pointermove' },
	];

	for (const point of testSequence) {
		const screenX = point.x * window.innerWidth;
		const screenY = point.y * window.innerHeight;

		// Render test cursor
		renderCursor(point.x, point.y, point.type === 'pointerdown' ? 'CLICKING' : 'TRACKING');

		// Inject into adapter
		PuterWindowAdapter.inject({
			type: point.type,
			pointerId: 1,
			clientX: screenX,
			clientY: screenY,
			pointerType: 'touch',
			button: point.type === 'pointerdown' ? 0 : undefined,
			buttons: point.type === 'pointerdown' ? 1 : 0,
			pressure: 0.5,
		});

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	console.log('✅ Test injection complete');
});

// ═══════════════════════════════════════════════════════════════════════════
// Start
// ═══════════════════════════════════════════════════════════════════════════
init().catch(console.error);

// Expose for E2E testing
window.PuterWindowAdapter = PuterWindowAdapter;
window.puterWindows = puterWindows;
window.FSM = FSM;
