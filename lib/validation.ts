// Sovereign Academy — Answer Validation (Phase 6.8)
//
// Extracted from islands/MathStage.tsx.
// Delegates to WASM when available, falls back to string comparison.
// Pure function — no signal mutations, no side effects.

import type { Exercise, ValidationResult } from "./state.ts";
import type { MathWasm } from "./types.ts";

/**
 * Validate a student's answer against the expected answer.
 *
 * - **WASM path** (preferred): calls `check_answer()` in the Rust engine.
 * - **Fallback path**: exact string comparison (for dev/browser-only mode).
 *
 * Returns a ValidationResult. Does NOT mutate any signals.
 */
export function validateAnswer(
  wasm: MathWasm | null,
  exercise: Exercise,
  answer: string,
): ValidationResult {
  if (wasm) {
    return validateWithWasm(wasm, exercise, answer);
  }
  return validateFallback(exercise, answer);
}

/** WASM validation — delegates to Rust `check_answer()`. */
function validateWithWasm(
  wasm: MathWasm,
  exercise: Exercise,
  answer: string,
): ValidationResult {
  const jsonStr = wasm.check_answer(exercise.type, exercise.problem, answer);
  return JSON.parse(jsonStr) as ValidationResult;
}

/**
 * Fallback validation — exact string match.
 *
 * Used when WASM is not available (e.g., first load, build errors).
 * Less accurate than WASM (no partial credit, no fraction normalization).
 */
export function validateFallback(exercise: Exercise, answer: string): ValidationResult {
  const isCorrect = answer.trim() === exercise.expectedAnswer.trim();
  return {
    correct: isCorrect,
    hint: isCorrect ? "Correct!" : `Try again. Hint: evaluate ${exercise.problem} carefully.`,
    problem: exercise.problem,
    answer,
  };
}
