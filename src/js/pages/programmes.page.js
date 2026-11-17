/**
 * ============================================================================
 * pages/programmes.page.js  ->  /programmes/
 * ----------------------------------------------------------------------------
 * Sections: banner, programme cards, what a 90-minute session looks like.
 * ============================================================================
 */
import { renderProgrammeGrid } from "../components/cards.js";
import { renderPageBanner, renderPhoto } from "../components/media.js";
import { escapeHtml } from "../core/dom.js";

/* Session plan shown on this screen */
const SESSION_PLAN = [
  { time: "0–15 min",  activity: "Warm-up with the ball: movement, coordination and injury prevention" },
  { time: "15–40 min", activity: "Technical block on the week's theme, such as first touch or 1v1 defending" },
  { time: "40–65 min", activity: "Game-based practice where the theme is tested under pressure" },
  { time: "65–85 min", activity: "Match play with coaching points" },
  { time: "85–90 min", activity: "Cool-down and a short talk on what was learned" },
];

export const programmesPage = {
  title: "Programmes",
  navId: "programmes",

  render() {
    return `
      ${renderPageBanner({
        title: "Training by age group",
        intro: "Each group trains in its own batch. The trial form works out your child's group from their date of birth.",
        photo: "control",
      })}

      <!-- Programme cards -->
      <section class="section"><div class="container">${renderProgrammeGrid(true)}</div></section>

      <!-- Session plan -->
      <section class="section"><div class="container">
        <div class="photo-band" style="align-items:start">
          <div>
            <h2 style="font-size:clamp(36px,5.5vw,60px);margin-bottom:24px">90 minutes on the pitch</h2>
            <ul class="honours">
              ${SESSION_PLAN.map((step) => `<li><span class="honours__label">${escapeHtml(step.time)}</span><span class="honours__value">${escapeHtml(step.activity)}</span></li>`).join("")}
            </ul>
            <div class="button-row" style="margin-top:28px">
              <a class="btn" href="/book-trial/">Book a free trial</a>
              <a class="btn btn--ghost" href="/timetable/">See batch times</a>
            </div>
          </div>
          ${renderPhoto("strike", { width: 900, ratio: "4/5" })}
        </div>
      </div></section>`;
  },
};
