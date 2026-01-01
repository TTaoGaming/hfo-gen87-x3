/**
 * Memory Sensor - DuckDB FTS on HFO Memory Bank
 * Part of Lidless Legion Sensor Mesh
 *
 * Queries 6,423 artifacts from Pre-HFO to Gen84
 */

import type { SenseResult, SensorAdapter } from '../contracts.js';
import { DEFAULT_CONFIG } from '../contracts.js';

// Dynamic import for DuckDB (ESM)
let duckdb: typeof import('duckdb') | null = null;

async function getDuckDB() {
	if (!duckdb) {
		duckdb = await import('duckdb');
	}
	return duckdb;
}

export class MemorySensor implements SensorAdapter {
	name = 'memory' as const;
	private dbPath: string;
	private db: unknown = null;

	constructor(dbPath?: string) {
		this.dbPath = dbPath || DEFAULT_CONFIG.MEMORY_DB_PATH;
	}

	private async getConnection(): Promise<unknown> {
		if (this.db) return this.db;

		try {
			const duck = await getDuckDB();
			this.db = new duck.Database(this.dbPath, { access_mode: 'READ_ONLY' });
			return this.db;
		} catch (error) {
			console.error('[MemorySensor] Failed to connect to DuckDB:', error);
			throw error;
		}
	}

	async sense(
		query: string,
		limit: number,
		options?: Record<string, unknown>,
	): Promise<SenseResult[]> {
		try {
			const db = (await this.getConnection()) as {
				all: (sql: string, cb: (err: Error | null, rows: unknown[]) => void) => void;
			};
			const genFilter = options?.memoryGen ? `AND generation = ${options.memoryGen}` : '';

			// Escape single quotes in query
			const safeQuery = query.replace(/'/g, "''");

			const sql = `
        SELECT 
          filename,
          generation,
          era,
          content,
          fts_main_artifacts.match_bm25(id, '${safeQuery}') as score
        FROM artifacts 
        WHERE score IS NOT NULL ${genFilter}
        ORDER BY score DESC
        LIMIT ${limit}
      `;

			return new Promise((resolve, reject) => {
				// Load FTS extension first
				(db as { run: (sql: string, cb?: (err: Error | null) => void) => void }).run(
					'LOAD fts',
					(err) => {
						if (err) {
							console.warn('[MemorySensor] FTS extension not available, using LIKE fallback');
							// Fallback to LIKE search
							const fallbackSql = `
              SELECT filename, generation, era, content, 0.5 as score
              FROM artifacts 
              WHERE content LIKE '%${safeQuery}%' ${genFilter}
              LIMIT ${limit}
            `;
							db.all(fallbackSql, (err2, rows) => {
								if (err2) {
									reject(err2);
									return;
								}
								resolve(this.mapRows(rows as MemoryRow[]));
							});
							return;
						}

						db.all(sql, (err2, rows) => {
							if (err2) {
								reject(err2);
								return;
							}
							resolve(this.mapRows(rows as MemoryRow[]));
						});
					},
				);
			});
		} catch (error) {
			console.error('[MemorySensor] Error:', error);
			return [];
		}
	}

	private mapRows(rows: MemoryRow[]): SenseResult[] {
		return rows.map((row) => ({
			source: 'memory' as const,
			title: row.filename,
			content: row.content?.substring(0, 500) || '',
			filepath: row.filename,
			generation: row.generation,
			score: Math.min(1, Math.max(0, row.score || 0.5)),
			metadata: { era: row.era },
		}));
	}
}

interface MemoryRow {
	filename: string;
	generation: number;
	era: string;
	content: string;
	score: number;
}
