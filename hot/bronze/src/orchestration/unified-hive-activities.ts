/**
 * Unified HIVE/8 Activities
 *
 * Gen87.X3 | Activities for ALL integrations: LangGraph, CrewAI, MCP, NATS
 *
 * This file provides Temporal activities that bridge to all external systems,
 * creating a truly unified orchestration layer.
 */
import { spawn } from 'node:child_process';
import { connect, type NatsConnection, StringCodec } from 'nats';
import { generateCompletion } from './openrouter.config.js';

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedPhaseInput {
	phase: 'H' | 'I' | 'V' | 'E';
	task: string;
	context: string[];
	cycle: number;
	port: number;
}

export interface UnifiedPhaseOutput {
	phase: 'H' | 'I' | 'V' | 'E';
	port: number;
	source: 'langgraph' | 'crewai' | 'mcp' | 'nats' | 'direct';
	output: string;
	timestamp: string;
	durationMs: number;
}

export interface CrewAIInput {
	task: string;
	commander: string; // Which commander to use (lidless, weaver, etc.)
	context?: string;
}

export interface MCPInput {
	tool: string;
	args: Record<string, unknown>;
}

export interface NATSInput {
	subject: string;
	payload: string;
	waitForReply?: boolean;
	timeoutMs?: number;
}

// ============================================================================
// LANGGRAPH ACTIVITY (Already proven working)
// ============================================================================

export async function langGraphActivity(input: UnifiedPhaseInput): Promise<UnifiedPhaseOutput> {
	const start = Date.now();

	const prompt = buildPhasePrompt(input.phase, input.task, input.context);
	const output = await generateCompletion(prompt, {
		port: input.port,
		systemPrompt: getCommanderPrompt(input.port),
	});

	return {
		phase: input.phase,
		port: input.port,
		source: 'langgraph',
		output,
		timestamp: new Date().toISOString(),
		durationMs: Date.now() - start,
	};
}

// ============================================================================
// CREWAI ACTIVITY (Calls Python subprocess)
// ============================================================================

export async function crewaiActivity(input: CrewAIInput): Promise<UnifiedPhaseOutput> {
	const start = Date.now();

	const output = await runPythonCrewAI(input.commander, input.task, input.context);

	return {
		phase: 'H', // CrewAI typically used for Hunt
		port: mapCommanderToPort(input.commander),
		source: 'crewai',
		output,
		timestamp: new Date().toISOString(),
		durationMs: Date.now() - start,
	};
}

/**
 * Execute CrewAI commander via Python subprocess
 */
