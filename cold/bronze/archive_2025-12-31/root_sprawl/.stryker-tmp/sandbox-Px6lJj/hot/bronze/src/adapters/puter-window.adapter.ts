/**
 * @fileoverview Puter.js Window Adapter
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 * Port 2 (Mirror Magus/SHAPE) + Port 5 (Pyre Praetorian/DEFEND)
 *
 * PURPOSE: Enable gesture control plane to target Puter.js windows
 * POLYMORPHISM: Implements AdapterPort - swappable with DOM/Canvas/Iframe adapters
 *
 * Tavily Source: https://docs.puter.com/UI/createWindow
 *
 * @module adapters/puter-window.adapter
 * @hive V (Validate)
 * @tdd GREEN
 */
// @ts-nocheck


import type { AdapterPort } from '../contracts/ports.js';
import type { AdapterTarget, PointerEventOut } from '../contracts/schemas.js';

// ============================================================================
// PUTER.JS TYPE DEFINITIONS
// ============================================================================

/**
 * Puter.js window options
 */
export interface PuterWindowOptions {
	title?: string;
	content?: string;
	width?: number;
	height?: number;
	x?: number;
	y?: number;
	is_resizable?: boolean;
	has_head?: boolean;
	center?: boolean;
	show_in_taskbar?: boolean;
	disable_parent_window?: boolean;
}

/**
 * Puter.js window instance
 */
export interface PuterWindow {
	id: string;
	setTitle(title: string): void;
	setSize(width: number, height: number): void;
	setPosition(x: number, y: number): void;
	close(): void;
	focus(): void;
	minimize(): void;
	maximize(): void;
	restore(): void;
	on(event: string, handler: (e: unknown) => void): void;
	off(event: string, handler?: (e: unknown) => void): void;
	getContentElement(): HTMLElement | null;
}

/**
 * Puter.js UI API
 */
export interface PuterUI {
	createWindow(options?: PuterWindowOptions): Promise<PuterWindow>;
	setWindowTitle(title: string): void;
	setWindowSize(width: number, height: number): void;
	setWindowPosition(x: number, y: number): void;
}

/**
 * Global puter object
 */
export interface PuterGlobal {
	ui: PuterUI;
}

// ============================================================================
// EXTENDED PORT INTERFACE
// ============================================================================

/**
 * Extended AdapterPort for Puter.js windows
 * Adds window-specific functionality on top of base inject()
 */
export interface PuterWindowAdapterPort extends AdapterPort {
	/** Create a Puter window with gesture tracking enabled */
	createWindow(options: PuterWindowOptions): Promise<string>;

	/** Get the content element of a window (for event injection) */
	getWindowContent(windowId: string): HTMLElement | null;

	/** Focus a window */
	focusWindow(windowId: string): void;

	/** Close a window */
	closeWindow(windowId: string): void;

	/** Get all managed window IDs */
	getWindowIds(): string[];

	/** Set active window (pointer events go here) */
	setActiveWindow(windowId: string): void;

	/** Get active window ID */
	getActiveWindowId(): string | null;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * PuterWindowAdapter - Implements PuterWindowAdapterPort
 *
 * POLYMORPHISM PROOF:
 * - Implements AdapterPort.inject() - same as DOMAdapter, CanvasAdapter
 * - Pipeline doesn't care if target is Puter, DOM, or iframe
 * - Same PointerEventOut schema used everywhere
 */
export class PuterWindowAdapter implements PuterWindowAdapterPort {
	private windows = new Map<string, PuterWindow>();
	private activeWindowId: string | null = null;
	private _hasCapture = false;

	constructor(private puter: PuterGlobal) {}

	// ========================================================================
	// AdapterPort interface (base methods)
	// ========================================================================

	/**
	 * Inject a pointer event into the active Puter window
	 * @param event - PointerEventOut descriptor
	 * @returns true if successfully dispatched
	 */
	inject(event: PointerEventOut): boolean {
		if (!this.activeWindowId) {
			return false;
		}

		const window = this.windows.get(this.activeWindowId);
		if (!window) {
			return false;
		}

		const element = window.getContentElement();
		if (!element) {
			return false;
		}

		const domEvent = this.createDOMEvent(event);
		if (!domEvent) {
			return false;
		}

		return element.dispatchEvent(domEvent);
	}

