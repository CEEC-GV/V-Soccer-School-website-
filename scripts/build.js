/**
 * ============================================================================
 * scripts/build.js
 * ----------------------------------------------------------------------------
 * Bundles the project into ONE self-contained file: dist/index.html
 *   - inlines every stylesheet from src/styles
 *   - bundles the ES modules from src/js into one script (each module keeps
 *     its own private scope, so names never clash)
 *   - embeds the logo, so the file works with no other files beside it
 *   - reads private settings from .env (via scripts/env.js)
 *
 * Run:  npm run build
 * Uses only Node.js built-ins (no packages).
 * ============================================================================
 */
const fs = require("fs");
const path = require("path");
const { writeEnvModule } = require("./env.js");

const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");
const ENTRY = path.join(ROOT, "src/js/app.js");
const LOGO_PATH = "assets/logo.webp";

/* ---------------------------------------------------------------------------
   1. CSS: replace the <link> tags for local stylesheets with one <style> block
   ------------------------------------------------------------------------ */
function inlineStyles(html) {
  const linkPattern = /<link rel="stylesheet" href="(src\/styles\/[^"]+\.css)">\s*/g;
  const files = [...html.matchAll(linkPattern)].map((match) => match[1]);
  const css = files.map((file) => fs.readFileSync(path.join(ROOT, file), "utf8")).join("\n");

  let inserted = false;
  return html.replace(linkPattern, () => {
    if (inserted) return "";
    inserted = true;
    return `<style>\n${css}\n</style>\n`;
  });
}

/* ---------------------------------------------------------------------------
   2. JS: tiny ES module bundler
   Supports the import/export forms this project uses:
     import { a, b as c } from "./x.js";     import "./x.js";
     export const / let / function / async function
   ------------------------------------------------------------------------ */
const IMPORT_PATTERN = /^import\s+(?:\{([^}]*)\}\s+from\s+)?["']([^"']+)["'];?[^\n]*$/gm;
const EXPORT_PATTERN = /^export\s+(const|let|function|async\s+function)\s+([A-Za-z_$][\w$]*)/gm;

const moduleId = (file) => "__module_" + path.relative(path.join(ROOT, "src/js"), file).replace(/\.js$/, "").replace(/[^\w]/g, "_");

function bundleModules(entryFile) {
  const ordered = [];          // modules in dependency order
  const visited = new Set();
  const inProgress = new Set();

  function visit(file) {
    if (visited.has(file)) return;
    if (inProgress.has(file)) throw new Error(`Circular import involving ${path.relative(ROOT, file)}`);
    inProgress.add(file);

    const source = fs.readFileSync(file, "utf8");
    const imports = [];
    for (const [, names, specifier] of source.matchAll(IMPORT_PATTERN)) {
      const target = path.resolve(path.dirname(file), specifier);
      imports.push({ names, target });
      visit(target);
    }

    const exportsList = [...source.matchAll(EXPORT_PATTERN)].map((match) => match[2]);
    const body = source.replace(IMPORT_PATTERN, "").replace(/^export\s+/gm, "");

    const importLines = imports
      .filter(({ names }) => names && names.trim())
      .map(({ names, target }) => {
        const bindings = names.split(",").map((n) => n.trim()).filter(Boolean)
          .map((n) => n.replace(/\s+as\s+/, ": "));
        return `const { ${bindings.join(", ")} } = ${moduleId(target)};`;
      });

    ordered.push(
      `// ---- ${path.relative(ROOT, file)} ----\n` +
      `const ${moduleId(file)} = (() => {\n${importLines.join("\n")}\n${body}\nreturn { ${exportsList.join(", ")} };\n})();`
    );

    inProgress.delete(file);
    visited.add(file);
  }

  visit(entryFile);
  return `"use strict";\n${ordered.join("\n\n")}`;
}

function inlineScripts(html) {
  const bundle = bundleModules(ENTRY);
  return html.replace(/<script type="module" src="src\/js\/app\.js"><\/script>/, () => `<script>\n${bundle}\n</script>`);
}

/* ---------------------------------------------------------------------------
   3. Assets: embed the logo as a data URI
   ------------------------------------------------------------------------ */
function inlineLogo(html) {
  const data = fs.readFileSync(path.join(ROOT, LOGO_PATH)).toString("base64");
  return html.split(LOGO_PATH).join(`data:image/webp;base64,${data}`);
}

/* ---------------------------------------------------------------------------
   Run
   ------------------------------------------------------------------------ */
function build() {
  const started = Date.now();
  writeEnvModule();   // src/js/config/env.js from .env (private, git-ignored)
  let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  html = inlineStyles(html);
  html = inlineScripts(html);
  html = inlineLogo(html);

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const output = path.join(DIST_DIR, "index.html");
  fs.writeFileSync(output, html);

  const sizeKb = (fs.statSync(output).size / 1024).toFixed(0);
  console.log(`Built dist/index.html (${sizeKb} KB) in ${Date.now() - started} ms`);
}

build();
