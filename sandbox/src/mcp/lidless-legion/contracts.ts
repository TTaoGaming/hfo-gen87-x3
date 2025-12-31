/**
 * Lidless Legion MCP Server - Contracts
 * Port 0: SENSE verb - Sensor Mesh
 * 
 * Gen87.X3 | HIVE/8 Phase: H (Hunt)
 */

import { z } from 'zod';

// =============================================================================
// SENSOR SOURCE TYPES
// =============================================================================

export const SensorSourceSchema = z.enum(['web', 'memory', 'code', 'graph', 'all']);
export type SensorSource = z.infer<typeof SensorSourceSchema>;

// =============================================================================
// INPUT SCHEMAS
// =============================================================================

export const LidlessSenseInputSchema = z.object({
  query: z.string().min(1).describe('Search query'),
  sources: z.array(SensorSourceSchema).optional().default(['all']).describe('Sources to query'),
  limit: z.number().int().min(1).max(50).optional().default(5).describe('Results per source'),
  options: z.object({
    webDepth: z.enum(['basic', 'advanced']).optional().default('basic'),
    memoryGen: z.number().int().optional().describe('Filter by generation'),
    codePattern: z.string().optional().describe('Glob pattern for code search'),
  }).optional(),
});

export type LidlessSenseInput = z.infer<typeof LidlessSenseInputSchema>;

// =============================================================================
// OUTPUT SCHEMAS
// =============================================================================

export const SenseResultSchema = z.object({
  source: SensorSourceSchema.exclude(['all']),
  title: z.string(),
  content: z.string(),
  url: z.string().optional(),
  filepath: z.string().optional(),
  generation: z.number().optional(),
  score: z.number().min(0).max(1),
  metadata: z.record(z.unknown()).optional(),
});

export type SenseResult = z.infer<typeof SenseResultSchema>;

export const StigmergySignalSchema = z.object({
  ts: z.string(),
  mark: z.number().min(0).max(1),
  pull: z.enum(['upstream', 'downstream', 'lateral']),
  msg: z.string().min(1),
  type: z.enum(['signal', 'event', 'error', 'metric']),
  hive: z.enum(['H', 'I', 'V', 'E', 'X']),
  gen: z.number().int().min(87),
  port: z.number().int().min(0).max(7),
});

export type StigmergySignal = z.infer<typeof StigmergySignalSchema>;

export const LidlessSenseOutputSchema = z.object({
  query: z.string(),
  timestamp: z.string(),
  sources_queried: z.array(z.string()),
  results: z.array(SenseResultSchema),
  exemplars: z.array(SenseResultSchema),
  total_results: z.number(),
  signal: z.object({
    port: z.literal(0),
    hive: z.literal('H'),
    msg: z.string(),
  }),
});

export type LidlessSenseOutput = z.infer<typeof LidlessSenseOutputSchema>;

// =============================================================================
// SENSOR ADAPTER INTERFACE
// =============================================================================

export interface SensorAdapter {
  name: SensorSource;
  sense(query: string, limit: number, options?: Record<string, unknown>): Promise<SenseResult[]>;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

export const DEFAULT_CONFIG = {
  BLACKBOARD_PATH: process.env.BLACKBOARD_PATH || './obsidianblackboard.jsonl',
  MEMORY_DB_PATH: process.env.MEMORY_DB_PATH || '../../../portable_hfo_memory_pre_hfo_to_gen84_2025-12-27T21-46-52/hfo_memory.duckdb',
  TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
  WORKSPACE_ROOT: process.env.WORKSPACE_ROOT || '.',
  CURRENT_GEN: Number.parseInt(process.env.CURRENT_GEN || '87', 10),
};
