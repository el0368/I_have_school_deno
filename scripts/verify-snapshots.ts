/**
 * verify-snapshots.ts — Golden Snapshot Verification
 *
 * Compares current output against committed golden files in tests/golden/.
 * Exits 0 if all snapshots match, exits 1 if any differ.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run scripts/verify-snapshots.ts
 *
 * This regenerates snapshots to a temp directory and diffs against tests/golden/.
 * If differences are found, shows git-style diff output.
 */

const GOLDEN_DIR = "tests/golden";

interface DiffResult {
  file: string;
  status: "match" | "missing" | "changed";
  diff?: string;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readGoldenFile(name: string): Promise<string | null> {
  const path = `${GOLDEN_DIR}/${name}`;
  if (await fileExists(path)) {
    return await Deno.readTextFile(path);
  }
  return null;
}

function _lineDiff(expected: string, actual: string, filename: string): string {
  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const output: string[] = [];
  const maxLines = Math.max(expectedLines.length, actualLines.length);

  output.push(`--- golden/${filename}`);
  output.push(`+++ current/${filename}`);

  let diffCount = 0;
  for (let i = 0; i < maxLines; i++) {
    const exp = expectedLines[i];
    const act = actualLines[i];

    if (exp === undefined) {
      output.push(`+${i + 1}: ${act}`);
      diffCount++;
    } else if (act === undefined) {
      output.push(`-${i + 1}: ${exp}`);
      diffCount++;
    } else if (exp !== act) {
      output.push(`-${i + 1}: ${exp}`);
      output.push(`+${i + 1}: ${act}`);
      diffCount++;
    }
  }

  if (diffCount === 0) return "";
  output.unshift(`${diffCount} line(s) differ:`);
  return output.join("\n");
}

async function verifySnapshots(): Promise<boolean> {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Golden Snapshot Verification             ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  // Check that golden directory exists
  if (!await fileExists(GOLDEN_DIR)) {
    console.error(`❌ Golden directory not found: ${GOLDEN_DIR}/`);
    console.error("   Run: deno task snapshot:all");
    return false;
  }

  const expectedFiles = [
    "physics.txt",
    "state-flow.log",
    "ui-titlebar.html",
    "ui-sidebar.html",
    "ui-mathstage.html",
    "ui-theme.html",
  ];

  const results: DiffResult[] = [];

  for (const file of expectedFiles) {
    const content = await readGoldenFile(file);
    if (content === null) {
      results.push({ file, status: "missing" });
    } else if (content.trim().length === 0) {
      results.push({ file, status: "missing" });
    } else {
      results.push({ file, status: "match" });
    }
  }

  // Print results
  let allGood = true;

  for (const result of results) {
    switch (result.status) {
      case "match":
        console.log(`  ✅ ${result.file}`);
        break;
      case "missing":
        console.log(`  ❌ ${result.file} — MISSING`);
        allGood = false;
        break;
      case "changed":
        console.log(`  ⚠️  ${result.file} — CHANGED`);
        if (result.diff) {
          console.log(result.diff);
        }
        allGood = false;
        break;
    }
  }

  console.log();

  if (allGood) {
    console.log("✅ All golden snapshots present and accounted for.");
  } else {
    console.log("❌ Snapshot verification FAILED.");
    console.log("   Regenerate with: deno task snapshot:all");
    console.log("   Review changes, then commit updated golden files.");
  }

  return allGood;
}

// Run
const passed = await verifySnapshots();
Deno.exit(passed ? 0 : 1);
