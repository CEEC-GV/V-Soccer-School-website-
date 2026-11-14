/**
 * ============================================================================
 * components/timetable.js
 * ----------------------------------------------------------------------------
 * Weekly timetable with a ground filter, in two layouts:
 *   renderWeekTable  7-column grid (tablets and desktops)
 *   renderWeekList   day-by-day list starting today (phones)
 * CSS shows one or the other. Each session is a button that opens the trial
 * form pre-filled with that ground, batch and the next matching date.
 * ============================================================================
 */
import { GROUNDS, findGround } from "../config/site.config.js";
import { registerAction } from "../core/actions.js";
import { escapeHtml } from "../core/dom.js";
import { navigate } from "../core/router.js";
import { DAY_LONG, DAY_SHORT, expandSessions, formatTime12, getIstNow, getSlotState, getUpcomingDates, toMinutes } from "../core/time.js";

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

/* ---------------------------------------------------------------------------
   State: which ground the table is filtered to ("all" or a ground id)
   ------------------------------------------------------------------------ */
export const timetableState = { groundFilter: "all" };

/* ---------------------------------------------------------------------------
   Filter chips
   ------------------------------------------------------------------------ */
export function renderTimetableFilters() {
  const chip = (value, label) =>
    `<button type="button" class="filter-chip" data-action="filter-timetable" data-ground="${value}"
             aria-pressed="${timetableState.groundFilter === value}">${escapeHtml(label)}</button>`;
  return `<div class="filter-row" role="group" aria-label="Filter by ground">
    ${chip("all", "All grounds")}${GROUNDS.map((ground) => chip(ground.id, ground.name)).join("")}
  </div>`;
}

/* ---------------------------------------------------------------------------
   Shared helpers
   ------------------------------------------------------------------------ */
function getFilteredSlots() {
  const grounds = GROUNDS.filter((g) => timetableState.groundFilter === "all" || g.id === timetableState.groundFilter);
  return grounds.flatMap(expandSessions);
}

function slotsForDay(slots, day) {
  return slots.filter((slot) => slot.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** One bookable session. */
function renderSlotButton(slot) {
  const state = getSlotState(slot);
  return `
    <button type="button" class="slot-button ${state ? `is-${state}` : ""}" data-action="book-slot"
            data-ground="${slot.ground.id}" data-batch="${slot.index}" data-day="${slot.day}">
      <b>${formatTime12(slot.start)}–${formatTime12(slot.end)}</b>
      <span>${escapeHtml(slot.ground.name)}</span>
      <span>${escapeHtml(slot.group)} · ${escapeHtml(slot.ages)}</span>
      ${state === "live"
        ? `<span class="live-status live-status--on"><i class="status-dot status-dot--live"></i>Live</span>`
        : `<em>Book trial</em>`}
    </button>`;
}

/* ---------------------------------------------------------------------------
   Week table (tablets and desktops)
   ------------------------------------------------------------------------ */
export function renderWeekTable() {
  const today = getIstNow().day;
  const slots = getFilteredSlots();

  const header = WEEK_ORDER.map((day) =>
    `<th class="${day === today ? "is-today" : ""}">${DAY_SHORT[day]}${day === today ? " · today" : ""}</th>`).join("");

  const cells = WEEK_ORDER.map((day) => {
    const buttons = slotsForDay(slots, day).map(renderSlotButton).join("");
    return `<td class="${day === today ? "is-today" : ""}">${buttons || `<span class="week-table__rest">Rest day</span>`}</td>`;
  }).join("");

  return `<thead><tr>${header}</tr></thead><tbody><tr>${cells}</tr></tbody>`;
}

/* ---------------------------------------------------------------------------
   Week list (phones): seven days starting from today
   ------------------------------------------------------------------------ */
export function renderWeekList() {
  const today = getIstNow().day;
  const slots = getFilteredSlots();

  return Array.from({ length: 7 }, (_, offset) => (today + offset) % 7).map((day, offset) => {
    const buttons = slotsForDay(slots, day).map(renderSlotButton).join("");
    const label = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : "";
    return `
      <div class="week-list__day ${offset === 0 ? "is-today" : ""}">
        <h3>${DAY_LONG[day]}${label ? ` <small>${label}</small>` : ""}</h3>
        ${buttons || `<span class="week-table__rest">Rest day</span>`}
      </div>`;
  }).join("");
}

/** Redraws both layouts (after a filter change or the live refresh). */
export function refreshTimetable() {
  const table = document.querySelector('[data-live="timetable"]');
  const list = document.querySelector('[data-live="timetable-list"]');
  if (table) table.innerHTML = renderWeekTable();
  if (list) list.innerHTML = renderWeekList();
}

/* ---------------------------------------------------------------------------
   Actions
   ------------------------------------------------------------------------ */
registerAction("filter-timetable", (chip) => {
  timetableState.groundFilter = chip.dataset.ground;
  document.querySelectorAll('[data-action="filter-timetable"]').forEach((other) =>
    other.setAttribute("aria-pressed", String(other === chip)));
  refreshTimetable();
});

registerAction("book-slot", (button) => {
  const { ground: groundId, batch, day } = button.dataset;
  const ground = findGround(groundId);
  const session = ground.sessions[batch];
  const programme = session.tier === "advanced" ? "advanced" : session.tier === "youth" ? "youth" : "";
  const date = getUpcomingDates(ground, Number(batch), 14).find((iso) => new Date(`${iso}T00:00:00`).getDay() === Number(day)) || "";
  navigate("book-trial", { ground: groundId, batch, programme, date });
});