async function runPythonCrewAI(commander: string, task: string, context?: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const pythonScript = `
import sys
import json
sys.path.insert(0, '${process.cwd().replace(/\\/g, '/')}')

try:
    from crewai_hive import create_commander, run_single_task
    result = run_single_task('${commander}', '''${task}''', '''${context || ''}''')
    print(json.dumps({"success": True, "result": result}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

		const python = spawn('python', ['-c', pythonScript], {
			cwd: process.cwd(),
			env: { ...process.env },
		});

		let stdout = '';
		let stderr = '';

		python.stdout.on('data', (data) => {
			stdout += data.toString();
		});

		python.stderr.on('data', (data) => {
			stderr += data.toString();
		});

		python.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`CrewAI failed: ${stderr || stdout}`));
				return;
			}

			try {
				const result = JSON.parse(stdout.trim().split('\n').pop() || '{}');
				if (result.success) {
					resolve(result.result);
				} else {
					reject(new Error(result.error || 'Unknown CrewAI error'));
				}
			} catch {
				// If not JSON, return raw output
				resolve(stdout.trim());
			}
		});

		python.on('error', (err) => {
			reject(new Error(`Failed to start Python: ${err.message}`));
		});
	});
}

// ============================================================================
// MCP ACTIVITY (Calls MCP tools)
// ============================================================================

export async function mcpActivity(input: MCPInput): Promise<UnifiedPhaseOutput> {
	const start = Date.now();

	// For now, we'll simulate MCP tool calls
	// In production, this would connect to actual MCP servers
	const output = await callMCPTool(input.tool, input.args);

	return {
		phase: 'H', // MCP typically used for Hunt (search/sense)
		port: 0, // Lidless Legion - sensor
		source: 'mcp',
		output,
		timestamp: new Date().toISOString(),
		durationMs: Date.now() - start,
	};
}

/**
 * Call an MCP tool (simulated for now, real impl connects to MCP server)
 */
async function callMCPTool(tool: string, args: Record<string, unknown>): Promise<string> {
	// TODO: Connect to actual MCP server when running
	// For now, return a structured response
	return JSON.stringify({
		tool,
		args,
		result: `MCP tool ${tool} would be called with args: ${JSON.stringify(args)}`,
		note: 'MCP server integration pending - install and start server',
	});
}

// ============================================================================
// NATS ACTIVITY (Pub/Sub messaging)
// ============================================================================

let natsConnection: NatsConnection | null = null;
const sc = StringCodec();

export async function natsActivity(input: NATSInput): Promise<UnifiedPhaseOutput> {
	const start = Date.now();

	const output = await publishToNATS(input.subject, input.payload, input.waitForReply, input.timeoutMs);

	return {
		phase: 'E', // NATS typically used for Evolve (emit/deliver)
		port: 3, // Spore Storm - delivery
		source: 'nats',
		output,
		timestamp: new Date().toISOString(),
		durationMs: Date.now() - start,
	};
}

/**
 * Connect to NATS server
 */
async function ensureNATSConnection(): Promise<NatsConnection> {
	if (natsConnection) {
		return natsConnection;
	}

	try {
		natsConnection = await connect({
			servers: process.env.NATS_URL || 'nats://localhost:4222',
		});
		console.log('[NATS] Connected to server');
		return natsConnection;
	} catch (err) {
		throw new Error(`NATS connection failed: ${err}`);
	}
}

/**
 * Publish message to NATS subject
 */
async function publishToNATS(
	subject: string,
	payload: string,
	waitForReply = false,
	timeoutMs = 5000,
): Promise<string> {
	try {
		const nc = await ensureNATSConnection();

		if (waitForReply) {
			// Request-reply pattern
			const response = await nc.request(subject, sc.encode(payload), {
				timeout: timeoutMs,
			});
			return sc.decode(response.data);
		}
		// Fire and forget
		nc.publish(subject, sc.encode(payload));
		return `Published to ${subject}: ${payload.slice(0, 100)}...`;
	} catch (err) {
		// If NATS isn't running, return graceful error
		return JSON.stringify({
			error: 'NATS not available',
			subject,
			payload: payload.slice(0, 100),
			note: 'Start NATS server: nats-server -js',
		});
	}
}

/**
 * Close NATS connection (call on shutdown)
 */
export async function closeNATSConnection(): Promise<void> {
	if (natsConnection) {
		await natsConnection.close();
		natsConnection = null;
	}
}

// ============================================================================
// UNIFIED HIVE ACTIVITY (Routes to appropriate system)
// ============================================================================

export interface UnifiedHIVEInput {
	phase: 'H' | 'I' | 'V' | 'E';
	task: string;
	context: string[];
	cycle: number;
	port: number;
	preferredSystem?: 'langgraph' | 'crewai' | 'mcp' | 'nats' | 'auto';
}

/**
 * Unified HIVE activity that routes to the best system based on phase/port
 */
export async function unifiedHIVEActivity(input: UnifiedHIVEInput): Promise<UnifiedPhaseOutput> {
	const system = input.preferredSystem || selectSystem(input.phase, input.port);

	switch (system) {
		case 'crewai':
			return crewaiActivity({
				task: input.task,
				commander: portToCommander(input.port),
				context: input.context.join('\n'),
			});

		case 'mcp':
			return mcpActivity({
				tool: 'lidless_sense',
				args: { query: input.task, sources: ['memory', 'web'] },
			});

		case 'nats':
			return natsActivity({
				subject: `hive.${input.phase.toLowerCase()}.port${input.port}`,
				payload: JSON.stringify({ task: input.task, context: input.context }),
				waitForReply: true,
			});

		default:
			return langGraphActivity(input);
	}
}

/**
 * Select best system based on phase and port
 */
function selectSystem(phase: 'H' | 'I' | 'V' | 'E', port: number): 'langgraph' | 'crewai' | 'mcp' | 'nats' {
	// Hunt phase (H) - use MCP for search, CrewAI for research
	if (phase === 'H') {
		return port === 0 ? 'mcp' : 'crewai';
	}

	// Interlock phase (I) - use LangGraph for interface design
	if (phase === 'I') {
		return 'langgraph';
	}

	// Validate phase (V) - use LangGraph for testing
	if (phase === 'V') {
		return 'langgraph';
	}

	// Evolve phase (E) - use NATS for delivery
	if (phase === 'E') {
		return 'nats';
	}

	return 'langgraph';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildPhasePrompt(phase: 'H' | 'I' | 'V' | 'E', task: string, context: string[]): string {
	const phaseDescriptions = {
		H: 'HUNT - Search for exemplars and prior art',
		I: 'INTERLOCK - Define contracts and interfaces (Zod schemas)',
		V: 'VALIDATE - Implement and test (TDD)',
		E: 'EVOLVE - Refactor and emit results',
	};

	return `
You are executing the ${phaseDescriptions[phase]} phase of HIVE/8.

TASK: ${task}

${context.length > 0 ? `CONTEXT:\n${context.join('\n---\n')}` : ''}

Provide a concise, actionable response.
`;
}

function getCommanderPrompt(port: number): string {
	const commanders: Record<number, string> = {
		0: 'You are Lidless Legion, the ever-watchful Observer. SENSE without interpretation.',
		1: 'You are Web Weaver, master of connections. FUSE disparate elements.',
		2: 'You are Mirror Magus, shaper of forms. SHAPE data into patterns.',
		3: 'You are Spore Storm, deliverer of results. DELIVER outputs reliably.',
		4: 'You are Red Regnant, tester of truth. TEST everything.',
		5: 'You are Pyre Praetorian, defender of gates. DEFEND system integrity.',
		6: 'You are Kraken Keeper, guardian of memory. STORE knowledge persistently.',
		7: 'You are Spider Sovereign, weaver of webs. DECIDE strategic direction.',
	};
	return commanders[port] || 'You are a HIVE/8 agent.';
}

function mapCommanderToPort(commander: string): number {
	const mapping: Record<string, number> = {
		lidless: 0,
		weaver: 1,
		magus: 2,
		storm: 3,
		regnant: 4,
		pyre: 5,
		kraken: 6,
		spider: 7,
	};
	return mapping[commander.toLowerCase()] ?? 7;
}

function portToCommander(port: number): string {
	const commanders = ['lidless', 'weaver', 'magus', 'storm', 'regnant', 'pyre', 'kraken', 'spider'];
	return commanders[port] || 'spider';
}
