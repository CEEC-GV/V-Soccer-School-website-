/**
 * ============================================================================
 * core/store.js
 * ----------------------------------------------------------------------------
 * Data layer. There is no backend, so trial requests, messages and newsletter
 * sign-ups are saved in the visitor's own browser (localStorage).
 * If storage is blocked (private mode), data is kept in memory for the visit.
 *
 * Collections: "trials" | "messages"   Statuses: "new" | "sent" | "cancelled"
 * ============================================================================
 */

const STORAGE_KEY = "vss-data-v1";
const subscribers = new Set();
let memoryCopy = null;

/* ---------------------------------------------------------------------------
   Internal read / write
   ------------------------------------------------------------------------ */
function createEmptyState() {
  return { trials: [], messages: [], newsletter: [] };
}

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...createEmptyState(), ...JSON.parse(raw) } : memoryCopy || createEmptyState();
  } catch {
    return memoryCopy || (memoryCopy = createEmptyState());
  }
}

function writeState(state) {
  memoryCopy = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: memoryCopy keeps data for this visit */
  }
  subscribers.forEach((callback) => callback(state));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------------------------------------------------------------------------
   Public API
   ------------------------------------------------------------------------ */
export const Store = {
  /** All records in a collection, newest first. */
  list(collection) {
    return readState()[collection] || [];
  },

  get(collection, id) {
    return this.list(collection).find((item) => item.id === id) || null;
  },

  add(collection, data) {
    const state = readState();
    const record = { ...data, id: createId(), createdAt: Date.now(), status: "new" };
    state[collection].unshift(record);
    writeState(state);
    return record;
  },

  update(collection, id, changes) {
    const state = readState();
    const record = state[collection].find((item) => item.id === id);
    if (record) Object.assign(record, changes, { updatedAt: Date.now() });
    writeState(state);
    return record;
  },

  remove(collection, id) {
    const state = readState();
    state[collection] = state[collection].filter((item) => item.id !== id);
    writeState(state);
  },

  /** Returns "added" or "exists". */
  subscribeNewsletter(email) {
    const state = readState();
    const normalised = email.trim().toLowerCase();
    if (state.newsletter.includes(normalised)) return "exists";
    state.newsletter.push(normalised);
    writeState(state);
    return "added";
  },

  /** Number of open requests, shown on the header badge. */
  countOpenRequests() {
    const state = readState();
    return state.trials.filter((trial) => trial.status !== "cancelled").length + state.messages.length;
  },

  /** Runs `callback` after every change. */
  onChange(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },
};
