/**
 * ============================================================================
 * core/mailer.js
 * ----------------------------------------------------------------------------
 * Sends form submissions to the school's inbox (EMAIL_DELIVERY.to) through the
 * FormSubmit AJAX relay. Used by the trial, contact and newsletter forms and
 * by cancellations on My requests.
 *
 *   const result = await sendEmail({ subject, fields, replyTo });
 *   result -> { ok: true } | { ok: false, reason: "..." }
 *
 * The email arrives as a table: one row per entry in `fields`.
 * ============================================================================
 */
import { EMAIL_DELIVERY } from "../config/site.config.js";

/* ---------------------------------------------------------------------------
   Public API
   subject:  email subject line
   fields:   ordered [label, value] pairs (empty values are skipped)
   replyTo:  visitor's email, so "Reply" in Gmail answers the parent directly
   honeypot: value of the hidden spam-trap field (bots fill it, people don't)
   ------------------------------------------------------------------------ */
export async function sendEmail({ subject, fields, replyTo = "", honeypot = "" }) {
  if (!EMAIL_DELIVERY.enabled || !EMAIL_DELIVERY.to) return { ok: false, reason: "Email delivery is turned off." };
  if (honeypot) return { ok: true }; // silently drop spam bots

  const body = {
    _subject: subject,
    _template: "table",
    _captcha: "false",
  };
  if (replyTo) body._replyto = replyTo;
  for (const [label, value] of fields) {
    if (value !== "" && value !== undefined && value !== null) body[label] = String(value);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EMAIL_DELIVERY.timeoutMs);

  try {
    const response = await fetch(EMAIL_DELIVERY.endpoint + encodeURIComponent(EMAIL_DELIVERY.to), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    // FormSubmit answers { success: "true" } or { success: "false", message: "..." }
    if (response.ok && String(data.success) === "true") return { ok: true };
    return { ok: false, reason: describeFailure(data.message) };
  } catch (error) {
    return { ok: false, reason: error.name === "AbortError" ? "The email service took too long to answer." : "No connection to the email service." };
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------------
   Human-readable failure reasons
   ------------------------------------------------------------------------ */
function describeFailure(message = "") {
  if (/activat/i.test(message)) return "The school's email form still needs activating (check the activation email).";
  return message || "The email service did not accept the request.";
}
