/**
 * ============================================================================
 * server.js
 * ----------------------------------------------------------------------------
 * Local server (plain Node.js).
 *   npm start           serves the project from source  -> http://localhost:3000
 *   npm run preview     builds, then serves dist/ the way GitHub Pages does
 * Pages have real addresses (/about/, /grounds/varthur/), so open the site
 * through this server rather than double-clicking a file.
 *
 * Private settings: src/js/config/env.js is generated from .env on every
 * request, so editing .env only needs a browser refresh.
 * ============================================================================
 */
const http = require("http");
const { createEnvModule } = require("./scripts/env.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = Number(process.env.PORT) || 3000;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

/* ---------------------------------------------------------------------------
   Request handler
   mode "source": every page address gets index.html (the app draws the page)
   mode "dist":   behaves like GitHub Pages: /about -> /about/ redirect,
                  /about/ -> about/index.html, unknown -> 404.html (status 404)
   fallback:      optional file served for page addresses that have no file
                  (used by the build while pre-rendering)
   ------------------------------------------------------------------------ */
function createHandler({ root, mode, fallback }) {
  const send = (response, status, filePath) => fs.readFile(filePath, (error, data) => {
    if (error) { response.writeHead(404); return response.end("Not found"); }
    response.writeHead(status, {
      "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      // Never cache locally, so edits show on refresh.
      "Cache-Control": "no-store, must-revalidate",
    });
    response.end(data);
  });

  return (request, response) => {
    let urlPath = decodeURIComponent(request.url.split("?")[0]);

    // Private settings module, built from .env each time it's requested
    if (mode === "source" && urlPath === "/src/js/config/env.js") {
      response.writeHead(200, { "Content-Type": CONTENT_TYPES[".js"], "Cache-Control": "no-store" });
      return response.end(createEnvModule().source);
    }

    const hasExtension = path.extname(urlPath) !== "";
    const filePath = path.normalize(path.join(root, urlPath));
    if (!filePath.startsWith(root)) { response.writeHead(403); return response.end("Forbidden"); }

    if (mode === "source") {
      if (!hasExtension) return send(response, 200, path.join(root, "index.html"));
      return send(response, 200, filePath);
    }

    // dist mode
    if (!hasExtension && !urlPath.endsWith("/") && fs.existsSync(path.join(filePath, "index.html"))) {
      response.writeHead(301, { Location: `${urlPath}/` });
      return response.end();
    }
    const target = urlPath.endsWith("/") ? path.join(filePath, "index.html") : filePath;
    if (fs.existsSync(target)) return send(response, 200, target);
    if (fallback && !hasExtension) return send(response, 200, path.join(root, fallback));
    return send(response, 404, path.join(root, "404.html"));
  };
}

/** Starts a server; used by `npm start`, `npm run preview` and the build. */
function startServer({ root, mode, port = PORT, fallback, quiet = false }) {
  return new Promise((resolve) => {
    const server = http.createServer(createHandler({ root: path.resolve(root), mode, fallback }));
    server.listen(port, "0.0.0.0", () => {
      if (!quiet) {
        console.log(`\nV Soccer School is running (${mode === "dist" ? "built site, dist/" : "source"})`);
        console.log(`  This computer:  http://localhost:${port}`);
        for (const addresses of Object.values(os.networkInterfaces())) {
          for (const address of addresses || []) {
            if (address.family === "IPv4" && !address.internal) console.log(`  Phone on Wi-Fi: http://${address.address}:${port}`);
          }
        }
        console.log("\nPress Ctrl + C to stop.\n");
      }
      resolve(server);
    });
  });
}

module.exports = { startServer };

/* ---------------------------------------------------------------------------
   Run directly:  node server.js        (source)
                  node server.js dist   (built site)
   ------------------------------------------------------------------------ */
if (require.main === module) {
  const dist = process.argv[2] === "dist";
  if (!dist) createEnvModule().warnings.forEach((warning) => console.warn(`⚠  ${warning}`));
  startServer({ root: path.resolve(__dirname, dist ? "dist" : "."), mode: dist ? "dist" : "source" });
}
