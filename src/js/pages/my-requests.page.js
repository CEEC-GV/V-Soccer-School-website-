/**
 * ============================================================================
 * pages/my-requests.page.js  ->  #my-requests
 * ----------------------------------------------------------------------------
 * Lists trial requests and messages saved on this device.
 * Trial actions: Send, Edit, Cancel (with confirm), Restore, Delete.
 * Cancelling emails the school so the slot can be given to someone else.
 * Message actions: Send, Delete.
 * ============================================================================
 */
import { findGround, findProgramme } from "../config/site.config.js";
import { renderPageBanner } from "../components/media.js";
import { registerAction } from "../core/actions.js";
import { escapeHtml, showToast } from "../core/dom.js";
import { refreshRoute } from "../core/router.js";
import { Store } from "../core/store.js";
import { formatPrettyDate, formatTime12 } from "../core/time.js";
import { deliverRecord } from "../forms/delivery.js";
import { topicLabel } from "../forms/summaries.js";

const STATUS_LABELS = { new: "Not sent yet", sent: "Sent to school", cancelled: "Cancelled" };
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/* ---------------------------------------------------------------------------
   Request cards
   ------------------------------------------------------------------------ */
function renderTrialCard(trial) {
  const ground = findGround(trial.ground);
  const session = ground?.sessions[trial.batch];
  const programme = findProgramme(trial.programme);
  const ref = `data-collection="trials" data-id="${trial.id}"`;

  const actions = trial.status === "cancelled"
    ? `<button type="button" class="btn btn--sm btn--ghost" data-action="restore-trial" ${ref}>Restore</button>
       <button type="button" class="btn btn--sm btn--ghost" data-action="ask-delete" ${ref}>Delete</button>`
    : `<button type="button" class="btn btn--sm" data-action="send-request" ${ref}>Send</button>
       <a class="btn btn--sm btn--ghost" href="#book-trial?edit=${trial.id}">Edit</a>
       <button type="button" class="btn btn--sm btn--ghost" data-action="ask-cancel" ${ref}>Cancel</button>`;

  return `
    <article class="request-card">
      <div>
        <span class="pill pill--${trial.status}">${STATUS_LABELS[trial.status]}</span>
        <h3>${escapeHtml(trial.player)} · U${trial.underAge}</h3>
        <div class="request-card__meta">
          <span>${escapeHtml(programme?.name)}</span>
          <span>${escapeHtml(ground?.name)}</span>
          <span>${session ? `${formatTime12(session.start)}–${formatTime12(session.end)}` : ""}</span>
          <span>${formatPrettyDate(trial.date)}</span>
        </div>
      </div>
      <div class="request-card__actions">${actions}</div>
    </article>`;
}

function renderMessageCard(message) {
  const ref = `data-collection="messages" data-id="${message.id}"`;
  const preview = message.message.length > 140 ? `${message.message.slice(0, 140)}…` : message.message;
  return `
    <article class="request-card">
      <div>
        <span class="pill pill--${message.status}">${STATUS_LABELS[message.status]}</span>
        <h3 style="font-size:22px">${escapeHtml(topicLabel(message.topic))} · ${escapeHtml(message.name)}</h3>
        <p class="muted" style="margin-top:6px">${escapeHtml(preview)}</p>
      </div>
      <div class="request-card__actions">
        <button type="button" class="btn btn--sm" data-action="send-request" ${ref}>Send</button>
        <button type="button" class="btn btn--sm btn--ghost" data-action="ask-delete" ${ref}>Delete</button>
      </div>
    </article>`;
}

/* ---------------------------------------------------------------------------
   Inline confirmation row (replaces browser confirm dialogs)
   ------------------------------------------------------------------------ */
function showConfirmRow(button, message, confirmAction, confirmLabel) {
  const card = button.closest(".request-card");
  if (card.querySelector(".request-card__confirm")) return;
  const ref = `data-collection="${button.dataset.collection}" data-id="${button.dataset.id}"`;
  card.insertAdjacentHTML("beforeend", `
    <div class="request-card__confirm">
      ${escapeHtml(message)}
      <button type="button" class="btn btn--sm" data-action="${confirmAction}" ${ref}>${escapeHtml(confirmLabel)}</button>
      <button type="button" class="btn btn--sm btn--ghost" data-action="dismiss-confirm">Keep it</button>
    </div>`);
}

registerAction("ask-cancel", (button) => showConfirmRow(button, "Cancel this trial request?", "confirm-cancel", "Yes, cancel it"));
registerAction("ask-delete", (button) => showConfirmRow(button, "Delete this permanently from this device?", "confirm-delete", "Delete"));
registerAction("dismiss-confirm", (button) => button.closest(".request-card__confirm").remove());

registerAction("confirm-cancel", ({ dataset }) => {
  const trial = Store.update("trials", dataset.id, { status: "cancelled" });
  refreshRoute();
  deliverRecord("trials", trial, "cancelled").then((result) =>
    showToast(result.ok ? "Cancelled. The school has been told" : "Cancelled on this device. Please tell the school"));
});
registerAction("restore-trial", ({ dataset }) => {
  Store.update("trials", dataset.id, { status: "new" });
  showToast("Trial request restored");
  refreshRoute();
});
registerAction("confirm-delete", ({ dataset }) => {
  Store.remove(dataset.collection, dataset.id);
  showToast("Deleted");
  refreshRoute();
});

/* ---------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------ */
export const myRequestsPage = {
  title: "My requests",
  navId: "",

  render() {
    const trials = Store.list("trials");
    const messages = Store.list("messages");

    return `
      ${renderPageBanner({ title: "My requests", intro: "Trial bookings and messages sent from this device.", photo: "kitup" })}

      <!-- Trials -->
      <section class="section"><div class="container">
        <div class="section-head">
          <div><h2 style="font-size:40px">${plural(trials.length, "trial request")}</h2></div>
          <a class="btn" href="#book-trial">New trial request</a>
        </div>
        ${trials.length
          ? `<div class="request-list">${trials.map(renderTrialCard).join("")}</div>`
          : `<div class="empty-state"><p>No trial requests yet. Book one and it will appear here so you can edit or cancel it.</p><a class="btn btn--ghost" href="#book-trial">Book a free trial</a></div>`}
      </div></section>

      <!-- Messages -->
      <section class="section"><div class="container">
        <div class="section-head">
          <div><h2 style="font-size:40px">${plural(messages.length, "message")}</h2></div>
          <a class="btn btn--ghost" href="#contact">Send a message</a>
        </div>
        ${messages.length
          ? `<div class="request-list">${messages.map(renderMessageCard).join("")}</div>`
          : `<div class="empty-state"><p>No messages sent from this device.</p></div>`}
      </div></section>`;
  },
};
