/**
 * Demo Index - Hub for all Port demos
 *
 * Gen87.X3 | TypeScript Demos
 */

interface DemoInfo {
	port: number;
	name: string;
	commander: string;
	verb: string;
	color: string;
	description: string;
	href: string;
}

const DEMOS: DemoInfo[] = [
	{
		port: 0,
		name: 'Observer',
		commander: 'Lidless Legion',
		verb: 'SENSE',
		color: '#ff6b6b',
		description: 'MediaPipe landmark & gesture passthrough. 21-point hand tracking visualization.',
		href: './port-0-observer.html',
	},
	{
		port: 1,
		name: 'Bridger',
		commander: 'Web Weaver',
		verb: 'FUSE',
		color: '#a371f7',
		description: 'Zod schema validation, valguards, and G0-G7 gate enforcement.',
		href: './port-1-bridger.html',
	},
	{
		port: 2,
		name: 'Shaper',
		commander: 'Mirror Magus',
		verb: 'SHAPE',
		color: '#58a6ff',
		description: '1€ Filter, Double Exponential, Moving Average smoothing. FSM + W3C Trace.',
		href: './port-2-shaper.html',
	},
	{
		port: 3,
		name: 'Injector',
		commander: 'Spore Storm',
		verb: 'DELIVER',
		color: '#f0883e',
		description: 'Pointer event emission, blackboard signals, event stream visualization.',
		href: './port-3-injector.html',
	},
	{
		port: 5,
		name: 'PalmConeGate',
		commander: 'Pyre Praetorian',
		verb: 'DEFEND',
		color: '#f85149',
		description: 'Schmitt trigger hysteresis for Anti-Midas Touch. 93.69% mutation score.',
		href: './showcase-palmcone.html',
	},
	{
		port: 6,
		name: 'Substrate',
		commander: 'Kraken Keeper',
		verb: 'STORE',
		color: '#a371f7',
		description: 'RxJS-based message bus. Pub/sub + KV store for browser communication.',
		href: './showcase-substrate.html',
	},
];

function createIndexUI(): void {
	const container = document.getElementById('app') ?? document.body;
	container.innerHTML = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #0d1117; 
        color: #c9d1d9; 
        min-height: 100vh;
        padding: 40px 20px;
      }
      .container { max-width: 1000px; margin: 0 auto; }
      header { text-align: center; margin-bottom: 48px; }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 12px;
        background: linear-gradient(90deg, #ff6b6b, #a371f7, #58a6ff, #f0883e);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subtitle { color: #8b949e; font-size: 1.1rem; margin-bottom: 8px; }
      .gen-badge {
        display: inline-block;
        background: #238636;
        color: #fff;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .demo-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }
      .demo-card {
        background: #161b22;
        border: 2px solid #30363d;
        border-radius: 12px;
        padding: 24px;
        transition: all 0.2s;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        display: block;
      }
      .demo-card:hover {
        border-color: var(--port-color);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      }
      .demo-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .port-badge {
        background: var(--port-color);
        color: #000;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .demo-title {
        font-size: 1.3rem;
        color: #fff;
      }
      .commander {
        font-size: 0.85rem;
        color: #8b949e;
        margin-bottom: 8px;
      }
      .verb-badge {
        display: inline-block;
        background: #21262d;
        color: var(--port-color);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: bold;
        margin-left: 8px;
      }
      .demo-description {
        color: #8b949e;
        font-size: 0.9rem;
        line-height: 1.5;
      }
      .footer {
        text-align: center;
        margin-top: 48px;
        padding-top: 24px;
        border-top: 1px solid #30363d;
        color: #8b949e;
        font-size: 0.85rem;
      }
      .footer code {
        background: #21262d;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
      }
    </style>
    
    <div class="container">
      <header>
        <h1>HFO Gen87.X3 Demos</h1>
        <p class="subtitle">TypeScript Port Demonstrations</p>
        <span class="gen-badge">Gen 87.X3</span>
      </header>
      
      <div class="demo-grid" id="demoGrid"></div>
      
      <footer>
        <p>Run with: <code>npx vite --config demos/vite.config.ts</code></p>
        <p style="margin-top:8px;">All demos are TypeScript — type errors caught at build time.</p>
      </footer>
    </div>
  `;

	const grid = document.getElementById('demoGrid')!;

	DEMOS.forEach((demo) => {
		const card = document.createElement('a');
		card.href = demo.href;
		card.className = 'demo-card';
		card.style.setProperty('--port-color', demo.color);
		card.innerHTML = `
      <div class="demo-header">
        <span class="port-badge">Port ${demo.port}</span>
        <span class="demo-title">${demo.name}</span>
      </div>
      <div class="commander">
        ${demo.commander}
        <span class="verb-badge">${demo.verb}</span>
      </div>
      <p class="demo-description">${demo.description}</p>
    `;
		grid.appendChild(card);
	});
}

// Auto-start
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', createIndexUI);
}

export { createIndexUI };
