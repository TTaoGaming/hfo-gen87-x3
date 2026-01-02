/**
 * PORT 1: WEB WEAVER — BRIDGER — FUSE
 *
 * Gen87.X3 | Phase: INTERLOCK (I) | Authority Registry
 *
 * @port 1
 * @binary 001
 * @trigram ☶ Gen (Mountain)
 * @element Mountain - Stable interface, gateway, boundary
 * @verb FUSE - Connection without transformation
 * @jadc2 Gateways - Transport, routing
 * @stigmergy Boundary - Define interface edges
 * @mantra "How do we FUSE the FUSE?"
 * @secret "The bridge that builds itself"
 *
 * CAN: read, validate, compose, route
 * CANNOT: persist, decide, skip_validation
 *
 * ## DOMAIN
 *
 * Port 1 owns ALL validation and schema contracts:
 * - Zod schema validation utilities
 * - Port boundary validators (valguards)
 * - Schema registry for runtime lookup
 * - Contract composition helpers
 *
 * ## PRINCIPLE: Total Tool Virtualization
 *
 * Web Weaver NEVER transforms data. It only:
 * 1. VALIDATES data at port boundaries
 * 2. ROUTES data to correct ports
 * 3. COMPOSES adapters polymorphically
 *
 * Data transformation is Port 2 (Mirror Magus).
 *
 * @source Zod: https://zod.dev/
 * @source Design by Contract: Meyer (1992)
 */
import { ZodError, ZodSchema, z } from 'zod';

// Re-export Zod for convenience
export { z, ZodSchema, ZodError };

// ============================================================================
// SCHEMA IMPORTS FROM OTHER PORTS (For registry)
// ============================================================================

// Port 0 schemas (SENSE)
import {
	CameraConstraintsSchema,
	GestureLabels,
	HandLandmarksSchema,
	MediaPipeConfigSchema,
	NormalizedLandmarkSchema,
	type SensorFrame,
	SensorFrameSchema,
	VideoFrameSchema,
} from './port-0-lidless-legion.js';

// Core schemas (from schemas.ts - will migrate to port files)
import {
	AdapterTargetSchema,
	type FSMAction,
	FSMActionSchema,
	type PointerEventOut,
	PointerEventOutSchema,
	type SmoothedFrame,
	SmoothedFrameSchema,
} from './schemas.js';

// ============================================================================
// VALGUARD TYPES (Runtime validation at port boundaries)
// ============================================================================

/**
 * Validation result with detailed error information
 */
export interface ValguardResult<T> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		path: (string | number)[];
		issues: z.ZodIssue[];
	};
}

/**
 * Valguard function type - validates and returns typed result
 */
export type Valguard<T> = (input: unknown) => ValguardResult<T>;

// ============================================================================
// VALGUARD FACTORY (Creates type-safe validators from Zod schemas)
// ============================================================================

/**
 * Create a valguard from a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param name - Optional name for error messages
 * @returns Valguard function
 *
 * @example
 * ```typescript
 * const validateSensorFrame = createValguard(SensorFrameSchema, 'SensorFrame');
 * const result = validateSensorFrame(unknownData);
 * if (result.success) {
 *   // result.data is typed as SensorFrame
 * }
 * ```
 */
export function createValguard<T>(schema: ZodSchema<T>, name?: string): Valguard<T> {
	return (input: unknown): ValguardResult<T> => {
		const result = schema.safeParse(input);

		if (result.success) {
			return { success: true, data: result.data };
		}

		return {
			success: false,
			error: {
				message: name ? `Invalid ${name}` : 'Validation failed',
				path: result.error.issues[0]?.path ?? [],
				issues: result.error.issues,
			},
		};
	};
}

/**
 * Create a valguard that throws on validation failure
 *
 * @param schema - Zod schema to validate against
 * @param name - Optional name for error messages
 * @returns Function that returns typed data or throws
 */
