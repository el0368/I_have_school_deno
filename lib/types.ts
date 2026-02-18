// Sovereign Academy — Shared Types
//
// Canonical type definitions used across lib/, islands/, and tests.
// Single source of truth for WASM module shape and validation types.

/**
 * Shape of the compiled math_validator WASM module exports.
 *
 * Every function is **pure** — no I/O, no randomness, no side effects.
 * This interface is consumed by wasm-loader.ts, wasm-health-check.ts,
 * and validation.ts.
 */
export interface MathWasm {
  check_answer: (type: string, problem: string, answer: string) => string;
  validate_arithmetic: (expr: string, answer: number) => boolean;
  validate_fraction: (en: bigint, ed: bigint, sn: bigint, sd: bigint) => boolean;
  simplify_fraction: (numerator: bigint, denominator: bigint) => BigInt64Array;
  batch_validate: (problems: string, answers: string) => number;
}
