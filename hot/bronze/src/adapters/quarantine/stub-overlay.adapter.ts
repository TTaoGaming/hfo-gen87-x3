import type { OverlayPort } from '../../contracts/ports.js';
import type { OverlayConfig } from '../../contracts/schemas.js';

/**
 * NullOverlayAdapter - Placeholder until Canvas2D/Pixi overlay implemented
 * QUARANTINED: This is a null implementation and should not be in production src.
 */
export class NullOverlayAdapter implements OverlayPort {
	private config: OverlayConfig | null = null;
	private container: HTMLElement | null = null;

	async initialize(container: HTMLElement): Promise<void> {
		this.container = container;
	}

	setCursor(
		_raw: { x: number; y: number } | null,
		_smoothed: { x: number; y: number } | null,
		_predicted: { x: number; y: number } | null,
		_state: import('../../contracts/schemas.js').CursorState,
	): void {
		// Stub - no-op
	}

	setLandmarks(_landmarks: import('../../contracts/schemas.js').NormalizedLandmark[] | null): void {
		// Stub - no-op
	}

	setVisible(_visible: boolean): void {
		// Stub - no-op
	}

	setConfig(config: Partial<OverlayConfig>): void {
		this.config = { ...this.config, ...config } as OverlayConfig;
	}

	getBounds(): { width: number; height: number } {
		if (this.container) {
			return {
				width: this.container.clientWidth,
				height: this.container.clientHeight,
			};
		}
		return { width: 0, height: 0 };
	}

	dispose(): void {
		this.container = null;
		this.config = null;
	}
}
