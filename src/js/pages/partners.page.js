/**
 * ============================================================================
 * pages/partners.page.js  ->  /partners/
 * ----------------------------------------------------------------------------
 * Partner cards and a partnership enquiry call-to-action.
 * ============================================================================
 */
import { renderPartnerGrid } from "../components/cards.js";
import { renderPageBanner, renderPhoto, renderSectionBackground } from "../components/media.js";

export const partnersPage = {
  title: "Partners",
  navId: "partners",

  render() {
    return `
      ${renderPageBanner({
        title: "Clubs and academies we work with",
        intro: "Our partners give V Soccer School players better facilities, more fixtures and a home ground.",
        photo: "imphal",
      })}

      <section class="section section--photo">${renderSectionBackground("turf")}<div class="container">${renderPartnerGrid()}</div></section>

      <section class="section section--band"><div class="container photo-band">
        <div>
          <h2>Want to partner with us?</h2>
          <p class="lede" style="margin:12px 0 24px">Clubs, schools and sponsors can work with us on facilities, fixtures and player development.</p>
          <a class="btn" href="/contact/?topic=partnership">Talk to us</a>
        </div>
        ${renderPhoto("kitup", { width: 900, ratio: "4/3" })}
      </div></section>`;
  },
};
