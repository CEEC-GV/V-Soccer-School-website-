/**
 * ============================================================================
 * forms/share.js
 * ----------------------------------------------------------------------------
 * Manual ways to get a saved request to the school, used when the automatic
 * email (delivery.js) fails: WhatsApp or email (when BRAND.phone / BRAND.email
 * are set), or copy the details. Sending marks the record as "sent".
 * ============================================================================
 */
import { BRAND } from "../config/site.config.js";
import { registerAction } from "../core/actions.js";
import { copyToClipboard, showToast, whatsappUrl } from "../core/dom.js";
import { refreshRoute } from "../core/router.js";
import { Store } from "../core/store.js";
import { celebrateGoal } from "../components/goal-celebration.js";
import { deliverRecord } from "./delivery.js";
import { summarise } from "./summaries.js";

/* ---------------------------------------------------------------------------
   Send buttons shown after a form is submitted
   ------------------------------------------------------------------------ */
export function renderSendButtons(collection, record) {
  const text = summarise(collection, record);
  const subject = encodeURIComponent(`${BRAND.name}: ${collection === "trials" ? "trial request" : "message"}`);
  const ref = `data-collection="${collection}" data-id="${record.id}"`;

  const whatsapp = BRAND.phone
    ? `<a class="btn" href="${whatsappUrl(BRAND.phone, text)}" target="_blank" rel="noopener" data-action="mark-sent" ${ref}>Send on WhatsApp</a>`
    : "";
  const email = BRAND.email
    ? `<a class="btn btn--ghost" href="mailto:${BRAND.email}?subject=${subject}&body=${encodeURIComponent(text)}" data-action="mark-sent" ${ref}>Send by email</a>`
    : "";
  const copy = `<button type="button" class="btn btn--ghost" data-action="copy-request" ${ref}>Copy details</button>`;

  return whatsapp + email + copy;
}

/* ---------------------------------------------------------------------------
   One-tap send from the My requests screen
   1. Email the school automatically.  2. If that fails: WhatsApp, else copy.
   ------------------------------------------------------------------------ */
async function sendRequest(collection, id) {
  const record = Store.get(collection, id);
  if (!record) return;

  const emailed = await deliverRecord(collection, record, "new");
  if (emailed.ok) {
    celebrateGoal({ title: "Request sent", message: "The school has your details." });
    refreshRoute();
    return;
  }

  const text = summarise(collection, record);

  if (BRAND.phone) {
    window.open(whatsappUrl(BRAND.phone, text), "_blank", "noopener");
    Store.update(collection, id, { status: "sent" });
    refreshRoute();
    return;
  }
  if (await copyToClipboard(text)) {
    Store.update(collection, id, { status: "sent" });
    showToast("Details copied. Paste them to the school");
    refreshRoute();
  }
}

/* ---------------------------------------------------------------------------
   Actions
   ------------------------------------------------------------------------ */
registerAction("mark-sent", (element) => {
  // Link opens WhatsApp / email by itself; we only record that it was sent.
  Store.update(element.dataset.collection, element.dataset.id, { status: "sent" });
  showToast("Marked as sent");
});

registerAction("copy-request", async (element) => {
  const { collection, id } = element.dataset;
  const record = Store.get(collection, id);
  if (record && (await copyToClipboard(summarise(collection, record)))) {
    Store.update(collection, id, { status: "sent" });
  }
});

registerAction("send-request", (element) => sendRequest(element.dataset.collection, element.dataset.id));
