/**
 * ============================================================================
 * scripts/photos.js
 * ----------------------------------------------------------------------------
 * Downloads every photo listed in PHOTOS (src/js/config/site.config.js) at a
 * few widths as compressed WebP, with a descriptive file name taken from the
 * photo's alt text:
 *   dist/assets/photos/player-practising-on-an-outdoor-pitch-960.webp
 *
 * Files are cached in .cache/photos so rebuilds don't download them again.
 * A photo that can't be downloaded keeps its original address (the site
 * still works), and the build prints a warning.
 *
 * Skip all downloads with PHOTO_DOWNLOAD=0.
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache/photos");
const WIDTHS = [480, 960, 1600];

/* ---------------------------------------------------------------------------
   Read the PHOTOS table without running the browser code
   (each entry is one line: key: { src: pexels(123), alt: "..." ... })
   ------------------------------------------------------------------------ */
function readPhotoTable() {
  const source = fs.readFileSync(path.join(ROOT, "src/js/config/site.config.js"), "utf8");
  const block = source.slice(source.indexOf("export const PHOTOS = {"), source.indexOf("};", source.indexOf("export const PHOTOS = {")));
  const photos = {};
  for (const match of block.matchAll(/^\s*([a-zA-Z0-9_]+):\s*\{\s*src:\s*(pexels\((\d+)\)|"([^"]+)"),\s*alt:\s*"([^"]+)"/gm)) {
    const [, key, , pexelsId, plainSrc, alt] = match;
    const src = pexelsId ? `https://images.pexels.com/photos/${pexelsId}/pexels-photo-${pexelsId}.jpeg` : plainSrc;
    photos[key] = { src, alt };
  }
  return photos;
}

/** "Player practising on an outdoor pitch in Imphal, Manipur" -> "player-practising-outdoor-pitch-imphal-manipur" */
const STOP_WORDS = new Set(["a", "an", "the", "on", "in", "of", "at", "to", "for", "his", "her", "their", "during", "beside", "and", "with"]);
function slugFromAlt(alt) {
  return alt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter((word) => !STOP_WORDS.has(word)).slice(0, 6).join("-");
}

function sourceUrl(src, width) {
  if (/images\.pexels\.com/.test(src)) return `${src}?auto=compress&cs=tinysrgb&fm=webp&w=${width}`;
  return null;   // local files (assets/...) are copied as they are
}

async function download(url) {
  const response = await fetch(url, { headers: { Accept: "image/webp,image/*" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  const ext = type.includes("webp") ? "webp" : type.includes("png") ? "png" : "jpg";
  return { data: Buffer.from(await response.arrayBuffer()), ext };
}

/* ---------------------------------------------------------------------------
   Run: returns the PHOTO_FILES table for the bundle
   ------------------------------------------------------------------------ */
async function buildPhotos(outputDir) {
  if (process.env.PHOTO_DOWNLOAD === "0") return {};
  const photos = readPhotoTable();
  const files = {};
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  await Promise.all(Object.entries(photos).map(async ([key, photo]) => {
    if (!sourceUrl(photo.src, 100)) return;
    const name = slugFromAlt(photo.alt);
    try {
      let ext = null;
      for (const width of WIDTHS) {
        const cached = fs.readdirSync(CACHE_DIR).find((file) => file.startsWith(`${name}-${width}.`));
        let data;
        if (cached) {
          data = fs.readFileSync(path.join(CACHE_DIR, cached));
          ext = ext || path.extname(cached).slice(1);
        } else {
          const result = await download(sourceUrl(photo.src, width));
          data = result.data;
          ext = ext || result.ext;
          fs.writeFileSync(path.join(CACHE_DIR, `${name}-${width}.${ext}`), data);
        }
        fs.writeFileSync(path.join(outputDir, `${name}-${width}.${ext}`), data);
      }
      files[key] = { name, widths: WIDTHS, ext };
    } catch (error) {
      console.warn(`⚠  Photo "${key}" not downloaded (${error.message}); it will load from its source.`);
    }
  }));

  return files;
}

module.exports = { buildPhotos };
