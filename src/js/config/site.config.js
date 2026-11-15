/**
 * ============================================================================
 * config/site.config.js
 * ----------------------------------------------------------------------------
 * ALL website content lives here: photos, grounds and their batch timings,
 * programmes, coach profile, partners and FAQ.
 *
 * Private details (the inbox for form emails, phone, Instagram) are NOT in
 * this file. They live in .env (git-ignored) and arrive through ./env.js,
 * which scripts/env.js generates. See .env.example.
 *
 * NOTE: Session timings below are SAMPLE values. Replace them with the real
 * batches; the live status, ground tabs and timetable all read from them.
 * ============================================================================
 */
import { ENV } from "./env.js";

/* ---------------------------------------------------------------------------
   Brand and contact
   email / instagram come from .env (SCHOOL_EMAIL, SCHOOL_INSTAGRAM).
   The email is shown on the Contact page.
   The phone number is not printed on the site. SCHOOL_WHATSAPP_CHAT powers
   the "Chat on WhatsApp" button (the number is inside that link only).
   ------------------------------------------------------------------------ */
export const BRAND = {
  name: "V Soccer School",
  city: "Bengaluru",
  logo: "assets/logo.webp",
  phone: "",          // not printed on the site on purpose
  whatsapp: ENV.whatsappChat,  // opens a WhatsApp chat from the "Chat on WhatsApp" button
  email: ENV.schoolEmail,
  instagram: ENV.schoolInstagram,
};

/* ---------------------------------------------------------------------------
   Email delivery
   Every trial request, message, cancellation and newsletter sign-up is
   emailed to SCHOOL_EMAIL from .env through FormSubmit
   (https://formsubmit.co), a free relay for static sites. No account needed:
     1. The FIRST submission sends an activation email to that inbox.
        Open it and click "Activate Form"; until then nothing is delivered.
     2. After activating, FormSubmit emails you a random alias. Put that alias
        in SCHOOL_EMAIL so the real address is not visible in the page source.
   Delivery switches off automatically when SCHOOL_EMAIL is empty.
   ------------------------------------------------------------------------ */
export const EMAIL_DELIVERY = {
  enabled: Boolean(ENV.schoolEmail),
  to: ENV.schoolEmail,
  endpoint: "https://formsubmit.co/ajax/",  // relay URL (address is appended)
  timeoutMs: 15000,
};

/* ---------------------------------------------------------------------------
   WhatsApp delivery
   Every request is also sent to the school's WhatsApp. The site posts it to
   a Google Apps Script (apps-script/whatsapp-relay.gs) that holds the phone
   number and CallMeBot key privately and forwards the message, so neither
   appears in the page. Put the script's web-app URL in SCHOOL_WHATSAPP_RELAY.
   Switches off automatically when SCHOOL_WHATSAPP_RELAY is empty.
   ------------------------------------------------------------------------ */
export const WHATSAPP_DELIVERY = {
  enabled: Boolean(ENV.whatsappRelayUrl),
  url: ENV.whatsappRelayUrl,
  timeoutMs: 20000,
};

/* ---------------------------------------------------------------------------
   Photos (free Pexels licence, all taken in India)
   To use your own photo, change `src` to a file path such as "assets/varthur.jpg".
   `ratio` is the photo's shape; `focus` is which part to keep when cropping.
   ------------------------------------------------------------------------ */
const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

export const PHOTOS = {
  practice: { src: pexels(19822993), alt: "Player practising on an outdoor pitch in Imphal, Manipur",                  credit: "Longjam Remson",  ratio: "3/2",  focus: "center" },
  turf:    { src: pexels(14427657), alt: "Footballers competing for the ball on a green pitch",                        credit: "Jidev Mohan",     ratio: "3/2",  focus: "center" },
  imphal:  { src: pexels(19822992), alt: "Players battling for the ball during a match in Imphal, Manipur",            credit: "Longjam Remson",  ratio: "2/3",  focus: "center 40%" },
  teen:    { src: pexels(30158894), alt: "Teenage player in a red jersey beside the goalpost",                         credit: "Mohd Atir",       ratio: "2/3",  focus: "center 30%" },
  control: { src: pexels(18798601), alt: "Player controlling the ball during a game in Kuttanad, Kerala",              credit: "Ravi Roshan",     ratio: "2/3",  focus: "center 60%" },
  balance: { src: pexels(18798600), alt: "Player balancing the ball on his foot in Kuttanad, Kerala",                  credit: "Ravi Roshan",     ratio: "3/4",  focus: "center 60%" },
  strike:  { src: pexels(9786378),  alt: "Player striking the ball into the air in Dehradun",                         credit: "Rishab Bhandari", ratio: "4/5",  focus: "center" },
  header:  { src: pexels(3154902),  alt: "Young player balancing a football on his head on a grass field",            credit: "Yogendra Singh",  ratio: "2/3",  focus: "center 30%" },
  kitup:   { src: pexels(1928176),  alt: "Player in training kit lacing his boots at a football ground",               credit: "Balljinder Singh", ratio: "2/3", focus: "center 35%" },
};

