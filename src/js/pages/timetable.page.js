/**
 * ============================================================================
 * pages/timetable.page.js  ->  /timetable/   (optional ?ground=<id>)
 * ----------------------------------------------------------------------------
 * Weekly grid of every batch. Tap a session to book a trial in it.
 * ============================================================================
 */
import { findGround } from "../config/site.config.js";
import { renderPageBanner, renderPhotoStrip } from "../components/media.js";
import { renderTimetableFilters, renderWeekList, renderWeekTable, timetableState } from "../components/timetable.js";

export const timetablePage = {
  title: "Timetable",
  navId: "timetable",

  render(query) {
    // A link like #timetable?ground=varthur opens the table filtered to that ground.
    if (query.ground && findGround(query.ground)) timetableState.groundFilter = query.ground;

    return `
      ${renderPageBanner({
        title: "This week on the pitch",
        intro: "Tap any session to book a trial in that batch.",
        photo: "teen",
      })}
      <section class="section"><div class="container">
        <div class="section-head" style="margin-bottom:20px">
          ${renderTimetableFilters()}
          <p class="mono-meta" data-live="clock"></p>
        </div>
        <!-- Desktop / tablet: weekly grid -->
        <div class="table-scroll"><table class="week-table" data-live="timetable">${renderWeekTable()}</table></div>
        <!-- Phones: day-by-day list -->
        <div class="week-list" data-live="timetable-list">${renderWeekList()}</div>
      </div></section>
      <section class="section">${renderPhotoStrip()}</section>`;
  },
};
