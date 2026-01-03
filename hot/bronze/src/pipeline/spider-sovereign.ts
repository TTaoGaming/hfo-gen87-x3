import { InMemorySubstrateAdapter } from '../adapters/in-memory-substrate.adapter.js';
import { KrakenKeeperAssimilator } from '../adapters/kraken-keeper-assimilator.adapter.js';
import { MirrorMagusShaper } from '../adapters/mirror-magus-shaper.adapter.js';
import { PyrePraetorianImmunizer } from '../adapters/pyre-praetorian-immunizer.adapter.js';
import { SporeStormInjector } from '../adapters/spore-storm-injector.adapter.js';
import { WebWeaverBridger } from '../adapters/web-weaver-bridger.adapter.js';
import type {
	Port0_Observer,
	Port1_Bridger,
	Port2_Shaper,
	Port3_Injector,
	Port5_Immunizer,
	Port6_Assimilator,
	Port7_Navigator,
} from '../contracts/eight-ports.js';
import type { PortFactory } from '../contracts/ports.js';
import { SensorFrameSchema } from '../contracts/schemas.js';
import { wrapInVacuole } from '../contracts/vacuole-envelope.js';

/**
 * Spider Sovereign Orchestrator (Port 7)
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | DECIDE
 *
 * The central Command & Control for the HFO 8-port architecture.
 * Implements "Total Tool Virtualization" by orchestrating the swarm.
 *
 * "The spider weaves the web that weaves the spider."
 */
export class SpiderSovereignOrchestrator implements Port7_Navigator {
	// The 8 Ports
	private port0: Port0_Observer;
	private port1: Port1_Bridger;
	private port2: Port2_Shaper;
	private port3: Port3_Injector;
	// private port4: Port4_Disruptor | null = null;
	private port5: Port5_Immunizer;
	private port6: Port6_Assimilator;

	private isRunning = false;
	private substrate: InMemorySubstrateAdapter;
	private gen: number;

	constructor(config: { gen: number; factory: PortFactory }) {
		this.gen = config.gen;
		this.substrate = new InMemorySubstrateAdapter();

		// Initialize Ports using the provided Factory (Exemplar Primitive)
		this.port0 = config.factory.createSensor() as any; // Port 0: SENSE
		this.port1 = new WebWeaverBridger(config.gen); // Port 1: FUSE

		const smoother = config.factory.createSmoother();
		this.port2 = new MirrorMagusShaper(smoother); // Port 2: SHAPE

		const fsm = config.factory.createFSM();
		const emitter = config.factory.createEmitter();
		const adapter = config.factory.createAdapter({
			type: 'element',
			selector: 'body',
			bounds: { width: 1920, height: 1080, left: 0, top: 0 },
		});

		this.port3 = new SporeStormInjector(emitter, adapter); // Port 3: DELIVER
		this.port5 = new PyrePraetorianImmunizer(); // Port 5: DEFEND
		this.port6 = new KrakenKeeperAssimilator(this.substrate, fsm); // Port 6: STORE
	}

	/**
	 * Port 7: DECIDE
	 * Strategic decision making for the swarm.
	 */
	async decide(context: unknown): Promise<void> {
		console.log('[Spider Sovereign] Deciding...', context);
		this.emitSignal('Spider Sovereign making strategic decision.', 'I');
	}

	/**
	 * Port 7: ORCHESTRATE
	 * Executes a full HIVE cycle (Hunt, Interlock, Validate, Evolve).
	 */
	async orchestrate(): Promise<void> {
		if (!this.isRunning) {
			await this.start();
		}
		this.emitSignal('Orchestrating HIVE cycle for Total Tool Virtualization.', 'I');
	}

	async start(): Promise<void> {
		if (this.isRunning) return;
		await this.substrate.connect();
		// Initialize Port 0 (Sensor)
		if (typeof (this.port0 as any).initialize === 'function') {
			await (this.port0 as any).initialize();
		}
		this.isRunning = true;

		this.emitSignal('Spider Sovereign active. Total Tool Virtualization initiated.', 'H');
	}

	async stop(): Promise<void> {
		if (!this.isRunning) return;
		await this.substrate.disconnect();
		this.isRunning = false;
	}

	/**
	 * The core 8-port execution loop
	 *
	 * This is the "Obsidian Hourglass" in motion.
	 */
	async process(video: HTMLVideoElement, timestamp: number): Promise<void> {
		if (!this.isRunning) return;

		try {
			// 1. Port 0: SENSE (Lidless Legion)
			// We wrap the raw output in a Vacuole if the adapter doesn't do it
			const rawResult = await (this.port0 as any).sense(video, timestamp);
			const rawEnvelope = wrapInVacuole(rawResult, {
				type: 'hfo.w3c.gesture.sense',
				hfogen: this.gen,
				hfohive: 'H',
				hfoport: 0,
				hfostage: 1,
			});

			// 2. Port 5: DEFEND (Pyre Praetorian) - Validate raw input
			if (!this.port5.defend(rawEnvelope)) return;

			// 3. Port 1: FUSE (Web Weaver) - Virtualize tool schema
			const fusedEnvelope = this.port1.fuse(rawEnvelope.data, SensorFrameSchema);

			// 4. Port 2: SHAPE (Mirror Magus) - Smooth and Predict
			const shapedEnvelope = this.port2.shape(fusedEnvelope as any);

			// 5. Port 6: STORE (Kraken Keeper) - Assimilate into FSM
			// IR-0008 FIX: FSM moved from Port 3 to Port 6
			const actionEnvelope = await this.port6.assimilate(shapedEnvelope as any);

			// 6. Port 3: DELIVER (Spore Storm) - Execute and Inject
			// Target is decided by Port 7 (Spider Sovereign)
			const target = {
				type: 'element' as const,
				selector: '#app',
				bounds: { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 },
			};
			const deliveredEnvelope = await this.port3.deliver(actionEnvelope as any, target);

			if (!deliveredEnvelope) {
				// No event emitted this frame (e.g., system arming)
				return;
			}

			// Store the final event in memory
			await this.port6.store('last_event', deliveredEnvelope.data);

			// Publish to substrate for stigmergy
			this.substrate.publish('hfo.pipeline.complete', deliveredEnvelope);
		} catch (error) {
			console.error('[Spider Sovereign] Pipeline error:', error);
			this.emitSignal(`Pipeline error: ${error}`, 'E');
		}
	}

	private emitSignal(msg: string, hive: 'H' | 'I' | 'V' | 'E'): void {
		const signal = {
			ts: new Date().toISOString(),
			mark: 1.0,
			pull: 'downstream',
			msg,
			type: 'signal',
			hive,
			gen: this.gen,
			port: 7,
		};
		this.substrate.publish('hfo.stigmergy.signal', signal);
		console.log(`[SIGNAL] [${hive}] ${msg}`);
	}

	getBus(): InMemorySubstrateAdapter {
		return this.substrate;
	}
}
