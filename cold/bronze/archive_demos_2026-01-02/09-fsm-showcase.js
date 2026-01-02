/**
 * FSM Showcase - Real MediaPipe Integration
 *
 * Gen87.X3 | VALIDATE Phase
 *
 * Connects MediaPipe hands → Palm Cone Gate → XState FSM → UI
 *
 * ⚠️ USES REAL TESTED MODULES from demos/lib/hfo.js
 * ⚠️ NO INLINE COPIES - prevents theater code drift
 */

import {
	DEFAULT_GESTURE_TRANSITION_CONFIG,
	DEFAULT_PALM_CONE_CONFIG,
	// Top Level Await - must be awaited before using exports
	__tla,
	// Palm Cone Gate (tested module)
	calculatePalmAngle,
	createGestureTransitionState,
	createPalmConeGateState,
	// Gesture Transition Predictor (tested module)
	updateGestureTransitionPredictor,
	updatePalmConeGate,
} from './lib/hfo.js';

// Wait for async module initialization
await __tla;

// Log that we're using real modules
console.log('[FSM Showcase] ✅ Using REAL tested modules from hfo.js');
console.log('[FSM Showcase] Palm Cone Config:', DEFAULT_PALM_CONE_CONFIG);
console.log('[FSM Showcase] Gesture Config:', DEFAULT_GESTURE_TRANSITION_CONFIG);

// ============================================================================
// STATE INITIALIZATION (using real module factories)
// ============================================================================

let palmGateState = createPalmConeGateState();
let gestureState = createGestureTransitionState();

// ============================================================================
// FSM (Simplified XState-like) - keeping inline for demo simplicity
// ============================================================================

const FSM_CONFIG = {
	armStableMs: 200,
	cmdWindowMs: 500,
	minConfidence: 0.7,
};

const fsmState = {
	current: 'DISARMED',
	baselineStableAt: null,
	armedFromBaseline: false,
	lastPosition: null,
};

