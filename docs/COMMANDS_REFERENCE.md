# Sovereign Academy — Commands Reference

All available commands in the Sovereign Academy project. Run with `deno task <command>` or `npm run <command>` as noted.

---

## Development

### `deno task dev`

Start the Fresh development server with Vite HMR (Hot Module Reloading).

- Runs on `http://localhost:5173`
- Auto-reloads on source changes
- Use for interactive development

### `deno task build`

Build the Fresh app for production.

- Compiles TypeScript
- Bundles JavaScript and CSS
- Outputs to `_fresh/`

### `deno task build:all`

Build WASM + Fresh production bundle.

- Runs `deno task build:wasm` then `deno task build`
- Use when making math-engine changes

### `deno task start`

Serve the production build locally.

- Loads pre-built files from `_fresh/`
- Requires `deno task build` to have run first

---

## Desktop Application

### `deno task desktop`

Alias for `launch:desktop`. Build and run the native Rust desktop shell.

- Compiles + launches the Rust frameless window
- Embeds the web view inside
- For testing native window features (drag, resize, IPC)
- First run takes ~2–3 minutes (Rust compile), subsequent runs are cached

### `deno task build:desktop`

Compile the native desktop shell to a release binary only (no launch).

- Compiles Rust code in `desktop/`
- Outputs optimized `.exe` in `desktop/target/release/`
- Takes ~2–3 minutes
- Use this if you want to build without launching

### `deno task launch:desktop`

Same as `deno task desktop`.

---

## Code Quality

### `deno task check`

Run formatters and linters.

- `deno fmt --check .` — check formatting without modifying
- `deno lint .` — static analysis
- `deno check` — type checking

### `deno task biome:check`

Check code with Biome linter (alternative to Deno lint).

- Reads `biome.json` config
- Useful for lint rules Deno doesn't cover

### `deno task biome:fix`

Auto-fix Biome linter issues.

- Modifies files in place
- Fixes formatting, unused imports, etc.

### `deno task verify`

Full verification pipeline (required before committing).

- `deno task check` — format + lint + type check
- `deno task test:rust` — run Rust tests
- `deno task test:unit` — run Vitest unit tests
- `deno run --allow-read scripts/verify-snapshots.ts` — compare golden snapshots
- **Fails if any step fails.** Must pass before pushing.

---

## Testing

### `deno task test`

Run all tests (Rust + Vitest).

- Runs `deno task test:rust` then `deno task test:unit`
- Does not run E2E tests

### `deno task test:rust`

Run Rust tests (math-engine).

- `cd math-engine && cargo test`
- 9 unit tests + 22 purity tests = 31 total
- Confirms math logic is deterministic and correct

### `deno task test:unit`

Run Vitest unit tests.

- `npx vitest run --config vitest.config.ts`
- ~62 tests across 4 files
- Tests lib/ modules, validation, state, etc.

### `deno task test:e2e`

Run Playwright end-to-end tests.

- `npx playwright test`
- Launches a real browser and simulates user clicks
- 11 tests across 2 spec files
- Used for regression testing the UI

---

## WASM: Math Engine

### `deno task build:wasm`

Compile Rust math engine to WebAssembly.

- `cd math-engine && wasm-pack build --target web --out-dir ../static/wasm`
- Outputs `math_validator.js`, `math_validator_bg.wasm`, `.d.ts` files
- Run after modifying `math-engine/src/lib.rs`

---

## Golden Snapshots (Regression Detection)

Snapshots capture expected output and compare against current output. If a
snapshot changes unexpectedly, a regression is detected.

### `deno task snapshot:ui`

Render all islands to HTML and save as golden snapshots.

- Outputs to `tests/golden/ui-*.html`
- Run after changing UI components

### `deno task snapshot:physics`

Generate physics calculation golden snapshots.

- Outputs to `tests/golden/physics.txt`
- Validates physics engine determinism

### `deno task snapshot:state`

Capture state machine transitions as golden snapshots.

- Outputs to `tests/golden/state-flow.log`
- Logs all signal changes during a typical user flow

### `deno task snapshot:all`

Generate all snapshots at once.

- Runs all three snapshot tasks
- Use after major refactors or when golden snapshots are stale

---

## Git & CI

### `deno task bisect:verify`

Used by `git bisect run` to test every commit.

- Runs the full `deno task verify` pipeline
- Exits 0 (good) / 1 (bad) / 125 (skip)
- Enables automated regression detection

**Usage:**

```bash
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
git bisect run deno task bisect:verify
git bisect reset
```

---

## Maintenance & Updates

### `deno task update`

Update Fresh framework to the latest version.

- `deno run -A -r jsr:@fresh/update .`
- Modifies `deno.json` and source files as needed
- Use cautiously — may introduce breaking changes

---

## Summary by Use Case

| Goal                 | Command                                  |
| -------------------- | ---------------------------------------- |
| Start coding         | `deno task dev`                          |
| Check code quality   | `deno task check`                        |
| Run all tests        | `deno task verify`                       |
| Build for production | `deno task build:all`                    |
| Launch native app    | `deno task launch:desktop`               |
| Update snapshots     | `deno task snapshot:all`                 |
| Find breaking commit | `git bisect run deno task bisect:verify` |
| Fix lint issues      | `deno task biome:fix`                    |

---

## Notes

- **Before committing:** Run `deno task verify` — it must pass.
- **Before pushing:** Ensure `git push` runs the pre-push hook, which also runs
  `deno task verify`.
- **WASM changes:** Always run `deno task build:wasm` before testing math
  validation.
- **Snapshot changes:** Changes to snapshots are tracked in git. Review them
  carefully in your commit.

See [docs/GIT_BISECT_GUIDE.md](GIT_BISECT_GUIDE.md) for advanced git bisect
workflows.
