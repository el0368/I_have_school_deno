// ═══════════════════════════════════════════════════════════════════
// Sovereign Academy — State Logic Unit Tests (Vitest)
// ═══════════════════════════════════════════════════════════════════
//
// Tests for lib/state.ts pure functions and signal reactivity.
// Anti-Logic Drift: If state logic changes, these tests must still pass.
// ═══════════════════════════════════════════════════════════════════

import { beforeEach, describe, expect, it } from "vitest";
import {
  activeSubTopicData,
  activeSubTopicId,
  activeTopic,
  activeTopicData,
  currentExercise,
  exerciseIndex,
  isMaximized,
  lastResult,
  markCompleted,
  progress,
  selectSubTopic,
  selectTopic,
  sidebarCollapsed,
  studentAnswer,
  TOPICS,
  TOTAL_EXERCISES,
  totalCompleted,
} from "./state.ts";

// ─── Reset signals between tests ─────────────────────────────────────

beforeEach(() => {
  activeTopic.value = 1;
  activeSubTopicId.value = null;
  exerciseIndex.value = 0;
  currentExercise.value = null;
  studentAnswer.value = "";
  lastResult.value = null;
  progress.value = {};
  isMaximized.value = false;
  sidebarCollapsed.value = false;
});

// ─── TOPICS data integrity ───────────────────────────────────────────

