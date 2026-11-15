/**
 * ============================================================================
 * components/goal-celebration.js
 * ----------------------------------------------------------------------------
 * Shown every time a visitor sends a request (trial booking, edit, contact
 * message, newsletter sign-up, resend from My requests).
 *
 *   celebrateGoal({ title: "Trial request sent", message: "..." });
 *
 * Only the player appears: a cut-out (thumbs-up-scene.js) that pops up in the
 * middle of the screen and fades away after 5 seconds. Nothing else is drawn
 * and the page stays usable. The title and message are announced to screen
 * readers but not shown. Clicking the player or pressing Escape hides it early.
 * ============================================================================
 */
import { registerAction } from "../core/actions.js";
import { escapeHtml } from "../core/dom.js";
import { THUMBS_UP_SVG } from "./thumbs-up-scene.js";

const VISIBLE_MS = 5000;
const FADE_MS = 350;
let current = null;           // { root, timer }

/* ---------------------------------------------------------------------------
   Show / hide
   ------------------------------------------------------------------------ */
export function celebrateGoal({ title = "Request sent", message = "" } = {}) {
  removeNow();

  document.body.insertAdjacentHTML("beforeend", `
    <div class="celebration" role="status" aria-live="polite">
      <button type="button" class="celebration__doll" data-action="close-celebration" aria-label="Hide">${THUMBS_UP_SVG}</button>
      <span class="visually-hidden">${escapeHtml(title)}. ${escapeHtml(message)}</span>
    </div>`);

  const root = document.body.lastElementChild;
  current = { root, timer: setTimeout(closeCelebration, VISIBLE_MS) };
}

/** Fades the player out, then removes it. */
export function closeCelebration() {
  if (!current || current.root.classList.contains("is-closing")) return;
  clearTimeout(current.timer);
  const { root } = current;
  root.classList.add("is-closing");
  setTimeout(() => {
    root.remove();
    if (current?.root === root) current = null;
  }, FADE_MS);
}

function removeNow() {
  if (!current) return;
  clearTimeout(current.timer);
  current.root.remove();
  current = null;
}

/* ---------------------------------------------------------------------------
   Actions and keyboard
   ------------------------------------------------------------------------ */
registerAction("close-celebration", () => closeCelebration());
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCelebration(); });
