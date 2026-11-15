/**
 * ============================================================================
 * forms/delivery.js
 * ----------------------------------------------------------------------------
 * Sends a saved record to the school by email AND WhatsApp (both at once)
 * and records the outcome. It counts as sent when either channel succeeds.
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
import { sendWhatsApp } from "../core/whatsapp.js";
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

  const [email, whatsapp] = await Promise.all([
    sendEmail({ subject, fields, replyTo: record.email || "", honeypot }),
    honeypot ? { ok: true } : sendWhatsApp(toWhatsAppText(subject, fields)),
  ]);
  const result = combineResults(email, whatsapp);

  if (result.ok && kind !== "cancelled") Store.update(collection, record.id, { status: "sent", emailedAt: Date.now() });
  return result;
}

/* ---------------------------------------------------------------------------
   Helpers shared with the newsletter form
   ------------------------------------------------------------------------ */
/** WhatsApp message: bold subject, then one "Label: value" line per field. */
export function toWhatsAppText(subject, fields) {
  const lines = fields.filter(([, value]) => value !== "" && value !== undefined && value !== null).map(([label, value]) => `${label}: ${value}`);
  return [`*${subject}*`, ...lines].join("\n");
}

/** Sent if either channel worked; otherwise report the email failure. */
export function combineResults(email, whatsapp) {
  if (email.ok || whatsapp.ok) return { ok: true, email: email.ok, whatsapp: whatsapp.ok };
  return { ok: false, reason: email.reason };
}

/* ---------------------------------------------------------------------------
   Status line shown inside a confirmation box
   state: "sending" | "sent" | "failed"
   ------------------------------------------------------------------------ */
export function renderDeliveryStatus(state, reason = "") {
  if (state === "sending") return `<span class="delivery delivery--sending"><i class="spinner" aria-hidden="true"></i>Sending to the school…</span>`;
  if (state === "sent") return `<span class="delivery delivery--sent">Sent to the school. We'll call you to confirm.</span>`;
  return `<span class="delivery delivery--failed">Saved, but it couldn't be sent automatically. ${escapeHtml(reason)} Use a button below to send it.</span>`;
}

/** Updates a confirmation box once the email attempt finishes. */
export function applyDeliveryResult(container, result) {
  const status = container.querySelector("[data-delivery]");
  if (status) status.innerHTML = renderDeliveryStatus(result.ok ? "sent" : "failed", result.reason);
  const fallback = container.querySelector("[data-fallback]");
  if (fallback) fallback.hidden = result.ok;
}
