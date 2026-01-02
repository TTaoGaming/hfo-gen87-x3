/**
 * Showcase: SubstratePort - Hot-Swappable Message Bus
 *
 * Gen87.X3 | SUBSTRATE | Pub/Sub + KV Store
 *
 * Demonstrates the SubstratePort interface with hot-swappable adapters:
 * - InMemorySubstrateAdapter: RxJS-based, browser-only, no server needed
 * - NatsSubstrateAdapter: Production-ready, requires NATS server
 *
 * Both adapters implement the same SubstratePort interface, allowing
 * seamless switching between development and production environments.
 *
 * Features:
 * - Topic-based pub/sub
 * - Key-value store for state persistence
 * - Connection lifecycle management
 * - Adapter hot-swapping
 */

import {
	InMemorySubstrateAdapter,
	NatsSubstrateAdapter,
} from '../../hot/bronze/src/browser/index.js';
import type { SubstratePort } from '../../hot/bronze/src/contracts/ports.js';

// ============================================================================
// SUBSTRATE INITIALIZATION (Hot-Swappable)
// ============================================================================

// Default to in-memory adapter (no server needed)
let substrate: SubstratePort = new InMemorySubstrateAdapter();
let currentAdapterType: 'inmemory' | 'nats' = 'inmemory';

// UI Elements
let messageLog: HTMLDivElement;
let kvDisplay: HTMLDivElement;
let statusIndicator: HTMLDivElement;
let topicInput: HTMLInputElement;
let messageInput: HTMLInputElement;
let kvKeyInput: HTMLInputElement;
let kvValueInput: HTMLInputElement;

// Message counter
let messageCount = 0;

