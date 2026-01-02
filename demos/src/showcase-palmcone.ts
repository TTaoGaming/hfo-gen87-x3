/**
 * Showcase: PalmConeGate - Port 5 DEFEND
 *
 * Gen87.X3 | DEFEND | Schmitt Trigger Hysteresis
 *
 * Demonstrates the PalmConeGate for Anti-Midas Touch protection.
 * Uses Schmitt trigger pattern to prevent oscillation.
 *
 * @port 5
 * @verb DEFEND
 * @binary 101
 * @element Fire - Burns away impurity, gate guardian
 *
 * 93.69% mutation score - SILVER CERTIFIED
 */

import {
	DEFAULT_PALM_CONE_CONFIG,
	type NormalizedLandmark,
	type PalmConeGateResult,
	createPalmConeGate,
} from '../../hot/bronze/src/browser/index.js';

// ============================================================================
// GATE INITIALIZATION
// ============================================================================

const palmGate = createPalmConeGate({
	armThreshold: 25, // Enter tracking when palm < 25°
	disarmThreshold: 35, // Exit tracking when palm > 35°
	cancelThreshold: 70, // Immediate cancel when palm > 70°
});

// ============================================================================
// SIMULATION STATE
// ============================================================================

let currentAngle = 90; // Start perpendicular
let animationId: number | null = null;