/* ---------------------------------------------------------------------------
   Home hero background video (top-down drone view of a match)
   Plays on tablets and desktops only; phones and data-saver users see
   `fallbackPhoto`. To use your own clip, put it in assets/ and set
   src: "assets/match-day.mp4". Keep it short (10–30 s) and under ~15 MB.
   ------------------------------------------------------------------------ */
export const HERO_VIDEO = {
  src: "https://videos.pexels.com/video-files/16186237/16186237-uhd_2560_1440_30fps.mp4",
  // Smaller copy for phones (saves mobile data). If it can't load, phones use `src`.
  mobileSrc: "https://videos.pexels.com/video-files/16186237/16186237-hd_1280_720_30fps.mp4",
  credit: "Vitaliy Haiduk (Pexels)",
  fallbackPhoto: "practice",
  label: "Top-down drone view of a football match",
};

/* ---------------------------------------------------------------------------
   Gallery (order shown on the Gallery screen; `category` drives the filters)
   ------------------------------------------------------------------------ */
export const GALLERY = [
  { photo: "imphal",  category: "Match day", caption: "Match play" },
  { photo: "teen",    category: "Players",   caption: "Youth group goalmouth drill" },
  { photo: "practice", category: "Training", caption: "Individual ball work" },
  { photo: "control", category: "Training",  caption: "First touch under pressure" },
  { photo: "turf",    category: "Match day", caption: "Winning the ball back" },
  { photo: "header",  category: "Players",   caption: "Ball mastery: head juggling" },
  { photo: "strike",  category: "Training",  caption: "Striking through the ball" },
  { photo: "balance", category: "Training",  caption: "Close control work" },
  { photo: "kitup",   category: "Players",   caption: "Boots on, ready to train" },
];

/* ---------------------------------------------------------------------------
   Grounds and weekly batches
   days: 0 = Sunday ... 6 = Saturday.  Times are 24-hour, Bengaluru time.
   tier links a batch to the programmes it serves (see PROGRAMMES[].tier);
   "any" means every programme can trial in that batch.
   ------------------------------------------------------------------------ */
export const GROUNDS = [
  {
    id: "insa",
    name: "INSA Sports Academy",
    isHome: true,
    photo: "imphal",
    mapQuery: "INSA Sports Academy Bengaluru",
    summary: "Our home base. The advanced squad trains here and Saturday match days are played here.",
    sessions: [
      { days: [2, 4], start: "18:00", end: "19:30", group: "Advanced squad", ages: "U14–U17", tier: "advanced" },
      { days: [6],    start: "16:00", end: "18:00", group: "Match day",      ages: "All squads", tier: "any" },
    ],
  },
  {
    id: "varthur",
    name: "Varthur",
    photo: "turf",
    mapQuery: "Varthur Bengaluru football ground",
    summary: "Weekday evening batches and weekend mornings.",
    sessions: [
      { days: [1, 3, 5], start: "17:00", end: "18:30", group: "Grassroots & Development", ages: "U8–U12",  tier: "young" },
      { days: [1, 3, 5], start: "18:30", end: "20:00", group: "Youth",                    ages: "U14–U17", tier: "youth" },
      { days: [0, 6],    start: "07:00", end: "09:00", group: "Weekend batch",            ages: "All ages", tier: "any" },
    ],
  },
  {
    id: "sarjapura",
    name: "Sarjapura",
    photo: "control",
    mapQuery: "Sarjapura Bengaluru football ground",
    summary: "Alternate-day batches with a Sunday morning session.",
    sessions: [
      { days: [2, 4, 6], start: "17:00", end: "18:30", group: "Grassroots & Development", ages: "U8–U12",  tier: "young" },
      { days: [2, 4, 6], start: "18:30", end: "20:00", group: "Youth",                    ages: "U14–U17", tier: "youth" },
      { days: [0],       start: "07:00", end: "09:00", group: "Weekend batch",            ages: "All ages", tier: "any" },
    ],
  },
  {
    id: "attibele",
    name: "Sarjapura Attibele Road",
    photo: "balance",
    mapQuery: "Sarjapura Attibele Road Bengaluru football ground",
    summary: "Our newest ground, serving families along the Attibele stretch.",
    sessions: [
      { days: [1, 3, 5], start: "16:30", end: "18:00", group: "Grassroots & Development", ages: "U8–U12",  tier: "young" },
      { days: [6],       start: "07:00", end: "09:00", group: "Weekend batch",            ages: "All ages", tier: "any" },
    ],
  },
];