function processFSM(frame) {
	const prevState = fsmState.current;
	let action = { action: 'none', state: fsmState.current };

	const { label, confidence, palmFacing, trackingOk, position, ts } = frame;

	if (position) {
		fsmState.lastPosition = position;
	}

	const pos = fsmState.lastPosition || { x: 0.5, y: 0.5 };

	switch (fsmState.current) {
		case 'DISARMED':
			if (
				trackingOk &&
				palmFacing &&
				label === 'Open_Palm' &&
				confidence >= FSM_CONFIG.minConfidence
			) {
				fsmState.current = 'ARMING';
				fsmState.baselineStableAt = ts;
				action = { action: 'none', state: 'ARMING' };
			}
			break;

		case 'ARMING':
			if (
				!trackingOk ||
				!palmFacing ||
				label !== 'Open_Palm' ||
				confidence < FSM_CONFIG.minConfidence
			) {
				fsmState.current = 'DISARMED';
				fsmState.baselineStableAt = null;
				action = { action: 'none', state: 'DISARMED' };
			} else if (ts - fsmState.baselineStableAt >= FSM_CONFIG.armStableMs) {
				fsmState.current = 'ARMED';
				fsmState.armedFromBaseline = true;
				action = { action: 'move', state: 'ARMED', x: pos.x, y: pos.y };
			}
			break;

		case 'ARMED':
			if (!trackingOk || !palmFacing) {
				fsmState.current = 'DISARMED';
				fsmState.baselineStableAt = null;
				fsmState.armedFromBaseline = false;
				action = { action: 'none', state: 'DISARMED' };
			} else if (label === 'Pointing_Up' && confidence >= FSM_CONFIG.minConfidence) {
				fsmState.current = 'DOWN_COMMIT';
				action = { action: 'down', state: 'DOWN_COMMIT', x: pos.x, y: pos.y, button: 0 };
			} else if (label === 'Victory' && confidence >= FSM_CONFIG.minConfidence) {
				fsmState.current = 'DOWN_NAV';
				action = { action: 'down', state: 'DOWN_NAV', x: pos.x, y: pos.y, button: 1 };
			} else if (
				(label === 'Thumb_Up' || label === 'Thumb_Down') &&
				confidence >= FSM_CONFIG.minConfidence
			) {
				fsmState.current = 'ZOOM';
				const deltaY = label === 'Thumb_Up' ? -100 : 100;
				action = { action: 'wheel', state: 'ZOOM', deltaY, ctrl: true };
			} else {
				action = { action: 'move', state: 'ARMED', x: pos.x, y: pos.y };
			}
			break;

		case 'DOWN_COMMIT':
			if (!trackingOk) {
				fsmState.current = 'DISARMED';
				action = { action: 'cancel', state: 'DISARMED' };
			} else if (label === 'Open_Palm' && palmFacing) {
				fsmState.current = 'ARMED';
				fsmState.armedFromBaseline = false;
				fsmState.baselineStableAt = ts;
				action = { action: 'up', state: 'ARMED', x: pos.x, y: pos.y, button: 0 };
			} else {
				action = { action: 'move', state: 'DOWN_COMMIT', x: pos.x, y: pos.y };
			}
			break;

		case 'DOWN_NAV':
			if (!trackingOk) {
				fsmState.current = 'DISARMED';
				action = { action: 'cancel', state: 'DISARMED' };
			} else if (label === 'Open_Palm' && palmFacing) {
				fsmState.current = 'ARMED';
				fsmState.armedFromBaseline = false;
				fsmState.baselineStableAt = ts;
				action = { action: 'up', state: 'ARMED', x: pos.x, y: pos.y, button: 1 };
			} else {
				action = { action: 'move', state: 'DOWN_NAV', x: pos.x, y: pos.y };
			}
			break;

		case 'ZOOM':
			if (!trackingOk) {
				fsmState.current = 'DISARMED';
				action = { action: 'none', state: 'DISARMED' };
			} else if (label === 'Open_Palm' && palmFacing) {
				fsmState.current = 'ARMED';
				fsmState.armedFromBaseline = false;
				fsmState.baselineStableAt = ts;
				action = { action: 'move', state: 'ARMED', x: pos.x, y: pos.y };
			} else if (label === 'Thumb_Up' || label === 'Thumb_Down') {
				const deltaY = label === 'Thumb_Up' ? -100 : 100;
				action = { action: 'wheel', state: 'ZOOM', deltaY, ctrl: true };
			}
			break;
	}

	return { prevState, action, newState: fsmState.current };
}

// ============================================================================
// UI UPDATES
// ============================================================================

const eventLog = document.getElementById('eventLog');
let logCount = 0;
const MAX_LOG = 50;

function log(type, msg) {
	const now = new Date();
	const ts = now.toTimeString().split(' ')[0];

	const entry = document.createElement('div');
	entry.className = `log-entry ${type}`;
	entry.innerHTML = `<span class="log-ts">${ts}</span><span class="log-msg">${msg}</span>`;

	eventLog.insertBefore(entry, eventLog.firstChild);
	logCount++;

	while (eventLog.children.length > MAX_LOG) {
		eventLog.removeChild(eventLog.lastChild);
	}
}

function updateStateUI(state) {
	document.querySelectorAll('.state-node').forEach((n) => n.classList.remove('active'));

	const stateEl = document.getElementById(`state-${state}`);
	if (stateEl) stateEl.classList.add('active');

	document.getElementById('ctxState').textContent = state;
	document.getElementById('ctxBaseline').textContent = fsmState.baselineStableAt
		? `${fsmState.baselineStableAt.toFixed(0)}ms`
		: 'null';
	document.getElementById('ctxArmedFrom').textContent = String(fsmState.armedFromBaseline);
	document.getElementById('ctxPosition').textContent = fsmState.lastPosition
		? `${fsmState.lastPosition.x.toFixed(2)}, ${fsmState.lastPosition.y.toFixed(2)}`
		: 'null';
}

