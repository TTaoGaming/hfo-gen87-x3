/**
 * GesturePipeline Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Port 1 (FUSE)
 *
 * PRINCIPLE: Verify the 7-stage pipeline wiring and Zod validation.
 *
 * 7-stage pipeline logic:
 * - Stage 0: SENSOR (MediaPipe)
 * - Stage 1: SMOOTH (1€ Filter)
 * - Stage 2: FSM (XState)
 * - Stage 3: PREDICT (DESP) - Optional but should be supported.
 * - Stage 5: EMIT (W3C Pointer)
 * - Stage 6: TARGET (Dispatch)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	AdapterPort,
	EmitterPort,
	FSMPort,
	PipelinePort,
	SensorPort,
	SmootherPort,
} from '../contracts/ports.js';
import { SmoothedFrameSchema } from '../contracts/schemas.js';

// @ts-ignore - GesturePipeline does not exist yet (intentional failure)
import { GesturePipeline } from './gesture-pipeline.js';

describe('GesturePipeline', () => {
	let sensor: SensorPort;
	let smoother: SmootherPort;
	let fsm: FSMPort;
	let emitter: EmitterPort;
	let adapter: AdapterPort;
	let pipeline: PipelinePort;

	beforeEach(() => {
		// Mock dependencies
		sensor = {
			initialize: vi.fn().mockResolvedValue(undefined),
			sense: vi.fn(),
			dispose: vi.fn(),
			isReady: true,
		} as unknown as SensorPort;

		smoother = {
			smooth: vi.fn(),
			reset: vi.fn(),
			setParams: vi.fn(),
		} as unknown as SmootherPort;

		fsm = {
			process: vi.fn(),
			getState: vi.fn().mockReturnValue('IDLE'),
			disarm: vi.fn(),
			subscribe: vi.fn(),
		} as unknown as FSMPort;

		emitter = {
			emit: vi.fn(),
			pointerId: 1,
		} as unknown as EmitterPort;

		adapter = {
			inject: vi.fn().mockReturnValue(true),
			getBounds: vi.fn().mockReturnValue({ x: 0, y: 0, width: 1920, height: 1080 }),
			setCapture: vi.fn(),
			releaseCapture: vi.fn(),
			hasCapture: vi.fn().mockReturnValue(false),
		} as unknown as AdapterPort;

		// Instantiate pipeline
		// @ts-ignore
		pipeline = new GesturePipeline({
			sensor,
			smoother,
			fsm,
			emitter,
			adapter,
		});
	});

	it('should correctly wire the 7-stage pipeline logic', async () => {
		const mockVideo = {} as HTMLVideoElement;
		const timestamp = 1000;

		// Stage 0: SENSOR
		const sensorFrame = {
			ts: timestamp,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.9,
			indexTip: { x: 0.5, y: 0.5, z: 0 },
			landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0 }),
		};
		sensor.sense = vi.fn().mockResolvedValue(sensorFrame);

		// Stage 1: SMOOTH
		const smoothedFrame = SmoothedFrameSchema.parse({
			...sensorFrame,
			position: { x: 0.5, y: 0.5 },
			velocity: { x: 0, y: 0 },
			prediction: null,
		});
		smoother.smooth = vi.fn().mockReturnValue(smoothedFrame);

		// Stage 2: FSM
		const fsmAction = { action: 'move', state: 'ARMED', x: 0.5, y: 0.5 };
		fsm.process = vi.fn().mockReturnValue(fsmAction);

		// Stage 5: EMIT
		const pointerEvent = {
			type: 'pointermove',
			pointerId: 1,
			clientX: 960,
			clientY: 540,
			pointerType: 'mouse',
			pressure: 0.5,
			isPrimary: true,
		};
		emitter.emit = vi.fn().mockReturnValue(pointerEvent);

		// Stage 6: TARGET (Dispatch)
		// adapter.inject is called inside processFrame

		await pipeline.processFrame(mockVideo, timestamp);

		expect(sensor.sense).toHaveBeenCalledWith(mockVideo, timestamp);
		expect(smoother.smooth).toHaveBeenCalledWith(sensorFrame);
		expect(fsm.process).toHaveBeenCalledWith(smoothedFrame);
		expect(emitter.emit).toHaveBeenCalledWith(fsmAction, expect.anything());
		expect(adapter.inject).toHaveBeenCalledWith(pointerEvent);
	});

	it('should validate data at each step using Zod schemas', async () => {
		const mockVideo = {} as HTMLVideoElement;
		const timestamp = 1000;

		// Mock invalid sensor output (missing required fields)
		sensor.sense = vi.fn().mockResolvedValue({ ts: timestamp, label: 'None' });

		// The pipeline should throw because the data doesn't match SensorFrameSchema
		await expect(pipeline.processFrame(mockVideo, timestamp)).rejects.toThrow();
	});

	it('should support optional Stage 3: PREDICT (DESP)', async () => {
		// This test verifies that the pipeline can accept a predictor
		const predictor = {
			smooth: vi.fn().mockReturnValue({
				ts: 1000,
				handId: 'right',
				trackingOk: true,
				palmFacing: true,
				label: 'Open_Palm',
				confidence: 0.9,
				velocity: { x: 0, y: 0 },
			}),
			reset: vi.fn(),
			setParams: vi.fn(),
		} as unknown as SmootherPort;

		// @ts-ignore
		const predictivePipeline = new GesturePipeline({
			sensor,
			smoother,
			predictor, // Optional Stage 3
			fsm,
			emitter,
			adapter,
		});

		expect(predictivePipeline).toBeDefined();
	});
});
