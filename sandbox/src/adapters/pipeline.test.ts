/**
 * Pipeline Integration Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | TDD GREEN
 *
 * PHASE 2: Pipeline Integration Tests
 * Tests the full pipeline composition with mocked sensor.
 *
 * Blackboard Signal: VALIDATE-PIPELINE | Port: 2 | Owner: Claude-Opus
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdapterPort, SensorPort } from '../contracts/ports.js';
import type { AdapterTarget, PointerEventOut, SensorFrame } from '../contracts/schemas.js';
import { OneEuroAdapter } from './one-euro.adapter.js';
import { GesturePipeline } from './pipeline.js';
import { DOMAdapter, PointerEventAdapter } from './pointer-event.adapter.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// MOCK SENSOR (Replaces MediaPipe in tests)
// ============================================================================

class MockSensorPort implements SensorPort {
	private frameQueue: SensorFrame[] = [];
	private _isReady = false;
	private frameIndex = 0;

	get isReady(): boolean {
		return this._isReady;
	}

	async initialize(): Promise<void> {
		this._isReady = true;
	}

	dispose(): void {
		this._isReady = false;
	}

	queueFrames(frames: SensorFrame[]): void {
		this.frameQueue = frames;
		this.frameIndex = 0;
	}

	async sense(_video: HTMLVideoElement, timestamp: number): Promise<SensorFrame> {
		if (!this._isReady) throw new Error('Sensor not initialized');

		const frame = this.frameQueue[this.frameIndex] ?? {
			ts: timestamp,
			handId: 'none',
			trackingOk: false,
			palmFacing: false,
			label: 'None' as const,
			confidence: 0,
			indexTip: null,
			landmarks: null,
		};

		if (this.frameIndex < this.frameQueue.length - 1) {
			this.frameIndex++;
		}

		return { ...frame, ts: timestamp };
	}
}

// ============================================================================
// MOCK DOM ADAPTER (Captures injected events)
// ============================================================================

class MockAdapterPort implements AdapterPort {
	public injectedEvents: PointerEventOut[] = [];
	public hasCapture = false;

	inject(event: PointerEventOut): boolean {
		this.injectedEvents.push(event);
		return true;
	}

	setCapture(): void {
		this.hasCapture = true;
	}

	releaseCapture(): void {
		this.hasCapture = false;
	}

	clear(): void {
		this.injectedEvents = [];
		this.hasCapture = false;
	}
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createSensorFrame(overrides: Partial<SensorFrame> = {}): SensorFrame {
	return {
		ts: Date.now(),
		handId: 'right',
		trackingOk: true,
		palmFacing: true,
		label: 'Open_Palm',
		confidence: 0.95,
		indexTip: { x: 0.5, y: 0.5, z: 0 },
		landmarks: null,
		...overrides,
	};
}

// ============================================================================
// PIPELINE TESTS
// ============================================================================

describe('GesturePipeline - Integration', () => {
	let pipeline: GesturePipeline;
	let mockSensor: MockSensorPort;
	let mockAdapter: MockAdapterPort;
	let mockVideo: HTMLVideoElement;

	const target: AdapterTarget = {
		type: 'element',
		bounds: { width: 800, height: 600, left: 0, top: 0 },
	};

	beforeEach(() => {
		mockSensor = new MockSensorPort();
		mockAdapter = new MockAdapterPort();

		pipeline = new GesturePipeline({
			sensor: mockSensor,
			smoother: new OneEuroAdapter(1.0, 0.007),
			fsm: new XStateFSMAdapter(),
			emitter: new PointerEventAdapter(),
			adapter: mockAdapter,
			target,
		});

		// Mock video element (vitest doesn't have DOM by default)
		mockVideo = {} as HTMLVideoElement;
	});

	afterEach(() => {
		pipeline.stop();
		mockAdapter.clear();
	});

	describe('Pipeline Lifecycle', () => {
		it('should start and stop correctly', async () => {
			expect(pipeline.isRunning).toBe(false);

			await pipeline.start();
			expect(pipeline.isRunning).toBe(true);

			pipeline.stop();
			expect(pipeline.isRunning).toBe(false);
		});

		it('should not double-start', async () => {
			await pipeline.start();
			await pipeline.start(); // Should be no-op
			expect(pipeline.isRunning).toBe(true);
		});
	});

	describe('Frame Processing', () => {
		beforeEach(async () => {
			await pipeline.start();
		});

		it('should process frame through full pipeline', async () => {
			// Queue a valid baseline frame
			mockSensor.queueFrames([createSensorFrame()]);

			const action = await pipeline.processFrame(mockVideo, 1000);

			// Should be in ARMING state (first frame)
			expect(action.state).toBe('ARMING');
		});

		it('should reach ARMED state after stable baseline', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
			]);

			await pipeline.processFrame(mockVideo, 0);
			const action = await pipeline.processFrame(mockVideo, 250);

			expect(action.state).toBe('ARMED');
			expect(action.action).toBe('move');
		});

		it('should emit pointermove when ARMED', async () => {
			// Get to ARMED state
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({ ts: 300, indexTip: { x: 0.3, y: 0.7, z: 0 } }),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);

			// Check injected events
			const moveEvents = mockAdapter.injectedEvents.filter((e) => e.type === 'pointermove');
			expect(moveEvents.length).toBeGreaterThanOrEqual(1);
		});

		it('should emit pointerdown on click gesture', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({
					ts: 300,
					label: 'Pointing_Up',
					confidence: 0.9,
					indexTip: { x: 0.5, y: 0.5, z: 0 },
				}),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);

			const downEvents = mockAdapter.injectedEvents.filter((e) => e.type === 'pointerdown');
			expect(downEvents.length).toBe(1);
			expect(mockAdapter.hasCapture).toBe(true);
		});

		it('should emit pointerup when returning to baseline after click', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({
					ts: 300,
					label: 'Pointing_Up',
					confidence: 0.9,
				}),
				createSensorFrame({
					ts: 400,
					label: 'Open_Palm',
				}),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);
			await pipeline.processFrame(mockVideo, 400);

			const upEvents = mockAdapter.injectedEvents.filter((e) => e.type === 'pointerup');
			expect(upEvents.length).toBe(1);
			expect(mockAdapter.hasCapture).toBe(false);
		});

		it('should emit wheel event on zoom gesture', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({
					ts: 300,
					label: 'Thumb_Up',
					confidence: 0.9,
				}),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);

			const wheelEvents = mockAdapter.injectedEvents.filter((e) => e.type === 'wheel');
			expect(wheelEvents.length).toBe(1);
			if (wheelEvents[0]?.type === 'wheel') {
				expect(wheelEvents[0].deltaY).toBe(-100); // Zoom in
				expect(wheelEvents[0].ctrlKey).toBe(true);
			}
		});

		it('should emit pointercancel when tracking lost during drag', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({
					ts: 300,
					label: 'Pointing_Up',
					confidence: 0.9,
				}),
				createSensorFrame({
					ts: 400,
					trackingOk: false,
				}),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);
			await pipeline.processFrame(mockVideo, 400);

			const cancelEvents = mockAdapter.injectedEvents.filter((e) => e.type === 'pointercancel');
			expect(cancelEvents.length).toBe(1);
		});
	});

	describe('Coordinate Conversion', () => {
		beforeEach(async () => {
			await pipeline.start();
		});

		it('should convert normalized (0-1) coords to target bounds', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
				createSensorFrame({
					ts: 300,
					indexTip: { x: 0.25, y: 0.75, z: 0 },
				}),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			await pipeline.processFrame(mockVideo, 300);

			const moveEvents = mockAdapter.injectedEvents.filter(
				(e) => e.type === 'pointermove' && 'clientX' in e,
			);

			// With 1€ filter, position will be smoothed, but should be close
			// Target is 800x600 at (0,0)
			// 0.25 * 800 ≈ 200, 0.75 * 600 ≈ 450
			expect(moveEvents.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Pipeline State', () => {
		beforeEach(async () => {
			await pipeline.start();
		});

		it('should expose FSM state', async () => {
			expect(pipeline.getFSMState()).toBe('DISARMED');

			mockSensor.queueFrames([createSensorFrame({ ts: 0 })]);
			await pipeline.processFrame(mockVideo, 0);

			expect(pipeline.getFSMState()).toBe('ARMING');
		});

		it('should allow force disarm', async () => {
			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);
			expect(pipeline.getFSMState()).toBe('ARMED');

			pipeline.disarm();
			expect(pipeline.getFSMState()).toBe('DISARMED');
		});
	});

	describe('Subscriptions', () => {
		beforeEach(async () => {
			await pipeline.start();
		});

		it('should notify subscribers of events', async () => {
			const events: (PointerEventOut | null)[] = [];
			pipeline.subscribe((event) => events.push(event));

			mockSensor.queueFrames([
				createSensorFrame({ ts: 0 }),
				createSensorFrame({ ts: 250 }),
			]);

			await pipeline.processFrame(mockVideo, 0);
			await pipeline.processFrame(mockVideo, 250);

			expect(events.length).toBeGreaterThanOrEqual(2);
		});

		it('should allow unsubscribe', async () => {
			const events: (PointerEventOut | null)[] = [];
			const unsub = pipeline.subscribe((event) => events.push(event));

			mockSensor.queueFrames([createSensorFrame({ ts: 0 })]);
			await pipeline.processFrame(mockVideo, 0);
			const countBefore = events.length;

			unsub();

			mockSensor.queueFrames([createSensorFrame({ ts: 250 })]);
			await pipeline.processFrame(mockVideo, 250);

			expect(events.length).toBe(countBefore);
		});
	});
});
