/**
 * ============================================================================
 * pages/routes.js
 * ----------------------------------------------------------------------------
 * Route table: which page module draws which address, and the order of the
 * items in the main navigation bar.
 *
 * Each page module exports an object:
 *   { title, navId, render(query, param) -> html, mount?() }
 *   navId  = which nav item is highlighted ("" for none)
 *   mount  = optional, runs after the page HTML is on screen (binds forms)
 * ============================================================================
 */
import { aboutPage } from "./about.page.js";
import { bookTrialPage } from "./book-trial.page.js";
import { coachPage } from "./coach.page.js";
import { contactPage } from "./contact.page.js";
import { galleryPage } from "./gallery.page.js";
import { branchesPage, groundDetailPage } from "./grounds.page.js";
import { homePage } from "./home.page.js";
import { myRequestsPage } from "./my-requests.page.js";
import { partnersPage } from "./partners.page.js";
import { programmesPage } from "./programmes.page.js";
import { timetablePage } from "./timetable.page.js";

/* ---------------------------------------------------------------------------
   Address -> page
   ------------------------------------------------------------------------ */
const ROUTES = {
  home: homePage,
  about: aboutPage,
  programmes: programmesPage,
  coach: coachPage,
  branches: branchesPage,
  timetable: timetablePage,
  gallery: galleryPage,
  partners: partnersPage,
  contact: contactPage,
  "book-trial": bookTrialPage,
  "my-requests": myRequestsPage,
};

/** Dynamic routes, e.g. "ground-varthur" -> ground detail with param "varthur". */
const PATTERN_ROUTES = [
  { prefix: "ground-", page: groundDetailPage },
];

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

/* ---------------------------------------------------------------------------
   Resolve a path to { page, param }. Unknown paths fall back to Home.
   ------------------------------------------------------------------------ */
export function resolveRoute(path) {
  if (ROUTES[path]) return { page: ROUTES[path], param: "" };
  const match = PATTERN_ROUTES.find((route) => path.startsWith(route.prefix));
  if (match) return { page: match.page, param: path.slice(match.prefix.length) };
  return { page: homePage, param: "" };
}
