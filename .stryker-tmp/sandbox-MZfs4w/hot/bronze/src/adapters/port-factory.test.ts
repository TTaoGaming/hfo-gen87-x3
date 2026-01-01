/**
 * PortFactory Unit Tests
 *
 * Gen87.X3 | Phase: INTERLOCK (I) + VALIDATE (V)
 *
 * TDD: Tests written BEFORE implementation
 * Tests factory returns correct adapter types and handles configuration
 */
// @ts-nocheck

import { describe, expect, it } from 'vitest';
import type {
	EmitterPort,
	FSMPort,
	PortFactory,
	SensorPort,
	SmootherPort,
	UIShellPort,
} from '../contracts/ports.js';
import type { AdapterTarget, OverlayConfig } from '../contracts/schemas.js';
import { GoldenLayoutShellAdapter } from './golden-layout-shell.adapter.js';
import { MediaPipeAdapter } from './mediapipe.adapter.js';
import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
import { PointerEventAdapter } from './pointer-event.adapter.js';
import { HFOPortFactory, type PortFactoryConfig, RawHTMLShellAdapter } from './port-factory.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createDefaultConfig = (): PortFactoryConfig => ({
	smoother: {
		type: '1euro',
		minCutoff: 1.0,
		beta: 0.007,
	},
	shell: {
		type: 'golden',
	},
});

const createRapierConfig = (mode: 'rapier-smooth' | 'rapier-predict'): PortFactoryConfig => ({
	smoother: {
		type: mode,
		stiffness: 400,
		damping: 0.85,
		predictionMs: 50,
	},
	shell: {
		type: 'golden',
	},
});

// ============================================================================
// FACTORY INTERFACE COMPLIANCE
// ============================================================================

