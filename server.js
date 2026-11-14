/**
 * ============================================================================
 * server.js
 * ----------------------------------------------------------------------------
 * Local development server (plain Node.js, no packages).
 *   npm start           serves the project from source  -> http://localhost:3000
 *   npm run preview     serves the built dist/ folder
 * ES modules need a server, which is why index.html is not opened directly
 * during development. dist/index.html works on double-click.
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
const ROOT = path.resolve(__dirname, process.argv[2] || ".");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/* ---------------------------------------------------------------------------
   Request handler
   ------------------------------------------------------------------------ */
function handleRequest(request, response) {
  let urlPath = decodeURIComponent(request.url.split("?")[0]);
  if (urlPath.endsWith("/")) urlPath += "index.html";

  // Private settings module, built from .env each time it's requested
  if (urlPath === "/src/js/config/env.js") {
    response.writeHead(200, { "Content-Type": CONTENT_TYPES[".js"], "Cache-Control": "no-store" });
    return response.end(createEnvModule().source);
  }

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      return response.end("Not found");
    }
    response.writeHead(200, {
      "Content-Type": CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      // Never cache during development, so edits (and new versions) show on refresh.
      "Cache-Control": "no-store, must-revalidate",
    });
    response.end(data);
  });
}

/* ---------------------------------------------------------------------------
   Start
   ------------------------------------------------------------------------ */
// Report .env problems once at start-up
createEnvModule().warnings.forEach((warning) => console.warn(`⚠  ${warning}`));

http.createServer(handleRequest).listen(PORT, "0.0.0.0", () => {
  console.log(`\nV Soccer School is running (${path.relative(__dirname, ROOT) || "source"})`);
  console.log(`  This computer:  http://localhost:${PORT}`);
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) console.log(`  Phone on Wi-Fi: http://${address.address}:${PORT}`);
    }
  }
  console.log("\nPress Ctrl + C to stop.\n");
});
