/**
 * Red Regnant Test Budget Configuration
 *
 * This file defines the authority for test execution limits.
 * It is the responsibility of the Red Regnant (Port 4) to ensure
 * that tests are fast enough for continuous mutation testing.
 */

/**
 * Default number of runs for property-based tests (fast-check).
 * Reduced from 100 to 10 to speed up mutation testing cycles.
 */
export const RED_REGNANT_PROPERTY_RUNS = Number(process.env.VITEST_MAX_RUNS) || 10;

/**
 * Budget for mutation testing.
 */
export const MUTATION_BUDGET = {
	maxSurvivors: 20,
	minScore: 80,
};
