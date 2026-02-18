# Sovereign Academy Development Skill

## Skill Identity

**Name**: sovereign-academy-workflow\
**Domain**: Fresh + Deno + Rust hybrid application development\
**Purpose**: Discord-style math learning platform with native desktop shell

## When to Use This Skill

Invoke this skill when the user asks to:

- Create, modify, or debug islands (Preact components)
- Work with the Rust WASM math engine
- Adjust Discord theme styling
- Add new routes or API endpoints
- Investigate desktop window behavior (but DO NOT modify `desktop/src/main.rs`
  without explicit approval)
- Implement Phase 6 tasks (Anti-Logic Drift, testing, git hooks)
- Add or modify exercise content
- Debug FFI or WASM issues

## Tech Stack Reference

```yaml
Frontend:
  Framework: Fresh 2.2.0 (Deno SSR with Vite)
  UI Library: Preact 10.27.2+
  State Management: @preact/signals 2.5.0+
  Styling: Pure CSS (discord.css theme)

Backend:
  Runtime: Deno 2.6.9
  APIs: Fresh routes + API handlers

Native:
  Desktop Shell: Rust (tao 0.31 + wry 0.48) — FROZEN CORE
  Math Engine: Rust → WASM (wasm-bindgen)

Build Tools:
  - Vite 7.3.1 (dev server)
  - cargo (Rust builds)
  - wasm-pack (WASM compilation)
```

## Project Structure

```
sovereign-academy/
├── desktop/              # FROZEN CORE — Native frameless window
│   ├── src/main.rs      # Win32 FFI, WndProc, IPC handlers
│   └── Cargo.toml       # tao 0.31, wry 0.48
├── math-engine/         # Rust WASM math validator
│   ├── src/lib.rs       # Pure math functions (9 tests passing)
│   └── Cargo.toml       # wasm-bindgen
├── islands/             # Preact islands (client-side interactivity)
│   ├── TitleBar.tsx     # Frameless window controls
│   ├── Sidebar.tsx      # Topic navigation
│   └── MathStage.tsx    # Exercise UI + WASM integration
├── routes/              # Fresh routes (SSR)
│   ├── api/             # REST endpoints
│   │   ├── window/[action].ts  # Desktop IPC bridge
│   │   └── manifest.ts          # Exercise metadata
│   └── _middleware.ts   # Binary streaming for .bin files
├── lib/                 # Shared utilities
│   ├── exercise-loader.ts  # Binary parser + cache
│   └── wasm-loader.ts      # WASM initialization
├── static/
│   ├── discord.css      # Discord theme (dark mode, colors, typography)
│   ├── wasm/            # Compiled WASM binaries
│   └── exercises/       # Binary exercise files (.bin)
└── file.todo            # Implementation tracking (473 lines)
```

## Critical Rules

### FROZEN CORE Protection

⚠️ **NEVER modify `desktop/src/main.rs` without explicit user approval**

This file is audited, builds with 0 warnings, and handles:

- Win32 frameless window APIs (DwmExtendFrameIntoClientArea)
- Custom WndProc (WM_NCHITTEST for 8-direction resize)
- IPC message handling (minimize/maximize/close/resize)
- JS resize handle injection

**If user reports desktop window issue:**

1. Verify issue exists (ask for steps to reproduce)
2. Check if issue is in JS/CSS (islands/TitleBar.tsx, static/discord.css)
3. Only suggest Rust changes if JS/CSS exhausted
4. Require full regression test plan before any Rust edit

### Anti-Logic Drift Protocol

When modifying `math-engine/src/lib.rs`:

1. Run `cargo test` BEFORE making changes (establish baseline)
2. Make changes
3. Run `cargo test` AFTER (must still pass)
4. Run `deno task build:wasm`
5. Test in browser: Open DevTools → verify WASM loads and works

### Discord Theme Consistency

When adding/modifying UI:

- Use CSS custom properties from `discord.css` (e.g.,
  `var(--background-primary)`)
- Follow spacing: 8px grid system
- Use existing component patterns (see `islands/` for examples)
- Test in both windowed and fullscreen modes

## Common Workflows

### 1. Adding a New Island

```bash
# Create island file
touch islands/MyFeature.tsx

# Template structure:
import { signal } from '@preact/signals';

export default function MyFeature() {
  const state = signal(0);
  
  return (
    <div class="my-feature">
      {/* Discord-themed content */}
    </div>
  );
}

# Import in route
# routes/index.tsx: import MyFeature from '../islands/MyFeature.tsx';
```

### 2. Modifying WASM Math Engine

```bash
# 1. Edit Rust code
code math-engine/src/lib.rs

# 2. Run tests
cd math-engine
cargo test --verbose

# 3. Rebuild WASM
cd ..
deno task build:wasm

# 4. Dev server auto-reloads
# Test in browser at http://localhost:5173
```

### 3. Desktop Window Development

```bash
# Launch desktop app
deno task launch:desktop

# If locked (process still running):
powershell -c "Get-Process sovereign | Stop-Process -Force"
deno task build:desktop
deno task launch:desktop

# Watch desktop logs in terminal
# Rust panics/errors appear in console
```

### 4. Styling Changes

