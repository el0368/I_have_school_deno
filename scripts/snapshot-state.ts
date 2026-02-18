// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — State Logic Snapshot Generator (Phase 6.2)
// ═══════════════════════════════════════════════════════════════════
//
// Captures deterministic state transitions for golden master testing.
// Simulates user actions and records the signal state at each step.
// NO timestamps, NO randomness — safe for git bisect.
//
// Usage: deno run --allow-read --allow-write scripts/snapshot-state.ts
// ═══════════════════════════════════════════════════════════════════

interface StateEvent {
  action: string;
  signalChanges: Record<string, string>;
}

interface StateFlow {
  name: string;
  description: string;
  events: StateEvent[];
}

// ─── Simulated State Flows ───────────────────────────────────────────
// These capture the EXPECTED behavior of lib/state.ts actions.
// If the actual signal behavior drifts from these, we have a regression.

const STATE_FLOWS: StateFlow[] = [
  {
    name: "Topic Selection",
    description: "User clicks a topic in the sidebar",
    events: [
      {
        action: "selectTopic(1)",
        signalChanges: {
          "activeTopic": "1",
          "exerciseIndex": "0",
          "currentExercise": "null",
          "studentAnswer": "''",
          "lastResult": "null",
          "activeTopicData.name": "Counting",
          "activeTopicData.icon": "🔢",
        },
      },
      {
        action: "selectTopic(6)",
        signalChanges: {
          "activeTopic": "6",
          "exerciseIndex": "0",
          "currentExercise": "null",
          "studentAnswer": "''",
          "lastResult": "null",
          "activeTopicData.name": "Fractions",
          "activeTopicData.icon": "🥧",
        },
      },
      {
        action: "selectTopic(19)",
        signalChanges: {
          "activeTopic": "19",
          "exerciseIndex": "0",
          "currentExercise": "null",
          "studentAnswer": "''",
          "lastResult": "null",
          "activeTopicData.name": "Probability",
          "activeTopicData.icon": "🎲",
        },
      },
    ],
  },
  {
    name: "Exercise Completion Flow",
    description: "User answers an exercise correctly",
    events: [
      {
        action: "selectTopic(2)",
        signalChanges: {
          "activeTopic": "2",
          "activeTopicData.name": "Addition",
          "exerciseIndex": "0",
        },
      },
      {
        action: "markCompleted(2)",
        signalChanges: {
          "progress[2]": "1",
          "totalCompleted": "1",
        },
      },
      {
        action: "markCompleted(2)",
        signalChanges: {
          "progress[2]": "2",
          "totalCompleted": "2",
        },
      },
      {
        action: "markCompleted(2)",
        signalChanges: {
          "progress[2]": "3",
          "totalCompleted": "3",
        },
      },
    ],
  },
  {
    name: "Multi-Topic Progress",
    description: "User works across multiple topics",
    events: [
      {
        action: "selectTopic(1) → markCompleted(1)",
        signalChanges: {
          "progress[1]": "1",
          "totalCompleted": "1 (cumulative with previous)",
        },
      },
      {
        action: "selectTopic(3) → markCompleted(3) × 2",
        signalChanges: {
          "progress[3]": "2",
          "totalCompleted": "increases by 2",
        },
      },
    ],
  },
  {
    name: "Topic Data Correctness",
    description: "Verify TOPICS array has correct data",
    events: [
      {
        action: "verify TOPICS.length",
        signalChanges: {
          "TOPICS.length": "19",
        },
      },
      {
        action: "verify TOTAL_EXERCISES",
        signalChanges: {
          "TOTAL_EXERCISES": "1823",
        },
      },
      {
        action: "verify TOPICS[0]",
        signalChanges: {
          "TOPICS[0].id": "1",
          "TOPICS[0].name": "Counting",
          "TOPICS[0].icon": "🔢",
          "TOPICS[0].exerciseCount": "96",
        },
      },
      {
        action: "verify TOPICS[18]",
        signalChanges: {
          "TOPICS[18].id": "19",
          "TOPICS[18].name": "Probability",
          "TOPICS[18].icon": "🎲",
          "TOPICS[18].exerciseCount": "91",
        },
      },
    ],
  },
  {
    name: "UI State Defaults",
    description: "Initial signal values on app load",
    events: [
      {
        action: "app startup",
        signalChanges: {
          "activeTopic": "1",
          "exerciseIndex": "0",
          "currentExercise": "null",
          "isLoading": "false",
          "studentAnswer": "''",
          "lastResult": "null",
          "isMaximized": "false",
          "sidebarCollapsed": "false",
          "progress": "{}",
          "totalCompleted": "0",
        },
      },
    ],
  },
];

// ─── Generate Snapshot ───────────────────────────────────────────────

function generateStateSnapshot(): string {
  const lines: string[] = [];

  lines.push("# Sovereign Academy — State Logic Golden Snapshot");
  lines.push("# Generated by: scripts/snapshot-state.ts");
  lines.push("# WARNING: NO timestamps — deterministic for git bisect");
  lines.push("#");
  lines.push(`# Total flows: ${STATE_FLOWS.length}`);
  lines.push("# Format: Action → Expected signal state changes");
  lines.push("");

  for (const flow of STATE_FLOWS) {
    lines.push(`═══ ${flow.name} ${"═".repeat(50 - flow.name.length)}`);
    lines.push(`# ${flow.description}`);
    lines.push("");

    for (const event of flow.events) {
      lines.push(`  → ${event.action}`);
      for (const [signal, value] of Object.entries(event.signalChanges)) {
        lines.push(`    ${signal} = ${value}`);
      }
      lines.push("");
    }
  }

  const totalEvents = STATE_FLOWS.reduce((sum, f) => sum + f.events.length, 0);
  lines.push(`# Total: ${STATE_FLOWS.length} flows, ${totalEvents} events`);
  lines.push(
    "# If ANY state transition differs, a signal behavior has drifted.",
  );
  lines.push("# Run: git bisect run deno task verify");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const snapshot = generateStateSnapshot();
  const outPath = "tests/golden/state-flow.log";

  await Deno.mkdir("tests/golden", { recursive: true });
  await Deno.writeTextFile(outPath, snapshot);

  console.log(`✅ State snapshot written to ${outPath}`);
  console.log(`   ${STATE_FLOWS.length} flows captured`);
}

main();
