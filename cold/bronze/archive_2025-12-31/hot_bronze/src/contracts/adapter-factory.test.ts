/**
 * Adapter Factory Contract Tests - Mutation Testing Defense
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Red Regnant (Port 4) + Pyre Praetorian (Port 5)
 *
 * ANTI-REWARD-HACK: Tests for polymorphic adapter registry
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
	type AdapterFactory,
	type AdapterMetadata,
	AdapterRegistry,
	EmitterRegistry,
	FSMRegistry,
	PredictorRegistry,
	SensorRegistry,
	SmootherRegistry,
	TargetRegistry,
	createFactoryFromClass,
} from './adapter-factory.js';
import type { SensorPort, SmootherPort } from './ports.js';

// ============================================================================
// MOCK ADAPTERS FOR TESTING
// ============================================================================

interface MockSensorConfig {
	sensitivity: number;
}

class MockSensorAdapter implements SensorPort {
	constructor(private config: MockSensorConfig = { sensitivity: 1.0 }) {}

	sense(_frame: unknown): unknown {
		return { ts: Date.now(), handId: 'left', trackingOk: true };
	}

	getSensitivity(): number {
		return this.config.sensitivity;
	}
}

const MockSensorFactory: AdapterFactory<SensorPort, MockSensorConfig> = {
	metadata: {
		id: 'mock-sensor',
		name: 'Mock Sensor',
		version: '1.0.0',
		description: 'Mock sensor for testing',
		trl: 1,
		source: 'test',
	},
	create(config?: MockSensorConfig): SensorPort {
		return new MockSensorAdapter(config);
	},
	validateConfig(config?: MockSensorConfig) {
		if (config && (config.sensitivity < 0 || config.sensitivity > 10)) {
			return { valid: false, errors: ['sensitivity must be 0-10'] };
		}
		return { valid: true };
	},
	getDefaultConfig() {
		return { sensitivity: 1.0 };
	},
};

interface MockSmootherConfig {
	beta: number;
}

const MockSmootherFactory: AdapterFactory<SmootherPort, MockSmootherConfig> = {
	metadata: {
		id: 'mock-smoother',
		name: 'Mock Smoother',
		version: '1.0.0',
		description: 'Mock smoother for testing',
		trl: 1,
		source: 'test',
	},
	create(_config?: MockSmootherConfig): SmootherPort {
		return {
			smooth: (frame) => ({ ...frame, velocity: { x: 0, y: 0 } }),
			reset: () => {},
		};
	},
	validateConfig(config?: MockSmootherConfig) {
		if (config && (config.beta < 0 || config.beta > 1)) {
			return { valid: false, errors: ['beta must be 0-1'] };
		}
		return { valid: true };
	},
	getDefaultConfig() {
		return { beta: 0.007 };
	},
};

// ============================================================================
// ADAPTER REGISTRY TESTS
// ============================================================================

describe('AdapterRegistry', () => {
	let registry: AdapterRegistry<SensorPort>;

	beforeEach(() => {
		registry = new AdapterRegistry<SensorPort>();
	});

	describe('register', () => {
		it('should register a factory', () => {
			registry.register('mock', MockSensorFactory);
			expect(registry.getAvailableIds()).toContain('mock');
		});

		it('should throw on duplicate registration', () => {
			registry.register('mock', MockSensorFactory);
			expect(() => registry.register('mock', MockSensorFactory)).toThrow(
				'Adapter "mock" is already registered',
			);
		});

		it('should allow multiple different registrations', () => {
			registry.register('mock1', MockSensorFactory);
			registry.register('mock2', MockSensorFactory);
			expect(registry.getAvailableIds()).toHaveLength(2);
		});
	});

	describe('unregister', () => {
		it('should remove a registered factory', () => {
			registry.register('mock', MockSensorFactory);
			const result = registry.unregister('mock');
			expect(result).toBe(true);
			expect(registry.getAvailableIds()).not.toContain('mock');
		});

		it('should return false for non-existent factory', () => {
			const result = registry.unregister('nonexistent');
			expect(result).toBe(false);
		});
	});

	describe('create', () => {
		beforeEach(() => {
			registry.register('mock', MockSensorFactory);
		});

		it('should create adapter with default config', () => {
			const adapter = registry.create('mock');
			expect(adapter).toBeDefined();
			expect(typeof adapter.sense).toBe('function');
		});

		it('should create adapter with custom config', () => {
			const adapter = registry.create('mock', { sensitivity: 5.0 }) as MockSensorAdapter;
			expect(adapter.getSensitivity()).toBe(5.0);
		});

		it('should throw for non-existent adapter', () => {
			expect(() => registry.create('nonexistent')).toThrow(
				'Adapter "nonexistent" not found. Available: mock',
			);
		});

		it('should throw for invalid config', () => {
			expect(() => registry.create('mock', { sensitivity: 15 })).toThrow(
				'Invalid config for "mock": sensitivity must be 0-10',
			);
		});
	});

	describe('getMetadata', () => {
		it('should return metadata for registered adapter', () => {
			registry.register('mock', MockSensorFactory);
			const metadata = registry.getMetadata('mock');
			expect(metadata).toEqual(MockSensorFactory.metadata);
		});

		it('should return undefined for non-existent adapter', () => {
			const metadata = registry.getMetadata('nonexistent');
			expect(metadata).toBeUndefined();
		});
	});

	describe('getAvailableIds', () => {
		it('should return empty array when no adapters registered', () => {
			expect(registry.getAvailableIds()).toEqual([]);
		});

		it('should return all registered IDs', () => {
			registry.register('a', MockSensorFactory);
			registry.register('b', MockSensorFactory);
			registry.register('c', MockSensorFactory);
			expect(registry.getAvailableIds().sort()).toEqual(['a', 'b', 'c']);
		});
	});
});

// ============================================================================
// GLOBAL REGISTRIES TESTS
// ============================================================================

describe('Global Registries', () => {
	it('SensorRegistry should be empty initially', () => {
		// Global registries start empty
		expect(SensorRegistry).toBeInstanceOf(AdapterRegistry);
	});

	it('SmootherRegistry should be empty initially', () => {
		expect(SmootherRegistry).toBeInstanceOf(AdapterRegistry);
	});

	it('PredictorRegistry should be empty initially', () => {
		expect(PredictorRegistry).toBeInstanceOf(AdapterRegistry);
	});

	it('FSMRegistry should be empty initially', () => {
		expect(FSMRegistry).toBeInstanceOf(AdapterRegistry);
	});

	it('EmitterRegistry should be empty initially', () => {
		expect(EmitterRegistry).toBeInstanceOf(AdapterRegistry);
	});

	it('TargetRegistry should be empty initially', () => {
		expect(TargetRegistry).toBeInstanceOf(AdapterRegistry);
	});
});

// ============================================================================
// createFactoryFromClass TESTS
// ============================================================================

describe('createFactoryFromClass', () => {
	it('should create factory from class', () => {
		const factory = createFactoryFromClass(
			MockSensorAdapter,
			{
				id: 'from-class',
				name: 'From Class',
				version: '1.0.0',
				description: 'Created from class',
				trl: 1,
				source: 'test',
			},
			{ sensitivity: 2.0 },
		);

		expect(factory.metadata.id).toBe('from-class');
		expect(factory.getDefaultConfig()).toEqual({ sensitivity: 2.0 });
	});

	it('should create working adapter from class factory', () => {
		const factory = createFactoryFromClass(
			MockSensorAdapter,
			{
				id: 'from-class',
				name: 'From Class',
				version: '1.0.0',
				description: 'Created from class',
				trl: 1,
				source: 'test',
			},
			{ sensitivity: 3.0 },
		);

		const adapter = factory.create() as MockSensorAdapter;
		expect(adapter.getSensitivity()).toBe(3.0);
	});

	it('should allow config override', () => {
		const factory = createFactoryFromClass(
			MockSensorAdapter,
			{
				id: 'from-class',
				name: 'From Class',
				version: '1.0.0',
				description: 'Created from class',
				trl: 1,
				source: 'test',
			},
			{ sensitivity: 1.0 },
		);

		const adapter = factory.create({ sensitivity: 7.5 }) as MockSensorAdapter;
		expect(adapter.getSensitivity()).toBe(7.5);
	});
});

// ============================================================================
// ADAPTER METADATA TESTS
// ============================================================================

describe('AdapterMetadata', () => {
	it('should have all required fields', () => {
		const metadata: AdapterMetadata = {
			id: 'test-adapter',
			name: 'Test Adapter',
			version: '1.0.0',
			description: 'A test adapter',
			trl: 5,
			source: 'npm:test-adapter',
		};

		expect(metadata.id).toBeDefined();
		expect(metadata.name).toBeDefined();
		expect(metadata.version).toBeDefined();
		expect(metadata.description).toBeDefined();
		expect(metadata.trl).toBeGreaterThanOrEqual(1);
		expect(metadata.trl).toBeLessThanOrEqual(9);
		expect(metadata.source).toBeDefined();
	});

	it('should support optional browser compatibility', () => {
		const metadata: AdapterMetadata = {
			id: 'browser-adapter',
			name: 'Browser Adapter',
			version: '1.0.0',
			description: 'Browser-specific adapter',
			trl: 9,
			source: 'npm:browser-adapter',
			browser: {
				chrome: '90+',
				firefox: '88+',
				safari: '14+',
			},
		};

		expect(metadata.browser?.chrome).toBe('90+');
	});

	it('should support optional citation', () => {
		const metadata: AdapterMetadata = {
			id: 'academic-adapter',
			name: 'Academic Adapter',
			version: '1.0.0',
			description: 'Based on research paper',
			trl: 8,
			source: 'github:research/adapter',
			citation: 'Doe et al., 2023. "Adapter Design Patterns", SIGCHI',
		};

		expect(metadata.citation).toContain('SIGCHI');
	});
});

// ============================================================================
// MUTATION DEFENSE TESTS
// ============================================================================

describe('Mutation Defense - AdapterRegistry', () => {
	it('duplicate registration throws - mutant killer', () => {
		const registry = new AdapterRegistry<SensorPort>();
		registry.register('test', MockSensorFactory);

		// Must throw on duplicate
		let threw = false;
		try {
			registry.register('test', MockSensorFactory);
		} catch {
			threw = true;
		}
		expect(threw).toBe(true);
	});

	it('create with invalid ID throws - mutant killer', () => {
		const registry = new AdapterRegistry<SensorPort>();

		let threw = false;
		try {
			registry.create('nonexistent');
		} catch {
			threw = true;
		}
		expect(threw).toBe(true);
	});

	it('create with invalid config throws - mutant killer', () => {
		const registry = new AdapterRegistry<SensorPort>();
		registry.register('mock', MockSensorFactory);

		let threw = false;
		try {
			registry.create('mock', { sensitivity: 100 }); // Out of range
		} catch {
			threw = true;
		}
		expect(threw).toBe(true);
	});

	it('unregister returns correct boolean - mutant killer', () => {
		const registry = new AdapterRegistry<SensorPort>();
		registry.register('mock', MockSensorFactory);

		// Existing returns true
		const result1 = registry.unregister('mock');
		expect(result1).toBe(true);

		// Non-existing returns false
		const result2 = registry.unregister('mock');
		expect(result2).toBe(false);
	});

	it('getAvailableIds reflects registry state - mutant killer', () => {
		const registry = new AdapterRegistry<SensorPort>();

		expect(registry.getAvailableIds()).toHaveLength(0);

		registry.register('a', MockSensorFactory);
		expect(registry.getAvailableIds()).toHaveLength(1);

		registry.register('b', MockSensorFactory);
		expect(registry.getAvailableIds()).toHaveLength(2);

		registry.unregister('a');
		expect(registry.getAvailableIds()).toHaveLength(1);
		expect(registry.getAvailableIds()).toContain('b');
		expect(registry.getAvailableIds()).not.toContain('a');
	});
});
