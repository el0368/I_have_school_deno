import { define } from "@/utils.ts";

import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";

export default define.page(async function LessonPage(ctx) {
  const slug = ctx.params.slug as string;

  try {
    // Dynamic import of the MDX file from the new curriculum structure
    const module = await import(`../../curriculums/math/grade-6/unit-1-ratios/01-intro/${slug}.mdx`);
    const Content = module.default;

    // Derive language and alternate language link
    const isEnglish = slug.endsWith("_EN");
    const lang = isEnglish ? "EN" : "TH";
    const altLang = isEnglish ? "TH" : "EN";
    const altSlug = slug.replace(`_${lang}`, `_${altLang}`);
    const altLangLabel = isEnglish ? "ไทย" : "English";

    return (
      <div class="app-shell">
        <TitleBar />
        <div class="app-body">
          <Sidebar />
          <article class="mdx-lesson">
            <Content />
          </article>
          <LessonSheet
            nodeId="T11_6_0"
            grade="Grade 6"
            lang={lang}
            langLabel={altLangLabel}
            langHref={`/lesson/${altSlug}`}
            nextHref="/lesson/T11_6_1_EN"
            nextLabel="Visualize Ratios"
          />
        </div>
      </div>
    );
  } catch (err) {
    console.error("Failed to load lesson:", err);
    return (
      <div class="error-404">
        <h1 class="error-404-title">404 — Lesson not found</h1>
        <p class="error-404-text">The lesson you were looking for doesn't exist.</p>
        <p class="error-404-text" style={{ fontSize: "0.8em", opacity: 0.7 }}>{(err as Error).message}</p>
        <a href="/" class="error-404-link">Go back home</a>
      </div>
    );
  }
});
