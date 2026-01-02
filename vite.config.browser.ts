import { resolve } from 'node:path';
/**
 * Vite Configuration for Browser Bundle
 *
 * Gen87.X3 | Browser Build
 *
 * Builds hot/bronze/src/browser/index.ts into ESM bundle for demos.
 * Uses Vite for fast dev server and production builds.
 */
import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
	plugins: [wasm(), topLevelAwait()],
	build: {
		lib: {
			entry: resolve(__dirname, 'hot/bronze/src/browser/index.ts'),
			name: 'HFO',
			fileName: 'hfo',
			formats: ['es'],
		},
		outDir: 'demos/lib',
		rollupOptions: {
			// Mark external packages that should be loaded via CDN
			external: [
				// Let 1eurofilter be external (loaded via esm.sh in browser)
			],
			output: {
				// Globals for external packages
				globals: {},
			},
		},
		// Enable source maps for debugging
		sourcemap: true,
		// Don't minify for readability during development
		minify: false,
	},
	// Resolve .ts extensions
	resolve: {
		alias: {
			'@': resolve(__dirname, 'hot/bronze/src'),
		},
	},
	// Optimize deps for browser
	optimizeDeps: {
		include: ['zod', '1eurofilter'],
		esbuildOptions: {
			target: 'es2022',
		},
	},
});
