/**
 * PIPELINE POLICY AS CODE
 *
 * Gen87.X3 | Port 5 (Pyre Praetorian) | HARD ENFORCEMENT
 *
 * This file defines the MANDATORY 8-stage pipeline policy.
 * These constraints CANNOT be bypassed by AI agents.
 *
 * POLICY: Every showcase/demo MUST implement ALL 8 stages.
 * POLICY: Rapier physics is DEFAULT for smoothing + prediction.
 * POLICY: GoldenLayout (or declared equivalent) is REQUIRED for UI.
 */

import { z } from 'zod';

// ============================================================================
// 8-STAGE PIPELINE DEFINITION (Maps to 8 Ports)
// ============================================================================

/**
 * The 8 mandatory pipeline stages
 *
 * Each stage maps to a Commander/Port:
 * - Stage 0: SENSE    → Port 0 (Lidless Legion)
 * - Stage 1: BRIDGE   → Port 1 (Web Weaver)
 * - Stage 2: SMOOTH   → Port 2 (Mirror Magus)
 * - Stage 3: FSM      → Port 3 (Spore Storm)
 * - Stage 4: PREDICT  → Port 4 (Red Regnant)
 * - Stage 5: EMIT     → Port 5 (Pyre Praetorian)
 * - Stage 6: TARGET   → Port 6 (Kraken Keeper)
 * - Stage 7: UI       → Port 7 (Spider Sovereign)
 */
