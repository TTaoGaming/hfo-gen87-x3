/**
 * HFO Adapter Factories - Canonical Gen87.X3 Implementations
 *
 * This file provides AdapterFactory implementations for all production-ready adapters.
 * These factories are used by the AdapterRegistry to compose the pipeline on the fly.
 */
import type { AdapterFactory } from '../contracts/adapter-factory.js';
import type {
	EmitterPort,
	FSMPort,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from '../contracts/ports.js';
import { GoldenLayoutShellAdapter } from './golden-layout-shell.adapter.js';
import { MediaPipeAdapter } from './mediapipe.adapter.js';
import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
import { PointerEventAdapter } from './pointer-event.adapter.js';
import { RapierPhysicsAdapter } from './rapier-physics.adapter.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// SENSOR FACTORIES (Port 0)
// ============================================================================

export const MediaPipeFactory: AdapterFactory<SensorPort, any> = {
	metadata: {
		id: 'mediapipe',
		name: 'MediaPipe Gesture Recognizer',
		version: '0.10.0',
		description: 'Google MediaPipe-based hand landmark and gesture detection',
		trl: 9,
		source: '@mediapipe/tasks-vision',
		citation: 'Google AI Edge MediaPipe',
	},
	create(config: any) {
		return new MediaPipeAdapter(config?.modelPath, config?.wasmPath);
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return {
			modelPath:
				'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
			wasmPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm',
		};
	},
};

// ============================================================================
// SMOOTHER FACTORIES (Port 2)
// ============================================================================

export const OneEuroFactory: AdapterFactory<SmootherPort, any> = {
	metadata: {
		id: 'one-euro',
		name: '1€ Filter',
		version: '1.0.0',
		description: 'Casiez CHI 2012 adaptive low-pass filter for jitter reduction',
		trl: 9,
		source: '1eurofilter',
		citation: 'Casiez et al. CHI 2012',
	},
	create(config: any) {
		return new OneEuroExemplarAdapter(config);
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return { freq: 60, mincutoff: 1.0, beta: 0.007, dcutoff: 1.0 };
	},
};

export const RapierSmootherFactory: AdapterFactory<SmootherPort, any> = {
	metadata: {
		id: 'rapier-smooth',
		name: 'Rapier Physics Smoother',
		version: '0.11.0',
		description: 'WASM-backed physics simulation for high-fidelity smoothing',
		trl: 8,
		source: '@dimforge/rapier2d-compat',
	},
	create(config: any) {
		// Note: RapierPhysicsAdapter implements SmootherPort via its internal logic
		return new RapierPhysicsAdapter({ ...config, mode: 'smoothed' }) as unknown as SmootherPort;
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return { stiffness: 500, damping: 30 };
	},
};

// ============================================================================
// PREDICTOR FACTORIES (Port 2.5)
// ============================================================================

export const RapierPredictorFactory: AdapterFactory<any, any> = {
	metadata: {
		id: 'rapier-predict',
		name: 'Rapier Physics Predictor',
		version: '0.11.0',
		description: 'WASM-backed physics simulation for trajectory prediction',
		trl: 8,
		source: '@dimforge/rapier2d-compat',
	},
	create(config: any) {
		return new RapierPhysicsAdapter({ ...config, mode: 'predictive' });
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return { lookAheadMs: 16 };
	},
};

// ============================================================================
// FSM FACTORIES (Port 3)
// ============================================================================

export const XStateFSMFactory: AdapterFactory<FSMPort, any> = {
	metadata: {
		id: 'xstate',
		name: 'XState v5 FSM',
		version: '5.0.0',
		description: 'State-of-the-art finite state machine for gesture logic',
		trl: 9,
		source: 'xstate',
	},
	create(_config: any) {
		return new XStateFSMAdapter();
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return {};
	},
};

// ============================================================================
// EMITTER FACTORIES (Port 5)
// ============================================================================

export const W3CPointerFactory: AdapterFactory<EmitterPort, any> = {
	metadata: {
		id: 'w3c-pointer',
		name: 'W3C Pointer Event Emitter',
		version: '1.0.0',
		description: 'Standard W3C PointerEvents (down, move, up, cancel)',
		trl: 9,
		source: 'W3C Pointer Events L3',
	},
	create(config: any) {
		return new PointerEventAdapter(config?.deviceId ?? 1, config?.pointerType ?? 'touch');
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return { deviceId: 1, pointerType: 'touch' };
	},
};

// ============================================================================
// UI SHELL FACTORIES (Port 7)
// ============================================================================

export const GoldenLayoutFactory: AdapterFactory<UIShellPort, any> = {
	metadata: {
		id: 'golden',
		name: 'Golden Layout 2.x',
		version: '2.6.0',
		description: 'Multi-window tiling manager for browser-based OS feel',
		trl: 9,
		source: 'golden-layout',
	},
	create(_config: any) {
		return new GoldenLayoutShellAdapter();
	},
	validateConfig(_config: any) {
		return { valid: true };
	},
	getDefaultConfig() {
		return {};
	},
};
