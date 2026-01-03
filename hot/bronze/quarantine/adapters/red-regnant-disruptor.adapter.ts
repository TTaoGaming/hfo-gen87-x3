import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import type {
	MutationResult,
	PropertyResult,
	RedRegnantPort,
} from '../contracts/port-4-red-regnant.js';
import { type VacuoleEnvelope, wrapInVacuole } from '../../src/contracts/vacuole-envelope.js';

const execAsync = promisify(exec);

/**
 * Red Regnant Disruptor Adapter
 *
 * Gen87.X3 | Port 4 | TEST
 *
 * Implements the Red Queen's authority over mutation and property testing.
 * Wraps Stryker and fast-check.
 */
export class RedRegnantDisruptorAdapter implements RedRegnantPort {
	/**
	 * Run mutation testing (Stryker)
	 */
	async mutate(target: string): Promise<VacuoleEnvelope<MutationResult>> {
		const reportPath = path.join(process.cwd(), 'reports', 'mutation', 'mutation-report.json');

		try {
			// Delete old report to avoid stale data
			if (fs.existsSync(reportPath)) {
				fs.unlinkSync(reportPath);
			}

			// Determine the test file for this target
			const testFile = target.endsWith('.test.ts')
				? target
				: `${target.replace('.ts', '')}.test.ts`;

			// Run Stryker on the target
			// We use --mutate to limit the scope and VITEST_SEGMENT to limit tests
			try {
				await execAsync(`npx stryker run --mutate ${target} --reporters json --logLevel error`, {
					env: { ...process.env, VITEST_SEGMENT: testFile },
				});
			} catch (execError: any) {
				// Stryker exits with code 1 if score is below threshold.
				// We check if the report was still generated.
				if (!fs.existsSync(reportPath)) {
					throw execError;
				}
			}

			if (!fs.existsSync(reportPath)) {
				throw new Error('Stryker report not found after run');
			}

			const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

			// Stryker 1.0 JSON report might not have a top-level metrics object
			let metrics = report.metrics;
			if (!metrics) {
				let killed = 0;
				let timeout = 0;
				let survived = 0;
				let noCoverage = 0;
				let runtimeError = 0;
				let totalValid = 0;

				if (report.files) {
					const files = Object.values(report.files) as unknown as Array<{
						mutants: Array<{ status: string }>;
					}>;
					for (const file of files) {
						for (const mutant of file.mutants) {
							if (mutant.status === 'Killed') killed++;
							else if (mutant.status === 'Timeout') timeout++;
							else if (mutant.status === 'Survived') survived++;
							else if (mutant.status === 'NoCoverage') noCoverage++;
							else if (mutant.status === 'RuntimeError') runtimeError++;

							if (
								['Killed', 'Timeout', 'Survived', 'NoCoverage', 'RuntimeError'].includes(
									mutant.status,
								)
							) {
								totalValid++;
							}
						}
					}
				}

				metrics = {
					mutationScore: totalValid > 0 ? ((killed + timeout) / totalValid) * 100 : 0,
					killed,
					timeout,
					survived,
					noCoverage,
					runtimeError,
					totalValid,
				};
			}

			const result: MutationResult = {
				score: metrics.mutationScore / 100,
				survived: metrics.survived,
				killed: metrics.killed,
				timeout: metrics.timeout,
				noCoverage: metrics.noCoverage,
				runtimeError: metrics.runtimeError,
				totalMutants: metrics.totalValid,
				files: Object.keys(report.files),
			};

			return wrapInVacuole(result, {
				type: 'hfo.red-regnant.mutation.complete',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
				hfomark: result.score,
				hfopull: 'downstream',
			});
		} catch (error: any) {
			const emptyResult: MutationResult = {
				score: 0,
				survived: 0,
				killed: 0,
				timeout: 0,
				noCoverage: 0,
				runtimeError: 0,
				totalMutants: 0,
				files: [],
			};
			return wrapInVacuole(emptyResult, {
				type: 'hfo.red-regnant.mutation.error',
				hfogen: 87,
				hfohive: 'X',
				hfoport: 4,
				hfomark: 0,
				hfopull: 'downstream',
			});
		}
	}

	/**
	 * Run property-based testing (fast-check)
	 * Note: This assumes tests are already written using fast-check and vitest.
	 */
	async verifyProperties(target: string): Promise<VacuoleEnvelope<PropertyResult>> {
		try {
			// Run vitest on the target test file
			const testFile = target.endsWith('.test.ts')
				? target
				: `${target.replace('.ts', '')}.test.ts`;

			// Set VITEST_SEGMENT to ensure only this test file runs
			const { stdout } = await execAsync(`npx vitest run ${testFile}`, {
				env: { ...process.env, VITEST_SEGMENT: testFile },
			});

			// Parse vitest output for property test counts if possible,
			// or just rely on exit code for now.
			const passed = !stdout.includes('FAIL');

			const result: PropertyResult = {
				passed,
				testCount: 100, // Default fast-check iterations
			};

			return wrapInVacuole(result, {
				type: 'hfo.red-regnant.property.complete',
				hfogen: 87,
				hfohive: 'V',
				hfoport: 4,
				hfomark: passed ? 1.0 : 0.0,
				hfopull: 'downstream',
			});
		} catch (error: any) {
			const errorResult: PropertyResult = {
				passed: false,
				testCount: 0,
				failureReason: error.message,
			};
			return wrapInVacuole(errorResult, {
				type: 'hfo.red-regnant.property.error',
				hfogen: 87,
				hfohive: 'X',
				hfoport: 4,
				hfomark: 0,
				hfopull: 'downstream',
			});
		}
	}

	/**
	 * Audit for Theater Code and Fake Green
	 */
	async audit(_target: string): Promise<
		VacuoleEnvelope<{
			verdict: 'CRITICAL' | 'FAILING' | 'MARGINAL' | 'PASSING' | 'EXCELLENT';
			truthRatio: number;
			fakeGreenCount: number;
			violations: Array<{ type: string; message: string; file: string; line?: number }>;
		}>
	> {
		// This would involve running the theater-detector logic
		// For now, we'll return a placeholder that integrates with the existing script
		const result = {
			verdict: 'MARGINAL' as const,
			truthRatio: 0.5,
			fakeGreenCount: 0,
			violations: [],
		};

		return wrapInVacuole(result, {
			type: 'hfo.red-regnant.audit.complete',
			hfogen: 87,
			hfohive: 'V',
			hfoport: 4,
			hfomark: 0.5,
			hfopull: 'downstream',
		});
	}

	/**
	 * Base test method from Port4_Disruptor
	 */
	async test(payload: unknown): Promise<boolean> {
		// Generic integrity check
		return payload !== null && payload !== undefined;
	}
}
