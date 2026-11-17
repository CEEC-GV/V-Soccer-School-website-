/**
 * ============================================================================
 * forms/contact-form.js
 * ----------------------------------------------------------------------------
 * "Talk to the school" form on the Contact screen.
 * Validates as the visitor types and saves to Store. When BRAND.whatsapp is
 * set, sending opens a WhatsApp chat with the school with the details
 * already typed in (the visitor just taps Send); a copy is also emailed.
 * Without a WhatsApp number it only emails, with send buttons as a fallback.
 * ============================================================================
 */
import { BRAND, GROUNDS, findGround } from "../config/site.config.js";
import { escapeHtml, scrollToElement, setFieldHint, showToast, whatsappUrl } from "../core/dom.js";
import { Store } from "../core/store.js";
import { isValidEmail, isValidPhone, normalisePhone } from "../core/validators.js";
import { celebrateGoal } from "../components/goal-celebration.js";
import { WHATSAPP_ICON, renderWhatsAppButton } from "../components/cards.js";
import { applyDeliveryResult, deliverRecord, renderDeliveryStatus } from "./delivery.js";
import { renderSendButtons } from "./share.js";
import { CONTACT_TOPICS, summariseMessage, topicLabel } from "./summaries.js";

const MESSAGE_LIMIT = 600;
const MESSAGE_MIN = 10;

/* ---------------------------------------------------------------------------
   Form markup
   topic: pre-selected topic id (from the link that opened the screen)
   ------------------------------------------------------------------------ */
export function renderContactForm(topic = "general") {
  const selectedTopic = CONTACT_TOPICS.some((t) => t.id === topic) ? topic : "general";
  return `
    <form id="contact-form" novalidate>
      <div class="form-grid">
        <div class="field">
          <label for="contact-name">Your name</label>
          <input class="input" id="contact-name" name="name" required autocomplete="name">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="contact-phone">Mobile</label>
          <input class="input" id="contact-phone" name="phone" required inputmode="tel" autocomplete="tel">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="contact-email">Email (optional)</label>
          <input class="input" id="contact-email" name="email" type="email" autocomplete="email">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="contact-topic">Topic</label>
          <select class="input" id="contact-topic" name="topic">
            ${CONTACT_TOPICS.map((t) => `<option value="${t.id}" ${t.id === selectedTopic ? "selected" : ""}>${escapeHtml(t.label)}</option>`).join("")}
          </select>
        </div>
        <div class="field field--full">
          <label for="contact-ground">Ground (optional)</label>
          <select class="input" id="contact-ground" name="ground">
            <option value="">Any ground</option>
            ${GROUNDS.map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field field--full">
          <label for="contact-message">Message</label>
          <textarea class="input" id="contact-message" name="message" required maxlength="${MESSAGE_LIMIT}"></textarea>
          <span class="char-count" id="contact-message-count">0 / ${MESSAGE_LIMIT}</span>
          <span class="field-hint"></span>
        </div>
      </div>
      <!-- Spam trap: hidden from people, bots fill it in -->
      <input class="honeypot" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">

      <div class="button-row" style="margin-top:22px">
        ${BRAND.whatsapp
          ? `<button class="btn btn--whatsapp" type="submit">${WHATSAPP_ICON}Send on WhatsApp</button>`
          : `<button class="btn" type="submit">Send message</button>`}
        <span class="field-hint" id="contact-form-status"></span>
      </div>
    </form>`;
}

/* ---------------------------------------------------------------------------
   WhatsApp message typed in for the visitor (they can edit it before sending)
   ------------------------------------------------------------------------ */
function whatsappMessage(message) {
  const lines = [`Hi ${BRAND.name}, I'm ${message.name}.`, "", message.message, ""];
  lines.push(`Topic: ${topicLabel(message.topic)}`);
  const ground = findGround(message.ground);
  if (ground) lines.push(`Ground: ${ground.name}`);
  lines.push(`Mobile: ${message.phone}`);
  if (message.email) lines.push(`Email: ${message.email}`);
  return lines.join("\n");
}

