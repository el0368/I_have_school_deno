// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — Bisect Verify Script (Phase 6.5)
// ═══════════════════════════════════════════════════════════════════
//
// Self-contained verification script designed for `git bisect run`.
//
// Exit codes (git bisect convention):
//   0   — All checks pass (commit is GOOD)
//   1   — A check failed (commit is BAD)
//   125 — Cannot test this commit (SKIP)
//
// Usage:
//   git bisect run deno run --allow-read --allow-write --allow-run scripts/bisect-verify.ts
//
// Or directly:
//   deno run --allow-read --allow-write --allow-run scripts/bisect-verify.ts
//
// NO timestamps, NO randomness — fully deterministic.
// ═══════════════════════════════════════════════════════════════════

interface StepResult {
  name: string;
  passed: boolean;
  duration: number;
  output: string;
}

async function runCommand(
  name: string,
  cmd: string[],
  cwd?: string,
): Promise<StepResult> {
  const start = performance.now();
  try {
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      cwd: cwd ?? Deno.cwd(),
      stdout: "piped",
      stderr: "piped",
    });
    const result = await command.output();
    const duration = performance.now() - start;
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    return {
      name,
      passed: result.success,
      duration,
      output: (stdout + stderr).trim(),
    };
  } catch (err) {
    const duration = performance.now() - start;
    return {
      name,
      passed: false,
      duration,
      output: `Command failed: ${err}`,
    };
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function verifyGoldenSnapshots(): Promise<StepResult> {
  const start = performance.now();
  const goldenDir = "tests/golden";
  const expectedFiles = [
    "physics.txt",
    "state-flow.log",
    "ui-titlebar.html",
    "ui-sidebar.html",
    "ui-mathstage.html",
    "ui-theme.html",
  ];

  if (!await fileExists(goldenDir)) {
    return {
      name: "Golden snapshots",
      passed: false,
      duration: performance.now() - start,
      output: `Directory ${goldenDir}/ not found`,
    };
  }

  const missing: string[] = [];
  for (const file of expectedFiles) {
    const path = `${goldenDir}/${file}`;
    if (!await fileExists(path)) {
      missing.push(file);
      continue;
    }
    const content = await Deno.readTextFile(path);
    if (content.trim().length === 0) {
      missing.push(`${file} (empty)`);
    }
  }

  const duration = performance.now() - start;
  if (missing.length > 0) {
    return {
      name: "Golden snapshots",
      passed: false,
      duration,
      output: `Missing/empty: ${missing.join(", ")}`,
    };
  }

  return {
    name: "Golden snapshots",
    passed: true,
    duration,
    output: `${expectedFiles.length} snapshots verified`,
  };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Bisect Verify — Sovereign Academy       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  // Check that essential files exist (skip if commit is too old)
  if (!await fileExists("deno.json")) {
    console.log("⏭  deno.json not found — skipping commit (exit 125)");
    return 125;
  }

  if (!await fileExists("math-engine/Cargo.toml")) {
    console.log("⏭  math-engine/Cargo.toml not found — skipping commit (exit 125)");
    return 125;
  }

  const steps: StepResult[] = [];

  // Step 1: Format check
  console.log("  [1/6] Checking formatting...");
  steps.push(await runCommand("deno fmt", ["deno", "fmt", "--check", "."]));

  // Step 2: Lint
  console.log("  [2/6] Linting...");
  steps.push(await runCommand("deno lint", ["deno", "lint", "."]));

  // Step 3: Type check
  console.log("  [3/6] Type checking...");
  steps.push(await runCommand("deno check", ["deno", "check"]));

  // Step 4: Rust tests
  console.log("  [4/6] Running Rust tests...");
  steps.push(await runCommand("cargo test", ["cargo", "test"], "math-engine"));

  // Step 5: Vitest unit tests
  console.log("  [5/6] Running unit tests...");
  steps.push(
    await runCommand("vitest", ["npx", "vitest", "run", "--config", "vitest.config.ts"]),
  );

  // Step 6: Golden snapshots
  console.log("  [6/6] Verifying golden snapshots...");
  steps.push(await verifyGoldenSnapshots());

  // ─── Results ─────────────────────────────────────────────────────
  console.log();
  console.log("─── Results ──────────────────────────────────");

  let allPassed = true;
  let totalDuration = 0;

  for (const step of steps) {
    const icon = step.passed ? "✅" : "❌";
    const ms = step.duration.toFixed(0);
    console.log(`  ${icon} ${step.name} (${ms}ms)`);
    if (!step.passed) {
      // Show first 3 lines of failure output
      const lines = step.output.split("\n").slice(0, 3);
      for (const line of lines) {
        console.log(`     ${line}`);
      }
      allPassed = false;
    }
    totalDuration += step.duration;
  }

  console.log();
  console.log(`Total: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log();

  if (allPassed) {
    console.log("✅ GOOD — All checks passed");
    return 0;
  } else {
    console.log("❌ BAD — One or more checks failed");
    return 1;
  }
}

const exitCode = await main();
Deno.exit(exitCode);
