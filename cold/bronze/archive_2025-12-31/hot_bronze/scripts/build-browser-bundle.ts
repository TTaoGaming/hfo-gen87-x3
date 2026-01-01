#!/usr/bin/env npx tsx
/**
 * Build Browser Bundle — HFO Adapters
 *
 * Gen87.X3 | Port 3 (Spore Storm) | DELIVER
 *
 * Creates sandbox/dist/hfo-adapters.js that:
 * 1. Bundles npm packages (1eurofilter, rapier, xstate)
 * 2. Wraps them in adapter classes
 * 3. Exports to window.HFO global
 *
 * Demos MUST use window.HFO.* — anti-theater gate blocks direct npm usage.
 */

import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUTDIR = path.resolve('./sandbox/dist');
const ENTRY = path.resolve('./sandbox/src/adapters/browser-bundle.ts');

async function buildBundle() {
	console.log('');
	console.log('════════════════════════════════════════════════════════════════════');
	console.log('  🏗️  Building HFO Browser Adapter Bundle                           ');
	console.log('════════════════════════════════════════════════════════════════════');
	console.log('');

	// Ensure output directory exists
	if (!fs.existsSync(OUTDIR)) {
		fs.mkdirSync(OUTDIR, { recursive: true });
	}

	// Check entry point exists
	if (!fs.existsSync(ENTRY)) {
		console.error(`❌ Entry point not found: ${ENTRY}`);
		console.log('   Creating browser-bundle.ts entry point...');
		
		// Create the entry point
		const entryContent = `/**
 * Browser Bundle Entry Point
 *
 * This file exports all adapters to window.HFO for browser usage.
 * Demos MUST import from window.HFO, not directly from npm packages.
 */

import { OneEuroExemplarAdapter } from './one-euro-exemplar.adapter.js';
import { RapierPhysicsAdapter, createSmoothedRapierAdapter, createPredictiveRapierAdapter } from './rapier-physics.adapter.js';
import { XStateFSMAdapter } from './xstate-fsm.adapter.js';
import { PointerEventAdapter, DOMAdapter } from './pointer-event.adapter.js';
import { GesturePipeline, createDefaultPipeline } from './pipeline.js';

// Export to window.HFO global
const HFO = {
	// Smoother adapters
	OneEuroExemplarAdapter,
	RapierPhysicsAdapter,
	createSmoothedRapierAdapter,
	createPredictiveRapierAdapter,

	// FSM adapter
	XStateFSMAdapter,

	// Emitter adapters
	PointerEventAdapter,
	DOMAdapter,

	// Pipeline
	GesturePipeline,
	createDefaultPipeline,
};

// Attach to window if in browser
if (typeof window !== 'undefined') {
	(window as any).HFO = HFO;
}

export default HFO;
`;
		fs.writeFileSync(ENTRY, entryContent);
		console.log('   ✅ Created browser-bundle.ts');
	}

	try {
		// Build the bundle
		const result = await esbuild.build({
			entryPoints: [ENTRY],
			bundle: true,
			outfile: path.join(OUTDIR, 'hfo-adapters.js'),
			format: 'iife',
			globalName: 'HFO',
			target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
			minify: false, // Keep readable for debugging
			sourcemap: true,
			metafile: true,
			external: [], // Bundle everything
			define: {
				'process.env.NODE_ENV': '"production"',
			},
			loader: {
				'.wasm': 'file', // Handle WASM files
			},
		});

		// Report bundle size
		const outputs = result.metafile?.outputs || {};
		for (const [file, meta] of Object.entries(outputs)) {
			if (file.endsWith('.js')) {
				const sizeKB = (meta.bytes / 1024).toFixed(1);
				console.log(`  📦 Built: ${path.basename(file)} (${sizeKB} KB)`);
			}
		}

		// Also build a minified version
		await esbuild.build({
			entryPoints: [ENTRY],
			bundle: true,
			outfile: path.join(OUTDIR, 'hfo-adapters.min.js'),
			format: 'iife',
			globalName: 'HFO',
			target: ['es2020', 'chrome90', 'firefox90', 'safari14'],
			minify: true,
			sourcemap: true,
			external: [],
			define: {
				'process.env.NODE_ENV': '"production"',
			},
		});

		const minSize = fs.statSync(path.join(OUTDIR, 'hfo-adapters.min.js')).size;
		console.log(`  📦 Built: hfo-adapters.min.js (${(minSize / 1024).toFixed(1)} KB)`);

		console.log('');
		console.log('  ✅ Bundle build complete!');
		console.log('');
		console.log('  Usage in demos:');
		console.log('    <script src="/dist/hfo-adapters.js"></script>');
		console.log('    <script>');
		console.log('      const smoother = new HFO.OneEuroExemplarAdapter();');
		console.log('    </script>');
		console.log('');

		return true;
	} catch (error) {
		console.error('❌ Build failed:', error);
		return false;
	}
}

buildBundle().then(success => {
	process.exit(success ? 0 : 1);
});
