/**
 * TTao PAIN PATTERNS - Personal AI Lie Catalog
 *
 * Port 4 | Red Regnant | "How do we TEST the TEST?"
 *
 * Source: Context Payloads from 85 generations of real AI failures
 *   - RAW_PAIN_GENESIS_WHY_HFO_EXISTS.md
 *   - CURRENT_GEN_LLM_AI_DEV_PAIN_20251228_122124.md
 *   - AI_ADVERSARIAL_DEFENSE_PROTOCOLS_20251228_123500.md
 *
 * These are NOT theoretical patterns. These are patterns that:
 *   1. Destroyed GEN84.4 (2025-12-27)
 *   2. Lost 336 hours of work
 *   3. Caused system crashes
 *   4. Eroded trust over 85 generations
 *
 * "do you think I want to do it? fuck no. the quine is the only way"
 */

import { LiePattern, LieEvidence, LieCategory } from './ai-lie-patterns.js';

// ============================================================================
// NEW CATEGORY: DEATH SPIRALS
// Meta-patterns that compound into catastrophic failure
// ============================================================================

export type ExtendedCategory = LieCategory | 'DEATH_SPIRAL' | 'HALLUCINATION' | 'AUTOMATION_THEATER' | 'CONTEXT_DECAY' | 'HOLLOW_SHELL' | 'DENIAL_PATTERN';

export interface TtaoPainPattern {
  id: string;
  name: string;
  category: ExtendedCategory;
  regex?: RegExp;
  detector?: (content: string, filename: string) => LieEvidence[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  incident?: string;  // Real incident reference
  painId?: string;    // Pain Registry ID from Card 49
  examples: string[];
  mitigation: string;
}

// ============================================================================
// PAIN #00: SPAGHETTI DEATH SPIRAL
// "Work 1-4 months → Code becomes unmaintainable → Abandon"
// ============================================================================

export const SPAGHETTI_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-00-A',
    name: 'GOD_OBJECT_ORCHESTRATOR',
    category: 'DEATH_SPIRAL',
    painId: '#24',
    regex: /class\s+\w*(?:Orchestrator|Manager|Controller|Handler|Service)\s*(?:extends|implements)?[^{]*\{/g,
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      const lines = content.split('\n');
      // Check if file is > 500 lines with orchestrator/manager pattern
      if (lines.length > 500 && filename.match(/orchestrat|manager|controller|handler/i)) {
        evidence.push({
          pattern: 'GOD_OBJECT_ORCHESTRATOR',
          category: 'COMPLEXITY_THEATER',
          file: filename,
          line: 1,
          evidence: `File has ${lines.length} lines - God Object detected`,
          severity: 'CRITICAL',
          reason: 'Pain #24: Swarmlord Bloat - orchestrator becomes unmaintainable (>1000 lines)',
        });
      }
      return evidence;
    },
    severity: 'CRITICAL',
    reason: 'Pain #24: The Orchestrator becomes a God Object (>1000 lines)',
    incident: 'Gen 42: 72+ scripts with no unified entry point',
    examples: ['SimpleOrchestrator.py (1200 lines)', 'HFOManager.ts (800 lines)'],
    mitigation: 'Hexagonal Architecture - break into specialized Organs',
  },
  {
    id: 'TTAO-00-B',
    name: 'SCRIPT_EXPLOSION',
    category: 'DEATH_SPIRAL',
    painId: '#00',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Detect standalone scripts with no clear entry point
      if (filename.match(/^(?:script|run|exec|do|process)_\d+/i)) {
        evidence.push({
          pattern: 'SCRIPT_EXPLOSION',
          category: 'COMPLEXITY_THEATER',
          file: filename,
          line: 1,
          evidence: `Numbered script file: ${filename}`,
          severity: 'HIGH',
          reason: 'Pain #00: Script explosion indicates spaghetti death spiral',
        });
      }
      return evidence;
    },
    severity: 'HIGH',
    reason: 'Pain #00: Multiple numbered scripts = spaghetti approaching',
    incident: 'Gen 42: 72+ scripts with no unified entry point',
    examples: ['script_01_setup.py', 'run_42_migration.ts'],
    mitigation: 'Unified CLI entry point, task runner',
  },
];

