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
