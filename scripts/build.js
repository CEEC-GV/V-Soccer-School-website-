/**
 * ============================================================================
 * scripts/build.js
 * ----------------------------------------------------------------------------
 * Builds the production site into dist/, ready for GitHub Pages:
 *
 *   1. Settings     src/js/config/env.js from .env or CI secrets
 *   1b. Blog        published posts from BlogSpeed -> src/js/config/blog-data.js
 *   2. Photos       local WebP copies with descriptive names (scripts/photos.js)
 *   3. JavaScript   bundled, minified and split per page (esbuild)
 *   4. CSS          all stylesheets joined and minified into one file
 *   5. Assets       crest, icons, fonts, share image
 *   6. Pre-render   every page is opened in a headless browser and saved as
 *                   real HTML (dist/about/index.html, ...) with its own title,
 *                   description, canonical, Open Graph and Schema.org tags,
 *                   so search engines and first visits get full content
 *   7. Extras       404.html, robots.txt, sitemap.xml
 *
 * Run:  npm run build        (npm run preview = build + serve dist/)
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const esbuild = require("esbuild");
const { chromium } = require("playwright");
const { writeEnvModule } = require("./env.js");
const { updateBlog } = require("./blog.js");
const { buildPhotos } = require("./photos.js");
const { startServer } = require("../server.js");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const TEMPLATE = "_template.html";
const NOT_FOUND_PROBE = "/__page-not-found__/";

const rel = (file) => path.relative(ROOT, file);
const hash = (content) => crypto.createHash("sha256").update(content).digest("hex").slice(0, 10);

/* ============================================================================
   2. Photos -> a PHOTO_FILES module swapped into the bundle
   ========================================================================== */
function photoFilesPlugin(photoFiles) {
  return {
    name: "photo-files",
    setup(build) {
      build.onLoad({ filter: /config[\\/]photo-files\.js$/ }, () => ({
        contents: `export const PHOTO_FILES = ${JSON.stringify(photoFiles)};`,
        loader: "js",
      }));
    },
  };
}

/* ============================================================================
   3. JavaScript
   ========================================================================== */
async function buildScripts(photoFiles) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/js/app.js")],
    bundle: true,
    splitting: true,          // each page becomes its own small file
    format: "esm",
    minify: true,
    target: ["es2020"],
    outdir: path.join(DIST, "assets/js"),
    entryNames: "app-[hash]",
    chunkNames: "chunk-[hash]",
    metafile: true,
    legalComments: "none",
    plugins: [photoFilesPlugin(photoFiles)],
    logLevel: "warning",
  });

  const outputs = result.metafile.outputs;
  const entry = Object.keys(outputs).find((file) => outputs[file].entryPoint === "src/js/app.js");
  // Page module -> its chunk (for <link rel="modulepreload"> on that page)
  const pageChunks = {};
  for (const [file, info] of Object.entries(outputs)) {
    if (info.entryPoint && info.entryPoint.startsWith("src/js/pages/")) pageChunks[path.basename(info.entryPoint)] = `/${path.relative(DIST, path.join(ROOT, file))}`;
  }
  return { entry: `/${path.relative(DIST, path.join(ROOT, entry))}`, pageChunks };
}

/* ============================================================================
   4. CSS (in the order index.html lists it)
   ========================================================================== */
async function buildStyles(html) {
  const files = [...html.matchAll(/<link rel="stylesheet" href="\/(src\/styles\/[^"]+\.css)">/g)].map((match) => match[1]);
  const css = files.map((file) => fs.readFileSync(path.join(ROOT, file), "utf8")).join("\n");
  const { code } = await esbuild.transform(css, { loader: "css", minify: true, legalComments: "none" });
  const name = `site-${hash(code)}.css`;
  fs.mkdirSync(path.join(DIST, "assets/css"), { recursive: true });
  fs.writeFileSync(path.join(DIST, "assets/css", name), code);
  return { href: `/assets/css/${name}`, files };
}

/* ============================================================================
   5. Static assets
   ========================================================================== */
function copyAssets() {
  fs.cpSync(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });
}

/* ============================================================================
   Page template: index.html with the built CSS and JS
   ========================================================================== */