/* ---------------------------------------------------------------------------
   Programmes (player pathway)
   ageBand: [minAge, maxAge) used to suggest a programme from date of birth.
   ------------------------------------------------------------------------ */
export const PROGRAMMES = [
  {
    id: "grassroots", name: "Grassroots", ages: "U6 – U8", ageBand: [0, 8], tier: "young", photo: "balance",
    summary: "First touches, balance and coordination through small-sided games. Players learn to love the ball before they learn positions.",
    focus: ["Ball mastery games", "Movement and agility", "1v1 and 2v2 play"],
  },
  {
    id: "development", name: "Development", ages: "U10 – U12", ageBand: [8, 12], tier: "young", photo: "control",
    summary: "Technique under pressure, passing patterns and the first ideas of team shape in 7-a-side and 9-a-side formats.",
    focus: ["Passing and receiving", "Positional basics", "Small-sided matches"],
  },
  {
    id: "youth", name: "Youth", ages: "U14 – U17", ageBand: [12, 18], tier: "youth", photo: "turf",
    summary: "11-a-side tactics, physical preparation and match analysis for players aiming at league and state-level football.",
    focus: ["Team tactics", "Strength and conditioning", "KSFA league exposure"],
  },
  {
    id: "advanced", name: "Advanced squad", ages: "By selection", ageBand: null, tier: "advanced", photo: "teen",
    summary: "A selected group training at INSA Sports Academy with extra sessions, fixtures and trial preparation.",
    focus: ["Extra weekly session", "Competitive fixtures", "Trial and selection prep"],
  },
];

/* ---------------------------------------------------------------------------
   Head coach: awards and recognition
   ------------------------------------------------------------------------ */
export const COACH = {
  name: "Ramesh B.",
  role: "Head Coach & Founder",
  photo: "header",
  licences: [
    { title: "AFC 'B'", detail: "Diploma Licence" },
    { title: "AIFF 'C'", detail: "Licence" },
  ],
  honours: [
    { label: "Playing career",   value: "Former national-level footballer" },
    { label: "Coaching licence", value: "AFC 'B' Diploma Licence" },
    { label: "Coaching licence", value: "AIFF 'C' Licence" },
    { label: "State duty",       value: "Karnataka State Team Coach for Juniors and Sub-Juniors" },
    { label: "Club football",    value: "Experience coaching professional club teams in the KSFA League" },
    { label: "Speciality",       value: "Grassroots and youth development" },
  ],
};

/* ---------------------------------------------------------------------------
   Partners
   ------------------------------------------------------------------------ */
export const PARTNERS = [
  { id: "insa",   name: "INSA Sports Academy", initials: "IN", photo: "imphal", summary: "Home ground partner. Our advanced squad trains and hosts match days at INSA.", link: "#ground-insa", linkLabel: "See the home ground" },
  { id: "yeshas", name: "Yeshas Sports",       initials: "YS", photo: "control", summary: "Partner for facilities and grassroots football programmes in the city.",      link: "#programmes",  linkLabel: "See programmes" },
  { id: "manaa",  name: "Manaa Sports Club",   initials: "MS", photo: "turf", summary: "Club partner for fixtures, friendlies and player exposure.",                  link: "#timetable",   linkLabel: "See match days" },
];

/* ---------------------------------------------------------------------------
   Frequently asked questions (Contact screen)
   ------------------------------------------------------------------------ */
export const FAQ = [
  { question: "What age can my child start?", answer: "We take players from age 5. The date-of-birth check on the trial form shows which age group your child plays in this season." },
  { question: "Is the trial session free?", answer: "Yes. Your child joins a normal batch for one session and the coach tells you which group suits them." },
  { question: "What should my child bring?", answer: "Football boots or turf shoes, shin pads if you have them, a water bottle and a light snack for after the session." },
  { question: "Do girls train with you?", answer: "Yes. Girls train in the same age-group batches, and we can tell you which grounds currently have the most girls enrolled." },
  { question: "Can my child train at more than one ground?", answer: "Yes. Players can join a weekday batch at one branch and the weekend batch at another. Tell us in the trial form and we will plan it." },
  { question: "How do players get into the advanced squad?", answer: "Coaches recommend players from the Youth group based on attendance, attitude and level. Selected players train at INSA Sports Academy." },
];

/* ---------------------------------------------------------------------------
   Lookup helpers
   ------------------------------------------------------------------------ */
export function findGround(id) {
  return GROUNDS.find((ground) => ground.id === id) || null;
}

export function findProgramme(id) {
  return PROGRAMMES.find((programme) => programme.id === id) || null;
}