function updateGestureUI(gesture, confidence, palmAngle, palmFacing) {
	document.getElementById('gestureLabel').textContent = gesture;
	document.getElementById('confidence').textContent = `${(confidence * 100).toFixed(0)}%`;
	document.getElementById('palmAngle').textContent = `${palmAngle.toFixed(1)}°`;
	document.getElementById('palmFacing').textContent = palmFacing ? '✅ Yes' : '❌ No';

	document.getElementById('ctxPalmAngle').textContent = `${palmAngle.toFixed(1)}°`;
	document.getElementById('ctxPalmFacing').textContent = String(palmFacing);

	const pct = Math.min(100, (palmAngle / 180) * 100);
	document.getElementById('angleMarker').style.left = `${pct}%`;
}

function updateActionUI(action) {
	document.getElementById('actionType').textContent = action.action;
	document.getElementById('actionPos').textContent =
		action.x !== undefined ? `${action.x.toFixed(2)}, ${action.y.toFixed(2)}` : '--';
	document.getElementById('actionButton').textContent =
		action.button !== undefined ? String(action.button) : '--';
}

function updateNoneUI(prediction) {
	const pct = Math.min(
		100,
		(prediction.msInNone / DEFAULT_GESTURE_TRANSITION_CONFIG.longNoneMs) * 100,
	);
	document.getElementById('noneFill').style.width = `${pct}%`;
	document.getElementById('predictedGesture').textContent = prediction.likelyNext;
}

function flashTransition(from, to) {
	const transId = `t-${from.toLowerCase()}-${to.toLowerCase()}`;
	const trans = document.getElementById(transId);
	if (trans) {
		trans.classList.add('active');
		setTimeout(() => trans.classList.remove('active'), 500);
	}
}

// ============================================================================
// MEDIAPIPE INTEGRATION
// ============================================================================

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasOverlay');
const canvasCtx = canvasElement.getContext('2d');
const cameraStatus = document.getElementById('cameraStatus');

let hands = null;
let camera = null;
let isRunning = false;

async function initMediaPipe() {
	hands = new Hands({
		locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
	});

	hands.setOptions({
		maxNumHands: 1,
		modelComplexity: 1,
		minDetectionConfidence: 0.7,
		minTrackingConfidence: 0.5,
	});

	hands.onResults(onHandResults);

	log('', '✅ MediaPipe Hands initialized');
	log('', '🔧 Using REAL tested modules from hfo.js');
}

// Simple gesture classification from landmarks
function classifyGesture(landmarks) {
	if (!landmarks || landmarks.length < 21) return { label: 'None', confidence: 0 };

	const tips = [4, 8, 12, 16, 20];
	const pips = [3, 6, 10, 14, 18];

	const extended = tips.map((tip, i) => {
		if (i === 0) {
			return landmarks[tip].x < landmarks[pips[i]].x;
		}
		return landmarks[tip].y < landmarks[pips[i]].y;
	});

	const [thumb, index, middle, ring, pinky] = extended;

	if (thumb && index && middle && ring && pinky) {
		return { label: 'Open_Palm', confidence: 0.9 };
	}

	if (!thumb && index && !middle && !ring && !pinky) {
		return { label: 'Pointing_Up', confidence: 0.85 };
	}

	if (!thumb && index && middle && !ring && !pinky) {
		return { label: 'Victory', confidence: 0.85 };
	}

	if (thumb && !index && !middle && !ring && !pinky) {
		const thumbUp = landmarks[4].y < landmarks[0].y;
		return { label: thumbUp ? 'Thumb_Up' : 'Thumb_Down', confidence: 0.8 };
	}

	if (!thumb && !index && !middle && !ring && !pinky) {
		return { label: 'Closed_Fist', confidence: 0.8 };
	}

	return { label: 'None', confidence: 0.5 };
}

