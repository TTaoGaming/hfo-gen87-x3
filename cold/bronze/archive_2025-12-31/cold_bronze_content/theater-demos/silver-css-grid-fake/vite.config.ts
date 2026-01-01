import { resolve } from 'path';
/**
 * Vite Configuration for HFO Silver Demo
 *
 * Gen87.X3 | Silver Layer | Browser Bundle
 *
 * This bundles the REAL adapters from bronze for browser use
 */
import { defineConfig } from 'vite';

export default defineConfig({
	root: resolve(__dirname),
	resolve: {
		alias: {
			'@bronze': resolve(__dirname, '../../bronze/src'),
		},
	},
	server: {
		port: 5173,
		open: true,
		headers: {
			// Required for SharedArrayBuffer (needed by some WASM)
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp',
		},
	},
	build: {
		outDir: resolve(__dirname, '../dist'),
		emptyOutDir: true,
		sourcemap: true,
	},
	optimizeDeps: {
		include: [
			'@dimforge/rapier2d-compat',
			'xstate',
			'1eurofilter',
			'@mediapipe/tasks-vision',
			'golden-layout',
		],
	},
	// Handle WASM files
	assetsInclude: ['**/*.wasm'],
});
