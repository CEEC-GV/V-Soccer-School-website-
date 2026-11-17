/**
 * ============================================================================
 * pages/faq.page.js  ->  /faq/
 * ----------------------------------------------------------------------------
 * Questions parents ask most. The same list feeds the Contact page and the
 * FAQPage structured data (core/seo.js), so edit it once in site.config.js.
 * ============================================================================
 */
import { FAQ } from "../config/site.config.js";
import { renderPageBanner } from "../components/media.js";
import { renderWhatsAppButton } from "../components/cards.js";
import { escapeHtml } from "../core/dom.js";

export const faqPage = {
  title: "FAQ",
  navId: "",

  render() {
    return `
      ${renderPageBanner({
        title: "Questions parents ask",
        intro: "Starting age, the free trial, what to bring and how the squads work.",
        photo: "kitup",
      })}
      <section class="section"><div class="container container--narrow">
        <div class="faq faq--open">
          ${FAQ.map((item) => `
            <details open>
              <summary><h2 class="faq__question">${escapeHtml(item.question)}</h2></summary>
              <p>${escapeHtml(item.answer)}</p>
            </details>`).join("")}
        </div>
        <h2 style="margin-top:48px">Still have a question?</h2>
        <p class="lede" style="margin:10px 0 22px">Message us, or bring your child for a free session and ask the coach in person.</p>
        <div class="button-row">
          ${renderWhatsAppButton()}
          <a class="btn btn--ghost" href="/contact/">Contact page</a>
          <a class="btn btn--ghost" href="/book-trial/">Book a free trial</a>
        </div>
      </div></section>`;
  },
};
