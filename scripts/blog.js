/**
 * ============================================================================
 * scripts/blog.js
 * ----------------------------------------------------------------------------
 * Pulls the school's published blog posts from BlogSpeed (blogspeed.io) and
 * writes them into src/js/config/blog-data.js (generated, git-ignored), which
 * the /blog/ pages read.
 *
 * Why at build time: the site is static (GitHub Pages) and the BlogSpeed API
 * key is a secret. It must never reach the browser, so it is used only here,
 * in Node, while building. Readers get finished HTML.
 *
 * Saving the monthly quota (1,000 requests per key):
 *   - 1 request per build for the post list   (GET /blogs/index)
 *   - 1 request per NEW or EDITED post          (GET /blogs/:id)
 *     Unchanged posts come from .cache/blog/ (kept between CI runs).
 *   /blogs/:id is used rather than /blogs/slug/:slug so building doesn't
 *   add fake page views to BlogSpeed Analytics.
 *
 * If BlogSpeed can't be reached, the last cached copy is used. Without a key,
 * the blog simply shows "No posts yet".
 *
 * Used by:
 *   scripts/build.js  before bundling
 *   server.js         once at npm start (in the background)
 *   npm run blog      on its own
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");
const { readEnvFile } = require("./env.js");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "src/js/config/blog-data.js");
const CACHE_DIR = path.join(ROOT, ".cache/blog");
const INDEX_CACHE = path.join(CACHE_DIR, "index.json");

/* ---------------------------------------------------------------------------
   Settings (.env first, then real environment variables / CI secrets)
   ------------------------------------------------------------------------ */
function settings() {
  const { values } = readEnvFile();
  const pick = (name) => (values[name] || process.env[name] || "").trim();
  return {
    api: (pick("BLOGSPEED_API_URL") || "https://blogspeed.io/api").replace(/\/+$/, ""),
    key: pick("BLOGSPEED_API_KEY"),
  };
}

/* ---------------------------------------------------------------------------
   API call
   ------------------------------------------------------------------------ */
