/**
 * @fileoverview daedalOS Target Adapter
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 * Port 2 (Mirror Magus/SHAPE) + Port 5 (Pyre Praetorian/DEFEND)
 *
 * PURPOSE: Inject synthetic PointerEvents into daedalOS windows
 * POLYMORPHISM: Implements AdapterPort - swappable with DOM/Puter adapters
 *
 * ARCHITECTURE INSIGHT (from GitHub source analysis):
 * - daedalOS uses react-rnd for window management
 * - react-rnd handles standard DOM PointerEvents
 * - Windows are in componentWindow elements
 * - dispatchEvent(PointerEvent) propagates through react-rnd
 *
 * Source: https://github.com/DustinBrett/daedalOS
 * Validated: contexts/process/useProcessContextState.ts uses standard React state
 * Validated: RndWindow uses react-rnd which handles pointerdown/pointermove/pointerup
 *
 * @module adapters/daedalos-target.adapter
 * @hive V (Validate)
 * @tdd GREEN
 */
// @ts-nocheck


import type { AdapterPort } from '../contracts/ports.js';
import type { AdapterTarget, PointerEventOut } from '../contracts/schemas.js';

// ============================================================================
// DAEDALOS TYPE DEFINITIONS
// ============================================================================

/**
 * daedalOS window element - the componentWindow from useProcesses
 */
export interface DaedalOSWindow {
	/** DOM element containing the window */
	element: HTMLElement;
	/** Window identifier (process ID) */
	id: string;
	/** Window title */
	title: string;
	/** Whether window is minimized */
	minimized: boolean;
	/** Whether window is maximized */
	maximized: boolean;
}

/**
 * daedalOS environment detection result
 */
export interface DaedalOSEnvironment {
	/** Whether we're running inside daedalOS */
	detected: boolean;
	/** daedalOS version if detected */
	version?: string;
	/** Desktop element if found */
	desktop?: HTMLElement;
	/** All visible windows */
	windows: DaedalOSWindow[];
}

// ============================================================================
// ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * DaedalOS Target Adapter
 *
 * Injects synthetic PointerEvents into daedalOS windows using standard DOM APIs.
 * Works because daedalOS uses react-rnd which handles standard PointerEvents.
 *
 * @implements {AdapterPort}
 */
export class DaedalOSTargetAdapter implements AdapterPort {
	private _hasCapture = false;
	private _capturedElement: HTMLElement | null = null;
	private _pointerId = 1;
	private _environment: DaedalOSEnvironment | null = null;
	private _lastTarget: HTMLElement | null = null;

	/**
	 * Create a new DaedalOS adapter
	 * @param rootElement - Root element to search for windows (default: document.body)
	 */
	constructor(private readonly rootElement: HTMLElement = document.body) {}

	// ========================================================================
	// Environment Detection
	// ========================================================================

	/**
	 * Detect if we're running in a daedalOS environment
	 * Looks for characteristic DOM structure and CSS classes
	 */
	detectEnvironment(): DaedalOSEnvironment {
		// Check for daedalOS desktop element
		const desktop =
			this.rootElement.querySelector<HTMLElement>('[class*="StyledDesktop"]') ||
			this.rootElement.querySelector<HTMLElement>('.desktop') ||
			this.rootElement.querySelector<HTMLElement>('[data-testid="desktop"]');

		// Check for daedalOS windows (react-rnd elements)
		const windowElements = Array.from(
			this.rootElement.querySelectorAll<HTMLElement>(
				'.rnd-window, [class*="StyledWindow"], [class*="RndWindow"]',
			),
		);

		// Also check for section elements with window-like structure
		const sectionWindows = Array.from(
			this.rootElement.querySelectorAll<HTMLElement>('section[style*="transform"]'),
		);

		const allWindows = [...windowElements, ...sectionWindows];

		// Map to DaedalOSWindow objects
		const windows: DaedalOSWindow[] = allWindows.map((el, index) => ({
			element: el,
			id: el.getAttribute('data-id') || `window-${index}`,
			title: el.querySelector<HTMLElement>('[class*="title"]')?.textContent || `Window ${index}`,
			minimized: el.style.display === 'none' || el.classList.contains('minimized'),
			maximized: el.classList.contains('maximized'),
		}));

		// Check for version in meta tags or window object
		const version =
			document.querySelector<HTMLMetaElement>('meta[name="daedalos-version"]')?.content ||
			(window as unknown as { DAEDALOS_VERSION?: string }).DAEDALOS_VERSION;

		this._environment = {
			detected: desktop !== null || windows.length > 0,
			version,
			desktop: desktop || undefined,
			windows,
		};

		return this._environment;
	}

