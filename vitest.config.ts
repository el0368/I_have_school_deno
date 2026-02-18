/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    // Use jsdom for DOM APIs in component tests
    environment: "jsdom",
    // Test file patterns
    include: [
      "lib/**/*.test.ts",
      "islands/**/*.test.ts",
      "islands/**/*.test.tsx",
    ],
    // Exclude build artifacts and Rust targets
    exclude: [
      "**/node_modules/**",
      "**/target/**",
      "**/_fresh/**",
      "**/static/wasm/**",
    ],
    // Global test setup
    globals: true,
  },
  resolve: {
    alias: {
      "@/": new URL("./", import.meta.url).pathname,
    },
  },
  // Prevent Vite transform-time analysis of msgpack-loader.ts.
  // Tests inject a stub via setMsgpackDecoder(); the real npm package
  // (@msgpack/msgpack) is only needed at runtime in the Fresh server.
  optimizeDeps: {
    exclude: ["./lib/msgpack-loader.ts"],
  },
  build: {
    rollupOptions: {
      external: [/msgpack-loader/],
    },
  },
});
