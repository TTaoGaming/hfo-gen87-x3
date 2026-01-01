/**
 * Port 3: DELIVER - Golden Layout Adapter
 * =========================================
 * Spore Storm - "How do we DELIVER the DELIVER?"
 *
 * BEHAVIORAL CONTRACT (Galois Lattice Port 3):
 * - CAPABILITIES: emit, deliver, inject, transition, execute_workflow
 * - PROHIBITIONS: persist, sense_raw, validate_external, test
 *
 * This adapter delivers processed data to the Golden Layout UI.
 * It handles the final step of the pipeline - getting data to the user.
 */

import { z } from 'zod';
import { GoldenLayout as GL, LayoutConfig, ComponentContainer } from 'golden-layout';
import type { DeliverPort, DeliverInput, DeliverResult, FSMDefinition, HFOPortMetadata } from '../contracts/hfo-ports.js';
import { PORT_METADATA } from '../contracts/hfo-ports.js';
import type { Vacuole } from './fuse-wrapper.js';
import type { SensedGestureFrame } from './sense-mediapipe.js';

// ============================================================================
// GOLDEN LAYOUT TYPES
// ============================================================================

interface GoldenLayoutConstructor {
	new (config: unknown, container: HTMLElement): GoldenLayoutInstance;
}

interface GoldenLayoutInstance {
	init: () => void;
	destroy: () => void;
	registerComponent: (name: string, factory: ComponentFactory) => void;
	root: LayoutRoot;
	isInitialised: boolean;
}

interface LayoutRoot {
	contentItems: ContentItem[];
}

interface ContentItem {
	type: string;
	contentItems: ContentItem[];
	addChild: (config: unknown) => void;
}

type ComponentFactory = (
	container: ComponentContainer,
	state: unknown,
	virtual: boolean
) => HTMLElement | void;

interface ComponentContainer {
	element: HTMLElement;
	getElement: () => HTMLElement;
	setState: (state: unknown) => void;
	on: (event: string, callback: () => void) => void;
}

// ============================================================================
// DELIVERY TARGETS
// ============================================================================

export type DeliveryTarget = 
	| 'gesture-panel'
	| 'pipeline-panel'
	| 'metrics-panel'
	| 'data-flow';

export interface DeliveryCallback {
	(data: Vacuole<SensedGestureFrame>): void;
}

// ============================================================================
// DELIVER PORT IMPLEMENTATION
// ============================================================================

export class DeliverGoldenLayoutAdapter implements DeliverPort {
	readonly portNumber = 3 as const;
	readonly metadata: HFOPortMetadata = PORT_METADATA[3];

	private goldenLayout: GoldenLayoutInstance | null = null;
	private deliveryCallbacks: Map<DeliveryTarget, DeliveryCallback[]> = new Map();
	private deliveryCount = 0;
	private signalCount = 0;

	// ========================================================================
	// HFOPort Interface
	// ========================================================================

	async heartbeat(): Promise<{ healthy: boolean; timestamp: string; details?: unknown }> {
		return {
			healthy: true,
			timestamp: new Date().toISOString(),
			details: {
				port: 3,
				verb: 'DELIVER',
				commander: 'Spore Storm',
				deliveryCount: this.deliveryCount,
				signalCount: this.signalCount,
				goldenLayoutActive: this.goldenLayout?.isInitialised ?? false,
			},
		};
	}

	async initialize(): Promise<void> {
		console.log('[Port 3/DELIVER] Spore Storm initializing...');

		// Initialize delivery targets
		this.deliveryCallbacks.set('gesture-panel', []);
		this.deliveryCallbacks.set('pipeline-panel', []);
		this.deliveryCallbacks.set('metrics-panel', []);
		this.deliveryCallbacks.set('data-flow', []);

		console.log('[Port 3/DELIVER] Spore Storm ready.');
	}

	async shutdown(): Promise<void> {
		if (this.goldenLayout) {
			this.goldenLayout.destroy();
			this.goldenLayout = null;
		}
		this.deliveryCallbacks.clear();
		console.log('[Port 3/DELIVER] Spore Storm shutdown.');
	}

	// ========================================================================
	// DeliverPort Interface
	// ========================================================================

	/**
	 * Primary verb: DELIVER
	 * Sends payload to target
	 */
	async deliver(input: DeliverInput): Promise<DeliverResult> {
		const { payload, target, options } = input;
		const timestamp = new Date().toISOString();
		this.deliveryCount++;

		try {
			const callbacks = this.deliveryCallbacks.get(target as DeliveryTarget);
			if (callbacks) {
				for (const callback of callbacks) {
					callback(payload as Vacuole<SensedGestureFrame>);
				}
			}

			return {
				delivered: true,
				target,
				timestamp,
				acknowledgment: options?.acknowledgment ? { received: true } : undefined,
			};
		} catch (error) {
			return {
				delivered: false,
				target,
				timestamp,
				error: error instanceof Error ? error.message : 'Unknown delivery error',
			};
		}
	}

