/**
 * ============================================================================
 * components/lightbox.js
 * ----------------------------------------------------------------------------
 * Full-screen photo viewer for the gallery.
 * Controls: Previous / Next buttons, arrow keys, Escape or Close to exit.
 * ============================================================================
 */
import { GALLERY } from "../config/site.config.js";
import { registerAction } from "../core/actions.js";
import { escapeHtml } from "../core/dom.js";
import { renderPhoto } from "./media.js";

let currentIndex = -1;

/* ---------------------------------------------------------------------------
   Open / close / step
   ------------------------------------------------------------------------ */
export function openLightbox(index) {
  currentIndex = (index + GALLERY.length) % GALLERY.length;
  const item = GALLERY[currentIndex];
  const root = document.getElementById("lightbox-root");

  root.innerHTML = `
    <div class="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" data-action="close-photo-backdrop">
      <div class="lightbox__top">
        <span>${currentIndex + 1} / ${GALLERY.length} · ${escapeHtml(item.category)}</span>
        <button type="button" class="btn btn--sm btn--ghost" data-action="close-photo">Close</button>
      </div>
      <div class="lightbox__stage">${renderPhoto(item.photo, { width: 1800, eager: true })}</div>
      <div>
        <p class="lightbox__caption">${escapeHtml(item.caption)}</p>
        <div class="lightbox__nav">
          <button type="button" class="btn btn--sm btn--ghost" data-action="previous-photo">Previous</button>
          <button type="button" class="btn btn--sm btn--ghost" data-action="next-photo">Next</button>
        </div>
      </div>
    </div>`;

  document.body.style.overflow = "hidden";
  root.querySelector('[data-action="close-photo"]').focus();
}

export function closeLightbox() {
  const root = document.getElementById("lightbox-root");
  if (root) root.innerHTML = "";
  document.body.style.overflow = "";
  currentIndex = -1;
}

const isOpen = () => currentIndex >= 0;

/* ---------------------------------------------------------------------------
   Actions and keyboard
   ------------------------------------------------------------------------ */
registerAction("open-photo", (element) => openLightbox(Number(element.dataset.index)));
registerAction("close-photo", () => closeLightbox());
registerAction("next-photo", () => openLightbox(currentIndex + 1));
registerAction("previous-photo", () => openLightbox(currentIndex - 1));
// Clicking the dark area around the photo closes it (but not clicks inside).
registerAction("close-photo-backdrop", (element, event) => {
  if (event.target === element) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!isOpen()) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") openLightbox(currentIndex + 1);
  if (event.key === "ArrowLeft") openLightbox(currentIndex - 1);
});
