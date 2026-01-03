/**
 * HFO Gen87.X3 Mini-OS Showcase
 *
 * This showcase demonstrates the HFO_W3C_Pointer_Orchestrator with Golden Layout.
 * It allows hot-swapping primitives (Smoothers, Predictors) via the UI.
 */
import {
	GoldenLayoutShellAdapter,
	HFO_W3C_Pointer_Orchestrator,
	initializeRegistries,
} from '../../bronze/src/browser/index.js';

// ============================================================================
// INITIALIZATION
// ============================================================================

initializeRegistries();

const orchestrator = new HFO_W3C_Pointer_Orchestrator({
	gen: 87,
	viewport: { width: window.innerWidth, height: window.innerHeight },
	composition: {
		sensor: 'mediapipe',
		smoother: 'one-euro',
		predictor: 'rapier-predict',
		fsm: 'xstate',
		emitter: 'w3c-pointer',
		target: 'dom',
	},
});

const bus = orchestrator.getBus();

// ============================================================================
// UI COMPONENTS
// ============================================================================

/**
 * Sensor Panel - Controls and Metrics
 */
function createControlPanel(container: HTMLElement): void {
	container.innerHTML = `
		<div class="panel">
			<h3>🎮 Orchestrator Control</h3>
			<div class="section">
				<h4>Smoother</h4>
				<button class="btn active" id="btn-smooth-one-euro">1€ Filter</button>
				<button class="btn" id="btn-smooth-rapier">Rapier Physics</button>
			</div>
			<div class="section">
				<h4>Predictor</h4>
				<button class="btn active" id="btn-predict-rapier">Rapier Predict</button>
				<button class="btn" id="btn-predict-none">None</button>
			</div>
			<div class="section" style="margin-top: 20px;">
				<h4>Metrics</h4>
				<div class="metric"><span class="label">FPS</span><span class="value" id="metric-fps">0</span></div>
				<div class="metric"><span class="label">Latency</span><span class="value" id="metric-latency">0ms</span></div>
				<div class="metric"><span class="label">Jitter</span><span class="value" id="metric-jitter">0.00</span></div>
			</div>
		</div>
	`;

	// Event Listeners for Hot-Swapping
	container.querySelector('#btn-smooth-one-euro')?.addEventListener('click', (e) => {
		orchestrator.swapStage('smoother', 'one-euro');
		updateActiveButtons(e.target as HTMLElement, 'smooth');
	});
	container.querySelector('#btn-smooth-rapier')?.addEventListener('click', (e) => {
		orchestrator.swapStage('smoother', 'rapier-smooth');
		updateActiveButtons(e.target as HTMLElement, 'smooth');
	});
}

function updateActiveButtons(clicked: HTMLElement, group: string): void {
	const parent = clicked.parentElement;
	parent?.querySelectorAll('.btn').forEach((b) => b.classList.remove('active'));
	clicked.classList.add('active');
}

/**
 * Visualizer Panel - Canvas rendering
 */
function createVisualizerPanel(container: HTMLElement): void {
	const canvas = document.createElement('canvas');
	container.appendChild(canvas);
	const ctx = canvas.getContext('2d');
	if (!ctx) return;

	const resize = () => {
		canvas.width = container.clientWidth;
		canvas.height = container.clientHeight;
	};
	window.addEventListener('resize', resize);
	setTimeout(resize, 100);

	let rawPos = { x: 0, y: 0 };
	let smoothPos = { x: 0, y: 0 };
	let predictPos = { x: 0, y: 0 };

	// Subscribe to pipeline stages via Substrate
	bus.subscribe('hfo.pipeline.sense', (envelope: any) => {
		rawPos = envelope.data.landmarks[0][8]; // Index finger tip
	});
	bus.subscribe('hfo.pipeline.smooth', (envelope: any) => {
		smoothPos = envelope.data.landmarks[0][8];
	});
	bus.subscribe('hfo.pipeline.predict', (envelope: any) => {
		predictPos = envelope.data.landmarks[0][8];
	});

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw Raw (Red)
		drawPoint(ctx, rawPos, '#ff3333', 4);
		// Draw Smooth (Green)
		drawPoint(ctx, smoothPos, '#00ffcc', 6);
		// Draw Predict (Blue)
		drawPoint(ctx, predictPos, '#3399ff', 4);

		requestAnimationFrame(draw);
	}
	draw();
}

function drawPoint(
	ctx: CanvasRenderingContext2D,
	pos: { x: number; y: number },
	color: string,
	size: number,
) {
	const x = pos.x * ctx.canvas.width;
	const y = pos.y * ctx.canvas.height;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, size, 0, Math.PI * 2);
	ctx.fill();
}

/**
 * Log Panel - Stigmergy signals
 */
function createLogPanel(container: HTMLElement): void {
	container.innerHTML = '<div class="panel" id="log-container"><h3>📡 Stigmergy Log</h3></div>';
	const logContainer = container.querySelector('#log-container');

	bus.subscribe('hfo.pipeline.*', (envelope: any) => {
		const entry = document.createElement('div');
		entry.className = `log-entry log-type-${envelope.type}`;
		entry.innerHTML = `
			<span class="log-ts">${new Date().toLocaleTimeString()}</span>
			<span class="log-msg">${envelope.type.toUpperCase()}: Stage ${envelope.hfostage} complete</span>
		`;
		logContainer?.appendChild(entry);
		if (logContainer && logContainer.children.length > 50) {
			logContainer.removeChild(logContainer.children[1]); // Keep header
		}
		container.scrollTop = container.scrollHeight;
	});
}

// ============================================================================
// GOLDEN LAYOUT SETUP (Using Adapter)
// ============================================================================

const shell = new GoldenLayoutShellAdapter();

shell.registerComponent('dom', (container, config) => {
	const tileId = (config as any).tileId || 'unknown';
	if (tileId === 'controls') createControlPanel(container);
	else if (tileId === 'visualizer') createVisualizerPanel(container);
	else if (tileId === 'logs') createLogPanel(container);
	return undefined;
});

const layoutConfig = {
	tiles: [
		{ id: 'controls', type: 'dom' as const, title: 'Controls' },
		{ id: 'logs', type: 'dom' as const, title: 'Stigmergy' },
		{ id: 'visualizer', type: 'dom' as const, title: 'HFO Visualizer' },
	],
	arrangement: {
		direction: 'row' as const,
		first: {
			direction: 'column' as const,
			first: 'controls',
			second: 'logs',
			splitPercentage: 40,
		},
		second: 'visualizer',
		splitPercentage: 25,
	},
	shell: 'golden' as const,
};

shell
	.initialize(document.getElementById('app')!, {
		shell: 'golden',
		initialLayout: layoutConfig,
	})
	.then(() => {
		// Start Orchestrator
		orchestrator.start();
	});
