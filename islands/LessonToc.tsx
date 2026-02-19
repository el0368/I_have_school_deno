// Sovereign Academy - Right Sidebar: Table of Contents
//
// Discord-style right sidebar showing:
// - Lesson table of contents (auto-generated from headers)
// - Related topics in current subject

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function LessonToc() {
  const tocItems = useSignal<{ level: number; text: string; id: string }[]>([]);
  const relatedTopics = useSignal([
    { id: "T11_6_1", title: "Writing ratios in different forms", grade: 6 },
    { id: "T11_6_2", title: "Equivalent ratios", grade: 6 },
    { id: "T11_6_3", title: "Ratio tables", grade: 6 },
    { id: "T11_7_0", title: "Unit rates", grade: 7 },
  ]);

  useEffect(() => {
    // Auto-generate TOC from markdown headers in the main content area
    const generateToc = () => {
      const content = document.querySelector(".math-stage");
      if (!content) return;

      const headers = content.querySelectorAll("h2, h3");
      const items: { level: number; text: string; id: string }[] = [];

      headers.forEach((header, index) => {
        const level = parseInt(header.tagName[1]);
        const text = header.textContent || "";
        let id = header.id;

        // Generate ID if not present
        if (!id) {
          id = `heading-${index}`;
          header.id = id;
        }

        items.push({ level, text, id });
      });

      tocItems.value = items;
    };

    // Generate TOC on mount and when content changes
    generateToc();

    // Watch for content changes (when exercises load)
    const observer = new MutationObserver(generateToc);
    const target = document.querySelector(".math-stage");
    if (target) {
      observer.observe(target, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside class="lesson-toc">
      {/* Table of Contents */}
      <div class="toc-section">
        <h3 class="toc-header">On This Page</h3>
        <nav class="toc-nav">
          {tocItems.value.length > 0
            ? (
              <ul class="toc-list">
                {tocItems.value.map((item) => (
                  <li
                    key={item.id}
                    class={`toc-item toc-level-${item.level}`}
                  >
                    <button
                      type="button"
                      class="toc-link"
                      onClick={() => scrollToSection(item.id)}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            )
            : <p class="toc-empty">No sections yet</p>}
        </nav>
      </div>

      {/* Related Topics */}
      <div class="toc-section">
        <h3 class="toc-header">Related Topics</h3>
        <nav class="related-nav">
          <ul class="related-list">
            {relatedTopics.value.map((topic) => (
              <li key={topic.id} class="related-item">
                <button type="button" class="related-link">
                  <span class="related-title">{topic.title}</span>
                  <span class="related-meta">Grade {topic.grade}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
