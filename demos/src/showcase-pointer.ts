/**
 * Pointer Event Showcase Demo - Port 5 DEFEND
 *
 * Gen87.X3 | PointerEventAdapter Showcase
 *
 * PURPOSE: Demonstrate PointerEventAdapter in ISOLATION
 * This demo uses the REAL PointerEventAdapter from hot/bronze/src/adapters
 *
 * ARCHITECTURE ENFORCEMENT:
 * - Uses PointerEventAdapter (not raw DOM events)
 * - Converts FSM actions to W3C PointerEvents
 * - Visualizes the event stream
 *
 * @port 5
 * @verb DEFEND
 * @binary 101
 * @element Fire - Burns away impurity, gate guardian
 */

import {
	PointerEventAdapter,
	type FSMAction,
	InMemorySubstrateAdapter,
	createSensorFrameFromMouse,
	OneEuroExemplarAdapter,
	XStateFSMAdapter,
} from '../../hot/bronze/src/browser/index.js';
import type { AdapterTarget, PointerEventOut } from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// REAL ADAPTER INSTANTIATION (Constraint Test Will Verify This)
// ============================================================================

// Port 5 - Pointer Event Emitter (W3C PointerEvents)
const pointerEmitter = new PointerEventAdapter(1, 'touch');

// Port 3 - FSM (provides input actions)
const fsm = new XStateFSMAdapter();

// Port 2 - Smoother
const smoother = new OneEuroExemplarAdapter();

// Message Bus
const bus = new InMemorySubstrateAdapter();

// ============================================================================
// STATE
// ============================================================================

interface DemoState {
	lastAction: FSMAction | null;
	lastEvent: PointerEventOut | null;
	eventLog: Array<{ event: PointerEventOut; ts: number }>;
	cursorPosition: { x: number; y: number };
	isPressed: boolean;
	targetBounds: DOMRect | null;
}

const state: DemoState = {
	lastAction: null,
	lastEvent: null,
	eventLog: [],
	cursorPosition: { x: 0.5, y: 0.5 },
	isPressed: false,
	targetBounds: null,
};

// ============================================================================
// PIPELINE: Mouse → Smooth → FSM → PointerEvent
// ============================================================================

function processInput(clientX: number, clientY: number): void {
	const targetEl = document.getElementById('pointer-target');
	if (!targetEl) return;

	state.targetBounds = targetEl.getBoundingClientRect();
	const bounds = state.targetBounds;

	// Normalize to 0-1
	const x = (clientX - bounds.left) / bounds.width;
	const y = (clientY - bounds.top) / bounds.height;

	// Clamp to target area
	if (x < 0 || x > 1 || y < 0 || y > 1) return;

	state.cursorPosition = { x, y };

	// Create sensor frame
	const ts = performance.now();
	const sensorFrame = createSensorFrameFromMouse(x, y, ts);

	// Stage 2: Smooth
	const smoothed = smoother.smooth(sensorFrame);

	// Stage 3: FSM
	const action = fsm.process(smoothed);
	state.lastAction = action;

	// Stage 5: PointerEvent Emission (THE REAL ADAPTER UNDER TEST)
	const target: AdapterTarget = {
		id: 'demo-target',
		bounds: {
			left: bounds.left,
			top: bounds.top,
			width: bounds.width,
			height: bounds.height,
		},
	};

	const pointerEvent = pointerEmitter.emit(action, target);
	
	if (pointerEvent) {
		state.lastEvent = pointerEvent;
		state.eventLog.push({ event: pointerEvent, ts });
		
		// Keep only last 20 events
		if (state.eventLog.length > 20) {
			state.eventLog.shift();
		}

		// Emit to bus for observability
		bus.emit({
			type: 'pointer.event',
			data: pointerEvent,
		});

		// Dispatch to target element
		dispatchToTarget(targetEl, pointerEvent);
	}

	render();
}

// ============================================================================
// DISPATCH REAL POINTER EVENTS TO TARGET
// ============================================================================

