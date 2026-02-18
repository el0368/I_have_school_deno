# Sovereign Academy — GitHub Copilot Instructions

## Project Identity

**Sovereign Academy** is a Discord-style math learning platform with native
desktop capabilities. Built with Fresh 2.2.0, Deno 2.6.9, Preact, and Rust
(WASM + desktop shell).

## Architecture Overview

### Core Stack

- **Frontend**: Fresh 2.2.0 (SSR), Vite 7.3.1, Preact 10.27.2+, @preact/signals
  2.5.0+
- **Runtime**: Deno 2.6.9 with FFI enabled
- **Desktop Shell**: Rust tao 0.31 + wry 0.48 (frameless window with Win32 APIs)
  — **FROZEN CORE**
- **Math Engine**: Rust → WASM (`math-engine/`)
- **Styling**: Pure CSS Discord theme (`static/discord.css`)

### Critical Files (DO NOT MODIFY)

- `desktop/src/main.rs` — **FROZEN CORE STATUS** ✅ Audited, 0 warnings, fully
  functional frameless window
  - Custom Win32 FFI (WM_NCHITTEST, DwmExtendFrameIntoClientArea, WndProc
    subclass)
  - 8-direction native resize via JS IPC → ReleaseCapture + SendMessage
  - Only modify with explicit user approval and full regression testing

### Key Directories

```
├── desktop/           # Rust tao+wry native shell (FROZEN)
├── math-engine/       # Rust WASM math validator (9/9 tests passing)
├── islands/           # Preact islands — thin view layer (MathStage, Sidebar, TitleBar)
├── routes/            # Fresh routes + API endpoints
├── lib/               # Business logic as pure functions
│   ├── types.ts       # Shared types (MathWasm interface)
│   ├── state.ts       # Preact signals (global state)
│   ├── validation.ts  # Answer validation (WASM + fallback)
│   ├── wasm-loader.ts # WASM initialization + health check
│   ├── exercise-loader.ts # Binary exercise loading + demo gen
│   └── wasm-health-check.ts # Startup health check battery
└── static/            # Discord CSS, WASM binaries, exercise .bin files
```

## Code Style & Conventions

### TypeScript/Deno

- Use Deno-native imports: `jsr:@fresh/core`, `jsr:@preact/signals`
- Prefer explicit types, avoid `any`
- Use `export function` (not `export const fn = ()`)
- File naming: `kebab-case.ts` for utils, `PascalCase.tsx` for components
- Formatter: `deno fmt` — lineWidth 100, indentWidth 2
- Linter: `deno lint` — fresh + recommended rule tags

### Preact Signals Patterns (Zero useState Policy)

All state management uses `@preact/signals`. **Never use `useState`.**

```tsx
// ── Global shared signals (lib/state.ts) ──
import { computed, signal } from "@preact/signals";

export const activeTopic = signal(1);
export const exerciseIndex = signal(0);
export const sidebarCollapsed = signal(false);

// Computed signals derive from other signals automatically
export const activeTopicData = computed(() => TOPICS.find((t) => t.id === activeTopic.value));

// Actions: mutate signals in plain functions (not hooks)
export function selectTopic(id: number) {
  activeTopic.value = id;
  exerciseIndex.value = 0;
}

// ── Local component signals (islands/) ──
import { useSignal } from "@preact/signals";

export default function MyIsland() {
  const count = useSignal(0); // local to this island
  return <button onClick={() => count.value++}>{count}</button>;
}
```

**Key rules:**

- Global state → `signal()` in `lib/state.ts`, imported where needed
- Local state → `useSignal()` inside island components
- Derived state → `computed()`, never manual sync
- Actions → plain exported functions that mutate `.value`
- Never read `.value` during render — pass the signal directly to JSX

### Rust

- Math engine: Pure functions, no I/O, deterministic (for git bisect)
- Use `#[wasm_bindgen]` for all WASM exports
- Return JSON strings from WASM (not complex objects)
- Tests required: `cargo test` must pass before PR

### CSS

- Discord theme variables in `:root` (see `static/discord.css`)
- No inline styles unless absolutely necessary
- Use `.desktop-mode` class for native window adjustments
- Preserve `-webkit-app-region: drag` on title bar

## Anti-Logic Drift Rules

**Pillar 2 & 3 Integration:**

1. **Math engine purity**: All WASM functions must be pure, testable,
   deterministic
2. **Snapshots required**: Changes to physics/logic → create snapshot in
   `tests/golden/`
3. **Health checks**: WASM loads successfully and responds correctly at startup
4. **No circular regression**: Before fixing a bug, create a test that fails →
   fix → test passes

### Determinism Rules (for Git Bisect)

All tests must be **100% reproducible**. Same input → same output, every time.

- **NO** `Date.now()`, `new Date()`, or `performance.now()` in test output
- **NO** `Math.random()` without a fixed seed
- **NO** network calls or filesystem ordering dependencies in tests
- **NO** process IDs, memory addresses, or temp file paths in output
- **YES** hard-coded inputs and expected outputs
- **YES** fixed seeds for any pseudo-random data
- **YES** byte-for-byte snapshot comparison

### Before Making Changes

