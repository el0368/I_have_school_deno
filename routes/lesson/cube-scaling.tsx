// Sovereign Academy — Cube Scaling Lesson
// Route: /lesson/cube-scaling
// Renders the MDX lesson file directly as a Preact component.

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import LessonSheet from "@/islands/LessonSheet.tsx";
// @ts-ignore — MDX module types resolved at build time by Vite
import CubeLesson from "../../subjects/math/lessons/cube-scaling.mdx";

export default define.page(function CubeScalingPage() {
  return (
    <div class="app-shell">
      <TitleBar />
      <div class="app-body">
        <Sidebar />
        <article class="mdx-lesson">
          <CubeLesson />
        </article>
        <LessonSheet
          nodeId="SAMPLE_CUBE"
          grade="Grade 6"
          nextHref="/lesson/T11_6_0_EN"
          nextLabel="Intro to Ratios"
        />
      </div>
    </div>
  );
});
