// Sovereign Academy - Fresh 2 Server Entry
//
// Uses the App class with file-system routes and binary streaming middleware.

import { App, staticFiles } from "fresh";
import { type State } from "./utils.ts";

export const app = new App<State>();

// Serve static files from static/
app.use(staticFiles());

// Binary exercise file streaming middleware
app.use(async (ctx) => {
  const url = new URL(ctx.req.url);

  if (url.pathname.startsWith("/exercises/") && url.pathname.endsWith(".bin")) {
    return await serveBinaryFile(url.pathname);
  }

  return await ctx.next();
});

async function serveBinaryFile(pathname: string): Promise<Response> {
  try {
    const filePath = `./static${pathname}`;
    const stat = await Deno.stat(filePath);
    if (!stat.isFile) {
      return new Response("Not a file", { status: 404 });
    }

    const file = await Deno.open(filePath, { read: true });
    const stream = file.readable;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=3600, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return new Response("Exercise not found", { status: 404 });
    }
    console.error("[Middleware] Error serving binary:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

// File-system based routes (routes/ folder)
app.fsRoutes();
