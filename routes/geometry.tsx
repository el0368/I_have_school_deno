// Sovereign Academy - Geometry Lab Route
//
// Interactive 3D volume & surface area simulation for Primary 6.

import { define } from "@/utils.ts";
import TitleBar from "@/islands/TitleBar.tsx";
import Sidebar from "@/islands/Sidebar.tsx";
import VolumeSimulator from "@/islands/VolumeSimulator.tsx";

export default define.page(function Geometry() {
  return (
    <div class="app-shell">
      <TitleBar />
      <div class="app-body">
        <Sidebar />
        <VolumeSimulator />
      </div>
    </div>
  );
});