export const PIPELINE_STAGES = [
	'SENSE', // 0: MediaPipe hand tracking input
	'BRIDGE', // 1: Schema validation, CloudEvents wrapping
	'SMOOTH', // 2: 1€ Filter or equivalent smoothing
	'FSM', // 3: XState finite state machine
	'PREDICT', // 4: Rapier physics predictive cursor
	'EMIT', // 5: W3C PointerEvent generation
	'TARGET', // 6: DOM/NATS dispatch + substrate
	'UI', // 7: GoldenLayout tiling shell
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

// ============================================================================
// ADAPTER POLICY SCHEMAS
// ============================================================================

/**
 * Allowed adapters per stage (policy enforcement)
 */
export const STAGE_ADAPTERS = {
	SENSE: ['mediapipe', 'mock-sensor', 'webxr', 'mouse-emulator'],
	BRIDGE: ['cloudevents', 'zod-validator', 'passthrough'],
	SMOOTH: ['one-euro', 'rapier-smooth', 'kalman', 'passthrough'],
	FSM: ['xstate', 'robot', 'simple-fsm'],
	PREDICT: ['rapier-predict', 'desp', 'one-euro-predict', 'none'],
	EMIT: ['w3c-pointer', 'touch-emulator', 'custom-events'],
	TARGET: ['dom', 'nats', 'canvas', 'webgpu'],
	UI: ['golden-layout', 'mosaic', 'winbox', 'daedalos', 'raw-dom'],
} as const;

/**
 * DEFAULT adapters (Rapier for physics, GoldenLayout for UI)
 */
export const DEFAULT_ADAPTERS: Record<PipelineStage, string> = {
	SENSE: 'mediapipe',
	BRIDGE: 'zod-validator',
	SMOOTH: 'rapier-smooth', // POLICY: Rapier default
	FSM: 'xstate',
	PREDICT: 'rapier-predict', // POLICY: Rapier default
	EMIT: 'w3c-pointer',
	TARGET: 'dom',
	UI: 'golden-layout', // POLICY: GoldenLayout default
};

// ============================================================================
// POLICY SCHEMA (Zod enforcement)
// ============================================================================

/**
 * Pipeline composition policy schema
 *
 * Validates that ALL 8 stages are declared.
 */
export const PipelineCompositionPolicySchema = z.object({
	sense: z.enum(['mediapipe', 'mock-sensor', 'webxr', 'mouse-emulator']),
	bridge: z.enum(['cloudevents', 'zod-validator', 'passthrough']),
	smooth: z.enum(['one-euro', 'rapier-smooth', 'kalman', 'passthrough']),
	fsm: z.enum(['xstate', 'robot', 'simple-fsm']),
	predict: z.enum(['rapier-predict', 'desp', 'one-euro-predict', 'none']),
	emit: z.enum(['w3c-pointer', 'touch-emulator', 'custom-events']),
	target: z.enum(['dom', 'nats', 'canvas', 'webgpu']),
	ui: z.enum(['golden-layout', 'mosaic', 'winbox', 'daedalos', 'raw-dom']),
});

export type PipelineCompositionPolicy = z.infer<typeof PipelineCompositionPolicySchema>;

// ============================================================================
// POLICY ENFORCEMENT FUNCTIONS
// ============================================================================

/**
 * Validate that a pipeline composition satisfies ALL policies
 *
 * @throws Error if any policy is violated
 */
export function enforcePipelinePolicy(composition: unknown): PipelineCompositionPolicy {
	const result = PipelineCompositionPolicySchema.safeParse(composition);

	if (!result.success) {
		const missing = result.error.issues.map((i) => i.path.join('.'));
		throw new PolicyViolationError(
			`POLICY VIOLATION: Missing or invalid pipeline stages: ${missing.join(', ')}`,
			missing,
		);
	}

	return result.data;
}

/**
 * Check if a composition uses Rapier for physics (smooth + predict)
 */
export function enforcesRapierPhysics(composition: PipelineCompositionPolicy): boolean {
	return composition.smooth === 'rapier-smooth' && composition.predict === 'rapier-predict';
}

/**
 * Check if a composition uses GoldenLayout or equivalent tiling UI
 */
export function enforcesTilingUI(composition: PipelineCompositionPolicy): boolean {
	return ['golden-layout', 'mosaic', 'winbox', 'daedalos'].includes(composition.ui);
}

/**
 * Get default policy-compliant composition
 */
export function getDefaultPolicyComposition(): PipelineCompositionPolicy {
	return {
		sense: 'mediapipe',
		bridge: 'zod-validator',
		smooth: 'rapier-smooth',
		fsm: 'xstate',
		predict: 'rapier-predict',
		emit: 'w3c-pointer',
		target: 'dom',
		ui: 'golden-layout',
	};
}

// ============================================================================
// POLICY VIOLATION ERROR
// ============================================================================

export class PolicyViolationError extends Error {
	public readonly violations: string[];

	constructor(message: string, violations: string[]) {
		super(message);
		this.name = 'PolicyViolationError';
		this.violations = violations;
	}
}

// ============================================================================
// CODE ANALYSIS PATTERNS (for constraint tests)
// ============================================================================

/**
 * Patterns to detect each stage in source code
 */
export const STAGE_DETECTION_PATTERNS: Record<PipelineStage, RegExp[]> = {
	SENSE: [
		/MediaPipe|GestureRecognizer|HandLandmarker/i,
		/createSensorFrame|SensorFrameSchema/i,
		/\.detect\(|\.recognizeHands\(/i,
	],
	BRIDGE: [
		/CloudEvent|wrapAsCloudEvent/i,
		/ZodValidator|\.parse\(|\.safeParse\(/i,
		/SensorFrameSchema\.parse|SmoothedFrameSchema\.parse/i,
	],
	SMOOTH: [
		/OneEuro|RapierSmoother|KalmanFilter/i,
		/\.smooth\(|smoother\.filter/i,
		/SmootherPort|SmootherRegistry/i,
	],
	FSM: [
		/XState|createMachine|interpret\(/i,
		/gestureMachine|FSMPort|FSMRegistry/i,
		/\.process\(|fsmAdapter\.send/i,
	],
	PREDICT: [
		/RapierPredictor|DESP|PredictorPort/i,
		/\.predict\(|predictiveSmooth/i,
		/rapier-predict|PredictorRegistry/i,
	],
	EMIT: [
		/PointerEvent|W3CPointer|EmitterPort/i,
		/\.emit\(|pointerAdapter\.generate/i,
		/pointer(down|up|move|cancel)/i,
	],
	TARGET: [
		/dispatchEvent|\.target\.|TargetPort/i,
		/DOMTargetRouter|NATSTarget|SubstratePort/i,
		/\.dispatch\(|\.inject\(/i,
	],
	UI: [
		/GoldenLayout|Mosaic|WinBox|DaedalOS/i,
		/UIShellPort|UIShellRegistry/i,
		/\.initialize\(|\.addTile\(|\.registerComponent\(/i,
	],
};

/**
 * Detect which stages are present in source code
 */
export function detectStagesInCode(sourceCode: string): Set<PipelineStage> {
	const detected = new Set<PipelineStage>();

	for (const stage of PIPELINE_STAGES) {
		const patterns = STAGE_DETECTION_PATTERNS[stage];
		for (const pattern of patterns) {
			if (pattern.test(sourceCode)) {
				detected.add(stage);
				break;
			}
		}
	}

	return detected;
}

/**
 * Get missing stages from source code
 */
export function getMissingStages(sourceCode: string): PipelineStage[] {
	const detected = detectStagesInCode(sourceCode);
	return PIPELINE_STAGES.filter((stage) => !detected.has(stage));
}

/**
 * Validate that source code contains all 8 stages
 *
 * @throws PolicyViolationError if any stage is missing
 */
export function enforceAllStagesInCode(sourceCode: string, fileName: string): void {
	const missing = getMissingStages(sourceCode);

	if (missing.length > 0) {
		throw new PolicyViolationError(
			`POLICY VIOLATION in ${fileName}: Missing pipeline stages: ${missing.join(', ')}`,
			missing,
		);
	}
}

// ============================================================================
// RAPIER PHYSICS POLICY
// ============================================================================

/**
 * Patterns that indicate Rapier physics usage
 */
export const RAPIER_PATTERNS = [
	/import.*from.*['"]@dimforge\/rapier/i,
	/RapierSmoother|RapierPredictor/i,
	/rapier-smooth|rapier-predict/i,
	/World\(\)|RigidBody|Collider/i,
	/physics\.step\(|world\.step\(/i,
];

/**
 * Check if source code uses Rapier for physics
 */
export function usesRapierPhysics(sourceCode: string): boolean {
	return RAPIER_PATTERNS.some((pattern) => pattern.test(sourceCode));
}

/**
 * Patterns for fallback physics (allowed but not default)
 */
export const FALLBACK_PHYSICS_PATTERNS = [
	/OneEuro.*predict/i,
	/DESP|DoubleExponential/i,
	/KalmanFilter/i,
];

/**
 * Check if code uses any physics smoothing (Rapier or fallback)
 */
export function usesPhysicsSmoothing(sourceCode: string): boolean {
	return usesRapierPhysics(sourceCode) || FALLBACK_PHYSICS_PATTERNS.some((p) => p.test(sourceCode));
}

// ============================================================================
// GOLDENLAYOUT POLICY
// ============================================================================

/**
 * Patterns that indicate GoldenLayout (or equivalent) usage
 */
export const TILING_UI_PATTERNS = [
	/GoldenLayout|golden-layout/i,
	/Mosaic|react-mosaic/i,
	/WinBox/i,
	/DaedalOS|daedalos/i,
	/UIShellAdapter|UIShellPort/i,
];

/**
 * Check if source code uses tiling window manager
 */
export function usesTilingUI(sourceCode: string): boolean {
	return TILING_UI_PATTERNS.some((pattern) => pattern.test(sourceCode));
}

// ============================================================================
// SHOWCASE POLICY COMPLIANCE CHECK
// ============================================================================

export interface PolicyComplianceResult {
	compliant: boolean;
	missingStages: PipelineStage[];
	hasRapierPhysics: boolean;
	hasTilingUI: boolean;
	violations: string[];
}

/**
 * Full policy compliance check for a showcase file
 */
export function checkShowcaseCompliance(
	sourceCode: string,
	_fileName: string,
): PolicyComplianceResult {
	const missingStages = getMissingStages(sourceCode);
	const hasRapierPhysics = usesRapierPhysics(sourceCode);
	const hasTilingUI = usesTilingUI(sourceCode);

	const violations: string[] = [];

	if (missingStages.length > 0) {
		violations.push(`Missing stages: ${missingStages.join(', ')}`);
	}

	if (!hasRapierPhysics && !usesPhysicsSmoothing(sourceCode)) {
		violations.push('POLICY: Must use physics smoothing (Rapier default, fallback allowed)');
	}

	if (!hasTilingUI) {
		violations.push('POLICY: Must use tiling UI (GoldenLayout default)');
	}

	return {
		compliant: violations.length === 0,
		missingStages,
		hasRapierPhysics,
		hasTilingUI,
		violations,
	};
}
