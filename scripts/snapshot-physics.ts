// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — Physics Snapshot Generator (Phase 6.2)
// ═══════════════════════════════════════════════════════════════════
//
// Generates deterministic math engine snapshots for golden master testing.
// NO timestamps, NO randomness — safe for git bisect.
//
// Usage: deno run --allow-read --allow-write scripts/snapshot-physics.ts
// ═══════════════════════════════════════════════════════════════════

interface TestCase {
  category: string;
  function: string;
  input: string;
  expectedOutput: string;
}

// ─── Test Battery ────────────────────────────────────────────────────
// These are the canonical test cases. If any output changes,
// the math engine has drifted.

const TEST_CASES: TestCase[] = [
  // Arithmetic — Addition
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "2 + 3, answer=5",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "0 + 0, answer=0",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "999 + 1, answer=1000",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "2 + 3, answer=6",
    expectedOutput: "false",
  },

  // Arithmetic — Subtraction
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "10 - 4, answer=6",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "0 - 5, answer=-5",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "100 - 100, answer=0",
    expectedOutput: "true",
  },

  // Arithmetic — Multiplication
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "7 * 8, answer=56",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "0 * 999, answer=0",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "1 * 1, answer=1",
    expectedOutput: "true",
  },

  // Arithmetic — Division
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "15 / 3, answer=5",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "10 / 2, answer=5",
    expectedOutput: "true",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "7 / 2, answer=3.5",
    expectedOutput: "true",
  },

  // Arithmetic — Division by zero
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "5 / 0, answer=0",
    expectedOutput: "false",
  },
  {
    category: "arithmetic",
    function: "validate_arithmetic",
    input: "0 / 0, answer=0",
    expectedOutput: "false",
  },

  // Fractions — Equivalence
  {
    category: "fraction",
    function: "validate_fraction",
    input: "1/2 == 2/4",
    expectedOutput: "true",
  },
  {
    category: "fraction",
    function: "validate_fraction",
    input: "3/4 == 6/8",
    expectedOutput: "true",
  },
  {
    category: "fraction",
    function: "validate_fraction",
    input: "1/3 == 2/6",
    expectedOutput: "true",
  },
  {
    category: "fraction",
    function: "validate_fraction",
    input: "5/10 == 1/2",
    expectedOutput: "true",
  },

  // Fractions — Inequality
  {
    category: "fraction",
    function: "validate_fraction",
    input: "1/3 != 1/4",
    expectedOutput: "false",
  },
  {
    category: "fraction",
    function: "validate_fraction",
    input: "2/3 != 3/4",
    expectedOutput: "false",
  },

  // Fractions — Zero denominator
  {
    category: "fraction",
    function: "validate_fraction",
    input: "1/0 == 1/2",
    expectedOutput: "false",
  },
  {
    category: "fraction",
    function: "validate_fraction",
    input: "1/2 == 1/0",
    expectedOutput: "false",
  },

  // Simplification
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "4/8",
    expectedOutput: "[1, 2]",
  },
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "6/9",
    expectedOutput: "[2, 3]",
  },
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "15/25",
    expectedOutput: "[3, 5]",
  },
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "7/7",
    expectedOutput: "[1, 1]",
  },
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "12/4",
    expectedOutput: "[3, 1]",
  },
  {
    category: "simplify",
    function: "simplify_fraction",
    input: "5/0",
    expectedOutput: "[0, 0]",
  },

  // Equations (engine supports single-operator sides: "x op b = c")
  {
    category: "equation",
    function: "validate_equation",
    input: "x + 1 = 3, x=2",
    expectedOutput: "true",
  },
  {
    category: "equation",
    function: "validate_equation",
    input: "x * 3 = 12, x=4",
    expectedOutput: "true",
  },
  {
    category: "equation",
    function: "validate_equation",
    input: "x - 5 = 10, x=15",
    expectedOutput: "true",
  },
  {
    category: "equation",
    function: "validate_equation",
    input: "x + 1 = 3, x=5",
    expectedOutput: "false",
  },

  // check_answer JSON
  {
    category: "check_answer",
    function: "check_answer",
    input: "arithmetic, 2 + 3, answer=5",
    expectedOutput: '{"correct":true,"hint":"Correct!","problem":"2 + 3","answer":"5"}',
  },
  {
    category: "check_answer",
    function: "check_answer",
    input: "arithmetic, 2 + 3, answer=6",
    expectedOutput:
      '{"correct":false,"hint":"Try evaluating 2 + 3 step by step.","problem":"2 + 3","answer":"6"}',
  },

  // batch_validate
  {
    category: "batch",
    function: "batch_validate",
    input: "2 + 3;4 * 5;10 / 2 | 5;20;5",
    expectedOutput: "3",
  },
  {
    category: "batch",
    function: "batch_validate",
    input: "2 + 3;4 * 5 | 5;21",
    expectedOutput: "1",
  },
  {
    category: "batch",
    function: "batch_validate",
    input: "1 + 1 | 3",
    expectedOutput: "0",
  },

  // Edge cases
  {
    category: "edge",
    function: "validate_arithmetic",
    input: "1, answer=1",
    expectedOutput: "true",
  },
  {
    category: "edge",
    function: "check_answer",
    input: "unknown_type, x, answer=y",
    expectedOutput:
      '{"correct":false,"hint":"Unknown problem type: unknown_type","problem":"x","answer":"y"}',
  },
  {
    category: "edge",
    function: "validate_fraction",
    input: "0/0 == 0/0",
    expectedOutput: "false",
  },
];

// ─── Generate Snapshot ───────────────────────────────────────────────

function generatePhysicsSnapshot(): string {
  const lines: string[] = [];

  lines.push("# Sovereign Academy — Physics Golden Snapshot");
  lines.push("# Generated by: scripts/snapshot-physics.ts");
  lines.push("# WARNING: NO timestamps — deterministic for git bisect");
  lines.push("#");
  lines.push(`# Total test cases: ${TEST_CASES.length}`);
  lines.push("# Format: [category] function(input) → expectedOutput");
  lines.push("");

  let currentCategory = "";

  for (const tc of TEST_CASES) {
    if (tc.category !== currentCategory) {
      if (currentCategory !== "") lines.push("");
      lines.push(
        `── ${tc.category.toUpperCase()} ${"─".repeat(50 - tc.category.length)}`,
      );
      currentCategory = tc.category;
    }

    lines.push(`${tc.function}(${tc.input}) → ${tc.expectedOutput}`);
  }

  lines.push("");
  lines.push(`# Total: ${TEST_CASES.length} cases`);
  lines.push(
    "# If ANY output differs from this file, the math engine has drifted.",
  );
  lines.push("# Run: git bisect run deno task verify");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const snapshot = generatePhysicsSnapshot();
  const outPath = "tests/golden/physics.txt";

  // Ensure directory exists
  await Deno.mkdir("tests/golden", { recursive: true });
  await Deno.writeTextFile(outPath, snapshot);

  console.log(`✅ Physics snapshot written to ${outPath}`);
  console.log(`   ${TEST_CASES.length} test cases captured`);
}

main();