async function call(api, key, apiPath) {
  const response = await fetch(`${api}${apiPath}`, {
    headers: { Authorization: `ApiKey ${key}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    let message = "";
    try { const body = await response.json(); message = body.message || body.error || ""; } catch { /* not JSON */ }
    const error = new Error(`BlogSpeed ${response.status}${message ? `: ${message}` : ""} (${apiPath})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/* ---------------------------------------------------------------------------
   Markdown -> safe HTML that passes scripts/check.js
   ------------------------------------------------------------------------ */
function renderMarkdown(markdown) {
  const raw = marked.parse(markdown || "", { gfm: true });
  return sanitizeHtml(raw, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h2", "figure", "figcaption"],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      th: ["align"], td: ["align"], code: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      // The page title is the only <h1>, so headings in the post start at <h2>
      h1: "h2",
      // Every image needs alt, width and height (no layout shift; CSS keeps the real shape)
      img: (tagName, attribs) => ({
        tagName,
        attribs: { alt: "", width: "1200", height: "675", loading: "lazy", decoding: "async", ...attribs },
      }),
      // Links to other websites open in a new tab
      a: (tagName, attribs) => (/^https?:\/\//i.test(attribs.href || "")
        ? { tagName, attribs: { ...attribs, target: "_blank", rel: "noopener" } }
        : { tagName, attribs }),
    },
  });
}

const plainText = (html) => html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

function shorten(text, max = 158) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Keeps only what the pages need. */
function toPagePost(post) {
  const html = renderMarkdown(post.content);
  const text = plainText(html);
  const seo = post.seo || {};
  return {
    id: post._id,
    slug: post.slug,
    title: post.title || "Untitled",
    excerpt: post.excerpt || shorten(text, 200),
    coverImage: post.coverImage || "",
    category: post.category || "",
    author: post.author || "",
    publishedAt: post.publishAt || post.createdAt,
    updatedAt: post.updatedAt || post.createdAt,
    readingMinutes: Math.max(1, Math.round(text.split(" ").length / 200)),
    metaTitle: seo.metaTitle || "",
    metaDescription: seo.metaDescription || post.excerpt || shorten(text),
    keywords: [seo.primaryKeyphrase, ...(seo.secondaryKeyphrases || [])].filter(Boolean),
    structuredData: Array.isArray(post.structuredData) ? post.structuredData : [],
    html,
  };
}

/* ---------------------------------------------------------------------------
   Fetch every published post (cached by updatedAt)
   ------------------------------------------------------------------------ */
async function fetchPosts({ api, key }) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let index;
  try {
    index = (await call(api, key, "/blogs/index"))?.data || [];
    fs.writeFileSync(INDEX_CACHE, JSON.stringify(index));
  } catch (error) {
    // Bad / revoked key or missing scope: always stop, it needs fixing.
    if (error.status === 401 || error.status === 403) throw error;
    if (!fs.existsSync(INDEX_CACHE)) throw error;
    console.warn(`⚠  ${error.message}. Using the last cached copy of the blog.`);
    index = JSON.parse(fs.readFileSync(INDEX_CACHE, "utf8"));
  }

  const posts = [];
  let downloaded = 0;
  for (const item of index) {
    const cacheFile = path.join(CACHE_DIR, `${String(item._id).replace(/[^a-z0-9_-]/gi, "")}.json`);
    let full = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : null;
    if (!full || full.updatedAt !== item.updatedAt) {
      try {
        full = await call(api, key, `/blogs/${encodeURIComponent(item._id)}`);
        if (!full) continue;                               // unpublished since the list was made
        fs.writeFileSync(cacheFile, JSON.stringify(full));
        downloaded += 1;
      } catch (error) {
        if (!full) throw error;
        console.warn(`⚠  ${error.message}. Using the cached copy of "${item.title}".`);
      }
    }
    if (full.slug) posts.push(toPagePost(full));
  }
  posts.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  return { posts, downloaded };
}

/* ---------------------------------------------------------------------------
   Write src/js/config/blog-data.js
   ------------------------------------------------------------------------ */
function writeModule(posts) {
  fs.writeFileSync(OUTPUT_FILE, `/**
 * GENERATED FILE: do not edit and do not commit (it is in .gitignore).
 * Written by scripts/blog.js from the posts published in BlogSpeed.
 * To change a post, edit it in BlogSpeed and rebuild.
 */
export const BLOG_POSTS = ${JSON.stringify(posts, null, 2)};
`);
}

/**
 * Updates blog-data.js. strict = true (the build) stops on errors so a broken
 * key can't silently deploy an empty blog; strict = false (npm start) only warns.
 */
async function updateBlog({ strict = false, quiet = false } = {}) {
  const config = settings();
  if (!config.key) {
    if (!fs.existsSync(OUTPUT_FILE)) writeModule([]);
    if (!quiet) console.warn("⚠  BLOGSPEED_API_KEY is empty, so the blog shows no posts. See README > Blog setup.");
    return { posts: [], skipped: true };
  }
  try {
    const { posts, downloaded } = await fetchPosts(config);
    writeModule(posts);
    if (!quiet) console.log(`Blog: ${posts.length} published post(s) from BlogSpeed (${downloaded} downloaded, ${posts.length - downloaded} from cache)`);
    return { posts };
  } catch (error) {
    if (strict) throw new Error(`Couldn't load the blog from BlogSpeed: ${error.message}`);
    if (!fs.existsSync(OUTPUT_FILE)) writeModule([]);
    console.warn(`⚠  Couldn't load the blog from BlogSpeed: ${error.message}`);
    return { posts: [], error };
  }
}

module.exports = { updateBlog, OUTPUT_FILE, renderMarkdown };

// `node scripts/blog.js` (npm run blog)
if (require.main === module) {
  updateBlog({ strict: true }).catch((error) => {
    console.error(`✗  ${error.message}`);
    process.exit(1);
  });
}
