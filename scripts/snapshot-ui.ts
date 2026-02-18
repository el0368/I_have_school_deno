// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — UI Component Snapshot Generator (Phase 6.2)
// ═══════════════════════════════════════════════════════════════════
//
// Captures Discord theme structure and component class names
// for visual regression detection.
// NO timestamps, NO randomness — safe for git bisect.
//
// Usage: deno run --allow-read --allow-write scripts/snapshot-ui.ts
// ═══════════════════════════════════════════════════════════════════

interface ComponentSnapshot {
  name: string;
  file: string;
  requiredClasses: string[];
  requiredElements: string[];
  requiredSignals: string[];
  criticalBehaviors: string[];
}

interface ThemeSnapshot {
  cssFile: string;
  requiredVariables: string[];
  requiredColors: Record<string, string>;
  requiredBreakpoints: string[];
}

// ─── Component Snapshots ─────────────────────────────────────────────

const COMPONENTS: ComponentSnapshot[] = [
  {
    name: "TitleBar",
    file: "islands/TitleBar.tsx",
    requiredClasses: [
      "title-bar",
      "title-bar-drag",
      "title-bar-buttons",
      "title-btn",
      "title-btn-close",
    ],
    requiredElements: [
      "minimize button (SVG icon)",
      "maximize/restore button (SVG icon)",
      "close button (SVG icon)",
      "drag region (full title bar width)",
    ],
    requiredSignals: [
      "isMaximized (from lib/state.ts)",
    ],
    criticalBehaviors: [
      "-webkit-app-region: drag on drag zone",
      "-webkit-app-region: no-drag on buttons",
      "IPC: minimize → window.ipc.postMessage('minimize')",
      "IPC: maximize → window.ipc.postMessage('maximize')",
      "IPC: close → window.ipc.postMessage('close')",
      "Close button hover: red background (#f23f43)",
    ],
  },
  {
    name: "Sidebar",
    file: "islands/Sidebar.tsx",
    requiredClasses: [
      "sidebar",
      "channel-list",
      "channel-link",
      "channel-active",
      "sidebar-progress",
      "user-area",
    ],
    requiredElements: [
      "19 topic channels (Counting through Probability)",
      "Category header: MATH TOPICS",
      "Progress badge per topic (percentage)",
      "Global progress bar (0-100%)",
      "User area at bottom",
    ],
    requiredSignals: [
      "activeTopic (which channel is selected)",
      "progress (per-topic completion count)",
      "totalCompleted (global counter)",
      "sidebarCollapsed (mobile toggle)",
    ],
    criticalBehaviors: [
      "selectTopic(id) resets exercise state",
      "Active channel highlighted with brand color (#5865f2)",
      "Collapsible on mobile (< 768px)",
    ],
  },
  {
    name: "MathStage",
    file: "islands/MathStage.tsx",
    requiredClasses: [
      "math-stage",
      "stage-header",
      "stage-content",
      "exercise-card",
      "exercise-problem",
      "exercise-form",
      "exercise-input",
      "exercise-submit",
      "exercise-skip",
      "exercise-result",
      "result-correct",
      "result-incorrect",
      "stage-wasm-badge",
      "streak-badge",
      "success-overlay",
    ],
    requiredElements: [
      "Channel header with # icon",
      "WASM badge (when engine loaded)",
      "Exercise type badge",
      "Problem display (monospace)",
      "Answer text input",
      "Check button",
      "Skip button",
      "Result feedback (✅/❌ + hint)",
      "Streak counter (🔥)",
      "Success overlay (🎉)",
    ],
    requiredSignals: [
      "activeTopic / activeTopicData",
      "currentExercise",
      "exerciseIndex",
      "isLoading",
      "studentAnswer",
      "lastResult",
    ],
    criticalBehaviors: [
      "WASM loads on mount (dynamic fetch+blob import)",
      "Exercise loads when topic/index changes",
      "Submit validates via WASM (or JS fallback)",
      "Correct answer: green flash + auto-advance 1.5s",
      "Wrong answer: red flash + hint",
      "Streak increments on consecutive correct",
      "Skip resets streak",
    ],
  },
];

// ─── Theme Snapshot ──────────────────────────────────────────────────

const THEME: ThemeSnapshot = {
  cssFile: "static/discord.css",
  requiredVariables: [
    "--background-primary",
    "--background-secondary",
    "--background-tertiary",
    "--text-normal",
    "--text-muted",
    "--header-primary",
    "--brand-500",
    "--green-360",
    "--red-400",
  ],
  requiredColors: {
    "background-primary": "#313338",
    "background-secondary": "#2b2d31",
    "background-tertiary": "#1e1f22",
    "brand-500": "#5865f2",
    "green-360": "#23a559",
    "red-400": "#f23f43",
  },
  requiredBreakpoints: [
    "768px (mobile/desktop boundary)",
  ],
};

// ─── Generate Snapshots ──────────────────────────────────────────────

