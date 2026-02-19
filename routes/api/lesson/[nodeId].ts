// Sovereign Academy — Lesson API
// GET /api/lesson/:nodeId?lang=EN|TH
// Returns the raw markdown content for a lesson node.

import { define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const nodeId = ctx.params.nodeId;
    const url = new URL(ctx.req.url);
    const lang = url.searchParams.get("lang") === "TH" ? "TH" : "EN";

    const path = `subjects/math/lessons/${nodeId}_${lang}.md`;

    try {
      const content = await Deno.readTextFile(path);
      return Response.json({ nodeId, lang, content });
    } catch {
      return Response.json(
        { error: `Lesson not found: ${nodeId}_${lang}.md` },
        { status: 404 },
      );
    }
  },
});
