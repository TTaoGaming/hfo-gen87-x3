import { configureGlobal } from 'fast-check';
import { vi } from 'vitest';
import { RED_REGNANT_PROPERTY_RUNS } from './hot/bronze/quarantine/shared/test-budget.js';

// Enforce Red Regnant Performance Budget globally for property-based tests
configureGlobal({ numRuns: RED_REGNANT_PROPERTY_RUNS });

// Polyfill ResizeObserver for GoldenLayout tests
class ResizeObserverMock {
	private callback: ResizeObserverCallback;

	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
	}

	observe(element: HTMLElement) {
		// Trigger callback in next tick to simulate async behavior
		// Use non-zero dimensions to ensure GoldenLayout renders
		setTimeout(() => {
			this.callback(
				[
					{
						target: element,
						contentRect: {
							width: 1024,
							height: 768,
							top: 0,
							left: 0,
							right: 1024,
							bottom: 768,
							x: 0,
							y: 0,
							toJSON: () => ({}),
						},
						borderBoxSize: [],
						contentBoxSize: [],
						devicePixelContentBoxSize: [],
					},
				],
				this as unknown as ResizeObserver,
			);
		}, 0);
	}

	unobserve() {}
	disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
