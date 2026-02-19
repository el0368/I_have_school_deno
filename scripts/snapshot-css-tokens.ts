/**
 * snapshot-css-tokens.ts — Layer 4 CSS Token Snapshot
 *
 * Extracts all CSS custom properties from the :root block of static/discord.css
 * and writes a sorted golden file at tests/golden/css-tokens.txt
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/snapshot-css-tokens.ts   ← write baseline
 *   deno run --allow-read scripts/snapshot-css-tokens.ts --check          ← compare to baseline
 *
 * WHY: Protects against accidental colour renames, token removals, or value drift
 * that silently break components which use CSS variables.
 */

const CHECK_MODE = Deno.args.includes("--check");
const CSS_PATH = "static/discord.css";
const GOLDEN_PATH = "tests/golden/css-tokens.txt";

function extractTokens(css: string): string {
  // Capture everything inside :root { ... } including multiline
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!rootMatch) throw new Error("No :root block found in discord.css");

  const rootBlock = rootMatch[1];
  const lines = rootBlock.split("\n");
  const tokens: string[] = [];

  let current = "";
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("/*") || line.startsWith("//")) continue;

    current += (current ? " " : "") + line;

    // A token declaration ends with a semicolon
    if (current.includes(";")) {
      const propMatch = current.match(/(--[a-z][a-z0-9-]+)\s*:\s*(.+?);/);
      if (propMatch) {
        const name = propMatch[1];
        const value = propMatch[2].replace(/\s+/g, " ").trim();
        tokens.push(`${name}: ${value}`);
      }
      current = "";
    }
  }

  tokens.sort();
  return tokens.join("\n") + "\n";
}

async function run() {
  const css = await Deno.readTextFile(CSS_PATH);
  const current = extractTokens(css);

  if (CHECK_MODE) {
    let golden: string;
    try {
      golden = await Deno.readTextFile(GOLDEN_PATH);
    } catch {
      console.error(`❌ Layer 4: No baseline found at ${GOLDEN_PATH}`);
      console.error("   Run without --check to generate it first.");
      Deno.exit(1);
    }

    if (current === golden) {
      console.log(`✅ Layer 4 (CSS tokens): baseline matches — no drift`);
      Deno.exit(0);
    }

    // Show which tokens changed
    const goldenLines = new Set(golden.trim().split("\n"));
    const currentLines = new Set(current.trim().split("\n"));

    const removed = [...goldenLines].filter((l) => !currentLines.has(l));
    const added = [...currentLines].filter((l) => !goldenLines.has(l));

    console.error("❌ Layer 4 (CSS tokens): DRIFT DETECTED");
    if (removed.length) {
      console.error("\n  Removed or changed tokens (were in baseline):");
      removed.forEach((l) => console.error(`    - ${l}`));
    }
    if (added.length) {
      console.error("\n  Added or changed tokens (not in baseline):");
      added.forEach((l) => console.error(`    + ${l}`));
    }
    console.error("\n  To update the baseline intentionally:");
    console.error("    deno task snapshot:css");
    Deno.exit(1);
  }

  // Write mode
  await Deno.writeTextFile(GOLDEN_PATH, current);
  const count = current.trim().split("\n").length;
  console.log(`✅ css-tokens.txt — ${count} tokens captured`);
}

await run();