	/**
	 * Get the detected environment (cached)
	 */
	get environment(): DaedalOSEnvironment {
		if (!this._environment) {
			return this.detectEnvironment();
		}
		return this._environment;
	}

	/**
	 * Refresh environment detection
	 */
	refresh(): DaedalOSEnvironment {
		this._environment = null;
		return this.detectEnvironment();
	}

	// ========================================================================
	// AdapterPort Implementation
	// ========================================================================

	/**
	 * Inject a pointer event into daedalOS
	 *
	 * Uses elementFromPoint to find the target element at the cursor position,
	 * then dispatches a synthetic PointerEvent to it.
	 *
	 * @param event - PointerEventOut descriptor
	 * @returns true if successfully dispatched
	 */
	inject(event: PointerEventOut): boolean {
		const { type, clientX, clientY, pointerId, pressure, button, buttons } = event;

		// Find target element at cursor position
		const target = this._hasCapture
			? this._capturedElement
			: document.elementFromPoint(clientX, clientY);

		if (!target) {
			return false;
		}

		// Get the view from the target's document (required for jsdom compatibility)
		const view = target.ownerDocument?.defaultView ?? window;

		// Create synthetic PointerEvent
		const pointerEvent = new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			clientX,
			clientY,
			screenX: clientX + (view.screenX ?? 0),
			screenY: clientY + (view.screenY ?? 0),
			pointerId: pointerId || this._pointerId,
			pointerType: 'pen', // Use 'pen' to distinguish from real mouse
			pressure: pressure ?? (type === 'pointerdown' || type === 'pointermove' ? 0.5 : 0),
			button: button ?? 0,
			buttons: buttons ?? (type === 'pointerdown' ? 1 : type === 'pointerup' ? 0 : 1),
			isPrimary: true,
			width: 1,
			height: 1,
			tiltX: 0,
			tiltY: 0,
			twist: 0,
			view,
		});

		// Track last target for debugging
		this._lastTarget = target as HTMLElement;

		// Dispatch the event
		const dispatched = target.dispatchEvent(pointerEvent);

		// Also dispatch corresponding mouse event for compatibility
		// (some libraries only listen for mouse events)
		const mouseType = type.replace('pointer', 'mouse') as
			| 'mousedown'
			| 'mouseup'
			| 'mousemove'
			| 'mouseenter'
			| 'mouseleave';

		if (['mousedown', 'mouseup', 'mousemove'].includes(mouseType)) {
			const mouseEvent = new MouseEvent(mouseType, {
				bubbles: true,
				cancelable: true,
				clientX,
				clientY,
				screenX: clientX + (view.screenX ?? 0),
				screenY: clientY + (view.screenY ?? 0),
				button: button ?? 0,
				buttons: buttons ?? (type === 'pointerdown' ? 1 : type === 'pointerup' ? 0 : 1),
				view,
			});
			target.dispatchEvent(mouseEvent);
		}

		return dispatched;
	}

	/**
	 * Get current target bounds
	 *
	 * Returns the bounds of the root element (usually viewport)
	 */
	getBounds(): AdapterTarget['bounds'] {
		const rect = this.rootElement.getBoundingClientRect();
		return {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		};
	}

	/**
	 * Set pointer capture on target element
	 *
	 * When capture is set, all events go to the captured element
	 * regardless of cursor position
	 */
	setCapture(): void {
		if (this._lastTarget && 'setPointerCapture' in this._lastTarget) {
			try {
				this._lastTarget.setPointerCapture(this._pointerId);
				this._capturedElement = this._lastTarget;
				this._hasCapture = true;
			} catch {
				// Element may not support pointer capture
				this._hasCapture = false;
			}
		}
	}

	/**
	 * Release pointer capture
	 */
	releaseCapture(): void {
		if (this._capturedElement && 'releasePointerCapture' in this._capturedElement) {
			try {
				this._capturedElement.releasePointerCapture(this._pointerId);
			} catch {
				// Ignore if already released
			}
		}
		this._capturedElement = null;
		this._hasCapture = false;
	}

	/**
	 * Check if target has pointer capture
	 */
	hasCapture(): boolean {
		return this._hasCapture;
	}

	// ========================================================================
	// daedalOS-Specific Methods
	// ========================================================================

	/**
	 * Get the window at a given position
	 */
	getWindowAt(x: number, y: number): DaedalOSWindow | null {
		const env = this.environment;

		for (const win of env.windows) {
			const rect = win.element.getBoundingClientRect();
			if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
				return win;
			}
		}
		return null;
	}

	/**
	 * Focus a specific window by ID
	 */
	focusWindow(windowId: string): boolean {
		const env = this.environment;
		const win = env.windows.find((w) => w.id === windowId);

		if (win) {
			// Dispatch pointerdown to focus
			const rect = win.element.getBoundingClientRect();
			return this.inject({
				type: 'pointerdown',
				clientX: rect.x + rect.width / 2,
				clientY: rect.y + 10, // Click on titlebar
				pointerId: this._pointerId,
				pressure: 0.5,
				button: 0,
				buttons: 1,
			});
		}
		return false;
	}

	/**
	 * Get the last element that received an event
	 */
	get lastTarget(): HTMLElement | null {
		return this._lastTarget;
	}

	/**
	 * Get pointer ID being used
	 */
	get pointerId(): number {
		return this._pointerId;
	}

	/**
	 * Set pointer ID (useful for multi-touch simulation)
	 */
	set pointerId(id: number) {
		this._pointerId = id;
	}
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a daedalOS adapter for the current page
 *
 * @param root - Root element to search for windows (default: document.body)
 * @returns Configured adapter
 */
