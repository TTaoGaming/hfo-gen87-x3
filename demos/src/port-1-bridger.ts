/**
 * Port 1 - Bridger Demo (Web Weaver)
 *
 * Gen87.X3 | FUSE | Contracts & Schema Gating
 *
 * @port 1
 * @verb FUSE
 * @binary 001
 * @element Mountain - Stable interface, gateway
 *
 * This demo shows:
 * 1. Zod schema validation at port boundaries
 * 2. Valguard gating (pass/fail visualization)
 * 3. Schema registry lookup
 * 4. Contract enforcement WITHOUT transformation
 *
 * CAN: read, validate, compose, route
 * CANNOT: persist, decide, skip_validation
 */

import type { z } from 'zod';
import {
	type ValguardResult,
	createStrictValguard,
	createValguard,
} from '../../hot/bronze/src/contracts/port-1-web-weaver.js';
import {
	FSMActionSchema,
	SensorFrameSchema,
	SmoothedFrameSchema,
} from '../../hot/bronze/src/contracts/schemas.js';

// ============================================================================
// SCHEMA REGISTRY (Port 1's Domain)
// ============================================================================

const SCHEMA_REGISTRY = {
	'Port0:SensorFrame': SensorFrameSchema,
	'Port2:SmoothedFrame': SmoothedFrameSchema,
	'Port3:FSMAction': FSMActionSchema,
} as const;

type SchemaName = keyof typeof SCHEMA_REGISTRY;

// ============================================================================
// DOM SETUP
// ============================================================================

