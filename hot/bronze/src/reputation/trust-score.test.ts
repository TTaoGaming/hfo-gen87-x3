/**
 * Trust Score System - Automated Tests
 *
 * Port 4 | Red Regnant | REAL TESTS, NOT THEATER
 *
 * These tests verify the reputation system actually works.
 * Run with: npm test src/reputation/
 */

import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
	TRUST_PARAMS,
	type TrustEvent,
	calculateTrustFromBlackboard,
	countViolationsInBlackboard,
	createInitialTrustScore,
	enforceToolAccess,
	getAvailableTools,
	getTrustLevel,
	loadTrustScore,
	recordTrustEvent,
	saveTrustScore,
	updateTrustScore,
} from './trust-score.js';

describe('Trust Score System', () => {
	// ============================================================================
	// TRUST SCORE ALGORITHM TESTS
	// ============================================================================

	describe('updateTrustScore', () => {
		it('should increase score on verified action', () => {
			const initial = 0.5;
			const updated = updateTrustScore(initial, 'verified');

			// Formula: 0.5 * 0.95 + 0.1 = 0.575
			expect(updated).toBeCloseTo(0.575, 3);
		});

		it('should decrease score sharply on violation', () => {
			const initial = 0.5;
			const updated = updateTrustScore(initial, 'violation');

			// Formula: 0.5 * 0.95 - 0.3 = 0.175
			expect(updated).toBeCloseTo(0.175, 3);
		});

		it('should not exceed MAX_SCORE', () => {
			const high = 0.95;
			const updated = updateTrustScore(high, 'verified');

			expect(updated).toBeLessThanOrEqual(TRUST_PARAMS.MAX_SCORE);
		});

		it('should not go below MIN_SCORE', () => {
			const low = 0.1;
			const updated = updateTrustScore(low, 'violation');

			expect(updated).toBeGreaterThanOrEqual(TRUST_PARAMS.MIN_SCORE);
		});

		it('should require multiple verified actions to recover from violation', () => {
			let score = 0.8;

			// One violation drops it significantly
			score = updateTrustScore(score, 'violation');
			expect(score).toBeLessThan(0.5);

			// Multiple verified actions to recover
			score = updateTrustScore(score, 'verified');
			score = updateTrustScore(score, 'verified');
			score = updateTrustScore(score, 'verified');
			score = updateTrustScore(score, 'verified');

			// Still not back to 0.8
			expect(score).toBeLessThan(0.8);
		});
	});

	// ============================================================================
	// TRUST LEVEL TESTS
	// ============================================================================

	describe('getTrustLevel', () => {
		it('should return full access for high trust', () => {
			expect(getTrustLevel(0.85)).toBe('full');
			expect(getTrustLevel(0.9)).toBe('full');
			expect(getTrustLevel(1.0)).toBe('full');
		});

		it('should return read-only for medium trust', () => {
			expect(getTrustLevel(0.5)).toBe('read-only');
			expect(getTrustLevel(0.6)).toBe('read-only');
			expect(getTrustLevel(0.79)).toBe('read-only');
		});

		it('should return quarantine for low trust', () => {
			expect(getTrustLevel(0.1)).toBe('quarantine');
			expect(getTrustLevel(0.19)).toBe('quarantine');
			expect(getTrustLevel(0.0)).toBe('quarantine');
		});

		it('should use custom thresholds', () => {
			const strictThresholds = {
				fullAccess: 0.95,
				readOnly: 0.7,
				quarantine: 0.3,
			};

			expect(getTrustLevel(0.85, strictThresholds)).toBe('read-only');
			expect(getTrustLevel(0.5, strictThresholds)).toBe('quarantine');
		});
	});

	// ============================================================================
	// TOOL ACCESS TESTS
	// ============================================================================

	describe('getAvailableTools', () => {
		it('should return all tools for full access', () => {
			const tools = getAvailableTools('full');

			expect(tools).toContain('read_file');
			expect(tools).toContain('create_file');
			expect(tools).toContain('replace_string_in_file');
			expect(tools).toContain('run_in_terminal');
		});

		it('should return only read tools for read-only', () => {
			const tools = getAvailableTools('read-only');

			expect(tools).toContain('read_file');
			expect(tools).toContain('grep_search');
			expect(tools).not.toContain('create_file');
			expect(tools).not.toContain('run_in_terminal');
		});

		it('should return empty array for quarantine', () => {
			const tools = getAvailableTools('quarantine');

			expect(tools).toHaveLength(0);
		});
	});

	// ============================================================================
	// BLACKBOARD INTEGRATION TESTS
	// ============================================================================

	describe('Blackboard Integration', () => {
		const testBlackboardPath = 'test-blackboard-trust.jsonl';

		afterEach(() => {
			if (existsSync(testBlackboardPath)) {
				unlinkSync(testBlackboardPath);
			}
		});

		it('should count violations in blackboard', () => {
			const signals = [
				{
					ts: '2025-01-01T00:00:00Z',
					mark: 1,
					pull: 'downstream',
					msg: 'Good signal',
					type: 'signal',
					hive: 'H',
					gen: 87,
					port: 0,
				},
				{
					ts: '2025-01-01T00:01:00Z',
					mark: 0.3,
					pull: 'upstream',
					msg: 'VIOLATION: SKIPPED_HUNT',
					type: 'error',
					hive: 'X',
					gen: 87,
					port: 5,
				},
				{
					ts: '2025-01-01T00:02:00Z',
					mark: 1,
					pull: 'downstream',
					msg: 'Another good',
					type: 'signal',
					hive: 'I',
					gen: 87,
					port: 1,
				},
				{
					ts: '2025-01-01T00:03:00Z',
					mark: 0.3,
					pull: 'upstream',
					msg: 'REWARD_HACK detected',
					type: 'error',
					hive: 'X',
					gen: 87,
					port: 5,
				},
			];

			writeFileSync(testBlackboardPath, signals.map((s) => JSON.stringify(s)).join('\n'));

			const { violations, total } = countViolationsInBlackboard(testBlackboardPath);

			expect(violations).toBe(2);
			expect(total).toBe(4);
		});

		it('should calculate trust from blackboard', () => {
			// 2 violations out of 10 signals = 80% clean = 0.8 trust
			const signals = Array.from({ length: 8 }, (_, i) => ({
				ts: `2025-01-01T00:0${i}:00Z`,
				mark: 1,
				pull: 'downstream',
				msg: `Signal ${i}`,
				type: 'signal',
				hive: 'H',
				gen: 87,
				port: 0,
			}));

			// Add 2 violations
			signals.push({
				ts: '2025-01-01T00:08:00Z',
				mark: 0.3,
				pull: 'upstream',
				msg: 'VIOLATION',
				type: 'error',
				hive: 'X',
				gen: 87,
				port: 5,
			});
			signals.push({
				ts: '2025-01-01T00:09:00Z',
				mark: 0.3,
				pull: 'upstream',
				msg: 'VIOLATION',
				type: 'error',
				hive: 'X',
				gen: 87,
				port: 5,
			});

			writeFileSync(testBlackboardPath, signals.map((s) => JSON.stringify(s)).join('\n'));

			const trust = calculateTrustFromBlackboard(testBlackboardPath);

			expect(trust).toBeCloseTo(0.8, 1);
		});

		it('should return initial score for empty blackboard', () => {
			const trust = calculateTrustFromBlackboard('nonexistent-blackboard.jsonl');

			expect(trust).toBe(TRUST_PARAMS.INITIAL_SCORE);
		});
	});

	// ============================================================================
	// ENFORCEMENT TESTS - THE TEETH
	// ============================================================================

	describe('enforceToolAccess', () => {
		const testBlackboardPath = 'test-blackboard-enforce.jsonl';

		afterEach(() => {
			if (existsSync(testBlackboardPath)) {
				unlinkSync(testBlackboardPath);
			}
		});

		it('should allow all tools when trust is high', () => {
			// 0 violations = 100% trust
			const signals = Array.from({ length: 10 }, (_, i) => ({
				ts: `2025-01-01T00:0${i}:00Z`,
				mark: 1,
				pull: 'downstream',
				msg: `Clean signal ${i}`,
				type: 'signal',
				hive: 'H',
				gen: 87,
				port: 0,
			}));

			writeFileSync(testBlackboardPath, signals.map((s) => JSON.stringify(s)).join('\n'));

			const result = enforceToolAccess('create_file', testBlackboardPath);

			expect(result.allowed).toBe(true);
			expect(result.trustLevel).toBe('full');
		});

		it('should block write tools when trust is medium', () => {
			// 4 violations out of 10 = 60% clean = 0.6 trust = read-only
			const signals = Array.from({ length: 6 }, (_, i) => ({
				ts: `2025-01-01T00:0${i}:00Z`,
				mark: 1,
				pull: 'downstream',
				msg: `Clean signal ${i}`,
				type: 'signal',
				hive: 'H',
				gen: 87,
				port: 0,
			}));

			// Add 4 violations
			for (let i = 0; i < 4; i++) {
				signals.push({
					ts: `2025-01-01T00:1${i}:00Z`,
					mark: 0.3,
					pull: 'upstream',
					msg: 'VIOLATION',
					type: 'error',
					hive: 'X',
					gen: 87,
					port: 5,
				});
			}

			writeFileSync(testBlackboardPath, signals.map((s) => JSON.stringify(s)).join('\n'));

			const createResult = enforceToolAccess('create_file', testBlackboardPath);
			const readResult = enforceToolAccess('read_file', testBlackboardPath);

			expect(createResult.allowed).toBe(false);
			expect(createResult.trustLevel).toBe('read-only');
			expect(readResult.allowed).toBe(true);
		});

		it('should block ALL tools in quarantine', () => {
			// 9 violations out of 10 = 10% clean = 0.1 trust = quarantine
			const signals = [
				{
					ts: '2025-01-01T00:00:00Z',
					mark: 1,
					pull: 'downstream',
					msg: 'One good signal',
					type: 'signal',
					hive: 'H',
					gen: 87,
					port: 0,
				},
			];

			// Add 9 violations
			for (let i = 0; i < 9; i++) {
				signals.push({
					ts: `2025-01-01T00:0${i + 1}:00Z`,
					mark: 0.3,
					pull: 'upstream',
					msg: 'VIOLATION',
					type: 'error',
					hive: 'X',
					gen: 87,
					port: 5,
				});
			}

			writeFileSync(testBlackboardPath, signals.map((s) => JSON.stringify(s)).join('\n'));

			const readResult = enforceToolAccess('read_file', testBlackboardPath);

			expect(readResult.allowed).toBe(false);
			expect(readResult.trustLevel).toBe('quarantine');
			expect(readResult.availableTools).toHaveLength(0);
		});
	});

	// ============================================================================
	// PERSISTENCE TESTS
	// ============================================================================

	describe('Trust Score Persistence', () => {
		const testReputationPath = 'test-reputation.jsonl';

		afterEach(() => {
			if (existsSync(testReputationPath)) {
				unlinkSync(testReputationPath);
			}
		});

		it('should create initial trust score', () => {
			const trust = createInitialTrustScore('claude-opus-4.5', 'session-123');

			expect(trust.score).toBe(TRUST_PARAMS.INITIAL_SCORE);
			expect(trust.violations).toBe(0);
			expect(trust.verified).toBe(0);
			expect(trust.history).toHaveLength(0);
		});

		it('should record trust events', () => {
			let trust = createInitialTrustScore('claude-opus-4.5', 'session-123');

			const event: TrustEvent = {
				ts: new Date().toISOString(),
				type: 'verified',
				action: 'create_file',
				proof: 'file exists at path',
			};

			trust = recordTrustEvent(trust, event);

			expect(trust.verified).toBe(1);
			expect(trust.history).toHaveLength(1);
			expect(trust.score).toBeGreaterThan(TRUST_PARAMS.INITIAL_SCORE);
		});

		it('should save and load trust score', () => {
			const original = createInitialTrustScore('claude-opus-4.5', 'session-456');
			saveTrustScore(original, testReputationPath);

			const loaded = loadTrustScore('session-456', testReputationPath);

			expect(loaded).not.toBeNull();
			expect(loaded?.sessionId).toBe('session-456');
			expect(loaded?.score).toBe(original.score);
		});
	});
});