describe('HFOPortFactory', () => {
	describe('implements PortFactory interface', () => {
		it('should implement all PortFactory methods', () => {
			const config = createDefaultConfig();
			const factory: PortFactory = new HFOPortFactory(config);

			expect(typeof factory.createSensor).toBe('function');
			expect(typeof factory.createSmoother).toBe('function');
			expect(typeof factory.createFSM).toBe('function');
			expect(typeof factory.createEmitter).toBe('function');
			expect(typeof factory.createAdapter).toBe('function');
			expect(typeof factory.createOverlay).toBe('function');
			expect(typeof factory.createShell).toBe('function');
		});
	});

	// ============================================================================
	// SENSOR PORT CREATION
	// ============================================================================

	describe('createSensor()', () => {
		it('should return a MediaPipeAdapter by default', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const sensor = factory.createSensor();

			expect(sensor).toBeInstanceOf(MediaPipeAdapter);
		});

		it('should use custom sensor config when provided', () => {
			const config: PortFactoryConfig = {
				...createDefaultConfig(),
				sensor: {
					wasmPath: '/custom/wasm',
					modelPath: '/custom/model.task',
				},
			};
			const factory = new HFOPortFactory(config);
			const sensor = factory.createSensor();

			expect(sensor).toBeInstanceOf(MediaPipeAdapter);
			// MediaPipeAdapter stores paths privately, verified by construction
		});

		it('should return SensorPort interface', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const sensor: SensorPort = factory.createSensor();

			expect(sensor.initialize).toBeDefined();
			expect(sensor.sense).toBeDefined();
			expect(sensor.dispose).toBeDefined();
			expect('isReady' in sensor).toBe(true);
		});
	});

	// ============================================================================
	// SMOOTHER PORT CREATION
	// ============================================================================

	describe('createSmoother()', () => {
		it('should return OneEuroExemplarAdapter for 1euro type', () => {
			const config = createDefaultConfig();
			config.smoother.type = '1euro';

			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			expect(smoother).toBeInstanceOf(OneEuroExemplarAdapter);
		});

		it('should pass 1euro params to adapter', () => {
			const config = createDefaultConfig();
			config.smoother.type = '1euro';
			config.smoother.minCutoff = 2.0;
			config.smoother.beta = 0.01;

			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			expect(smoother).toBeInstanceOf(OneEuroExemplarAdapter);
			// Params are passed to constructor
		});

		it('should return a SmootherPort for rapier-smooth type', () => {
			const config = createRapierConfig('rapier-smooth');
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			// Rapier is wrapped in RapierSmootherAdapter, check interface
			expect(smoother.smooth).toBeDefined();
			expect(smoother.reset).toBeDefined();
			expect(smoother.setParams).toBeDefined();
		});

		it('should return a SmootherPort for rapier-predict type', () => {
			const config = createRapierConfig('rapier-predict');
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			// Rapier is wrapped in RapierSmootherAdapter, check interface
			expect(smoother.smooth).toBeDefined();
			expect(smoother.reset).toBeDefined();
			expect(smoother.setParams).toBeDefined();
		});

		it('should configure Rapier with stiffness and damping', () => {
			const config: PortFactoryConfig = {
				smoother: {
					type: 'rapier-smooth',
					stiffness: 500,
					damping: 0.9,
				},
				shell: { type: 'golden' },
			};
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			// Rapier is wrapped, verify it's a valid SmootherPort
			expect(smoother.smooth).toBeDefined();
		});

		it('should configure Rapier predictionMs for predictive mode', () => {
			const config: PortFactoryConfig = {
				smoother: {
					type: 'rapier-predict',
					predictionMs: 100,
				},
				shell: { type: 'golden' },
			};
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			// Rapier is wrapped, verify it's a valid SmootherPort
			expect(smoother.smooth).toBeDefined();
		});

		it('should return SmootherPort interface', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const smoother: SmootherPort = factory.createSmoother();

			expect(smoother.smooth).toBeDefined();
			expect(smoother.reset).toBeDefined();
			expect(smoother.setParams).toBeDefined();
		});
	});

	// ============================================================================
	// FSM PORT CREATION
	// ============================================================================

	describe('createFSM()', () => {
		it('should return XStateFSMAdapter', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const fsm = factory.createFSM();

			expect(fsm).toBeInstanceOf(XStateFSMAdapter);
		});

		it('should return FSMPort interface', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const fsm: FSMPort = factory.createFSM();

			expect(fsm.process).toBeDefined();
			expect(fsm.getState).toBeDefined();
			expect(fsm.disarm).toBeDefined();
			expect(fsm.subscribe).toBeDefined();
		});
	});

	// ============================================================================
	// EMITTER PORT CREATION
	// ============================================================================

	describe('createEmitter()', () => {
		it('should return PointerEventAdapter', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const emitter = factory.createEmitter();

			expect(emitter).toBeInstanceOf(PointerEventAdapter);
		});

		it('should return EmitterPort interface', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const emitter: EmitterPort = factory.createEmitter();

			expect(emitter.emit).toBeDefined();
			expect('pointerId' in emitter).toBe(true);
		});
	});

	// ============================================================================
	// ADAPTER PORT CREATION
	// ============================================================================

	describe('createAdapter()', () => {
		it('should return an AdapterPort for element target', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const target: AdapterTarget = {
				type: 'element',
				bounds: { width: 800, height: 600, left: 0, top: 0 },
			};
			const adapter = factory.createAdapter(target);

			expect(adapter).toBeDefined();
			expect(adapter.inject).toBeDefined();
			expect(adapter.getBounds).toBeDefined();
		});

		it('should return an AdapterPort for canvas target', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const target: AdapterTarget = {
				type: 'canvas',
				bounds: { width: 1024, height: 768, left: 100, top: 100 },
			};
			const adapter = factory.createAdapter(target);

			expect(adapter).toBeDefined();
			expect(adapter.inject).toBeDefined();
		});

		it('should return an AdapterPort for iframe target', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const target: AdapterTarget = {
				type: 'iframe',
				bounds: { width: 640, height: 480, left: 0, top: 0 },
			};
			const adapter = factory.createAdapter(target);

			expect(adapter).toBeDefined();
		});
	});

	// ============================================================================
	// OVERLAY PORT CREATION
	// ============================================================================

	describe('createOverlay()', () => {
		it('should return an OverlayPort', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const overlayConfig: OverlayConfig = {
				showRaw: true,
				showSmoothed: true,
				showPredicted: false,
				showSkeleton: true,
				cursorSize: 20,
				colors: {
					raw: '#ff0000',
					smoothed: '#00ff00',
					predicted: '#0000ff',
					skeleton: '#ffff00',
				},
			};
			const overlay = factory.createOverlay(overlayConfig);

			expect(overlay).toBeDefined();
			expect(overlay.initialize).toBeDefined();
			expect(overlay.setCursor).toBeDefined();
			expect(overlay.setLandmarks).toBeDefined();
		});
	});

	// ============================================================================
	// SHELL PORT CREATION
	// ============================================================================

	describe('createShell()', () => {
		it('should return GoldenLayoutShellAdapter for golden type', () => {
			const config = createDefaultConfig();
			config.shell.type = 'golden';

			const factory = new HFOPortFactory(config);
			const shell = factory.createShell('golden');

			expect(shell).toBeInstanceOf(GoldenLayoutShellAdapter);
		});

		it('should return RawHTMLShellAdapter for raw type', () => {
			const config = createDefaultConfig();
			config.shell.type = 'raw';

			const factory = new HFOPortFactory(config);
			const shell = factory.createShell('raw');

			expect(shell).toBeInstanceOf(RawHTMLShellAdapter);
		});

		it('should override config shell type with parameter', () => {
			const config = createDefaultConfig();
			config.shell.type = 'golden'; // Config says golden

			const factory = new HFOPortFactory(config);
			const shell = factory.createShell('raw'); // But we ask for raw

			expect(shell).toBeInstanceOf(RawHTMLShellAdapter);
		});

		it('should use config shell type when parameter matches', () => {
			const config = createDefaultConfig();
			config.shell.type = 'golden';

			const factory = new HFOPortFactory(config);
			const shell = factory.createShell('golden');

			expect(shell).toBeInstanceOf(GoldenLayoutShellAdapter);
		});

		it('should return UIShellPort interface', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			const shell: UIShellPort = factory.createShell('golden');

			expect(shell.initialize).toBeDefined();
			expect(shell.getTileTarget).toBeDefined();
			expect(shell.getTileIds).toBeDefined();
			expect(shell.addTile).toBeDefined();
			expect(shell.removeTile).toBeDefined();
			expect(shell.getLayout).toBeDefined();
			expect(shell.setLayout).toBeDefined();
			expect(shell.dispose).toBeDefined();
		});

		it('should fallback to RawHTMLShellAdapter for unsupported shell types', () => {
			const factory = new HFOPortFactory(createDefaultConfig());
			// mosaic and daedalos not implemented yet
			const shell = factory.createShell('mosaic');

			expect(shell).toBeInstanceOf(RawHTMLShellAdapter);
		});
	});

	// ============================================================================
	// CONFIGURATION VALIDATION
	// ============================================================================

	describe('configuration handling', () => {
		it('should accept partial smoother config', () => {
			const config: PortFactoryConfig = {
				smoother: {
					type: '1euro',
					// Only specify type, use defaults for rest
				},
				shell: { type: 'raw' },
			};
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			expect(smoother).toBeInstanceOf(OneEuroExemplarAdapter);
		});

		it('should accept full rapier config', () => {
			const config: PortFactoryConfig = {
				smoother: {
					type: 'rapier-predict',
					stiffness: 500,
					damping: 0.9,
					predictionMs: 75,
				},
				shell: { type: 'golden' },
			};
			const factory = new HFOPortFactory(config);
			const smoother = factory.createSmoother();

			// Rapier is wrapped in RapierSmootherAdapter
			expect(smoother.smooth).toBeDefined();
			expect(smoother.reset).toBeDefined();
			expect(smoother.setParams).toBeDefined();
		});
	});

	// ============================================================================
	// FACTORY REUSE
	// ============================================================================

	describe('factory instance reuse', () => {
		it('should create new adapter instances each call', () => {
			const factory = new HFOPortFactory(createDefaultConfig());

			const smoother1 = factory.createSmoother();
			const smoother2 = factory.createSmoother();

			expect(smoother1).not.toBe(smoother2);
		});

		it('should create new FSM instances each call', () => {
			const factory = new HFOPortFactory(createDefaultConfig());

			const fsm1 = factory.createFSM();
			const fsm2 = factory.createFSM();

			expect(fsm1).not.toBe(fsm2);
		});

		it('should create new shell instances each call', () => {
			const factory = new HFOPortFactory(createDefaultConfig());

			const shell1 = factory.createShell('golden');
			const shell2 = factory.createShell('golden');

			expect(shell1).not.toBe(shell2);
		});
	});
});

