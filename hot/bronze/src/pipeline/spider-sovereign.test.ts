import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HFOPortFactory } from '../adapters/port-factory.js';
import { SimulatedSensorAdapter } from '../adapters/quarantine/mock-sensor.adapter.js';
import type { SensorFrame } from '../contracts/schemas.js';
import { SpiderSovereignOrchestrator } from './spider-sovereign.js';

/**
 * Spider Sovereign Orchestrator Tests
 *
 * Gen87.X3 | Phase: VALIDATE (V) | DECIDE
 *
 * IR-0008 FIX: Using real exemplar primitives (HFOPortFactory) instead of mocks.
 */
describe('SpiderSovereignOrchestrator', () => {
	let orchestrator: SpiderSovereignOrchestrator;
	let factory: HFOPortFactory;
	let sensor: SimulatedSensorAdapter;

	beforeEach(() => {
		// Mock window/document for Node environment
		global.window = {
			innerWidth: 1920,
			innerHeight: 1080,
		} as any;

		global.document = {
			body: {
				dispatchEvent: vi.fn(),
				getBoundingClientRect: () => ({ width: 1920, height: 1080, left: 0, top: 0 }),
			},
		} as any;

		// Initialize the real Factory
		factory = new HFOPortFactory({
			smoother: { type: '1euro', minCutoff: 1.0, beta: 0.007 },
			shell: { type: 'raw' },
		});

		// Override createSensor to use SimulatedSensorAdapter (Real class, not a mock)
		// This avoids MediaPipe's browser dependencies in Node.
		sensor = new SimulatedSensorAdapter();
		vi.spyOn(factory, 'createSensor').mockReturnValue(sensor);

		orchestrator = new SpiderSovereignOrchestrator({
			gen: 87,
			factory,
		});
	});

	it('should initialize all 8 ports using the factory', () => {
		expect(orchestrator).toBeDefined();
	});

	it('should start and stop correctly', async () => {
		await orchestrator.start();
		// @ts-ignore - accessing private for test
		expect(orchestrator.isRunning).toBe(true);

		await orchestrator.stop();
		// @ts-ignore - accessing private for test
		expect(orchestrator.isRunning).toBe(false);
	});

	it('should process a video frame through the 8-port loop', async () => {
		// Spy on substrate publish to verify stigmergy
		const publishSpy = vi.spyOn(orchestrator.getBus(), 'publish');

		await orchestrator.start();

		const mockVideo = {} as HTMLVideoElement;
		let timestamp = Date.now();

		// 1. Send Open_Palm frame to start arming
		const frame1: SensorFrame = {
			ts: timestamp,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			indexTip: { x: 0.5, y: 0.5, z: 0 },
			landmarks: Array(21).fill({ x: 0.5, y: 0.5, z: 0 }),
			handedness: [{ score: 0.9, label: 'Right' }],
		};
		sensor.loadMockFrames([frame1]);
		await orchestrator.process(mockVideo, timestamp);

		// 2. Send another Open_Palm frame 300ms later to complete arming
		timestamp += 300;
		const frame2 = { ...frame1, ts: timestamp };
		sensor.loadMockFrames([frame2]);
		await orchestrator.process(mockVideo, timestamp);

		// 3. Send Pointing_Up frame to enter TRACKING and emit an event
		timestamp += 100;
		const frame3: SensorFrame = {
			...frame1,
			ts: timestamp,
			label: 'Pointing_Up',
		};
		sensor.loadMockFrames([frame3]);
		await orchestrator.process(mockVideo, timestamp);

		// Verify pipeline completion signal (should be called on the 3rd frame)
		expect(publishSpy).toHaveBeenCalledWith('hfo.pipeline.complete', expect.any(Object));

		// Verify stigmergy signals
		expect(publishSpy).toHaveBeenCalledWith(
			'hfo.stigmergy.signal',
			expect.objectContaining({
				port: 7,
				type: 'signal',
			}),
		);

		// Verify FSM state was stored
		expect(publishSpy).toHaveBeenCalledWith('hfo.store.fsm_state', expect.any(String));
	});
});