export function createStrictValguard<T>(
	schema: ZodSchema<T>,
	name?: string,
): (input: unknown) => T {
	return (input: unknown): T => {
		const result = schema.safeParse(input);
		if (result.success) {
			return result.data;
		}
		const errorMsg = name ? `Invalid ${name}: ` : 'Validation failed: ';
		throw new Error(errorMsg + result.error.issues.map((i) => i.message).join(', '));
	};
}

// ============================================================================
// PRE-BUILT VALGUARDS (Port boundary validators)
// ============================================================================

/** Validate SensorFrame (Port 0 → Port 2 boundary) */
export const validateSensorFrame = createValguard(SensorFrameSchema, 'SensorFrame');

/** Validate SmoothedFrame (Port 2 → Port 3 boundary) */
export const validateSmoothedFrame = createValguard(SmoothedFrameSchema, 'SmoothedFrame');

/** Validate FSMAction (Port 3 → Port 5 boundary) */
export const validateFSMAction = createValguard(FSMActionSchema, 'FSMAction');

/** Validate PointerEventOut (Port 5 → DOM boundary) */
export const validatePointerEvent = createValguard(PointerEventOutSchema, 'PointerEventOut');

/** Validate CameraConstraints (external → Port 0 boundary) */
export const validateCameraConstraints = createValguard(
	CameraConstraintsSchema,
	'CameraConstraints',
);

/** Validate MediaPipeConfig (external → Port 0 boundary) */
export const validateMediaPipeConfig = createValguard(MediaPipeConfigSchema, 'MediaPipeConfig');

// ============================================================================
// SCHEMA REGISTRY (Runtime schema lookup by port)
// ============================================================================

/**
 * Port schema registry entry
 */
export interface PortSchemaEntry {
	/** Port number */
	port: number;
	/** Port name */
	name: string;
	/** Input schemas (what this port accepts) */
	input: Record<string, ZodSchema>;
	/** Output schemas (what this port emits) */
	output: Record<string, ZodSchema>;
}

/**
 * Schema registry - lookup schemas by port number
 */
export const SCHEMA_REGISTRY: Record<number, PortSchemaEntry> = {
	0: {
		port: 0,
		name: 'Lidless Legion (SENSE)',
		input: {
			VideoFrame: VideoFrameSchema,
			CameraConstraints: CameraConstraintsSchema,
			MediaPipeConfig: MediaPipeConfigSchema,
		},
		output: {
			SensorFrame: SensorFrameSchema,
		},
	},
	1: {
		port: 1,
		name: 'Web Weaver (FUSE)',
		input: {
			// Port 1 validates ALL schemas - it's the gateway
		},
		output: {
			// Port 1 doesn't transform - it routes
		},
	},
	2: {
		port: 2,
		name: 'Mirror Magus (SHAPE)',
		input: {
			SensorFrame: SensorFrameSchema,
		},
		output: {
			SmoothedFrame: SmoothedFrameSchema,
		},
	},
	3: {
		port: 3,
		name: 'Spore Storm (DELIVER)',
		input: {
			SmoothedFrame: SmoothedFrameSchema,
		},
		output: {
			FSMAction: FSMActionSchema,
		},
	},
	5: {
		port: 5,
		name: 'Pyre Praetorian (DEFEND)',
		input: {
			FSMAction: FSMActionSchema,
		},
		output: {
			PointerEventOut: PointerEventOutSchema,
		},
	},
};

/**
 * Get schemas for a specific port
 */
export function getPortSchemas(port: number): PortSchemaEntry | undefined {
	return SCHEMA_REGISTRY[port];
}

/**
 * Validate data against a port's input schema
 */
export function validatePortInput<T>(
	port: number,
	schemaName: string,
	data: unknown,
): ValguardResult<T> {
	const entry = SCHEMA_REGISTRY[port];
	if (!entry) {
		return {
			success: false,
			error: { message: `Unknown port: ${port}`, path: [], issues: [] },
		};
	}

	const schema = entry.input[schemaName];
	if (!schema) {
		return {
			success: false,
			error: { message: `Unknown schema: ${schemaName} for port ${port}`, path: [], issues: [] },
		};
	}

	return createValguard(schema, `${entry.name}.${schemaName}`)(data) as ValguardResult<T>;
}

