/**
 * ============================================================================
 * core/seo.js
 * ----------------------------------------------------------------------------
 * Keeps the <head> in step with the page on screen: title, description,
 * keywords, robots, canonical URL, Open Graph / X cards and Schema.org data.
 *
 * Runs on every navigation in the browser. The build loads each page in a
 * headless browser and saves the result, so the pre-rendered HTML that
 * search engines read carries exactly the same tags.
 * ============================================================================
 */
import { BRAND, COACH, FAQ, GROUNDS, findGround } from "../config/site.config.js";
import { SITE, metaFor } from "../config/seo.config.js";
import { urlFor } from "./router.js";

const absolute = (path) => `${SITE.url}${path}`;

/* ---------------------------------------------------------------------------
   Small helpers that create a tag once, then update it
   All managed tags carry data-seo so the build can find them.
   ------------------------------------------------------------------------ */
function upsert(selector, create) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  element.setAttribute("data-seo", "");
  return element;
}

function setMeta(attribute, key, content) {
  const element = upsert(`meta[${attribute}="${key}"]`, () => {
    const meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    return meta;
  });
  element.setAttribute("content", content);
}

function setLink(rel, href) {
  const element = upsert(`link[rel="${rel}"]`, () => {
    const link = document.createElement("link");
    link.rel = rel;
    return link;
  });
  element.href = href;
}

function setJsonLd(data) {
  const element = upsert('script[type="application/ld+json"]', () => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    return script;
  });
  element.textContent = JSON.stringify(data);
}

/* ---------------------------------------------------------------------------
   Schema.org (one @graph per page)
   ------------------------------------------------------------------------ */
const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;
const COACH_ID = `${SITE.url}/coach/#person`;

function organisation() {
  return {
    "@type": "SportsOrganization",
    "@id": ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: `${SITE.url}/`,
    logo: absolute(SITE.logo),
    image: absolute(SITE.ogImage),
    sport: "Soccer",
    description: metaFor("home").description,
    address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
    areaServed: { "@type": "City", name: SITE.city },
    ...(BRAND.email ? { email: BRAND.email } : {}),
    ...(BRAND.instagram ? { sameAs: [BRAND.instagram] } : {}),
    founder: { "@id": COACH_ID },
    location: GROUNDS.map((ground) => ({ "@id": `${absolute(urlFor(`ground-${ground.id}`))}#place` })),
  };
}

function groundPlace(ground) {
  return {
    "@type": "SportsActivityLocation",
    "@id": `${absolute(urlFor(`ground-${ground.id}`))}#place`,
    name: ground.isHome ? `${ground.name} (V Soccer School home ground)` : `V Soccer School, ${ground.name}`,
    url: absolute(urlFor(`ground-${ground.id}`)),
    description: ground.summary,
    address: { "@type": "PostalAddress", addressLocality: ground.isHome ? SITE.city : `${ground.name}, ${SITE.city}`, addressRegion: SITE.region, addressCountry: SITE.country },
    parentOrganization: { "@id": ORG_ID },
  };
}

function coachPerson() {
  return {
    "@type": "Person",
    "@id": COACH_ID,
    name: COACH.name,
    jobTitle: COACH.role,
    url: absolute(urlFor("coach")),
    worksFor: { "@id": ORG_ID },
    award: COACH.honours.filter((item) => item.label !== "Coaching licence").map((item) => item.value),
    hasCredential: COACH.licences.map((licence) => ({
      "@type": "EducationalOccupationalCredential",
      name: `${licence.title} ${licence.detail}`,
      credentialCategory: "Coaching licence",
    })),
  };
}

function breadcrumbs(route, name) {
  const items = [{ name: "Home", url: absolute("/") }];
  if (route.startsWith("ground-")) items.push({ name: "Branches", url: absolute(urlFor("branches")) });
  items.push({ name, url: absolute(urlFor(route)) });
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: item.url })),
  };
}

function schemaFor(route, meta, pageUrl, shortTitle) {
  const graph = [
    organisation(),
    { "@type": "WebSite", "@id": SITE_ID, url: `${SITE.url}/`, name: SITE.name, inLanguage: SITE.language, publisher: { "@id": ORG_ID } },
    {
      "@type": route === "faq" ? "FAQPage" : route === "about" ? "AboutPage" : route === "contact" ? "ContactPage" : "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: meta.fullTitle,
      description: meta.description,
      inLanguage: SITE.language,
      isPartOf: { "@id": SITE_ID },
      about: { "@id": ORG_ID },
      ...(route === "faq" ? {
        mainEntity: FAQ.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
      } : {}),
    },
  ];

  if (route !== "home") graph.push(breadcrumbs(route, shortTitle));
  if (route === "coach" || route === "home" || route === "about") graph.push(coachPerson());
  if (route === "branches" || route === "home") GROUNDS.forEach((ground) => graph.push(groundPlace(ground)));
  const ground = route.startsWith("ground-") && findGround(route.slice("ground-".length));
  if (ground) graph.push(groundPlace(ground));

  return { "@context": "https://schema.org", "@graph": graph };
}

/* ---------------------------------------------------------------------------
   Public API: call after a page is drawn
   route: route name ("about", "ground-insa"); found: false for unknown pages
   ------------------------------------------------------------------------ */
export function applyPageMeta(route, { found = true } = {}) {
  const key = found ? route : "not-found";
  const meta = metaFor(key);
  const fullTitle = key === "home" ? meta.title : `${meta.title} | ${SITE.name}`;
  const pageUrl = absolute(found ? urlFor(route) : "/404.html");

  document.title = fullTitle;
  document.documentElement.lang = SITE.language;
  setMeta("name", "description", meta.description);
  setMeta("name", "keywords", meta.keywords.join(", "));
  setMeta("name", "robots", meta.index ? "index, follow, max-image-preview:large" : "noindex, follow");
  // Canonical only on real pages (a 404 or noindex page has none)
  if (found && meta.index) setLink("canonical", pageUrl);
  else document.head.querySelector('link[rel="canonical"]')?.remove();

  // Open Graph (WhatsApp, Facebook, LinkedIn) and X
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", SITE.name);
  setMeta("property", "og:locale", SITE.locale);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", meta.description);
  setMeta("property", "og:url", pageUrl);
  setMeta("property", "og:image", absolute(SITE.ogImage));
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("property", "og:image:alt", SITE.ogImageAlt);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", meta.description);
  setMeta("name", "twitter:image", absolute(SITE.ogImage));

  if (found && meta.index) setJsonLd(schemaFor(route, { ...meta, fullTitle }, pageUrl, meta.title.split(":")[0]));
  else document.head.querySelector('script[type="application/ld+json"]')?.remove();
}
