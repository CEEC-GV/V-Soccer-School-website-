/**
 * ============================================================================
 * pages/contact.page.js  ->  /contact/   (optional ?topic=<id>)
 * ----------------------------------------------------------------------------
 * Contact form, direct contact details and FAQ.
 * WhatsApp comes first when BRAND.whatsapp is set: a chat button in the
 * banner, and the form opens WhatsApp with the details typed in.
 * ============================================================================
 */
import { BRAND, FAQ } from "../config/site.config.js";
import { renderContactDetails, renderWhatsAppButton } from "../components/cards.js";
import { renderPageBanner, renderPhoto } from "../components/media.js";
import { escapeHtml } from "../core/dom.js";
import { bindContactForm, renderContactForm } from "../forms/contact-form.js";

export const contactPage = {
  title: "Contact",
  navId: "contact",

  render(query) {
    return `
      ${renderPageBanner({
        title: "Talk to the school",
        intro: BRAND.whatsapp
          ? "WhatsApp is the quickest way to reach us. Chat now, or fill in the form and we'll open WhatsApp with your details ready to send."
          : "Send a question, or book a free trial if your child wants to play.",
        photo: "header",
        actions: renderWhatsAppButton(),
      })}

      <!-- Form and side panel -->
      <section class="section"><div class="container form-layout">
        <div id="contact-form-container">${renderContactForm(query.topic)}</div>
        <aside class="side-panel">
          ${renderPhoto("strike", { width: 700, ratio: "16/10" })}
          <div class="side-panel__body">
            <h3>Reach us directly</h3>
            ${renderContactDetails() || `<p>Use the form and we will get back to you.</p>`}
            <p>Trial bookings go faster through the trial form.</p>
            <a class="btn btn--ghost" href="/book-trial/">Book a free trial</a>
          </div>
        </aside>
      </div></section>

      <!-- FAQ -->
      <section class="section"><div class="container">
        <div class="section-head"><div><h2>Common questions</h2></div></div>
        <div class="faq">
          ${FAQ.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}
        </div>
      </div></section>`;
  },

  mount: bindContactForm,
};
