// Sovereign Academy - Global State (Preact Signals)
//
// Reactive state management that syncs the Topic Sidebar
// with the Math Stage. All islands subscribe to these signals.

import { computed, signal } from "@preact/signals";

// ─── Topic State ─────────────────────────────────────────────────────

export interface SubTopic {
  id: string;
  name: string;
  description: string;
  lessonText?: string;
}

export interface Topic {
  id: number;
  name: string;
  icon: string;
  exerciseCount: number;
  subTopics: SubTopic[];
}

export const TOPICS: Topic[] = [
  {
    id: 1,
    name: "Ratios",
    icon: "⚖️",
    exerciseCount: 96,
    subTopics: [
      { id: "1.1", name: "What is a Ratio?", description: "Comparing two quantities." },
      { id: "1.2", name: "Equivalent Ratios", description: "Scale ratios up or down." },
      { id: "1.3", name: "Unit Rate", description: "Simplify a ratio to 'per one'." },
      { id: "1.4", name: "Proportions", description: "Solve for an unknown in a ratio equation." },
    ],
  },
];

/** Currently selected topic index (1-19). */
export const activeTopic = signal<number>(1);

/** The active Topic object derived from activeTopic. */
export const activeTopicData = computed<Topic>(
  () => TOPICS.find((t) => t.id === activeTopic.value) ?? TOPICS[0],
);

/** Currently selected sub-topic id (e.g. "1.2"), or null if at topic level. */
export const activeSubTopicId = signal<string | null>(null);

/** The active SubTopic object derived from activeSubTopicId and activeTopicData. */
export const activeSubTopicData = computed<SubTopic | null>(() => {
  const id = activeSubTopicId.value;
  if (!id) return null;
  return activeTopicData.value.subTopics.find((st: SubTopic) => st.id === id) ?? null;
});

// ─── Exercise State ──────────────────────────────────────────────────

export interface Exercise {
  id: number;
  type: string; // "arithmetic" | "fraction" | "equation"
  problem: string;
  expectedAnswer: string;
}

/** Current exercise being displayed. */
export const currentExercise = signal<Exercise | null>(null);

/** Current exercise index within the topic. */
export const exerciseIndex = signal<number>(0);

/** Whether an exercise is loading from disk. */
export const isLoading = signal<boolean>(false);

/** Student's typed answer. */
export const studentAnswer = signal<string>("");

/** Result of last validation. */
export interface ValidationResult {
  correct: boolean;
  hint: string;
  problem: string;
  answer: string;
}

export const lastResult = signal<ValidationResult | null>(null);

// ─── Progress Tracking ───────────────────────────────────────────────

/** Map of topic ID → number of exercises completed. */
export const progress = signal<Record<number, number>>({});

/** Total exercises completed across all topics. */
export const totalCompleted = computed<number>(() =>
  (Object.values(progress.value) as number[]).reduce((sum, n) => sum + n, 0)
);

/** Total exercises available (1,823). */
export const TOTAL_EXERCISES = TOPICS.reduce(
  (sum, t) => sum + t.exerciseCount,
  0,
);

// ─── UI State ────────────────────────────────────────────────────────

/** Whether the window is maximized (synced from Rust). */
export const isMaximized = signal<boolean>(false);

/** Whether the sidebar is collapsed (mobile). */
export const sidebarCollapsed = signal<boolean>(false);

// ─── Actions ─────────────────────────────────────────────────────────

/** Select a topic and reset exercise index. */
export function selectTopic(topicId: number): void {
  activeTopic.value = topicId;
  activeSubTopicId.value = null;
  exerciseIndex.value = 0;
  currentExercise.value = null;
  studentAnswer.value = "";
  lastResult.value = null;
}

/** Select a sub-topic within the active topic. */
export function selectSubTopic(subTopicId: string): void {
  activeSubTopicId.value = subTopicId;
  exerciseIndex.value = 0;
  currentExercise.value = null;
  studentAnswer.value = "";
  lastResult.value = null;
}

/** Record that an exercise was completed. */
export function markCompleted(topicId: number): void {
  const current = { ...progress.value };
  current[topicId] = (current[topicId] ?? 0) + 1;
  progress.value = current;
}
