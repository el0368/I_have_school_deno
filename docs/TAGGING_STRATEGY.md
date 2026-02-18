# Sovereign Academy — Git Tagging Strategy

## Tag Format

```
v<MAJOR>.<MINOR>.<PATCH>
```

| Segment   | Bump when…                                                                   |
| --------- | ---------------------------------------------------------------------------- |
| **MAJOR** | Breaking change to desktop/ Frozen Core, WASM ABI, or exercise binary format |
| **MINOR** | Phase complete, new feature shipped, new topic added                         |
| **PATCH** | Bug fix, test addition, documentation update, refactor                       |

Examples:

- `v0.6.0` — Phase 6 complete
- `v0.6.1` — WASM bigint fix (what we just fixed)
- `v0.7.0` — Phase 7 complete (exercise .bin generation)
- `v1.0.0` — Production-ready: all 1,814 exercises generated, installer built

---

## When to Tag

| Trigger                     | Tag?                      | Example                |
| --------------------------- | ------------------------- | ---------------------- |
| Phase complete              | ✅ MINOR bump             | `v0.7.0` after Phase 7 |
| deno task verify 100% green | ✅ at phase boundaries    | —                      |
| Bug fix only                | ✅ PATCH bump             | `v0.6.1`               |
| WIP / mid-phase             | ❌ no tag                 | use branches instead   |
| Broken build                | ❌ never tag broken state | fix first, then tag    |

---

## How to Tag

Always create **annotated** tags (not lightweight) so the message is preserved.

```bash
# 1. Make sure verify passes
deno task verify

# 2. Create annotated tag
git tag -a v0.X.Y -m "v0.X.Y — Short summary

What changed:
- ...

Known limitations:
- ..."

# 3. Push tag
git push origin v0.X.Y

# 4. Push branch
git push origin main
```

---

## Existing Tags

| Tag                | Commit    | Description                                   |
| ------------------ | --------- | --------------------------------------------- |
| `v1.0-frozen-core` | `092a2e0` | Initial commit — Frozen Core audited          |
| `v0.6.0`           | `db10e78` | Phase 6 complete — Anti-Logic Drift + Tooling |

---

## Git Bisect with Tags

Tags make bisecting much faster:

```bash
# Something broke after Phase 6?
git bisect start
git bisect bad HEAD
git bisect good v0.6.0          # last known good tag
git bisect run deno task bisect:verify
```

See [GIT_BISECT_GUIDE.md](GIT_BISECT_GUIDE.md) for the full workflow.

---

## Future Milestones

| Tag      | Phase      | Goal                                         |
| -------- | ---------- | -------------------------------------------- |
| `v0.7.0` | Phase 7    | Exercise .bin generation (all 1,814 files)   |
| `v0.8.0` | Phase 8    | Progress persistence (localStorage / server) |
| `v0.9.0` | Phase 9    | Cross-platform build (macOS + Linux)         |
| `v1.0.0` | Production | Installer, all exercises, stable API         |