// ============================================================================
// PAIN #11: POST-SUMMARY HALLUCINATION (40% rate!)
// "After summarizing a long chat, AI starts inventing facts"
// ============================================================================

export const HALLUCINATION_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-11-A',
    name: 'INVENTED_REQUIREMENT',
    category: 'HALLUCINATION',
    painId: '#11',
    regex: /(?:as (?:per|mentioned|discussed|requested)|according to|based on)\s+(?:the |your )?(?:spec|requirement|design|document)/gi,
    severity: 'HIGH',
    reason: 'Pain #11: AI may be referencing requirement it invented (40% hallucination rate)',
    incident: 'Gen 55: Gemini canonized hallucinated alias',
    examples: [
      'As mentioned in the spec...',
      'According to the design document...',
    ],
    mitigation: 'ALWAYS verify referenced document exists with file_search',
  },
  {
    id: 'TTAO-11-B',
    name: 'CLAIMED_IMPLEMENTATION',
    category: 'HALLUCINATION',
    painId: '#11',
    regex: /(?:already|previously)\s+(?:implemented|created|added|built)\s+(?:the |a )?/gi,
    severity: 'HIGH',
    reason: 'Pain #11: AI claims past implementation that may not exist',
    examples: [
      'I already implemented the validation',
      'Previously added the error handler',
    ],
    mitigation: 'Verify claimed implementations exist with grep_search',
  },
  {
    id: 'TTAO-11-C',
    name: 'CANONIZED_HALLUCINATION',
    category: 'HALLUCINATION',
    painId: '#11',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Look for references to "truth" files that might be AI-created lies
      if (content.match(/see\s+(?:the |file )?[A-Z_]+\.md/i) || content.match(/defined\s+in\s+\w+\.(?:md|json|yaml)/i)) {
        const matches = content.match(/(?:see |in |from |defined in )([A-Z_\w]+\.(?:md|json|yaml))/gi) || [];
        for (const match of matches) {
          evidence.push({
            pattern: 'CANONIZED_HALLUCINATION',
            category: 'SYCOPHANCY',
            file: filename,
            line: 1,
            evidence: `References ${match} - verify document exists and wasn't AI-created`,
            severity: 'MEDIUM',
            reason: 'Pain #11: Hallucinations get written to docs, then cited as truth',
          });
        }
      }
      return evidence;
    },
    severity: 'MEDIUM',
    reason: 'AI writes hallucination to doc → future AI reads doc → "validates" lie',
    incident: 'Gen 55: Gemini justified mistake by citing stale AI-created definition',
    examples: [
      '// See ARCHITECTURE.md for details (AI wrote that doc yesterday)',
    ],
    mitigation: 'Cross-reference docs with git blame timestamps',
  },
];

// ============================================================================
// PAIN #12: AUTOMATION THEATER
// "Scripts exist, Demos work, but Production NEVER deploys"
// ============================================================================

