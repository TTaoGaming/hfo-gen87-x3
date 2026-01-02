/**
 * TelemetryCollector - Captures frame-by-frame pipeline data for golden master testing
 *
 * Gen87.X3 | Golden Master Testing Infrastructure
 *
 * Purpose: Structured telemetry collection for deterministic gesture pipeline testing.
 * Each frame processed through the pipeline emits a TelemetryFrame that can be:
 * 1. Logged to console (for Playwright capture)
 * 2. Stored in memory (for export to .golden.json)
 * 3. Compared against golden master for regression detection
 */

export interface TelemetryFrame {
	/** Frame index (sequential counter) */
	frameIndex: number;

	/** Timestamp from performance.now() */
	timestamp: number;

	/** Input source (mouse, camera, video) */
	inputSource: 'mouse' | 'camera' | 'video';

	/** Normalized position (0-1 range) */
	position: {
		x: number;
		y: number;
	};

	/** Raw position (pixels) */
	rawPosition?: {
		x: number;
		y: number;
	};

	/** Smoother output */
	smoothed: {
		type: 'oneeuro' | 'rapier' | 'desp';
		x: number;
		y: number;
	};

	/** MediaPipe gesture data (if camera/video mode) */
	gesture?: {
		label: string;
		confidence: number;
		handedness: 'Left' | 'Right';
	};

	/** Palm angle calculation */
	palmAngle?: {
		degrees: number;
		isFacing: boolean;
		shouldCancel: boolean;
	};

	/** FSM state machine */
	fsm: {
		previous: string;
		current: string;
		transition: string | null;
	};

	/** W3C PointerEvent emitted (if any) */
	w3cEvent?: {
		type: 'pointermove' | 'pointerdown' | 'pointerup' | 'pointercancel';
		clientX: number;
		clientY: number;
		buttons: number;
		pressure: number;
	};
}

export interface TelemetrySession {
	/** Session start time */
	startTime: string;

	/** Video fixture used (if any) */
	videoFixture?: string;

	/** Total frames captured */
	frameCount: number;

	/** FSM state transitions observed */
	transitions: Array<{
		frameIndex: number;
		from: string;
		to: string;
		trigger: string;
	}>;

	/** W3C events emitted */
	events: Array<{
		frameIndex: number;
		type: string;
	}>;

	/** All frames */
	frames: TelemetryFrame[];
}

/**
 * TelemetryCollector class for browser-side use
 */
export class TelemetryCollector {
	private frames: TelemetryFrame[] = [];
	private transitions: TelemetrySession['transitions'] = [];
	private events: TelemetrySession['events'] = [];
	private frameIndex = 0;
	private startTime: string;
	private videoFixture?: string;
	private lastFsmState = 'DISARMED';
	private emitToConsole: boolean;

	constructor(options: { videoFixture?: string; emitToConsole?: boolean } = {}) {
		this.startTime = new Date().toISOString();
		this.videoFixture = options.videoFixture;
		this.emitToConsole = options.emitToConsole ?? true;
	}

	/**
	 * Record a single frame of telemetry
	 */
	recordFrame(frame: Omit<TelemetryFrame, 'frameIndex'>): void {
		const telemetryFrame: TelemetryFrame = {
			...frame,
			frameIndex: this.frameIndex++,
		};

		// Track FSM transitions
		if (frame.fsm.previous !== frame.fsm.current) {
			this.transitions.push({
				frameIndex: telemetryFrame.frameIndex,
				from: frame.fsm.previous,
				to: frame.fsm.current,
				trigger: frame.fsm.transition ?? 'unknown',
			});
		}

		// Track W3C events
		if (frame.w3cEvent) {
			this.events.push({
				frameIndex: telemetryFrame.frameIndex,
				type: frame.w3cEvent.type,
			});
		}

		this.frames.push(telemetryFrame);
		this.lastFsmState = frame.fsm.current;

		// Emit to console for Playwright capture
		if (this.emitToConsole) {
			console.log('[TELEMETRY]', JSON.stringify(telemetryFrame));
		}
	}

	/**
	 * Get complete session data for golden master export
	 */
	getSession(): TelemetrySession {
		return {
			startTime: this.startTime,
			videoFixture: this.videoFixture,
			frameCount: this.frames.length,
			transitions: this.transitions,
			events: this.events,
			frames: this.frames,
		};
	}

	/**
	 * Export session as JSON string
	 */
	exportJSON(): string {
		return JSON.stringify(this.getSession(), null, 2);
	}

	/**
	 * Reset collector for new session
	 */
	reset(): void {
		this.frames = [];
		this.transitions = [];
		this.events = [];
		this.frameIndex = 0;
		this.startTime = new Date().toISOString();
		this.lastFsmState = 'DISARMED';
	}