function createDemoUI(): void {
	const container = document.getElementById('app') ?? document.body;
	container.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0d1117; 
        color: #c9d1d9; 
        min-height: 100vh;
        padding: 20px;
      }
      .header { 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #30363d;
      }
      .header h1 { font-size: 1.4rem; }
      .badge { 
        background: #a371f7; 
        color: #000; 
        padding: 4px 12px; 
        border-radius: 4px; 
        font-size: 0.75rem; 
        font-weight: bold; 
      }
      .grid { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
      }
      .panel { 
        background: #161b22; 
        border: 1px solid #30363d; 
        border-radius: 8px; 
        padding: 16px; 
      }
      .panel.full { grid-column: span 2; }
      .panel h2 { 
        font-size: 0.9rem; 
        color: #8b949e; 
        margin-bottom: 12px; 
        text-transform: uppercase; 
      }
      textarea { 
        width: 100%; 
        height: 200px; 
        background: #0d1117; 
        color: #c9d1d9; 
        border: 1px solid #30363d; 
        border-radius: 4px; 
        padding: 12px; 
        font-family: 'Fira Code', monospace; 
        font-size: 0.8rem;
        resize: vertical;
      }
      button { 
        padding: 10px 20px; 
        background: #a371f7; 
        color: #000; 
        border: none; 
        border-radius: 6px; 
        cursor: pointer; 
        font-size: 0.9rem; 
        font-weight: bold;
        margin: 8px 4px 8px 0;
      }
      button:hover { background: #8957e5; }
      button.secondary { 
        background: #21262d; 
        color: #c9d1d9; 
        border: 1px solid #30363d;
      }
      button.secondary:hover { background: #30363d; }
      .result { 
        margin-top: 16px; 
        padding: 16px; 
        border-radius: 4px; 
        font-family: monospace;
        font-size: 0.8rem;
        white-space: pre-wrap;
        max-height: 300px;
        overflow-y: auto;
      }
      .result.pass { 
        background: #0d2818; 
        border: 1px solid #238636; 
        color: #3fb950; 
      }
      .result.fail { 
        background: #3d1f1f; 
        border: 1px solid #f85149; 
        color: #f85149; 
      }
      .result.pending {
        background: #21262d;
        border: 1px solid #30363d;
        color: #8b949e;
      }
      .gate-grid { 
        display: grid; 
        grid-template-columns: repeat(4, 1fr); 
        gap: 8px; 
        margin-bottom: 16px;
      }
      .gate { 
        padding: 12px; 
        border-radius: 4px; 
        text-align: center; 
        font-size: 0.75rem;
        font-weight: bold;
      }
      .gate.pass { background: #238636; color: #fff; }
      .gate.fail { background: #f85149; color: #fff; }
      .gate.pending { background: #30363d; color: #8b949e; }
      select {
        padding: 8px 12px;
        background: #21262d;
        color: #c9d1d9;
        border: 1px solid #30363d;
        border-radius: 4px;
        font-size: 0.9rem;
        margin-bottom: 12px;
      }
      .schema-info {
        font-size: 0.75rem;
        color: #8b949e;
        margin-bottom: 8px;
      }
      .examples { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 4px; 
        margin-bottom: 12px;
      }
      .examples button { 
        padding: 4px 8px; 
        font-size: 0.7rem; 
      }
    </style>
    
    <div class="header">
      <h1>🕸️ Port 1: Bridger</h1>
      <span class="badge">FUSE</span>
      <span class="badge" style="background:#3a3a3a;color:#fff;">JADC2: Gateways</span>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h2>📋 Schema Selection</h2>
        <select id="schemaSelect">
          <option value="Port0:SensorFrame">Port 0: SensorFrame</option>
          <option value="Port2:SmoothedFrame">Port 2: SmoothedFrame</option>
          <option value="Port3:FSMAction">Port 3: FSMAction</option>
        </select>
        <div id="schemaInfo" class="schema-info"></div>
        
        <h2>🧪 Test Examples</h2>
        <div class="examples">
          <button class="secondary" onclick="loadExample('valid')">✅ Valid</button>
          <button class="secondary" onclick="loadExample('invalid-type')">❌ Wrong Type</button>
          <button class="secondary" onclick="loadExample('invalid-range')">❌ Out of Range</button>
          <button class="secondary" onclick="loadExample('missing-field')">❌ Missing Field</button>
          <button class="secondary" onclick="loadExample('extra-field')">⚠️ Extra Field</button>
        </div>
      </div>
      
      <div class="panel">
        <h2>🚦 G0-G7 Gate Status</h2>
        <div class="gate-grid">
          <div id="gate-g0" class="gate pending">G0: ts</div>
          <div id="gate-g1" class="gate pending">G1: mark</div>
          <div id="gate-g2" class="gate pending">G2: pull</div>
          <div id="gate-g3" class="gate pending">G3: msg</div>
          <div id="gate-g4" class="gate pending">G4: type</div>
          <div id="gate-g5" class="gate pending">G5: hive</div>
          <div id="gate-g6" class="gate pending">G6: gen</div>
          <div id="gate-g7" class="gate pending">G7: port</div>
        </div>
        <div id="gateResult" class="result pending">Select schema and validate to see gate results</div>
      </div>
      
      <div class="panel full">
        <h2>📝 Input JSON</h2>
        <textarea id="inputJson">{
  "ts": 1234.567,
  "handId": "right",
  "trackingOk": true,
  "palmFacing": true,
  "label": "Open_Palm",
  "confidence": 0.95,
  "indexTip": { "x": 0.5, "y": 0.5, "z": 0.0 },
  "landmarks": null
}</textarea>
        <button id="validateBtn">🔍 Validate (Valguard)</button>
        <button id="strictBtn" class="secondary">⚡ Strict Parse (Throws)</button>
        <button id="safeBtn" class="secondary">🛡️ Safe Parse (Result)</button>
        <div id="validationResult" class="result pending">Click validate to check schema compliance</div>
      </div>
    </div>
  `;
}

// ============================================================================
// EXAMPLE DATA
// ============================================================================

const EXAMPLES: Record<string, Record<SchemaName, unknown>> = {
	valid: {
		'Port0:SensorFrame': {
			ts: 1234.567,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			indexTip: { x: 0.5, y: 0.5, z: 0.0, visibility: 0.9 },
			landmarks: null,
		},
		'Port2:SmoothedFrame': {
			ts: 1234.567,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Pointing_Up',
			confidence: 0.88,
			position: { x: 0.5, y: 0.5 },
			velocity: { x: 0.01, y: -0.02 },
			prediction: { x: 0.51, y: 0.48 },
		},
		'Port3:FSMAction': {
			action: 'none',
			state: 'ARMED',
		},
	},
	'invalid-type': {
		'Port0:SensorFrame': {
			ts: 'not-a-number', // Should be number
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			indexTip: null,
			landmarks: null,
		},
		'Port2:SmoothedFrame': {
			ts: 1234.567,
			handId: 123, // Should be string enum
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.88,
			position: null,
			velocity: null,
			prediction: null,
		},
		'Port3:FSMAction': {
			action: 123, // Should be string literal
			state: 'ARMED',
		},
	},
	'invalid-range': {
		'Port0:SensorFrame': {
			ts: -100, // Should be nonnegative
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 1.5, // Should be 0-1
			indexTip: { x: 2.0, y: -0.5, z: 0.0 }, // x,y should be 0-1
			landmarks: null,
		},
		'Port2:SmoothedFrame': {
			ts: 1234.567,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: -0.5, // Should be 0-1
			position: { x: 1.5, y: 0.5 }, // x should be 0-1
			velocity: null,
			prediction: null,
		},
		'Port3:FSMAction': {
			action: 'none',
			state: 'INVALID_STATE', // Not in FSMStates enum
		},
	},
	'missing-field': {
		'Port0:SensorFrame': {
			ts: 1234.567,
			// Missing: handId, trackingOk, palmFacing, label, confidence
			indexTip: null,
			landmarks: null,
		},
		'Port2:SmoothedFrame': {
			ts: 1234.567,
			// Missing required fields
		},
		'Port3:FSMAction': {
			action: 'none',
			// Missing: state
		},
	},
	'extra-field': {
		'Port0:SensorFrame': {
			ts: 1234.567,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.95,
			indexTip: null,
			landmarks: null,
			EXTRA_FIELD: 'This should be stripped in strict mode',
		},
		'Port2:SmoothedFrame': {
			ts: 1234.567,
			handId: 'right',
			trackingOk: true,
			palmFacing: true,
			label: 'Open_Palm',
			confidence: 0.88,
			position: null,
			velocity: null,
			prediction: null,
			unknownField: { nested: true },
		},
		'Port3:FSMAction': {
			action: 'none',
			state: 'ARMED',
			bonus: 'extra data',
		},
	},
};

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

function getSchemaInfo(name: SchemaName): string {
	const descriptions: Record<SchemaName, string> = {
		'Port0:SensorFrame': 'Raw sensor output from MediaPipe (21 landmarks + gesture)',
		'Port2:SmoothedFrame': 'Filtered position with velocity and prediction',
		'Port3:FSMAction': 'FSM output: pointer event action to emit',
	};
	return descriptions[name];
}

function validateWithValguard(schema: z.ZodSchema, data: unknown): ValguardResult<unknown> {
	const valguard = createValguard(schema);
	return valguard(data);
}

function updateGateDisplay(result: ValguardResult<unknown>): void {
	// Reset all gates
	for (let i = 0; i <= 7; i++) {
		const gate = document.getElementById(`gate-g${i}`);
		if (gate) {
			gate.className = 'gate pending';
		}
	}

	if (result.success) {
		// All gates pass
		for (let i = 0; i <= 7; i++) {
			const gate = document.getElementById(`gate-g${i}`);
			if (gate) gate.className = 'gate pass';
		}
	} else if (result.error) {
		// Mark failed gate based on path
		const path = result.error.path[0];
		const gateMap: Record<string, number> = {
			ts: 0,
			mark: 1,
			pull: 2,
			msg: 3,
			type: 4,
			hive: 5,
			gen: 6,
			port: 7,
		};

		const failedGate = gateMap[path as string];
		if (failedGate !== undefined) {
			const gate = document.getElementById(`gate-g${failedGate}`);
			if (gate) gate.className = 'gate fail';
		}
	}
}

// ============================================================================
// GLOBAL HANDLERS
// ============================================================================

declare global {
	interface Window {
		loadExample: (type: string) => void;
	}
}

function setupHandlers(): void {
	const schemaSelect = document.getElementById('schemaSelect') as HTMLSelectElement;
	const schemaInfo = document.getElementById('schemaInfo')!;
	const inputJson = document.getElementById('inputJson') as HTMLTextAreaElement;
	const validateBtn = document.getElementById('validateBtn')!;
	const strictBtn = document.getElementById('strictBtn')!;
	const safeBtn = document.getElementById('safeBtn')!;
	const validationResult = document.getElementById('validationResult')!;
	const gateResult = document.getElementById('gateResult')!;

	// Update schema info on selection
	schemaSelect.addEventListener('change', () => {
		const name = schemaSelect.value as SchemaName;
		schemaInfo.textContent = getSchemaInfo(name);
		// Load valid example for new schema
		window.loadExample('valid');
	});

	// Load example data
	window.loadExample = (type: string) => {
		const name = schemaSelect.value as SchemaName;
		const example = EXAMPLES[type]?.[name];
		if (example) {
			inputJson.value = JSON.stringify(example, null, 2);
		}
	};

	// Valguard validation
	validateBtn.addEventListener('click', () => {
		const name = schemaSelect.value as SchemaName;
		const schema = SCHEMA_REGISTRY[name];

		try {
			const data = JSON.parse(inputJson.value);
			const result = validateWithValguard(schema, data);

			updateGateDisplay(result);

			if (result.success) {
				validationResult.className = 'result pass';
				validationResult.textContent = `✅ VALGUARD PASS\n\nValidated data:\n${JSON.stringify(result.data, null, 2)}`;
				gateResult.className = 'result pass';
				gateResult.textContent = '✅ All gates passed';
			} else {
				validationResult.className = 'result fail';
				validationResult.textContent = `❌ VALGUARD FAIL\n\nError: ${result.error?.message}\nPath: ${result.error?.path.join('.')}\n\nIssues:\n${result.error?.issues
					.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
					.join('\n')}`;
				gateResult.className = 'result fail';
				gateResult.textContent = `❌ Gate failed at: ${result.error?.path.join('.')}`;
			}
		} catch (e) {
			validationResult.className = 'result fail';
			validationResult.textContent = `❌ JSON PARSE ERROR\n\n${(e as Error).message}`;
			gateResult.className = 'result fail';
			gateResult.textContent = '❌ Invalid JSON input';
		}
	});

	// Strict parse (throws)
	strictBtn.addEventListener('click', () => {
		const name = schemaSelect.value as SchemaName;
		const schema = SCHEMA_REGISTRY[name];

		try {
			const data = JSON.parse(inputJson.value);
			const strictValguard = createStrictValguard(schema, name);
			const result = strictValguard(data);

			validationResult.className = 'result pass';
			validationResult.textContent = `✅ STRICT PARSE SUCCESS\n\n${JSON.stringify(result, null, 2)}`;
		} catch (e) {
			validationResult.className = 'result fail';
			validationResult.textContent = `❌ STRICT PARSE THREW\n\n${(e as Error).message}`;
		}
	});

	// Safe parse (returns result)
	safeBtn.addEventListener('click', () => {
		const name = schemaSelect.value as SchemaName;
		const schema = SCHEMA_REGISTRY[name];

		try {
			const data = JSON.parse(inputJson.value);
			const result = schema.safeParse(data);

			if (result.success) {
				validationResult.className = 'result pass';
				validationResult.textContent = `✅ SAFE PARSE SUCCESS\n\n${JSON.stringify(result.data, null, 2)}`;
			} else {
				validationResult.className = 'result fail';
				validationResult.textContent = `❌ SAFE PARSE FAILED\n\n${result.error.issues
					.map((i) => `${i.path.join('.')}: ${i.message} (${i.code})`)
					.join('\n')}`;
			}
		} catch (e) {
			validationResult.className = 'result fail';
			validationResult.textContent = `❌ JSON ERROR\n\n${(e as Error).message}`;
		}
	});

	// Initialize
	schemaInfo.textContent = getSchemaInfo('Port0:SensorFrame');
}

// ============================================================================
// MAIN
// ============================================================================

export function startPort1Demo(): void {
	createDemoUI();
	setupHandlers();
}

// Auto-start
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', () => {
		if (!document.getElementById('app')) {
			const app = document.createElement('div');
			app.id = 'app';
			document.body.appendChild(app);
		}
		startPort1Demo();
	});
}