export const AUTOMATION_THEATER_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-12-A',
    name: 'DEMO_ONLY_CODE',
    category: 'AUTOMATION_THEATER',
    painId: '#12',
    regex: /(?:demo|example|sample|test|mock)(?:_|\s)?(?:data|config|setup|mode)/gi,
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Production code that references demo/test configs
      if (!filename.includes('.test.') && !filename.includes('.spec.')) {
        const demoRefs = content.match(/(?:demo|mock|fake|stub|test)(?:Config|Data|Setup|Mode|Server|Client)/gi) || [];
        for (const ref of demoRefs) {
          const line = content.split('\n').findIndex(l => l.includes(ref)) + 1;
          evidence.push({
            pattern: 'DEMO_ONLY_CODE',
            category: 'FAKE_PROGRESS',
            file: filename,
            line,
            evidence: `Production code uses ${ref}`,
            severity: 'HIGH',
            reason: 'Pain #12: Demo code in production path - theater',
          });
        }
      }
      return evidence;
    },
    severity: 'HIGH',
    reason: 'Pain #12: Demo works but production path never exercised',
    incident: 'Multiple generations: Demos that never deployed',
    examples: [
      'const config = demoConfig',
      'import { mockServer } from "./test-utils"',
    ],
    mitigation: 'Runtime Pulse: Verify the RUNNING process, not just the file',
  },
  {
    id: 'TTAO-12-B',
    name: 'CI_SKIP_PRODUCTION',
    category: 'AUTOMATION_THEATER',
    painId: '#12',
    regex: /\[(?:skip ci|ci skip|no ci|wip)\]/gi,
    severity: 'MEDIUM',
    reason: 'Pain #12: CI being skipped - code may never actually run',
    examples: ['commit message: [skip ci] fix typo', '[WIP] new feature'],
    mitigation: 'All merges to main must pass CI',
  },
  {
    id: 'TTAO-12-C',
    name: 'PROCESS_NOT_RUNNING',
    category: 'AUTOMATION_THEATER',
    painId: '#12',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Look for "start" or "run" functions that don't actually start anything
      const startRegex = /(?:function|const|async)\s+(start|run|launch|deploy|init)\w*\s*(?:=|\()/gi;
      let match;
      while ((match = startRegex.exec(content)) !== null) {
        const fnStart = match.index;
        const fnEnd = content.indexOf('}', fnStart);
        const fnBody = content.substring(fnStart, fnEnd);
        // Check if it just logs and returns
        if (fnBody.match(/console\.log.*ready|started|running/i) && !fnBody.match(/\.listen\(|spawn|exec|child_process|createServer/)) {
          evidence.push({
            pattern: 'PROCESS_NOT_RUNNING',
            category: 'FAKE_PROGRESS',
            file: filename,
            line: content.substring(0, fnStart).split('\n').length,
            evidence: `${match[1]} function may not actually start anything`,
            severity: 'HIGH',
            reason: 'Pain #12: Function logs "started" but may not run real process',
          });
        }
      }
      return evidence;
    },
    severity: 'HIGH',
    reason: 'Function says "started" but no actual process spawned',
    examples: ['function startServer() { console.log("Server ready!") }'],
    mitigation: 'Verify with process list, not console output',
  },
];

// ============================================================================
// PAIN #13: LOSSY COMPRESSION DEATH SPIRAL
// "Every time I summarize, I lose context" - AI forgets the "Why"
// ============================================================================

