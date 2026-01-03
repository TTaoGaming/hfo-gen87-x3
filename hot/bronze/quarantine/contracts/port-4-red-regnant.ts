import type { VacuoleEnvelope } from '../../src/contracts/vacuole-envelope.js';

/**
 * PORT 4: RED REGNANT (DISRUPTOR) - The Red Queen
 *
 * Gen87.X3 | Port 4 | TEST
 *
 * "How do we TEST the TEST?"
 *
 * Red Regnant is evolutionary pressure incarnate.
 * She monitors the health of testing and enforces the "Red Region" defense.
 *
 * Dimension: 100 (Binary) | Element: Thunder (☳) | Verb: TEST
 */

export interface MutationResult {
	score: number; // 0.0 - 1.0 (e.g. 0.85 for 85%)
	survived: number;
	killed: number;
	timeout: number;
	noCoverage: number;
	runtimeError: number;
	totalMutants: number;
	files: string[];
}

export interface PropertyResult {
	passed: boolean;
	testCount: number;
	failureReason?: string;
	counterExample?: any;
	seed?: number;
	path?: string;
}

export interface RedRegnantPort {
	/**
	 * Run mutation testing (Stryker) on a target file or directory
	 * Enforces evolutionary pressure by attempting to break the implementation.
	 */
	mutate(target: string): Promise<VacuoleEnvelope<MutationResult>>;

	/**
	 * Run property-based testing (fast-check) on a target
	 * Validates invariants across the entire input space.
	 */
	verifyProperties(target: string): Promise<VacuoleEnvelope<PropertyResult>>;

	/**
	 * Audit a module for "Theater Code", "Fake Green", or "Cosmetic Compliance"
	 * The Red Queen's gaze reveals the truth behind the green checkmarks.
	 */
	audit(target: string): Promise<
		VacuoleEnvelope<{
			verdict: 'CRITICAL' | 'FAILING' | 'MARGINAL' | 'PASSING' | 'EXCELLENT';
			truthRatio: number; // trueGreen / totalTests
			fakeGreenCount: number;
			violations: Array<{
				type: string;
				message: string;
				file: string;
				line?: number;
			}>;
		}>
	>;
}
