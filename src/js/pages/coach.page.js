/**
 * ============================================================================
 * pages/coach.page.js  ->  #coach
 * ----------------------------------------------------------------------------
 * Head coach profile: licences, awards and recognition.
 * ============================================================================
 */
import { COACH } from "../config/site.config.js";
import { renderCoachCard, renderHonoursList } from "../components/cards.js";
import { renderPageBanner } from "../components/media.js";
import { escapeHtml } from "../core/dom.js";

export const coachPage = {
  title: "Head Coach",
  navId: "coach",

  render() {
    return `
      ${renderPageBanner({
        title: escapeHtml(COACH.name),
        intro: "Former national-level footballer and the coach behind every session plan at V Soccer School.",
        photo: "imphal",
      })}

      <section class="section"><div class="container coach-layout">
        ${renderCoachCard()}
        <div>
          <h2>Awards & recognition</h2>
          <p class="lede" style="margin-bottom:28px">Ramesh played the game at national level before moving into coaching. He has coached Karnataka's junior and sub-junior state teams and worked with professional club sides in the KSFA League.</p>
          ${renderHonoursList()}
          <div class="button-row" style="margin-top:24px">
            <a class="btn" href="#book-trial">Train with Ramesh</a>
            <a class="btn btn--ghost" href="#contact?topic=coach">Ask the coach a question</a>
          </div>
        </div>
      </div></section>`;
  },
};
