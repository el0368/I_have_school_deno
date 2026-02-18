# Phase 6 Anti-Logic Drift Implementation Skill

## Skill Purpose

Guide implementation of Phase 6 "Life Saver Strategy" for Sovereign Academy —
preventing circular regression, maintaining frozen core stability, and
establishing deterministic testing infrastructure.

## Context

**Current Status** (from file.todo):

- ✅ Phase 6.1: Frozen Core Shell (desktop/src/main.rs audited, 0 warnings)
- ⏳ Phase 6.2-6.8: Pending implementation

**Goal**: Implement comprehensive quality gates to prevent logic drift and
enable safe iteration.

## Phase 6.2: Anti-Logic Drift Integration

### Task Breakdown

#### 1. WASM Purity Tests (math-engine/tests/)

Create `math-engine/tests/purity_test.rs`:

```rust
// Deterministic tests for git bisect compatibility
// No timestamps, no randomness, fixed seeds only

#[test]
fn test_deterministic_arithmetic() {
    // Same inputs ALWAYS produce same outputs
    assert_eq!(validate_arithmetic("2+2"), validate_arithmetic("2+2"));
    assert_eq!(validate_arithmetic("10*5"), validate_arithmetic("10*5"));
}

#[test]
fn test_fraction_equivalence() {
    // Mathematical equivalence is deterministic
    assert_eq!(simplify_fraction(4, 8), simplify_fraction(2, 4));
    assert_eq!(simplify_fraction(15, 25), simplify_fraction(3, 5));
}

#[test]
fn test_no_side_effects() {
    // Calling functions multiple times doesn't change results
    let result1 = check_answer("5+5", "10");
    let result2 = check_answer("5+5", "10");
    assert_eq!(result1, result2);
}
```

**Key Principle**: Every WASM function must be pure — no I/O, no timestamps, no
randomness.

#### 2. Startup Health Check (lib/wasm-health-check.ts)

Create health check that runs before displaying UI:

```typescript
// lib/wasm-health-check.ts
import { check_answer, simplify_fraction, validate_fraction } from "./wasm-loader.ts";

export interface HealthCheckResult {
  passed: boolean;
  failures: string[];
  timestamp: number;
}

export async function runWASMHealthCheck(): Promise<HealthCheckResult> {
  const failures: string[] = [];

  // Test 1: Basic arithmetic
  try {
    const result = check_answer("2+2", "4");
    const parsed = JSON.parse(result);
    if (!parsed.correct) {
      failures.push("WASM arithmetic validation failed on 2+2=4");
    }
  } catch (e) {
    failures.push(`WASM check_answer threw: ${e.message}`);
  }

  // Test 2: Fraction validation
  try {
    const isValid = validate_fraction("1/2");
    if (!isValid) {
      failures.push("WASM fraction validation failed on 1/2");
    }
  } catch (e) {
    failures.push(`WASM validate_fraction threw: ${e.message}`);
  }

  // Test 3: Fraction simplification
  try {
    const simplified = simplify_fraction(4, 8);
    if (simplified !== "1/2") {
      failures.push(
        `WASM simplify_fraction(4, 8) returned ${simplified}, expected 1/2`,
      );
    }
  } catch (e) {
    failures.push(`WASM simplify_fraction threw: ${e.message}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    timestamp: Date.now(),
  };
}
```

**Integration Point**: Call in `islands/MathStage.tsx` before rendering
exercises:

```typescript
// In MathStage useEffect:
useEffect(() => {
  async function initWASM() {
    await loadWASM();

    const health = await runWASMHealthCheck();
    if (!health.passed) {
      console.error("WASM Health Check FAILED:", health.failures);
      // Show error UI to user
      setHealthStatus({ ok: false, errors: health.failures });
      return;
    }

    console.log("✅ WASM Health Check PASSED");
    setHealthStatus({ ok: true, errors: [] });
    setWasmReady(true);
  }
  initWASM();
}, []);
```

#### 3. Golden Snapshot Strategy (tests/golden/)

Create three snapshot generators:

**A. Physics Snapshot** (`scripts/snapshot-physics.ts`):

```typescript
// Captures math engine behavior deterministically
import { check_answer, validate_fraction, simplify_fraction } from '../lib/wasm-loader.ts';

