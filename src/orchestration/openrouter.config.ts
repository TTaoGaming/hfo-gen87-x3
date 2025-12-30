/**
 * OpenRouter Configuration
 *
 * Gen87.X3 | AI Model Gateway
 *
 * OpenRouter provides access to 200+ LLMs through a single API.
 * Use this as the LLM backend for CrewAI, LangGraph, and direct calls.
 */
import OpenAI from 'openai';

// ============================================================================
// OPENROUTER CLIENT (OpenAI-compatible)
// ============================================================================

export const openrouter = new OpenAI({
	baseURL: 'https://openrouter.ai/api/v1',
	apiKey: process.env.OPENROUTER_API_KEY,
	defaultHeaders: {
		'HTTP-Referer': 'https://github.com/TTaoGaming/hfo-gen87-x3',
		'X-Title': 'HFO Gen87.X3 AI Swarm',
	},
});

// ============================================================================
// RECOMMENDED MODELS FOR HIVE/8 TASKS
// ============================================================================

export const MODELS = {
	// Fast & cheap for simple tasks
	fast: 'meta-llama/llama-3.3-70b-instruct:free',

	// Balanced for most tasks
	balanced: 'meta-llama/llama-3.3-70b-instruct:free',

	// Powerful for complex reasoning
	powerful: 'meta-llama/llama-3.3-70b-instruct:free',

	// Code generation specialist
	code: 'meta-llama/llama-3.3-70b-instruct:free',

	// Long context (up to 200K tokens)
	longContext: 'meta-llama/llama-3.3-70b-instruct:free',

	// Free tier (for testing) - Llama has better rate limits
	free: 'meta-llama/llama-3.3-70b-instruct:free',
} as const;

// ============================================================================
// HIVE/8 PORT → MODEL MAPPING
// ============================================================================

export const PORT_MODELS: Record<number, string> = {
	0: MODELS.fast, // Lidless Legion - SENSE (fast scanning)
	1: MODELS.code, // Web Weaver - FUSE (contract generation)
	2: MODELS.code, // Mirror Magus - SHAPE (code transformation)
	3: MODELS.balanced, // Spore Storm - DELIVER (workflow execution)
	4: MODELS.powerful, // Red Regnant - TEST (property testing)
	5: MODELS.fast, // Pyre Praetorian - DEFEND (validation)
	6: MODELS.longContext, // Kraken Keeper - STORE (memory operations)
	7: MODELS.powerful, // Spider Sovereign - DECIDE (strategic planning)
};

// ============================================================================
// HELPER: Generate completion with tracing
// ============================================================================

export interface CompletionOptions {
	model?: string;
	port?: number;
	systemPrompt?: string;
	temperature?: number;
	maxTokens?: number;
}

export async function generateCompletion(
	prompt: string,
	options: CompletionOptions = {},
): Promise<string> {
	const model =
		options.model ?? (options.port !== undefined ? PORT_MODELS[options.port] : MODELS.balanced);

	const response = await openrouter.chat.completions.create({
		model,
		messages: [
			...(options.systemPrompt ? [{ role: 'system' as const, content: options.systemPrompt }] : []),
			{ role: 'user' as const, content: prompt },
		],
		temperature: options.temperature ?? 0.7,
		max_tokens: options.maxTokens ?? 4096,
	});

	return response.choices[0]?.message?.content ?? '';
}

// ============================================================================
// TEST CONNECTION
// ============================================================================

export async function testOpenRouterConnection(): Promise<boolean> {
	try {
		const response = await openrouter.chat.completions.create({
			model: MODELS.free,
			messages: [{ role: 'user', content: 'Say "HFO Gen87 online" in exactly 4 words.' }],
			max_tokens: 20,
		});
		console.log('✅ OpenRouter connected:', response.choices[0]?.message?.content);
		return true;
	} catch (error) {
		console.error('❌ OpenRouter connection failed:', error);
		return false;
	}
}
