/**
 * ============================================================================
 * config/seo.config.js
 * ----------------------------------------------------------------------------
 * Search and social settings for every page: the <title>, meta description,
 * keywords, whether Google may index it, and the image shown when a link is
 * shared on WhatsApp, Facebook, LinkedIn or X.
 *
 * core/seo.js turns these into <head> tags and Schema.org data; the build
 * writes them into each page's pre-rendered HTML and into sitemap.xml.
 * ============================================================================
 */
import { ENV } from "./env.js";
import { GROUNDS } from "./site.config.js";

/* ---------------------------------------------------------------------------
   Site-wide
   ------------------------------------------------------------------------ */
export const SITE = {
  url: (ENV.siteUrl || "https://vsocceracademy.com").replace(/\/+$/, ""),
  name: "V Soccer School",
  legalName: "V Soccer School, Bengaluru",
  locale: "en_IN",
  language: "en-IN",
  city: "Bengaluru",
  region: "Karnataka",
  country: "IN",
  ogImage: "/assets/og-image.jpg",       // 1200 × 630, built from the crest
  ogImageAlt: "V Soccer School crest and name: football coaching in Bengaluru for boys and girls aged 5 to 17",
  logo: "/assets/v-soccer-school-crest.png",
  publisher: { name: "CEEC Global Ventures", url: "https://ceec.org.in/" },
};

const BASE_KEYWORDS = ["V Soccer School", "football academy Bengaluru", "football coaching Bengaluru", "soccer school Bengaluru"];

/* ---------------------------------------------------------------------------
   Per page
   title:       shown in the browser tab and as the Google result headline
                (the site name is added automatically, except on Home)
   description: the Google result snippet, about 140–160 characters
   index:       false = keep out of Google (personal or utility pages)
   ------------------------------------------------------------------------ */
export const PAGE_META = {
  home: {
    title: "V Soccer School | Football Academy in Bengaluru for Ages 5 to 17",
    description: "Football coaching in Bengaluru for boys and girls aged 5 to 17 at Varthur, Sarjapura and Attibele Road, led by an AFC 'B' licensed coach. Book a free trial.",
    keywords: ["kids football classes Bengaluru", "football training Varthur", "football training Sarjapura", "free football trial"],
  },
  about: {
    title: "About Us",
    description: "How V Soccer School coaches young footballers in Bengaluru: one session plan across every ground, small batches and a clear path from grassroots to league football.",
    keywords: ["about V Soccer School", "youth football Bengaluru", "grassroots football"],
  },
  programmes: {
    title: "Football Programmes for Ages 5 to 17",
    description: "Grassroots, Development, Youth and Advanced squad programmes at V Soccer School, Bengaluru. See what each age group learns and book a free trial session.",
    keywords: ["football programmes for kids", "under 12 football Bengaluru", "under 17 football training", "advanced football squad"],
  },
  coach: {
    title: "Head Coach Ramesh B.",
    description: "Ramesh B.: former national-level footballer, AFC 'B' Diploma and AIFF 'C' licensed coach, Karnataka junior and sub-junior state team coach, KSFA League experience.",
    keywords: ["Ramesh B football coach", "AFC B licence coach Bengaluru", "AIFF licensed coach", "Karnataka state football coach"],
  },
  branches: {
    title: "Grounds in Varthur, Sarjapura and Attibele Road",
    description: "V Soccer School trains at Varthur, Sarjapura and Sarjapura Attibele Road, with the home ground at INSA Sports Academy. See each ground's batches and live status.",
    keywords: ["football ground Varthur", "football ground Sarjapura", "Attibele Road football", "INSA Sports Academy"],
  },
  timetable: {
    title: "Weekly Training Timetable",
    description: "This week's football batches at every V Soccer School ground in Bengaluru, by day and age group, with live status for sessions training now.",
    keywords: ["football timetable Bengaluru", "football batch timings", "weekend football classes"],
  },
  gallery: {
    title: "Photo Gallery",
    description: "Photos of training sessions, match days and players at V Soccer School, a football academy in Bengaluru for ages 5 to 17.",
    keywords: ["football academy photos", "youth football training photos"],
  },
  partners: {
    title: "Our Partners",
    description: "V Soccer School works with INSA Sports Academy, Yeshas Sports and Manaa Sports Club to give young Bengaluru footballers grounds, fixtures and match experience.",
    keywords: ["INSA Sports Academy", "Yeshas Sports", "Manaa Sports Club"],
  },
  contact: {
    title: "Contact Us",
    description: "Contact V Soccer School in Bengaluru on WhatsApp or by email. Ask about batches, grounds, age groups or booking a free football trial for your child.",
    keywords: ["contact football academy Bengaluru", "football academy WhatsApp"],
  },
  faq: {
    title: "Frequently Asked Questions",
    description: "Answers for parents: starting age, the free trial, what to bring, girls' training, training at two grounds, the advanced squad and where V Soccer School trains.",
    keywords: ["football academy FAQ", "kids football questions", "free football trial Bengaluru"],
  },
  "book-trial": {
    title: "Book a Free Football Trial",
    description: "Book a free trial session at V Soccer School, Bengaluru. Pick a ground and batch; your child joins a normal session and the coach recommends the right group.",
    keywords: ["book football trial", "free football trial Bengaluru", "football classes near me"],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How V Soccer School's website handles the details you send in its forms: what is collected, why, where it goes and how to ask for it to be deleted.",
    keywords: [],
  },
  terms: {
    title: "Terms of Use",
    description: "Terms for using the V Soccer School website and booking a free trial session, including session information, photos and website content.",
    keywords: [],
  },
  "my-requests": {
    title: "My Requests",
    description: "Trial bookings and messages sent to V Soccer School from this device.",
    keywords: [],
    index: false,
  },
  "not-found": {
    title: "Page Not Found",
    description: "This page doesn't exist on the V Soccer School website.",
    keywords: [],
    index: false,
  },
};

/* ---------------------------------------------------------------------------
   One page per ground (/grounds/<id>/)
   ------------------------------------------------------------------------ */
for (const ground of GROUNDS) {
  PAGE_META[`ground-${ground.id}`] = {
    title: ground.isHome ? `${ground.name}: Home Ground` : `Football Training in ${ground.name}`,
    description: ground.isHome
      ? `${ground.name} is V Soccer School's home ground in Bengaluru: advanced squad training and match days. See batch timings and book a free trial.`
      : `Football coaching for ages 5 to 17 at ${ground.name}, Bengaluru. See V Soccer School's batch timings and live status, and book a free trial.`,
    keywords: [`football coaching ${ground.name}`, `football classes ${ground.name} Bengaluru`],
  };
}

/** Meta for a route name, with defaults filled in. */
export function metaFor(route) {
  const meta = PAGE_META[route] || PAGE_META["not-found"];
  return {
    index: true,
    ...meta,
    keywords: [...meta.keywords, ...(meta.index === false ? [] : BASE_KEYWORDS)],
  };
}

/** Every indexable route, in sitemap order. */
export function indexableRoutes() {
  return Object.keys(PAGE_META).filter((route) => PAGE_META[route].index !== false);
}
