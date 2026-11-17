/**
 * ============================================================================
 * core/router.js
 * ----------------------------------------------------------------------------
 * Path-based router. Every screen has a real, crawlable address:
 *   /   /about/   /grounds/varthur/   /book-trial/?ground=varthur
 * Internally each screen keeps a short route name ("home", "about",
 * "ground-varthur"); urlFor() and routeFromPath() translate between the two.
 *
 * Clicks on internal links are handled here (History API), so moving between
 * pages doesn't reload the site. The build also writes a pre-rendered HTML
 * file for every page, so search engines and first visits get real content.
 *
 * Old "#about"-style links (shared before the switch) are redirected.
 * ============================================================================
 */

let renderCallback = () => {};

/* ---------------------------------------------------------------------------
   Route name <-> URL
   ------------------------------------------------------------------------ */
const GROUND_PREFIX = "ground-";

/** "about" -> "/about/", "ground-insa" -> "/grounds/insa/", "home" -> "/" (+ query). */
export function urlFor(route, query = {}) {
  let path = "/";
  if (route.startsWith(GROUND_PREFIX)) path = `/grounds/${route.slice(GROUND_PREFIX.length)}/`;
  else if (route && route !== "home") path = `/${route}/`;

  const params = Object.entries(query)
    .filter(([, value]) => value !== "" && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${path}${params ? `?${params}` : ""}`;
}

/** "/grounds/insa/" -> "ground-insa", "/about" -> "about", "/" -> "home". */
export function routeFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return "home";
  if (parts[0] === "grounds" && parts[1]) return `${GROUND_PREFIX}${parts[1]}`;
  if (parts[0] === "index.html") return "home";
  return parts[0];
}

/* ---------------------------------------------------------------------------
   Parse the current address into { path, query }
   "/book-trial/?ground=insa" -> { path: "book-trial", query: { ground: "insa" } }
   ------------------------------------------------------------------------ */
export function parseLocation() {
  const query = Object.fromEntries(new URLSearchParams(window.location.search));
  return { path: routeFromPath(window.location.pathname), query };
}

/** Go to a screen without reloading the page. */
export function navigate(route, query) {
  window.history.pushState({}, "", urlFor(route, query));
  refreshRoute();
}

/** Re-draws the current screen (used after data changes). */
export function refreshRoute() {
  renderCallback(parseLocation());
}

/* ---------------------------------------------------------------------------
   Old "#route?x=y" links -> the new address (kept so shared links still work)
   ------------------------------------------------------------------------ */
function redirectLegacyHash() {
  const hash = window.location.hash.slice(1);
  if (!hash || !/^[a-z][a-z0-9-]*(\?|$)/.test(hash)) return;
  const [route, queryString = ""] = hash.split("?");
  const query = Object.fromEntries(new URLSearchParams(queryString));
  window.history.replaceState({}, "", urlFor(route, query));
}

/* ---------------------------------------------------------------------------
   Internal link clicks -> History API (no full page reload)
   ------------------------------------------------------------------------ */
function isInternalPageLink(link, event) {
  if (!link || event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;   // new tab etc.
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return false;                          // files: /sitemap.xml, images
  return true;
}

/* ---------------------------------------------------------------------------
   Start listening for address changes
   ------------------------------------------------------------------------ */
export function startRouter(onRoute) {
  renderCallback = onRoute;
  redirectLegacyHash();
  window.addEventListener("popstate", refreshRoute);

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!isInternalPageLink(link, event)) return;
    const url = new URL(link.href, window.location.href);
    event.preventDefault();
    // A link to the page you're already on still resets that page.
    if (url.pathname + url.search !== window.location.pathname + window.location.search) {
      window.history.pushState({}, "", url.pathname + url.search);
    }
    refreshRoute();
  });

  refreshRoute();
}
