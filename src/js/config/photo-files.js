/**
 * ============================================================================
 * config/photo-files.js
 * ----------------------------------------------------------------------------
 * Local copies of the photos in PHOTOS (site.config.js).
 *
 * Empty during development: photos load straight from their source.
 * `npm run build` downloads every photo at a few widths as compressed WebP
 * with a descriptive file name (e.g. /assets/photos/player-practising-on-an-
 * outdoor-pitch-960.webp) and swaps a filled-in version of this file into
 * the bundle. If a download fails, that photo keeps its original address.
 *
 * Shape: { <photo key>: { name: "file-name-stem", widths: [480, 960, 1600], ext: "webp" } }
 * ============================================================================
 */
export const PHOTO_FILES = {};
