---
name: sovereign-core
description: Core development in Fresh, Preact, and Rust for Sovereign Academy
---

# Sovereign Core Development SKILL

## Domain

Fresh 2.2.0, Deno SSR, Preact Signals, Rust (WASM/Native), Discord UI Styling.

## Capability

This skill enables the agent to:

- Build and debug **Fresh 2.2.0 Islands** using Preact and `@preact/signals`.
- Manage the **Frozen Core** desktop shell IPC and layout (read-only by default).
- Integrate **Rust Math Engine** functionality via WASM.
- Maintain **Discord-quality UI** using standard CSS custom properties.

## Rules

1. **Zero useState**: Always use `@preact/signals` for state management.
2. **Deterministic WASM**: Math engine functions must have no I/O or side effects.
3. **Pure Logic**: Extract business logic into `lib/` as pure functions for testability.
4. **Frozen Shell**: Respect the sanctity of `desktop/src/main.rs`.

## Usage

- Run `deno task dev` for web development.
- Run `deno task launch:desktop` for native testing.
- Refer to `static/discord.css` for theme tokens.
