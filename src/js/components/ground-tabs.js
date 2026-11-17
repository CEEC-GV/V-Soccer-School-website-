/**
 * ============================================================================
 * components/ground-tabs.js
 * ----------------------------------------------------------------------------
 * The tab strip under the main navigation. One tab per ground showing its
 * live status ("Training now" or the next session). Clicking a tab opens that
 * ground's page; the tab for the ground you are viewing is highlighted.
 * Re-rendered every 15 seconds by app.js so the countdowns stay current.
 * ============================================================================
 */
import { GROUNDS } from "../config/site.config.js";
import { escapeHtml } from "../core/dom.js";
import { DAY_SHORT, formatDuration, formatTime12, getGroundStatus } from "../core/time.js";

/** activeGroundId: id of the ground page currently open, or "" */
export function renderGroundTabs(activeGroundId = "") {
  const tabs = GROUNDS.map((ground) => {
    const { live, next, startsIn } = getGroundStatus(ground);
    const isActive = ground.id === activeGroundId;
    // Countdown first, so it stays visible when narrow screens cut the text short.
    const meta = live
      ? `Live · ${live.minutesLeft} min left`
      : `In ${formatDuration(startsIn)} · ${DAY_SHORT[next.day]} ${formatTime12(next.start)}`;

    return `
      <a class="ground-tab ${live ? "ground-tab--live" : ""}" href="/grounds/${ground.id}/"
         aria-current="${isActive ? "page" : "false"}"
         aria-label="${escapeHtml(ground.name)}: ${escapeHtml(meta)}">
        <i class="status-dot ${live ? "status-dot--live" : ""}" aria-hidden="true"></i>
        <span class="ground-tab__text">
          <span class="ground-tab__name">${escapeHtml(ground.name)}</span>
          <span class="ground-tab__meta">${escapeHtml(meta)}</span>
        </span>
      </a>`;
  });

  return `
    <div class="container ground-tabs__row" role="navigation" aria-label="Grounds">
      ${tabs.join("")}
    </div>`;
}
