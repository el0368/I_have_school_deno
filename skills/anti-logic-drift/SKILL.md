---
name: anti-logic-drift
description: Quality assurance and regression protection for Sovereign Academy
---

# Anti-Logic Drift SKILL

## Domain

Automated Testing, Golden Snapshots, Git Bisect, Performance Profiling.

## Capability

This skill enables the agent to:

- Generate and verify **Golden Master Snapshots** (`tests/golden/`).
- Execute the **full verification pipeline** via `deno task verify`.
- Perform **Automated Regression Bisection** using `git bisect`.
- Validate **WASM Health Checks** and Purity.

## Rules

1. **No Circular Regression**: Bugs must have a regression test before being fixed.
2. **Human-Readable Snapshots**: Snapshots must be verifiable by eye in `tests/golden/`.
3. **Zero Warnings**: Verifications must pass with 0 warnings/errors.
4. **Deterministic Only**: No timestamps or random data allowed in snapshots.

## Usage

- Run `deno task verify` as the primary quality gate.
- Use `deno task bisect:verify` for finding breaking commits.
- Check `file.todo` and `task.md` for current implementation gaps.
