import { defineConfig } from 'vite';

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
      // Allow serving from project root for adapter imports
      allow: ['../../..'],
    },
  },
  resolve: {
    alias: {
      // Map imports to real adapter paths
      '/hot/bronze': '../../../hot/bronze',
    },
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
