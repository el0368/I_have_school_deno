// Sovereign Academy - Math Stage Island
//
// The main content area where exercises are displayed and answered.
// Thin view layer: delegates WASM loading, validation, and exercise
// logic to lib/ modules. Only handles rendering + event wiring.

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { ComponentChildren } from "preact";
import {
  activeTopic,
  activeTopicData,
  currentExercise,
  exerciseIndex,
  isLoading,
  lastResult,
  markCompleted,
  studentAnswer,
} from "../lib/state.ts";
import { generateDemoExercise } from "../lib/exercise-loader.ts";
import { healthStatus, initWasm, wasmModule, wasmReady } from "../lib/wasm-loader.ts";
import VolumeSimulator from "./VolumeSimulator.tsx";
import type { HealthCheck } from "../lib/wasm-health-check.ts";
import { validateAnswer } from "../lib/validation.ts";
import { LESSON_REGISTRY } from "../utils/lesson_registry.ts";

export default function MathStage() {
  const showSuccess = useSignal(false);
  const streak = useSignal(0);
  const advanceTimer = useSignal<ReturnType<typeof setTimeout> | null>(null);
  const mode = useSignal<"lesson" | "practice" | "lab">("lesson");
  const lang = useSignal<"EN" | "TH">("EN");
  // Component to render (default null)
  const LessonComponent = useSignal<(() => ComponentChildren) | null>(null);
  const lessonLoading = useSignal(false);
  const lessonError = useSignal(false);

  // Load WASM module on mount
  useEffect(() => {
    initWasm();
  }, []);

  // Load lesson MDX whenever activeTopic, mode, or lang changes
  useEffect(() => {
    if (mode.value !== "lesson") return;

    // For now we assume Topic 11 (Grade 6) uses this specific ID framework
    // In future, topics will have explicit 'nodeId' properties
    const nodeId = `T11_6_0`;
    const key = `${nodeId}_${lang.value}`;

    lessonLoading.value = true;
    lessonError.value = false;
    LessonComponent.value = null;

    const loadRef = LESSON_REGISTRY[key];

    if (loadRef) {
      loadRef()
        .then((mod) => {
          // MDX modules export the component as default
          // We need to cast it to any because Preact types for MDX are tricky
          // deno-lint-ignore no-explicit-any
          LessonComponent.value = mod.default as any;
        })
        .catch((err) => {
          console.error("Failed to load lesson:", err);
          lessonError.value = true;
        })
        .finally(() => {
          lessonLoading.value = false;
        });
    } else {
      console.warn(`No lesson found for key: ${key}`);
      lessonError.value = true;
      lessonLoading.value = false;
    }
  }, [mode.value, lang.value, activeTopic.value]);

  // Load a new exercise when topic or index changes
  useEffect(() => {
    loadCurrentExercise();
    return () => {
      // Cancel pending auto-advance if topic/index changes
      if (advanceTimer.value !== null) {
        clearTimeout(advanceTimer.value);
        advanceTimer.value = null;
      }
    };
  }, [activeTopic.value, exerciseIndex.value]);

  function loadCurrentExercise() {
    isLoading.value = true;
    studentAnswer.value = "";
    lastResult.value = null;
    showSuccess.value = false;

    try {
      currentExercise.value = generateDemoExercise(
        activeTopic.value,
        exerciseIndex.value,
      );
    } catch (err) {
      console.error("[Stage] Failed to load exercise:", err);
    } finally {
      isLoading.value = false;
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    const exercise = currentExercise.value;
    if (!exercise) return;

    const result = validateAnswer(wasmModule.value, exercise, studentAnswer.value);
    lastResult.value = result;

    if (result.correct) {
      showSuccess.value = true;
      streak.value += 1;
      markCompleted(activeTopic.value);

      // Auto-advance after 1.5s (with cleanup)
      advanceTimer.value = setTimeout(() => {
        exerciseIndex.value += 1;
        advanceTimer.value = null;
      }, 1500);
    } else {
      streak.value = 0;
    }
  }

  function handleSkip() {
    if (advanceTimer.value !== null) {
      clearTimeout(advanceTimer.value);
      advanceTimer.value = null;
    }
    exerciseIndex.value += 1;
    streak.value = 0;
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  }

  const topic = activeTopicData.value;
  const exercise = currentExercise.value;
  // Render the loaded MDX component if available
  const CurrentLesson = LessonComponent.value;

  return (
    <main class="math-stage">
      {/* Stage Header */}
      <div class="stage-header">
        <div class="stage-header-left">
          <span class="stage-hash">#</span>
          <h1 class="stage-title">{topic.icon} {topic.name}</h1>
        </div>
        <div class="stage-header-right">
          {/* Lesson / Practice toggle */}
          <div class="mode-toggle">
            <button
              type="button"
              class={`mode-btn ${mode.value === "lesson" ? "mode-btn-active" : ""}`}
              onClick={() => (mode.value = "lesson")}
            >
              📖 Lesson
            </button>
            <button
              type="button"
              class={`mode-btn ${mode.value === "practice" ? "mode-btn-active" : ""}`}
              onClick={() => (mode.value = "practice")}
            >
              ✏️ Practice
            </button>
            <button
              type="button"
              class={`mode-btn ${mode.value === "lab" ? "mode-btn-active" : ""}`}
              onClick={() => (mode.value = "lab")}
            >
              🧪 Lab
            </button>
          </div>
          {/* Language toggle — only in lesson mode */}
          {mode.value === "lesson" && (
            <div class="lang-toggle">
              <button
                type="button"
                class={`lang-btn ${lang.value === "EN" ? "lang-btn-active" : ""}`}
                onClick={() => (lang.value = "EN")}
              >
                🇬🇧 EN
              </button>
              <button
                type="button"
                class={`lang-btn ${lang.value === "TH" ? "lang-btn-active" : ""}`}
                onClick={() => (lang.value = "TH")}
              >
                🇹🇭 TH
              </button>
            </div>
          )}
          <span class="stage-meta">
            Exercise {exerciseIndex.value + 1} / {topic.exerciseCount}
          </span>
          {wasmReady.value && (
            <span
              class={`stage-wasm-badge ${
                healthStatus.value && !healthStatus.value.passed ? "wasm-badge-warning" : ""
              }`}
              title={healthStatus.value
                ? `Health: ${
                  healthStatus.value.checks.filter((c: HealthCheck) => c.passed).length
                }/${healthStatus.value.checks.length} (${healthStatus.value.duration.toFixed(0)}ms)`
                : "WASM math engine active"}
            >
              {healthStatus.value && !healthStatus.value.passed ? "⚠️ WASM" : "⚡ WASM"}
            </span>
          )}
        </div>
      </div>

      {/* Lesson or Practice Content */}
      <div class="stage-content">
        {/* ── LESSON MODE ── */}
        {mode.value === "lesson" && (
          <div class="lesson-body">
            {lessonLoading.value
              ? (
                <div class="stage-loading">
                  <div class="loading-spinner" />
                  <p>Loading lesson...</p>
                </div>
              )
              : lessonError.value
              ? (
                <div class="stage-empty">
                  <p>⚠️ Lesson content not found.</p>
                </div>
              )
              : CurrentLesson
              ? (
                <>
                  <div class="lesson-markdown">
                    <CurrentLesson />
                  </div>
                  <div class="lesson-cta">
                    <button
                      type="button"
                      class="lesson-start-practice"
                      onClick={() => (mode.value = "practice")}
                    >
                      ✏️ Start Practice
                    </button>
                  </div>
                </>
              )
              : null}
          </div>
        )}

        {/* ── PRACTICE MODE (original exercise flow) ── */}

        {mode.value === "practice" && (
          <>
            {/* Health Check Warning */}
            {healthStatus.value && !healthStatus.value.passed && (
              <div class="health-check-warning">
                <strong>⚠️ WASM Health Check Failed</strong>
                <p>
                  The math engine may produce incorrect results.{" "}
                  {healthStatus.value.checks.filter((c: HealthCheck) => !c.passed).length}{" "}
                  check(s) failed:
                </p>
                <ul>
                  {healthStatus.value.checks.filter((c: HealthCheck) => !c.passed).map((
                    c: HealthCheck,
                  ) => (
                    <li key={c.name}>
                      {c.name}: expected {c.expected}, got {c.actual}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isLoading.value
              ? (
                <div class="stage-loading">
                  <div class="loading-spinner" />
                  <p>Loading exercise...</p>
                </div>
              )
              : exercise
              ? (
                <div class="exercise-card">
                  {/* Streak indicator */}
                  {streak.value > 0 && (
                    <div class="streak-badge">
                      🔥 {streak.value} streak
                    </div>
                  )}

                  {/* Problem display */}
                  <div class="exercise-problem">
                    <span class="exercise-type-badge">{exercise.type}</span>
                    <h2 class="exercise-question">{exercise.problem}</h2>
                  </div>

                  {/* Answer input */}
                  <form onSubmit={handleSubmit} class="exercise-form">
                    <div class="exercise-input-row">
                      <input
                        type="text"
                        class={`exercise-input ${
                          lastResult.value
                            ? lastResult.value.correct ? "input-correct" : "input-incorrect"
                            : ""
                        }`}
                        placeholder="Type your answer..."
                        value={studentAnswer.value}
                        onInput={(e) => {
                          studentAnswer.value = (e.target as HTMLInputElement).value;
                          lastResult.value = null;
                          showSuccess.value = false;
                        }}
                        onKeyDown={handleKeyDown}
                        autofocus
                        disabled={showSuccess.value}
                      />
                      <button
                        type="submit"
                        class="exercise-submit"
                        disabled={!studentAnswer.value.trim() || showSuccess.value}
                      >
                        Check
                      </button>
                      <button
                        type="button"
                        class="exercise-skip"
                        onClick={handleSkip}
                      >
                        Skip →
                      </button>
                    </div>
                  </form>

                  {/* Result feedback */}
                  {lastResult.value && (
                    <div
                      class={`exercise-result ${
                        lastResult.value.correct ? "result-correct" : "result-incorrect"
                      }`}
                    >
                      <span class="result-icon">
                        {lastResult.value.correct ? "✅" : "❌"}
                      </span>
                      <span class="result-text">{lastResult.value.hint}</span>
                    </div>
                  )}

                  {/* Success animation */}
                  {showSuccess.value && (
                    <div class="success-overlay">
                      <span class="success-emoji">🎉</span>
                    </div>
                  )}
                </div>
              )
              : (
                <div class="stage-empty">
                  <p>Select a topic from the sidebar to begin.</p>
                </div>
              )}
          </>
        )}
        {/* ── LAB MODE ── */}
        {mode.value === "lab" && (
          <div class="lab-body">
            <VolumeSimulator />
          </div>
        )}
      </div>
    </main>
  );
}
