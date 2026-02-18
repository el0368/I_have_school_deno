// Sovereign Academy - Window Control API
//
// API routes that bridge the browser Islands to the Rust FFI.
// TitleBar island calls these endpoints to minimize/maximize/close.

import { define } from "@/utils.ts";

// Try to import native module (may fail in browser-only mode)
let NativeWindow: typeof import("@/lib/native.ts").NativeWindow | null = null;

try {
  const mod = await import("@/lib/native.ts");
  NativeWindow = mod.NativeWindow;
} catch {
  console.warn(
    "[API] Native window module not available - running in browser mode",
  );
}

export const handler = define.handlers({
  POST(ctx) {
    const action = ctx.params.action;

    if (!NativeWindow) {
      return Response.json(
        { error: "Native window not available", action },
        { status: 503 },
      );
    }

    switch (action) {
      case "minimize":
        NativeWindow.minimize();
        return Response.json({ ok: true, action: "minimize" });

      case "maximize":
        NativeWindow.maximize();
        return Response.json({
          ok: true,
          action: "maximize",
          maximized: NativeWindow.isMaximized(),
        });

      case "close":
        NativeWindow.close();
        // Give time for response before process exits
        setTimeout(() => Deno.exit(0), 100);
        return Response.json({ ok: true, action: "close" });

      default:
        return Response.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  },
});
