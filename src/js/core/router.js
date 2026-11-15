/**
 * ============================================================================
 * core/router.js
 * ----------------------------------------------------------------------------
 * Hash-based router. Each screen has its own address, e.g.
 *   #home   #coach   #ground-varthur   #book-trial?ground=varthur&batch=1
 * so the browser back button, bookmarks and shared links all work.
 * ============================================================================
 */

let renderCallback = () => {};

/* ---------------------------------------------------------------------------
   Parse the current address into { path, query }
   "#book-trial?ground=insa" -> { path: "book-trial", query: { ground: "insa" } }
   ------------------------------------------------------------------------ */
export function parseLocation() {
  const raw = decodeURIComponent(window.location.hash.slice(1) || "home");
  const [path, queryString = ""] = raw.split("?");
  const query = {};
  queryString.split("&").filter(Boolean).forEach((pair) => {
    const [key, value = ""] = pair.split("=");
    query[key] = value;
  });
  return { path: path || "home", query };
}

/** Builds "#path?key=value" from a path and a query object (empty values skipped). */
export function buildHash(path, query = {}) {
  const params = Object.entries(query)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `#${path}${params ? `?${params}` : ""}`;
}

export function navigate(path, query) {
  window.location.hash = buildHash(path, query);
}

/** Re-draws the current screen (used after data changes). */
export function refreshRoute() {
  renderCallback(parseLocation());
}

/* ---------------------------------------------------------------------------
   Start listening for address changes
   ------------------------------------------------------------------------ */
export function startRouter(onRoute) {
  renderCallback = onRoute;
  window.addEventListener("hashchange", refreshRoute);

  // A link to the screen you are already on should still reset that screen.
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const current = `#${window.location.hash.slice(1) || "home"}`;
    if (link.getAttribute("href") === current) {
      event.preventDefault();
      refreshRoute();
    }
  });

  refreshRoute();
}
