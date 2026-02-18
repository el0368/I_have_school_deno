import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";

export default defineConfig({
  plugins: [fresh()],
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
