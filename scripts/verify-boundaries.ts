/**
 * verify-boundaries.ts — Import Boundary Enforcement
 *
 * Enforces the 5-layer import hierarchy:
 *
 *   Layer 0  desktop/src/main.rs      ← Rust, no TS imports (frozen core)
 *   Layer 1  math-engine/ (WASM)      ← Rust, no TS imports
 *   Layer 2  lib/                     ← may import: npm:, jsr:, other lib/ files
 *   Layer 3  islands/                 ← may import: lib/, npm:, jsr:  (NOT routes/)
 *   Layer 4  static/discord.css       ← CSS only, no imports
 *   Layer 5  routes/                  ← may import: islands/, lib/, npm:, jsr:
 *                                        may NOT import siblings sideways
 *
 * Each violation is printed with file + line number.
 * Exits 1 if any violation found; 0 if all clean.
 *
 * Usage:
 *   deno run --allow-read scripts/verify-boundaries.ts
 */

interface Violation {
  file: string;
  line: number;
  rule: string;
  importPath: string;
}

async function collectFiles(dir: string, ext: string[]): Promise<string[]> {
  const results: string[] = [];
  try {
    for await (const entry of Deno.readDir(dir)) {
      if (entry.isDirectory) {
        const sub = await collectFiles(`${dir}/${entry.name}`, ext);
        results.push(...sub);
      } else if (entry.isFile && ext.some((e) => entry.name.endsWith(e))) {
        results.push(`${dir}/${entry.name}`);
      }
    }
  } catch {
    // directory may not exist
  }
  return results;
}

function extractImports(src: string): Array<{ line: number; path: string }> {
  const imports: Array<{ line: number; path: string }> = [];
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match: import ... from "path"  OR  import("path")
    const staticMatch = line.match(/from\s+["']([^"']+)["']/);
    const dynamicMatch = line.match(/import\s*\(\s*["']([^"']+)["']/);
    const m = staticMatch || dynamicMatch;
    if (m) {
      imports.push({ line: i + 1, path: m[1] });
    }
  }
  return imports;
}

function isInternal(path: string): boolean {
  return path.startsWith(".") || path.startsWith("@/");
}

// Resolve a relative import path from a base file to a canonical layer label
function classifyImportTarget(from: string, importPath: string): string {
  if (!isInternal(importPath)) return "external";

  // Normalise @/ alias
  const resolved = importPath.startsWith("@/")
    ? importPath.slice(2)
    : resolvePath(from, importPath);

  if (resolved.startsWith("lib/")) return "lib";
  if (resolved.startsWith("islands/")) return "islands";
  if (resolved.startsWith("routes/")) return "routes";
  if (resolved.startsWith("scripts/")) return "scripts";
  if (resolved.startsWith("static/")) return "static";
  return "other";
}

function resolvePath(from: string, relative: string): string {
  // from is like "islands/Sidebar.tsx", relative is like "../lib/state.ts"
  const parts = from.split("/");
  parts.pop(); // remove filename
  const rel = relative.split("/");
  for (const seg of rel) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

async function checkLayer(
  files: string[],
  layerName: string,
  rules: Array<{ forbidden: string; message: string }>,
): Promise<Violation[]> {
  const violations: Violation[] = [];
  for (const file of files) {
    const src = await Deno.readTextFile(file);
    const imports = extractImports(src);
    for (const { line, path } of imports) {
      const target = classifyImportTarget(file, path);
      for (const rule of rules) {
        if (target === rule.forbidden) {
          violations.push({ file, line, rule: rule.message, importPath: path });
        }
      }
    }
  }
  return violations;
}

async function run() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Import Boundary Enforcement              ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const libFiles = await collectFiles("lib", [".ts", ".tsx"]);
  const islandFiles = await collectFiles("islands", [".tsx", ".ts"]);
  const routeFiles = await collectFiles("routes", [".tsx", ".ts"]);

  // Filter out test files from boundary checks
  const libSrc = libFiles.filter((f) => !f.endsWith(".test.ts"));

  const violations: Violation[] = [];

  // Layer 2: lib/ must NOT import from islands/ or routes/
  violations.push(
    ...await checkLayer(libSrc, "lib", [
      { forbidden: "islands", message: "lib/ must not import from islands/" },
      { forbidden: "routes", message: "lib/ must not import from routes/" },
    ]),
  );

  // Layer 3: islands/ must NOT import from routes/
  violations.push(
    ...await checkLayer(islandFiles, "islands", [
      { forbidden: "routes", message: "islands/ must not import from routes/" },
    ]),
  );

  // Layer 5: routes/ files must NOT import OTHER routes sideways
  // (only enforced for same-level direct siblings — dynamic routes importing
  //  their own sibling layouts are the known exception pattern to allow)
  // Simple rule: a route must not import from routes/ that is not _app or layouts
  const routeViolations = await checkLayer(routeFiles, "routes", [
    { forbidden: "routes", message: "routes/ must not import sibling routes/" },
  ]);

  // Allow routes importing _app.tsx (layout) — filter those out
  const filteredRouteViolations = routeViolations.filter(
    (v) => !v.importPath.includes("_app") && !v.importPath.includes("_layout"),
  );
  violations.push(...filteredRouteViolations);

  if (violations.length === 0) {
    const total = libSrc.length + islandFiles.length + routeFiles.length;
    console.log(`✅ All ${total} files respect layer boundaries — no violations\n`);
    Deno.exit(0);
  }

  console.error(`❌ ${violations.length} boundary violation(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Rule: ${v.rule}`);
    console.error(`    Import: "${v.importPath}"`);
    console.error();
  }

  console.error("Fix the imports above to restore layer separation.");
  console.error("See copilot-instructions.md → 'Anti-Logic Drift Rules'");
  Deno.exit(1);
}

await run();
