/**
 * ============================================================================
 * components/cards.js
 * ----------------------------------------------------------------------------
 * Reusable content blocks, each returning an HTML string:
 *   renderLiveStatus      live / next-session label for a ground
 *   renderSessionBoard    "Who's training next" board on Home
 *   renderProgrammeGrid   programme cards
 *   renderCoachCard       head coach card with licences
 *   renderHonoursList     awards and recognition list
 *   renderGroundCard      one ground with batches and actions
 *   renderPartnerGrid     partner cards
 *   renderGalleryGrid     photo grid that opens the lightbox
 *   renderContactDetails  phone / email / WhatsApp / Instagram block
 *   renderWhatsAppButton  green "Chat on WhatsApp" button (opens wa.me)
 * ============================================================================
 */
import { BRAND, COACH, GALLERY, GROUNDS, PARTNERS, PHOTOS, PROGRAMMES } from "../config/site.config.js";
import { escapeHtml, mapsUrl, whatsappUrl } from "../core/dom.js";
import { DAY_LONG, DAY_SHORT, formatDuration, formatTime12, getGroundStatus, getIstNow, toMinutes } from "../core/time.js";
import { renderPhoto } from "./media.js";

/* ---------------------------------------------------------------------------
   Live status label
   ------------------------------------------------------------------------ */
export function renderLiveStatus(ground) {
  const { live, next, startsIn } = getGroundStatus(ground);
  if (live) {
    return `<span class="live-status live-status--on"><i class="status-dot status-dot--live"></i>On the pitch · ${escapeHtml(live.ages)} · ${live.minutesLeft} min left</span>`;
  }
  return `<span class="live-status"><i class="status-dot"></i>Next: ${DAY_SHORT[next.day]} ${formatTime12(next.start)} · in ${formatDuration(startsIn)}</span>`;
}

/* ---------------------------------------------------------------------------
   Session board (Home)
   ------------------------------------------------------------------------ */
export function renderSessionBoard() {
  return GROUNDS.map((ground) => {
    const { live, next, startsIn } = getGroundStatus(ground);
    if (live) {
      return `
        <a class="session-board__item" href="#ground-${ground.id}">
          <span class="live-status live-status--on"><i class="status-dot status-dot--live"></i>Training now</span>
          <h3>${escapeHtml(ground.name)}</h3>
          <span class="session-board__count">${live.minutesLeft}<small> min left</small></span>
          <span class="mono-meta">${escapeHtml(live.group)} · ${escapeHtml(live.ages)}</span>
        </a>`;
    }
    return `
      <a class="session-board__item" href="#ground-${ground.id}">
        <span class="live-status"><i class="status-dot"></i>${startsIn < 1440 ? "Later today" : "Next session"}</span>
        <h3>${escapeHtml(ground.name)}</h3>
        <span class="session-board__count">${formatDuration(startsIn)}</span>
        <span class="mono-meta">${DAY_LONG[next.day]} ${formatTime12(next.start)} · ${escapeHtml(next.ages)}</span>
      </a>`;
  }).join("");
}

/* ---------------------------------------------------------------------------
   Programme cards
   showDetails: true on the Programmes screen (adds focus list)
   ------------------------------------------------------------------------ */
