import type { AdapterPort } from '../../contracts/ports.js';
import type { AdapterTarget, PointerEventOut } from '../../contracts/schemas.js';

/**
 * Mock adapter for testing - implements same interface for test doubles
 * QUARANTINED: This is for testing only and should not be in production.
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

	getEvents(): PointerEventOut[] {
		return this.events;
	}

	clearEvents(): void {
		this.events = [];
	}
}
