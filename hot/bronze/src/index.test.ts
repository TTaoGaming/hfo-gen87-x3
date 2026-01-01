import { describe, expect, it } from 'vitest';
import { COMMANDERS, type Commander, HFO_GEN, HFO_VERSION, getPhaseDescription } from './index.js';

describe('HFO Gen87.X3', () => {
	describe('Version', () => {
		it('should have correct version', () => {
			expect(HFO_VERSION).toBe('87.3.0');
		});

		it('should have correct generation', () => {
			expect(HFO_GEN).toBe(87);
		});
	});

	describe('HIVE Phases', () => {
		it('should describe H phase', () => {
			expect(getPhaseDescription('H')).toContain('Hunt');
		});

		it('should describe I phase', () => {
			expect(getPhaseDescription('I')).toContain('RED');
		});

		it('should describe V phase', () => {
			expect(getPhaseDescription('V')).toContain('GREEN');
		});

		it('should describe E phase', () => {
			expect(getPhaseDescription('E')).toContain('REFACTOR');
		});
	});

	describe('Commanders', () => {
		it('should have 8 commanders', () => {
			expect(COMMANDERS).toHaveLength(8);
		});

		it('should have ports 0-7', () => {
			const ports = COMMANDERS.map((c: Commander) => c.port);
			expect(ports).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
		});

		it('should have Spider Sovereign at port 7', () => {
			const port7 = COMMANDERS.find((c: Commander) => c.port === 7);
			expect(port7?.name).toBe('Spider Sovereign');
			expect(port7?.verb).toBe('DECIDE');
		});

		it('should have Pyre Praetorian at port 5', () => {
			const port5 = COMMANDERS.find((c: Commander) => c.port === 5);
			expect(port5?.name).toBe('Pyre Praetorian');
			expect(port5?.verb).toBe('DEFEND');
		});
	});
});
