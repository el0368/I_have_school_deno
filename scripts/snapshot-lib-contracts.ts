/**
 * snapshot-lib-contracts.ts — Layer 2 Type Contract Snapshot
 *
 * Extracts exported interfaces, function signatures, and signal declarations
 * from every file in lib/ and writes a sorted golden file.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/snapshot-lib-contracts.ts   ← write baseline
 *   deno run --allow-read scripts/snapshot-lib-contracts.ts --check          ← compare
 *
 * WHY: If a function renames a parameter, changes a return type, or a shared
 * interface gains/loses a field, the diff appears here before it silently
 * breaks islands or routes that depend on it.
 */

const CHECK_MODE = Deno.args.includes("--check");
const LIB_DIR = "lib";
const GOLDEN_PATH = "tests/golden/lib-contracts.txt";

interface ContractEntry {
  file: string;
  kind: "interface" | "function" | "signal" | "computed" | "type";
  name: string;
  signature: string;
}

function extractContracts(filename: string, src: string): ContractEntry[] {
  const entries: ContractEntry[] = [];
  const lines = src.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // exported interface
    const ifaceMatch = line.match(/^export\s+interface\s+(\w+)/);
    if (ifaceMatch) {
      // Collect fields until closing brace
      const fields: string[] = [];
      let depth = 0;
      let j = i;
      while (j < lines.length) {
        const l = lines[j];
        if (l.includes("{")) depth++;
        if (l.includes("}")) depth--;
        // Extract field declarations (lines with a colon that are property defs)
        if (j > i && depth > 0) {
          const field = l.trim();
          if (field && !field.startsWith("//") && !field.startsWith("/*") && field.includes(":")) {
            fields.push(field.replace(/,$/, "").replace(/;$/, "").trim());
          }
        }
        if (depth === 0 && j > i) break;
        j++;
      }
      entries.push({
        file: filename,
        kind: "interface",
        name: ifaceMatch[1],
        signature: fields.sort().join(" | "),
      });
    }

    // exported type alias
    const typeMatch = line.match(/^export\s+type\s+(\w+)\s*=\s*(.+)/);
    if (typeMatch) {
      entries.push({
        file: filename,
        kind: "type",
        name: typeMatch[1],
        signature: typeMatch[2].replace(/;$/, "").trim(),
      });
    }

    // exported function — capture the declaration line only (name + param names)
    const fnMatch = line.match(
      /^export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*(.+?))?(?:\s*\{|$)/,
    );
    if (fnMatch) {
      const params = fnMatch[2]
        .split(",")
        .map((p) => p.trim().split(":")[0].trim().replace(/\?$/, ""))
        .filter(Boolean)
        .join(", ");
      const ret = fnMatch[3] ? `: ${fnMatch[3].trim()}` : "";
      entries.push({
        file: filename,
        kind: "function",
        name: fnMatch[1],
        signature: `(${params})${ret}`,
      });
    }

    // exported signal / computed
    const signalMatch = line.match(/^export\s+const\s+(\w+)\s*=\s*(signal|computed)<([^>]+)>/);
    if (signalMatch) {
      const kind = signalMatch[2] === "signal" ? "signal" : "computed";
      entries.push({
        file: filename,
        kind,
        name: signalMatch[1],
        signature: `<${signalMatch[3]}>`,
      });
    }
  }

  return entries;
}

function formatContracts(contracts: ContractEntry[]): string {
  // Sort: by file, then by kind, then by name
  const sorted = [...contracts].sort((a, b) => {
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.name.localeCompare(b.name);
  });

  const lines: string[] = [];
  let currentFile = "";
  for (const e of sorted) {
    if (e.file !== currentFile) {
      if (currentFile) lines.push("");
      lines.push(`## ${e.file}`);
      currentFile = e.file;
    }
    lines.push(`  ${e.kind} ${e.name} ${e.signature}`);
  }
  return lines.join("\n") + "\n";
}

async function run() {
  const contracts: ContractEntry[] = [];

  for await (const entry of Deno.readDir(LIB_DIR)) {
    if (!entry.isFile) continue;
    if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
    if (entry.name.endsWith(".test.ts")) continue;

    const src = await Deno.readTextFile(`${LIB_DIR}/${entry.name}`);
    const found = extractContracts(entry.name, src);
    contracts.push(...found);
  }

  const current = formatContracts(contracts);

  if (CHECK_MODE) {
    let golden: string;
    try {
      golden = await Deno.readTextFile(GOLDEN_PATH);
    } catch {
      console.error(`❌ Layer 2: No baseline found at ${GOLDEN_PATH}`);
      console.error("   Run without --check to generate it first.");
      Deno.exit(1);
    }

    if (current === golden) {
      console.log(`✅ Layer 2 (lib contracts): baseline matches — no drift`);
      Deno.exit(0);
    }

    const goldenLines = golden.trim().split("\n");
    const currentLines = current.trim().split("\n");
    const removed = goldenLines.filter((l) => !currentLines.includes(l) && l.startsWith("  "));
    const added = currentLines.filter((l) => !goldenLines.includes(l) && l.startsWith("  "));

    console.error("❌ Layer 2 (lib contracts): DRIFT DETECTED");
    if (removed.length) {
      console.error("\n  Removed/changed exports (were in baseline):");
      removed.forEach((l) => console.error(`    - ${l.trim()}`));
    }
    if (added.length) {
      console.error("\n  Added/changed exports (not in baseline):");
      added.forEach((l) => console.error(`    + ${l.trim()}`));
    }
    console.error("\n  To update the baseline intentionally:");
    console.error("    deno task snapshot:lib");
    Deno.exit(1);
  }

  await Deno.writeTextFile(GOLDEN_PATH, current);
  console.log(`✅ lib-contracts.txt — ${contracts.length} entries from ${LIB_DIR}/`);
}

await run();
