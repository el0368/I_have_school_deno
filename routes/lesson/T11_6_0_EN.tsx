// Sovereign Academy — Intro to Ratios (English)
// Route: /lesson/T11_6_0_EN

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";
// @ts-ignore — MDX module types resolved at build time by Vite
import RatioLesson from "../../subjects/math/lessons/T11_6_0_EN.mdx";

export default define.page(function RatioLessonEN() {
  return (
    <div class="app-shell">
      <TitleBar />
      <div class="app-body">
        <Sidebar />
        <article class="mdx-lesson">
          <RatioLesson />
        </article>
        <LessonSheet
          nodeId="T11_6_0"
          grade="Grade 6"
          lang="EN"
          langLabel="ไทย"
          langHref="/lesson/T11_6_0_TH"
          nextHref="/lesson/T11_6_1_EN"
          nextLabel="Visualize Ratios"
        />
      </div>
    </div>
  );
});
