// Sovereign Academy - Custom Title Bar Island
//
// Discord-style draggable title bar with window controls.
// Communicates with Rust FFI to minimize/maximize/close the native window.

import { useSignal, useSignalEffect } from "@preact/signals";
import { isMaximized } from "../lib/state.ts";

export default function TitleBar() {
  const isHoverMin = useSignal(false);
  const isHoverMax = useSignal(false);
  const isHoverClose = useSignal(false);

  // Window controls — try wry IPC first, then browser fallback
  // deno-lint-ignore no-explicit-any
  const ipc = () => (globalThis as any).ipc;

  // Sync maximized state to body class for CSS adjustments
  useSignalEffect(() => {
    if (isMaximized.value) {
      document.body.classList.add("maximized");
    } else {
      document.body.classList.remove("maximized");
    }
  });

  const handleMinimize = () => {
    if (ipc()) {
      ipc().postMessage("minimize");
    }
    // Browser mode: native browser chrome handles minimize
  };

  const handleMaximize = () => {
    if (ipc()) {
      ipc().postMessage("maximize");
    }
    isMaximized.value = !isMaximized.value;
    // Browser mode: native browser chrome handles maximize
  };

  const handleClose = () => {
    if (ipc()) {
      ipc().postMessage("close");
    } else {
      // Browser / WebUI mode
      globalThis.close?.();
    }
  };

  return (
    <div
      class="title-bar"
      style={{ WebkitAppRegion: "drag" } as Record<string, string>}
    >
      {/* App icon + name */}
      <div class="title-bar-left">
        <span class="title-bar-icon">🏛️</span>
        <span class="title-bar-text">Sovereign Academy</span>
      </div>

      {/* Window controls (no-drag zone) */}
      <div
        class="title-bar-controls"
        style={{ WebkitAppRegion: "no-drag" } as Record<string, string>}
      >
        {/* Minimize */}
        <button
          type="button"
          class={`title-btn title-btn-minimize ${isHoverMin.value ? "title-btn-hover" : ""}`}
          onClick={handleMinimize}
          onMouseEnter={() => (isHoverMin.value = true)}
          onMouseLeave={() => (isHoverMin.value = false)}
          title="Minimize"
          aria-label="Minimize window"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line
              x1="0"
              y1="0.5"
              x2="10"
              y2="0.5"
              stroke="currentColor"
              stroke-width="1"
            />
          </svg>
        </button>

        {/* Maximize / Restore */}
        <button
          type="button"
          class={`title-btn title-btn-maximize ${isHoverMax.value ? "title-btn-hover" : ""}`}
          onClick={handleMaximize}
          onMouseEnter={() => (isHoverMax.value = true)}
          onMouseLeave={() => (isHoverMax.value = false)}
          title={isMaximized.value ? "Restore" : "Maximize"}
          aria-label={isMaximized.value ? "Restore window" : "Maximize window"}
        >
          {isMaximized.value
            ? (
              // Restore icon (two overlapping squares)
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="2"
                  y="0"
                  width="8"
                  height="8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                />
                <rect
                  x="0"
                  y="2"
                  width="8"
                  height="8"
                  fill="var(--bg-titlebar)"
                  stroke="currentColor"
                  stroke-width="1"
                />
              </svg>
            )
            : (
              // Maximize icon (single square)
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect
                  x="0"
                  y="0"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                />
              </svg>
            )}
        </button>

        {/* Close */}
        <button
          type="button"
          class={`title-btn title-btn-close ${isHoverClose.value ? "title-btn-close-hover" : ""}`}
          onClick={handleClose}
          onMouseEnter={() => (isHoverClose.value = true)}
          onMouseLeave={() => (isHoverClose.value = false)}
          title="Close"
          aria-label="Close window"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line
              x1="0"
              y1="0"
              x2="10"
              y2="10"
              stroke="currentColor"
              stroke-width="1.2"
            />
            <line
              x1="10"
              y1="0"
              x2="0"
              y2="10"
              stroke="currentColor"
              stroke-width="1.2"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
