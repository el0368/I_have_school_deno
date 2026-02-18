// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — WASM Health Check Unit Tests (Vitest)
// ═══════════════════════════════════════════════════════════════════
//
// Tests the health check system with mock WASM module.
// Verifies that the health check correctly identifies passing and
// failing WASM engines.
// ═══════════════════════════════════════════════════════════════════

import { describe, expect, it } from "vitest";
import { formatHealthCheckReport, runHealthCheck } from "./wasm-health-check.ts";

// ─── Mock WASM Module (correct implementation) ───────────────────────

function createCorrectWasm() {
  return {
    validate_arithmetic(expr: string, answer: number): boolean {
      const parts = expr.split(/\s+/);
      if (parts.length !== 3) return false;
      const a = parseFloat(parts[0]);
      const op = parts[1];
      const b = parseFloat(parts[2]);
      let result: number;
      switch (op) {
        case "+":
          result = a + b;
          break;
        case "-":
          result = a - b;
          break;
        case "*":
          result = a * b;
          break;
        case "/":
          if (b === 0) return false;
          result = a / b;
          break;
        default:
          return false;
      }
      return Math.abs(result - answer) < 1e-9;
    },

    validate_fraction(
      en: bigint,
      ed: bigint,
      sn: bigint,
      sd: bigint,
    ): boolean {
      if (ed === 0n || sd === 0n) return false;
      return en * sd === sn * ed;
    },

    simplify_fraction(num: bigint, den: bigint): BigInt64Array {
      if (den === 0n) return new BigInt64Array([0n, 0n]);
      const g = gcd(num < 0n ? -num : num, den < 0n ? -den : den);
      const sign = den < 0n ? -1n : 1n;
      return new BigInt64Array([
        sign * num / g,
        sign * den / g,
      ]);
    },

    check_answer(type: string, problem: string, answer: string): string {
      if (type === "arithmetic") {
        const parts = problem.split(/\s+/);
        const a = parseFloat(parts[0]);
        const op = parts[1];
        const b = parseFloat(parts[2]);
        let result: number;
        switch (op) {
          case "+":
            result = a + b;
            break;
          case "-":
            result = a - b;
            break;
          case "*":
            result = a * b;
            break;
          case "/":
            result = b !== 0 ? a / b : NaN;
            break;
          default:
            result = NaN;
        }
        const correct = Math.abs(result - parseFloat(answer)) < 1e-9;
        return JSON.stringify({
          correct,
          hint: correct ? "Correct!" : `Try evaluating ${problem} step by step.`,
          problem,
          answer,
        });
      }
      return JSON.stringify({
        correct: false,
        hint: `Unknown problem type: ${type}`,
        problem,
        answer,
      });
    },

    batch_validate(problems: string, answers: string): number {
      const probs = problems.split(";");
      const ans = answers.split(";");
      if (probs.length !== ans.length) return 0;
      let count = 0;
      for (let i = 0; i < probs.length; i++) {
        const parts = probs[i].trim().split(/\s+/);
        const a = parseFloat(parts[0]);
        const op = parts[1];
        const b = parseFloat(parts[2]);
        let result: number;
        switch (op) {
          case "+":
            result = a + b;
            break;
          case "-":
            result = a - b;
            break;
          case "*":
            result = a * b;
            break;
          case "/":
            result = b !== 0 ? a / b : NaN;
            break;
          default:
            result = NaN;
        }
        if (Math.abs(result - parseFloat(ans[i].trim())) < 1e-9) count++;
      }
      return count;
    },
  };
}

function gcd(a: bigint, b: bigint): bigint {
  return b === 0n ? a : gcd(b, a % b);
}

// ─── Mock WASM Module (broken implementation) ────────────────────────

function createBrokenWasm() {
  return {
    validate_arithmetic(_expr: string, _answer: number): boolean {
      return false; // Always says wrong
    },
    validate_fraction(
      _en: bigint,
      _ed: bigint,
      _sn: bigint,
      _sd: bigint,
    ): boolean {
      return false;
    },
    simplify_fraction(_num: bigint, _den: bigint): BigInt64Array {
      return new BigInt64Array([0n, 0n]);
    },
    check_answer(_type: string, problem: string, answer: string): string {
      return JSON.stringify({
        correct: false,
        hint: "broken",
        problem,
        answer,
      });
    },
    batch_validate(_problems: string, _answers: string): number {
      return 0;
    },
  };
}