// ============================================================================
// STYLES
// ============================================================================

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    background: #0d1117;
    color: #c9d1d9;
    min-height: 100vh;
    padding: 24px;
  }
  
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .header h1 {
    font-size: 1.5rem;
    background: linear-gradient(135deg, #79c0ff 0%, #a371f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .badge.substrate { background: #238636; color: #fff; }
  .badge.rxjs { background: #b7178c; color: #fff; }
  .badge.nats { background: #27aae1; color: #fff; }
  
  .status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
  }
  
  .status.connected { background: #238636; color: #fff; }
  .status.disconnected { background: #da3633; color: #fff; }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
  }
  
  .panel {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
  }
  
  .panel h3 {
    color: #58a6ff;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
  
  .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  input {
    flex: 1;
    padding: 8px 12px;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #c9d1d9;
    font-family: inherit;
    font-size: 0.85rem;
  }
  
  input:focus {
    outline: none;
    border-color: #58a6ff;
  }
  
  button {
    padding: 8px 16px;
    background: #238636;
    border: none;
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.85rem;
    transition: background 0.2s;
  }
  
  button:hover { background: #2ea043; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  
  button.secondary {
    background: #21262d;
    border: 1px solid #30363d;
  }
  
  button.secondary:hover { background: #30363d; }
  
  button.danger { background: #da3633; }
  button.danger:hover { background: #f85149; }
  
  .log {
    height: 300px;
    overflow-y: auto;
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 8px;
    font-size: 0.8rem;
  }
  
  .log-entry {
    padding: 4px 0;
    border-bottom: 1px solid #21262d;
  }
  
  .log-entry:last-child { border-bottom: none; }
  
  .log-entry .topic { color: #79c0ff; }
  .log-entry .message { color: #7ee787; }
  .log-entry .timestamp { color: #8b949e; font-size: 0.7rem; }
  
  .kv-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .kv-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: #0d1117;
    border-radius: 4px;
    margin-bottom: 4px;
  }
  
  .kv-item .key { color: #ffa657; }
  .kv-item .value { color: #7ee787; }
  
  .controls {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  
  .stats {
    display: flex;
    gap: 24px;
    padding: 12px;
    background: #21262d;
    border-radius: 6px;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #58a6ff;
  }
  
  .stat .label {
    font-size: 0.75rem;
    color: #8b949e;
  }
`;

// ============================================================================
// UI RENDERING
// ============================================================================

function render(): void {
	const app = document.getElementById('app');
	if (!app) return;

	const adapterName =
		currentAdapterType === 'inmemory' ? 'InMemorySubstrateAdapter' : 'NatsSubstrateAdapter';
	const adapterBadge = currentAdapterType === 'inmemory' ? 'RxJS' : 'NATS';

	app.innerHTML = `
    <style>${STYLES}</style>
    
    <div class="header">
      <h1>📡 ${adapterName}</h1>
      <span class="badge substrate">SUBSTRATE</span>
      <span class="badge ${currentAdapterType === 'inmemory' ? 'rxjs' : 'nats'}">${adapterBadge}</span>
      <div id="status" class="status disconnected">Disconnected</div>
    </div>
    
    <div class="controls">
      <button id="connectBtn">Connect</button>
      <button id="disconnectBtn" class="danger" disabled>Disconnect</button>
      <button id="swapBtn" class="secondary">Swap to ${currentAdapterType === 'inmemory' ? 'NATS' : 'InMemory'}</button>
    </div>
    
    <div class="grid">
      <div class="panel">
        <h3>📤 Publish Message</h3>
        <div class="input-group">
          <input id="topicInput" placeholder="Topic (e.g., sensor.frame)" value="sensor.frame">
        </div>
        <div class="input-group">
          <input id="messageInput" placeholder="Message JSON" value='{"x": 100, "y": 200}'>
          <button id="publishBtn" disabled>Publish</button>
        </div>
        
        <h3 style="margin-top: 16px;">📥 Subscribe to Topic</h3>
        <div class="input-group">
          <input id="subscribeInput" placeholder="Topic to subscribe" value="sensor.*">
          <button id="subscribeBtn" disabled>Subscribe</button>
        </div>
      </div>
      
      <div class="panel">
        <h3>🗄️ Key-Value Store</h3>
        <div class="input-group">
          <input id="kvKeyInput" placeholder="Key" value="config.smoothing">
          <input id="kvValueInput" placeholder="Value" value='{"enabled": true}'>
        </div>
        <div class="input-group">
          <button id="kvSetBtn" disabled>Set</button>
          <button id="kvGetBtn" class="secondary" disabled>Get</button>
          <button id="kvDeleteBtn" class="secondary" disabled>Delete</button>
        </div>
        <div id="kvDisplay" class="kv-list"></div>
      </div>
    </div>
    
    <div class="panel">
      <h3>📋 Message Log</h3>
      <div id="messageLog" class="log">
        <div class="log-entry">
          <span class="timestamp">${new Date().toISOString()}</span>
          — Waiting for connection...
        </div>
      </div>
    </div>
    
    <div class="stats" style="margin-top: 24px;">
      <div class="stat">
        <div id="msgCount" class="value">0</div>
        <div class="label">Messages</div>
      </div>
      <div class="stat">
        <div id="kvCount" class="value">0</div>
        <div class="label">KV Entries</div>
      </div>
      <div class="stat">
        <div id="subCount" class="value">0</div>
        <div class="label">Subscriptions</div>
      </div>
    </div>
  `;

	// Cache DOM elements
	messageLog = document.getElementById('messageLog') as HTMLDivElement;
	kvDisplay = document.getElementById('kvDisplay') as HTMLDivElement;
	statusIndicator = document.getElementById('status') as HTMLDivElement;
	topicInput = document.getElementById('topicInput') as HTMLInputElement;
	messageInput = document.getElementById('messageInput') as HTMLInputElement;
	kvKeyInput = document.getElementById('kvKeyInput') as HTMLInputElement;
	kvValueInput = document.getElementById('kvValueInput') as HTMLInputElement;

	// Bind events
	document.getElementById('connectBtn')?.addEventListener('click', handleConnect);
	document.getElementById('disconnectBtn')?.addEventListener('click', handleDisconnect);
	document.getElementById('publishBtn')?.addEventListener('click', handlePublish);
	document.getElementById('subscribeBtn')?.addEventListener('click', handleSubscribe);
	document.getElementById('kvSetBtn')?.addEventListener('click', handleKVSet);
	document.getElementById('kvGetBtn')?.addEventListener('click', handleKVGet);
	document.getElementById('kvDeleteBtn')?.addEventListener('click', handleKVDelete);
	document.getElementById('swapBtn')?.addEventListener('click', handleSwapAdapter);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

const subscriptions: Array<{ unsubscribe: () => void }> = [];

async function handleConnect(): Promise<void> {
	try {
		await substrate.connect();
		updateStatus(true);
		logMessage(
			'system',
			`Connected to ${currentAdapterType === 'inmemory' ? 'InMemorySubstrateAdapter' : 'NatsSubstrateAdapter'}`,
		);
	} catch (err) {
		logMessage('error', `Connection failed: ${err}`);
		if (currentAdapterType === 'nats') {
			logMessage('system', 'Hint: Start NATS with: docker-compose up -d nats');
		}
	}
}

async function handleDisconnect(): Promise<void> {
	// Clear subscriptions
	subscriptions.forEach((s) => s.unsubscribe());
	subscriptions.length = 0;

	await substrate.disconnect();
	updateStatus(false);
	logMessage('system', 'Disconnected from substrate');
}

async function handleSwapAdapter(): Promise<void> {
	// Disconnect current adapter if connected
	if (substrate.isConnected) {
		await handleDisconnect();
	}

	// Swap adapter
	if (currentAdapterType === 'inmemory') {
		currentAdapterType = 'nats';
		substrate = new NatsSubstrateAdapter({
			servers: 'nats://localhost:4222',
			debug: true,
			name: 'showcase-client',
		});
		logMessage('system', 'Swapped to NatsSubstrateAdapter (requires NATS server)');
	} else {
		currentAdapterType = 'inmemory';
		substrate = new InMemorySubstrateAdapter();
		logMessage('system', 'Swapped to InMemorySubstrateAdapter (no server needed)');
	}

	// Re-render UI with new adapter name
	render();
}

async function handlePublish(): Promise<void> {
	const topic = topicInput.value;
	const messageStr = messageInput.value;

	try {
		const message = JSON.parse(messageStr);
		await substrate.publish(topic, message);
		logMessage(topic, messageStr, 'out');
		messageCount++;
		updateStats();
	} catch (e) {
		logMessage('error', `Failed to publish: ${e}`);
	}
}

function handleSubscribe(): void {
	const topic = (document.getElementById('subscribeInput') as HTMLInputElement).value;

	const unsub = substrate.subscribe(topic, (message) => {
		logMessage(topic, JSON.stringify(message), 'in');
		messageCount++;
		updateStats();
	});

	subscriptions.push({ unsubscribe: unsub });
	logMessage('system', `Subscribed to: ${topic}`);
	updateStats();
}

async function handleKVSet(): Promise<void> {
	const key = kvKeyInput.value;
	const valueStr = kvValueInput.value;

	try {
		const value = JSON.parse(valueStr);
		await substrate.kvSet(key, value);
		logMessage('kv', `SET ${key} = ${valueStr}`);
		updateKVDisplay();
	} catch (e) {
		logMessage('error', `Failed to set KV: ${e}`);
	}
}

async function handleKVGet(): Promise<void> {
	const key = kvKeyInput.value;

	try {
		const value = await substrate.kvGet(key);
		if (value !== null) {
			logMessage('kv', `GET ${key} = ${JSON.stringify(value)}`);
		} else {
			logMessage('kv', `GET ${key} = (not found)`);
		}
	} catch (e) {
		logMessage('error', `Failed to get KV: ${e}`);
	}
}

async function handleKVDelete(): Promise<void> {
	const key = kvKeyInput.value;

	try {
		// SubstratePort doesn't have kvDelete, set to null to "delete"
		await substrate.kvSet(key, null);
		logMessage('kv', `DELETE ${key}`);
		updateKVDisplay();
	} catch (e) {
		logMessage('error', `Failed to delete KV: ${e}`);
	}
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateStatus(connected: boolean): void {
	statusIndicator.textContent = connected ? 'Connected' : 'Disconnected';
	statusIndicator.className = `status ${connected ? 'connected' : 'disconnected'}`;

	// Enable/disable buttons
	const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
	const disconnectBtn = document.getElementById('disconnectBtn') as HTMLButtonElement;
	const publishBtn = document.getElementById('publishBtn') as HTMLButtonElement;
	const subscribeBtn = document.getElementById('subscribeBtn') as HTMLButtonElement;
	const kvSetBtn = document.getElementById('kvSetBtn') as HTMLButtonElement;
	const kvGetBtn = document.getElementById('kvGetBtn') as HTMLButtonElement;
	const kvDeleteBtn = document.getElementById('kvDeleteBtn') as HTMLButtonElement;

	connectBtn.disabled = connected;
	disconnectBtn.disabled = !connected;
	publishBtn.disabled = !connected;
	subscribeBtn.disabled = !connected;
	kvSetBtn.disabled = !connected;
	kvGetBtn.disabled = !connected;
	kvDeleteBtn.disabled = !connected;
}

function logMessage(topic: string, message: string, direction?: 'in' | 'out'): void {
	const entry = document.createElement('div');
	entry.className = 'log-entry';

	const arrow = direction === 'in' ? '←' : direction === 'out' ? '→' : '•';

	entry.innerHTML = `
    <span class="timestamp">${new Date().toISOString().split('T')[1].slice(0, 12)}</span>
    ${arrow} <span class="topic">[${topic}]</span>
    <span class="message">${message}</span>
  `;

	messageLog.insertBefore(entry, messageLog.firstChild);

	// Keep log reasonable size
	while (messageLog.children.length > 100 && messageLog.lastChild) {
		messageLog.removeChild(messageLog.lastChild);
	}
}

function updateKVDisplay(): void {
	// Note: InMemorySubstrateAdapter doesn't expose keys() method
	// This would need to be added for full KV browsing
	kvDisplay.innerHTML =
		'<div style="color: #8b949e; font-size: 0.8rem;">Use Get to retrieve specific keys</div>';
}

function updateStats(): void {
	const msgCountEl = document.getElementById('msgCount');
	const subCountEl = document.getElementById('subCount');

	if (msgCountEl) msgCountEl.textContent = String(messageCount);
	if (subCountEl) subCountEl.textContent = String(subscriptions.length);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', render);
