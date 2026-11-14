/**
 * ============================================================================
 * pages/about.page.js  ->  #about
 * ----------------------------------------------------------------------------
 * Sections: banner, school story with key facts, home ground.
 * ============================================================================
 */
import { findGround } from "../config/site.config.js";
import { renderGroundCard } from "../components/cards.js";
import { renderPageBanner, renderPhoto } from "../components/media.js";

export const aboutPage = {
  title: "About",
  navId: "about",

  render() {
    return `
      ${renderPageBanner({
        title: "One school, four grounds, one way of playing",
        intro: "V Soccer School is a Bengaluru football school for boys and girls aged 5 to 17.",
        photo: "araku",
      })}

      <!-- Story and facts -->
      <section class="section"><div class="container split">
        <div>
          <p class="lede" style="color:var(--color-text);font-size:19px">Every batch, at every ground, follows the same session plan written by our head coach, Ramesh B.</p>
          <p style="margin-top:16px">Young players start with ball mastery and small-sided games. As they move up the age groups they learn positions, team shape and how to compete in league football. Players who show the commitment move into our advanced squad at INSA Sports Academy, our home ground.</p>
          <p>We keep batches small so coaches can correct technique one player at a time, and we send regular progress notes home so parents know what their child is working on.</p>
          <div class="fact-grid">
            <div><b>4</b><span>Grounds across east Bengaluru</span></div>
            <div><b>5–17</b><span>Ages we coach</span></div>
            <div><b>AFC 'B'</b><span>Head coach's diploma licence</span></div>
            <div><b>KSFA</b><span>League coaching experience</span></div>
          </div>
          <div class="button-row" style="margin-top:24px">
            <a class="btn" href="#branches">Find a ground</a>
            <a class="btn btn--ghost" href="#coach">Meet the coach</a>
          </div>
        </div>
        <div class="collage">
          ${renderPhoto("teen", { width: 900 })}
          ${renderPhoto("balance", { width: 700 })}
          ${renderPhoto("strike", { width: 700 })}
        </div>
      </div></section>

      <!-- Home ground -->
      <section class="section"><div class="container">
        <div class="section-head"><div><h2>INSA Sports Academy</h2></div></div>
        <div class="split">
          <div>
            <p class="lede">INSA Sports Academy is where V Soccer School is based. The advanced squad trains here twice a week and Saturday match days are played here, so every player in the school gets regular game time on a full-size pitch.</p>
            <div class="button-row" style="margin-top:22px"><a class="btn btn--ghost" href="#ground-insa">Home ground details</a></div>
          </div>
          <div>${renderGroundCard(findGround("insa"))}</div>
        </div>
      </div></section>`;
  },
};
