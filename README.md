# Sovereign Academy

Discord-style math learning platform with native desktop capabilities.

## Tech Stack

- **Frontend**: Fresh 2.2.0 (Deno SSR), Vite 7.3.1, Preact 10.27.2+
- **State**: @preact/signals 2.5.0+
- **Desktop**: Rust (tao 0.31 + wry 0.48) — **FROZEN CORE** ✅
- **Math Engine**: Rust → WASM (9/9 tests passing)
- **Styling**: Pure CSS Discord theme

## Quick Start

### Prerequisites

- [Deno 2.6.9+](https://deno.land/manual/getting_started/installation)
- [Rust 1.92.0+](https://www.rust-lang.org/tools/install)
- wasm-pack: `cargo install wasm-pack`

### Development

```bash
# Start Fresh dev server (web mode)
deno task dev

# Launch native desktop app
deno task launch:desktop

# Run all checks
deno task verify
```

## Project Structure

```
sovereign-academy/
├── .github/
│   └── copilot-instructions.md  # GitHub Copilot AI context
├── .vscode/
│   └── skills/                  # VSCode workflow skills
│       ├── sovereign-academy.skill.md
│       └── phase6-anti-logic-drift.skill.md
├── desktop/                     # Rust native shell (FROZEN CORE)
├── math-engine/                 # Rust WASM validator
├── islands/                     # Preact islands (thin view layer)
├── routes/                      # Fresh SSR routes + APIs
├── lib/                         # Business logic (pure functions)
├── static/                      # Discord CSS, WASM, exercises
├── .editorconfig                # Consistent formatting
├── .gitattributes              # Line ending handling
├── deno.json                    # Tasks and imports
└── file.todo                    # Implementation tracking
```

## Available Tasks

```bash
# Development
deno task dev                # Fresh dev server (port 5173)
deno task launch:desktop     # Native frameless window

# Build
deno task build              # Production build
deno task build:wasm         # Compile Rust → WASM
deno task build:desktop      # Compile Rust → native exe

# Quality
deno task check              # fmt + lint + type-check
deno task verify             # check + cargo test + vitest + snapshots

# Testing
deno task test               # Rust + Vitest tests
deno task test:rust          # Rust tests only (31 tests)
deno task test:unit          # Vitest unit tests (62 tests, 4 files)
deno task test:e2e           # Playwright E2E tests (11 tests)

# Regression
deno task bisect:verify      # Git bisect runner (exit 0/1/125)
deno task snapshot:all       # Regenerate golden snapshots
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Sovereign Academy                  │
├──────────┬──────────────────┬───────────────────────┤
│ desktop/ │   math-engine/   │   Fresh 2.2.0 UI      │
│ (Rust)   │   (Rust→WASM)    │   (Deno + Preact)     │
│          │                  │                       │
│ tao+wry  │ check_answer()   │ islands/              │
│ frameless│ validate_*()     │   MathStage.tsx        │
│ Win32    │ simplify_*()     │   Sidebar.tsx          │
│ window   │ batch_validate() │   TitleBar.tsx         │
│          │                  │                       │
│ FROZEN   │ 31 tests         │ lib/                  │
│ CORE ✅  │ (9 unit+22 pure) │   state.ts (signals)  │
│          │                  │   validation.ts        │
│          │                  │   wasm-loader.ts       │
│          │                  │   exercise-loader.ts   │
│          │                  │   types.ts             │
└──────────┴──────────────────┴───────────────────────┘
         ↑ DO NOT MODIFY        ↑ Pure functions
```

### Frozen Core

`desktop/src/main.rs` is **FROZEN** — Win32 frameless window with DWM shadow,
custom WndProc, 8-direction resize, IPC handlers. Builds with 0 warnings. Only
modify with explicit approval.

### WASM Math Engine

Pure Rust functions in `math-engine/src/lib.rs`:

- `check_answer(problem, answer)` → JSON result
- `validate_fraction(fraction)` → boolean
- `simplify_fraction(num, denom)` → string

All functions are deterministic (no I/O, no timestamps) for git bisect
compatibility.

### Discord UI

Pure CSS theme at `static/discord.css` with Discord color palette, typography,
and interactions. Islands are thin view layers — business logic lives in `lib/`
as pure functions. State management uses Preact signals (zero `useState`).

## Phase 6: Life Saver Strategy

**Current Status**: Phase 6 complete ✅

**Completed**:

- ✅ Phase 6.1: Frozen Core (desktop/ audited, 0 warnings)
- ✅ Phase 6.2: Anti-Logic Drift (WASM purity tests, health checks, golden
  snapshots)
- ✅ Phase 6.3: Standard Tooling (Vitest 4.0.18, Playwright 1.58.2, deno
  fmt/lint/check)
- ✅ Phase 6.4: Institutional Memory (copilot-instructions.md, .editorconfig,
  .gitattributes)
- ✅ Phase 6.5: Git Bisect Strategy (deterministic snapshots, bisect-verify
  script, docs)
- ✅ Phase 6.6: Verification Before Push (pre-push hook, GitHub Actions CI)
- ✅ Phase 6.7: Migration & Clean Up (refactored islands, extracted lib/,
  deterministic PRNG, dead code removed)

See `file.todo` for detailed checklist.

## Regression Detection

If CI fails or a test starts breaking on main, use **git bisect** to find the
exact commit that introduced the regression:

```bash
# Automated — git runs verify at each step
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit>
git bisect run deno task bisect:verify
git bisect reset
```

This works because **all tests are deterministic** — no timestamps, no
randomness, no network calls. The verify pipeline (~5s) runs at each bisect
step, so finding the culprit in 100 commits takes under a minute.

See [docs/GIT_BISECT_GUIDE.md](docs/GIT_BISECT_GUIDE.md) for detailed
scenarios and workflows.

## AI Context

For GitHub Copilot users: See
[.github/copilot-instructions.md](.github/copilot-instructions.md) for
comprehensive project context, architecture rules, and development guidelines.

For VSCode users: Skills in [.vscode/skills/](.vscode/skills/) provide workflow
automation and Phase 6 implementation guidance.

## Contributing

1. Read `.github/copilot-instructions.md` for rules and conventions
2. Run `deno task verify` before committing
3. **All pushes are auto-verified** via pre-push hook (bypass: `git push --no-verify`)
4. GitHub Actions CI runs on every push to main and every PR
5. Never modify `desktop/src/main.rs` without approval (Frozen Core)
6. All WASM changes must pass `cargo test`
7. Follow Discord theme patterns for UI consistency

## License

MIT (or your chosen license)

---

**Discord-quality frameless desktop window ✅ | Pure Rust WASM math engine ✅ |
Anti-Logic Drift protection ✅**
