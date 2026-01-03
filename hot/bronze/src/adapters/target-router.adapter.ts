/**
 * DOM Target Router Adapter
 *
 * Gen87.X3 | Port 6 (TARGET) | Implements TargetRouterPort
 *
 * Determines which UI element or service should receive the gesture event.
 * Supports DOM elements and Golden Layout components.
 */
import type { TargetRouterPort } from '../contracts/ports-extended.js';
import type { TargetDefinition } from '../contracts/schemas-extended.js';

export class DOMTargetRouterAdapter implements TargetRouterPort {
	private targets = new Map<string, TargetDefinition>();

	/**
	 * Register a potential target
	 */
	registerTarget(target: TargetDefinition): void {
		this.targets.set(target.id, target);
	}

	/**
	 * Unregister a target
	 */
	unregisterTarget(id: string): void {
		this.targets.delete(id);
	}

	/**
	 * Find the best target for a given coordinate
	 * Uses document.elementFromPoint to find the DOM element
	 */
	findTarget(x: number, y: number): TargetDefinition | null {
		// Convert normalized 0-1 to pixel coordinates
		const px = x * window.innerWidth;
		const py = y * window.innerHeight;

		const element = document.elementFromPoint(px, py);
		if (!element) return null;

		// Find the closest registered target
		// In a real OS, we'd check if the element is inside a Golden Layout panel
		for (const target of this.targets.values()) {
			if (target.type === 'dom' && target.selector) {
				const targetEl = document.querySelector(target.selector);
				if (targetEl?.contains(element)) {
					return target;
				}
			}
		}

		return null;
	}

	/**
	 * Route an event to a target
	 */
	async route(event: any, target: TargetDefinition): Promise<void> {
		if (target.type === 'dom' && target.selector) {
			const element = document.querySelector(target.selector);
			if (element) {
				// Dispatch a real DOM event
				const domEvent = new CustomEvent('hfo-pointer', { detail: event });
				element.dispatchEvent(domEvent);
			}
		} else if (target.type === 'nats') {
			// In a real system, we'd publish to NATS here
		}
	}
}
