---
description: development workflow for Sovereign Academy project
---

# Sovereign Academy Development Workflow

This workflow covers the core development practices for Sovereign Academy, synthesizing rules for Fresh, Preact, Rust, and Desktop integration.

## 1. Environment Check

Ensure the following tools are available:

- Deno 2.6.9+
- Rust 1.92.0+
- wasm-pack

## 2. Desktop Shell (FROZEN CORE)

// turbo
The shell in `desktop/src/main.rs` is **FROZEN**. DO NOT MODIFY without explicit approval.

- To launch: `deno task launch:desktop`
- This spawns the Fresh dev server and opens a frameless Wry window.

## 3. Fresh 2.2.0 & Preact Signals

- **Framework Patterns**: Follow the detailed guides in `skills/fresh-v2/SKILL.md`.
- All UI state MUST use `@preact/signals`. **Zero `useState` policy.**
- Global state: `lib/state.ts`
- Local state: `useSignal()` in islands.
- Components live in `islands/`.

## 4. Math Engine (Rust/WASM)

- Math logic lives in `math-engine/src/lib.rs`.
- All functions must be **deterministic** (no I/O, no timestamps).
- Compile via: `deno task build:wasm`.
- Tests: `deno task test:rust`.

## 5. Styling

- Use Discord theme variables in `static/discord.css`.
- Classes follow Discord's naming conventions (e.g., `#1e1f22` background).

## 6. Verification Pipeline

// turbo
Run the full verification battery before any major changes or push:
`deno task verify`

This includes:

- `deno fmt` & `deno lint`
- `deno check`
- `cargo test` (Math Engine)
- `vitest` (Unit tests)
- `verify-snapshots.ts` (Golden snapshots)

## 7. Regression Detection

If a regression is found, use the automated bisect tool:
// turbo
`git bisect run deno task bisect:verify`