- [ ] Read `file.todo` for implementation status
- [ ] Check if code is in FROZEN CORE (desktop/src/main.rs)
- [ ] Run `deno task check` (fmt, lint, type-check)
- [ ] Run `cargo test` (math-engine tests)
- [ ] If touching WASM: `deno task build:wasm` and test in UI

## Task Commands

```bash
# Development
deno task dev                # Start Fresh dev server (port 5173, Vite HMR)
deno task launch:desktop     # Launch native frameless window

# Build & Check
deno task build              # Build Fresh production (client + SSR)
deno task check              # Run fmt + lint + type-check
deno task build:wasm         # Compile Rust → WASM
deno task build:desktop      # Compile Rust → native exe

# Testing
deno task test               # Run all tests (Rust + Vitest)
deno task test:rust          # Rust math-engine (9 unit + 22 purity)
deno task test:unit          # Vitest unit tests (62 tests, 4 files)
deno task test:e2e           # Playwright E2E tests (11 tests, 2 specs)
deno task verify             # Full pipeline: check → test:rust → test:unit → snapshots

# Regression
deno task bisect:verify      # Git bisect runner (exit 0/1/125)
deno task snapshot:all       # Regenerate all golden snapshots
```

## Phase 6 "Life Saver Strategy" — In Progress

Current focus: Preventing circular regression and maintaining frozen core
stability.

### Implemented

- ✅ Phase 6.1: Frozen Core Shell (desktop/src/main.rs audited, 0 warnings)
- ✅ Phase 6.2: Anti-Logic Drift (WASM purity tests, health checks, golden
  snapshots)
- ✅ Phase 6.3: Standard Tooling Suite (Vitest 4.0.18, Playwright 1.58.2, deno
  fmt/lint/check configured)
- ✅ Phase 6.4: Institutional Memory (copilot-instructions.md, .editorconfig,
  .gitattributes)
- ✅ Phase 6.5: Git Bisect Strategy (deterministic snapshots, bisect-verify
  script, docs)
- ✅ Phase 6.6: Verification Before Push (pre-push hook, GitHub Actions CI)
- ✅ Phase 6.7: Migration & Clean Up (refactored islands, extracted lib/,
  deterministic PRNG, dead code removed)

### Phase 6 Complete ✅

## Common Tasks

### Adding a New Island

1. Create `islands/MyIsland.tsx` with default export
2. Use Preact signals for state: `import { signal } from '@preact/signals'`
3. Follow Discord theme classes from `static/discord.css`
4. Import in route: `import MyIsland from '../islands/MyIsland.tsx'`

### Modifying WASM Math Engine

1. Edit `math-engine/src/lib.rs`
2. Add tests in `#[cfg(test)] mod tests { ... }`
3. Run `cargo test` (must pass)
4. Run `deno task build:wasm`
5. Test in browser dev tools: `await init(); check_answer(...)`

### Desktop Window Behavior Changes

⚠️ **STOP** — `desktop/src/main.rs` is FROZEN CORE

- Only modify with explicit user approval
- Must include full regression test plan
- Must verify 0 warnings after change

### Adding Exercise Content

- Exercises stored as `.bin` files in `static/exercises/[topic]/`
- Format: 1 byte type + length-prefixed UTF-8 strings
- Generate with: (tool pending — Phase 5)

## Regression Detection (Git Bisect)

If a test starts failing on main, use git bisect to find the exact breaking
commit:

```bash
# Automated bisect (recommended)
git bisect start
git bisect bad HEAD
git bisect good <last-known-good-commit>
git bisect run deno task bisect:verify
git bisect reset
```

See `docs/GIT_BISECT_GUIDE.md` for detailed workflows and scenarios.

The `bisect:verify` script runs all 6 verification steps (fmt, lint, check,
cargo test, vitest, snapshots) and exits with git-bisect-compatible codes:
0 = good, 1 = bad, 125 = skip.

## Common Pitfalls

❌ **DON'T**

- Modify `desktop/src/main.rs` without permission
- Use `npm` or `node` (this is Deno-only)
- Import from `@deno/std` (use `jsr:@std/...` instead)
- Add timestamps to WASM outputs (breaks deterministic snapshots)
- Use `style="..."` inline (use classes from discord.css)

✅ **DO**

- Check `file.todo` before starting work
- Run `deno task check` before committing
- Write tests for new WASM functions
- Preserve Discord visual consistency
- Ask before touching frozen core

## Discord UI Principles

1. **Color Palette**: Dark mode only (#1e1f22 bg, #2b2d31 secondary, #313338
   tertiary)
2. **Typography**: `gg sans` font family (fallback to system sans)
3. **Interactions**: 0.15s fast transitions, 0.25s normal
4. **Status Colors**:
   - Success: #23a559 (green)
   - Error: #f23f43 (red)
   - Brand: #5865f2 (blurple)
5. **Spacing**: Consistent 8px grid system

## Support & Context

- **Implementation Plan**: See `file.todo` for detailed phase tracking
- **Original Context**: Gemini brain backup at
  `C:\Users\hlek\.gemini\antigravity\brain\16ad6bdf-99d6-4603-a4c5-f96ce82ee950\`
- **Math Engine Tests**: Run `cd math-engine && cargo test --verbose`
- **Desktop Shell**: See `desktop/README.md` (if exists) or source comments

---

**Remember**: This is a learning platform. Prioritize code clarity, correctness,
and educational value over clever optimizations.
