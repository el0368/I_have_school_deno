import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";

export default define.page(async function AutoMdxPage(ctx) {
  const slug = ctx.params.slug as string;

  // Find all .mdx files in content/, curriculums/, and routes/
  const contentModules = import.meta.glob("../content/**/*.mdx");
  const curriculumModules = import.meta.glob("../curriculums/**/*.mdx");
  const routeModules = import.meta.glob("./**/*.mdx");

  const allModules = { ...contentModules, ...curriculumModules, ...routeModules };

  // Try to find a matching module
  // The slug could be "lesson-demo" which maps to "../content/lesson-demo.mdx"
  // Or "math/grade-6/..." which maps to "../curriculums/math/grade-6/..."
  // Or "about" which maps to "./about.mdx"

  const importFn = allModules[`../content/${slug}.mdx`] ||
    allModules[`../curriculums/${slug}.mdx`] ||
    allModules[`./${slug}.mdx`];

  if (!importFn) {
    return (
      <div class="error-404">
        <h1 class="error-404-title">404 — Page not found</h1>
        <p class="error-404-text">The MDX content for "{slug}" doesn't exist.</p>
        <a href="/" class="error-404-link">Go back home</a>
      </div>
    );
  }

  try {
    // deno-lint-ignore no-explicit-any
    const module = await importFn() as any;
    const Content = module.default;
    const frontmatter = module.frontmatter || {};

    // Derive language and alternate language link if applicable
    const isEnglish = slug.endsWith("_EN");
    const isThai = slug.endsWith("_TH");
    const hasLang = isEnglish || isThai;

    const lang = isEnglish ? "EN" : (isThai ? "TH" : undefined);
    const altLang = isEnglish ? "TH" : (isThai ? "EN" : undefined);
    const altSlug = hasLang ? slug.replace(`_${lang}`, `_${altLang}`) : undefined;
    const altLangLabel = isEnglish ? "ไทย" : (isThai ? "English" : undefined);

    return (
      <div class="app-shell">
        <TitleBar />
        <div class="app-body app-body--lesson">
          <Sidebar />
          <article class="mdx-lesson">
            <div class="mdx-lesson-prose">
              <Content />
            </div>
            <div class="mdx-lesson-sheet">
              {/* We can pass generic props or extract frontmatter if available */}
              <LessonSheet
                nodeId={frontmatter.id || slug.split("/").pop() || slug}
                grade={frontmatter.grade || "Lesson"}
                lang={lang}
                langLabel={altLangLabel}
                langHref={altSlug ? `/${altSlug}` : undefined}
                nextHref={frontmatter.nextHref}
                nextLabel={frontmatter.nextLabel}
                contentSelector=".mdx-lesson-prose"
              />
            </div>
          </article>
        </div>
      </div>
    );
  } catch (err) {
    console.error("Failed to load MDX:", err);
    return (
      <div class="error-500">
        <h1>Error loading content</h1>
        <p>{String(err)}</p>
      </div>
    );
  }
});
