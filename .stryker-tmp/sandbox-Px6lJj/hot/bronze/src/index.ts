// @ts-nocheck
// Gen87.X3 - Initial source file
// This ensures TypeScript compilation works

export const HFO_VERSION = '87.3.0';
export const HFO_GEN = 87;

/**
 * HIVE/8 Phases
 */
export type HivePhase = 'H' | 'I' | 'V' | 'E';

/**
 * Get phase description
 */
export function getPhaseDescription(phase: HivePhase): string {
	const descriptions: Record<HivePhase, string> = {
		H: 'Hunt - Research and planning',
		I: 'Interlock - TDD RED (write failing tests)',
		V: 'Validate - TDD GREEN (make tests pass)',
		E: 'Evolve - TDD REFACTOR (clean up)',
	};
	return descriptions[phase];
}

/**
 * Commander type
 */
export type Commander = {
	port: number;
	name: string;
	verb: string;
	phase: HivePhase;
};

/**
 * The 8 Legendary Commanders
 */
export const COMMANDERS: Commander[] = [
	{ port: 0, name: 'Lidless Legion', verb: 'SENSE', phase: 'H' },
	{ port: 1, name: 'Web Weaver', verb: 'FUSE', phase: 'I' },
	{ port: 2, name: 'Mirror Magus', verb: 'SHAPE', phase: 'V' },
	{ port: 3, name: 'Spore Storm', verb: 'DELIVER', phase: 'E' },
	{ port: 4, name: 'Red Regnant', verb: 'TEST', phase: 'E' },
	{ port: 5, name: 'Pyre Praetorian', verb: 'DEFEND', phase: 'V' },
	{ port: 6, name: 'Kraken Keeper', verb: 'STORE', phase: 'I' },
	{ port: 7, name: 'Spider Sovereign', verb: 'DECIDE', phase: 'H' },
] as const;
