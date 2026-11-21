/**
 * ============================================================================
 * app.js  (entry point)
 * ----------------------------------------------------------------------------
 * Starts the website:
 *   1. Theme        light by default, dark via toggle, remembered
 *   1b. Phone menu  Menu button opens / closes the navigation
 *   2. Site chrome  navigation bar, footer lists
 *   3. Routing      draws the screen for the current address
 *   4. Live data    clock, ground tabs and status refresh every 15 seconds
 *   5. Header badge open-request count
 *   6. Back to top  floating button  (+ football runner along the bottom)
 *   7. Bootstrap    wires everything together on load
 * ============================================================================
 */
import { GROUNDS, findGround } from "./config/site.config.js";
import { renderLiveStatus, renderSessionBoard } from "./components/cards.js";
import { renderGroundTabs } from "./components/ground-tabs.js";
import { mountPitchRunner } from "./components/pitch-runner.js";
import { closeLightbox } from "./components/lightbox.js";
import { refreshTimetable } from "./components/timetable.js";
import { startActionListener } from "./core/actions.js";
import { escapeHtml } from "./core/dom.js";
import { startRouter, urlFor } from "./core/router.js";
import { applyPageMeta } from "./core/seo.js";
import { Store } from "./core/store.js";
import { formatClock, getIstNow } from "./core/time.js";
import { bindNewsletterForm } from "./forms/newsletter.js";
import "./forms/share.js"; // registers send / copy actions
import { FOOTER_EXTRA_ITEMS, LEGAL_ITEMS, NAV_ITEMS, resolveRoute } from "./pages/routes.js";

const LIVE_REFRESH_MS = 15000;
const THEME_STORAGE_KEY = "vss-theme";

/** Ground whose page is open (highlights its tab). */
let activeGroundId = "";

/* ============================================================================
   1. Theme
   ========================================================================== */
function applyTheme(mode) {
  const isDark = mode === "dark";
  if (isDark) document.documentElement.setAttribute("data-theme-mode", "dark");
  else document.documentElement.removeAttribute("data-theme-mode");

  // There are two toggles: one in the header (desktop), one in the phone menu.
  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    toggle.textContent = isDark ? "Light mode" : "Dark mode";
    toggle.setAttribute("aria-pressed", String(isDark));
  });
}

function initTheme() {
  let mode = "light";
  try { mode = localStorage.getItem(THEME_STORAGE_KEY) || "light"; } catch { /* storage blocked */ }
  applyTheme(mode);

  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => toggle.addEventListener("click", () => {
    mode = mode === "dark" ? "light" : "dark";
    applyTheme(mode);
    try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch { /* storage blocked */ }
  }));
}

/* ============================================================================
   1b. Phone menu
   ========================================================================== */
function setMenuOpen(open) {
  document.getElementById("main-nav").classList.toggle("main-nav--open", open);
  const button = document.getElementById("menu-toggle");
  button.setAttribute("aria-expanded", String(open));
  button.textContent = open ? "Close" : "Menu";
}

function initMobileMenu() {
  document.getElementById("menu-toggle").addEventListener("click", () =>
    setMenuOpen(!document.getElementById("main-nav").classList.contains("main-nav--open")));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenuOpen(false); });
  // Leaving phone width with the menu open would otherwise keep it open later.
  window.matchMedia("(min-width: 1101px)").addEventListener("change", (event) => { if (event.matches) setMenuOpen(false); });
}

/* ============================================================================
   2. Site chrome (drawn once)
   ========================================================================== */