/* ---------------------------------------------------------------------------
   Confirmation
   ------------------------------------------------------------------------ */
function renderContactConfirmation(message) {
  const firstName = escapeHtml(message.name.split(" ")[0]);
  if (BRAND.whatsapp) {
    return `
    <div class="confirmation">
      <h3>Thanks, ${firstName}. Now tap Send in WhatsApp</h3>
      <p>WhatsApp has opened with your details typed in. If it didn't open, use the button below.</p>
      <pre>${escapeHtml(whatsappMessage(message))}</pre>
      <div class="button-row">${renderWhatsAppButton({ text: whatsappMessage(message), label: "Open WhatsApp again" })}</div>
      <div class="button-row">
        <a class="text-link" href="/my-requests/">View my requests</a>
        <a class="text-link" href="/contact/">Send another message</a>
      </div>
    </div>`;
  }
  return `
    <div class="confirmation">
      <p data-delivery>${renderDeliveryStatus("sending")}</p>
      <h3>Thanks, ${firstName}</h3>
      <pre>${escapeHtml(summariseMessage(message))}</pre>
      <div class="button-row" data-fallback hidden>${renderSendButtons("messages", message)}</div>
      <div class="button-row">
        <a class="text-link" href="/my-requests/">View my requests</a>
        <a class="text-link" href="/contact/">Send another message</a>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------------
   Behaviour
   ------------------------------------------------------------------------ */
export function bindContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const field = (name) => form.elements[name];

  field("name").addEventListener("input", () => setFieldHint(field("name")));
  field("phone").addEventListener("input", () => {
    const input = field("phone");
    if (!input.value) return setFieldHint(input);
    isValidPhone(input.value) ? setFieldHint(input, "Looks good", "ok") : setFieldHint(input, "Enter a 10-digit Indian mobile number", "error");
  });
  field("email").addEventListener("input", () =>
    isValidEmail(field("email").value) ? setFieldHint(field("email")) : setFieldHint(field("email"), "Check the email address", "error"));
  field("message").addEventListener("input", () => {
    document.getElementById("contact-message-count").textContent = `${field("message").value.length} / ${MESSAGE_LIMIT}`;
    setFieldHint(field("message"));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const errors = [];
    const fail = (name, message) => { setFieldHint(field(name), message, "error"); errors.push(name); };

    if (!values.name.trim()) fail("name", "Enter your name");
    if (!isValidPhone(values.phone)) fail("phone", "Enter a 10-digit Indian mobile number");
    if (!isValidEmail(values.email)) fail("email", "Check the email address");
    if (values.message.trim().length < MESSAGE_MIN) fail("message", "Write at least a short sentence");

    if (errors.length) {
      const status = document.getElementById("contact-form-status");
      status.className = "field-hint field-hint--error";
      status.textContent = `Fix ${errors.length} highlighted ${errors.length === 1 ? "field" : "fields"}.`;
      field(errors[0]).focus();
      return;
    }

    const saved = Store.add("messages", {
      name: values.name.trim(), phone: normalisePhone(values.phone), email: values.email.trim(),
      topic: values.topic, ground: values.ground, message: values.message.trim(),
    });

    const container = document.getElementById("contact-form-container");

    // WhatsApp first: open the chat right away (inside the click, so browsers allow it)
    if (BRAND.whatsapp && !values._honey) {
      const chat = window.open(whatsappUrl(BRAND.whatsapp, whatsappMessage(saved)), "_blank");
      if (chat) chat.opener = null;
      else showToast("Tap Open WhatsApp again to send your message");
    }

    container.innerHTML = renderContactConfirmation(saved);
    scrollToElement(container);

    if (!BRAND.whatsapp) celebrateGoal({ title: "Message sent", message: "A coach will get back to you soon." });

    // A copy also goes to the school's email (and WhatsApp relay, if set up)
    deliverRecord("messages", saved, "new", values._honey).then((result) => {
      applyDeliveryResult(container, result);
      if (!result.ok && !BRAND.whatsapp) showToast("Saved. Send it with a button below");   // success is shown by the player pop-up
    });
  });
}