export function createDaedalOSAdapter(root?: HTMLElement): DaedalOSTargetAdapter {
	return new DaedalOSTargetAdapter(root || document.body);
}

// ============================================================================
// INJECTION SCRIPT GENERATOR
// ============================================================================

/**
 * Generate a bookmarklet-friendly injection script
 *
 * This creates a self-contained script that can be injected into
 * any daedalOS page to enable gesture control.
 */
export function generateInjectionScript(): string {
	return `
(function() {
  // Virtual cursor state
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let isDown = false;
  
  // Create cursor element
  const cursor = document.createElement('div');
  cursor.id = 'gesture-cursor';
  cursor.style.cssText = \`
    position: fixed;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 150, 255, 0.5);
    border: 2px solid #0096ff;
    pointer-events: none;
    z-index: 999999;
    transform: translate(-50%, -50%);
    transition: background 0.1s, transform 0.1s;
  \`;
  document.body.appendChild(cursor);
  
  // Dispatch synthetic pointer event
  function dispatch(type) {
    const target = document.elementFromPoint(cursorX, cursorY);
    if (!target) return;
    
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: cursorX,
      clientY: cursorY,
      pointerId: 1,
      pointerType: 'pen',
      pressure: isDown ? 0.5 : 0,
      button: 0,
      buttons: isDown ? 1 : 0,
      isPrimary: true
    }));
    
    // Also dispatch mouse event for compatibility
    const mouseType = type.replace('pointer', 'mouse');
    if (['mousedown', 'mouseup', 'mousemove'].includes(mouseType)) {
      target.dispatchEvent(new MouseEvent(mouseType, {
        bubbles: true,
        cancelable: true,
        clientX: cursorX,
        clientY: cursorY,
        button: 0,
        buttons: isDown ? 1 : 0
      }));
    }
  }
  
  // Update cursor position
  function moveTo(x, y) {
    cursorX = Math.max(0, Math.min(window.innerWidth, x));
    cursorY = Math.max(0, Math.min(window.innerHeight, y));
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    dispatch('pointermove');
  }
  
  // Mouse down
  function down() {
    isDown = true;
    cursor.style.background = 'rgba(255, 100, 0, 0.7)';
    cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
    dispatch('pointerdown');
  }
  
  // Mouse up
  function up() {
    if (isDown) {
      isDown = false;
      cursor.style.background = 'rgba(0, 150, 255, 0.5)';
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      dispatch('pointerup');
    }
  }
  
  // Expose global API
  window.gestureControl = { moveTo, down, up, cursor };
  
  console.log('[Gesture Control] Injected! Use window.gestureControl.moveTo(x,y), .down(), .up()');
})();
`.trim();
}
