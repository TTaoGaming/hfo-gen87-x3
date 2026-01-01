import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite Config for REAL Silver Demo
 * 
 * Gen87.X3 | REAL Architecture (NOT mock CSS Grid)
 * 
 * Uses:
 * - GoldenLayoutShellAdapter (not CSS Grid)
 * - HFOPortFactory for DI
 * - TileComposer for per-tile pipelines
 * - Real npm packages: golden-layout, 1eurofilter, xstate, zod
 */
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    headers: {
      // Required for SharedArrayBuffer (WASM)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      // Allow serving from ENTIRE project root for adapter imports
      allow: [
        resolve(__dirname, '../../..'),  // Project root
        resolve(__dirname, '.'),          // Demo folder
      ],
      strict: false,
    },
  },
  resolve: {
    alias: {
      // Map @hfo to bronze adapters
      '@hfo': resolve(__dirname, '../../bronze/src'),
    },
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
  },
  optimizeDeps: {
    include: [
      'golden-layout',
      '1eurofilter',
      'xstate',
      'zod',
    ],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
