/**
 * ============================================================================
 * scripts/og-image.js
 * ----------------------------------------------------------------------------
 * Draws assets/og-image.jpg (1200 × 630): the picture shown when a link to
 * the site is shared on WhatsApp, Facebook, LinkedIn or X.
 * Uses the crest and the site's own fonts and colours.
 *
 * Run:  npm run og-image      (only needed when the wording or crest changes;
 *                              the JPG is kept in Git)
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const asset = (file) => `data:${file.endsWith(".woff2") ? "font/woff2" : "image/webp"};base64,${fs.readFileSync(path.join(ROOT, "assets", file)).toString("base64")}`;

const html = `<!doctype html><html><head><style>
  @font-face { font-family: Display; src: url(${asset("fonts/bebas-neue-400.woff2")}); }
  @font-face { font-family: Body; font-weight: 400; src: url(${asset("fonts/poppins-400.woff2")}); }
  @font-face { font-family: Body; font-weight: 600; src: url(${asset("fonts/poppins-600.woff2")}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #0A0A09; color: #F6F6F2; font-family: Body; display: grid; grid-template-columns: 360px 1fr; align-items: center; padding: 0 80px 0 70px; position: relative; overflow: hidden; }
  /* Halfway line and centre circle, drawn faintly behind the crest */
  .pitch { position: absolute; inset: 0; }
  .crest { width: 300px; height: 300px; position: relative; }
  .text { position: relative; }
  .kicker { font-weight: 600; font-size: 22px; letter-spacing: .14em; text-transform: uppercase; color: #E3B13B; }
  h1 { font-family: Display; font-weight: 400; font-size: 132px; line-height: .9; margin-top: 14px; }
  .line { width: 120px; height: 6px; background: #E3B13B; margin: 26px 0 22px; }
  p { font-size: 27px; line-height: 1.4; color: #D8D6CC; }
  .grounds { margin-top: 18px; font-size: 21px; color: #9C9A90; }
</style></head><body>
  <svg class="pitch" viewBox="0 0 1200 630" aria-hidden="true"><g fill="none" stroke="#E3B13B" stroke-opacity=".14" stroke-width="3">
    <circle cx="220" cy="315" r="230"/><line x1="220" y1="0" x2="220" y2="630"/><rect x="-60" y="140" width="140" height="350"/>
  </g></svg>
  <img class="crest" src="${asset("v-soccer-school-crest.webp")}" alt="">
  <div class="text">
    <div class="kicker">Football coaching · Bengaluru</div>
    <h1>V Soccer School</h1>
    <div class="line"></div>
    <p>Boys and girls aged 5 to 17.<br>Free trial session.</p>
    <p class="grounds">Varthur · Sarjapura · Attibele Road · INSA Sports Academy</p>
  </div>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const output = path.join(ROOT, "assets/og-image.jpg");
  await page.screenshot({ path: output, type: "jpeg", quality: 86 });
  await browser.close();
  console.log(`Wrote assets/og-image.jpg (${(fs.statSync(output).size / 1024).toFixed(0)} KB)`);
})();
