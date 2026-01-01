/**
 * Adapter Bundle — Browser-Ready Exemplar Composition
 *
 * Gen87.X3 | HONEST ARCHITECTURE
 *
 * This file creates THIN ADAPTER WRAPPERS around npm exemplars.
 * Demos MUST use this bundle, NOT direct npm imports.
 *
 * RULE: Adapters wrap exemplars. Demos use adapters. No exceptions.
 */
// @ts-nocheck


// Re-export everything from adapters for browser bundling
export * from './adapters/index.js';

// Re-export contracts for type safety
export * from './contracts/ports.js';
export * from './contracts/schemas.js';

// Re-export pipeline components
export * from './phase1-w3c-cursor/w3c-pointer-factory.js';
export * from './pipeline/simple-cursor-pipeline.js';

// Re-export smoothers
export * from './smoothers/smoother-chain.js';
