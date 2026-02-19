// Sovereign Academy - Topic Sidebar Island
//
// Discord-style channel list showing 19 math topics.
// Uses Preact Signals to sync with the Math Stage.

import {
  activeTopic,
  progress,
  selectTopic,
  sidebarCollapsed,
  TOPICS,
  TOTAL_EXERCISES,
  totalCompleted,
} from "../lib/state.ts";

export default function Sidebar() {
  return (
    <nav class={`sidebar ${sidebarCollapsed.value ? "sidebar-collapsed" : ""}`}>
      {/* Server/Academy Header */}
      <div class="sidebar-header">
        <h2 class="sidebar-title">🏛️ Academy</h2>
        <span class="sidebar-subtitle">
          {totalCompleted.value} / {TOTAL_EXERCISES}
        </span>
      </div>

      {/* Progress bar */}
      <div class="sidebar-progress">
        <div
          class="sidebar-progress-fill"
          style={{
            width: `${(totalCompleted.value / TOTAL_EXERCISES) * 100}%`,
          }}
        />
      </div>

      {/* Category label */}
      <div class="sidebar-category">
        <span class="sidebar-category-text">MATH TOPICS</span>
      </div>

      {/* Topic channels */}
      <ul class="sidebar-channels">
        {TOPICS.map((topic) => {
          const isActive = activeTopic.value === topic.id;
          const completed = progress.value[topic.id] ?? 0;
          const pct = Math.round((completed / topic.exerciseCount) * 100);

          return (
            <li key={topic.id}>
              <button
                type="button"
                class={`channel-btn ${isActive ? "channel-active" : ""}`}
                onClick={() => selectTopic(topic.id)}
              >
                <span class="channel-icon">{topic.icon}</span>
                <span class="channel-name">{topic.name}</span>
                {completed > 0 && (
                  <span class="channel-badge" title={`${pct}% complete`}>
                    {pct}%
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Category label — Labs */}
      <div class="sidebar-category">
        <span class="sidebar-category-text">INTERACTIVE LABS</span>
      </div>

      <ul class="sidebar-channels">
        <li>
          <a href="/lesson/cube-scaling" class="channel-btn">
            <span class="channel-icon">📦</span>
            <span class="channel-name">The Cube (MDX)</span>
          </a>
        </li>
        <li>
          <a href="/geometry" class="channel-btn">
            <span class="channel-icon">📐</span>
            <span class="channel-name">Volume Simulator</span>
          </a>
        </li>
        <li>
          <a href="/lesson/T11_6_0_EN" class="channel-btn">
            <span class="channel-icon">📏</span>
            <span class="channel-name">Ratios (EN)</span>
          </a>
        </li>
        <li>
          <a href="/lesson/T11_6_0_TH" class="channel-btn">
            <span class="channel-icon">📏</span>
            <span class="channel-name">อัตราส่วน (TH)</span>
          </a>
        </li>
      </ul>

      {/* Bottom user area */}
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">🎓</div>
          <div class="sidebar-user-info">
            <span class="sidebar-username">Student</span>
            <span class="sidebar-status">Studying</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
