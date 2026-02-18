// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — WASM Health Check (Phase 6.2)
// ═══════════════════════════════════════════════════════════════════
//
// Anti-Logic Drift Pillar 3: Verify Everything.
//
// Runs on app startup BEFORE any exercise is displayed.
// If the WASM engine fails ANY check, we refuse to show exercises
// and display an error modal instead.
// ═══════════════════════════════════════════════════════════════════

import type { MathWasm } from "./types.ts";

export type { MathWasm };

export interface HealthCheckResult {
  passed: boolean;
  checks: HealthCheck[];
  duration: number; // ms
}

export interface HealthCheck {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

/**
 * Run the full WASM health check battery.
 *
 * Tests fundamental math operations to ensure WASM loaded correctly
 * and produces deterministic results.
 */
export function runHealthCheck(wasm: MathWasm): HealthCheckResult {
  const start = performance.now();
  const checks: HealthCheck[] = [];

  // ── Test 1: Basic addition ──
  checks.push(
    testArithmetic(wasm, "1 + 1 = 2", "1 + 1", 2, true),
  );

  // ── Test 2: Basic multiplication ──
  checks.push(
    testArithmetic(wasm, "2 * 3 = 6", "2 * 3", 6, true),
  );

  // ── Test 3: Basic division ──
  checks.push(
    testArithmetic(wasm, "4 / 2 = 2", "4 / 2", 2, true),
  );

  // ── Test 4: Wrong answer rejected ──
  checks.push(
    testArithmetic(wasm, "2 + 2 ≠ 5", "2 + 2", 5, false),
  );

  // ── Test 5: Division by zero ──
  checks.push(
    testArithmetic(wasm, "5 / 0 = reject", "5 / 0", 0, false),
  );

  // ── Test 6: Fraction equivalence ──
  checks.push(testFraction(wasm, "1/2 == 2/4", 1, 2, 2, 4, true));

  // ── Test 7: Fraction inequality ──
  checks.push(testFraction(wasm, "1/3 != 1/4", 1, 3, 1, 4, false));

  // ── Test 8: check_answer correct JSON ──
  checks.push(
    testCheckAnswer(
      wasm,
      "check_answer correct",
      "arithmetic",
      "2 + 3",
      "5",
      true,
    ),
  );

  // ── Test 9: check_answer incorrect JSON ──
  checks.push(
    testCheckAnswer(
      wasm,
      "check_answer incorrect",
      "arithmetic",
      "2 + 3",
      "6",
      false,
    ),
  );

  // ── Test 10: batch_validate ──
  checks.push(
    testBatchValidate(wasm, "batch 3/3", "2 + 3;4 * 5;10 / 2", "5;20;5", 3),
  );

  const duration = performance.now() - start;
  const passed = checks.every((c) => c.passed);

  return { passed, checks, duration };
}

// ─── Individual Test Helpers ─────────────────────────────────────────

function testArithmetic(
  wasm: MathWasm,
  name: string,
  expr: string,
  answer: number,
  expected: boolean,
): HealthCheck {
  try {
    const result = wasm.validate_arithmetic(expr, answer);
    return {
      name,
      passed: result === expected,
      expected: String(expected),
      actual: String(result),
    };
  } catch (e) {
    return {
      name,
      passed: false,
      expected: String(expected),
      actual: "ERROR",
      error: String(e),
    };
  }
}

function testFraction(
  wasm: MathWasm,
  name: string,
  en: number,
  ed: number,
  sn: number,
  sd: number,
  expected: boolean,
): HealthCheck {
  try {
    const result = wasm.validate_fraction(BigInt(en), BigInt(ed), BigInt(sn), BigInt(sd));
    return {
      name,
      passed: result === expected,
      expected: String(expected),
      actual: String(result),
    };
  } catch (e) {
    return {
      name,
      passed: false,
      expected: String(expected),
      actual: "ERROR",
      error: String(e),
    };
  }
}

function testCheckAnswer(
  wasm: MathWasm,
  name: string,
  type: string,
  problem: string,
  answer: string,
  expectedCorrect: boolean,
): HealthCheck {
  try {
    const jsonStr = wasm.check_answer(type, problem, answer);
    const parsed = JSON.parse(jsonStr);
    return {
      name,
      passed: parsed.correct === expectedCorrect,
      expected: `correct:${expectedCorrect}`,
      actual: `correct:${parsed.correct}`,
    };
  } catch (e) {
    return {
      name,
      passed: false,
      expected: `correct:${expectedCorrect}`,
      actual: "ERROR",
      error: String(e),
    };
  }
}

function testBatchValidate(
  wasm: MathWasm,
  name: string,
  problems: string,
  answers: string,
  expectedCount: number,
): HealthCheck {
  try {
    const result = wasm.batch_validate(problems, answers);
    return {
      name,
      passed: result === expectedCount,
      expected: String(expectedCount),
      actual: String(result),
    };
  } catch (e) {
    return {
      name,
      passed: false,
      expected: String(expectedCount),
      actual: "ERROR",
      error: String(e),
    };
  }
}

/**
 * Format health check results for console output.
 */
export function formatHealthCheckReport(result: HealthCheckResult): string {
  const lines: string[] = [];
  lines.push(
    `\n═══ WASM Health Check ${result.passed ? "PASSED ✅" : "FAILED ❌"} (${
      result.duration.toFixed(1)
    }ms) ═══`,
  );

  for (const check of result.checks) {
    const icon = check.passed ? "✅" : "❌";
    lines.push(`  ${icon} ${check.name}`);
    if (!check.passed) {
      lines.push(`     Expected: ${check.expected}`);
      lines.push(`     Actual:   ${check.actual}`);
      if (check.error) {
        lines.push(`     Error:    ${check.error}`);
      }
    }
  }

  lines.push(
    `═══ ${
      result.checks.filter((c) => c.passed).length
    }/${result.checks.length} checks passed ═══\n`,
  );
  return lines.join("\n");
}