function dispatchToTarget(target: HTMLElement, event: PointerEventOut): void {
	if (event.type === 'wheel') {
		const wheelEvent = new WheelEvent('wheel', {
			deltaY: event.deltaY,
			deltaMode: event.deltaMode,
			bubbles: true,
		});
		target.dispatchEvent(wheelEvent);
		return;
	}

	const pointerEvent = new PointerEvent(event.type, {
		pointerId: event.pointerId,
		clientX: event.clientX,
		clientY: event.clientY,
		pointerType: event.pointerType,
		pressure: event.pressure ?? 0,
		isPrimary: event.isPrimary ?? true,
		button: event.button ?? 0,
		buttons: event.buttons ?? 0,
		bubbles: true,
	});

	target.dispatchEvent(pointerEvent);

	// Update pressed state
	if (event.type === 'pointerdown') state.isPressed = true;
	if (event.type === 'pointerup' || event.type === 'pointercancel') state.isPressed = false;
}

// ============================================================================
// MANUAL ACTION BUTTONS (For testing specific actions)
// ============================================================================

function simulateAction(actionType: 'move' | 'down' | 'up' | 'cancel'): void {
	const targetEl = document.getElementById('pointer-target');
	if (!targetEl) return;

	const bounds = targetEl.getBoundingClientRect();
	const target: AdapterTarget = {
		id: 'demo-target',
		bounds: {
			left: bounds.left,
			top: bounds.top,
			width: bounds.width,
			height: bounds.height,
		},
	};

	let action: FSMAction;
	switch (actionType) {
		case 'move':
			action = { action: 'move', state: 'ARMED', x: state.cursorPosition.x, y: state.cursorPosition.y };
			break;
		case 'down':
			action = { action: 'down', state: 'DOWN_COMMIT', x: state.cursorPosition.x, y: state.cursorPosition.y, button: 0 };
			break;
		case 'up':
			action = { action: 'up', state: 'ARMED', x: state.cursorPosition.x, y: state.cursorPosition.y, button: 0 };
			break;
		case 'cancel':
			action = { action: 'cancel', state: 'DISARMED' };
			break;
	}

	const pointerEvent = pointerEmitter.emit(action, target);
	if (pointerEvent) {
		state.lastEvent = pointerEvent;
		state.lastAction = action;
		state.eventLog.push({ event: pointerEvent, ts: performance.now() });
		if (state.eventLog.length > 20) state.eventLog.shift();
		dispatchToTarget(targetEl, pointerEvent);
	}
	render();
}

// ============================================================================
// RENDERING
// ============================================================================

function render(): void {
	const container = document.getElementById('pointer-viz');
	if (!container) return;

	const eventTypeColors: Record<string, string> = {
		pointermove: '#22c55e',
		pointerdown: '#3b82f6',
		pointerup: '#f59e0b',
		pointercancel: '#ef4444',
		wheel: '#8b5cf6',
	};

	container.innerHTML = `
		<div class="pointer-demo">
			<div class="current-event" style="border-color: ${state.lastEvent ? eventTypeColors[state.lastEvent.type] || '#6b7280' : '#6b7280'}">
				<h3>Last Pointer Event</h3>
				${state.lastEvent ? `
					<div class="event-type" style="color: ${eventTypeColors[state.lastEvent.type]}">${state.lastEvent.type}</div>
					<div class="event-details">
						${state.lastEvent.clientX !== undefined ? `Position: (${state.lastEvent.clientX.toFixed(0)}, ${state.lastEvent.clientY?.toFixed(0)})` : ''}
						${state.lastEvent.button !== undefined ? `<br>Button: ${state.lastEvent.button}` : ''}
						<br>PointerId: ${state.lastEvent.pointerId}
						<br>PointerType: ${state.lastEvent.pointerType}
					</div>
				` : '<div class="empty">No events yet</div>'}
			</div>

			<div class="action-buttons">
				<h3>Manual Actions</h3>
				<div class="buttons">
					<button onclick="window.simulateAction('move')">pointermove</button>
					<button onclick="window.simulateAction('down')">pointerdown</button>
					<button onclick="window.simulateAction('up')">pointerup</button>
					<button onclick="window.simulateAction('cancel')">pointercancel</button>
				</div>
			</div>

			<div class="event-log">
				<h3>Event Stream</h3>
				<div class="events">
					${state.eventLog.slice(-10).reverse().map(({ event, ts }) => `
						<div class="event" style="border-left-color: ${eventTypeColors[event.type]}">
							<span class="type">${event.type}</span>
							${event.clientX !== undefined ? `<span class="pos">(${event.clientX.toFixed(0)}, ${event.clientY?.toFixed(0)})</span>` : ''}
							<span class="time">${ts.toFixed(0)}ms</span>
						</div>
					`).join('') || '<div class="empty">No events</div>'}
				</div>
			</div>

			<div class="adapter-info">
				<h3>Adapter Configuration</h3>
				<div class="info">
					<div>PointerId: ${pointerEmitter.pointerId}</div>
					<div>PointerType: touch</div>
					<div>W3C Spec: <a href="https://www.w3.org/TR/pointerevents/" target="_blank">PointerEvents</a></div>
				</div>
			</div>
		</div>
	`;
}

