/**
 * ============================================================================
 * forms/delivery.js
 * ----------------------------------------------------------------------------
 * Emails a saved record to the school and records the outcome.
 *
 *   deliverRecord("trials", trial, "new")        new trial request
 *   deliverRecord("trials", trial, "updated")    edited from My requests
 *   deliverRecord("trials", trial, "cancelled")  cancelled from My requests
 *   deliverRecord("messages", message, "new")    contact form message
 *
 * On success the record's status becomes "sent". On failure the visitor sees
 * the WhatsApp / email / copy buttons as a fallback (see share.js).
 * ============================================================================
 */
import { BRAND } from "../config/site.config.js";
import { escapeHtml } from "../core/dom.js";
import { sendEmail } from "../core/mailer.js";
import { Store } from "../core/store.js";
import { fieldsFor } from "./summaries.js";

const SUBJECTS = {
  trials: {
    new: (r) => `New trial request: ${r.player} (U${r.underAge})`,
    updated: (r) => `Trial request updated: ${r.player} (U${r.underAge})`,
    cancelled: (r) => `Trial request CANCELLED: ${r.player}`,
  },
  messages: {
    new: (r) => `New message: ${r.name}`,
  },
};

/* ---------------------------------------------------------------------------
   Send one record
   ------------------------------------------------------------------------ */
export async function deliverRecord(collection, record, kind = "new", honeypot = "") {
  const subject = `${BRAND.name} · ${SUBJECTS[collection][kind](record)}`;
  const fields = [["Request type", kind === "new" ? "New" : kind === "updated" ? "Updated" : "Cancelled"], ...fieldsFor(collection, record)];

  const result = await sendEmail({ subject, fields, replyTo: record.email || "", honeypot });

  if (result.ok && kind !== "cancelled") Store.update(collection, record.id, { status: "sent", emailedAt: Date.now() });
  return result;
}

/* ---------------------------------------------------------------------------
   Status line shown inside a confirmation box
   state: "sending" | "sent" | "failed"
   ------------------------------------------------------------------------ */
export function renderDeliveryStatus(state, reason = "") {
  if (state === "sending") return `<span class="delivery delivery--sending"><i class="spinner" aria-hidden="true"></i>Sending to the school…</span>`;
  if (state === "sent") return `<span class="delivery delivery--sent">Sent to the school. We'll call you to confirm.</span>`;
  return `<span class="delivery delivery--failed">Saved, but it couldn't be emailed automatically. ${escapeHtml(reason)} Use a button below to send it.</span>`;
}

/** Updates a confirmation box once the email attempt finishes. */
export function applyDeliveryResult(container, result) {
  const status = container.querySelector("[data-delivery]");
  if (status) status.innerHTML = renderDeliveryStatus(result.ok ? "sent" : "failed", result.reason);
  const fallback = container.querySelector("[data-fallback]");
  if (fallback) fallback.hidden = result.ok;
}