	/**
	 * Get summary statistics
	 */
	getSummary(): {
		frameCount: number;
		transitionCount: number;
		eventCount: number;
		gesturesDetected: string[];
		fsmStatesVisited: string[];
	} {
		const gestures = new Set<string>();
		const states = new Set<string>();

		for (const frame of this.frames) {
			if (frame.gesture?.label) {
				gestures.add(frame.gesture.label);
			}
			states.add(frame.fsm.current);
		}

		return {
			frameCount: this.frames.length,
			transitionCount: this.transitions.length,
			eventCount: this.events.length,
			gesturesDetected: Array.from(gestures),
			fsmStatesVisited: Array.from(states),
		};
	}
}

/**
 * Compare two telemetry sessions for golden master testing
 */
export function compareTelemetrySessions(
	actual: TelemetrySession,
	expected: TelemetrySession,
	options: {
		/** Tolerance for position differences (0-1 normalized) */
		positionTolerance?: number;
		/** Tolerance for angle differences (degrees) */
		angleTolerance?: number;
		/** Whether to require exact frame count match */
		strictFrameCount?: boolean;
	} = {}
): {
	match: boolean;
	differences: Array<{
		type: string;
		frameIndex?: number;
		expected: unknown;
		actual: unknown;
	}>;
} {
	const positionTolerance = options.positionTolerance ?? 0.01;
	const angleTolerance = options.angleTolerance ?? 1.0;
	const strictFrameCount = options.strictFrameCount ?? false;

	const differences: Array<{
		type: string;
		frameIndex?: number;
		expected: unknown;
		actual: unknown;
	}> = [];

	// Check frame count
	if (strictFrameCount && actual.frameCount !== expected.frameCount) {
		differences.push({
			type: 'frame_count',
			expected: expected.frameCount,
			actual: actual.frameCount,
		});
	}

	// Check FSM transitions match
	if (actual.transitions.length !== expected.transitions.length) {
		differences.push({
			type: 'transition_count',
			expected: expected.transitions.length,
			actual: actual.transitions.length,
		});
	}

	// Compare transitions
	const minTransitions = Math.min(actual.transitions.length, expected.transitions.length);
	for (let i = 0; i < minTransitions; i++) {
		const actualT = actual.transitions[i];
		const expectedT = expected.transitions[i];

		if (actualT.from !== expectedT.from || actualT.to !== expectedT.to) {
			differences.push({
				type: 'transition_mismatch',
				frameIndex: actualT.frameIndex,
				expected: { from: expectedT.from, to: expectedT.to },
				actual: { from: actualT.from, to: actualT.to },
			});
		}
	}

	// Compare W3C event sequence
	const actualEventTypes = actual.events.map((e) => e.type);
	const expectedEventTypes = expected.events.map((e) => e.type);

	if (JSON.stringify(actualEventTypes) !== JSON.stringify(expectedEventTypes)) {
		differences.push({
			type: 'event_sequence',
			expected: expectedEventTypes,
			actual: actualEventTypes,
		});
	}

	// Sample frame comparison (check every 10th frame to avoid noise)
	const sampleRate = 10;
	const minFrames = Math.min(actual.frames.length, expected.frames.length);

	for (let i = 0; i < minFrames; i += sampleRate) {
		const actualFrame = actual.frames[i];
		const expectedFrame = expected.frames[i];

		// Check gesture matches
		if (actualFrame.gesture?.label !== expectedFrame.gesture?.label) {
			differences.push({
				type: 'gesture_mismatch',
				frameIndex: i,
				expected: expectedFrame.gesture?.label,
				actual: actualFrame.gesture?.label,
			});
		}

		// Check palm angle within tolerance
		if (actualFrame.palmAngle && expectedFrame.palmAngle) {
			const angleDiff = Math.abs(actualFrame.palmAngle.degrees - expectedFrame.palmAngle.degrees);
			if (angleDiff > angleTolerance) {
				differences.push({
					type: 'palm_angle_mismatch',
					frameIndex: i,
					expected: expectedFrame.palmAngle.degrees,
					actual: actualFrame.palmAngle.degrees,
				});
			}
		}

		// Check FSM state matches
		if (actualFrame.fsm.current !== expectedFrame.fsm.current) {
			differences.push({
				type: 'fsm_state_mismatch',
				frameIndex: i,
				expected: expectedFrame.fsm.current,
				actual: actualFrame.fsm.current,
			});
		}
	}

	return {
		match: differences.length === 0,
		differences,
	};
}

export default TelemetryCollector;
