import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import mdx from "@mdx-js/rollup";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import katex from "katex";
import * as fs from "node:fs";

// ─── Deno junction fix (Windows) ─────────────────────────────────────
// Deno stores npm deps under node_modules/.deno/ via NTFS junctions.
// When Vite appends ?v=hash query strings to these paths it triggers
// Windows OS error 123 ("filename, directory name, or volume label
// syntax is incorrect").  This plugin resolves junction paths to their
// real filesystem paths before Vite tries to read them.

function denoJunctionFix() {
  return {
    name: "deno-junction-fix",
    enforce: "pre" as const,

    // deno-lint-ignore no-explicit-any
    configureServer(server: any) {
      // Pre-bundled deps: .deno URL pattern → optimized dep filename.
      // Fresh's JSR modules import preact from raw .deno paths, while
      // islands import from optimized /.vite/deps/ paths. Two URLs =
      // two module instances = hooks __H undefined crash.
      // Fix: serve a proxy module that re-exports from the single
      // optimized copy so the browser uses ONE preact instance.
      const depProxies: [RegExp, string][] = [
        [/\/\.deno\/preact@[^/]+\/node_modules\/preact\/dist\/preact\.module\.js/, "preact"],
        [/\/\.deno\/preact@[^/]+\/node_modules\/preact\/hooks\//, "preact_hooks"],
        [/\/\.deno\/preact@[^/]+\/node_modules\/preact\/compat\//, "preact_compat"],
        [/\/\.deno\/preact@[^/]+\/node_modules\/preact\/jsx-runtime\//, "preact_jsx-runtime"],
        [/\/\.deno\/preact@[^/]+\/node_modules\/preact\/jsx-dev-runtime\//, "preact_jsx-dev-runtime"],
        [/\/\.deno\/@preact\+signals@[^/]+\/.*\/signals\.module\.js/, "@preact_signals"],
        [/\/\.deno\/preact-render-to-string@[^/]+\/.*\/index\.module\.js/, "preact-render-to-string"],
      ];

      server.middlewares.use(
        // deno-lint-ignore no-explicit-any
        async (req: any, res: any, next: () => void) => {
          if (!req.url || !req.url.includes("node_modules/.deno")) {
            return next();
          }

          const cleanUrl = req.url.split("?")[0];

          // Deduplicate: serve proxy that re-exports from /.vite/deps/
          for (const [pattern, depFile] of depProxies) {
            if (pattern.test(cleanUrl)) {
              const hash = readBrowserHash(server);
              if (hash) {
                const target = `/.vite/deps/${depFile}.js?v=${hash}`;
                res.setHeader("Content-Type", "application/javascript");
                res.setHeader("Cache-Control", "no-cache");
                res.end(`export * from "${target}";\n`);
                return;
              }
              break; // hash not ready yet — fall through to transformRequest
            }
          }

          // All other .deno modules: transform through Vite pipeline
          try {
            const result = await server.transformRequest(cleanUrl);
            if (result) {
              res.setHeader("Content-Type", "application/javascript");
              res.setHeader("Cache-Control", "no-cache");
              res.end(result.code);
              return;
            }
          } catch {
            // transform failed — fall through
          }
          next();
        },
      );
    },

    // Strip query strings from .deno paths during module resolution.
    // deno-lint-ignore no-explicit-any
    resolveId(source: string, _importer: string | undefined, _options: any) {
      if (!source.includes(".deno")) return null;
      // Only act if there's a query string to strip
      if (!source.includes("?")) return null;
      return source.replace(/\?.*$/, "");
    },

    // Read .deno files after stripping query strings.
    load(id: string) {
      if (!id.includes(".deno")) return null;
      const clean = id.replace(/\?.*$/, "");
      try {
        return fs.readFileSync(clean, "utf-8");
      } catch {
        return null;
      }
    },
  };
}

/** Read the browserHash from Vite's dep optimizer metadata. */
// deno-lint-ignore no-explicit-any
function readBrowserHash(server: any): string {
  // Try Vite's internal API first
  try {
    const hash = server.environments?.client?.depsOptimizer?.metadata?.browserHash;
    if (hash) return hash;
  } catch { /* API not available */ }
  // Fallback: read _metadata.json from disk
  try {
    const root = (server.config?.root || ".").replace(/\\/g, "/");
    const metaPath = `${root}/.vite/deps/_metadata.json`;
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    return meta.browserHash || "";
  } catch { /* file not ready yet */ }
  return "";
}


// ─── Custom remark plugin ────────────────────────────────────────────
// Converts `math` / `inlineMath` mdast nodes (from remark-math) into
// MDX JSX elements with pre-rendered KaTeX HTML.
//
// Replaces rehype-katex whose deep dependency chain
// (hast-util-raw → hast-util-from-html → hast-util-from-parse5)
// triggers an ESM named-export error during Vite config bundling
// when package.json has "type": "commonjs".

// deno-lint-ignore no-explicit-any
type Node = Record<string, any>;

function remarkKatex() {
  return (tree: Node) => {
    walkTree(tree, (node, index, parent) => {
      if (node.type !== "math" && node.type !== "inlineMath") return;

      const isDisplay = node.type === "math";
      const html = katex.renderToString(String(node.value ?? ""), {
        displayMode: isDisplay,
        throwOnError: false,
      });

      parent!.children![index] = makeJsxElement(isDisplay, html);
    });
  };
}

/** Build an mdxJsxFlowElement | mdxJsxTextElement with dangerouslySetInnerHTML. */
function makeJsxElement(display: boolean, html: string): Node {
  return {
    type: display ? "mdxJsxFlowElement" : "mdxJsxTextElement",
    name: display ? "div" : "span",
    attributes: [
      {
        type: "mdxJsxAttribute",
        name: "dangerouslySetInnerHTML",
        value: {
          type: "mdxJsxAttributeValueExpression",
          value: `{__html:${JSON.stringify(html)}}`,
          data: {
            estree: {
              type: "Program",
              sourceType: "module",
              comments: [],
              body: [
                {
                  type: "ExpressionStatement",
                  expression: {
                    type: "ObjectExpression",
                    properties: [
                      {
                        type: "Property",
                        method: false,
                        shorthand: false,
                        computed: false,
                        kind: "init",
                        key: { type: "Identifier", name: "__html" },
                        value: {
                          type: "Literal",
                          value: html,
                          raw: JSON.stringify(html),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    ],
    children: [],
  };
}

/** Depth-first post-order tree walk — no external deps needed. */
function walkTree(
  node: Node,
  fn: (n: Node, i: number, p: Node | null) => void,
  index = 0,
  parent: Node | null = null,
): void {
  const kids = node.children as Node[] | undefined;
  if (kids) {
    for (let i = kids.length - 1; i >= 0; i--) {
      walkTree(kids[i], fn, i, node);
    }
  }
  fn(node, index, parent);
}

// ─── Vite config ─────────────────────────────────────────────────────

export default defineConfig({
  // Place Vite's dep-optimization cache in the project root instead of
  // node_modules/.vite, which Deno's .deno/ symlink structure makes
  // unresolvable on Windows (causes text/html MIME-type errors).
  cacheDir: ".vite",
  plugins: [
    denoJunctionFix(),
    mdx({
      jsxImportSource: "preact",
      remarkPlugins: [remarkGfm, remarkMath, remarkKatex],
    }),
    fresh(),
  ],
  resolve: {
    alias: {
      "preact/debug": "preact",
    },
  },
  optimizeDeps: {
    include: [
      "katex",
      "preact",
      "preact/hooks",
      "preact/compat",
      "preact/jsx-runtime",
      "preact/jsx-dev-runtime",
      "preact-render-to-string",
      "@preact/signals",
      "zod",
    ],
  },
  server: {
    // Deno 2.6's node:fs lstat compat throws EISDIR when chokidar walks
    // NTFS junction dirs inside node_modules/.deno.  Disabling the watcher
    // is the only stable workaround — Vite HMR still pushes updates when
    // modules are re-requested; only auto-detection of saves is lost.
    watch: null,
  },
});