// ============================================================================
// STYLES
// ============================================================================

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    background: #0d1117;
    color: #c9d1d9;
    min-height: 100vh;
    padding: 24px;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .header h1 {
    font-size: 1.5rem;
    background: linear-gradient(135deg, #f85149 0%, #ffa657 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .badge.defend { background: #f85149; color: #fff; }
  .badge.silver { background: #8b949e; color: #000; }
  .badge.mutation { background: #238636; color: #fff; }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .panel {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
  }
  
  .panel h3 {
    color: #ffa657;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
  
  .gate-status {
    text-align: center;
    padding: 32px;
    border-radius: 8px;
    transition: all 0.3s;
  }
  
  .gate-status.facing {
    background: linear-gradient(135deg, #238636 0%, #3fb950 100%);
  }
  
  .gate-status.away {
    background: linear-gradient(135deg, #da3633 0%, #f85149 100%);
  }
  
  .gate-status.hysteresis {
    background: linear-gradient(135deg, #9e6a03 0%, #d29922 100%);
  }
  
  .gate-status .icon {
    font-size: 4rem;
    margin-bottom: 12px;
  }
  
  .gate-status .label {
    font-size: 1.2rem;
    font-weight: bold;
  }
  
  .gate-status .angle {
    font-size: 2rem;
    margin-top: 8px;
  }
  
  .slider-container {
    margin: 24px 0;
  }
  
  .slider-container label {
    display: block;
    margin-bottom: 8px;
    color: #8b949e;
  }
  
  input[type="range"] {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #21262d;
    appearance: none;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #58a6ff;
    cursor: pointer;
  }
  
  .threshold-markers {
    position: relative;
    height: 40px;
    margin-top: 8px;
  }
  
  .threshold-marker {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    text-align: center;
    font-size: 0.7rem;
  }
  
  .threshold-marker .line {
    width: 2px;
    height: 20px;
    margin: 0 auto 4px;
  }
  
  .threshold-marker.arm .line { background: #3fb950; }
  .threshold-marker.disarm .line { background: #d29922; }
  .threshold-marker.cancel .line { background: #f85149; }
  
  .visualization {
    position: relative;
    height: 200px;
    background: #0d1117;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .palm-visual {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 5rem;
    transition: transform 0.1s;
  }
  
  .zone {
    position: absolute;
    left: 0;
    right: 0;
    opacity: 0.3;
  }
  
  .zone.armed { background: #238636; }
  .zone.hysteresis { background: #9e6a03; }
  .zone.disarmed { background: #da3633; }
  
  .config-display {
    font-size: 0.8rem;
    color: #8b949e;
  }
  
  .config-display code {
    background: #21262d;
    padding: 2px 6px;
    border-radius: 4px;
    color: #7ee787;
  }
  
  .history {
    max-height: 150px;
    overflow-y: auto;
    font-size: 0.8rem;
  }
  
  .history-entry {
    padding: 4px 8px;
    border-bottom: 1px solid #21262d;
  }
  
  .history-entry.facing { color: #3fb950; }
  .history-entry.away { color: #f85149; }
  
  .controls {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  button {
    padding: 8px 16px;
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #c9d1d9;
    cursor: pointer;
    font-family: inherit;
  }
  
  button:hover { background: #30363d; }
  button.active { background: #238636; border-color: #238636; }
`;

// ============================================================================
// UI RENDERING
// ============================================================================

function render(): void {
	const app = document.getElementById('app');
	if (!app) return;

	app.innerHTML = `
    <style>${STYLES}</style>
    
    <div class="header">
      <h1>🔥 Port 5: PalmConeGate</h1>
      <span class="badge defend">DEFEND</span>
      <span class="badge silver">SILVER</span>
      <span class="badge mutation">93.69%</span>
    </div>
    
    <div class="controls">
      <button id="autoBtn">Auto Sweep</button>
      <button id="resetBtn">Reset Gate</button>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h3>🎯 Gate Status</h3>
        <div id="gateStatus" class="gate-status away">
          <div class="icon">🖐️</div>
          <div class="label">Palm Away</div>
          <div class="angle">90°</div>
        </div>
        
        <div class="slider-container">
          <label>Palm Angle: <span id="angleValue">90</span>°</label>
          <input type="range" id="angleSlider" min="0" max="180" value="90">
          <div class="threshold-markers">
            <div class="threshold-marker arm" style="left: ${(25 / 180) * 100}%">
              <div class="line"></div>
              <div>ARM<br>25°</div>
            </div>
            <div class="threshold-marker disarm" style="left: ${(35 / 180) * 100}%">
              <div class="line"></div>
              <div>DISARM<br>35°</div>
            </div>
            <div class="threshold-marker cancel" style="left: ${(70 / 180) * 100}%">
              <div class="line"></div>
              <div>CANCEL<br>70°</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h3>📐 Visualization</h3>
        <div class="visualization">
          <div class="zone armed" style="top: 0; height: ${(25 / 180) * 100}%"></div>
          <div class="zone hysteresis" style="top: ${(25 / 180) * 100}%; height: ${((35 - 25) / 180) * 100}%"></div>
          <div class="zone disarmed" style="top: ${(35 / 180) * 100}%; height: ${((180 - 35) / 180) * 100}%"></div>
          <div id="palmVisual" class="palm-visual">🖐️</div>
        </div>
      </div>
      
      <div class="panel">
        <h3>⚙️ Configuration</h3>
        <div class="config-display">
          <p>Arm Threshold: <code>${DEFAULT_PALM_CONE_CONFIG.armThreshold}°</code></p>
          <p>Disarm Threshold: <code>${DEFAULT_PALM_CONE_CONFIG.disarmThreshold}°</code></p>
          <p>Cancel Threshold: <code>${DEFAULT_PALM_CONE_CONFIG.cancelThreshold}°</code></p>
          <p style="margin-top: 12px; color: #58a6ff;">
            Hysteresis Band: <code>${DEFAULT_PALM_CONE_CONFIG.disarmThreshold - DEFAULT_PALM_CONE_CONFIG.armThreshold}°</code>
          </p>
        </div>
        <p style="margin-top: 12px; font-size: 0.75rem; color: #8b949e;">
          Schmitt trigger pattern prevents oscillation when palm hovers near threshold.
        </p>
      </div>
      
      <div class="panel">
        <h3>📜 State History</h3>
        <div id="history" class="history"></div>
      </div>
    </div>
  `;

	// Bind events
	const slider = document.getElementById('angleSlider') as HTMLInputElement;
	slider.addEventListener('input', (e) => {
		currentAngle = Number((e.target as HTMLInputElement).value);
		updateGate();
	});

	document.getElementById('autoBtn')?.addEventListener('click', toggleAutoSweep);
	document.getElementById('resetBtn')?.addEventListener('click', resetGate);

	// Initial update
	updateGate();
}

// ============================================================================
// GATE LOGIC
// ============================================================================

function createMockLandmarks(angle: number): NormalizedLandmark[] {
	// Create mock landmarks that produce the desired palm angle
	// Palm angle is based on cross product of wrist→index_mcp × wrist→pinky_mcp
	const radians = (angle * Math.PI) / 180;

	// Simplified simulation: we create landmarks where the normal is at the given angle
	const landmarks: NormalizedLandmark[] = [];

	for (let i = 0; i < 21; i++) {
		landmarks.push({ x: 0.5, y: 0.5, z: 0 });
	}

	// Position key landmarks to produce desired angle
	// WRIST at origin
	landmarks[0] = { x: 0.5, y: 0.5, z: 0 };

	// INDEX_MCP - offset in X direction
	landmarks[5] = { x: 0.6, y: 0.5, z: Math.sin(radians) * 0.1 };

	// PINKY_MCP - offset in Y direction
	landmarks[17] = { x: 0.5, y: 0.6, z: 0 };

	return landmarks;
}

function updateGate(): void {
	const landmarks = createMockLandmarks(currentAngle);
	const result = palmGate.process(landmarks, performance.now());

	updateUI(result);
	addHistoryEntry(result);
}

function updateUI(result: PalmConeGateResult): void {
	// Update angle display
	const angleValue = document.getElementById('angleValue');
	const angleSlider = document.getElementById('angleSlider') as HTMLInputElement;
	if (angleValue) angleValue.textContent = String(Math.round(currentAngle));
	if (angleSlider) angleSlider.value = String(currentAngle);

	// Update gate status
	const gateStatus = document.getElementById('gateStatus');
	if (gateStatus) {
		const inHysteresis = currentAngle >= 25 && currentAngle <= 35 && result.state.isFacing;

		if (result.state.isFacing) {
			gateStatus.className = `gate-status ${inHysteresis ? 'hysteresis' : 'facing'}`;
			gateStatus.innerHTML = `
        <div class="icon">✋</div>
        <div class="label">${inHysteresis ? 'Hysteresis Band' : 'Palm Facing'}</div>
        <div class="angle">${Math.round(result.state.lastPalmAngle)}°</div>
      `;
		} else {
			gateStatus.className = 'gate-status away';
			gateStatus.innerHTML = `
        <div class="icon">🖐️</div>
        <div class="label">Palm Away</div>
        <div class="angle">${Math.round(result.state.lastPalmAngle)}°</div>
      `;
		}
	}

	// Update palm visual rotation
	const palmVisual = document.getElementById('palmVisual');
	if (palmVisual) {
		// Map angle to visual rotation
		const rotation = currentAngle - 90; // 0° = facing up, 180° = facing down
		palmVisual.style.transform = `translateX(-50%) rotateX(${rotation}deg)`;
	}
}

function addHistoryEntry(result: PalmConeGateResult): void {
	const history = document.getElementById('history');
	if (!history) return;

	const entry = document.createElement('div');
	entry.className = `history-entry ${result.state.isFacing ? 'facing' : 'away'}`;
	entry.textContent = `${new Date().toISOString().split('T')[1].slice(0, 12)} | ${Math.round(currentAngle)}° | ${result.state.isFacing ? 'FACING' : 'AWAY'}`;

	history.insertBefore(entry, history.firstChild);

	// Limit history
	while (history.children.length > 20) {
		history.removeChild(history.lastChild!);
	}
}

// ============================================================================
// AUTO SWEEP
// ============================================================================

let sweepDirection = 1;
let autoSweepActive = false;

function toggleAutoSweep(): void {
	autoSweepActive = !autoSweepActive;
	const btn = document.getElementById('autoBtn');
	if (btn) btn.className = autoSweepActive ? 'active' : '';

	if (autoSweepActive) {
		runAutoSweep();
	} else if (animationId !== null) {
		cancelAnimationFrame(animationId);
		animationId = null;
	}
}

function runAutoSweep(): void {
	if (!autoSweepActive) return;

	currentAngle += sweepDirection * 0.5;

	if (currentAngle >= 90) {
		sweepDirection = -1;
	} else if (currentAngle <= 0) {
		sweepDirection = 1;
	}

	updateGate();
	animationId = requestAnimationFrame(runAutoSweep);
}

function resetGate(): void {
	palmGate.reset();
	currentAngle = 90;
	updateGate();

	const history = document.getElementById('history');
	if (history) history.innerHTML = '';
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', render);
