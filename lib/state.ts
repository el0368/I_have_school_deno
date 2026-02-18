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
    name: "Counting",
    icon: "🔢",
    exerciseCount: 96,
    subTopics: [
      { id: "1.1", name: "Count to 10", description: "Count objects from 1 to 10." },
      { id: "1.2", name: "Count to 100", description: "Skip-counting by 1s, 2s, 5s, and 10s." },
      {
        id: "1.3",
        name: "Ordinal Numbers",
        description: "First, second, third… understanding order.",
      },
      {
        id: "1.4",
        name: "Number Patterns",
        description: "Identify and extend simple number sequences.",
      },
    ],
  },
  {
    id: 2,
    name: "Addition",
    icon: "➕",
    exerciseCount: 96,
    subTopics: [
      { id: "2.1", name: "Adding Single Digits", description: "Basic facts: sums up to 18." },
      {
        id: "2.2",
        name: "Adding Double Digits",
        description: "Two-digit addition without regrouping.",
      },
      {
        id: "2.3",
        name: "Addition with Regrouping",
        description: "Carrying over to the next column.",
      },
      { id: "2.4", name: "Adding Three Numbers", description: "Associative property in action." },
    ],
  },
  {
    id: 3,
    name: "Subtraction",
    icon: "➖",
    exerciseCount: 96,
    subTopics: [
      {
        id: "3.1",
        name: "Basic Subtraction",
        description: "Subtract single digits from numbers up to 18.",
      },
      {
        id: "3.2",
        name: "Subtracting Double Digits",
        description: "Two-digit subtraction without borrowing.",
      },
      {
        id: "3.3",
        name: "Subtraction with Borrowing",
        description: "Regrouping across place values.",
      },
      {
        id: "3.4",
        name: "Subtraction Word Problems",
        description: "Apply subtraction to real-world scenarios.",
      },
    ],
  },
  {
    id: 4,
    name: "Multiplication",
    icon: "✖️",
    exerciseCount: 96,
    subTopics: [
      {
        id: "4.1",
        name: "Times Tables (1–5)",
        description: "Fluency with multiplication facts 1 through 5.",
      },
      {
        id: "4.2",
        name: "Times Tables (6–10)",
        description: "Fluency with multiplication facts 6 through 10.",
      },
      {
        id: "4.3",
        name: "Multiply by 10s & 100s",
        description: "Patterns when multiplying by powers of 10.",
      },
      {
        id: "4.4",
        name: "Multi-digit Multiplication",
        description: "Long multiplication with two or more digits.",
      },
    ],
  },
  {
    id: 5,
    name: "Division",
    icon: "➗",
    exerciseCount: 96,
    subTopics: [
      {
        id: "5.1",
        name: "Division as Sharing",
        description: "Understand division as equal grouping.",
      },
      { id: "5.2", name: "Basic Division Facts", description: "Inverse of times tables 1–10." },
      {
        id: "5.3",
        name: "Division with Remainders",
        description: "What's left over when it doesn't divide evenly.",
      },
      { id: "5.4", name: "Long Division", description: "Step-by-step division of larger numbers." },
    ],
  },
  {
    id: 6,
    name: "Fractions",
    icon: "🥧",
    exerciseCount: 96,
    subTopics: [
      {
        id: "6.1",
        name: "What is a Fraction?",
        description: "Parts of a whole: numerator and denominator.",
      },
      {
        id: "6.2",
        name: "Equivalent Fractions",
        description: "Different fractions that represent the same value.",
      },
      {
        id: "6.3",
        name: "Comparing Fractions",
        description: "Which fraction is larger or smaller?",
      },
      {
        id: "6.4",
        name: "Adding & Subtracting Fractions",
        description: "Operations with like and unlike denominators.",
      },
      {
        id: "6.5",
        name: "Multiplying Fractions",
        description: "Multiply numerators and denominators.",
      },
      {
        id: "6.6",
        name: "Dividing Fractions",
        description: "Invert and multiply (keep-change-flip).",
      },
    ],
  },
  {
    id: 7,
    name: "Decimals",
    icon: "🔵",
    exerciseCount: 96,
    subTopics: [
      { id: "7.1", name: "Tenths & Hundredths", description: "Place value for decimal digits." },
      { id: "7.2", name: "Comparing Decimals", description: "Which decimal is greater?" },
      {
        id: "7.3",
        name: "Adding & Subtracting Decimals",
        description: "Line up the decimal points.",
      },
      {
        id: "7.4",
        name: "Multiplying Decimals",
        description: "Count decimal places in the product.",
      },
    ],
  },
  {
    id: 8,
    name: "Percentages",
    icon: "💯",
    exerciseCount: 96,
    subTopics: [
      {
        id: "8.1",
        name: "What is a Percent?",
        description: "Parts per hundred — connecting to fractions.",
      },
      {
        id: "8.2",
        name: "Percent of a Number",
        description: "Calculate a percentage of any value.",
      },
      {
        id: "8.3",
        name: "Percent Increase & Decrease",
        description: "How much did something change?",
      },
      {
        id: "8.4",
        name: "Fractions, Decimals, Percents",
        description: "Convert between all three forms.",
      },
    ],
  },
  {
    id: 9,
    name: "Ratios",
    icon: "⚖️",
    exerciseCount: 96,
    subTopics: [
      { id: "9.1", name: "What is a Ratio?", description: "Comparing two quantities." },
      { id: "9.2", name: "Equivalent Ratios", description: "Scale ratios up or down." },
      { id: "9.3", name: "Unit Rate", description: "Simplify a ratio to 'per one'." },
      { id: "9.4", name: "Proportions", description: "Solve for an unknown in a ratio equation." },
    ],
  },
  {
    id: 10,
    name: "Exponents",
    icon: "📐",
    exerciseCount: 96,
    subTopics: [
      {
        id: "10.1",
        name: "What is an Exponent?",
        description: "Repeated multiplication shorthand.",
      },
      {
        id: "10.2",
        name: "Powers of 10",
        description: "Exponents with base 10 and scientific notation.",
      },
      {
        id: "10.3",
        name: "Exponent Rules",
        description: "Product, quotient, power, zero, and negative rules.",
      },
      {
        id: "10.4",
        name: "Evaluating Expressions",
        description: "Simplify expressions with multiple exponents.",
      },
    ],
  },
  {
    id: 11,
    name: "Square Roots",
    icon: "√",
    exerciseCount: 96,
    subTopics: [
      {
        id: "11.1",
        name: "Perfect Squares",
        description: "Numbers with whole-number square roots.",
      },
      {
        id: "11.2",
        name: "Estimating Square Roots",
        description: "Find non-perfect square roots approximately.",
      },
      {
        id: "11.3",
        name: "Simplifying Radicals",
        description: "Factor out perfect squares from under the root.",
      },
      {
        id: "11.4",
        name: "The Pythagorean Theorem",
        description: "a² + b² = c² — apply square roots to triangles.",
      },
    ],
  },
  {
    id: 12,
    name: "Order of Ops",
    icon: "📋",
    exerciseCount: 96,
    subTopics: [
      {
        id: "12.1",
        name: "PEMDAS Introduction",
        description: "Parentheses, Exponents, Multiply/Divide, Add/Subtract.",
      },
      {
        id: "12.2",
        name: "Expressions with Parentheses",
        description: "Evaluate innermost first.",
      },
      {
        id: "12.3",
        name: "Mixed Operations",
        description: "Multi-step problems requiring full PEMDAS.",
      },
    ],
  },
  {
    id: 13,
    name: "Variables",
    icon: "🔤",
    exerciseCount: 96,
    subTopics: [
      {
        id: "13.1",
        name: "What is a Variable?",
        description: "Letters that represent unknown numbers.",
      },
      {
        id: "13.2",
        name: "Evaluating Expressions",
        description: "Substitute a value in for the variable.",
      },
      {
        id: "13.3",
        name: "Writing Expressions",
        description: "Translate word problems into algebraic notation.",
      },
      {
        id: "13.4",
        name: "Combining Like Terms",
        description: "Simplify by adding/subtracting same-variable terms.",
      },
    ],
  },
  {
    id: 14,
    name: "Equations",
    icon: "⚡",
    exerciseCount: 96,
    subTopics: [
      {
        id: "14.1",
        name: "One-Step Equations",
        description: "Solve for x with a single operation.",
      },
      {
        id: "14.2",
        name: "Two-Step Equations",
        description: "Undo two operations to isolate the variable.",
      },
      {
        id: "14.3",
        name: "Equations with Variables on Both Sides",
        description: "Move all x terms to one side.",
      },
      {
        id: "14.4",
        name: "Word Problems to Equations",
        description: "Build and solve equations from context.",
      },
    ],
  },
  {
    id: 15,
    name: "Inequalities",
    icon: "↔️",
    exerciseCount: 96,
    subTopics: [
      {
        id: "15.1",
        name: "Inequality Symbols",
        description: "Greater than, less than, and equal to.",
      },
      {
        id: "15.2",
        name: "Graphing on a Number Line",
        description: "Open and closed circles for boundaries.",
      },
      {
        id: "15.3",
        name: "Solving Inequalities",
        description: "Same as equations — but flip when multiplying by negative.",
      },
      {
        id: "15.4",
        name: "Compound Inequalities",
        description: "AND / OR — multiple conditions at once.",
      },
    ],
  },
  {
    id: 16,
    name: "Geometry",
    icon: "📐",
    exerciseCount: 96,
    subTopics: [
      {
        id: "16.1",
        name: "Shapes & Properties",
        description: "Triangles, quadrilaterals, circles — sides and angles.",
      },
      {
        id: "16.2",
        name: "Perimeter",
        description: "Total distance around the outside of a shape.",
      },
      { id: "16.3", name: "Area", description: "Amount of space inside a two-dimensional shape." },
      {
        id: "16.4",
        name: "Volume",
        description: "Amount of space inside a three-dimensional shape.",
      },
      {
        id: "16.5",
        name: "Angles",
        description: "Acute, right, obtuse, straight — measuring with degrees.",
      },
    ],
  },
  {
    id: 17,
    name: "Measurement",
    icon: "📏",
    exerciseCount: 91,
    subTopics: [
      {
        id: "17.1",
        name: "Length & Distance",
        description: "Inches, feet, cm, meters — converting between units.",
      },
      { id: "17.2", name: "Weight & Mass", description: "Ounces, pounds, grams, kilograms." },
      { id: "17.3", name: "Capacity & Volume", description: "Cups, liters, gallons." },
      { id: "17.4", name: "Time", description: "Reading clocks, elapsed time, AM/PM." },
    ],
  },
  {
    id: 18,
    name: "Data & Stats",
    icon: "📊",
    exerciseCount: 96,
    subTopics: [
      { id: "18.1", name: "Mean, Median, Mode", description: "Measures of central tendency." },
      { id: "18.2", name: "Range", description: "The spread of the data set." },
      { id: "18.3", name: "Reading Charts & Graphs", description: "Bar, line, and pie charts." },
      {
        id: "18.4",
        name: "Creating Data Displays",
        description: "Organize raw data into a chart.",
      },
    ],
  },
  {
    id: 19,
    name: "Probability",
    icon: "🎲",
    exerciseCount: 91,
    subTopics: [
      {
        id: "19.1",
        name: "What is Probability?",
        description: "Likelihood of an event expressed as a fraction.",
      },
      {
        id: "19.2",
        name: "Simple Probability",
        description: "Calculate probability of a single event.",
      },
      {
        id: "19.3",
        name: "Compound Probability",
        description: "Independent and dependent events.",
      },
      { id: "19.4", name: "Sample Space", description: "All possible outcomes of an experiment." },
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
