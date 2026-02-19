/**
 * snapshot-island-contracts.ts — Layer 3 Island Component Snapshot
 *
 * Extracts each island's default export name, its Props interface fields,
 * and its direct signal imports (what state it touches) from islands/*.tsx
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/snapshot-island-contracts.ts   ← write baseline
 *   deno run --allow-read scripts/snapshot-island-contracts.ts --check          ← compare
 *
 * WHY: If a prop is renamed, a required field added, or an island starts
 * consuming a signal it didn't before, the diff appears here — before a
 * route silently passes the wrong props or lib/ state is mutated unexpectedly.
 */

const CHECK_MODE = Deno.args.includes("--check");
const ISLANDS_DIR = "islands";
const GOLDEN_PATH = "tests/golden/island-contracts.txt";

interface IslandContract {
  file: string;
  exportName: string;
  props: string[];
  signalImports: string[];
  libImports: string[];
}

function extractIslandContract(filename: string, src: string): IslandContract {
  const lines = src.split("\n");

  // Default export function name
  let exportName = "(unknown)";
  const exportMatch = src.match(/export\s+default\s+function\s+(\w+)/);
  if (exportMatch) exportName = exportMatch[1];

  // Props interface fields
  const props: string[] = [];
  let inProps = false;
  let propsDepth = 0;
  for (const line of lines) {
    if (/interface\s+\w*Props/.test(line)) {
      inProps = true;
      propsDepth = 0;
    }
    if (inProps) {
      if (line.includes("{")) propsDepth++;
      if (line.includes("}")) propsDepth--;
      if (inProps && propsDepth > 0) {
        const field = line.trim();
        if (field && !field.startsWith("//") && field.includes(":")) {
          props.push(field.replace(/[;,]$/, "").trim());
        }
      }
      if (propsDepth === 0 && props.length > 0) inProps = false;
    }
  }

  // Signals imported from lib/state or lib/
  const signalImports: string[] = [];
  const libImports: string[] = [];
  for (const line of lines) {
    if (!line.trim().startsWith("import")) continue;

    const libMatch = line.match(/from\s+["'](?:\.\.\/|@\/)?(lib\/[^"']+)["']/);
    if (libMatch) {
      // Extract named imports
      const named = line.match(/\{([^}]+)\}/);
      if (named) {
        const names = named[1].split(",").map((n) => n.trim()).filter(Boolean);
        for (const name of names) {
          if (/signal|computed|select|TOPICS/.test(name)) {
            signalImports.push(name);
          } else {
            libImports.push(name);
          }
        }
      }
    }
  }

  return {
    file: filename,
    exportName,
    props: props.sort(),
    signalImports: signalImports.sort(),
    libImports: libImports.sort(),
  };
}

function formatContracts(contracts: IslandContract[]): string {
  const sorted = [...contracts].sort((a, b) => a.file.localeCompare(b.file));
  const lines: string[] = [];

  for (const c of sorted) {
    lines.push(`## ${c.file} → export: ${c.exportName}`);
    if (c.props.length) {
      lines.push(`  props:`);
      c.props.forEach((p) => lines.push(`    ${p}`));
    } else {
      lines.push(`  props: (none)`);
    }
    if (c.signalImports.length) {
      lines.push(`  state-signals: ${c.signalImports.join(", ")}`);
    }
    if (c.libImports.length) {
      lines.push(`  lib-imports: ${c.libImports.join(", ")}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function run() {
  const contracts: IslandContract[] = [];

  for await (const entry of Deno.readDir(ISLANDS_DIR)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(".tsx") && !entry.name.endsWith(".ts")) continue;

    const src = await Deno.readTextFile(`${ISLANDS_DIR}/${entry.name}`);
    contracts.push(extractIslandContract(entry.name, src));
  }

  const current = formatContracts(contracts);

  if (CHECK_MODE) {
    let golden: string;
    try {
      golden = await Deno.readTextFile(GOLDEN_PATH);
    } catch {
      console.error(`❌ Layer 3: No baseline found at ${GOLDEN_PATH}`);
      console.error("   Run without --check to generate it first.");
      Deno.exit(1);
    }

    if (current === golden) {
      console.log(`✅ Layer 3 (island contracts): baseline matches — no drift`);
      Deno.exit(0);
    }

    const goldenLines = golden.split("\n");
    const currentLines = current.split("\n");
    const removed = goldenLines.filter((l) => !currentLines.includes(l) && l.startsWith("  "));
    const added = currentLines.filter((l) => !goldenLines.includes(l) && l.startsWith("  "));

    console.error("❌ Layer 3 (island contracts): DRIFT DETECTED");
    if (removed.length) {
      console.error("\n  Removed/changed entries:");
      removed.forEach((l) => console.error(`    - ${l.trim()}`));
    }
    if (added.length) {
      console.error("\n  Added/changed entries:");
      added.forEach((l) => console.error(`    + ${l.trim()}`));
    }
    console.error("\n  To update the baseline intentionally:");
    console.error("    deno task snapshot:islands");
    Deno.exit(1);
  }

  await Deno.writeTextFile(GOLDEN_PATH, current);
  console.log(`✅ island-contracts.txt — ${contracts.length} islands captured`);
}

await run();
