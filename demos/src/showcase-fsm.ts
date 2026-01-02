/**
 * FSM Showcase Demo - Port 3 DELIVER
 *
 * Gen87.X3 | XState FSM Adapter Showcase
 *
 * PURPOSE: Demonstrate XStateFSMAdapter in ISOLATION
 * This demo uses the REAL XStateFSMAdapter from hot/bronze/src/adapters
 *
 * ARCHITECTURE ENFORCEMENT:
 * - Uses XStateFSMAdapter (not inline state management)
 * - Visualizes FSM state transitions
 * - Shows gesture → FSM → action pipeline
 *
 * @port 3
 * @verb DELIVER
 * @binary 011
 * @element Wind - Carries seeds, spreads influence
 */

import {
	GestureLabels,
	InMemorySubstrateAdapter,
	OneEuroExemplarAdapter,
	type SensorFrame,
	type SmoothedFrame,
	XStateFSMAdapter,
} from '../../hot/bronze/src/browser/index.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION (Constraint Test Will Verify This)
// ============================================================================

// Port 3 - FSM (XState v5)
const fsm = new XStateFSMAdapter();

// Port 2 - Smoother (for input preprocessing)
const smoother = new OneEuroExemplarAdapter();

// Message Bus (for inter-component communication)
const bus = new InMemorySubstrateAdapter();

// ============================================================================
// STATE MACHINE VISUALIZATION
// ============================================================================

interface FSMVisualization {
	currentState: string;
	previousState: string;
	lastAction: string;
	transitionHistory: Array<{ from: string; to: string; action: string; ts: number }>;
	stateColors: Record<string, string>;
}

const visualization: FSMVisualization = {
	currentState: 'DISARMED',
	previousState: 'DISARMED',
	lastAction: 'none',
	transitionHistory: [],
	stateColors: {
		DISARMED: '#ef4444', // Red
		ARMING: '#f59e0b', // Amber
		ARMED: '#22c55e', // Green
		DOWN_COMMIT: '#3b82f6', // Blue
		DOWN_NAV: '#8b5cf6', // Purple
		ZOOM: '#06b6d4', // Cyan
	},
};

// ============================================================================
// DEMO STATE
// ============================================================================

interface DemoState {
	currentGesture: string;
	palmFacing: boolean;
	confidence: number;
	actionCount: number;
}

const state: DemoState = {
	currentGesture: 'None',
	palmFacing: false,
	confidence: 0.85,
	actionCount: 0,
};

// Simulate gesture cycling for demo purposes
const GESTURE_SEQUENCE = [
	'None',
	'Open_Palm',
	'Pointing_Up',
	'Victory',
	'Thumb_Up',
	'Open_Palm',
	'None',
];
let gestureIndex = 0;

// ============================================================================
// PIPELINE: Frame → Smooth → FSM → Action
// ============================================================================

function processFrame(x: number, y: number): void {
	const ts = performance.now();

	// Create sensor frame with current gesture state
	const sensorFrame: SensorFrame = {
		ts,
		handId: 'right',
		trackingOk: true,
		palmFacing: state.palmFacing,
		label: state.currentGesture as SensorFrame['label'],
		confidence: state.confidence,
		indexTip: { x, y, z: 0, visibility: 1.0 },
		landmarks: null,
	};

	// Stage 2: Smooth
	const smoothedFrame: SmoothedFrame = smoother.smooth(sensorFrame);

	// Stage 3: FSM (The REAL adapter under test)
	const previousState = visualization.currentState;
	const action = fsm.process(smoothedFrame);
	const newState = action.state;

	// Record transition
	if (newState !== previousState) {
		visualization.transitionHistory.push({
			from: previousState,
			to: newState,
			action: action.action,
			ts,
		});
		// Keep only last 10 transitions
		if (visualization.transitionHistory.length > 10) {
			visualization.transitionHistory.shift();
		}
	}

	visualization.previousState = previousState;
	visualization.currentState = newState;
	visualization.lastAction = action.action;
	state.actionCount++;

	// Log transition for observability (bus.publish requires async connection)
	console.log('[FSM Transition]', { from: previousState, to: newState, action: action.action, ts });

	renderVisualization();
}

// ============================================================================
// UI RENDERING
// ============================================================================

