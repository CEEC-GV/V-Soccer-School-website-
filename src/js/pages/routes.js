/**
 * ============================================================================
 * pages/routes.js
 * ----------------------------------------------------------------------------
 * Route table: which page module draws which address, and the order of the
 * items in the main navigation bar.
 *
 * Pages are loaded on demand (dynamic import), so the first visit downloads
 * only the page being viewed; the build splits each into its own file.
 *
 * Each page module exports an object:
 *   { title, navId, render(query, param) -> html, mount?(), notFound? }
 *   navId  = which nav item is highlighted ("" for none)
 *   mount  = optional, runs after the page HTML is on screen (binds forms)
 * ============================================================================
 */
import { findGround } from "../config/site.config.js";

/* ---------------------------------------------------------------------------
   Route name -> page loader
   ------------------------------------------------------------------------ */
const ROUTES = {
  home:          () => import("./home.page.js").then((m) => m.homePage),
  about:         () => import("./about.page.js").then((m) => m.aboutPage),
  programmes:    () => import("./programmes.page.js").then((m) => m.programmesPage),
  coach:         () => import("./coach.page.js").then((m) => m.coachPage),
  branches:      () => import("./grounds.page.js").then((m) => m.branchesPage),
  timetable:     () => import("./timetable.page.js").then((m) => m.timetablePage),
  gallery:       () => import("./gallery.page.js").then((m) => m.galleryPage),
  partners:      () => import("./partners.page.js").then((m) => m.partnersPage),
  contact:       () => import("./contact.page.js").then((m) => m.contactPage),
  faq:           () => import("./faq.page.js").then((m) => m.faqPage),
  "book-trial":  () => import("./book-trial.page.js").then((m) => m.bookTrialPage),
  "my-requests": () => import("./my-requests.page.js").then((m) => m.myRequestsPage),
  privacy:       () => import("./legal.page.js").then((m) => m.privacyPage),
  terms:         () => import("./legal.page.js").then((m) => m.termsPage),
};

const loadGround = () => import("./grounds.page.js").then((m) => m.groundDetailPage);
const loadNotFound = () => import("./not-found.page.js").then((m) => m.notFoundPage);

/* ---------------------------------------------------------------------------
   Main navigation order
   ------------------------------------------------------------------------ */
export const NAV_ITEMS = [
  { path: "home", label: "Home" },
  { path: "about", label: "About" },
  { path: "programmes", label: "Programmes" },
  { path: "coach", label: "Head Coach" },
  { path: "branches", label: "Branches" },
  { path: "timetable", label: "Timetable" },
  { path: "gallery", label: "Gallery" },
  { path: "partners", label: "Partners" },
  { path: "contact", label: "Contact" },
];

/** Extra links in the footer (not in the top bar). */
export const FOOTER_EXTRA_ITEMS = [
  { path: "faq", label: "FAQ" },
  { path: "book-trial", label: "Book a trial" },
  { path: "my-requests", label: "My requests" },
];

export const LEGAL_ITEMS = [
  { path: "privacy", label: "Privacy" },
  { path: "terms", label: "Terms" },
];

/* ---------------------------------------------------------------------------
   Resolve a route name to { load, param, found }.
   Unknown routes get the 404 page (never a copy of Home).
   ------------------------------------------------------------------------ */
export function resolveRoute(path) {
  if (ROUTES[path]) return { load: ROUTES[path], param: "", found: true };
  if (path.startsWith("ground-")) {
    const id = path.slice("ground-".length);
    if (findGround(id)) return { load: loadGround, param: id, found: true };
  }
  return { load: loadNotFound, param: "", found: false };
}

/** Every route that has its own page, for the build's pre-rendering. */
export function allRoutes(groundIds) {
  return [...Object.keys(ROUTES), ...groundIds.map((id) => `ground-${id}`)];
}
