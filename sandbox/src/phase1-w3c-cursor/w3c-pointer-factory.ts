/**
 * @fileoverview W3C Pointer Event Factory - Stage 4 EMITTER
 *
 * Creates W3C-compliant PointerEvent objects from FSM actions.
 * This is the "voice" that translates gestures into standard pointer events.
 *
 * @module phase1-w3c-cursor/w3c-pointer-factory
 * @see https://www.w3.org/TR/pointerevents/
 * @hive V (Validate)
 * @tdd GREEN
 */

import { z } from 'zod';

// ============================================================================
// W3C POINTER EVENT SCHEMAS (Level 3 Compliant)
// ============================================================================

/**
 * W3C Pointer Event Types
 * @see https://www.w3.org/TR/pointerevents/#pointerevent-types
 */
export const PointerEventTypeSchema = z.enum([
	'pointerdown',
	'pointerup',
	'pointermove',
	'pointerenter',
	'pointerleave',
	'pointerover',
	'pointerout',
	'pointercancel',
	'gotpointercapture',
	'lostpointercapture',
]);

export type PointerEventType = z.infer<typeof PointerEventTypeSchema>;

/**
 * W3C PointerEventInit schema
 * @see https://www.w3.org/TR/pointerevents/#pointerevent-interface
 */
export const PointerEventInitSchema = z.object({
	// From MouseEventInit
	clientX: z.number().default(0),
	clientY: z.number().default(0),
	screenX: z.number().default(0),
	screenY: z.number().default(0),
	button: z.number().int().min(-1).max(4).default(0),
	buttons: z.number().int().min(0).default(0),
	relatedTarget: z.any().nullable().default(null),

	// From UIEventInit
	view: z.any().nullable().default(null),
	detail: z.number().int().default(0),

	// From EventInit
	bubbles: z.boolean().default(true),
	cancelable: z.boolean().default(true),
	composed: z.boolean().default(true),

	// PointerEvent specific
	pointerId: z.number().int().default(1),
	width: z.number().min(0).default(1),
	height: z.number().min(0).default(1),
	pressure: z.number().min(0).max(1).default(0.5),
	tangentialPressure: z.number().min(-1).max(1).default(0),
	tiltX: z.number().int().min(-90).max(90).default(0),
	tiltY: z.number().int().min(-90).max(90).default(0),
	twist: z.number().int().min(0).max(359).default(0),
	altitudeAngle: z.number().min(0).max(Math.PI / 2).default(Math.PI / 2),
	azimuthAngle: z.number().min(0).max(2 * Math.PI).default(0),
	pointerType: z.enum(['mouse', 'pen', 'touch', '']).default('mouse'),
	isPrimary: z.boolean().default(true),

	// Modifier keys
	ctrlKey: z.boolean().default(false),
	shiftKey: z.boolean().default(false),
	altKey: z.boolean().default(false),
	metaKey: z.boolean().default(false),
});

export type PointerEventInit = z.infer<typeof PointerEventInitSchema>;

/**
 * FSM Action input schema
 */
export const FSMActionSchema = z.object({
	type: z.enum(['MOVE', 'CLICK', 'DOWN', 'UP', 'CANCEL', 'NONE']),
	position: z.object({
		x: z.number().min(0).max(1),
		y: z.number().min(0).max(1),
	}),
	state: z.string(),
	pressure: z.number().min(0).max(1).optional(),
	handId: z.string().optional(),
});

export type FSMAction = z.infer<typeof FSMActionSchema>;

// ============================================================================
// FACTORY CONFIGURATION
// ============================================================================

export interface W3CPointerFactoryConfig {
	/** Viewport width for coordinate mapping */
	viewportWidth: number;
	/** Viewport height for coordinate mapping */
	viewportHeight: number;
	/** Default pointer ID for gesture input */
	pointerId: number;
	/** Pointer type to use */
	pointerType: 'mouse' | 'pen' | 'touch';
	/** Whether this is the primary pointer */
	isPrimary: boolean;
}

const DEFAULT_CONFIG: W3CPointerFactoryConfig = {
	viewportWidth: 1920,
	viewportHeight: 1080,
	pointerId: 1,
	pointerType: 'pen', // Gesture = pen-like precision
	isPrimary: true,
};

// ============================================================================
// W3C POINTER EVENT FACTORY
// ============================================================================

/**
 * W3C Pointer Event Factory
 *
 * Translates FSM actions into W3C-compliant PointerEvent objects.
 * This enables gesture input to work with any W3C EventTarget.
 *
 * @example
 * ```typescript
 * const factory = new W3CPointerEventFactory({ viewportWidth: 1920, viewportHeight: 1080 });
 * const events = factory.fromFSMAction({ type: 'CLICK', position: { x: 0.5, y: 0.5 }, state: 'armed' });
 * // Returns: [PointerEvent('pointerdown'), PointerEvent('pointerup')]
 * ```
 */
