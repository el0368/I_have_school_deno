// Sovereign Academy — แนะนำอัตราส่วน (ภาษาไทย)
// Route: /lesson/T11_6_0_TH

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";
// @ts-ignore — MDX module types resolved at build time by Vite
import RatioLesson from "../../subjects/math/lessons/T11_6_0_TH.mdx";

export default define.page(function RatioLessonTH() {
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
          grade="ชั้น ป.6"
          lang="TH"
          langLabel="English"
          langHref="/lesson/T11_6_0_EN"
          nextHref="/lesson/T11_6_1_TH"
          nextLabel="แสดงภาพอัตราส่วน"
        />
      </div>
    </div>
  );
});
