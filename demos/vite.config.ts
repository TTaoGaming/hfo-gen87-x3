/**
 * Vite Configuration for TypeScript Demos
 *
 * Gen87.X3 | ENFORCEMENT: Demos MUST be TypeScript
 *
 * This config compiles demos/src/*.ts into browser-ready modules.
 * TypeScript catches wrong API usage at BUILD TIME.
 *
 * Build: npx vite build --config demos/vite.config.ts
 * Dev: npx vite --config demos/vite.config.ts
 */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
	root: resolve(__dirname),

	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				'port-0': resolve(__dirname, 'port-0-observer.html'),
				'port-1': resolve(__dirname, 'port-1-bridger.html'),
				'port-2': resolve(__dirname, 'port-2-shaper.html'),
				'port-3': resolve(__dirname, 'port-3-injector.html'),
			},
		},
		sourcemap: true,
		minify: false,
	},

	resolve: {
		alias: {
			'@': resolve(__dirname, '../hot/bronze/src'),
		},
	},

	server: {
		port: 8082,
		open: '/index.html',
	},

	// Strict TypeScript checking
	esbuild: {
		target: 'es2022',
	},
});