// ============================================================================
// PORT CONTRACT TYPES (What each port accepts/emits)
// ============================================================================

/**
 * Port contract definition
 */
export interface PortContract<TInput, TOutput> {
	/** Port number */
	port: number;
	/** Validate input */
	validateInput: Valguard<TInput>;
	/** Validate output */
	validateOutput: Valguard<TOutput>;
}

/**
 * Port 0 → Port 2 contract (Sensor to Smoother)
 */
export const PORT_0_TO_2_CONTRACT: PortContract<SensorFrame, SensorFrame> = {
	port: 0,
	validateInput: validateSensorFrame,
	validateOutput: validateSensorFrame,
};

/**
 * Port 2 → Port 3 contract (Smoother to FSM)
 */
export const PORT_2_TO_3_CONTRACT: PortContract<SmoothedFrame, SmoothedFrame> = {
	port: 2,
	validateInput: validateSmoothedFrame,
	validateOutput: validateSmoothedFrame,
};

/**
 * Port 3 → Port 5 contract (FSM to Emitter)
 */
export const PORT_3_TO_5_CONTRACT: PortContract<FSMAction, FSMAction> = {
	port: 3,
	validateInput: validateFSMAction,
	validateOutput: validateFSMAction,
};

// ============================================================================
// SCHEMA COMPOSITION HELPERS
// ============================================================================

/**
 * Compose two schemas with pipe (input → transform → output)
 * Port 1 doesn't transform, but helps WIRE transformations
 */
export function composeSchemas<TIn, TOut>(
	inputSchema: ZodSchema<TIn>,
	outputSchema: ZodSchema<TOut>,
	transform: (input: TIn) => TOut,
): (input: unknown) => ValguardResult<TOut> {
	return (input: unknown): ValguardResult<TOut> => {
		// Validate input
		const inputResult = inputSchema.safeParse(input);
		if (!inputResult.success) {
			return {
				success: false,
				error: {
					message: 'Input validation failed',
					path: inputResult.error.issues[0]?.path ?? [],
					issues: inputResult.error.issues,
				},
			};
		}

		// Transform
		const transformed = transform(inputResult.data);

		// Validate output
		const outputResult = outputSchema.safeParse(transformed);
		if (!outputResult.success) {
			return {
				success: false,
				error: {
					message: 'Output validation failed',
					path: outputResult.error.issues[0]?.path ?? [],
					issues: outputResult.error.issues,
				},
			};
		}

		return { success: true, data: outputResult.data };
	};
}

// ============================================================================
// PORT 1 METADATA
// ============================================================================

/**
 * Port 1 metadata for runtime reflection
 */
export const PORT_1_METADATA = {
	port: 1,
	name: 'Web Weaver',
	binary: '001',
	trigram: '☶',
	element: 'Mountain',
	verb: 'FUSE',
	jadc2: 'Gateways',
	stigmergy: 'Boundary',
	mantra: 'How do we FUSE the FUSE?',
	secret: 'The bridge that builds itself',
	capabilities: {
		can: ['read', 'validate', 'compose', 'route'],
		cannot: ['persist', 'decide', 'skip_validation'],
	},
	utilities: [
		'createValguard',
		'createStrictValguard',
		'validateSensorFrame',
		'validateSmoothedFrame',
		'validateFSMAction',
		'validatePointerEvent',
		'SCHEMA_REGISTRY',
		'composeSchemas',
	],
} as const;

// ============================================================================
// RE-EXPORTS (Convenience access to schemas through Port 1)
// ============================================================================

// Re-export Port 0 schemas
export {
	CameraConstraintsSchema,
	VideoFrameSchema,
	MediaPipeConfigSchema,
	NormalizedLandmarkSchema,
	HandLandmarksSchema,
	GestureLabels,
	SensorFrameSchema,
	type SensorFrame,
};

// Re-export core schemas
export {
	SmoothedFrameSchema,
	FSMActionSchema,
	PointerEventOutSchema,
	AdapterTargetSchema,
	type SmoothedFrame,
	type FSMAction,
	type PointerEventOut,
};
