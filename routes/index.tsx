// Sovereign Academy - Main Layout Route
//
// Assembles the Discord-style UI: TitleBar + Sidebar + MathStage.

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import MathStage from "@/islands/MathStage.tsx";

export default define.page(function Home() {
  return (
    <div class="app-shell">
      {/* Custom frameless title bar */}
      <TitleBar />

      {/* Main content area */}
      <div class="app-body">
        {/* Discord-style channel sidebar */}
        <Sidebar />

        {/* Math exercise stage */}
        <MathStage />
      </div>
    </div>
  );
});
