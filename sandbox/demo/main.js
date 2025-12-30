/**
 * Gen87.X3 - W3C Gesture Control Plane Demo
 * 
 * DOM Layers + MediaPipe Passthrough Visualization
 * 
 * Pipeline: SENSOR → SMOOTHER → FSM → EMITTER → TARGET
 */

// ═══════════════════════════════════════════════════════════════════════════
// MediaPipe Imports
// ═══════════════════════════════════════════════════════════════════════════
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/+esm';

// ═══════════════════════════════════════════════════════════════════════════
// DOM Elements
// ═══════════════════════════════════════════════════════════════════════════
const video = document.getElementById('videoLayer');
const landmarkCanvas = document.getElementById('landmarkLayer');
const cursorCanvas = document.getElementById('cursorLayer');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingStatus = document.getElementById('loadingStatus');

// Controls
const startBtn = document.getElementById('startBtn');
const toggleLandmarksBtn = document.getElementById('toggleLandmarks');
const toggleMirrorBtn = document.getElementById('toggleMirror');

// Status displays
const fpsCounter = document.getElementById('fpsCounter');
const cameraStatus = document.getElementById('cameraStatus');
const mediapipeStatus = document.getElementById('mediapipeStatus');
const handStatus = document.getElementById('handStatus');
const indexPosition = document.getElementById('indexPosition');
const smoothedPosition = document.getElementById('smoothedPosition');
const palmStatus = document.getElementById('palmStatus');

// Gesture displays
const gestureIcon = document.getElementById('gestureIcon');
const gestureLabel = document.getElementById('gestureLabel');
const gestureConfidence = document.getElementById('gestureConfidence');
const fsmState = document.getElementById('fsmState');

// Pipeline stages
const stages = {
  sensor: document.getElementById('stageSensor'),
  smoother: document.getElementById('stageSmoother'),
  fsm: document.getElementById('stageFSM'),
  emitter: document.getElementById('stageEmitter'),
  target: document.getElementById('stageTarget'),
};

// ═══════════════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════════════
let gestureRecognizer = null;
let isRunning = false;
let showLandmarks = true;
let isMirrored = true;

// FPS tracking
let frameCount = 0;
let lastFpsUpdate = performance.now();
let currentFps = 0;

// 1€ Filter state (simple implementation)
const oneEuroFilter = {
  x: null,
  y: null,
  dx: 0,
  dy: 0,
  lastTime: null,
  // Parameters
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
    
    // Compute velocity
    const vx = (x - this.x) / dt;
    const vy = (y - this.y) / dt;
    
    // Smooth velocity
    const alpha_d = this.smoothingFactor(dt, this.dcutoff);
    this.dx = alpha_d * vx + (1 - alpha_d) * this.dx;
    this.dy = alpha_d * vy + (1 - alpha_d) * this.dy;
    
    // Adaptive cutoff
    const speed = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    const cutoff = this.mincutoff + this.beta * speed;
    
    // Smooth position
    const alpha = this.smoothingFactor(dt, cutoff);
    this.x = alpha * x + (1 - alpha) * this.x;
    this.y = alpha * y + (1 - alpha) * this.y;
    
    return { x: this.x, y: this.y, vx: this.dx, vy: this.dy };
  },
  
  smoothingFactor(dt, cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Gesture Icons Map
// ═══════════════════════════════════════════════════════════════════════════
const gestureIcons = {
  'None': '❓',
  'Closed_Fist': '✊',
  'Open_Palm': '✋',
  'Pointing_Up': '☝️',
  'Thumb_Down': '👎',
  'Thumb_Up': '👍',
  'Victory': '✌️',
  'ILoveYou': '🤟',
};

// ═══════════════════════════════════════════════════════════════════════════
// Initialize MediaPipe
// ═══════════════════════════════════════════════════════════════════════════
async function initMediaPipe() {
  loadingStatus.textContent = 'Loading MediaPipe Vision Tasks...';
  
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
  );
  
  loadingStatus.textContent = 'Loading Gesture Recognition Model...';
  
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 1
  });
  
  mediapipeStatus.textContent = 'READY';
  mediapipeStatus.className = 'status-value';
  loadingStatus.textContent = 'MediaPipe Ready!';
  
  // Hide loading after short delay
  setTimeout(() => {
    loadingOverlay.classList.add('hidden');
  }, 500);
}