export function renderProgrammeGrid(showDetails = false) {
  const cards = PROGRAMMES.map((programme) => `
    <article class="card programme-card" id="programme-${programme.id}">
      ${renderPhoto(programme.photo, { width: 700, className: "photo--zoom" })}
      <div class="card__body">
        <span class="programme-card__age">${escapeHtml(programme.ages)}</span>
        <h3>${escapeHtml(programme.name)}</h3>
        <p>${escapeHtml(programme.summary)}</p>
        ${showDetails ? `<ul class="bullet-list">${programme.focus.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
        <div class="card__actions">
          <a class="text-link" href="#book-trial?programme=${programme.id}">Book this programme</a>
          ${showDetails ? "" : `<a class="text-link" href="#programmes">Details</a>`}
        </div>
      </div>
    </article>`);
  return `<div class="programme-grid">${cards.join("")}</div>`;
}

/* ---------------------------------------------------------------------------
   Head coach
   ------------------------------------------------------------------------ */
export function renderCoachCard() {
  return `
    <div class="card coach-card">
      ${renderPhoto(COACH.photo, { width: 900 })}
      <div class="card__body">
        <h3>${escapeHtml(COACH.name)}</h3>
        <p class="coach-card__role">${escapeHtml(COACH.role)}</p>
        <div class="licence-list">
          ${COACH.licences.map((licence) => `<div class="licence"><b>${escapeHtml(licence.title)}</b><span>${escapeHtml(licence.detail)}</span></div>`).join("")}
        </div>
      </div>
    </div>`;
}

export function renderHonoursList(limit = COACH.honours.length) {
  const rows = COACH.honours.slice(0, limit).map((honour) => `
    <li><span class="honours__label">${escapeHtml(honour.label)}</span><span class="honours__value">${escapeHtml(honour.value)}</span></li>`);
  return `<ul class="honours">${rows.join("")}</ul>`;
}

/* ---------------------------------------------------------------------------
   Ground card
   ------------------------------------------------------------------------ */
export function renderSessionList(ground) {
  const now = getIstNow();
  const rows = ground.sessions.map((session) => {
    const isToday = session.days.includes(now.day);
    const isLive = isToday && now.minutes >= toMinutes(session.start) && now.minutes < toMinutes(session.end);
    const stateClass = isLive ? "is-live" : isToday ? "is-today" : "";
    return `
      <li class="${stateClass}">
        <span>${session.days.map((day) => DAY_SHORT[day]).join(" · ")}</span>
        <span>${formatTime12(session.start)}–${formatTime12(session.end)} · ${escapeHtml(session.group)} (${escapeHtml(session.ages)})</span>
      </li>`;
  });
  return `<ul class="session-list">${rows.join("")}</ul>`;
}

export function renderGroundCard(ground) {
  return `
    <article class="card ground-card ${ground.isHome ? "ground-card--home" : ""}">
      ${renderPhoto(ground.photo, { width: 700, className: "photo--zoom" })}
      <div class="ground-card__head">
        <span class="tag ${ground.isHome ? "" : "tag--plain"}">${ground.isHome ? "Home ground" : "Branch"}</span>
        <h3>${escapeHtml(ground.name)}</h3>
        <div data-live-status="${ground.id}">${renderLiveStatus(ground)}</div>
      </div>
      <div class="card__body">
        <p class="muted">${escapeHtml(ground.summary)}</p>
        ${renderSessionList(ground)}
        <div class="card__actions">
          <a class="text-link" href="#ground-${ground.id}">Details</a>
          <a class="text-link" href="#book-trial?ground=${ground.id}">Book a trial</a>
          <a class="text-link" href="${mapsUrl(ground.mapQuery)}" target="_blank" rel="noopener">Directions</a>
        </div>
      </div>
    </article>`;
}

/* ---------------------------------------------------------------------------
   Partners
   ------------------------------------------------------------------------ */
export function renderPartnerGrid() {
  const cards = PARTNERS.map((partner) => `
    <div class="card partner-card">
      ${renderPhoto(partner.photo, { width: 700 })}
      <span class="partner-card__mark">${escapeHtml(partner.initials)}</span>
      <h3>${escapeHtml(partner.name)}</h3>
      <p>${escapeHtml(partner.summary)}</p>
      <div class="card__actions"><a class="text-link" href="${partner.link}">${escapeHtml(partner.linkLabel)}</a></div>
    </div>`);
  return `<div class="partner-grid">${cards.join("")}</div>`;
}

/* ---------------------------------------------------------------------------
   Gallery grid (each item opens the lightbox)
   ------------------------------------------------------------------------ */
export function renderGalleryGrid(items = GALLERY) {
  const tiles = items.map((item) => {
    const index = GALLERY.indexOf(item);
    const photo = PHOTOS[item.photo];
    return `
      <button type="button" class="gallery__item" data-action="open-photo" data-index="${index}" aria-label="Open photo: ${escapeHtml(item.caption)}">
        ${renderPhoto(item.photo, { width: 800, className: "photo--zoom", ratio: photo.ratio })}
        <span class="gallery__caption">${escapeHtml(item.caption)}</span>
      </button>`;
  });
  return `<div class="gallery">${tiles.join("")}</div>`;
}

/* ---------------------------------------------------------------------------
   WhatsApp chat button (only when BRAND.whatsapp is set)
   text: message typed in for the visitor; they can edit it before sending
   ------------------------------------------------------------------------ */
export const WHATSAPP_ICON = `<svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.4.2-.4a.5.5 0 0 0 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z"/></svg>`;

export function renderWhatsAppButton({ text = `Hi ${BRAND.name}, I have a question.`, label = "Chat on WhatsApp", size = "" } = {}) {
  if (!BRAND.whatsapp) return "";
  return `<a class="btn btn--whatsapp ${size}" href="${whatsappUrl(BRAND.whatsapp, text)}" target="_blank" rel="noopener">${WHATSAPP_ICON}${escapeHtml(label)}</a>`;
}

/* ---------------------------------------------------------------------------
   Contact details (only shows what is filled in BRAND)
   ------------------------------------------------------------------------ */
export function renderContactDetails() {
  const blocks = [];
  if (BRAND.phone) {
    blocks.push(`
      <div>
        <p class="detail-label">Call or WhatsApp</p>
        <p style="font-size:20px;margin-top:4px;user-select:all">${escapeHtml(BRAND.phone)}</p>
        <div class="button-row">
          <a class="btn btn--sm" href="tel:${BRAND.phone.replace(/\s/g, "")}">Call</a>
          <a class="btn btn--sm btn--ghost" href="${whatsappUrl(BRAND.phone)}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>`);
  }
  if (BRAND.whatsapp) {
    blocks.push(`
      <div>
        <p class="detail-label">Questions</p>
        <p style="margin-top:4px">Chat with us directly on WhatsApp.</p>
        <div class="button-row">${renderWhatsAppButton()}</div>
      </div>`);
  }
  if (BRAND.email) {
    blocks.push(`<div><p class="detail-label">Email</p><p style="font-size:18px;margin-top:4px;user-select:all">${escapeHtml(BRAND.email)}</p></div>`);
  }
  if (BRAND.instagram) {
    blocks.push(`<a class="text-link" href="${escapeHtml(BRAND.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
  }
  return blocks.join("");
}
