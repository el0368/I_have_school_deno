// Sovereign Academy - Main Layout Route
//
// Assembles the Discord-style UI: TitleBar + Sidebar + MathStage + LessonToc.

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import MathStage from "@/islands/MathStage.tsx";
import LessonToc from "@/islands/LessonToc.tsx";
import { sidebarCollapsed } from "@/lib/state.ts";

export default define.page(function Home() {
  return (
    <div class="app-shell">
      {/* Custom frameless title bar */}
      <TitleBar />

      {/* Main content area (CSS Grid) */}
      <div
        class={`app-body ${sidebarCollapsed.value ? "collapsed-sidebar" : ""}`}
      >
        {/* Discord-style channel sidebar */}
        <Sidebar />

        {/* Math exercise stage */}
        <MathStage />

        {/* Right sidebar: Table of contents & related topics */}
        <LessonToc />
      </div>
    </div>
  );
});
