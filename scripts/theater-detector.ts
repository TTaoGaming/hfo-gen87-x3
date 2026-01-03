/**
 * Theater Detector - Identify hand-rolled code that should use exemplars
 *
 * Gen87.X3 | Port 4 (Red Regnant) | TEST
 *
 * PRINCIPLE: "No Bespoke" - If exemplar exists, use it
 *
 * This script identifies:
 * 1. Hand-rolled 1€ filter → should use npm `1eurofilter` (by Géry Casiez himself)
 * 2. Hand-rolled FSM → should use XState v5
 * 3. Hand-rolled smoothing → should use exemplar adapters
 * 4. Class-in-HTML → should be in separate module files
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TYPES
// ============================================================================

interface TheaterViolation {
	file: string;
	line: number;
	type: 'HAND_ROLLED' | 'INLINE_CLASS' | 'FAKE_ADAPTER' | 'IMPORT_BUT_UNUSED';
	component: string;
	message: string;
	exemplar: string;
	evidence: string;
}

interface DetectionResult {
	totalFiles: number;
	filesWithTheater: number;
	violations: TheaterViolation[];
	summary: Record<string, number>;
}

// ============================================================================
// EXEMPLAR REGISTRY - The "right" way to do things
// ============================================================================

const EXEMPLAR_REGISTRY = {
	'1euro': {
		name: '1€ Filter',
		npm: '1eurofilter@1.2.2',
		author: 'Géry Casiez (original author)',
		esm: 'https://esm.sh/1eurofilter@1.2.2',
		handRolledPatterns: [
			/function\s+oneEuro(?:Filter)?\s*\(/gi,
			/const\s+oneEuro\s*=\s*\(/gi,
			/let\s+(?:dx|dy|dCutoff|edx|edy)\s*=/gi, // Internal 1€ variables
			/Math\.exp\s*\(\s*-.*tau.*cutoff/gi, // 1€ smoothing formula
			/alpha\s*=\s*1\.0\s*\/\s*\(1\.0\s*\+\s*tau/gi, // Alpha calculation
		],
		goodPatterns: [/import.*from\s*['"]1eurofilter['"]/i, /import.*OneEuroFilter.*from/i],
	},

	xstate: {
		name: 'XState v5 FSM',
		npm: 'xstate@5.19.2',
		author: 'Stately.ai',
		esm: 'https://esm.sh/xstate@5.19.2',
		handRolledPatterns: [
			/let\s+(?:state|currentState)\s*=\s*['"`](?:DISARMED|IDLE|INIT|READY)['"`]/gi,
			/if\s*\(\s*state\s*===?\s*['"`]ARMED['"`]\s*\)/gi,
			/switch\s*\(\s*(?:state|gesture)\s*\)\s*{\s*case/gi,
			/state\s*=\s*['"`](?:ARMING|ARMED|ACTIVE|DISARMED)['"`]/gi,
		],
		goodPatterns: [
			/import.*createMachine.*from\s*['"]xstate['"]/i,
			/import.*createActor.*from\s*['"]xstate['"]/i,
			/setup\s*\(\s*\{/i, // XState v5 setup pattern
		],
	},

	mediapipe: {
		name: 'MediaPipe Tasks Vision',
		npm: '@mediapipe/tasks-vision',
		author: 'Google',
		esm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8',
		handRolledPatterns: [
			/new\s+HandLandmarker\s*\(/gi, // Old API
			/detectForVideo\s*\(/gi, // Old naming
		],
		goodPatterns: [/GestureRecognizer/i, /FilesetResolver/i, /recognizeForVideo/i],
	},

	zod: {
		name: 'Zod Schema Validation',
		npm: 'zod@3.24.1',
		author: 'Colin McDonnell',
		esm: 'https://esm.sh/zod@3.24.1',
		handRolledPatterns: [
			/typeof\s+\w+\s*===?\s*['"]object['"]\s*&&\s*\w+\s*!==?\s*null/gi, // Manual type checking
			/if\s*\(\s*!(?:data|input|value)\s*\|\|\s*typeof/gi,
		],
		goodPatterns: [/z\.object\s*\(/i, /z\.string\s*\(/i, /\.parse\s*\(/i, /\.safeParse\s*\(/i],
	},

	simulation: {
		name: 'Simulated Sensor Data',
		npm: 'N/A - Use Real Adapters',
		author: 'HFO Core',
		esm: 'N/A',
		handRolledPatterns: [
			/Math\.sin\s*\(\s*frame\s*\*\s*0\.02/gi,
			/Math\.cos\s*\(\s*frame\s*\*\s*0\.02/gi,
			/const\s+animate\s*=\s*\(\)\s*=>\s*{\s*ctx\.fillStyle/gi,
			/\/\/\s*Simulate\s+hand\s+tracking/gi,
		],
		goodPatterns: [
			/import.*from\s*['"].*adapters\/mediapipe\.adapter\.js['"]/i,
			/import.*from\s*['"].*adapters\/pointer\.adapter\.js['"]/i,
			/shell\.on\s*\(/i, // Subscribing to real shell events
		],
	},
};

// ============================================================================
// INLINE CLASS DETECTION
// ============================================================================

const INLINE_CLASS_PATTERNS = [
	{
		pattern: /class\s+(\w+Adapter)\s*{/gi,
		message: 'Adapter class defined inline in HTML',
		shouldBe: 'Should be in sandbox/src/adapters/{name}.adapter.ts',
	},
	{
		pattern: /class\s+(\w+Port)\s*{/gi,
		message: 'Port interface defined inline in HTML',
		shouldBe: 'Should be in sandbox/src/contracts/{name}.port.ts',
	},
	{
		pattern: /class\s+(\w+Game)\s*{/gi,
		message: 'Game class defined inline - acceptable for demo',
		shouldBe: 'OK for demos, but production should modularize',
		severity: 'INFO',
	},
];

// ============================================================================
// FAKE ADAPTER DETECTION
// ============================================================================

const FAKE_ADAPTER_PATTERNS = [
	{
		pattern: /class\s+\w+Adapter\s*{[^}]*return\s+(?:input|data|frame)\s*;/gis,
		message: 'Passthrough adapter - does nothing',
	},
	{
		pattern: /class\s+\w+Adapter\s*{[^}]*\/\/\s*TODO/gi,
		message: 'Adapter with TODO stub',
	},
	{
		pattern: /class\s+\w+Adapter\s*{[^}]*throw\s+new\s+Error\s*\(\s*['"`]Not implemented/gi,
		message: 'Adapter with "Not implemented" stub',
	},
];

// ============================================================================
// DETECTION LOGIC
// ============================================================================

function detectTheater(filePath: string, content: string): TheaterViolation[] {
	const violations: TheaterViolation[] = [];
	const lines = content.split('\n');

	// Check for hand-rolled code vs exemplars
	for (const [key, config] of Object.entries(EXEMPLAR_REGISTRY)) {
		// Check if they're using the good pattern
		const hasGoodImport = config.goodPatterns.some((p) => p.test(content));

		// Check for hand-rolled patterns
		for (const pattern of config.handRolledPatterns) {
			const matches = [...content.matchAll(pattern)];
			for (const match of matches) {
				// If they have the good import AND the pattern, it might be OK
				// (e.g., they import XState AND have a switch for non-FSM logic)
				// But we still flag it for review

				const beforeMatch = content.substring(0, match.index);
				const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

				// If they have the good import, skip the violation (False Positive Fix)
				if (hasGoodImport) continue;

				violations.push({
					file: filePath,
					line: lineNum,
					type: 'HAND_ROLLED',
					component: config.name,
					message: `Hand-rolled ${config.name} detected - USE EXEMPLAR`,
					exemplar: `npm: ${config.npm} | esm: ${config.esm}`,
					evidence: match[0].substring(0, 80) + (match[0].length > 80 ? '...' : ''),
				});
			}
		}
	}

	// Check for inline classes in HTML
	if (filePath.endsWith('.html')) {
		for (const inlineConfig of INLINE_CLASS_PATTERNS) {
			const matches = [...content.matchAll(inlineConfig.pattern)];
			for (const match of matches) {
				const beforeMatch = content.substring(0, match.index);
				const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

				violations.push({
					file: filePath,
					line: lineNum,
					type: 'INLINE_CLASS',
					component: match[1],
					message: inlineConfig.message,
					exemplar: inlineConfig.shouldBe,
					evidence: match[0].substring(0, 60),
				});
			}
		}
	}

	// Check for fake adapters
	for (const fakeConfig of FAKE_ADAPTER_PATTERNS) {
		const matches = [...content.matchAll(fakeConfig.pattern)];
		for (const match of matches) {
			const beforeMatch = content.substring(0, match.index);
			const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;

			violations.push({
				file: filePath,
				line: lineNum,
				type: 'FAKE_ADAPTER',
				component: 'Adapter',
				message: fakeConfig.message,
				exemplar: 'Implement real logic or remove',
				evidence: `${match[0].substring(0, 80)}...`,
			});
		}
	}

	return violations;
}

// Walk directories
function walkDir(dir: string, extensions: string[]): string[] {
	const files: string[] = [];
	if (!fs.existsSync(dir)) return files;

	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			// Skip archived folders
			if (entry.name.startsWith('_') || entry.name === 'node_modules') continue;
			files.push(...walkDir(fullPath, extensions));
		} else if (extensions.some((ext) => entry.name.endsWith(ext))) {
			files.push(fullPath);
		}
	}
	return files;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	const rootDir = path.resolve(__dirname, '..');
	const bronzeDir = path.join(rootDir, 'hot', 'bronze', 'src');
	const silverDir = path.join(rootDir, 'hot', 'silver');
	const demosDir = path.join(rootDir, 'demos');

	const result: DetectionResult = {
		totalFiles: 0,
		filesWithTheater: 0,
		violations: [],
		summary: {},
	};

	// Get all files
	const htmlFiles = walkDir(demosDir, ['.html']);
	const demoTsFiles = walkDir(path.join(demosDir, 'src'), ['.ts', '.tsx']);
	const bronzeTsFiles = walkDir(bronzeDir, ['.ts', '.tsx']);
	const silverTsFiles = walkDir(silverDir, ['.ts', '.tsx']);
	const allFiles = [...htmlFiles, ...demoTsFiles, ...bronzeTsFiles, ...silverTsFiles];

	result.totalFiles = allFiles.length;

	// Analyze each file
	for (const file of allFiles) {
		const content = fs.readFileSync(file, 'utf-8');
		const violations = detectTheater(file, content);

		if (violations.length > 0) {
			result.filesWithTheater++;
			result.violations.push(...violations);

			// Update summary
			for (const v of violations) {
				result.summary[v.type] = (result.summary[v.type] || 0) + 1;
			}
		}
	}

	// Output results
	console.log('\n🎭 THEATER DETECTOR - Gen87.X3\n');
	console.log('════════════════════════════════════════════════════════════\n');

	console.log('📊 Summary');
	console.log(`   Files scanned: ${result.totalFiles}`);
	console.log(`   Files with theater: ${result.filesWithTheater}`);
	console.log(`   Total violations: ${result.violations.length}\n`);

	console.log('📋 By Type:');
	for (const [type, count] of Object.entries(result.summary)) {
		const emoji = type === 'HAND_ROLLED' ? '🔧' : type === 'INLINE_CLASS' ? '📦' : '🎪';
		console.log(`   ${emoji} ${type}: ${count}`);
	}
	console.log('');

	if (result.violations.length > 0) {
		console.log('🚨 Violations:\n');

		// Group by file
		const byFile = new Map<string, TheaterViolation[]>();
		for (const v of result.violations) {
			if (!byFile.has(v.file)) byFile.set(v.file, []);
			byFile.get(v.file)!.push(v);
		}

		for (const [file, violations] of byFile) {
			const relPath = path.relative(rootDir, file);
			console.log(`📄 ${relPath}`);

			for (const v of violations) {
				console.log(`   L${v.line}: [${v.type}] ${v.component}`);
				console.log(`         ${v.message}`);
				console.log(`         → ${v.exemplar}`);
				console.log(`         Evidence: ${v.evidence}`);
				console.log('');
			}
		}

		console.log('════════════════════════════════════════════════════════════\n');
		console.log('📚 EXEMPLAR REGISTRY:');
		console.log('');
		for (const [key, config] of Object.entries(EXEMPLAR_REGISTRY)) {
			console.log(`   ${config.name}`);
			console.log(`   npm install ${config.npm}`);
			console.log(`   ESM: ${config.esm}`);
			console.log('');
		}
	} else {
		console.log('✅ No theater detected! All code uses exemplars.\n');
	}

	// Exit with error if violations found
	process.exit(result.violations.length > 0 ? 1 : 0);
}

main().catch(console.error);
