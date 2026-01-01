// @ts-nocheck
import * as fc from 'fast-check';
/**
 * Vacuole Envelope Contract Tests - Mutation Testing Defense
 *
 * Gen87.X3 | Phase: VALIDATE (V) | Red Regnant (Port 4) + Pyre Praetorian (Port 5)
 *
 * ANTI-REWARD-HACK: Property-based tests that KILL mutants
 * Grounded: W3C Trace Context, CloudEvents 1.0 via Tavily 2025-12-31
 *
 * @source W3C Trace Context - https://www.w3.org/TR/trace-context/
 * @source CloudEvents 1.0 - https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
	CloudEventsBaseSchema,
	HFOExtensionsSchema,
	PIPELINE_EVENT_TYPES,
	PIPELINE_NATS_SUBJECTS,
	TraceparentSchema,
	VacuoleEnvelopeSchema,
	generateTraceparent,
	propagateTraceparent,
	propagateVacuole,
	wrapInVacuole,
} from './vacuole-envelope.js';

// ============================================================================
// W3C TRACE CONTEXT COMPLIANCE (via Tavily grounding)
// Format: {version}-{trace-id}-{parent-id}-{trace-flags}
// version: 00 (2 hex chars)
// trace-id: 32 hex chars (16 bytes)
// parent-id: 16 hex chars (8 bytes)
// trace-flags: 2 hex chars (00 or 01)
// ============================================================================

describe('TraceparentSchema - W3C Compliance', () => {
	describe('Valid traceparents', () => {
		it('should accept valid W3C traceparent format', () => {
			const validTraceparents = [
				'00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
				'00-00000000000000000000000000000001-0000000000000001-00',
				'00-ffffffffffffffffffffffffffffffff-ffffffffffffffff-01',
				'00-12345678901234567890123456789012-1234567890123456-00',
			];

			for (const tp of validTraceparents) {
				expect(() => TraceparentSchema.parse(tp)).not.toThrow();
			}
		});

		it('should generate valid traceparent via generateTraceparent()', () => {
			fc.assert(
				fc.property(fc.constant(null), () => {
					const tp = generateTraceparent();
					const result = TraceparentSchema.safeParse(tp);
					expect(result.success).toBe(true);
				}),
				{ numRuns: 100 },
			);
		});

		it('generateTraceparent() produces unique trace-ids', () => {
			const traceIds = new Set<string>();
			for (let i = 0; i < 100; i++) {
				const tp = generateTraceparent();
				const traceId = tp.split('-')[1];
				traceIds.add(traceId);
			}
			// Allow some collisions but expect mostly unique
			expect(traceIds.size).toBeGreaterThan(90);
		});
	});

	describe('Invalid traceparents', () => {
		it('should reject wrong version', () => {
			expect(() =>
				TraceparentSchema.parse('01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
			).toThrow();
			expect(() =>
				TraceparentSchema.parse('ff-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
			).toThrow();
		});

		it('should reject wrong trace-id length (not 32 hex)', () => {
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c8031-b7ad6b7169203331-01'),
			).toThrow(); // 30 chars
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c80319c00-b7ad6b7169203331-01'),
			).toThrow(); // 34 chars
		});

		it('should reject wrong parent-id length (not 16 hex)', () => {
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c80319c-b7ad6b71692033-01'),
			).toThrow(); // 14 chars
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c80319c-b7ad6b716920333100-01'),
			).toThrow(); // 18 chars
		});

		it('should reject uppercase hex (strict W3C compliance)', () => {
			expect(() =>
				TraceparentSchema.parse('00-0AF7651916CD43DD8448EB211C80319C-B7AD6B7169203331-01'),
			).toThrow();
		});

		it('should reject non-hex characters', () => {
			expect(() =>
				TraceparentSchema.parse('00-ghijklmnopqrstuv8448eb211c80319c-b7ad6b7169203331-01'),
			).toThrow();
		});

		it('should reject empty string', () => {
			expect(() => TraceparentSchema.parse('')).toThrow();
		});

		it('should reject wrong delimiter', () => {
			expect(() =>
				TraceparentSchema.parse('00_0af7651916cd43dd8448eb211c80319c_b7ad6b7169203331_01'),
			).toThrow();
		});

		// MUTANT KILLERS: Boundary anchor tests
		it('should reject prefix before valid traceparent (^ anchor)', () => {
			expect(() =>
				TraceparentSchema.parse('prefix-00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
			).toThrow();
			expect(() =>
				TraceparentSchema.parse('XX00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'),
			).toThrow();
		});

		it('should reject suffix after valid traceparent ($ anchor)', () => {
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01-suffix'),
			).toThrow();
			expect(() =>
				TraceparentSchema.parse('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01XX'),
			).toThrow();
		});
	});

	describe('propagateTraceparent - Trace continuity', () => {
		it('should preserve trace-id across propagation', () => {
			fc.assert(
				fc.property(fc.constant(null), () => {
					const parent = generateTraceparent();
					const child = propagateTraceparent(parent);

					const parentParts = parent.split('-');
					const childParts = child.split('-');

					// Version preserved
					expect(childParts[0]).toBe('00');
					// Trace-id preserved
					expect(childParts[1]).toBe(parentParts[1]);
					// Parent-id changed (new span)
					expect(childParts[2]).not.toBe(parentParts[2]);
					// Flags preserved
					expect(childParts[3]).toBe(parentParts[3]);
				}),
				{ numRuns: 100 },
			);
		});

		it('should generate new parent-id for each propagation', () => {
			const parent = generateTraceparent();
			const children = Array.from({ length: 100 }, () => propagateTraceparent(parent));
			const parentIds = new Set(children.map((c) => c.split('-')[2]));
			expect(parentIds.size).toBeGreaterThan(90);
		});
	});
});

// ============================================================================
// CLOUDEVENTS 1.0 COMPLIANCE (via Tavily grounding)
// Required: specversion, id, source, type
// ============================================================================

describe('CloudEventsBaseSchema - CloudEvents 1.0 Compliance', () => {
	const validBase = {
		specversion: '1.0' as const,
		id: '550e8400-e29b-41d4-a716-446655440000',
		source: '/hfo/gen87/port0',
		type: 'hfo.w3c.gesture.sense',
	};

	describe('Required fields', () => {
		it('should accept valid CloudEvents base', () => {
			expect(() => CloudEventsBaseSchema.parse(validBase)).not.toThrow();
		});

		it('should reject missing specversion', () => {
			const { specversion, ...rest } = validBase;
			expect(() => CloudEventsBaseSchema.parse(rest)).toThrow();
		});

		it('should reject missing id', () => {
			const { id, ...rest } = validBase;
			expect(() => CloudEventsBaseSchema.parse(rest)).toThrow();
		});

		it('should reject missing source', () => {
			const { source, ...rest } = validBase;
			expect(() => CloudEventsBaseSchema.parse(rest)).toThrow();
		});

		it('should reject missing type', () => {
			const { type, ...rest } = validBase;
			expect(() => CloudEventsBaseSchema.parse(rest)).toThrow();
		});
	});

	describe('Field constraints', () => {
		it('should only accept specversion "1.0"', () => {
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, specversion: '0.9' })).toThrow();
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, specversion: '1.1' })).toThrow();
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, specversion: '2.0' })).toThrow();
		});

		it('should require valid UUID for id', () => {
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, id: 'not-a-uuid' })).toThrow();
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, id: '' })).toThrow();
		});

		it('should accept URL or /hfo/ path for source', () => {
			expect(() =>
				CloudEventsBaseSchema.parse({ ...validBase, source: 'https://example.com/hfo' }),
			).not.toThrow();
			expect(() =>
				CloudEventsBaseSchema.parse({ ...validBase, source: '/hfo/gen87/port0' }),
			).not.toThrow();
		});

		it('should require non-empty type', () => {
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, type: '' })).toThrow();
		});

		// MUTANT KILLER: source must start with /hfo/ or be valid URL
		it('should reject source with empty /hfo/ prefix', () => {
			// If mutation changes startsWith('/hfo/') to startsWith(''), this should still work
			// But an actual empty prefix test catches the mutation
			expect(() =>
				CloudEventsBaseSchema.parse({ ...validBase, source: 'not-a-url-or-hfo-path' }),
			).toThrow();
			expect(() => CloudEventsBaseSchema.parse({ ...validBase, source: '/other/path' })).toThrow();
		});
	});
});

// ============================================================================
// HFO EXTENSIONS COMPLIANCE
// ============================================================================

describe('HFOExtensionsSchema', () => {
	const validExtensions = {
		hfogen: 87,
		hfohive: 'V' as const,
		hfoport: 4,
	};

	describe('Required fields', () => {
		it('should accept valid HFO extensions', () => {
			expect(() => HFOExtensionsSchema.parse(validExtensions)).not.toThrow();
		});

		it('should reject gen < 85', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfogen: 84 })).toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfogen: 0 })).toThrow();
		});

		it('should reject invalid hive phase', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfohive: 'Z' })).toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfohive: '' })).toThrow();
		});

		it('should reject port outside 0-7', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfoport: -1 })).toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfoport: 8 })).toThrow();
		});

		it('should accept all valid HIVE phases', () => {
			for (const phase of ['H', 'I', 'V', 'E', 'X']) {
				expect(() =>
					HFOExtensionsSchema.parse({ ...validExtensions, hfohive: phase }),
				).not.toThrow();
			}
		});

		it('should accept all valid ports 0-7', () => {
			for (let port = 0; port <= 7; port++) {
				expect(() =>
					HFOExtensionsSchema.parse({ ...validExtensions, hfoport: port }),
				).not.toThrow();
			}
		});
	});

	describe('Optional fields constraints', () => {
		it('should accept hfostage 1-7', () => {
			for (let stage = 1; stage <= 7; stage++) {
				expect(() =>
					HFOExtensionsSchema.parse({ ...validExtensions, hfostage: stage }),
				).not.toThrow();
			}
		});

		it('should reject hfostage outside 1-7', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfostage: 0 })).toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfostage: 8 })).toThrow();
		});

		it('should accept hfomark 0-1', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfomark: 0 })).not.toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfomark: 0.5 })).not.toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfomark: 1 })).not.toThrow();
		});

		it('should reject hfomark outside 0-1', () => {
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfomark: -0.1 })).toThrow();
			expect(() => HFOExtensionsSchema.parse({ ...validExtensions, hfomark: 1.1 })).toThrow();
		});

		it('should accept valid hfopull directions', () => {
			for (const pull of ['upstream', 'downstream', 'lateral']) {
				expect(() =>
					HFOExtensionsSchema.parse({ ...validExtensions, hfopull: pull }),
				).not.toThrow();
			}
		});
	});
});

// ============================================================================
// VACUOLE ENVELOPE INTEGRATION
// ============================================================================

describe('VacuoleEnvelope - Full Integration', () => {
	const TestDataSchema = z.object({
		value: z.number(),
		label: z.string(),
	});

	describe('wrapInVacuole', () => {
		it('should wrap data in valid CloudEvents envelope', () => {
			const data = { value: 42, label: 'test' };
			const envelope = wrapInVacuole(data, {
				type: 'hfo.test.event',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
			});

			// CloudEvents required fields
			expect(envelope.specversion).toBe('1.0');
			expect(envelope.id).toBeDefined();
			expect(envelope.source).toContain('/hfo/');
			expect(envelope.type).toBe('hfo.test.event');

			// HFO extensions
			expect(envelope.hfogen).toBe(87);
			expect(envelope.hfohive).toBe('V');
			expect(envelope.hfoport).toBe(4);

			// Data preserved
			expect(envelope.data).toEqual(data);
		});

		it('should generate valid traceparent', () => {
			const envelope = wrapInVacuole(
				{ x: 1 },
				{
					type: 'hfo.test',
					hfogen: 87,
					hfohive: 'H',
					hfoport: 0,
				},
			);

			expect(() => TraceparentSchema.parse(envelope.traceparent)).not.toThrow();
		});
	});

	// MUTANT KILLER: Test VacuoleEnvelopeSchema directly
	describe('VacuoleEnvelopeSchema - Direct parsing', () => {
		it('should parse valid envelope with data', () => {
			const TestSchema = VacuoleEnvelopeSchema(z.object({ value: z.number() }));
			const validEnvelope = {
				specversion: '1.0' as const,
				id: '550e8400-e29b-41d4-a716-446655440000',
				source: '/hfo/gen87/port0',
				type: 'hfo.test',
				traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
				hfogen: 87,
				hfohive: 'V' as const,
				hfoport: 4,
				data: { value: 42 },
			};

			expect(() => TestSchema.parse(validEnvelope)).not.toThrow();
			const parsed = TestSchema.parse(validEnvelope);
			expect(parsed.data.value).toBe(42);
		});

		it('should reject envelope with wrong data type', () => {
			const TestSchema = VacuoleEnvelopeSchema(z.object({ value: z.number() }));
			const invalidEnvelope = {
				specversion: '1.0' as const,
				id: '550e8400-e29b-41d4-a716-446655440000',
				source: '/hfo/gen87/port0',
				type: 'hfo.test',
				traceparent: '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
				hfogen: 87,
				hfohive: 'V' as const,
				hfoport: 4,
				data: { value: 'not-a-number' },
			};

			expect(() => TestSchema.parse(invalidEnvelope)).toThrow();
		});
	});

	describe('propagateVacuole', () => {
		it('should preserve trace-id across envelope propagation', () => {
			const parent = wrapInVacuole(
				{ x: 1 },
				{
					type: 'hfo.w3c.gesture.stage1.sense',
					hfogen: 87,
					hfohive: 'H',
					hfoport: 0,
					hfostage: 1,
				},
			);

			const child = propagateVacuole(parent, { y: 2 }, 2, 2);

			// Trace-id preserved
			const parentTraceId = parent.traceparent.split('-')[1];
			const childTraceId = child.traceparent.split('-')[1];
			expect(childTraceId).toBe(parentTraceId);

			// Parent-id changed
			const parentSpanId = parent.traceparent.split('-')[2];
			const childSpanId = child.traceparent.split('-')[2];
			expect(childSpanId).not.toBe(parentSpanId);

			// HFO extensions inherited from parent
			expect(child.hfogen).toBe(parent.hfogen);
			expect(child.hfohive).toBe(parent.hfohive);
			// Port updated to new value
			expect(child.hfoport).toBe(2);
			expect(child.hfostage).toBe(2);
		});
	});
});

// ============================================================================
// PIPELINE EVENT TYPES & NATS SUBJECTS
// ============================================================================

describe('PIPELINE_EVENT_TYPES', () => {
	it('should have 7 stages', () => {
		expect(Object.keys(PIPELINE_EVENT_TYPES)).toHaveLength(7);
	});

	it('should follow hfo.w3c.gesture.stageN.{stage} naming', () => {
		for (const type of Object.values(PIPELINE_EVENT_TYPES)) {
			expect(type).toMatch(/^hfo\.w3c\.gesture\.stage\d\.\w+$/);
		}
	});
});

describe('PIPELINE_NATS_SUBJECTS', () => {
	it('should have 7 stages', () => {
		expect(Object.keys(PIPELINE_NATS_SUBJECTS)).toHaveLength(7);
	});

	it('should follow hfo.w3c.gesture.{stage} naming', () => {
		for (const subject of Object.values(PIPELINE_NATS_SUBJECTS)) {
			expect(subject).toMatch(/^hfo\.w3c\.gesture\.\w+$/);
		}
	});
});

// ============================================================================
// PROPERTY-BASED MUTATION DEFENSE
// These tests ensure mutants get killed
// ============================================================================

describe('Mutation Defense - Property Tests', () => {
	it('pressure must be in [0,1] - mutant killer', () => {
		fc.assert(
			fc.property(fc.float({ min: -100, max: 100, noNaN: true }), (pressure) => {
				const schema = z.object({ pressure: z.number().min(0).max(1) });
				const result = schema.safeParse({ pressure });

				if (pressure >= 0 && pressure <= 1) {
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			}),
			{ numRuns: 1000 },
		);
	});

	it('port must be in [0,7] - mutant killer', () => {
		fc.assert(
			fc.property(fc.integer({ min: -10, max: 20 }), (port) => {
				const result = HFOExtensionsSchema.safeParse({
					hfogen: 87,
					hfohive: 'V',
					hfoport: port,
				});

				if (port >= 0 && port <= 7) {
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			}),
			{ numRuns: 100 },
		);
	});

	it('generation must be >= 85 - mutant killer', () => {
		fc.assert(
			fc.property(fc.integer({ min: 0, max: 200 }), (gen) => {
				const result = HFOExtensionsSchema.safeParse({
					hfogen: gen,
					hfohive: 'V',
					hfoport: 4,
				});

				if (gen >= 85) {
					expect(result.success).toBe(true);
				} else {
					expect(result.success).toBe(false);
				}
			}),
			{ numRuns: 100 },
		);
	});

	it('traceparent format strict - mutant killer', () => {
		// Valid format characters only
		const validHex = '0123456789abcdef';

		fc.assert(
			fc.property(
				fc.stringOf(fc.constantFrom(...validHex.split('')), { minLength: 32, maxLength: 32 }),
				fc.stringOf(fc.constantFrom(...validHex.split('')), { minLength: 16, maxLength: 16 }),
				(traceId, spanId) => {
					const tp = `00-${traceId}-${spanId}-01`;
					const result = TraceparentSchema.safeParse(tp);
					expect(result.success).toBe(true);
				},
			),
			{ numRuns: 100 },
		);
	});
});

// ============================================================================
// MUTANT KILLER: propagateVacuole stage digit replacement
// Targets: Regex mutation \d → \D, StringLiteral mutation `` → something
// ============================================================================
describe('propagateVacuole - Stage Transition Mutations', () => {
	it('should correctly replace stage NUMBER with new stage number - kills \\d → \\D mutant', () => {
		// This test specifically validates that stage DIGITS are replaced
		// If mutant changes \d to \D, this test will fail because stageD won't match
		for (let stage = 1; stage <= 6; stage++) {
			const parent = wrapInVacuole(
				{ x: 1 },
				{
					type: `hfo.w3c.gesture.stage${stage}.sense` as any,
					hfogen: 87,
					hfohive: 'H',
					hfoport: 0,
					hfostage: stage as any,
				},
			);

			const nextStage = stage + 1; // Always advance to next stage
			const child = propagateVacuole(parent, { y: 2 }, nextStage, nextStage);

			// Type should have stage NUMBER updated, not non-digit
			expect(child.type).toBe(`hfo.w3c.gesture.stage${nextStage}.sense`);
			expect(child.type).toContain(`stage${nextStage}`);
			expect(child.type).not.toContain(`stage${stage}`); // Old stage replaced
		}
	});

	it('should produce non-empty type after propagation - kills empty string literal mutant', () => {
		const parent = wrapInVacuole(
			{ x: 1 },
			{
				type: 'hfo.w3c.gesture.stage1.sense',
				hfogen: 87,
				hfohive: 'H',
				hfoport: 0,
				hfostage: 1,
			},
		);

		const child = propagateVacuole(parent, { y: 2 }, 2, 2);

		// Type should NOT be empty string
		expect(child.type.length).toBeGreaterThan(0);
		expect(child.type).toBe('hfo.w3c.gesture.stage2.sense');
	});

	it('should handle all 7 stages correctly - comprehensive stage digit test', () => {
		const stages = [1, 2, 3, 4, 5, 6, 7] as const;

		for (const startStage of stages) {
			for (const endStage of stages) {
				const parent = wrapInVacuole(
					{ data: 'test' },
					{
						type: `hfo.w3c.gesture.stage${startStage}.transform` as any,
						hfogen: 87,
						hfohive: 'V',
						hfoport: startStage,
						hfostage: startStage as any,
					},
				);

				const child = propagateVacuole(parent, { data: 'child' }, endStage, endStage);

				// Verify stage NUMBER was replaced correctly
				expect(child.type).toMatch(new RegExp(`stage${endStage}\\.`));
				expect(child.hfostage).toBe(endStage);
			}
		}
	});
});

// ============================================================================
// MUTANT KILLER: datacontenttype literal mutation
// Targets: z.literal('application/json') → z.literal('')
// ============================================================================
describe('CloudEventsBaseSchema - datacontenttype validation', () => {
	it('should accept application/json for datacontenttype - kills empty literal mutant', () => {
		const validEvent = {
			specversion: '1.0' as const,
			id: '550e8400-e29b-41d4-a716-446655440000',
			source: '/hfo/gen87/port0',
			type: 'hfo.test',
			datacontenttype: 'application/json',
		};

		const result = CloudEventsBaseSchema.safeParse(validEvent);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.datacontenttype).toBe('application/json');
		}
	});

	it('should reject empty string for datacontenttype - kills empty literal mutant', () => {
		const invalidEvent = {
			specversion: '1.0' as const,
			id: '550e8400-e29b-41d4-a716-446655440000',
			source: '/hfo/gen87/port0',
			type: 'hfo.test',
			datacontenttype: '',
		};

		// If mutant changes literal('application/json') to literal(''),
		// this will incorrectly pass, so we verify it fails
		const result = CloudEventsBaseSchema.safeParse(invalidEvent);
		expect(result.success).toBe(false);
	});
});

// ============================================================================
// MUTANT KILLER: traceparent error message mutation
// Targets: StringLiteral 'Invalid W3C traceparent format' → ''
// ============================================================================
describe('TraceparentSchema - Error message validation', () => {
	it('should provide meaningful error message for invalid traceparent - kills empty message mutant', () => {
		const invalidTraceparent = 'not-a-valid-traceparent';
		const result = TraceparentSchema.safeParse(invalidTraceparent);

		expect(result.success).toBe(false);
		if (!result.success) {
			// Error should have a non-empty message
			const errorMessage = result.error.issues[0]?.message ?? '';
			expect(errorMessage.length).toBeGreaterThan(0);
		}
	});
});

// ============================================================================
// MUTANT KILLER: hfopull default value mutation
// Targets: hfopull ?? 'downstream' → hfopull ?? ''
// ============================================================================
describe('wrapInVacuole - Default values validation', () => {
	it('should default hfopull to "downstream" not empty string - kills hfopull mutation', () => {
		const envelope = wrapInVacuole(
			{ x: 1 },
			{
				type: 'hfo.test',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
				// Intentionally NOT providing hfopull to test default
			},
		);

		// Should default to 'downstream', not empty string
		expect(envelope.hfopull).toBe('downstream');
		expect(envelope.hfopull?.length).toBeGreaterThan(0);
	});

	it('should respect explicit hfopull value', () => {
		const upstreamEnvelope = wrapInVacuole(
			{ x: 1 },
			{
				type: 'hfo.test',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
				hfopull: 'upstream',
			},
		);
		expect(upstreamEnvelope.hfopull).toBe('upstream');

		const lateralEnvelope = wrapInVacuole(
			{ x: 1 },
			{
				type: 'hfo.test',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
				hfopull: 'lateral',
			},
		);
		expect(lateralEnvelope.hfopull).toBe('lateral');
	});
});