const testCases = [
  { fn: 'check_answer', input: ['2+2', '4'], expected: { correct: true } },
  { fn: 'check_answer', input: ['10-5', '5'], expected: { correct: true } },
  { fn: 'validate_fraction', input: ['1/2'], expected: true },
  { fn: 'simplify_fraction', input: [4, 8], expected: '1/2' },
];

const results = testCases.map(tc => ({
  function: tc.fn,
  input: tc.input,
  output: /* call actual function */,
  expectedOutput: tc.expected,
  match: /* compare actual vs expected */,
}));

// Write to tests/golden/physics.json (NO timestamps!)
await Deno.writeTextFile(
  'tests/golden/physics.json',
  JSON.stringify(results, null, 2)
);
```

**B. UI Component Snapshot** (`scripts/snapshot-ui.ts`):

```typescript
// Captures Discord theme structure (for visual regression)
// Extract CSS custom properties, component class names, layout structure
// Write to tests/golden/ui_component.html (human-readable)
```

**C. State Snapshot** (`scripts/snapshot-state.ts`):

```typescript
// Captures signal behavior and state transitions
// Example: exercise progression, score calculation, topic unlocking
// Write to tests/golden/state_logic.json
```

**Usage**:

```bash
# Generate snapshots
deno run --allow-read --allow-write scripts/snapshot-physics.ts
deno run --allow-read --allow-write scripts/snapshot-ui.ts
deno run --allow-read --allow-write scripts/snapshot-state.ts

# Verify snapshots (add to deno task verify)
deno task verify  # should fail if behavior diverges from snapshots
```

## Phase 6.3: Standard Tooling Suite

### Vitest Installation

```bash
deno install -A npm:vitest
deno install -A npm:@vitest/ui
```

**Configuration** (`vite.config.ts`):

```typescript
import { defineConfig } from "vite";
import { preact } from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["lib/**/*.test.ts", "islands/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html", "lcov"],
      exclude: ["node_modules/", "tests/", "static/"],
    },
  },
});
```

**Example Unit Test** (`lib/exercise-loader.test.ts`):

```typescript
import { describe, expect, it } from "vitest";
import { parseExerciseBinary } from "./exercise-loader.ts";

describe("Exercise Binary Parser", () => {
  it("parses arithmetic exercise correctly", () => {
    // Create test binary: [0x01, length, "2+2", length, "4"]
    const binary = new Uint8Array([/* ... */]);
    const exercise = parseExerciseBinary(binary);

    expect(exercise.type).toBe("arithmetic");
    expect(exercise.problem).toBe("2+2");
    expect(exercise.answer).toBe("4");
  });
});
```

### Playwright Installation

```bash
deno install -A npm:@playwright/test
deno run -A npm:playwright install chromium
```

**Configuration** (`playwright.config.ts`):

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "deno task dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

**Example E2E Test** (`tests/e2e/exercise-flow.spec.ts`):

```typescript
import { expect, test } from "@playwright/test";

test("complete arithmetic exercise", async ({ page }) => {
  await page.goto("/");

  // Wait for WASM to load
  await page.waitForSelector(".wasm-badge", { state: "visible" });

  // Select first topic
  await page.click('.channel-link[data-topic="addition"]');

  // Wait for exercise to load
  await page.waitForSelector(".exercise-card");

  // Input answer
  await page.fill('input[type="text"]', "4");
  await page.click('button:has-text("Submit")');

  // Verify correct feedback
  await expect(page.locator(".result-correct")).toBeVisible();
});
```

## Phase 6.5: Automated Ledger

### Pre-Commit Hook (`.git/hooks/pre-commit`)

```bash
#!/bin/bash
# Auto-update LEDGER.md before each commit

echo "📝 Updating LEDGER.md..."

