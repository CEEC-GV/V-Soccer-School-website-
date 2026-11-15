/**
 * ============================================================================
 * core/whatsapp.js
 * ----------------------------------------------------------------------------
 * Sends form submissions to the school's WhatsApp. Used alongside
 * core/mailer.js.
 *
 * The message is posted to a Google Apps Script web app
 * (apps-script/whatsapp-relay.gs, URL in WHATSAPP_DELIVERY.url). The script
 * keeps the school's phone number and CallMeBot key private and forwards the
 * message, so neither ever appears in this site's code.
 *
 *   const result = await sendWhatsApp("Trial request ...");
 *   result -> { ok: true } | { ok: false, reason: "..." }
 * ============================================================================
 */
import { WHATSAPP_DELIVERY } from "../config/site.config.js";

/* ---------------------------------------------------------------------------
   Public API
   text: the message (new lines allowed; *bold* is WhatsApp formatting)
   ------------------------------------------------------------------------ */
export async function sendWhatsApp(text) {
  if (!WHATSAPP_DELIVERY.enabled) return { ok: false, reason: "WhatsApp delivery is turned off." };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WHATSAPP_DELIVERY.timeoutMs);

  try {
    // text/plain keeps this a "simple" request, which Apps Script accepts
    // from any website without a CORS pre-check.
    const response = await fetch(WHATSAPP_DELIVERY.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (data.ok) return { ok: true };
    return { ok: false, reason: data.error || "WhatsApp did not accept the request." };
  } catch (error) {
    return { ok: false, reason: error.name === "AbortError" ? "WhatsApp took too long to answer." : "No connection to WhatsApp." };
  } finally {
    clearTimeout(timer);
  }
}