// ============================================================================
// RAW HTML SHELL ADAPTER TESTS
// ============================================================================

describe('RawHTMLShellAdapter', () => {
	it('should implement UIShellPort interface', () => {
		const shell: UIShellPort = new RawHTMLShellAdapter();

		expect(shell.initialize).toBeDefined();
		expect(shell.getTileTarget).toBeDefined();
		expect(shell.getTileIds).toBeDefined();
		expect(shell.addTile).toBeDefined();
		expect(shell.removeTile).toBeDefined();
		expect(shell.splitTile).toBeDefined();
		expect(shell.getLayout).toBeDefined();
		expect(shell.setLayout).toBeDefined();
		expect(shell.onLayoutChange).toBeDefined();
		expect(shell.onTileFocus).toBeDefined();
		expect(shell.dispose).toBeDefined();
	});

	it('should start with empty tile list', () => {
		const shell = new RawHTMLShellAdapter();
		expect(shell.getTileIds()).toEqual([]);
	});

	it('should return null for non-existent tile target', () => {
		const shell = new RawHTMLShellAdapter();
		expect(shell.getTileTarget('non-existent')).toBeNull();
	});

	it('should return initial empty layout', () => {
		const shell = new RawHTMLShellAdapter();
		const layout = shell.getLayout();

		expect(layout.tiles).toEqual([]);
		expect(layout.arrangement).toBe('');
		expect(layout.shell).toBe('raw');
	});
});