describe("TOPICS", () => {
  it("has exactly 19 topics", () => {
    expect(TOPICS).toHaveLength(19);
  });

  it("every topic has required fields", () => {
    for (const topic of TOPICS) {
      expect(topic.id).toBeTypeOf("number");
      expect(topic.name).toBeTypeOf("string");
      expect(topic.name.length).toBeGreaterThan(0);
      expect(topic.icon).toBeTypeOf("string");
      expect(topic.exerciseCount).toBeGreaterThan(0);
      expect(Array.isArray(topic.subTopics)).toBe(true);
    }
  });

  it("every topic has at least 3 sub-topics", () => {
    for (const topic of TOPICS) {
      expect(topic.subTopics.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("all sub-topic IDs are unique across the whole curriculum", () => {
    const allIds = TOPICS.flatMap((t) => t.subTopics.map((st) => st.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("has unique topic IDs (1-19)", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(19);
    expect(Math.min(...ids)).toBe(1);
    expect(Math.max(...ids)).toBe(19);
  });

  it("TOTAL_EXERCISES sums all exercise counts", () => {
    const manual = TOPICS.reduce((sum, t) => sum + t.exerciseCount, 0);
    expect(TOTAL_EXERCISES).toBe(manual);
  });

  it("TOTAL_EXERCISES is 1814", () => {
    expect(TOTAL_EXERCISES).toBe(1814);
  });
});

// ─── activeTopic / activeTopicData ───────────────────────────────────

describe("activeTopic", () => {
  it("defaults to 1 (Counting)", () => {
    expect(activeTopic.value).toBe(1);
  });

  it("activeTopicData reflects the active topic", () => {
    activeTopic.value = 5;
    expect(activeTopicData.value.id).toBe(5);
    expect(activeTopicData.value.name).toBe("Division");
  });

  it("activeTopicData falls back to TOPICS[0] for invalid ID", () => {
    activeTopic.value = 999;
    expect(activeTopicData.value.id).toBe(1);
    expect(activeTopicData.value.name).toBe("Counting");
  });
});

// ─── selectTopic action ──────────────────────────────────────────────

describe("selectTopic", () => {
  it("sets activeTopic to given ID", () => {
    selectTopic(7);
    expect(activeTopic.value).toBe(7);
  });

  it("resets exerciseIndex to 0", () => {
    exerciseIndex.value = 5;
    selectTopic(3);
    expect(exerciseIndex.value).toBe(0);
  });

  it("clears currentExercise", () => {
    currentExercise.value = {
      id: 1,
      type: "arithmetic",
      problem: "2 + 2",
      expectedAnswer: "4",
    };
    selectTopic(2);
    expect(currentExercise.value).toBeNull();
  });

  it("clears studentAnswer", () => {
    studentAnswer.value = "42";
    selectTopic(4);
    expect(studentAnswer.value).toBe("");
  });

  it("clears lastResult", () => {
    lastResult.value = {
      correct: true,
      hint: "nice",
      problem: "1+1",
      answer: "2",
    };
    selectTopic(1);
    expect(lastResult.value).toBeNull();
  });

  it("clears activeSubTopicId", () => {
    activeSubTopicId.value = "1.2";
    selectTopic(2);
    expect(activeSubTopicId.value).toBeNull();
  });
});

// ─── selectSubTopic action ───────────────────────────────────────────

describe("selectSubTopic", () => {
  it("sets activeSubTopicId", () => {
    activeTopic.value = 6;
    selectSubTopic("6.2");
    expect(activeSubTopicId.value).toBe("6.2");
  });

  it("activeSubTopicData resolves to the correct sub-topic", () => {
    activeTopic.value = 6;
    selectSubTopic("6.2");
    expect(activeSubTopicData.value?.name).toBe("Equivalent Fractions");
  });

  it("activeSubTopicData is null when no sub-topic selected", () => {
    activeTopic.value = 1;
    activeSubTopicId.value = null;
    expect(activeSubTopicData.value).toBeNull();
  });

  it("clears exerciseIndex, currentExercise, studentAnswer, lastResult", () => {
    exerciseIndex.value = 5;
    studentAnswer.value = "test";
    activeTopic.value = 1;
    selectSubTopic("1.1");
    expect(exerciseIndex.value).toBe(0);
    expect(studentAnswer.value).toBe("");
    expect(currentExercise.value).toBeNull();
    expect(lastResult.value).toBeNull();
  });
});

// ─── markCompleted action ────────────────────────────────────────────

describe("markCompleted", () => {
  it("increments progress for a topic", () => {
    markCompleted(1);
    expect(progress.value[1]).toBe(1);
  });

  it("accumulates across multiple calls", () => {
    markCompleted(1);
    markCompleted(1);
    markCompleted(1);
    expect(progress.value[1]).toBe(3);
  });

  it("tracks progress independently per topic", () => {
    markCompleted(1);
    markCompleted(2);
    markCompleted(2);
    expect(progress.value[1]).toBe(1);
    expect(progress.value[2]).toBe(2);
  });

  it("updates totalCompleted computed signal", () => {
    expect(totalCompleted.value).toBe(0);
    markCompleted(1);
    markCompleted(5);
    expect(totalCompleted.value).toBe(2);
  });
});

// ─── UI state signals ────────────────────────────────────────────────

describe("UI signals", () => {
  it("isMaximized defaults to false", () => {
    expect(isMaximized.value).toBe(false);
  });

  it("sidebarCollapsed defaults to false", () => {
    expect(sidebarCollapsed.value).toBe(false);
  });

  it("isMaximized is togglable", () => {
    isMaximized.value = true;
    expect(isMaximized.value).toBe(true);
    isMaximized.value = false;
    expect(isMaximized.value).toBe(false);
  });

  it("sidebarCollapsed is togglable", () => {
    sidebarCollapsed.value = true;
    expect(sidebarCollapsed.value).toBe(true);
  });
});

// ─── Signal determinism (Anti-Logic Drift) ───────────────────────────

describe("determinism", () => {
  it("selectTopic → markCompleted produces same state 100 times", () => {
    for (let i = 0; i < 100; i++) {
      // Reset
      activeTopic.value = 1;
      progress.value = {};

      selectTopic(3);
      markCompleted(3);
      markCompleted(3);

      expect(activeTopic.value).toBe(3);
      expect(progress.value[3]).toBe(2);
      expect(totalCompleted.value).toBe(2);
    }
  });
});
