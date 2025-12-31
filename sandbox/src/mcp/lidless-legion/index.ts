#!/usr/bin/env node
/**
 * Lidless Legion MCP Server
 * Port 0: SENSE verb - Unified Sensor Mesh
 *
 * Gen87.X3 | HIVE/8
 *
 * "Given One Swarm to Rule the Eight..."
 *
 * Usage:
 *   npx tsx index.ts                    # Run server
 *   node dist/index.js                  # Run compiled
 *
 * Environment:
 *   TAVILY_API_KEY      - Tavily API key for web search
 *   MEMORY_DB_PATH      - Path to DuckDB memory bank
 *   BLACKBOARD_PATH     - Path to stigmergy blackboard
 *   WORKSPACE_ROOT      - Root directory for code search
 *   CURRENT_GEN         - Current generation number
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
	DEFAULT_CONFIG,
	type LidlessSenseInput,
	LidlessSenseInputSchema,
	type LidlessSenseOutput,
	type SenseResult,
	type SensorAdapter,
	type SensorSource,
	type StigmergySignal,
} from './contracts.js';
import { CodeSensor, GraphSensor, MemorySensor, WebSensor } from './sensors/index.js';

// =============================================================================
// SENSOR REGISTRY
// =============================================================================

const sensors: Map<SensorSource, SensorAdapter> = new Map();

function registerSensor(sensor: SensorAdapter): void {
	sensors.set(sensor.name, sensor);
	console.error(`[LidlessLegion] Registered sensor: ${sensor.name}`);
}

function initializeSensors(): void {
	registerSensor(new WebSensor());
	registerSensor(new MemorySensor());
	registerSensor(new CodeSensor());
	registerSensor(new GraphSensor());
}

// =============================================================================
// STIGMERGY EMISSION
// =============================================================================

async function emitSignal(msg: string): Promise<StigmergySignal> {
	const signal: StigmergySignal = {
		ts: new Date().toISOString(),
		mark: 0.8,
		pull: 'downstream',
		msg,
		type: 'signal',
		hive: 'H',
		gen: DEFAULT_CONFIG.CURRENT_GEN,
		port: 0,
	};

	try {
		const blackboardPath = path.resolve(DEFAULT_CONFIG.BLACKBOARD_PATH);
		await fs.promises.appendFile(blackboardPath, JSON.stringify(signal) + '\n');
		console.error(`[LidlessLegion] Signal emitted: ${msg.substring(0, 50)}...`);
	} catch (error) {
		console.error('[LidlessLegion] Failed to emit signal:', error);
	}

	return signal;
}

// =============================================================================
// CORE SENSE FUNCTION
// =============================================================================

async function sense(input: LidlessSenseInput): Promise<LidlessSenseOutput> {
	const { query, sources = ['all'], limit = 5, options = {} } = input;
	const timestamp = new Date().toISOString();

	// Determine which sources to query
	const sourcesToQuery: SensorSource[] = sources.includes('all')
		? (['web', 'memory', 'code', 'graph'] as SensorSource[])
		: sources.filter((s): s is Exclude<SensorSource, 'all'> => s !== 'all');

	const allResults: SenseResult[] = [];
	const queriedSources: string[] = [];

	// Query each sensor in parallel
	const sensePromises = sourcesToQuery.map(async (source) => {
		const sensor = sensors.get(source);
		if (!sensor) {
			console.error(`[LidlessLegion] Unknown sensor: ${source}`);
			return [];
		}

		queriedSources.push(source);
		try {
			const results = await sensor.sense(query, limit, options);
			return results;
		} catch (error) {
			console.error(`[LidlessLegion] Sensor ${source} failed:`, error);
			return [];
		}
	});

	const resultsArrays = await Promise.all(sensePromises);
	for (const results of resultsArrays) {
		allResults.push(...results);
	}

	// Sort all results by score and deduplicate for exemplars
	allResults.sort((a, b) => b.score - a.score);

	// Deduplicate exemplars (top results by unique title)
	const seenTitles = new Set<string>();
	const exemplars: SenseResult[] = [];
	for (const result of allResults) {
		if (!seenTitles.has(result.title) && exemplars.length < limit) {
			seenTitles.add(result.title);
			exemplars.push(result);
		}
	}

	// Emit stigmergy signal
	const signalMsg = `SENSE: "${query}" → ${allResults.length} results from [${queriedSources.join(', ')}]`;
	await emitSignal(signalMsg);

	return {
		query,
		timestamp,
		sources_queried: queriedSources,
		results: allResults,
		exemplars,
		total_results: allResults.length,
		signal: {
			port: 0,
			hive: 'H',
			msg: signalMsg,
		},
	};
}

// =============================================================================
// MCP SERVER SETUP
// =============================================================================

const server = new Server(
	{
		name: 'lidless-legion',
		version: '0.1.0',
	},
	{
		capabilities: {
			tools: {},
		},
	},
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: 'lidless_sense',
			description: `Lidless Legion Sensor Mesh (Port 0) - Unified search across multiple sources.

Sources available:
- web: Tavily web search (requires TAVILY_API_KEY)
- memory: DuckDB FTS on 6,423 HFO artifacts
- code: Workspace file search
- graph: MCP Memory knowledge graph

Auto-emits stigmergy signal to blackboard on every call.

Example: { "query": "gesture recognition", "sources": ["web", "memory"], "limit": 10 }`,
			inputSchema: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description: 'Search query',
					},
					sources: {
						type: 'array',
						items: {
							type: 'string',
							enum: ['web', 'memory', 'code', 'graph', 'all'],
						},
						description: 'Sources to query (default: all)',
					},
					limit: {
						type: 'number',
						description: 'Results per source (default: 5, max: 50)',
					},
					options: {
						type: 'object',
						properties: {
							webDepth: {
								type: 'string',
								enum: ['basic', 'advanced'],
								description: 'Tavily search depth',
							},
							memoryGen: {
								type: 'number',
								description: 'Filter by generation number',
							},
							codePattern: {
								type: 'string',
								description: 'Glob pattern for code search',
							},
						},
					},
				},
				required: ['query'],
			},
		},
	],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	if (name === 'lidless_sense') {
		try {
			const parsed = LidlessSenseInputSchema.parse(args);
			const result = await sense(parsed);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error';
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify({ error: errorMsg }),
					},
				],
				isError: true,
			};
		}
	}

	return {
		content: [
			{
				type: 'text',
				text: JSON.stringify({ error: `Unknown tool: ${name}` }),
			},
		],
		isError: true,
	};
});

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
	console.error('╔════════════════════════════════════════════════════════════╗');
	console.error('║        LIDLESS LEGION MCP SERVER - Port 0 SENSE            ║');
	console.error('║        "Given One Swarm to Rule the Eight..."              ║');
	console.error('╚════════════════════════════════════════════════════════════╝');

	initializeSensors();

	console.error('[LidlessLegion] Starting MCP server...');
	console.error(`[LidlessLegion] Blackboard: ${DEFAULT_CONFIG.BLACKBOARD_PATH}`);
	console.error(`[LidlessLegion] Memory DB: ${DEFAULT_CONFIG.MEMORY_DB_PATH}`);
	console.error(`[LidlessLegion] Workspace: ${DEFAULT_CONFIG.WORKSPACE_ROOT}`);
	console.error(`[LidlessLegion] Gen: ${DEFAULT_CONFIG.CURRENT_GEN}`);

	const transport = new StdioServerTransport();
	await server.connect(transport);

	console.error('[LidlessLegion] Server running on stdio');
}

main().catch((error) => {
	console.error('[LidlessLegion] Fatal error:', error);
	process.exit(1);
});
