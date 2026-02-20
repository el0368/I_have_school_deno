# Frozen Files Ledger

Files listed in `ledger.json` are **sealed** — their SHA-256 hash is recorded
and verified every time `deno task verify` or `deno task ledger:verify` runs.
Any accidental edit immediately fails the build.

## Commands

| Action | Command |
|---|---|
| Seal a file (first time or after intentional edit) | `deno task ledger:seal <path>` |
| Verify all frozen files | `deno task ledger:verify` |
| Full quality gate (includes ledger check) | `deno task verify` |

## How to Seal a File

```sh
# Example: freeze layout.css once the layout is finalised
deno task ledger:seal static/css/layout.css
```

The script adds an entry in `ledger.json` with the current SHA-256 hash and today's date.
Commit both the edited file and the updated `ledger.json` together.

## How to Intentionally Change a Frozen File

1. Edit the file.
2. Re-seal it: `deno task ledger:seal <path>`
3. Commit both the file change and the updated `ledger.json`.

This is a **conscious, auditable act** — not an accident.

## Currently Frozen Files

See [`ledger.json`](./ledger.json) for the live list and hashes.

## Freeze Criteria

A file is ready to be frozen when:
- [ ] It passes `deno task verify`
- [ ] It has been visually confirmed in `deno task desktop`
- [ ] No TODOs or open issues reference it
- [ ] A teammate (or the AI) has reviewed it in this session
