# Sovereign Academy — Complete Tutorial

From zero to running the app, understanding every layer of the project.

---

## Table of Contents

1. [What is this project?](#1-what-is-this-project)
2. [How it was built — the full story](#2-how-it-was-built--the-full-story)
3. [Prerequisites](#3-prerequisites)
4. [Getting the code running](#4-getting-the-code-running)
5. [Understanding the project structure](#5-understanding-the-project-structure)
6. [How each layer works](#6-how-each-layer-works)
7. [Daily development workflow](#7-daily-development-workflow)
8. [Running the tests](#8-running-the-tests)
9. [Making changes safely](#9-making-changes-safely)
10. [Tagging and releases](#10-tagging-and-releases)
11. [Common tasks reference](#11-common-tasks-reference)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. What is this project?

**Sovereign Academy** is a math learning desktop application styled like Discord.

- You see a sidebar of math topics (Counting, Addition, Fractions, etc.)
- You click a topic and get math exercises
- You type an answer and a Rust-powered WASM engine validates it instantly
- The app runs as a **native frameless desktop window** on Windows — not in a browser

The key ideas behind it:

| Idea                 | What it means                                                                          |
| -------------------- | -------------------------------------------------------------------------------------- |
| **Discord UI**       | Dark theme, channel-list sidebar, clean typography                                     |
| **Frozen Core**      | The native window code (Rust) is locked — never touch it unless there's a critical bug |
| **Anti-Logic Drift** | Math validation always uses Rust/WASM, never JavaScript arithmetic                     |
| **Deterministic**    | Same inputs always produce the same outputs, always — guaranteed by 31 Rust tests      |

---

## 2. How it was built — the full story

### Phase 1 — Environment Scaffolding

The project started with three separate concerns wired together:

**The Fresh web app** (`sovereign-academy/`) — a Deno/Preact SSR framework that
serves the UI at `http://localhost:5173`.

**The Rust native shell** (`desktop/`) — a small Rust program using `tao` (window
management) and `wry` (embedded WebView2) that creates a frameless Win32 window
and loads the Fresh server URL inside it. The user sees native window chrome,
but the content is the web app.

**The Rust WASM math engine** (`math-engine/`) — a Rust library compiled to
WebAssembly. It handles all arithmetic validation. JavaScript never does math.

At this stage:

- Deno 2.6.9 installed
- Rust 1.92.0 + `wasm-pack` installed
- Fresh project scaffolded
- FFI bridge `lib/native.ts` created (allows Deno to call native Rust functions)
- Window control API routes created (`POST /api/window/minimize` etc.)

### Phase 2 — Binary Vault Strategy

Exercises are stored as compact binary `.bin` files (not JSON). Each file
contains a type byte + length-prefixed UTF-8 strings for the problem and
expected answer.

A middleware (`routes/_middleware.ts`) intercepts `/exercises/*.bin` requests
and streams them efficiently. An exercise manifest API
(`routes/api/manifest.ts`) returns metadata for all 19 topics × 96 exercises = 1,814
exercise paths.

A demo exercise generator (`lib/exercise-loader.ts`) was built as a fallback —
since the real `.bin` files haven't been generated yet, it procedurally creates
exercises at runtime using a seeded PRNG (so the same topic always gives the
same exercises).

### Phase 3 — Rust WASM Integration

The math engine (`math-engine/src/lib.rs`) was written in Rust and compiled to
WASM via `wasm-pack`. It exposes these functions to JavaScript:

| Function                              | What it does                            |
| ------------------------------------- | --------------------------------------- |
| `validate_arithmetic(expr, answer)`   | Checks `2 + 3 = ?` style problems       |
| `validate_fraction(en, ed, sn, sd)`   | Cross-multiplication comparison         |
| `validate_equation(eq, value)`        | Substitutes variable and checks balance |
| `simplify_fraction(num, den)`         | Reduces to lowest terms                 |
| `check_answer(type, problem, answer)` | Main dispatcher — returns JSON result   |
| `batch_validate(problems, answers)`   | Bulk check for performance testing      |

Key detail: `validate_fraction` and `simplify_fraction` take **`i64`** in Rust,
which wasm-bindgen maps to JavaScript **`BigInt`** — not regular numbers. This
tripped us up when the health check originally passed `number` values instead of
`BigInt`, causing the "ERROR" you saw in the screenshot. Fixed in the bigint
migration.

### Phase 4 — Discord Skinning

The entire UI was styled to look like Discord:

- `static/discord.css` — ~450 lines of CSS variables, transitions, scrollbars,
  channel list styles, the exercise card, input states, and streak animations
- `islands/TitleBar.tsx` — draggable custom title bar with minimize/maximize/close
  buttons (the OS chrome is hidden)
- `islands/Sidebar.tsx` — 19 math topics rendered as Discord-style channels with
  progress badges
- `islands/MathStage.tsx` — the exercise view: problem display, answer input,
  Check/Skip buttons, result feedback, streak counter, auto-advance

State is managed entirely with **Preact Signals** in `lib/state.ts`. There is
no `useState` anywhere in the codebase.

### Phase 5 — Quality Gate (partial)

Rust tests were written and pass (9 unit tests in `math-engine/src/lib.rs`).
The exercise binary generator was built. Full Deno/Vitest testing was deferred
to Phase 6.

### Phase 6 — Frozen Core + Anti-Logic Drift (current state)

This was the largest phase. Six sub-phases:

**6.1 Frozen Core** — desktop/ audited, documented, declared off-limits.

**6.2 Anti-Logic Drift** — 22 purity tests added to Rust
(`math-engine/tests/purity_test.rs`). A WASM health check runs on every app
startup: 10 checks including basic arithmetic, fraction comparison, and JSON
result format. If any fail, a warning banner appears and exercises are still
served (but with a warning — see the orange banner in the screenshot we fixed).
Golden snapshots committed to `tests/golden/` as regression baselines.

**6.3 Standard Tooling** — Vitest 4.0.18 for unit tests, Playwright 1.58.2 for
E2E. `deno task verify` runs everything in sequence and is the single
truth gate.

**6.4 Institutional Memory** — `.editorconfig`, `.gitattributes`,
`.github/copilot-instructions.md`, `.vscode/skills/` — all the documentation
that prevents future developers (or AI) from breaking established patterns.

**6.5/6.6 Git Workflow** — pre-push hook auto-runs `deno task verify` and
blocks broken commits. GitHub Actions CI mirrors this. A bisect script
(`scripts/bisect-verify.ts`) enables `git bisect run deno task bisect:verify`
for automated regression hunting.

**6.7 Migration & Clean Up** — business logic extracted from islands into pure
functions in `lib/`. Dead scaffold code deleted. `MathStage.tsx` became a thin
view layer.

**Current baseline: tag `v0.6.0`, commit `db10e78`.**

---

## 3. Prerequisites

Install these before anything else.

### Deno

```bash
# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Verify
deno --version
# deno 2.6.9
```

### Rust + Cargo

```bash
# Windows — download rustup-init.exe from https://rustup.rs
# Then in a terminal:
rustup --version
cargo --version
# cargo 1.92.0
```

### wasm-pack

```bash
cargo install wasm-pack
wasm-pack --version
# wasm-pack 0.13.x
```

### Node.js (only for npx vitest / npx playwright)

Node is required for the npm-based test runners. Deno handles everything else.

```bash
node --version
# v22.x or later
```

### Windows-specific: WebView2

The desktop app uses Microsoft WebView2 (Edge-based). It is pre-installed on
Windows 10/11. If your machine somehow doesn't have it:

- Download from: https://developer.microsoft.com/microsoft-edge/webview2/

---

## 4. Getting the code running

### Clone the repo

```bash
git clone <repo-url>
cd sovereign-academy
```

### Install Deno dependencies

```bash
deno install
```

This reads `deno.json` and installs all imports from npm/jsr into
`node_modules/` (in `manual` mode, so Deno controls the layout).

### Mode A — Browser mode (fastest to start)

```bash
deno task dev
```

Opens `http://localhost:5173` in your browser. The Fresh + Vite dev server runs
with hot module replacement. The native window/maximize/minimize buttons will
not work in this mode (they need the desktop shell).

### Mode B — Desktop mode (full experience)

```bash
deno task launch:desktop
```

This compiles the Rust desktop shell (`desktop/`) with `cargo run --release`,
which:

1. Starts the Fresh dev server (`deno task dev`) automatically
2. Waits for the server to be ready on port 5173
3. Opens a frameless native Win32 window loading `http://localhost:5173`

You get the Discord UI inside a native window. TitleBar drag, resize handles,
and window controls all work.

> **First build is slow** (2–5 minutes) because Cargo compiles the Rust
> dependencies from scratch. Subsequent runs take ~0.4 seconds (cached).

### Verify everything works

```bash
deno task verify
```

Expected output:

```
Checked 50 files       ← deno fmt passes
Checked 29 files       ← deno lint passes
Checked 32 modules     ← deno check passes
test result: ok. 9 passed  ← Rust unit tests
test result: ok. 22 passed ← Rust purity tests
Tests  62 passed (62)  ← Vitest unit tests
✅ All golden snapshots present and accounted for.
```

---

## 5. Understanding the project structure

```
sovereign-academy/
│
├── desktop/                 ← FROZEN CORE (Rust native shell)
│   ├── src/main.rs          ← Win32 + WebView2 + tao/wry
│   └── Cargo.toml
│
├── math-engine/             ← Rust WASM math validator
│   ├── src/lib.rs           ← validate_arithmetic, check_answer, etc.
│   ├── tests/purity_test.rs ← 22 anti-regression purity tests
│   └── Cargo.toml
│
├── lib/                     ← Business logic (pure TypeScript)
│   ├── types.ts             ← MathWasm interface (single source of truth)
│   ├── state.ts             ← Preact Signals: topics, exercises, progress
│   ├── exercise-loader.ts   ← Binary .bin parser + demo generator (seeded PRNG)
│   ├── native.ts            ← Deno FFI bridge to Rust native library
│   ├── validation.ts        ← validateAnswer() + validateFallback()
│   ├── wasm-loader.ts       ← WASM init (fetch + blob URL + health check)
│   └── wasm-health-check.ts ← 10 startup checks on the loaded WASM module
│
├── islands/                 ← Preact islands (thin view layer — render + events only)
│   ├── TitleBar.tsx         ← Custom draggable title bar
│   ├── Sidebar.tsx          ← Math topic channel list
│   └── MathStage.tsx        ← Exercise card + answer input + validation UI
│
├── routes/                  ← Fresh SSR routes
│   ├── _app.tsx             ← HTML shell (loads discord.css)
│   ├── _404.tsx             ← 404 page
│   ├── index.tsx            ← Main layout (assembles islands)
│   └── api/
│       ├── manifest.ts      ← GET /api/manifest → exercise topic list
│       └── window/[action].ts ← POST /api/window/minimize|maximize|close
│
├── static/
│   ├── discord.css          ← Complete Discord dark theme
│   └── wasm/
│       ├── math_validator.js      ← WASM JS glue (generated)
│       ├── math_validator.d.ts    ← TypeScript declarations (generated)
│       └── math_validator_bg.wasm ← Compiled Rust (generated)
│
├── scripts/                 ← Dev + CI utilities
│   ├── snapshot-physics.ts  ← Generates tests/golden/physics.txt
│   ├── snapshot-ui.ts       ← Generates tests/golden/ui-*.html
│   ├── snapshot-state.ts    ← Generates tests/golden/state-flow.log
│   ├── verify-snapshots.ts  ← Checks golden files exist (CI gate)
│   └── bisect-verify.ts     ← Git bisect runner (exit 0/1/125)
│
├── tests/
│   ├── golden/              ← Committed baseline snapshots
│   │   ├── physics.txt      ← 50 math results (WASM baseline)
│   │   ├── state-flow.log   ← Event sequence baseline
│   │   └── ui-*.html        ← Component render baselines
│   └── e2e/
│       ├── navigation.spec.ts     ← Playwright: topic switching
│       └── math-validation.spec.ts ← Playwright: submit answer flow
│
├── docs/
│   ├── GIT_BISECT_GUIDE.md  ← How to find regressions with git bisect
│   └── TAGGING_STRATEGY.md  ← Semantic versioning convention
│
├── deno.json                ← All tasks + imports + lint/fmt config
├── vite.config.ts           ← Vite bundler config (Fresh plugin)
├── vitest.config.ts         ← Vitest test runner config
├── playwright.config.ts     ← Playwright E2E config
├── .editorconfig            ← Editor formatting rules
├── .gitattributes           ← Line ending + binary file rules
└── CHANGELOG.md             ← What changed in each phase
```

---

## 6. How each layer works

### Layer 1 — The WASM math engine

**Files:** `math-engine/src/lib.rs`, `static/wasm/`

The Rust code compiles to WASM via:

```bash
deno task build:wasm
# → cd math-engine && wasm-pack build --target web --out-dir ../static/wasm
```

The output files in `static/wasm/` are pre-compiled and committed to git — you
do NOT need to rebuild WASM unless you change `lib.rs`.

When the app loads, `lib/wasm-loader.ts` fetches `math_validator.js` and
`math_validator_bg.wasm` from the server and initializes the module. Then the
10-check health check runs. If all checks pass, the WASM badge in the top-right
header turns green.

**Important:** `validate_fraction` and `simplify_fraction` take **BigInt** arguments
in JavaScript because Rust `i64` maps to JS `BigInt` via wasm-bindgen.

### Layer 2 — Global state (Preact Signals)

**File:** `lib/state.ts`

Everything reactive lives here as signals. There is no `useState`, `useReducer`,
or Redux anywhere.

```typescript
import { activeTopic, currentExercise, lastResult } from "@/lib/state.ts";

// Read a signal value
console.log(activeTopic.value); // 1

// Write a signal value — all subscribers update automatically
activeTopic.value = 3; // switches to Multiplication topic
```

Key signals:

| Signal            | Type                       | What it holds                   |
| ----------------- | -------------------------- | ------------------------------- |
| `activeTopic`     | `number`                   | Selected topic ID (1–19)        |
| `activeTopicData` | `Topic` (computed)         | The full Topic object           |
| `currentExercise` | `Exercise \| null`         | Exercise being shown            |
| `exerciseIndex`   | `number`                   | Position in the topic (0-based) |
| `studentAnswer`   | `string`                   | What the student has typed      |
| `lastResult`      | `ValidationResult \| null` | Result of last Check click      |
| `progress`        | `Map<topicId, count>`      | Per-topic completed count       |
| `totalCompleted`  | `number` (computed)        | Sum of all progress             |

### Layer 3 — Exercise loading

**File:** `lib/exercise-loader.ts`

When you click a topic in the sidebar, `selectTopic(id)` in `state.ts` is called.
`MathStage.tsx` listens to `activeTopic` and calls `loadExercise(topicId, index)`.

`loadExercise` tries to:

1. Fetch `/exercises/{topicId}-{index}.bin` from the server
2. Parse the binary format (1 type byte + 2 length-prefixed UTF-8 fields)
3. If the file doesn't exist (most cases right now), fall back to `generateDemoExercise(topicId, index)`

The demo generator uses a **seeded** PRNG (`mulberry32`) so it's deterministic:

```
generateDemoExercise(topicId=1, exerciseIdx=0)
// always returns the same exercise for Counting topic, exercise 0
// seed = 1 * 10_000 + 0 = 10_000
```

### Layer 4 — Answer validation

**File:** `lib/validation.ts`

When you click "Check", `MathStage.tsx` calls:

```typescript
const result = validateAnswer(wasmModule.value, exercise, studentAnswer.value);
```

`validateAnswer()` dispatcher:

- **If WASM is loaded:** calls `wasm.check_answer(type, problem, answer)` → parses JSON → returns `ValidationResult`
- **If WASM failed to load:** falls back to `validateFallback()` which does exact string comparison

The WASM path handles fractional equivalence, number parsing, and full hint
generation. The fallback is a safety net for dev environments.

### Layer 5 — The islands (view layer only)

**Files:** `islands/TitleBar.tsx`, `islands/Sidebar.tsx`, `islands/MathStage.tsx`

These are Preact components that **only render and handle events**. No business
logic lives here. They read signals and call lib/ functions.

```
User clicks topic in Sidebar
  → Sidebar calls selectTopic(id)         ← state.ts action
  → activeTopic.value changes             ← signal write
  → MathStage sees signal change          ← automatic subscription
  → MathStage calls loadExercise(...)     ← exercise-loader.ts
  → currentExercise.value changes         ← signal write
  → MathStage re-renders with new problem ← automatic UI update
```

### Layer 6 — The desktop shell (FROZEN CORE)

**Files:** `desktop/src/main.rs`

This Rust program:

1. Starts the Fresh dev server as a child process
2. Polls `http://localhost:5173` until it responds
3. Creates a Win32 frameless window using `tao`
4. Embeds a WebView2 browser using `wry`
5. Loads the Fresh server URL in the WebView
6. Handles window messages (`WM_NCHITTEST`) for 8-direction resize and drag

**Do not modify this code** unless there is a critical Rust bug. It is marked
FROZEN CORE.

---

## 7. Daily development workflow

### Starting work

```bash
cd sovereign-academy

# Option A: browser-only dev (faster iteration)
deno task dev
# → http://localhost:5173

# Option B: full desktop experience
deno task launch:desktop
```

### Editing UI code

Edit any file in `islands/`, `routes/`, `lib/`, or `static/discord.css`.
Vite's hot module replacement updates the browser or WebView instantly —
**no reload needed** for most changes.

### Editing the math engine

If you change `math-engine/src/lib.rs`:

```bash
# Rebuild WASM
deno task build:wasm

# Re-run Rust tests
deno task test:rust

# Then regenerate the golden physics snapshot (since math results may differ)
deno task snapshot:physics
```

### Before committing

```bash
deno task verify
```

This is also run automatically by the pre-push git hook. If it fails, your push
is blocked.

---

## 8. Running the tests

### All tests

```bash
deno task verify
```

### Rust tests only (math engine)

```bash
deno task test:rust
# Runs: 9 unit tests + 22 purity tests = 31 total
```

The purity tests verify determinism — each function is called 100 times with the
same input and must return the same output every time.

### Vitest unit tests (TypeScript)

```bash
deno task test:unit
# 62 tests across 4 files:
#   lib/state.test.ts          (22 tests — signals, selectTopic, markCompleted)
#   lib/exercise-loader.test.ts (17 tests — binary parse, demo generator, PRNG)
#   lib/wasm-health-check.test.ts (11 tests — health check with mock WASM)
#   lib/validation.test.ts     (12 tests — validateAnswer, validateFallback)
```

### Playwright E2E tests

```bash
# Requires the dev server running first
deno task dev &

deno task test:e2e
# 11 tests across 2 specs
```

### Regenerate golden snapshots

Run this if you intentionally changed math engine output, component HTML, or
state flow:

```bash
deno task snapshot:all
# Regenerates tests/golden/ — commit the changes after reviewing them
```

---

## 9. Making changes safely

### Rule 1 — Never touch `desktop/`

`desktop/src/main.rs` is FROZEN CORE. The Win32/WebView2/tao/wry code is complex
and has no automated tests (it's a Rust GUI app). If it ain't broke, don't fix it.

### Rule 2 — Never do math in TypeScript

All arithmetic validation must go through the WASM engine. Never write:

```typescript
// ❌ WRONG — JavaScript arithmetic is not the source of truth
const correct = parseInt(answer) === eval(problem);

// ✅ CORRECT — Rust engine validates
const result = validateAnswer(wasmModule.value, exercise, answer);
```

The WASM purity tests will catch drift. The health check will surface it at
runtime.

### Rule 3 — Run verify before pushing

```bash
deno task verify
# All green? Good to push.
```

The pre-push hook enforces this automatically, but running it manually gives you
faster feedback.

### Rule 4 — Keep islands thin

Islands are view-only. If you find yourself writing calculation logic in
`MathStage.tsx`, move it to `lib/` as a pure function and write a unit test for it.

### Rule 5 — Use signals, not useState

```typescript
// ❌ Don't
const [answer, setAnswer] = useState("");

// ✅ Do
import { studentAnswer } from "@/lib/state.ts";
// use studentAnswer.value to read, studentAnswer.value = ... to write
```

---

## 10. Tagging and releases

See [TAGGING_STRATEGY.md](TAGGING_STRATEGY.md) for the full convention. Short version:

```bash
# After a phase is complete and verify passes:
git tag -a v0.X.Y -m "Short description"

# Future milestones:
# v0.7.0 — exercise .bin files generated
# v0.8.0 — progress persistence
# v1.0.0 — production installer
```

Current tags:

- `v1.0-frozen-core` — initial commit (desktop/ audited)
- `v0.6.0` — Phase 6 complete (current stable baseline)

---

## 11. Common tasks reference

| Goal                     | Command                                  |
| ------------------------ | ---------------------------------------- |
| Start browser dev server | `deno task dev`                          |
| Launch desktop app       | `deno task launch:desktop`               |
| Run all quality checks   | `deno task verify`                       |
| Run Rust tests only      | `deno task test:rust`                    |
| Run Vitest tests only    | `deno task test:unit`                    |
| Run E2E tests            | `deno task test:e2e`                     |
| Format code              | `deno fmt .`                             |
| Lint code                | `deno lint .`                            |
| Type-check               | `deno check`                             |
| Rebuild WASM             | `deno task build:wasm`                   |
| Regenerate snapshots     | `deno task snapshot:all`                 |
| Build desktop exe        | `deno task build:desktop`                |
| Build production bundle  | `deno task build`                        |
| Run git bisect           | `git bisect run deno task bisect:verify` |

---

## 12. Troubleshooting

### "Port 5173 is in use" on `launch:desktop`

The desktop launcher looks for port 5173 but falls back to 5174, 5175, etc. This
is fine — the desktop shell auto-detects the actual port.

If you want to clean up stray servers:

```bash
# Find what's using 5173
netstat -ano | findstr :5173

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### "WASM Health Check Failed" banner

This means two fraction tests failed. Likely cause: you rebuilt WASM but the old
`.js` glue file in `static/wasm/` is stale.

```bash
deno task build:wasm
# Then reload the app
```

If the banner still appears and shows `got ERROR`, verify you are passing `BigInt`
values to `validate_fraction` and `simplify_fraction`, not regular numbers.

### `deno task verify` fails on `deno fmt --check`

```bash
deno fmt .
# Then re-run verify
```

### Rust won't compile — `cargo: command not found`

Rust is not in your PATH. Close and reopen your terminal after installing from
rustup.rs.

### Desktop window doesn't open — `cargo run` hangs

First run installs and compiles all Cargo dependencies (~150 crates). On a slow
machine this can take 5–10 minutes. Let it run. Subsequent runs take under 1
second.

### `npx vitest` fails — `Cannot find module`

```bash
# Re-install npm packages
deno install
```

### Golden snapshot mismatch in CI

If you intentionally changed component HTML or math engine output:

```bash
deno task snapshot:all
git add tests/golden/
git commit -m "chore: update golden snapshots"
```

If it was unexpected, use `git diff tests/golden/` to see what changed and trace
the cause.

---

_Last updated: 2026-02-18 | Tag: v0.6.0_
