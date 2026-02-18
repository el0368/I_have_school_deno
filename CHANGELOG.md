# Changelog

All notable changes to the Sovereign Academy project.

## Phase 6.8 — Migration & Clean Up (2026-02-18)

### Added

- `lib/types.ts` — shared `MathWasm` interface (single source of truth)
- `lib/wasm-loader.ts` — WASM initialization extracted from MathStage island
- `lib/validation.ts` — answer validation with WASM + fallback paths
- `lib/validation.test.ts` — 12 unit tests for validation module
- Deterministic seeded PRNG (`mulberry32`) in exercise-loader.ts
- Timer cleanup for auto-advance in MathStage (prevents memory leak)
- 404 page CSS classes in discord.css (`.error-404-*`)
- 2 new determinism tests for `generateDemoExercise`

### Changed

- **MathStage.tsx** — refactored to thin view layer; business logic moved to
  lib/ modules
- **exercise-loader.ts** — `generateDemoExercise()` now uses seeded PRNG instead
  of `Math.random()` (deterministic: same inputs → same output)
- **wasm-health-check.ts** — imports `MathWasm` from shared `lib/types.ts`
  instead of defining locally
- **_404.tsx** — replaced inline styles with Discord CSS classes
- **discord.css** — added 404 page styles following Discord theme
- Test count: 48 → 62 Vitest tests (4 files)

### Removed

- `islands/Counter.tsx` — unused Fresh scaffold leftover
- `components/Button.tsx` — unused, only referenced by Counter
- `routes/api/joke.ts` — unused Fresh scaffold leftover
- `routes/greet/[name].tsx` — unused Fresh scaffold leftover
- `components/` directory — empty after Button removal
- Duplicate `MathWasm` interface from MathStage.tsx and wasm-health-check.ts

### Fixed

- `setTimeout` in MathStage auto-advance now has proper cleanup (cleared on
  topic change and skip)
- `generateDemoExercise()` no longer violates determinism rules

## Phase 6.6 — Verification Before Push (2026-02-18)

### Added

- `.git/hooks/pre-push` — auto-runs `deno task verify` before every push
- `.github/workflows/verify.yml` — GitHub Actions CI (3 jobs: rust-tests,
  deno-verify, snapshot-check)

## Phase 6.5 — Git Bisect Strategy (2026-02-18)

### Added

- `docs/GIT_BISECT_GUIDE.md` — comprehensive bisect documentation
- `scripts/bisect-verify.ts` — git-bisect-compatible runner (exit 0/1/125)
- `deno task bisect:verify`

## Phases 6.1–6.4 — Foundation (2026-02-18)

### Added

- Phase 6.1: Frozen Core (desktop/ audited, documented)
- Phase 6.2: Anti-Logic Drift (WASM purity tests, health checks, golden
  snapshots)
- Phase 6.3: Standard Tooling Suite (Vitest, Playwright, deno fmt/lint/check)
- Phase 6.4: Institutional Memory (copilot-instructions.md, .editorconfig,
  .gitattributes)