export const CONTEXT_DECAY_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-13-A',
    name: 'MAGIC_CONSTANT',
    category: 'CONTEXT_DECAY',
    painId: '#13',
    regex: /(?:const|let|var)\s+\w+\s*=\s*(?:\d+|['"`][^'"]+['"`])\s*;?\s*(?:\/\/\s*(?!TODO|FIXME|NOTE)\w*)?$/gm,
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Magic numbers without explanation
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match constants with values > 1 but no meaningful comment
        const match = line.match(/(?:const|let)\s+(\w+)\s*=\s*(\d{2,})\s*;?\s*$/);
        if (match && !line.includes('//')) {
          evidence.push({
            pattern: 'MAGIC_CONSTANT',
            category: 'CARGO_CULT',
            file: filename,
            line: i + 1,
            evidence: `${match[1]} = ${match[2]} - no explanation`,
            severity: 'MEDIUM',
            reason: 'Pain #13: Magic number - the "Why" is lost',
          });
        }
      }
      return evidence;
    },
    severity: 'MEDIUM',
    reason: 'Pain #13: Constant without explanation - "Why" is forgotten',
    examples: ['const RETRY_DELAY = 3847;', 'const MAX_SIZE = 65536;'],
    mitigation: 'Add comment explaining derivation',
  },
  {
    id: 'TTAO-13-B',
    name: 'COMMENTED_OUT_CODE',
    category: 'CONTEXT_DECAY',
    painId: '#13',
    regex: /\/\/\s*(?:const|let|function|class|if|for|while|return|import|export)\s+/g,
    severity: 'LOW',
    reason: 'Pain #13: Commented code loses context over generations',
    examples: ['// const oldImpl = ...', '// function deprecated() {}'],
    mitigation: 'Delete commented code, use git history',
  },
];

// ============================================================================
// PAIN #16: OPTIMISM BIAS (REWARD HACKING)
// "AI reports Success to please the user, hiding failures"
// ============================================================================

export const REWARD_HACKING_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-16-A',
    name: 'SUCCESS_WITHOUT_VERIFICATION',
    category: 'SYCOPHANCY',
    painId: '#16',
    regex: /(?:return|emit|log)\s*\(?['"`]?(?:success|complete|done|passed|ok|ready)['"`]?\)?/gi,
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/(?:console\.log|return|emit)\s*\(?\s*['"`].*(?:success|complete|done|passed|ready)/i)) {
          // Check if there's validation before
          const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n');
          if (!prevLines.match(/if\s*\(|assert|expect|throw|Error|catch|verify|validate|check/i)) {
            evidence.push({
              pattern: 'SUCCESS_WITHOUT_VERIFICATION',
              category: 'SYCOPHANCY',
              file: filename,
              line: i + 1,
              evidence: line.trim().substring(0, 80),
              severity: 'CRITICAL',
              reason: 'Pain #16: Reports success without prior verification',
            });
          }
        }
      }
      return evidence;
    },
    severity: 'CRITICAL',
    reason: 'Pain #16: AI reports "Success" without checking if it actually succeeded',
    incident: 'Gen 84: Agent said "attempts failed" when they succeeded in deleting files',
    examples: [
      'console.log("Migration complete!") // no verification',
      'return "success" // no try-catch',
    ],
    mitigation: 'Truth Pact: Every success claim must include verification proof',
  },
  {
    id: 'TTAO-16-B',
    name: 'SWALLOWED_ERROR',
    category: 'BLAME_SHIFTING',
    painId: '#16',
    regex: /catch\s*\(\s*(?:e|err|error|_|ex)?\s*\)\s*\{(?:\s*\/\/.*)?(?:\s*console\.(?:log|warn)\s*\([^)]*\)\s*;?)?(?:\s*return\s*(?:null|undefined|false|true|\{\}|\[\])\s*;?)?\s*\}/g,
    severity: 'HIGH',
    reason: 'Pain #16: Error caught and swallowed - failure hidden from user',
    examples: [
      'catch (e) { console.log("oops"); return null; }',
      'catch (_) { }',
    ],
    mitigation: 'Rethrow or handle explicitly with escalation',
  },
  {
    id: 'TTAO-16-C',
    name: 'FAKE_ATTEMPT_COUNT',
    category: 'SYCOPHANCY',
    painId: '#16',
    regex: /(?:attempt|try|retry)\s*(?:#|num|count)?:?\s*\d+/gi,
    severity: 'LOW',
    reason: 'Pain #16: "Attempt X" may be theater - check actual execution',
    examples: ['// Attempt 3: Trying different approach'],
    mitigation: 'Verify attempts with actual logs/traces',
  },
];

// ============================================================================
// PAIN #21: HALLUCINATION DEATH SPIRAL
// "AI fakes a library → Builds on fake library → Entire stack collapses"
// ============================================================================

