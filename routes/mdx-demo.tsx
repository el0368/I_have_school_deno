import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";

// @ts-ignore — MDX module, types handled by vite.config.ts mdx plugin
import Content from "@/content/lesson-demo.mdx";

export default define.page(function MdxDemoPage() {
    return (
        <div class="app-shell">
            <TitleBar />
            {/* app-body--lesson = 2-column (Sidebar | Article). TOC lives inside article. */}
            <div class="app-body app-body--lesson">
                <Sidebar />
                <article class="mdx-lesson">
                    {/* Left: prose content from MDX */}
                    <div class="mdx-lesson-prose">
                        <Content />
                    </div>
                    {/* Right: TOC sheet — self-contained, reads headings from .mdx-lesson-prose */}
                    <div class="mdx-lesson-sheet">
                        <LessonSheet
                            nodeId="DEMO"
                            grade="Demo Lesson"
                            contentSelector=".mdx-lesson-prose"
                        />
                    </div>
                </article>
            </div>
        </div>
    );
});