export class W3CPointerEventFactory {
	private readonly config: W3CPointerFactoryConfig;
	private lastPosition: { clientX: number; clientY: number } = { clientX: 0, clientY: 0 };

	constructor(config: Partial<W3CPointerFactoryConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Convert normalized [0,1] position to viewport pixels
	 */
	normalizedToViewport(normalized: { x: number; y: number }): { clientX: number; clientY: number } {
		return {
			clientX: Math.round(normalized.x * this.config.viewportWidth),
			clientY: Math.round(normalized.y * this.config.viewportHeight),
		};
	}

	/**
	 * Create base PointerEventInit from position
	 */
	private createBaseInit(
		position: { x: number; y: number },
		overrides: Partial<PointerEventInit> = {}
	): PointerEventInit {
		const { clientX, clientY } = this.normalizedToViewport(position);

		this.lastPosition = { clientX, clientY };

		return PointerEventInitSchema.parse({
			clientX,
			clientY,
			screenX: clientX,
			screenY: clientY,
			pointerId: this.config.pointerId,
			pointerType: this.config.pointerType,
			isPrimary: this.config.isPrimary,
			...overrides,
		});
	}

	/**
	 * Create a PointerEvent from type and init
	 */
	createEvent(type: PointerEventType, init: PointerEventInit): PointerEvent {
		return new PointerEvent(type, init);
	}

	/**
	 * Create pointermove event
	 */
	createMoveEvent(position: { x: number; y: number }): PointerEvent {
		const init = this.createBaseInit(position, {
			button: -1,
			buttons: 0,
			pressure: 0,
		});
		return this.createEvent('pointermove', init);
	}

	/**
	 * Create pointerdown event
	 */
	createDownEvent(position: { x: number; y: number }, pressure = 0.5): PointerEvent {
		const init = this.createBaseInit(position, {
			button: 0,
			buttons: 1,
			pressure,
		});
		return this.createEvent('pointerdown', init);
	}

	/**
	 * Create pointerup event
	 */
	createUpEvent(position: { x: number; y: number }): PointerEvent {
		const init = this.createBaseInit(position, {
			button: 0,
			buttons: 0,
			pressure: 0,
		});
		return this.createEvent('pointerup', init);
	}

	/**
	 * Create pointercancel event
	 */
	createCancelEvent(): PointerEvent {
		const init = this.createBaseInit(
			{
				x: this.lastPosition.clientX / this.config.viewportWidth,
				y: this.lastPosition.clientY / this.config.viewportHeight,
			},
			{
				button: 0,
				buttons: 0,
				pressure: 0,
			}
		);
		return this.createEvent('pointercancel', init);
	}

	/**
	 * Convert FSM action to PointerEvent(s)
	 *
	 * @param action - FSM action from state machine
	 * @returns Array of PointerEvents (may be multiple for CLICK)
	 */
	fromFSMAction(action: FSMAction): PointerEvent[] {
		const validated = FSMActionSchema.parse(action);
		const events: PointerEvent[] = [];

		switch (validated.type) {
			case 'MOVE':
				events.push(this.createMoveEvent(validated.position));
				break;

			case 'DOWN':
				events.push(this.createDownEvent(validated.position, validated.pressure ?? 0.5));
				break;

			case 'UP':
				events.push(this.createUpEvent(validated.position));
				break;

			case 'CLICK':
				// Click = down + up in sequence
				events.push(this.createDownEvent(validated.position, validated.pressure ?? 0.5));
				events.push(this.createUpEvent(validated.position));
				break;

			case 'CANCEL':
				events.push(this.createCancelEvent());
				break;

			case 'NONE':
				// No event needed
				break;
		}

		return events;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): Readonly<W3CPointerFactoryConfig> {
		return { ...this.config };
	}

	/**
	 * Update viewport dimensions (e.g., on window resize)
	 */
	setViewport(width: number, height: number): void {
		(this.config as W3CPointerFactoryConfig).viewportWidth = width;
		(this.config as W3CPointerFactoryConfig).viewportHeight = height;
	}
}

// ============================================================================
// DOM EVENT DISPATCHER
// ============================================================================

/**
 * Configuration for DOM event dispatcher
 */
export interface DOMDispatcherConfig {
	/** Target element to dispatch events to */
	target: EventTarget;
	/** Whether to capture the pointer */
	capturePointer: boolean;
	/** Callback when event is dispatched */
	onDispatch?: (event: PointerEvent) => void;
}

/**
 * DOM Event Dispatcher
 *
 * Dispatches W3C PointerEvents to DOM targets.
 * This is Stage 5 - the final step that makes gestures control real elements.
 *
 * @example
 * ```typescript
 * const dispatcher = new DOMEventDispatcher({ target: document.body });
 * dispatcher.dispatch(pointerEvent);
 * ```
 */
export class DOMEventDispatcher {
	private readonly config: DOMDispatcherConfig;
	private capturedPointerId: number | null = null;

