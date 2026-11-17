/**
 * ============================================================================
 * components/media.js
 * ----------------------------------------------------------------------------
 * Photo frames, page banners, the scrolling photo strip and the hero video.
 * Images are requested at the width they are shown at, lazy-loaded, and fall
 * back to a drawn pitch placeholder if they fail to load.
 * ============================================================================
 */
import { HERO_VIDEO, PHOTOS } from "../config/site.config.js";
import { PHOTO_FILES } from "../config/photo-files.js";
import { registerAction } from "../core/actions.js";
import { escapeHtml } from "../core/dom.js";

/* ---------------------------------------------------------------------------
   Image URL with a size hint for known photo hosts
   ------------------------------------------------------------------------ */
export function imageUrl(src, width) {
  if (/images\.pexels\.com/.test(src)) return `${src}?auto=compress&cs=tinysrgb&w=${width}`;
  if (/images\.unsplash\.com/.test(src)) return `${src}?auto=format&fit=crop&w=${width}&q=72`;
  return src;
}

/* ---------------------------------------------------------------------------
   Photo frame
   key:     a key from PHOTOS in site.config.js
   options: width (px requested), className, ratio ("4/3"), eager (no lazy load)
   ------------------------------------------------------------------------ */
export function renderPhoto(key, { width = 1200, className = "", ratio, eager = false } = {}) {
  const photo = PHOTOS[key];
  if (!photo) return "";
  const style = ratio ? ` style="--ratio:${ratio}"` : "";

  // Intrinsic size from the frame's shape, so the browser reserves the space (no layout shift)
  const [ratioW, ratioH] = String(ratio || photo.ratio || "3/2").split("/").map(Number);
  const height = Math.round((width * ratioH) / ratioW);

  return `
    <figure class="photo ${className}" data-caption="${escapeHtml(photo.alt)}"${style}>
      <img ${photoSources(key, photo, width)} alt="${escapeHtml(photo.alt)}" width="${width}" height="${height}"
           style="object-position:${photo.focus || "center"}"
           ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
           onerror="this.parentNode.classList.add('photo--placeholder');this.remove()">
    </figure>`;
}

/* src / srcset: the local WebP copies after a build, otherwise the source */
function photoSources(key, photo, width) {
  const local = PHOTO_FILES[key];
  if (!local) return `src="${imageUrl(photo.src, width)}"`;
  const fileFor = (w) => `/assets/photos/${local.name}-${w}.${local.ext}`;
  const best = local.widths.find((w) => w >= width) || local.widths[local.widths.length - 1];
  const srcset = local.widths.map((w) => `${fileFor(w)} ${w}w`).join(", ");
  return `src="${fileFor(best)}" srcset="${srcset}" sizes="(max-width: 760px) 100vw, ${width}px"`;
}

/* ---------------------------------------------------------------------------
   Hero background video
   Phones get HERO_VIDEO.mobileSrc (smaller file) first, then the full one.
   The fallback photo is always drawn underneath, so if the video is skipped
   (data saver, reduced motion) or every file fails to load, the photo shows.
   ------------------------------------------------------------------------ */
export function shouldPlayHeroVideo() {
  if (navigator.webdriver) return false;   // pre-rendering at build time: keep the static HTML light
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveData = navigator.connection?.saveData === true;
  return Boolean(HERO_VIDEO.src) && !reducedMotion && !saveData;
}

function heroVideoSources() {
  const phone = window.matchMedia("(max-width: 760px)").matches;
  const list = phone ? [HERO_VIDEO.mobileSrc, HERO_VIDEO.src] : [HERO_VIDEO.src];
  return [...new Set(list.filter(Boolean))];
}

export function renderHeroMedia() {
  const photo = renderPhoto(HERO_VIDEO.fallbackPhoto, { width: 2000, eager: true });
  if (!shouldPlayHeroVideo()) return photo;

  // The browser tries each <source> in order. Only when the LAST one fails
  // is the video (and its pause button) removed, leaving the photo.
  const sources = heroVideoSources();
  const removeVideo = `var v=this.parentNode; v.nextElementSibling && v.nextElementSibling.remove(); v.remove()`;
  const sourceTags = sources.map((src, index) =>
    `<source src="${src}" type="video/mp4"${index === sources.length - 1 ? ` onerror="${removeVideo}"` : ""}>`).join("\n      ");

  return `
    ${photo}
    <video class="hero__video" autoplay muted loop playsinline preload="auto" aria-label="${escapeHtml(HERO_VIDEO.label)}">
      ${sourceTags}
    </video>
    <button type="button" class="hero__video-toggle" data-action="toggle-hero-video" aria-pressed="false">Pause video</button>`;
}

/* ---------------------------------------------------------------------------
   Section background photo (sits behind a section's content)
   ------------------------------------------------------------------------ */
export function renderSectionBackground(key) {
  return `<div class="section-bg" aria-hidden="true">${renderPhoto(key, { width: 2000 })}</div>`;
}

/* ---------------------------------------------------------------------------
   Photo strip: every photo in a slow sideways loop.
   The list is drawn twice so the loop joins up seamlessly; the copy is
   hidden from screen readers.
   ------------------------------------------------------------------------ */
export function renderPhotoStrip(keys = Object.keys(PHOTOS)) {
  const items = [...keys, ...keys].map((key, index) => `
    <li class="photo-strip__item" ${index >= keys.length ? 'aria-hidden="true"' : ""}>${renderPhoto(key, { width: 600, ratio: "4/5" })}</li>`);
  return `<div class="photo-strip"><ul class="photo-strip__track">${items.join("")}</ul></div>`;
}

/* ---------------------------------------------------------------------------
   Page banner (photo background, title, intro line)
   `title` may contain trusted markup from page modules; `intro` is escaped.
   ------------------------------------------------------------------------ */
export function renderPageBanner({ title, intro = "", photo, actions = "" }) {
  return `
    <div class="page-banner">
      ${renderPhoto(photo, { width: 1800, eager: true })}
      <div class="container page-banner__inner">
        <h1>${title}</h1>
        ${intro ? `<p class="lede">${escapeHtml(intro)}</p>` : ""}
        ${actions ? `<div class="button-row page-banner__actions">${actions}</div>` : ""}
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------------
   Actions
   ------------------------------------------------------------------------ */
registerAction("toggle-hero-video", (button) => {
  const video = document.querySelector(".hero__video");
  if (!video) return;
  const pause = !video.paused;
  pause ? video.pause() : video.play();
  button.textContent = pause ? "Play video" : "Pause video";
  button.setAttribute("aria-pressed", String(pause));
});
