/**
 * HFO Contracts - Barrel Export
 * =============================
 * 
 * Central export point for all HFO contract definitions.
 * 
 * The Galois Lattice:
 *   - 8×8 matrix of port interactions
 *   - Diagonal (★) = Legendary Quines (self-referential identity)
 *   - Anti-diagonal = HIVE pairs (sum = 7)
 */

// Port interfaces and types
export * from "./hfo-ports.js";

// Behavioral contracts (BDD/CDD)
export * from "./port-contracts.js";