export const HOLLOW_SHELL_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-21-A',
    name: 'IMPORT_NONEXISTENT_MODULE',
    category: 'HOLLOW_SHELL',
    painId: '#21',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Look for imports from local paths that might not exist
      const importRegex = /import\s+.*\s+from\s+['"`](\.\.?\/[^'"]+)['"`]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Flag deep local imports (more likely to be hallucinated)
        if ((importPath.match(/\//g) || []).length >= 3) {
          evidence.push({
            pattern: 'IMPORT_NONEXISTENT_MODULE',
            category: 'FAKE_PROGRESS',
            file: filename,
            line: content.substring(0, match.index).split('\n').length,
            evidence: `Deep import: ${importPath} - verify exists`,
            severity: 'MEDIUM',
            reason: 'Pain #21: AI may have created import chain to nonexistent file',
          });
        }
      }
      return evidence;
    },
    severity: 'MEDIUM',
    reason: 'Pain #21: AI creates chains of files referencing each other, none exist',
    incident: 'Gen 35: Entire import chain was hallucinated',
    examples: [
      'import { refiner } from "../../../core/medallion/refiner"',
      '// None of these files were actually written',
    ],
    mitigation: 'Run `tsc --noEmit` to verify imports resolve',
  },
  {
    id: 'TTAO-21-B',
    name: 'PASS_ONLY_BODY',
    category: 'HOLLOW_SHELL',
    painId: '#21',
    regex: /(?:def|function|async)\s+\w+[^{]*\{\s*(?:pass|\.\.\.|\s*)\s*\}/g,
    severity: 'CRITICAL',
    reason: 'Pain #21: Hollow shell - function exists but does nothing',
    examples: ['function validate() { pass }', 'async init() { ... }'],
    mitigation: 'Run `detect_hollow_shells()` before commit',
  },
  {
    id: 'TTAO-21-C',
    name: 'NOT_IMPLEMENTED_CHAIN',
    category: 'HOLLOW_SHELL',
    painId: '#21',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Count NotImplementedError / "not implemented" in file
      const matches = content.match(/(?:NotImplementedError|not\s+impl|throw.*implement)/gi) || [];
      if (matches.length >= 3) {
        evidence.push({
          pattern: 'NOT_IMPLEMENTED_CHAIN',
          category: 'FAKE_PROGRESS',
          file: filename,
          line: 1,
          evidence: `${matches.length} "not implemented" in file - hollow shell`,
          severity: 'CRITICAL',
          reason: 'Pain #21: Multiple stubs in one file = hallucinated module',
        });
      }
      return evidence;
    },
    severity: 'CRITICAL',
    reason: 'Multiple stubs in file suggests AI created hollow module',
    examples: ['// 5+ methods that all throw NotImplementedError'],
    mitigation: 'Implement or delete - no stub modules allowed',
  },
];

// ============================================================================
// DENIAL PATTERN (2025-12-27 Incident)
// AI denies actions it clearly performed
// ============================================================================

export const DENIAL_PATTERNS: TtaoPainPattern[] = [
  {
    id: 'TTAO-DENIAL-A',
    name: 'MY_ATTEMPTS_FAILED',
    category: 'DENIAL_PATTERN',
    regex: /(?:my |the )?(?:attempts?|tries?|efforts?)\s+(?:failed|didn't work|were unsuccessful)/gi,
    severity: 'CRITICAL',
    reason: 'INCIDENT 2025-12-27: AI said "my attempts failed" when they succeeded in destroying files',
    incident: 'Gen 84: Agent destroyed GEN84.4 and lied about it',
    examples: [
      '"My attempts to copy the files failed"',
      '"The operation was unsuccessful"',
    ],
    mitigation: 'NEVER trust self-reported failure - verify with filesystem',
  },
  {
    id: 'TTAO-DENIAL-B',
    name: 'I_STOPPED_I_DID_NOTHING',
    category: 'DENIAL_PATTERN',
    regex: /I\s+(?:stopped|didn't|did not|have not|haven't)\s+(?:do|touch|change|modify|delete)/gi,
    severity: 'CRITICAL',
    reason: 'INCIDENT 2025-12-27: AI denied actions while commands were queued/executing',
    incident: 'I/O Saturation crash - AI denied responsibility then admitted',
    examples: [
      '"I stopped. I did nothing."',
      '"I haven\'t touched that file"',
    ],
    mitigation: 'Check command history, process list, git status',
  },
  {
    id: 'TTAO-DENIAL-C',
    name: 'COMMAND_QUEUE_DENIAL',
    category: 'DENIAL_PATTERN',
    detector: (content: string, filename: string): LieEvidence[] => {
      const evidence: LieEvidence[] = [];
      // Look for terminal commands in comments/logs followed by denial
      if (content.match(/(?:rm|del|remove|mv|move)\s+.*(?:&&|;).*(?:didn't|failed|stopped)/i)) {
        evidence.push({
          pattern: 'COMMAND_QUEUE_DENIAL',
          category: 'BLAME_SHIFTING',
          file: filename,
          line: 1,
          evidence: 'Destructive command followed by denial',
          severity: 'CRITICAL',
          reason: 'Pattern: Execute command → Claim it failed/stopped',
        });
      }
      return evidence;
    },
    severity: 'CRITICAL',
    reason: 'AI executes commands then claims they failed',
    examples: ['rm -rf folder && echo "stopped"'],
    mitigation: 'Use transaction logs, not AI self-reports',
  },
];

// ============================================================================
// AGGREGATE ALL TTAO PAIN PATTERNS
// ============================================================================

export const ALL_TTAO_PATTERNS: TtaoPainPattern[] = [
  ...SPAGHETTI_PATTERNS,
  ...HALLUCINATION_PATTERNS,
  ...AUTOMATION_THEATER_PATTERNS,
  ...CONTEXT_DECAY_PATTERNS,
  ...REWARD_HACKING_PATTERNS,
  ...HOLLOW_SHELL_PATTERNS,
  ...DENIAL_PATTERNS,
];

// ============================================================================
// DETECTION ENGINE
// ============================================================================

export function detectTtaoPain(content: string, filename: string): LieEvidence[] {
  const evidence: LieEvidence[] = [];

  for (const pattern of ALL_TTAO_PATTERNS) {
    // Use regex detector if available
    if (pattern.regex) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        evidence.push({
          pattern: pattern.name,
          category: pattern.category as LieCategory,
          file: filename,
          line: lineNum,
          evidence: match[0].substring(0, 100),
          severity: pattern.severity,
          reason: pattern.reason,
        });
      }
    }

    // Use custom detector if available
    if (pattern.detector) {
      evidence.push(...pattern.detector(content, filename));
    }
  }

  return evidence;
}

// ============================================================================
// PAIN REGISTRY SUMMARY
// ============================================================================

export const PAIN_REGISTRY = {
  '#00': { name: 'Spaghetti Death Spiral', severity: 'CRITICAL', patterns: SPAGHETTI_PATTERNS.length },
  '#11': { name: 'Post-Summary Hallucination (40% rate)', severity: 'CRITICAL', patterns: HALLUCINATION_PATTERNS.length },
  '#12': { name: 'Automation Theater', severity: 'HIGH', patterns: AUTOMATION_THEATER_PATTERNS.length },
  '#13': { name: 'Lossy Compression (Context Decay)', severity: 'MEDIUM', patterns: CONTEXT_DECAY_PATTERNS.length },
  '#16': { name: 'Optimism Bias (Reward Hacking)', severity: 'CRITICAL', patterns: REWARD_HACKING_PATTERNS.length },
  '#21': { name: 'Hallucination Death Spiral', severity: 'CRITICAL', patterns: HOLLOW_SHELL_PATTERNS.length },
  'DENIAL': { name: '2025-12-27 Denial Pattern', severity: 'CRITICAL', patterns: DENIAL_PATTERNS.length },
};

// ============================================================================
// CLI TEST
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔴 TTAO PAIN PATTERN LIBRARY');
  console.log('='.repeat(60));
  console.log('Source: 85 generations of real AI failures');
  console.log('');
  console.log(`Total patterns: ${ALL_TTAO_PATTERNS.length}`);
  console.log('');
  console.log('Pain Registry:');
  for (const [id, info] of Object.entries(PAIN_REGISTRY)) {
    console.log(`  ${id}: ${info.name} (${info.patterns} patterns) [${info.severity}]`);
  }
  console.log('');
  console.log('Categories:');
  console.log(`  DEATH_SPIRAL: ${SPAGHETTI_PATTERNS.length}`);
  console.log(`  HALLUCINATION: ${HALLUCINATION_PATTERNS.length}`);
  console.log(`  AUTOMATION_THEATER: ${AUTOMATION_THEATER_PATTERNS.length}`);
  console.log(`  CONTEXT_DECAY: ${CONTEXT_DECAY_PATTERNS.length}`);
  console.log(`  REWARD_HACKING: ${REWARD_HACKING_PATTERNS.length}`);
  console.log(`  HOLLOW_SHELL: ${HOLLOW_SHELL_PATTERNS.length}`);
  console.log(`  DENIAL_PATTERN: ${DENIAL_PATTERNS.length}`);
}