function renderChrome() {
  // Main navigation bar
  document.getElementById("main-nav-list").innerHTML = NAV_ITEMS
    .map((item) => `<a class="main-nav__link" href="${urlFor(item.path)}" data-nav="${item.path}">${escapeHtml(item.label)}</a>`)
    .join("");

  // Footer: school links
  const footerLinks = [...NAV_ITEMS.filter((item) => item.path !== "home"), ...FOOTER_EXTRA_ITEMS];
  document.getElementById("footer-links").innerHTML = footerLinks
    .map((item) => `<li><a href="${urlFor(item.path)}">${escapeHtml(item.label)}</a></li>`).join("");

  // Footer: privacy and terms
  document.getElementById("footer-legal").innerHTML = LEGAL_ITEMS
    .map((item) => `<a href="${urlFor(item.path)}">${escapeHtml(item.label)}</a>`).join("");

  // Footer: grounds
  document.getElementById("footer-grounds").innerHTML = GROUNDS
    .map((ground) => `<li><a href="/grounds/${ground.id}/">${escapeHtml(ground.name)}</a></li>`).join("");

  // Footer: year
  document.getElementById("footer-year").textContent = getIstNow().date.getFullYear();
}

/* ============================================================================
   3. Routing
   ========================================================================== */
let routeToken = 0;   // ignores a slow page load if the visitor has already moved on

async function renderRoute({ path, query }) {
  const token = ++routeToken;
  const { load, param, found: routeFound } = resolveRoute(path);
  const page = await load();
  if (token !== routeToken) return;
  const found = routeFound && !page.notFound;   // e.g. /blog/<unknown-slug>/
  activeGroundId = findGround(param) ? param : "";

  // Draw the page
  document.getElementById("app").innerHTML = `<div class="screen">${page.render(query, param)}</div>`;
  page.mount?.();

  // Highlight the current nav item
  document.querySelectorAll("[data-nav]").forEach((link) =>
    link.setAttribute("aria-current", link.dataset.nav === page.navId ? "page" : "false"));
  document.getElementById("requests-link").setAttribute("aria-current", path === "my-requests" ? "page" : "false");
  document.querySelector('.main-nav__link[aria-current="page"]')?.scrollIntoView?.({ block: "nearest", inline: "center" });

  applyPageMeta(path, { found, override: found ? page.meta?.(query, param) : undefined });
  document.documentElement.dataset.route = found ? path : "not-found";   // tells the build the page is drawn

  closeLightbox();
  setMenuOpen(false);
  window.scrollTo({ top: 0 });
  refreshLiveData();

  // On narrow screens, bring the open ground's tab into view.
  document.querySelector('.ground-tab[aria-current="page"]')?.scrollIntoView?.({ block: "nearest", inline: "center" });
}

/* ============================================================================
   4. Live data (clock, ground tabs, statuses, timetable)
   ========================================================================== */
function refreshLiveData() {
  const clock = formatClock();
  document.getElementById("header-clock").textContent = clock;
  document.querySelectorAll('[data-live="clock"]').forEach((el) => { el.textContent = `Live · ${clock}`; });

  document.getElementById("ground-tabs").innerHTML = renderGroundTabs(activeGroundId);

  const board = document.querySelector('[data-live="session-board"]');
  if (board) board.innerHTML = renderSessionBoard();

  document.querySelectorAll("[data-live-status]").forEach((el) => {
    const ground = findGround(el.dataset.liveStatus);
    if (ground) el.innerHTML = renderLiveStatus(ground);
  });

  refreshTimetable();
}

/* ============================================================================
   5. Header badge
   ========================================================================== */
function updateRequestBadge() {
  const count = Store.countOpenRequests();
  const badge = document.getElementById("requests-badge");
  badge.textContent = count;
  badge.hidden = count === 0;
}

/* ============================================================================
   6. Back to top
   ========================================================================== */
function initBackToTop() {
  const button = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => button.classList.toggle("back-to-top--visible", window.scrollY > 700), { passive: true });
  button.addEventListener("click", () => window.scrollTo({ top: 0 }));
}

/* ============================================================================
   7. Bootstrap
   ========================================================================== */
function start() {
  initTheme();
  initMobileMenu();
  renderChrome();
  startActionListener();
  bindNewsletterForm();
  initBackToTop();

  Store.onChange(updateRequestBadge);
  updateRequestBadge();

  startRouter(renderRoute);
  mountPitchRunner();

  setInterval(refreshLiveData, LIVE_REFRESH_MS);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refreshLiveData(); });
}

start();