	/**
	 * Get current target bounds (active window)
	 */
	getBounds(): AdapterTarget['bounds'] {
		if (!this.activeWindowId) {
			return { left: 0, top: 0, width: 0, height: 0 };
		}

		const window = this.windows.get(this.activeWindowId);
		const element = window?.getContentElement();

		if (!element) {
			return { left: 0, top: 0, width: 0, height: 0 };
		}

		// First try getBoundingClientRect (works in real browser)
		const rect = element.getBoundingClientRect();
		if (rect.width > 0 || rect.height > 0) {
			return {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height,
			};
		}

		// Fallback for jsdom/testing (parse style)
		const style = element.style;
		const width = Number.parseInt(style.width, 10) || element.clientWidth || 0;
		const height = Number.parseInt(style.height, 10) || element.clientHeight || 0;
		const left = Number.parseInt(style.left, 10) || 0;
		const top = Number.parseInt(style.top, 10) || 0;

		return { left, top, width, height };
	}

	/**
	 * Set pointer capture on active window element
	 */
	setCapture(): void {
		if (!this.activeWindowId) return;

		const window = this.windows.get(this.activeWindowId);
		const element = window?.getContentElement();

		if (element && 'setPointerCapture' in element) {
			try {
				// Use default pointerId (1)
				(element as HTMLElement).setPointerCapture(1);
				this._hasCapture = true;
			} catch {
				// Capture may fail if not in gesture
			}
		}
	}

	/**
	 * Release pointer capture
	 */
	releaseCapture(): void {
		if (!this.activeWindowId) return;

		const window = this.windows.get(this.activeWindowId);
		const element = window?.getContentElement();

		if (element && 'releasePointerCapture' in element) {
			try {
				(element as HTMLElement).releasePointerCapture(1);
			} catch {
				// Release may fail if not captured
			}
		}
		this._hasCapture = false;
	}

	/**
	 * Check if target has pointer capture
	 */
	hasCapture(): boolean {
		return this._hasCapture;
	}

	// ========================================================================
	// PuterWindowAdapterPort extensions
	// ========================================================================

	/**
	 * Create a Puter window with gesture tracking enabled
	 */
	async createWindow(options: PuterWindowOptions): Promise<string> {
		const window = await this.puter.ui.createWindow(options);
		this.windows.set(window.id, window);

		// Auto-focus if first window
		if (this.windows.size === 1) {
			this.activeWindowId = window.id;
		}

		return window.id;
	}

	/**
	 * Get the content element of a window (for event injection)
	 */
	getWindowContent(windowId: string): HTMLElement | null {
		const window = this.windows.get(windowId);
		return window?.getContentElement() ?? null;
	}

	/**
	 * Focus a window
	 */
	focusWindow(windowId: string): void {
		const window = this.windows.get(windowId);
		window?.focus();
	}

	/**
	 * Close a window and remove from tracking
	 */
	closeWindow(windowId: string): void {
		const window = this.windows.get(windowId);
		if (window) {
			window.close();
			this.windows.delete(windowId);

			// Clear active if closed
			if (this.activeWindowId === windowId) {
				this.activeWindowId = null;
			}
		}
	}

	/**
	 * Get all managed window IDs
	 */
	getWindowIds(): string[] {
		return Array.from(this.windows.keys());
	}

	/**
	 * Set active window (pointer events go here)
	 */
	setActiveWindow(windowId: string): void {
		if (this.windows.has(windowId)) {
			this.activeWindowId = windowId;
		}
	}

	/**
	 * Get active window ID
	 */
	getActiveWindowId(): string | null {
		return this.activeWindowId;
	}

	// ========================================================================
	// Private helpers
	// ========================================================================

	/**
	 * Convert PointerEventOut to DOM Event
	 * SAME LOGIC as DOMAdapter - proving polymorphism
	 */
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

		if (event.type === 'pointercancel') {
			return new PointerEvent('pointercancel', {
				bubbles: true,
				cancelable: true,
				pointerId: event.pointerId,
				pointerType: event.pointerType,
			});
		}

		// Regular pointer events
		return new PointerEvent(event.type, {
			bubbles: true,
			cancelable: true,
			pointerId: event.pointerId,
			clientX: event.clientX,
			clientY: event.clientY,
			pointerType: event.pointerType,
			button: 'button' in event ? event.button : 0,
			buttons: 'buttons' in event ? event.buttons : 0,
			pressure: 'pressure' in event ? event.pressure : 0.5,
			isPrimary: 'isPrimary' in event ? event.isPrimary : true,
		});
	}
}
