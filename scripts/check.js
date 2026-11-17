/**
 * ============================================================================
 * scripts/check.js
 * ----------------------------------------------------------------------------
 * Quality and SEO checks on the built site (dist/). The CI pipeline runs this
 * after every build; a failed check stops the deploy.
 *
 * Errors (fail the build)
 *   - every page: exactly one <h1>, a <title>, a meta description
 *   - titles and descriptions are unique across indexable pages
 *   - indexable pages have a canonical URL that is listed in sitemap.xml,
 *     and every sitemap URL has a page
 *   - Schema.org JSON-LD parses
 *   - every <img> has alt, width and height
 *   - every internal link opens a page (no 404s)
 *   - robots.txt points to the sitemap and doesn't block the site
 *   - 404.html exists and is noindex; the Open Graph image exists
 * Warnings (printed only)
 *   - title over 65 characters, description outside 70–170 characters
 *
 * Run:  npm run check        (after npm run build)
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");
const { startServer } = require("../server.js");

const DIST = path.resolve(__dirname, "../dist");
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

/* ---------------------------------------------------------------------------
   Collect pages
   ------------------------------------------------------------------------ */
function htmlFiles(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return name === "assets" ? [] : htmlFiles(full);
    return name.endsWith(".html") ? [full] : [];
  });
}

const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`)) || [])[1];
const metaContent = (html, key) => {
  const tag = (html.match(new RegExp(`<meta[^>]*(?:name|property)="${key}"[^>]*>`)) || [])[0];
  return tag ? attr(tag, "content") : undefined;
};

function readPage(file) {
  const html = fs.readFileSync(file, "utf8");
  const urlPath = `/${path.relative(DIST, file).replace(/\\/g, "/").replace(/index\.html$/, "")}`;
  const canonicalTag = (html.match(/<link[^>]*rel="canonical"[^>]*>/) || [])[0];
  return {
    file: path.relative(DIST, file),
    urlPath,
    html,
    title: (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1],
    description: metaContent(html, "description"),
    robots: metaContent(html, "robots") || "",
    canonical: canonicalTag ? attr(canonicalTag, "href") : undefined,
  };
}

/* ---------------------------------------------------------------------------
   Checks on each page's HTML
   ------------------------------------------------------------------------ */
function checkPage(page) {
  const { file, html } = page;
  const indexable = !page.robots.includes("noindex");
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) fail(`${file}: has ${h1Count} <h1> headings (needs exactly 1)`);
  if (!page.title) fail(`${file}: no <title>`);
  if (!page.description) fail(`${file}: no meta description`);

  if (indexable && !page.canonical) fail(`${file}: indexable page without a canonical URL`);
  if (indexable && page.title && page.title.length > 65) warn(`${file}: title is ${page.title.length} characters (Google shows about 60)`);
  if (indexable && page.description && (page.description.length < 70 || page.description.length > 170)) warn(`${file}: description is ${page.description.length} characters (aim for 70–170)`);

  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(match[1]); } catch { fail(`${file}: Schema.org JSON-LD doesn't parse`); }
  }

  for (const img of html.match(/<img\b[^>]*>/g) || []) {
    const src = attr(img, "src") || "(no src)";
    if (attr(img, "alt") === undefined) fail(`${file}: image without alt text: ${src}`);
    if (!attr(img, "width") || !attr(img, "height")) fail(`${file}: image without width/height: ${src}`);
  }
  return indexable;
}

/* ---------------------------------------------------------------------------
   Run
   ------------------------------------------------------------------------ */
async function run() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    console.error("dist/ not found. Run npm run build first.");
    process.exit(1);
  }

  const pages = htmlFiles(DIST).map(readPage);
  const indexable = pages.filter(checkPage);

  // Unique titles and descriptions
  for (const key of ["title", "description"]) {
    const seen = new Map();
    for (const page of indexable) {
      if (!page[key]) continue;
      if (seen.has(page[key])) fail(`Same ${key} on ${seen.get(page[key])} and ${page.file}`);
      else seen.set(page[key], page.file);
    }
  }

  // Sitemap <-> pages
  const sitemapPath = path.join(DIST, "sitemap.xml");
  const sitemapUrls = fs.existsSync(sitemapPath) ? [...fs.readFileSync(sitemapPath, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [];
  if (!sitemapUrls.length) fail("sitemap.xml is missing or empty");
  for (const page of indexable) if (page.canonical && !sitemapUrls.includes(page.canonical)) fail(`${page.file}: canonical ${page.canonical} is not in sitemap.xml`);
  for (const url of sitemapUrls) {
    const urlPath = new URL(url).pathname;
    if (!fs.existsSync(path.join(DIST, urlPath, urlPath.endsWith("/") ? "index.html" : ""))) fail(`sitemap.xml lists ${url} but there is no page for it`);
  }

  // robots.txt
  const robots = fs.existsSync(path.join(DIST, "robots.txt")) ? fs.readFileSync(path.join(DIST, "robots.txt"), "utf8") : "";
  if (!/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robots)) fail("robots.txt doesn't point to sitemap.xml");
  if (/^Disallow:\s*\/\s*$/m.test(robots)) fail("robots.txt blocks the whole site");

  // 404 page and share image
  const notFound = pages.find((page) => page.file === "404.html");
  if (!notFound) fail("404.html is missing");
  else if (!notFound.robots.includes("noindex")) fail("404.html should be noindex");
  const ogImage = metaContent(pages.find((page) => page.urlPath === "/").html, "og:image");
  if (!ogImage) fail("Home page has no og:image");
  else if (!fs.existsSync(path.join(DIST, new URL(ogImage).pathname))) fail(`og:image file not found in dist: ${new URL(ogImage).pathname}`);

  // Every internal link opens a page
  const links = new Set(pages.flatMap((page) => [...page.html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"))));
  const port = 4900 + Math.floor(Math.random() * 300);
  const server = await startServer({ root: DIST, mode: "dist", port, quiet: true });
  for (const link of links) {
    const response = await fetch(`http://localhost:${port}${link}`, { redirect: "manual" });
    if (response.status !== 200) fail(`Broken internal link ${link} (HTTP ${response.status})`);
  }
  server.close();

  // Report
  warnings.forEach((message) => console.warn(`⚠  ${message}`));
  if (errors.length) {
    errors.forEach((message) => console.error(`✗  ${message}`));
    console.error(`\n${errors.length} check(s) failed.`);
    process.exit(1);
  }
  console.log(`✓  ${pages.length} pages, ${indexable.length} indexable, ${sitemapUrls.length} in sitemap, ${links.size} internal links: all checks passed.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
