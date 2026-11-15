/**
 * ============================================================================
 * pages/grounds.page.js
 * ----------------------------------------------------------------------------
 * Two screens:
 *   branchesPage     #branches          all grounds as cards
 *   groundDetailPage #ground-<id>       one ground: live status, batches,
 *                                       booking, directions, other grounds
 * ============================================================================
 */
import { GROUNDS, findGround } from "../config/site.config.js";
import { renderGroundCard, renderLiveStatus, renderSessionList } from "../components/cards.js";
import { renderPageBanner, renderPhoto } from "../components/media.js";
import { escapeHtml, mapsUrl } from "../core/dom.js";

/* ---------------------------------------------------------------------------
   #branches
   ------------------------------------------------------------------------ */
export const branchesPage = {
  title: "Branches",
  navId: "branches",

  render() {
    return `
      ${renderPageBanner({
        title: "Where we train",
        intro: "Status updates live in Bengaluru time. Green means a batch is on the pitch right now.",
        photo: "strike",
      })}
      <section class="section"><div class="container">
        <div class="ground-grid">${GROUNDS.map(renderGroundCard).join("")}</div>
      </div></section>`;
  },
};

/* ---------------------------------------------------------------------------
   #ground-<id>
   ------------------------------------------------------------------------ */
export const groundDetailPage = {
  title: "Branches",
  navId: "branches",

  render(query, groundId) {
    const ground = findGround(groundId);
    if (!ground) return branchesPage.render();
    const otherGrounds = GROUNDS.filter((g) => g.id !== ground.id);

    return `
      ${renderPageBanner({
        title: escapeHtml(ground.name),
        intro: ground.summary,
        photo: ground.photo,
      })}

      <!-- Live status, batches and actions -->
      <section class="section"><div class="container split ground-detail">
        <div>
          <h3 class="subhead">Right now</h3>
          <div style="margin:10px 0 26px" data-live-status="${ground.id}">${renderLiveStatus(ground)}</div>
          <h3 class="subhead">Weekly batches</h3>
          ${renderSessionList(ground)}
          <div class="button-row" style="margin-top:28px">
            <a class="btn" href="#book-trial?ground=${ground.id}">Book a trial here</a>
            <a class="btn btn--ghost" href="${mapsUrl(ground.mapQuery)}" target="_blank" rel="noopener">Get directions</a>
            <a class="btn btn--ghost" href="#timetable?ground=${ground.id}">Timetable</a>
          </div>
        </div>
        <div>${renderPhoto(ground.photo, { width: 1000, ratio: "4/3" })}</div>
      </div></section>

      <!-- Other grounds -->
      <section class="section"><div class="container">
        <div class="section-head">
          <div><h2>More places to train</h2></div>
          <a class="btn btn--ghost" href="#branches">All branches</a>
        </div>
        <div class="ground-grid">${otherGrounds.map(renderGroundCard).join("")}</div>
      </div></section>`;
  },
};
