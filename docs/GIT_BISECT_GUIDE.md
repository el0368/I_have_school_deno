# Git Bisect Guide — Sovereign Academy

## What Is Git Bisect?

`git bisect` performs a binary search through your commit history to find the
exact commit that introduced a bug or regression. Instead of checking every
commit manually, it halves the search space each step.

**Math**: For 100 commits, bisect finds the culprit in at most
$\lceil \log_2(100) \rceil = 7$ steps.

## Why This Project Uses Bisect

Sovereign Academy has a fully deterministic verify pipeline:

- **deno fmt** — formatting is fixed (lineWidth 100, indentWidth 2)
- **deno lint** — linter rules are fixed (fresh + recommended)
- **deno check** — TypeScript types are checked
- **cargo test** — 31 Rust tests (9 unit + 22 purity × 100 iterations)
- **vitest** — 48 unit tests (state, exercise-loader, wasm-health-check)
- **golden snapshots** — 6 deterministic golden files in `tests/golden/`

Because every test is deterministic (no timestamps, no randomness, no network
calls), `git bisect run` can automatically find breaking commits.

## Quick Start

### Manual Bisect

```bash
# 1. Start bisect session
git bisect start

# 2. Mark current commit as broken
git bisect bad

# 3. Mark last known good commit
git bisect good <commit-hash>

# 4. Git checks out the midpoint — run verify
deno task verify

# 5. Tell git the result
git bisect good   # if verify passes
git bisect bad    # if verify fails

# 6. Repeat steps 4-5 until git finds the culprit
# Git will print: "<hash> is the first bad commit"

# 7. End bisect session
git bisect reset
```

### Automated Bisect (Recommended)

Let git run the verify pipeline automatically at each step:

```bash
# Start bisect
git bisect start

# Mark bad (current HEAD) and good (known working commit)
git bisect bad HEAD
git bisect good <last-known-good-commit>

# Let git bisect automatically — runs verify at each step
git bisect run deno task verify

# Git prints the first bad commit when done
# Then reset to return to your original branch
git bisect reset
```

Or use the dedicated bisect script for more control:

```bash
git bisect run deno run --allow-read --allow-write --allow-run scripts/bisect-verify.ts
```

## The Bisect-Verify Script

`scripts/bisect-verify.ts` is a self-contained script designed for
`git bisect run`. It:

1. Runs `deno fmt --check .` (formatting)
2. Runs `deno lint .` (linting)
3. Runs `deno check` (type checking)
4. Runs `cargo test` in `math-engine/` (Rust tests)
5. Runs `npx vitest run` (unit tests)
6. Verifies golden snapshots in `tests/golden/`

**Exit codes** (per git bisect convention):

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| 0    | All checks pass — commit is good                    |
| 1    | A check failed — commit is bad                      |
| 125  | Skip — commit can't be tested (e.g., won't compile) |

## Determinism Rules

For git bisect to work reliably, **all tests must be deterministic**:

### DO

- Use hard-coded test inputs and expected outputs
- Use fixed seeds for any pseudo-random data
- Compare exact byte-for-byte output in snapshots
- Test pure functions (same input → same output, always)

### DON'T

- Use `Date.now()`, `new Date()`, or `performance.now()` in test output
- Use `Math.random()` without a fixed seed
- Depend on network calls or filesystem ordering
- Include process IDs, memory addresses, or temp file paths in output

### Snapshot Determinism

All snapshot generators follow these rules:

| Script                | Output                             | Deterministic?                  |
| --------------------- | ---------------------------------- | ------------------------------- |
| `snapshot-physics.ts` | `tests/golden/physics.txt`         | Yes — fixed test battery        |
| `snapshot-ui.ts`      | `tests/golden/ui-*.html` (4 files) | Yes — static component analysis |
| `snapshot-state.ts`   | `tests/golden/state-flow.log`      | Yes — fixed action sequences    |

## Common Scenarios

### Scenario 1: Unit Test Started Failing

```bash
# You know tests passed at commit abc123
git bisect start
git bisect bad HEAD
git bisect good abc123
git bisect run deno task verify
# → Git finds the exact commit that broke the test
git bisect reset
```

### Scenario 2: Golden Snapshot Changed

```bash
# Snapshot verification fails — something changed the output
git bisect start
git bisect bad HEAD
git bisect good abc123
git bisect run deno run --allow-read scripts/verify-snapshots.ts
# → Git finds the commit that altered the snapshot
git bisect reset
```

### Scenario 3: Rust Math Engine Regression

```bash
# Purity tests fail — math output drifted
git bisect start
git bisect bad HEAD
git bisect good abc123
git bisect run bash -c "cd math-engine && cargo test"
# → Git finds the commit that changed math behavior
git bisect reset
```

### Scenario 4: Only Test Specific Area

```bash
# Only care about state management regression
git bisect start
git bisect bad HEAD
git bisect good abc123
git bisect run npx vitest run lib/state.test.ts
git bisect reset
```

## Viewing Bisect Log

During or after a bisect session:

```bash
# Show the bisect log (which commits were tested)
git bisect log

# Visualize the bisect in gitk
git bisect visualize
```

## Tips

- **Always `git bisect reset`** when done — otherwise you're stuck on a
  detached HEAD
- **Stash uncommitted changes** before starting: `git stash`
- **Use `git bisect skip`** if a commit can't be tested (e.g., broken build
  unrelated to your bug)
- **The verify pipeline is fast** (~5 seconds) — bisecting 100 commits takes
  under a minute
- **Snapshots are your safety net** — if output changes, bisect finds exactly
  where

## Related Commands

```bash
deno task verify              # Full pipeline (what bisect runs)
deno task test                # Rust + Vitest tests only
deno task snapshot:all        # Regenerate all golden snapshots
deno task check               # fmt + lint + type-check only
```
