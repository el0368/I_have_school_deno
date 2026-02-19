// Sovereign Academy — Persistent Right Side Sheet
//
// Hosts Table of Contents + Metadata for the current MDX lesson node.
// Keeps MathStage clean; this is the only place metadata lives on lesson pages.
//
// Usage:
//   <LessonSheet
//     nodeId="T11_6_0"
//     grade="Grade 6"
//     lang="EN"
//     langLabel="ไทย"
//     langHref="/lesson/T11_6_0_TH"
//     nextHref="/lesson/T11_6_1_EN"
//     nextLabel="Visualize Ratios"
//   />

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface TocItem {
  level: number;
  text: string;
  id: string;
}

interface Props {
  /** e.g. "T11_6_0"         — displayed as a badge                   */
  nodeId?: string;
  /** e.g. "Grade 6 / ป.6"  — displayed under the node badge          */
  grade?: string;
  /** Current language label — shown as the active tab                 */
  lang?: string;
  /** Alternate language label — e.g. "ไทย" or "English"              */
  langLabel?: string;
  /** URL to switch to the alternate language version                  */
  langHref?: string;
  /** URL of the next lesson node                                      */
  nextHref?: string;
  /** Display text for the next lesson link                            */
  nextLabel?: string;
  /** Selector of the scrollable content container (default: .mdx-lesson) */
  contentSelector?: string;
}

export default function LessonSheet({
  nodeId,
  grade,
  lang,
  langLabel,
  langHref,
  nextHref,
  nextLabel,
  contentSelector = ".mdx-lesson",
}: Props) {
  const tocItems = useSignal<TocItem[]>([]);
  const activeId = useSignal<string>("");

  useEffect(() => {
    const buildToc = () => {
      const content = document.querySelector(contentSelector);
      if (!content) return;

      const headers = content.querySelectorAll("h1, h2, h3");
      const items: TocItem[] = [];

      headers.forEach((header, i) => {
        const level = parseInt(header.tagName[1]);
        const text = (header.textContent || "").trim();
        if (!text) return;

        // Ensure every heading has an id we can scroll to
        if (!header.id) {
          header.id = `toc-${i}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
        }
        items.push({ level, text, id: header.id });
      });

      tocItems.value = items;
    };

    buildToc();

    // Re-build if the MDX content mutates (e.g. islands hydrating)
    const observer = new MutationObserver(buildToc);
    const target = document.querySelector(contentSelector);
    if (target) observer.observe(target, { childList: true, subtree: true });

    // Highlight active heading on scroll
    const handleScroll = () => {
      const all = tocItems.value;
      if (!all.length) return;
      for (let i = all.length - 1; i >= 0; i--) {
        const el = document.getElementById(all[i].id);
        if (el && el.getBoundingClientRect().top <= 80) {
          activeId.value = all[i].id;
          return;
        }
      }
      activeId.value = all[0]?.id ?? "";
    };

    const scrollTarget = document.querySelector(contentSelector) ?? window;
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      scrollTarget.removeEventListener("scroll", handleScroll);
    };
  }, [contentSelector]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside class="lesson-toc">
      {/* ── Metadata card ─────────────────────────────────────────── */}
      {(nodeId || grade || langHref) && (
        <div class="sheet-meta">
          {nodeId && <div class="sheet-node-id">{nodeId}</div>}
          {grade && <div class="sheet-grade">{grade}</div>}
          {langHref && (
            <div class="sheet-lang-row">
              <span class="sheet-lang-active">{lang ?? "EN"}</span>
              <span class="sheet-lang-sep">·</span>
              <a href={langHref} class="sheet-lang-link">{langLabel ?? "Other"}</a>
            </div>
          )}
        </div>
      )}

      {/* ── Table of Contents ─────────────────────────────────────── */}
      <div class="toc-section">
        <h3 class="toc-header">On This Page</h3>
        <nav class="toc-nav">
          {tocItems.value.length > 0
            ? (
              <ul class="toc-list">
                {tocItems.value.map((item) => {
                  const isActive = activeId.value === item.id;
                  return (
                    <li key={item.id} class={`toc-item toc-level-${item.level}`}>
                      <button
                        type="button"
                        class={`toc-link${isActive ? " toc-link-active" : ""}`}
                        onClick={() => scrollTo(item.id)}
                      >
                        {item.text}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
            : <p class="toc-empty">No headings found</p>}
        </nav>
      </div>

      {/* ── Next Lesson ───────────────────────────────────────────── */}
      {nextHref && (
        <div class="toc-section">
          <h3 class="toc-header">Up Next</h3>
          <a href={nextHref} class="sheet-next-link">
            <span class="sheet-next-label">{nextLabel ?? "Next Lesson"}</span>
            <span class="sheet-next-arrow">→</span>
          </a>
        </div>
      )}
    </aside>
  );
}
