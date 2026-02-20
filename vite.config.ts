import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import mdx from "@mdx-js/rollup";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default defineConfig({
  plugins: [
    mdx({
      jsxImportSource: "preact",
      remarkPlugins: [remarkMath],
      // rehypeKatex disabled — causes hast-util-from-parse5 ESM conflict in Deno+Vite
      // rehypePlugins: [rehypeKatex],
    }),
    fresh(),
  ],
  server: {
    watch: {
      // Disable chokidar polling to avoid EISDIR on Deno + Windows
      usePolling: false,
      ignored: [
        "**/node_modules/**",
        "**/desktop/**",
        "**/math-engine/**",
        "**/native/**",
      ],
    },
  },
});
