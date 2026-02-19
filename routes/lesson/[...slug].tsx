import { define } from "@/utils.ts";

import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";

export default define.page(async function LessonPage(ctx) {
  const slug = ctx.params.slug;

  try {
    // Dynamic import of the MDX file
    // Note: In a real app we might need a safer way to resolve paths,
    // but Vite's dynamic import supports this pattern for known directories.
    const module = await import(`../../content/${slug}.mdx`);
    const Content = module.default;

    return (
      <div class="app-shell">
        <TitleBar />
        <div class="app-body">
          <Sidebar />
          <div
            class="lesson-container"
            style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", color: "#dbdee1" }}
          >
            <div class="lesson-content">
              <Content />
            </div>
            <div style={{ marginTop: "40px", borderTop: "1px solid #3f4147", paddingTop: "20px" }}>
              <a href="/" style={{ color: "#00b0f4", textDecoration: "none" }}>← Back to Home</a>
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    return (
      <div class="error-404">
        <h1 class="error-404-title">404 — Lesson not found</h1>
        <p class="error-404-text">The lesson you were looking for doesn't exist.</p>
        <a href="/" class="error-404-link">Go back home</a>
      </div>
    );
  }
});