	constructor(config: DOMDispatcherConfig) {
		this.config = config;
	}

	/**
	 * Dispatch a PointerEvent to the target
	 */
	dispatch(event: PointerEvent): boolean {
		const dispatched = this.config.target.dispatchEvent(event);

		if (this.config.onDispatch) {
			this.config.onDispatch(event);
		}

		// Handle pointer capture
		if (this.config.capturePointer && event.type === 'pointerdown') {
			this.capturePointer(event.pointerId);
		} else if (event.type === 'pointerup' || event.type === 'pointercancel') {
			this.releasePointer();
		}

		return dispatched;
	}

	/**
	 * Dispatch multiple events in sequence
	 */
	dispatchAll(events: PointerEvent[]): boolean[] {
		return events.map((event) => this.dispatch(event));
	}

	/**
	 * Capture pointer for continuous tracking
	 */
	private capturePointer(pointerId: number): void {
		if (this.config.target instanceof Element) {
			try {
				(this.config.target as Element).setPointerCapture(pointerId);
				this.capturedPointerId = pointerId;
			} catch {
				// Pointer capture may fail silently
			}
		}
	}

	/**
	 * Release captured pointer
	 */
	private releasePointer(): void {
		if (this.capturedPointerId !== null && this.config.target instanceof Element) {
			try {
				(this.config.target as Element).releasePointerCapture(this.capturedPointerId);
			} catch {
				// Release may fail silently
			}
			this.capturedPointerId = null;
		}
	}

	/**
	 * Get current target
	 */
	getTarget(): EventTarget {
		return this.config.target;
	}

	/**
	 * Change target element
	 */
	setTarget(target: EventTarget): void {
		this.releasePointer();
		(this.config as DOMDispatcherConfig).target = target;
	}
}

// ============================================================================
// CURSOR PIPELINE (Integrated Factory + Dispatcher)
// ============================================================================

/**
 * Cursor Pipeline Configuration
 */
export interface CursorPipelineConfig {
	viewportWidth: number;
	viewportHeight: number;
	target: EventTarget;
	pointerId?: number;
	pointerType?: 'mouse' | 'pen' | 'touch';
	capturePointer?: boolean;
	onEvent?: (event: PointerEvent) => void;
}

/**
 * Cursor Pipeline
 *
 * Complete Stage 4+5 integration: FSM Action → PointerEvent → DOM
 *
 * @example
 * ```typescript
 * const pipeline = new CursorPipeline({
 *   viewportWidth: window.innerWidth,
 *   viewportHeight: window.innerHeight,
 *   target: document.getElementById('canvas')!,
 * });
 *
 * // From FSM action to DOM event
 * pipeline.processAction({ type: 'MOVE', position: { x: 0.5, y: 0.5 }, state: 'armed' });
 * ```
 */
export class CursorPipeline {
	private readonly factory: W3CPointerEventFactory;
	private readonly dispatcher: DOMEventDispatcher;

	constructor(config: CursorPipelineConfig) {
		this.factory = new W3CPointerEventFactory({
			viewportWidth: config.viewportWidth,
			viewportHeight: config.viewportHeight,
			pointerId: config.pointerId ?? 1,
			pointerType: config.pointerType ?? 'pen',
			isPrimary: true,
		});

		this.dispatcher = new DOMEventDispatcher({
			target: config.target,
			capturePointer: config.capturePointer ?? false,
			onDispatch: config.onEvent,
		});
	}

	/**
	 * Process FSM action and dispatch to DOM
	 */
	processAction(action: FSMAction): PointerEvent[] {
		const events = this.factory.fromFSMAction(action);
		this.dispatcher.dispatchAll(events);
		return events;
	}

	/**
	 * Update viewport on resize
	 */
	updateViewport(width: number, height: number): void {
		this.factory.setViewport(width, height);
	}

	/**
	 * Change target element
	 */
	setTarget(target: EventTarget): void {
		this.dispatcher.setTarget(target);
	}

	/**
	 * Get factory for direct access
	 */
	getFactory(): W3CPointerEventFactory {
		return this.factory;
	}

	/**
	 * Get dispatcher for direct access
	 */
	getDispatcher(): DOMEventDispatcher {
		return this.dispatcher;
	}
}
