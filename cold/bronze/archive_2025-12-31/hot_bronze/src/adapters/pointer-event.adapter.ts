/**
 * Pointer Event Emitter Adapter
 *
 * Gen87.X3 | Port 5 (DEFEND) | Implements EmitterPort
 *
 * EXEMPLAR SOURCE: https://www.w3.org/TR/pointerevents/
 * MDN Reference: https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 *
 * Grounded: Tavily research 2025-12-29
 */
import type { EmitterPort } from '../contracts/ports.js';
import {
	type AdapterTarget,
	type FSMAction,
	type PointerEventOut,
	PointerEventOutSchema,
} from '../contracts/schemas.js';

/**
 * Pointer Event Emitter Adapter
 * Converts FSM actions to W3C PointerEventOut descriptors
 */
export class PointerEventAdapter implements EmitterPort {
	private _pointerId: number;
	private readonly pointerType: 'mouse' | 'pen' | 'touch';

	constructor(pointerId = 1, pointerType: 'mouse' | 'pen' | 'touch' = 'touch') {
		this._pointerId = pointerId;
		this.pointerType = pointerType;
	}

	get pointerId(): number {
		return this._pointerId;
	}

	emit(action: FSMAction, target: AdapterTarget): PointerEventOut | null {
		if (action.action === 'none') {
			return null;
		}

		// Convert normalized (0-1) coordinates to target coordinates
		const clientX = 'x' in action ? target.bounds.left + action.x * target.bounds.width : 0;
		const clientY = 'y' in action ? target.bounds.top + action.y * target.bounds.height : 0;

		let event: PointerEventOut;

		switch (action.action) {
			case 'move':
				event = {
					type: 'pointermove',
					pointerId: this._pointerId,
					clientX,
					clientY,
					pointerType: this.pointerType,
					pressure: 0.5,
					isPrimary: true,
				};
				break;

			case 'down':
				event = {
					type: 'pointerdown',
					pointerId: this._pointerId,
					clientX,
					clientY,
					pointerType: this.pointerType,
					button: action.button,
					buttons: action.button === 0 ? 1 : action.button === 1 ? 4 : 2,
					pressure: 0.5,
					isPrimary: true,
				};
				break;

			case 'up':
				event = {
					type: 'pointerup',
					pointerId: this._pointerId,
					clientX,
					clientY,
					pointerType: this.pointerType,
					button: action.button,
					buttons: 0,
					pressure: 0,
					isPrimary: true,
				};
				break;

			case 'cancel':
				event = {
					type: 'pointercancel',
					pointerId: this._pointerId,
					pointerType: this.pointerType,
				};
				break;

			case 'wheel':
				event = {
					type: 'wheel',
					deltaY: action.deltaY,
					deltaMode: 0, // DOM_DELTA_PIXEL
					ctrlKey: action.ctrl ?? false,
					clientX: target.bounds.left + target.bounds.width / 2,
					clientY: target.bounds.top + target.bounds.height / 2,
				};
				break;

			default:
				return null;
		}

		// CDD: Validate output at port boundary
		return PointerEventOutSchema.parse(event);
	}
}

/**
 * DOM Adapter - Injects PointerEvents into DOM elements
 * Implements AdapterPort interface
 */
export class DOMAdapter implements AdapterPort {
	private element: Element;
	private _pointerId: number;
	private _hasCapture = false;

	constructor(element: Element, pointerId = 1) {
		this.element = element;
		this._pointerId = pointerId;
	}

	inject(event: PointerEventOut): boolean {
		const domEvent = this.createDOMEvent(event);
		if (!domEvent) return false;

		return this.element.dispatchEvent(domEvent);
	}

	private createDOMEvent(event: PointerEventOut): Event | null {
		if (event.type === 'wheel') {
			return new WheelEvent('wheel', {
				bubbles: true,
				cancelable: true,
				deltaY: event.deltaY,
				deltaMode: event.deltaMode,
				ctrlKey: event.ctrlKey,
				clientX: event.clientX,
				clientY: event.clientY,
			});
		}

		// Pointer events
		return new PointerEvent(event.type, {
			bubbles: true,
			cancelable: true,
			composed: true,
			view: window,
			pointerId: 'pointerId' in event ? event.pointerId : this._pointerId,
			pointerType: 'pointerType' in event ? event.pointerType : 'touch',
			isPrimary: 'isPrimary' in event ? event.isPrimary : true,
			clientX: 'clientX' in event ? event.clientX : 0,
			clientY: 'clientY' in event ? event.clientY : 0,
			button: 'button' in event ? event.button : 0,
			buttons: 'buttons' in event ? event.buttons : 0,
			pressure: 'pressure' in event ? event.pressure : 0.5,
			width: 20,
			height: 20,
		});
	}

	getBounds(): AdapterTarget['bounds'] {
		const rect = this.element.getBoundingClientRect();
		return {
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top,
		};
	}

	setCapture(): void {
		try {
			this.element.setPointerCapture(this._pointerId);
			this._hasCapture = true;
		} catch {
			// May fail if no active pointer
			this._hasCapture = false;
		}
	}

	releaseCapture(): void {
		try {
			this.element.releasePointerCapture(this._pointerId);
		} catch {
			// May fail if no capture
		}
		this._hasCapture = false;
	}

	hasCapture(): boolean {
		try {
			return this.element.hasPointerCapture(this._pointerId);
		} catch {
			return this._hasCapture;
		}
	}
}

/**
 * Mock adapter for testing - implements same interface for test doubles
 */
export class MockDOMAdapter implements AdapterPort {
	private events: PointerEventOut[] = [];
	private _hasCapture = false;
	private readonly bounds: AdapterTarget['bounds'];

	constructor(bounds: AdapterTarget['bounds'] = { width: 800, height: 600, left: 0, top: 0 }) {
		this.bounds = bounds;
	}

	inject(event: PointerEventOut): boolean {
		this.events.push(event);
		return true;
	}

	getBounds(): AdapterTarget['bounds'] {
		return this.bounds;
	}

	setCapture(): void {
		this._hasCapture = true;
	}

	releaseCapture(): void {
		this._hasCapture = false;
	}

	hasCapture(): boolean {
		return this._hasCapture;
	}

	/** Get recorded events for testing */
	getEvents(): PointerEventOut[] {
		return [...this.events];
	}

	/** Clear recorded events */
	clearEvents(): void {
		this.events = [];
	}
}