// ─── Health Check Tests ──────────────────────────────────────────────

describe("runHealthCheck", () => {
  it("passes with correct WASM implementation", () => {
    const result = runHealthCheck(createCorrectWasm());

    expect(result.passed).toBe(true);
    expect(result.checks.length).toBe(10);
    expect(result.checks.every((c) => c.passed)).toBe(true);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("fails with broken WASM implementation", () => {
    const result = runHealthCheck(createBrokenWasm());

    expect(result.passed).toBe(false);
    // At least 1+1=2 should fail
    const addCheck = result.checks.find((c) => c.name === "1 + 1 = 2");
    expect(addCheck).toBeDefined();
    expect(addCheck!.passed).toBe(false);
  });

  it("has exactly 10 checks", () => {
    const result = runHealthCheck(createCorrectWasm());
    expect(result.checks).toHaveLength(10);
  });

  it("checks have required fields", () => {
    const result = runHealthCheck(createCorrectWasm());
    for (const check of result.checks) {
      expect(check.name).toBeTypeOf("string");
      expect(check.passed).toBeTypeOf("boolean");
      expect(check.expected).toBeTypeOf("string");
      expect(check.actual).toBeTypeOf("string");
    }
  });

  it("includes specific critical checks", () => {
    const result = runHealthCheck(createCorrectWasm());
    const names = result.checks.map((c) => c.name);

    expect(names).toContain("1 + 1 = 2");
    expect(names).toContain("2 * 3 = 6");
    expect(names).toContain("4 / 2 = 2");
    expect(names).toContain("2 + 2 ≠ 5");
    expect(names).toContain("5 / 0 = reject");
    expect(names).toContain("1/2 == 2/4");
    expect(names).toContain("1/3 != 1/4");
  });

  it("handles WASM that throws exceptions", () => {
    const throwingWasm = {
      validate_arithmetic(): boolean {
        throw new Error("WASM crashed");
      },
      validate_fraction(): boolean {
        throw new Error("WASM crashed");
      },
      simplify_fraction(): BigInt64Array {
        throw new Error("WASM crashed");
      },
      check_answer(): string {
        throw new Error("WASM crashed");
      },
      batch_validate(): number {
        throw new Error("WASM crashed");
      },
    };

    const result = runHealthCheck(throwingWasm);
    expect(result.passed).toBe(false);
    // Should still have 10 checks, all failed
    expect(result.checks).toHaveLength(10);
    expect(result.checks.every((c) => !c.passed)).toBe(true);
    expect(result.checks[0].error).toContain("WASM crashed");
  });

  it("is deterministic (100 iterations)", () => {
    const wasm = createCorrectWasm();
    for (let i = 0; i < 100; i++) {
      const result = runHealthCheck(wasm);
      expect(result.passed).toBe(true);
      expect(result.checks).toHaveLength(10);
    }
  });
});

// ─── Report Formatting ───────────────────────────────────────────────

describe("formatHealthCheckReport", () => {
  it("includes PASSED for passing result", () => {
    const result = runHealthCheck(createCorrectWasm());
    const report = formatHealthCheckReport(result);

    expect(report).toContain("PASSED");
    expect(report).toContain("✅");
    expect(report).toContain("10/10");
  });

  it("includes FAILED for failing result", () => {
    const result = runHealthCheck(createBrokenWasm());
    const report = formatHealthCheckReport(result);

    expect(report).toContain("FAILED");
    expect(report).toContain("❌");
    expect(report).toContain("Expected:");
    expect(report).toContain("Actual:");
  });

  it("shows duration in ms", () => {
    const result = runHealthCheck(createCorrectWasm());
    const report = formatHealthCheckReport(result);

    expect(report).toMatch(/\d+\.\d+ms/);
  });

  it("returns a string", () => {
    const result = runHealthCheck(createCorrectWasm());
    expect(formatHealthCheckReport(result)).toBeTypeOf("string");
  });
});
