/**
 * ============================================================================
 * pages/gallery.page.js  ->  #gallery   (optional ?category=<name>)
 * ----------------------------------------------------------------------------
 * Photo grid with category filters. Photos open in the lightbox.
 * ============================================================================
 */
import { GALLERY } from "../config/site.config.js";
import { renderGalleryGrid } from "../components/cards.js";
import { renderPageBanner } from "../components/media.js";
import { escapeHtml } from "../core/dom.js";
import { buildHash } from "../core/router.js";

const ALL = "All";

export const galleryPage = {
  title: "Gallery",
  navId: "gallery",

  render(query) {
    const categories = [ALL, ...new Set(GALLERY.map((item) => item.category))];
    const active = categories.includes(query.category) ? query.category : ALL;
    const items = GALLERY.filter((item) => active === ALL || item.category === active);

    const filters = categories.map((category) => `
      <a class="filter-chip" href="${buildHash("gallery", { category: category === ALL ? "" : category })}"
         aria-pressed="${category === active}">${escapeHtml(category)}</a>`).join("");

    return `
      ${renderPageBanner({
        title: "On the pitch",
        intro: "Training sessions, match days and players at work on the ball.",
        photo: "practice",
      })}
      <section class="section"><div class="container">
        <div class="filter-row" style="margin-bottom:22px">${filters}</div>
        ${renderGalleryGrid(items)}
      </div></section>`;
  },
};
