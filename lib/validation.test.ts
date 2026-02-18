// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — Validation Unit Tests (Vitest)
// ═══════════════════════════════════════════════════════════════════
//
// Tests for lib/validation.ts: WASM validation path, fallback path,
// and the combined validateAnswer dispatcher.
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from "vitest";
import { validateAnswer, validateFallback } from "./validation.ts";
import type { Exercise } from "./state.ts";
import type { MathWasm } from "./types.ts";

// ─── Test Fixtures ───────────────────────────────────────────────────

const arithmeticExercise: Exercise = {
  id: 1,
  type: "arithmetic",
  problem: "2 + 3",
  expectedAnswer: "5",
};

const fractionExercise: Exercise = {
  id: 2,
  type: "fraction",
  problem: "Simplify: 4/8",
  expectedAnswer: "1/2",
};

/** Mock WASM module that returns JSON check_answer results. */
function createMockWasm(correctAnswer: string): MathWasm {
  return {
    check_answer: (_type: string, problem: string, answer: string) => {
      const correct = answer.trim() === correctAnswer;
      return JSON.stringify({
        correct,
        hint: correct ? "Correct!" : `Wrong. Try evaluating ${problem}.`,
        problem,
        answer,
      });
    },
    validate_arithmetic: (_expr: string, _answer: number) => true,
    validate_fraction: () => true,
    simplify_fraction: () => new BigInt64Array([1n, 2n]),
    batch_validate: () => 0,
  };
}

// ─── validateFallback ────────────────────────────────────────────────

describe("validateFallback", () => {
  it("returns correct for exact match", () => {
    const result = validateFallback(arithmeticExercise, "5");
    expect(result.correct).toBe(true);
    expect(result.hint).toBe("Correct!");
  });

  it("returns correct with surrounding whitespace", () => {
    const result = validateFallback(arithmeticExercise, "  5  ");
    expect(result.correct).toBe(true);
  });

  it("returns incorrect for wrong answer", () => {
    const result = validateFallback(arithmeticExercise, "7");
    expect(result.correct).toBe(false);
    expect(result.hint).toContain("2 + 3");
  });

  it("returns incorrect for empty answer", () => {
    const result = validateFallback(arithmeticExercise, "");
    expect(result.correct).toBe(false);
  });

  it("preserves problem and answer in result", () => {
    const result = validateFallback(arithmeticExercise, "5");
    expect(result.problem).toBe("2 + 3");
    expect(result.answer).toBe("5");
  });

  it("works for fraction exercises", () => {
    const result = validateFallback(fractionExercise, "1/2");
    expect(result.correct).toBe(true);
  });

  it("is deterministic (100 iterations)", () => {
    for (let i = 0; i < 100; i++) {
      const result = validateFallback(arithmeticExercise, "5");
      expect(result.correct).toBe(true);
      expect(result.hint).toBe("Correct!");
    }
  });
});

// ─── validateAnswer (dispatcher) ─────────────────────────────────────

describe("validateAnswer", () => {
  it("uses fallback when wasm is null", () => {
    const result = validateAnswer(null, arithmeticExercise, "5");
    expect(result.correct).toBe(true);
    expect(result.hint).toBe("Correct!");
  });

  it("uses WASM when wasm is provided", () => {
    const wasm = createMockWasm("5");
    const result = validateAnswer(wasm, arithmeticExercise, "5");
    expect(result.correct).toBe(true);
  });

  it("WASM path returns incorrect for wrong answer", () => {
    const wasm = createMockWasm("5");
    const result = validateAnswer(wasm, arithmeticExercise, "7");
    expect(result.correct).toBe(false);
  });

  it("preserves exercise problem in result", () => {
    const wasm = createMockWasm("5");
    const result = validateAnswer(wasm, arithmeticExercise, "5");
    expect(result.problem).toBe("2 + 3");
  });

  it("is deterministic regardless of path (100 iterations)", () => {
    const wasm = createMockWasm("5");
    for (let i = 0; i < 100; i++) {
      const withWasm = validateAnswer(wasm, arithmeticExercise, "5");
      const withoutWasm = validateAnswer(null, arithmeticExercise, "5");
      expect(withWasm.correct).toBe(true);
      expect(withoutWasm.correct).toBe(true);
    }
  });
});