	/**
	 * Emit signal to blackboard
	 */
	async emit(signal: unknown): Promise<{ emitted: boolean; id: string }> {
		this.signalCount++;
		const id = crypto.randomUUID();

		// In production, this would emit to the blackboard
		console.log('[Port 3/DELIVER] Signal emitted:', id);

		return { emitted: true, id };
	}

	/**
	 * Execute FSM transition
	 */
	async transition(
		fsm: FSMDefinition,
		event: string
	): Promise<{ state: string; context: unknown }> {
		// Simple FSM transition
		const currentState = fsm.initial;
		const stateConfig = fsm.states[currentState];

		if (stateConfig?.on?.[event]) {
			return {
				state: stateConfig.on[event],
				context: { previousState: currentState, event },
			};
		}

		return { state: currentState, context: { event, error: 'No transition defined' } };
	}

	/**
	 * Inject into workflow
	 */
	async inject(
		workflow: string,
		payload: unknown
	): Promise<{ injected: boolean; workflowId: string }> {
		// In production, this would inject into Temporal/workflow engine
		console.log(`[Port 3/DELIVER] Injecting into workflow: ${workflow}`);
		return { injected: true, workflowId: crypto.randomUUID() };
	}

	// ========================================================================
	// Extended Methods
	// ========================================================================

	/**
	 * Initialize Golden Layout with default config
	 */
	initializeGoldenLayout(container: HTMLElement): void {
		const config: LayoutConfig = {
			root: {
				type: 'row',
				content: [
					{
						type: 'column',
						width: 40,
						content: [
							{
								type: 'component',
								componentType: 'camera',
								title: 'Camera Feed',
								componentState: {},
							},
							{
								type: 'component',
								componentType: 'gesture',
								title: 'Gesture',
								componentState: {},
							},
						],
					},
					{
						type: 'column',
						width: 60,
						content: [
							{
								type: 'component',
								componentType: 'pipeline',
								title: 'Pipeline',
								componentState: {},
							},
							{
								type: 'component',
								componentType: 'metrics',
								title: 'Metrics',
								componentState: {},
							},
						],
					},
				],
			},
		};

		this.goldenLayout = new GL(container, config);

		// Register component factories
		this.goldenLayout.registerComponent('camera', this.createCameraComponent.bind(this));
		this.goldenLayout.registerComponent('gesture', this.createGestureComponent.bind(this));
		this.goldenLayout.registerComponent('pipeline', this.createPipelineComponent.bind(this));
		this.goldenLayout.registerComponent('metrics', this.createMetricsComponent.bind(this));

		this.goldenLayout.init();
	}

	/**
	 * Register a callback for a delivery target
	 */
	onDelivery(target: DeliveryTarget, callback: DeliveryCallback): () => void {
		const callbacks = this.deliveryCallbacks.get(target) ?? [];
		callbacks.push(callback);
		this.deliveryCallbacks.set(target, callbacks);

		return () => {
			const idx = callbacks.indexOf(callback);
			if (idx >= 0) callbacks.splice(idx, 1);
		};
	}

	/**
	 * Process and deliver a vacuole
	 */
	deliverVacuole(vacuole: Vacuole<SensedGestureFrame>): void {
		this.deliveryCount++;

		// Add ourselves to the port chain
		const deliveredVacuole: Vacuole<SensedGestureFrame> = {
			...vacuole,
			portChain: [
				...vacuole.portChain,
				{ port: 3, verb: 'DELIVER', timestamp: new Date().toISOString() },
			],
		};

		// Deliver to all registered targets
		for (const [target, callbacks] of this.deliveryCallbacks) {
			for (const callback of callbacks) {
				try {
					callback(deliveredVacuole);
				} catch (e) {
					console.error(`[Port 3/DELIVER] Error delivering to ${target}:`, e);
				}
			}
		}
	}

	// ========================================================================
	// Component Factories (for Golden Layout)
	// ========================================================================

	private createCameraComponent(container: ComponentContainer): void {
		const template = document.getElementById('camera-panel-template') as HTMLTemplateElement;
		if (template) {
			const content = template.content.cloneNode(true);
			container.element.appendChild(content);
		}
	}

	private createGestureComponent(container: ComponentContainer): void {
		const template = document.getElementById('gesture-panel-template') as HTMLTemplateElement;
		if (template) {
			const content = template.content.cloneNode(true);
			container.element.appendChild(content);
		}
	}

	private createPipelineComponent(container: ComponentContainer): void {
		const template = document.getElementById('pipeline-panel-template') as HTMLTemplateElement;
		if (template) {
			const content = template.content.cloneNode(true);
			container.element.appendChild(content);
		}
	}

	private createMetricsComponent(container: ComponentContainer): void {
		const template = document.getElementById('metrics-panel-template') as HTMLTemplateElement;
		if (template) {
			const content = template.content.cloneNode(true);
			container.element.appendChild(content);
		}
	}
}
