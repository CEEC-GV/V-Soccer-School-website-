/**
 * ============================================================================
 * scripts/env.js
 * ----------------------------------------------------------------------------
 * Reads private settings (email, phone) from the .env file, which is kept out
 * of Git by .gitignore, and turns them into the browser module the site
 * imports: src/js/config/env.js (also git-ignored, generated).
 *
 * Used by:
 *   server.js        serves env.js straight from .env on every request,
 *                    so editing .env only needs a browser refresh
 *   scripts/build.js writes env.js before bundling dist/index.html
 *   npm run env      writes env.js on its own (for other static servers)
 *
 * No packages: a tiny .env parser is included below.
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(ROOT, ".env");
const OUTPUT_FILE = path.join(ROOT, "src/js/config/env.js");

/* Settings the site understands: .env name -> name used in the browser */
const KEYS = {
  SCHOOL_EMAIL: "schoolEmail",       // inbox that receives every form submission
  SCHOOL_PHONE: "schoolPhone",       // turns on the Call / WhatsApp buttons
  SCHOOL_INSTAGRAM: "schoolInstagram",
};

/* ---------------------------------------------------------------------------
   Parse .env  (KEY=value per line; # comments; optional quotes)
   ------------------------------------------------------------------------ */
function readEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return { values: {}, found: false };
  const values = {};
  for (const rawLine of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");          // strip trailing comment
    values[match[1]] = value;
  }
  return { values, found: true };
}

/* ---------------------------------------------------------------------------
   Build the browser module source
   ------------------------------------------------------------------------ */
function createEnvModule() {
  const { values, found } = readEnvFile();
  const settings = {};
  for (const [envName, jsName] of Object.entries(KEYS)) settings[jsName] = values[envName] || "";

  const warnings = [];
  if (!found) warnings.push("No .env file found. Copy .env.example to .env and fill it in.");
  else if (!settings.schoolEmail) warnings.push("SCHOOL_EMAIL is empty in .env, so form emails are turned off.");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(settings.schoolEmail) && !/^[a-f0-9]{20,}$/i.test(settings.schoolEmail)) {
    warnings.push(`SCHOOL_EMAIL "${settings.schoolEmail}" doesn't look like an email address or FormSubmit alias.`);
  }

  const source = `/**
 * GENERATED FILE: do not edit and do not commit (it is in .gitignore).
 * Values come from .env via scripts/env.js. Edit .env instead.
 */
export const ENV = Object.freeze(${JSON.stringify(settings, null, 2)});
`;
  return { source, warnings };
}

/** Writes src/js/config/env.js and prints any warnings. */
function writeEnvModule({ quiet = false } = {}) {
  const { source, warnings } = createEnvModule();
  fs.writeFileSync(OUTPUT_FILE, source);
  if (!quiet) warnings.forEach((warning) => console.warn(`⚠  ${warning}`));
  return warnings;
}

module.exports = { createEnvModule, writeEnvModule, OUTPUT_FILE };

// `node scripts/env.js` (npm run env) writes the file directly
if (require.main === module) {
  writeEnvModule();
  console.log(`Wrote ${path.relative(ROOT, OUTPUT_FILE)} from .env`);
}