function renderVisualization(): void {
	const container = document.getElementById('fsm-viz');
	if (!container) return;

	const stateColor = visualization.stateColors[visualization.currentState] || '#6b7280';

	container.innerHTML = `
		<div class="fsm-demo">
			<div class="current-state" style="background: ${stateColor}">
				<h2>Current State</h2>
				<div class="state-name">${visualization.currentState}</div>
				<div class="action-badge">Action: ${visualization.lastAction}</div>
			</div>
			
			<div class="state-diagram">
				<h3>State Diagram</h3>
				<div class="states">
					${Object.entries(visualization.stateColors)
						.map(
							([s, color]) => `
						<div class="state-node ${s === visualization.currentState ? 'active' : ''}" 
						     style="border-color: ${color}; ${s === visualization.currentState ? `background: ${color}` : ''}">
							${s}
						</div>
					`,
						)
						.join('')}
				</div>
			</div>
			
			<div class="controls">
				<h3>Gesture Controls</h3>
				<div class="gesture-buttons">
					${GestureLabels.map(
						(g) => `
						<button class="gesture-btn ${state.currentGesture === g ? 'active' : ''}"
						        onclick="window.setGesture('${g}')">${g}</button>
					`,
					).join('')}
				</div>
				<label class="palm-toggle">
					<input type="checkbox" ${state.palmFacing ? 'checked' : ''} onchange="window.togglePalm()">
					Palm Facing Camera
				</label>
			</div>
			
			<div class="transition-log">
				<h3>Transition History</h3>
				<div class="transitions">
					${
						visualization.transitionHistory
							.slice(-5)
							.reverse()
							.map(
								(t) => `
						<div class="transition">
							<span style="color: ${visualization.stateColors[t.from]}">${t.from}</span>
							→ 
							<span style="color: ${visualization.stateColors[t.to]}">${t.to}</span>
							<span class="action">(${t.action})</span>
						</div>
					`,
							)
							.join('') || '<div class="empty">No transitions yet</div>'
					}
				</div>
			</div>
			
			<div class="stats">
				<div>Actions Processed: ${state.actionCount}</div>
				<div>Confidence: ${(state.confidence * 100).toFixed(0)}%</div>
			</div>
		</div>
	`;
}

// ============================================================================
// GLOBAL CONTROLS
// ============================================================================

// @ts-expect-error - Global for onclick handlers
window.setGesture = (gesture: string) => {
	state.currentGesture = gesture;
	processFrame(0.5, 0.5);
};

// @ts-expect-error - Global for onclick handlers
window.togglePalm = () => {
	state.palmFacing = !state.palmFacing;
	processFrame(0.5, 0.5);
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init(): void {
	const container = document.getElementById('app');
	if (!container) return;

	container.innerHTML = `
		<style>
			.fsm-demo { padding: 20px; font-family: system-ui; max-width: 800px; margin: auto; }
			.current-state { padding: 20px; border-radius: 12px; color: white; text-align: center; margin-bottom: 20px; }
			.current-state h2 { margin: 0 0 10px 0; opacity: 0.9; }
			.state-name { font-size: 32px; font-weight: bold; }
			.action-badge { margin-top: 10px; padding: 5px 15px; background: rgba(0,0,0,0.2); border-radius: 20px; display: inline-block; }
			.state-diagram { background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
			.state-diagram h3 { color: #94a3b8; margin: 0 0 15px 0; }
			.states { display: flex; flex-wrap: wrap; gap: 10px; }
			.state-node { padding: 10px 15px; border: 2px solid; border-radius: 8px; color: #e2e8f0; background: transparent; transition: all 0.2s; }
			.state-node.active { color: white; transform: scale(1.1); }
			.controls { background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
			.controls h3 { color: #94a3b8; margin: 0 0 15px 0; }
			.gesture-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
			.gesture-btn { padding: 8px 16px; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #e2e8f0; cursor: pointer; }
			.gesture-btn:hover { background: #475569; }
			.gesture-btn.active { background: #3b82f6; border-color: #3b82f6; }
			.palm-toggle { display: flex; align-items: center; gap: 10px; color: #e2e8f0; }
			.transition-log { background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
			.transition-log h3 { color: #94a3b8; margin: 0 0 15px 0; }
			.transitions { display: flex; flex-direction: column; gap: 8px; }
			.transition { padding: 8px; background: #0f172a; border-radius: 6px; color: #e2e8f0; }
			.action { color: #94a3b8; margin-left: 10px; }
			.empty { color: #64748b; font-style: italic; }
			.stats { display: flex; gap: 20px; color: #94a3b8; }
		</style>
		<div id="fsm-viz"></div>
	`;

	// Initial render
	renderVisualization();

	// Auto-cycle demo (optional - shows FSM transitions)
	setInterval(() => {
		if (state.palmFacing) {
			gestureIndex = (gestureIndex + 1) % GESTURE_SEQUENCE.length;
			state.currentGesture = GESTURE_SEQUENCE[gestureIndex];
			processFrame(0.5 + Math.random() * 0.1, 0.5 + Math.random() * 0.1);
		}
	}, 1000);
}

// Run on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

export { bus, fsm, smoother, visualization };
