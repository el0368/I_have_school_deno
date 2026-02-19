// Sovereign Academy - Math Stage Island
//
// The main content area where exercises are displayed and answered.
// Thin view layer: delegates WASM loading, validation, and exercise
// logic to lib/ modules. Only handles rendering + event wiring.

import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { marked } from "marked";
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
import type { HealthCheck } from "../lib/wasm-health-check.ts";
import { validateAnswer } from "../lib/validation.ts";

export default function MathStage() {
  const showSuccess = useSignal(false);
  const streak = useSignal(0);
  const advanceTimer = useSignal<ReturnType<typeof setTimeout> | null>(null);
  const mode = useSignal<"lesson" | "practice">("lesson");
  const lang = useSignal<"EN" | "TH">("EN");
  const lessonHtml = useSignal("");
  const lessonLoading = useSignal(false);

  // Load WASM module on mount
  useEffect(() => {
    initWasm();
  }, []);

  // Load lesson markdown whenever activeTopic, mode, or lang changes
  useEffect(() => {
    if (mode.value !== "lesson") return;
    lessonLoading.value = true;
    // For now we only have T11_6_0 — will expand when generator runs
    const nodeId = `T11_6_0`;
    fetch(`/api/lesson/${nodeId}?lang=${lang.value}`)
      .then((r) => r.json())
      .then((data: { content: string }) => {
        lessonHtml.value = marked.parse(data.content) as string;
      })
      .catch(() => {
        lessonHtml.value = "<p>Lesson not found.</p>";
      })
      .finally(() => {
        lessonLoading.value = false;
      });
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
              : (
                <>
                  <div
                    class="lesson-markdown"
                    // deno-lint-ignore react-no-danger
                    dangerouslySetInnerHTML={{ __html: lessonHtml.value }}
                  />
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
              )}
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
      </div>
    </main>
  );
}