function writeTemplate(html, styles, scripts) {
  let template = html;
  // One minified stylesheet instead of eight
  template = template.replace(/\s*<!-- Styles[\s\S]*?-->\s*/, "\n  ");
  template = template.replace(/(\s*<link rel="stylesheet" href="\/src\/styles\/[^"]+\.css">)+/, `\n  <link rel="stylesheet" href="${styles.href}">`);
  // The bundled app
  template = template.replace(/\s*<!-- App \(ES modules\) -->\s*/, "\n  ");
  template = template.replace('<script type="module" src="/src/js/app.js"></script>', `<script type="module" src="${scripts.entry}"></script>`);
  template = template.replace(/\s*<!-- Search and social tags[\s\S]*?-->\s*/, "\n");
  fs.writeFileSync(path.join(DIST, TEMPLATE), template);
  return template;
}

/* ============================================================================
   6. Pre-render every page
   Crawls internal links from Home, so every linked page is included.
   ========================================================================== */
const PAGE_MODULES = {   // route path -> page module file (for modulepreload)
  "/": "home.page.js", "/about/": "about.page.js", "/programmes/": "programmes.page.js", "/coach/": "coach.page.js",
  "/branches/": "grounds.page.js", "/timetable/": "timetable.page.js", "/gallery/": "gallery.page.js",
  "/partners/": "partners.page.js", "/contact/": "contact.page.js", "/faq/": "faq.page.js",
  "/book-trial/": "book-trial.page.js", "/blog/": "blog.page.js", "/my-requests/": "my-requests.page.js", "/privacy/": "legal.page.js", "/terms/": "legal.page.js",
};
const moduleForPath = (urlPath) => PAGE_MODULES[urlPath]
  || (urlPath.startsWith("/grounds/") ? "grounds.page.js" : urlPath.startsWith("/blog/") ? "blog.page.js" : "not-found.page.js");

async function capturePage(page, urlPath, port) {
  await page.goto(`http://localhost:${port}${urlPath}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.dataset.route, null, { timeout: 15000 });
  return page.evaluate(() => {
    const inner = (id) => document.getElementById(id)?.innerHTML ?? "";
    const links = [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href"));
    return {
      route: document.documentElement.dataset.route,
      lang: document.documentElement.lang,
      title: document.title,
      head: [...document.head.querySelectorAll("[data-seo]")].map((el) => el.outerHTML),
      canonical: document.head.querySelector('link[rel="canonical"]')?.href || "",
      robots: document.head.querySelector('meta[name="robots"]')?.content || "",
      modified: document.head.querySelector('meta[property="article:modified_time"]')?.content || "",
      parts: Object.fromEntries(["app", "main-nav-list", "footer-links", "footer-grounds", "footer-legal", "footer-year", "ground-tabs"].map((id) => [id, inner(id)])),
      links,
    };
  });
}

function fillTemplate(template, snapshot, preload) {
  const escapeText = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  let html = template;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${snapshot.lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(snapshot.title)}</title>`);
  html = html.replace(/\s*<meta data-seo name="description"[^>]*>/, "");
  const headTags = [...snapshot.head, ...(preload ? [`<link rel="modulepreload" href="${preload}">`] : [])];
  html = html.replace("</head>", `  ${headTags.join("\n  ")}\n</head>`);
  for (const [id, content] of Object.entries(snapshot.parts)) {
    html = html.replace(new RegExp(`(<[a-z]+[^>]*\\bid="${id}"[^>]*>)(</[a-z]+>)`), (_, open, close) => `${open}${content}${close}`);
  }
  // Strip developer comments (keeps the files small; the source keeps them)
  return html.replace(/\n?\s*<!--[\s\S]*?-->/g, "").replace(/\n{3,}/g, "\n\n");
}

function outputFileFor(urlPath) {
  if (urlPath === NOT_FOUND_PROBE) return path.join(DIST, "404.html");
  return path.join(DIST, urlPath, "index.html");
}

async function prerender(template, pageChunks) {
  const port = 4300 + Math.floor(Math.random() * 500);
  const server = await startServer({ root: DIST, mode: "dist", port, fallback: TEMPLATE, quiet: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  // Images, video and outside requests aren't needed to read the HTML
  await context.route("**/*", (route) => {
    const request = route.request();
    const external = !request.url().startsWith(`http://localhost:${port}`);
    if (external || ["image", "media"].includes(request.resourceType())) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.warn(`⚠  Page error while pre-rendering: ${error.message}`));

  const queue = ["/", NOT_FOUND_PROBE];
  const seen = new Set(queue);
  const pages = [];
  while (queue.length) {
    const urlPath = queue.shift();
    const snapshot = await capturePage(page, urlPath, port);
    const file = outputFileFor(urlPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, fillTemplate(template, snapshot, pageChunks[moduleForPath(urlPath)]));
    pages.push({ urlPath, ...snapshot });

    for (const href of snapshot.links) {
      const linkPath = href.split("?")[0].split("#")[0];
      if (!linkPath.endsWith("/") || seen.has(linkPath)) continue;   // files and query variants are skipped
      seen.add(linkPath);
      queue.push(linkPath);
    }
  }

  await browser.close();
  server.close();
  fs.rmSync(path.join(DIST, TEMPLATE));
  return pages;
}

/* ============================================================================
   7. robots.txt and sitemap.xml
   ========================================================================== */
function writeCrawlerFiles(pages) {
  const indexable = pages.filter((p) => p.canonical && !p.robots.includes("noindex"));
  const siteUrl = new URL(indexable.find((p) => p.urlPath === "/").canonical).origin;
  const today = new Date().toISOString().slice(0, 10);

  fs.writeFileSync(path.join(DIST, "robots.txt"), [
    "# V Soccer School: every page may be crawled; CSS, JS and images included.",
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n"));

  const urls = indexable
    .sort((a, b) => a.urlPath.split("/").length - b.urlPath.split("/").length || a.urlPath.localeCompare(b.urlPath))
    .map((p) => `  <url>\n    <loc>${p.canonical}</loc>\n    <lastmod>${(p.modified || "").slice(0, 10) || today}</lastmod>\n  </url>`);
  fs.writeFileSync(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
  return { siteUrl, count: indexable.length };
}

/* ============================================================================
   Run
   ========================================================================== */
async function build() {
  const started = Date.now();
  writeEnvModule();
  const blog = await updateBlog({ strict: true });
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  const photoFiles = await buildPhotos(path.join(DIST, "assets/photos"));
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const scripts = await buildScripts(photoFiles);
  const styles = await buildStyles(html);
  copyAssets();
  const template = writeTemplate(html, styles, scripts);
  const pages = await prerender(template, scripts.pageChunks);
  const sitemap = writeCrawlerFiles(pages);

  console.log(`Built dist/ in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  console.log(`  ${pages.length} pages pre-rendered (${sitemap.count} in sitemap.xml, ${sitemap.siteUrl})`);
  console.log(`  ${Object.keys(photoFiles).length} photos saved locally as WebP`);
  console.log(`  ${blog.posts.length} blog post(s) from BlogSpeed`);
  console.log(`  CSS: ${styles.files.length} files -> ${styles.href}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