function onHandResults(results) {
	canvasCtx.save();
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

	const ts = performance.now();

	if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
		const landmarks = results.multiHandLandmarks[0];

		// Draw hand
		drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
		drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

		// === USE REAL TESTED MODULES ===

		// Calculate palm angle using REAL tested function
		const palmAngle = calculatePalmAngle(landmarks);

		// Update palm cone gate using REAL tested function
		const gateResult = updatePalmConeGate(palmAngle, ts, palmGateState, DEFAULT_PALM_CONE_CONFIG);
		palmGateState = gateResult.state;

		// Classify gesture
		const { label, confidence } = classifyGesture(landmarks);

		// Update gesture predictor using REAL tested function
		const prediction = updateGestureTransitionPredictor(
			label,
			ts,
			gestureState,
			DEFAULT_GESTURE_TRANSITION_CONFIG,
		);
		gestureState = prediction.state;

		// Get position
		const indexTip = landmarks[8];
		const position = { x: indexTip.x, y: indexTip.y };

		// Build frame for FSM
		const frame = {
			label: prediction.shouldDebounce ? 'None' : label,
			confidence,
			palmFacing: gateResult.isFacing,
			trackingOk: true,
			position,
			ts,
		};

		// Process FSM
		const { prevState, action, newState } = processFSM(frame);

		// UI updates
		updateGestureUI(label, confidence, palmAngle, gateResult.isFacing);
		updateStateUI(newState);
		updateActionUI(action);
		updateNoneUI(prediction);

		if (prevState !== newState) {
			log('transition', `${prevState} → ${newState}`);
			flashTransition(prevState, newState);
		}

		if (action.action !== 'none' && action.action !== 'move') {
			log(
				'action',
				`W3C: ${action.action}${action.button !== undefined ? `(btn=${action.button})` : ''}`,
			);
		}

		if (gateResult.changed) {
			log(
				'gate',
				`Palm gate: ${gateResult.isFacing ? 'ARMED' : 'DISARMED'} (${palmAngle.toFixed(0)}°)`,
			);
		}

		cameraStatus.className = 'camera-status active';
		cameraStatus.textContent = `🖐️ ${label} (${(confidence * 100).toFixed(0)}%)`;
	} else {
		// No hand detected - use real modules
		const prediction = updateGestureTransitionPredictor(
			'None',
			ts,
			gestureState,
			DEFAULT_GESTURE_TRANSITION_CONFIG,
		);
		gestureState = prediction.state;

		const frame = {
			label: 'None',
			confidence: 0,
			palmFacing: false,
			trackingOk: false,
			position: null,
			ts,
		};

		const { prevState, action, newState } = processFSM(frame);

		updateGestureUI('None', 0, 180, false);
		updateStateUI(newState);
		updateActionUI(action);
		updateNoneUI(prediction);

		if (prevState !== newState) {
			log('transition', `${prevState} → ${newState} (hand lost)`);
			flashTransition(prevState, newState);
		}

		cameraStatus.className = 'camera-status inactive';
		cameraStatus.textContent = '👋 No hand detected';
	}

	canvasCtx.restore();
}

async function startCamera() {
	if (isRunning) return;

	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { width: 640, height: 480, facingMode: 'user' },
		});

		videoElement.srcObject = stream;
		await videoElement.play();

		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;

		camera = new Camera(videoElement, {
			onFrame: async () => {
				await hands.send({ image: videoElement });
			},
			width: 640,
			height: 480,
		});

		await camera.start();
		isRunning = true;

		document.getElementById('btnStart').disabled = true;
		document.getElementById('btnStop').disabled = false;

		log('', '🎥 Camera started');
		cameraStatus.className = 'camera-status active';
		cameraStatus.textContent = '🔍 Detecting...';
	} catch (err) {
		log('', `❌ Camera error: ${err.message}`);
		cameraStatus.textContent = `❌ ${err.message}`;
	}
}

function stopCamera() {
	if (!isRunning) return;

	if (camera) {
		camera.stop();
		camera = null;
	}

	if (videoElement.srcObject) {
		videoElement.srcObject.getTracks().forEach((t) => t.stop());
		videoElement.srcObject = null;
	}

	isRunning = false;

	document.getElementById('btnStart').disabled = false;
	document.getElementById('btnStop').disabled = true;

	log('', '⏹️ Camera stopped');
	cameraStatus.className = 'camera-status inactive';
	cameraStatus.textContent = '⏹️ Stopped';
}

// ============================================================================
// INIT
// ============================================================================

document.getElementById('btnStart').addEventListener('click', startCamera);
document.getElementById('btnStop').addEventListener('click', stopCamera);

initMediaPipe().then(() => {
	log('', '🎯 FSM Showcase ready - click Start Camera');
});
