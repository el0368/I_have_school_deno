// @ts-nocheck
/**
 * verify-ledger.ts — Frozen File Ledger
 *
 * SEAL a file (adds/updates its hash in ledger.json):
 *   deno task ledger:seal static/css/layout.css
 *
 * VERIFY all frozen files (fails if any hash doesn't match):
 *   deno task ledger:verify
 *
 * WHY: Once a file is sealed, any accidental edit is caught immediately
 * by deno task verify — no more silent layout regressions.
 */

const LEDGER_PATH = "ledger.json";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashFile(path) {
    const bytes = await Deno.readFile(path);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const arr = Array.from(new Uint8Array(digest));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readLedger() {
    try {
        const raw = await Deno.readTextFile(LEDGER_PATH);
        return JSON.parse(raw);
    } catch {
        console.error(`❌ Ledger: Cannot read ${LEDGER_PATH}`);
        Deno.exit(1);
    }
}

async function writeLedger(ledger) {
    await Deno.writeTextFile(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n");
}

// ─── Seal mode ────────────────────────────────────────────────────────────────

async function seal(targetPath) {
    let hash;
    try {
        hash = await hashFile(targetPath);
    } catch {
        console.error(`❌ Ledger seal: Cannot read file "${targetPath}"`);
        Deno.exit(1);
    }

    const ledger = await readLedger();
    const existing = ledger.frozen.find((e) => e.path === targetPath);

    if (existing) {
        const old = existing.sha256;
        existing.sha256 = hash;
        existing.frozenAt = new Date().toISOString().slice(0, 10);
        console.log(`🔄 Re-sealed: ${targetPath}`);
        console.log(`   old hash: ${old}`);
        console.log(`   new hash: ${hash}`);
    } else {
        ledger.frozen.push({
            path: targetPath,
            sha256: hash,
            frozenAt: new Date().toISOString().slice(0, 10),
        });
        console.log(`🔒 Sealed:   ${targetPath}`);
        console.log(`   hash:     ${hash}`);
    }

    await writeLedger(ledger);
    console.log(`✅ ledger.json updated.`);
}

// ─── Verify mode ──────────────────────────────────────────────────────────────

async function verify() {
    const ledger = await readLedger();

    if (ledger.frozen.length === 0) {
        console.log("ℹ️  Ledger: No frozen files registered yet.");
        Deno.exit(0);
    }

    let failures = 0;

    for (const entry of ledger.frozen) {
        let actual;
        try {
            actual = await hashFile(entry.path);
        } catch {
            console.error(`❌ LEDGER DRIFT: "${entry.path}" — FILE MISSING or UNREADABLE`);
            failures++;
            continue;
        }

        if (actual === entry.sha256) {
            console.log(`✅ frozen OK: ${entry.path}`);
        } else {
            console.error(`❌ LEDGER DRIFT: "${entry.path}" has been modified!`);
            console.error(`   expected: ${entry.sha256}`);
            console.error(`   actual:   ${actual}`);
            console.error(`   sealed:   ${entry.frozenAt}`);
            if (entry.note) console.error(`   note:     ${entry.note}`);
            console.error(`   To update intentionally: deno task ledger:seal ${entry.path}`);
            failures++;
        }
    }

    if (failures > 0) {
        console.error(`\n❌ Ledger: ${failures} frozen file(s) have drifted.`);
        Deno.exit(1);
    }

    console.log(`\n✅ Ledger: All ${ledger.frozen.length} frozen file(s) intact.`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const sealIdx = Deno.args.indexOf("--seal");

if (sealIdx !== -1) {
    const target = Deno.args[sealIdx + 1];
    if (!target) {
        console.error("Usage: deno task ledger:seal <path>");
        Deno.exit(1);
    }
    await seal(target);
} else {
    await verify();
}