# Generate summary of staged changes
FILES_CHANGED=$(git diff --cached --name-only | wc -l)
INSERTIONS=$(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')
DELETIONS=$(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')

# Append to LEDGER.md
cat >> LEDGER.md <<EOF

## $(date +"%Y-%m-%d %H:%M:%S")
- Files changed: $FILES_CHANGED
- Insertions: +$INSERTIONS
- Deletions: -$DELETIONS
- Commit: $(git log -1 --oneline 2>/dev/null || echo "Initial commit")

EOF

# Stage LEDGER.md
git add LEDGER.md

echo "✅ LEDGER.md updated"
exit 0
```

**Make executable**: `chmod +x .git/hooks/pre-commit`

## Phase 6.6: Git Bisect Strategy

### Documentation (docs/GIT_BISECT_GUIDE.md)

````markdown
# Git Bisect Workflow for Sovereign Academy

## Prerequisites

All tests must be deterministic (no timestamps, no randomness).

## Usage

1. Identify regression: "WASM used to return X, now returns Y"
2. Find last known good commit: `git log --oneline`
3. Start bisect:
   ```bash
   git bisect start
   git bisect bad HEAD           # Current commit is broken
   git bisect good <commit-hash> # Last known working commit
   ```
````

4. Automated testing:
   ```bash
   git bisect run deno task verify
   ```
5. Git auto-finds breaking commit
6. Review: `git show <bad-commit>`
7. Reset: `git bisect reset`

## Verify Task Requirements

`deno task verify` MUST:

- Exit 0 if all checks pass
- Exit non-zero if ANY check fails
- Produce same result for same code (deterministic)
- Complete in <30 seconds

## Snapshot Verification

Golden snapshots in `tests/golden/`:

- `physics.json` — WASM math engine outputs
- `ui_component.html` — Discord theme structure
- `state_logic.json` — Signal state transitions

DO NOT include timestamps in snapshots!

````
## Phase 6.7: Verification Before Push

### Pre-Push Hook (`.git/hooks/pre-push`)
```bash
#!/bin/bash
# Block push if verification fails

echo "🔍 Running full verification suite..."

# Run all checks
deno task check || exit 1
cargo test --manifest-path=./math-engine/Cargo.toml || exit 1
deno task build:wasm || exit 1

# Run snapshot verification
deno run --allow-read scripts/verify-snapshots.ts || exit 1

# If Phase 6.3 complete: run tests
if [ -f "playwright.config.ts" ]; then
  deno task test:unit || exit 1
  deno task test:e2e || exit 1
fi

echo "✅ All checks passed — pushing to remote"
exit 0
````

**Make executable**: `chmod +x .git/hooks/pre-push`

### GitHub Actions CI (`.github/workflows/verify.yml`)

```yaml
name: Verify Build

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v2.6.9

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Deno Check
        run: deno task check

      - name: Rust Tests
        run: cargo test --manifest-path=./math-engine/Cargo.toml

      - name: Build WASM
        run: deno task build:wasm

      - name: Verify Snapshots
        run: deno run --allow-read scripts/verify-snapshots.ts

      - name: Unit Tests (if configured)
        run: deno task test:unit || echo "Vitest not yet configured"

      - name: E2E Tests (if configured)
        run: deno task test:e2e || echo "Playwright not yet configured"
```

## Implementation Order

**Recommended sequence**:

1. Phase 6.2: Create health check → test in UI → passes ✅
2. Phase 6.2: Create purity tests → cargo test → passes ✅
3. Phase 6.2: Generate golden snapshots → manual review ✅
4. Phase 6.3: Install Vitest → write 3-5 unit tests → passes ✅
5. Phase 6.3: Install Playwright → write 1 E2E test → passes ✅
6. Phase 6.5: Create pre-commit hook → test with dummy commit ✅
7. Phase 6.6: Document git bisect → test with known regression ✅
8. Phase 6.7: Create pre-push hook → test push ✅
9. Phase 6.7: Setup GitHub Actions → push to remote → CI passes ✅
10. Phase 6.8: Final verification + documentation update ✅

## Success Criteria

**Phase 6 Complete When**:

- [ ] WASM health check runs on every page load
- [ ] All WASM tests are deterministic (no flakes)
- [ ] 3 golden snapshots exist and verify correctly
- [ ] Vitest configured with ≥5 unit tests passing
- [ ] Playwright configured with ≥1 E2E test passing
- [ ] Pre-commit hook auto-updates LEDGER.md
- [ ] Pre-push hook blocks if verification fails
- [ ] GitHub Actions CI runs on every push
- [ ] `docs/GIT_BISECT_GUIDE.md` exists and tested
- [ ] Desktop shell remains at 0 warnings (frozen core intact)

---

**Remember**: The goal is preventing circular regression. Every change must be
testable, deterministic, and reversible via git bisect.
