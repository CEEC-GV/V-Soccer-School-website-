/**
 * ============================================================================
 * core/time.js
 * ----------------------------------------------------------------------------
 * Time helpers. Everything is calculated in Bengaluru time (IST, UTC+5:30)
 * regardless of the visitor's device time zone, so "training now" is always
 * correct for the ground.
 * ============================================================================
 */

export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const IST_OFFSET_MINUTES = 330;
const MINUTES_PER_DAY = 1440;

/* ---------------------------------------------------------------------------
   Current time in IST
   Returns { date, day (0-6), minutes (since midnight) }.
   ------------------------------------------------------------------------ */
export function getIstNow() {
  const local = new Date();
  const ist = new Date(local.getTime() + (local.getTimezoneOffset() + IST_OFFSET_MINUTES) * 60000);
  return { date: ist, day: ist.getDay(), minutes: ist.getHours() * 60 + ist.getMinutes() };
}

/* ---------------------------------------------------------------------------
   Formatting
   ------------------------------------------------------------------------ */

/** "17:30" -> 1050 */
export function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/** "17:30" -> "5:30 pm" */
export function formatTime12(hhmm) {
  let [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${hours}${minutes ? ":" + String(minutes).padStart(2, "0") : ""} ${suffix}`;
}

/** 135 -> "2h 15m", 45 -> "45 min", 3000 -> "2d 2h" */
export function formatDuration(totalMinutes) {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

/** Date -> "2026-11-14" */
export function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** "2026-11-14" -> "Sat, 14 Nov" */
export function formatPrettyDate(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Header clock text, e.g. "Saturday · 2:28 pm IST" */
export function formatClock() {
  const now = getIstNow();
  const time = now.date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${DAY_LONG[now.day]} · ${time} IST`;
}

/* ---------------------------------------------------------------------------
   Schedule logic
   ------------------------------------------------------------------------ */

/** Flattens a ground's sessions into one entry per weekday. */
export function expandSessions(ground) {
  const slots = [];
  ground.sessions.forEach((session, index) => {
    session.days.forEach((day) => slots.push({ ...session, index, day, ground }));
  });
  return slots;
}

/**
 * Live status of a ground.
 * live:   the batch on the pitch right now (with minutesLeft), or null
 * next:   the next batch to start
 * startsIn: minutes until `next` starts
 */
export function getGroundStatus(ground) {
  const now = getIstNow();
  let live = null;
  let next = null;
  let startsIn = Infinity;

  for (const slot of expandSessions(ground)) {
    const start = toMinutes(slot.start);
    const end = toMinutes(slot.end);

    if (!live && slot.day === now.day && now.minutes >= start && now.minutes < end) {
      live = { ...slot, minutesLeft: end - now.minutes };
    }

    let diff = (slot.day - now.day) * MINUTES_PER_DAY + start - now.minutes;
    if (diff <= 0) diff += 7 * MINUTES_PER_DAY;
    if (diff < startsIn) {
      startsIn = diff;
      next = slot;
    }
  }
  return { live, next, startsIn };
}

/** Whether a session is happening right now, already finished today, or neither. */
export function getSlotState(slot) {
  const now = getIstNow();
  if (slot.day !== now.day) return "";
  if (now.minutes >= toMinutes(slot.start) && now.minutes < toMinutes(slot.end)) return "live";
  if (now.minutes >= toMinutes(slot.end)) return "done";
  return "";
}

/**
 * Next calendar dates (ISO strings) on which a given batch runs.
 * Skips today if the batch has already started.
 */
export function getUpcomingDates(ground, sessionIndex, limit = 6) {
  const session = ground?.sessions[sessionIndex];
  if (!session) return [];

  const now = getIstNow();
  const today = new Date(now.date);
  today.setHours(0, 0, 0, 0);

  const dates = [];
  for (let offset = 0; offset < 28 && dates.length < limit; offset++) {
    const day = new Date(today);
    day.setDate(today.getDate() + offset);
    const startedToday = offset === 0 && now.minutes >= toMinutes(session.start);
    if (session.days.includes(day.getDay()) && !startedToday) dates.push(toIsoDate(day));
  }
  return dates;
}