function generateComponentSnapshot(comp: ComponentSnapshot): string {
  const lines: string[] = [];

  lines.push(`<!DOCTYPE html>`);
  lines.push(`<html lang="en">`);
  lines.push(`<head>`);
  lines.push(`  <meta charset="utf-8">`);
  lines.push(`  <title>UI Snapshot: ${comp.name}</title>`);
  lines.push(`  <style>`);
  lines.push(
    `    body { font-family: 'gg sans', 'Noto Sans', sans-serif; background: #1e1f22; color: #dbdee1; padding: 24px; }`,
  );
  lines.push(
    `    h1 { color: #f2f3f5; border-bottom: 1px solid #3f4147; padding-bottom: 8px; }`,
  );
  lines.push(
    `    h2 { color: #b5bac1; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; }`,
  );
  lines.push(
    `    .section { background: #2b2d31; border-radius: 8px; padding: 16px; margin: 12px 0; }`,
  );
  lines.push(`    .item { padding: 4px 0; color: #dbdee1; font-size: 14px; }`);
  lines.push(
    `    .class-name { color: #5865f2; font-family: 'Consolas', monospace; }`,
  );
  lines.push(
    `    .signal-name { color: #23a559; font-family: 'Consolas', monospace; }`,
  );
  lines.push(`    .behavior { color: #fee75c; }`);
  lines.push(
    `    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px; }`,
  );
  lines.push(`    .tag-class { background: #5865f220; color: #5865f2; }`);
  lines.push(`    .tag-signal { background: #23a55920; color: #23a559; }`);
  lines.push(`  </style>`);
  lines.push(`</head>`);
  lines.push(`<body>`);
  lines.push(`  <h1>${comp.name}</h1>`);
  lines.push(`  <p>Source: <code>${comp.file}</code></p>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Required CSS Classes</h2>`);
  for (const cls of comp.requiredClasses) {
    lines.push(
      `    <div class="item"><span class="tag tag-class">.${cls}</span></div>`,
    );
  }
  lines.push(`  </div>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Required Elements</h2>`);
  for (const el of comp.requiredElements) {
    lines.push(`    <div class="item">• ${el}</div>`);
  }
  lines.push(`  </div>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Preact Signals</h2>`);
  for (const sig of comp.requiredSignals) {
    lines.push(
      `    <div class="item"><span class="tag tag-signal">${sig}</span></div>`,
    );
  }
  lines.push(`  </div>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Critical Behaviors</h2>`);
  for (const beh of comp.criticalBehaviors) {
    lines.push(`    <div class="item behavior">⚡ ${beh}</div>`);
  }
  lines.push(`  </div>`);
  lines.push(`</body>`);
  lines.push(`</html>`);

  return lines.join("\n");
}

function generateThemeSnapshot(): string {
  const lines: string[] = [];

  lines.push(`<!DOCTYPE html>`);
  lines.push(`<html lang="en">`);
  lines.push(`<head>`);
  lines.push(`  <meta charset="utf-8">`);
  lines.push(`  <title>UI Snapshot: Discord Theme</title>`);
  lines.push(`  <style>`);
  lines.push(
    `    body { font-family: 'gg sans', 'Noto Sans', sans-serif; background: #1e1f22; color: #dbdee1; padding: 24px; }`,
  );
  lines.push(
    `    h1 { color: #f2f3f5; border-bottom: 1px solid #3f4147; padding-bottom: 8px; }`,
  );
  lines.push(
    `    h2 { color: #b5bac1; font-size: 14px; text-transform: uppercase; letter-spacing: 0.02em; }`,
  );
  lines.push(
    `    .section { background: #2b2d31; border-radius: 8px; padding: 16px; margin: 12px 0; }`,
  );
  lines.push(
    `    .color-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }`,
  );
  lines.push(
    `    .color-swatch { width: 32px; height: 32px; border-radius: 4px; border: 1px solid #3f4147; }`,
  );
  lines.push(
    `    .color-name { font-family: 'Consolas', monospace; color: #b5bac1; }`,
  );
  lines.push(
    `    .color-value { font-family: 'Consolas', monospace; color: #dbdee1; }`,
  );
  lines.push(`  </style>`);
  lines.push(`</head>`);
  lines.push(`<body>`);
  lines.push(`  <h1>Discord Theme Snapshot</h1>`);
  lines.push(`  <p>Source: <code>${THEME.cssFile}</code></p>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Required CSS Variables</h2>`);
  for (const v of THEME.requiredVariables) {
    lines.push(
      `    <div class="color-row"><span class="color-name">${v}</span></div>`,
    );
  }
  lines.push(`  </div>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Required Colors</h2>`);
  for (const [name, hex] of Object.entries(THEME.requiredColors)) {
    lines.push(`    <div class="color-row">`);
    lines.push(
      `      <div class="color-swatch" style="background:${hex}"></div>`,
    );
    lines.push(`      <span class="color-name">${name}</span>`);
    lines.push(`      <span class="color-value">${hex}</span>`);
    lines.push(`    </div>`);
  }
  lines.push(`  </div>`);
  lines.push(``);
  lines.push(`  <div class="section">`);
  lines.push(`    <h2>Responsive Breakpoints</h2>`);
  for (const bp of THEME.requiredBreakpoints) {
    lines.push(
      `    <div class="color-row"><span class="color-name">@media (max-width: ${bp})</span></div>`,
    );
  }
  lines.push(`  </div>`);
  lines.push(`</body>`);
  lines.push(`</html>`);

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  await Deno.mkdir("tests/golden", { recursive: true });

  // Generate component snapshots
  for (const comp of COMPONENTS) {
    const html = generateComponentSnapshot(comp);
    const filename = `ui-${comp.name.toLowerCase()}.html`;
    const outPath = `tests/golden/${filename}`;
    await Deno.writeTextFile(outPath, html);
    console.log(`✅ ${comp.name} snapshot → ${outPath}`);
  }

  // Generate theme snapshot
  const themeHtml = generateThemeSnapshot();
  await Deno.writeTextFile("tests/golden/ui-theme.html", themeHtml);
  console.log(`✅ Theme snapshot → tests/golden/ui-theme.html`);

  console.log(
    `\n   ${COMPONENTS.length} component snapshots + 1 theme snapshot generated`,
  );
}

main();