// ============================================================================
// GLOBAL HANDLERS
// ============================================================================

// @ts-expect-error - Global for onclick
window.simulateAction = simulateAction;

// ============================================================================
// INITIALIZATION
// ============================================================================

function init(): void {
	const container = document.getElementById('app');
	if (!container) return;

	container.innerHTML = `
		<style>
			.pointer-page { display: grid; grid-template-columns: 1fr 350px; gap: 20px; padding: 20px; height: 100vh; box-sizing: border-box; }
			.target-area { background: #0f172a; border: 2px dashed #334155; border-radius: 12px; position: relative; min-height: 400px; }
			.target-area h3 { position: absolute; top: 10px; left: 15px; color: #64748b; margin: 0; }
			.cursor-indicator { position: absolute; width: 30px; height: 30px; border: 3px solid #3b82f6; border-radius: 50%; transform: translate(-50%, -50%); pointer-events: none; transition: all 0.05s; }
			.cursor-indicator.pressed { background: rgba(59, 130, 246, 0.5); border-width: 5px; }
			.pointer-demo { display: flex; flex-direction: column; gap: 15px; }
			.current-event { background: #1e293b; padding: 15px; border-radius: 12px; border-left: 4px solid; }
			.current-event h3 { color: #94a3b8; margin: 0 0 10px 0; font-size: 14px; }
			.event-type { font-size: 24px; font-weight: bold; }
			.event-details { color: #94a3b8; margin-top: 10px; font-family: monospace; }
			.action-buttons { background: #1e293b; padding: 15px; border-radius: 12px; }
			.action-buttons h3 { color: #94a3b8; margin: 0 0 10px 0; font-size: 14px; }
			.buttons { display: flex; gap: 8px; flex-wrap: wrap; }
			.buttons button { padding: 8px 16px; border: 1px solid #475569; border-radius: 6px; background: #334155; color: #e2e8f0; cursor: pointer; }
			.buttons button:hover { background: #475569; }
			.event-log { background: #1e293b; padding: 15px; border-radius: 12px; flex: 1; overflow-y: auto; }
			.event-log h3 { color: #94a3b8; margin: 0 0 10px 0; font-size: 14px; }
			.events { display: flex; flex-direction: column; gap: 6px; }
			.event { display: flex; justify-content: space-between; padding: 8px; background: #0f172a; border-radius: 4px; border-left: 3px solid; font-size: 12px; }
			.event .type { color: #e2e8f0; font-weight: bold; }
			.event .pos { color: #94a3b8; font-family: monospace; }
			.event .time { color: #64748b; }
			.adapter-info { background: #1e293b; padding: 15px; border-radius: 12px; }
			.adapter-info h3 { color: #94a3b8; margin: 0 0 10px 0; font-size: 14px; }
			.info { color: #e2e8f0; font-family: monospace; font-size: 13px; }
			.info a { color: #60a5fa; }
			.empty { color: #64748b; font-style: italic; }
		</style>
		<div class="pointer-page">
			<div id="pointer-target" class="target-area">
				<h3>Move mouse here to generate PointerEvents</h3>
				<div id="cursor" class="cursor-indicator" style="left: 50%; top: 50%;"></div>
			</div>
			<div id="pointer-viz"></div>
		</div>
	`;

	// Set up mouse tracking on target
	const target = document.getElementById('pointer-target');
	const cursor = document.getElementById('cursor');

	if (target && cursor) {
		target.addEventListener('mousemove', (e) => {
			processInput(e.clientX, e.clientY);
			cursor.style.left = `${e.clientX - target.getBoundingClientRect().left}px`;
			cursor.style.top = `${e.clientY - target.getBoundingClientRect().top}px`;
		});

		target.addEventListener('mousedown', () => {
			cursor?.classList.add('pressed');
		});

		target.addEventListener('mouseup', () => {
			cursor?.classList.remove('pressed');
		});
	}

	// Initial render
	render();
}

// Run on DOM ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

export { pointerEmitter, fsm, smoother, bus, state };
