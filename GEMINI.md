# Sovereign Academy - Project Context

**Sovereign Academy** is a specialized math learning platform designed with a Discord-inspired UI. It features a high-performance Rust-based math engine (WASM) and a native desktop shell (Rust tao/wry).

## Core Architecture

- **Web App**: Fresh 2.2.0 (Deno) + Preact + Signals.
- **Desktop Shell**: Rust (tao 0.31 + wry 0.48). **FROZEN CORE**.
- **Math Engine**: Rust compiled to WASM. Deterministic logic.
- **State Management**: Zero `useState` policy. Pure `@preact/signals`.

## Institutional Memory

- **Frozen Core**: `desktop/src/main.rs` matches Win32 frameless specifications and is audited. No modifications without a full regression test plan.
- **Anti-Logic Drift**: Every physics/math change must be verified against `tests/golden/` snapshots and pass `cargo test` + `vitest`.
- **Identity**: Dark mode Discord aesthetics. High-density, interactive educational content.
- **Planning**: `file.todo` is the single source of truth for project roadmap, task tracking, and implementation planning.

## Skills

- `skills/sovereign-core/SKILL.md`: Core development in Fresh/Preact/Rust.
- `skills/fresh-v2/SKILL.md`: Deep technical knowledge for Deno Fresh 2.x.
- `skills/anti-logic-drift/SKILL.md`: Quality gates, snapshots, and bisection.

## Workflows

- `.agent/workflows/sovereign-development.md`: Integrated development and verification workflow.