// ═══════════════════════════════════════════════════════════════════════════
// Camera Setup
// ═══════════════════════════════════════════════════════════════════════════
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      }
    });
    
    video.srcObject = stream;
    await video.play();
    
    // Set canvas sizes to match video
    landmarkCanvas.width = video.videoWidth;
    landmarkCanvas.height = video.videoHeight;
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
    
    cameraStatus.textContent = 'ON';
    cameraStatus.className = 'status-value';
    startBtn.textContent = '⏹ Stop Camera';
    
    isRunning = true;
    requestAnimationFrame(processFrame);
    
  } catch (err) {
    console.error('Camera error:', err);
    cameraStatus.textContent = 'ERROR';
    cameraStatus.className = 'status-value error';
  }
}

function stopCamera() {
  isRunning = false;
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
  cameraStatus.textContent = 'OFF';
  cameraStatus.className = 'status-value off';
  startBtn.textContent = '▶ Start Camera';
  oneEuroFilter.reset();
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Processing Loop
// ═══════════════════════════════════════════════════════════════════════════
function processFrame(timestamp) {
  if (!isRunning) return;
  
  // FPS calculation
  frameCount++;
  if (timestamp - lastFpsUpdate >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    lastFpsUpdate = timestamp;
    fpsCounter.textContent = `${currentFps} fps`;
  }
  
  // Activate sensor stage
  activateStage('sensor');
  
  // Process with MediaPipe
  if (gestureRecognizer && video.readyState >= 2) {
    const result = gestureRecognizer.recognizeForVideo(video, timestamp);
    
    // Draw landmarks on overlay
    drawLandmarks(result);
    
    // Process result through pipeline
    processPipelineResult(result, timestamp);
  }
  
  requestAnimationFrame(processFrame);
}

// ═══════════════════════════════════════════════════════════════════════════
// Draw MediaPipe Landmarks (Layer 1)
// ═══════════════════════════════════════════════════════════════════════════
function drawLandmarks(result) {
  const ctx = landmarkCanvas.getContext('2d');
  ctx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);
  
  if (!showLandmarks || !result.landmarks || result.landmarks.length === 0) return;
  
  // Mirror the canvas if needed
  ctx.save();
  if (isMirrored) {
    ctx.translate(landmarkCanvas.width, 0);
    ctx.scale(-1, 1);
  }
  
  const drawingUtils = new DrawingUtils(ctx);
  
  for (const landmarks of result.landmarks) {
    // Draw connectors (bones)
    drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
      color: 'rgba(233, 69, 96, 0.6)',
      lineWidth: 3
    });
    
    // Draw landmarks (joints)
    drawingUtils.drawLandmarks(landmarks, {
      color: 'rgba(74, 222, 128, 0.8)',
      lineWidth: 1,
      radius: 4
    });
    
    // Highlight index fingertip (landmark 8)
    if (landmarks[8]) {
      const tip = landmarks[8];
      ctx.beginPath();
      ctx.arc(tip.x * landmarkCanvas.width, tip.y * landmarkCanvas.height, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════
// Process Pipeline Result
// ═══════════════════════════════════════════════════════════════════════════
function processPipelineResult(result, timestamp) {
  // No hand detected
  if (!result.landmarks || result.landmarks.length === 0) {
    handStatus.textContent = 'NO';
    handStatus.className = 'status-value warning';
    indexPosition.textContent = '--, --';
    indexPosition.className = 'status-value off';
    smoothedPosition.textContent = '--, --';
    smoothedPosition.className = 'status-value off';
    palmStatus.textContent = '--';
    palmStatus.className = 'status-value off';
    gestureIcon.textContent = '❓';
    gestureLabel.textContent = 'None';
    gestureConfidence.textContent = '0%';
    oneEuroFilter.reset();
    clearCursor();
    deactivateAllStages();
    return;
  }
  
  // Hand detected
  handStatus.textContent = 'YES';
  handStatus.className = 'status-value';
  
  const landmarks = result.landmarks[0];
  const gesture = result.gestures?.[0]?.[0];
  
  // Get index fingertip (landmark 8)
  const indexTip = landmarks[8];
  let rawX = indexTip.x;
  let rawY = indexTip.y;
  
  // Mirror x if needed
  if (isMirrored) {
    rawX = 1 - rawX;
  }
  
  indexPosition.textContent = `${rawX.toFixed(3)}, ${rawY.toFixed(3)}`;
  indexPosition.className = 'status-value';
  
  // Palm facing detection
  const palmFacing = isPalmFacing(landmarks);
  palmStatus.textContent = palmFacing ? 'YES' : 'NO';
  palmStatus.className = palmFacing ? 'status-value' : 'status-value warning';
  
  // SMOOTHER STAGE (1€ Filter)
  activateStage('smoother');
  const smoothed = oneEuroFilter.filter(rawX, rawY, timestamp);
  smoothedPosition.textContent = `${smoothed.x.toFixed(3)}, ${smoothed.y.toFixed(3)}`;
  smoothedPosition.className = 'status-value';
  
  // Update gesture display
  const gestureName = gesture?.categoryName || 'None';
  const confidence = gesture?.score || 0;
  gestureIcon.textContent = gestureIcons[gestureName] || '❓';
  gestureLabel.textContent = gestureName.replace('_', ' ');
  gestureConfidence.textContent = `${(confidence * 100).toFixed(0)}%`;
  
  // FSM STAGE (simplified for demo)
  activateStage('fsm');
  updateFSMState(gestureName, palmFacing);
  
  // EMITTER STAGE
  activateStage('emitter');
  
  // TARGET STAGE - Draw cursor
  activateStage('target');
  drawCursor(rawX, rawY, smoothed.x, smoothed.y);
}

// ═══════════════════════════════════════════════════════════════════════════
// Palm Facing Detection
// ═══════════════════════════════════════════════════════════════════════════
function isPalmFacing(landmarks) {
  if (landmarks.length < 21) return false;
  
  const wrist = landmarks[0];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  
  // Cross product for palm normal
  const v1 = { x: indexMcp.x - wrist.x, y: indexMcp.y - wrist.y, z: indexMcp.z - wrist.z };
  const v2 = { x: middleMcp.x - wrist.x, y: middleMcp.y - wrist.y, z: middleMcp.z - wrist.z };
  
  const normalZ = v1.x * v2.y - v1.y * v2.x;
  return normalZ < 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// Simplified FSM State
// ═══════════════════════════════════════════════════════════════════════════
let currentState = 'OFFLINE';
let armingStart = null;

function updateFSMState(gesture, palmFacing) {
  const prevState = currentState;
  
  switch (currentState) {
    case 'OFFLINE':
    case 'DISARMED':
      if (gesture === 'Open_Palm' && palmFacing) {
        currentState = 'ARMING';
        armingStart = performance.now();
      }
      break;
      
    case 'ARMING':
      if (gesture !== 'Open_Palm' || !palmFacing) {
        currentState = 'DISARMED';
        armingStart = null;
      } else if (performance.now() - armingStart > 500) {
        currentState = 'ARMED';
      }
      break;
      
    case 'ARMED':
      if (gesture === 'Pointing_Up') {
        currentState = 'DOWN_DRAW';
      } else if (gesture === 'Victory') {
        currentState = 'DOWN_PAN';
      } else if (gesture === 'Thumb_Up' || gesture === 'Thumb_Down') {
        currentState = 'DOWN_ZOOM';
      } else if (gesture !== 'Open_Palm') {
        currentState = 'DISARMED';
      }
      break;
      
    case 'DOWN_DRAW':
    case 'DOWN_PAN':
    case 'DOWN_ZOOM':
      if (gesture === 'Open_Palm') {
        currentState = 'ARMED';
      } else if (gesture === 'None' || gesture === 'Closed_Fist') {
        currentState = 'DISARMED';
      }
      break;
  }
  
  // Update display
  fsmState.textContent = currentState;
  fsmState.className = `fsm-state ${currentState}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Draw Triple Cursor (Layer 3)
// ═══════════════════════════════════════════════════════════════════════════
function drawCursor(rawX, rawY, smoothX, smoothY) {
  const ctx = cursorCanvas.getContext('2d');
  ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  
  const screenX = smoothX * cursorCanvas.width;
  const screenY = smoothY * cursorCanvas.height;
  const rawScreenX = rawX * cursorCanvas.width;
  const rawScreenY = rawY * cursorCanvas.height;
  
  // Draw raw position (red, small)
  ctx.beginPath();
  ctx.arc(rawScreenX, rawScreenY, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 68, 68, 0.6)';
  ctx.fill();
  
  // Draw smoothed position (green, larger)
  ctx.beginPath();
  ctx.arc(screenX, screenY, 12, 0, Math.PI * 2);
  ctx.fillStyle = currentState.startsWith('DOWN_') ? 'rgba(248, 113, 113, 0.8)' : 'rgba(74, 222, 128, 0.8)';
  ctx.fill();
  ctx.strokeStyle = currentState.startsWith('DOWN_') ? '#f87171' : '#4ade80';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw crosshair for smoothed
  ctx.beginPath();
  ctx.moveTo(screenX - 20, screenY);
  ctx.lineTo(screenX + 20, screenY);
  ctx.moveTo(screenX, screenY - 20);
  ctx.lineTo(screenX, screenY + 20);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw line from raw to smoothed
  ctx.beginPath();
  ctx.moveTo(rawScreenX, rawScreenY);
  ctx.lineTo(screenX, screenY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function clearCursor() {
  const ctx = cursorCanvas.getContext('2d');
  ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Stage Visualization
// ═══════════════════════════════════════════════════════════════════════════
function activateStage(stage) {
  Object.values(stages).forEach(el => el.classList.remove('active'));
  if (stages[stage]) {
    stages[stage].classList.add('active');
  }
}

function deactivateAllStages() {
  Object.values(stages).forEach(el => el.classList.remove('active'));
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Listeners
// ═══════════════════════════════════════════════════════════════════════════
startBtn.addEventListener('click', () => {
  if (isRunning) {
    stopCamera();
  } else {
    startCamera();
  }
});

toggleLandmarksBtn.addEventListener('click', () => {
  showLandmarks = !showLandmarks;
  toggleLandmarksBtn.textContent = showLandmarks ? '👁️ Landmarks' : '👁️‍🗨️ Landmarks';
  if (!showLandmarks) {
    const ctx = landmarkCanvas.getContext('2d');
    ctx.clearRect(0, 0, landmarkCanvas.width, landmarkCanvas.height);
  }
});

toggleMirrorBtn.addEventListener('click', () => {
  isMirrored = !isMirrored;
  video.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
  toggleMirrorBtn.textContent = isMirrored ? '🔄 Mirror' : '↔️ Normal';
});

// Handle window resize
window.addEventListener('resize', () => {
  cursorCanvas.width = window.innerWidth;
  cursorCanvas.height = window.innerHeight;
});

// ═══════════════════════════════════════════════════════════════════════════
// Initialize on Load
// ═══════════════════════════════════════════════════════════════════════════
initMediaPipe().catch(err => {
  console.error('MediaPipe init error:', err);
  loadingStatus.textContent = `Error: ${err.message}`;
  mediapipeStatus.textContent = 'ERROR';
  mediapipeStatus.className = 'status-value error';
});