```bash
# Edit Discord theme
code static/discord.css

# Changes apply immediately (Vite HMR)
# No rebuild needed
```

### 5. Phase 6 Implementation (Pending)

```bash
# Phase 6.2: Anti-Logic Drift Tests
# - Create math-engine/tests/purity_test.rs
# - Create lib/wasm-health-check.ts
# - Create scripts/snapshot-*.ts

# Phase 6.3: Standard Tooling
deno install -A npm:vitest
deno install -A npm:@playwright/test

# Phase 6.5: Git Hooks
# - Create .git/hooks/pre-commit (ledger auto-update)
# - Create .git/hooks/pre-push (run verify task)
```

## Diagnostic Commands

### Check Overall Health

```bash
deno task check              # fmt + lint + type-check
cargo test --manifest-path=./math-engine/Cargo.toml
deno task build:wasm         # Verify WASM compiles
deno task build:desktop      # Verify desktop builds (Windows: .exe)
```

### Debug WASM Issues

```bash
# Browser DevTools Console:
# 1. Check if WASM loaded:
typeof check_answer  // should be "function"

# 2. Test validation:
check_answer("2+2", "4")  // should return JSON with "correct": true

# 3. Check initialization:
# MathStage island shows "WASM ✓" badge when loaded
```

### Debug Desktop Window Issues

```bash
# Check if desktop task exists:
deno task launch:desktop

# Verify Rust compiles:
cd desktop && cargo build --release

# Check for running processes:
powershell -c "Get-Process sovereign"

# View desktop/src/main.rs structure:
# Line ~40: mod win32 (FFI declarations)
# Line ~150: setup_frameless_window()
# Line ~200: custom_wndproc()
# Line ~350: UserEvent enum handlers
```

## Implementation Status (from file.todo)

✅ **Complete**:

- Phase 1: Environment (Deno, Rust, Fresh, FFI bridge)
- Phase 2: Binary Vault (streaming middleware, manifest API)
- Phase 3: WASM Integration (math engine, 9/9 tests passing)
- Phase 4: Discord Skinning (CSS theme, TitleBar, Sidebar, MathStage)
- Phase 6.1: Frozen Core Shell (desktop/src/main.rs, 0 warnings)

⏳ **Pending**:

- Phase 5: Exercise content generation (1,814 .bin files)
- Phase 6.2-6.8: Anti-Logic Drift tests, tooling, git hooks, CI/CD

❌ **Not Started**:

- Vitest unit tests
- Playwright E2E tests
- Pre-commit/pre-push git hooks
- GitHub Actions CI pipeline

## Troubleshooting Guide

### "Cannot find module" errors

- Check imports use `jsr:` prefix: `jsr:@fresh/core`, `jsr:@preact/signals`
- Verify deno.json has correct import map
- Run `deno cache --reload main.ts`

### WASM not loading in browser

- Check DevTools Network tab for 404 on `/wasm/math_validator_bg.wasm`
- Verify file exists: `ls static/wasm/`
- Rebuild: `deno task build:wasm`
- Check MathStage island initialization code

### Desktop window not appearing

- Check if process is already running: `powershell Get-Process sovereign`
- Kill existing: `powershell Stop-Process -Name sovereign -Force`
- Rebuild: `deno task build:desktop`
- Check terminal for Rust panic messages

### Styling not matching Discord theme

- Reference `static/discord.css` for color variables
- Use existing classes: `.channel-header`, `.message-container`, `.btn-primary`
- Check `.desktop-mode` class applied in desktop context
- Verify no inline styles overriding theme

### Cargo/Rust build errors

- Update Rust: `rustup update`
- Check Cargo.toml dependencies match: tao 0.31, wry 0.48, wasm-bindgen (latest)
- Clear target: `cargo clean && cargo build --release`

## Quick Reference

### Deno Tasks (deno.json)

```bash
dev              # Fresh dev server (port 5173)
build            # Production build
check            # fmt + lint + type-check
build:wasm       # math-engine → static/wasm/
build:desktop    # desktop → desktop/target/release/sovereign.exe
launch:desktop   # Run desktop app (--release mode)
```

### File Locations

- **Implementation Status**: `file.todo` (473 lines, phase tracking)
- **Discord Theme**: `static/discord.css` (~500 lines)
- **WASM Source**: `math-engine/src/lib.rs` (9 exported functions, 9 tests)
- **Desktop Shell**: `desktop/src/main.rs` (~520 lines, FROZEN)
- **Islands**: `islands/TitleBar.tsx`, `Sidebar.tsx`, `MathStage.tsx`

### Key Types & Interfaces

```typescript
// Exercise format (lib/exercise-loader.ts)
type ExerciseType = 'arithmetic' | 'equation' | 'fraction';
interface Exercise {
  type: ExerciseType;
  problem: string;
  answer: string;
  hint?: string;
}

// WASM API (math-engine/src/lib.rs)
check_answer(problem: string, answer: string): string  // returns JSON
validate_fraction(fraction: string): boolean
simplify_fraction(numerator: i32, denominator: i32): string
```

---

**Remember**: Always check `file.todo` for current phase status before starting
work. When in doubt about Frozen Core, ask user first.
