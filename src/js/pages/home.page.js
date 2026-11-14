/**
 * ============================================================================
 * pages/home.page.js  ->  #home
 * ----------------------------------------------------------------------------
 * Sections: hero (match-day video), live session board, photo strip, player pathway,
 * head coach, gallery preview, partners, trial call-to-action.
 * ============================================================================
 */
import { BRAND, GALLERY } from "../config/site.config.js";
import { renderCoachCard, renderGalleryGrid, renderHonoursList, renderPartnerGrid, renderProgrammeGrid, renderSessionBoard } from "../components/cards.js";
import { renderHeroMedia, renderPhoto, renderPhotoStrip, renderSectionBackground } from "../components/media.js";

export const homePage = {
  title: "Home",
  navId: "home",

  render() {
    return `
      <!-- Hero -->
      <div class="hero">
        ${renderHeroMedia()}
        <div class="container hero__grid">
          <div>
            <h1>Learn the game<br>the <em>right way</em></h1>
            <p class="lede">Structured coaching for ages 5 to 17 at Varthur, Sarjapura and Sarjapura Attibele Road, with the advanced squad at our home ground, INSA Sports Academy.</p>
            <div class="hero__actions">
              <a class="btn" href="#book-trial">Book a free trial</a>
              <a class="btn btn--ghost" href="#timetable">This week's timetable</a>
            </div>
            <p class="hero__note">Head coach Ramesh B. holds the AFC 'B' Diploma and AIFF 'C' Licence and has coached Karnataka's junior state teams.</p>
          </div>
          <div class="hero__crest"><img src="${BRAND.logo}" alt="${BRAND.name} crest"></div>
        </div>
      </div>

      <!-- Live session board -->
      <section class="section"><div class="container">
        <div class="section-head">
          <div><h2>Who's training next</h2></div>
          <p class="mono-meta" data-live="clock"></p>
        </div>
        <div class="session-board" data-live="session-board">${renderSessionBoard()}</div>
      </div></section>

      <!-- Photo strip -->
      <section class="section" style="padding-block:0 var(--section-space);border-top:0">${renderPhotoStrip()}</section>

      <!-- Player pathway (photo background) -->
      <section class="section section--photo">
        ${renderSectionBackground("araku")}
        <div class="container">
        <div class="section-head">
          <div><h2>From first touch to match day</h2></div>
          <a class="btn btn--ghost" href="#programmes">All programmes</a>
        </div>
        ${renderProgrammeGrid(false)}
      </div>
      </section>

      <!-- Head coach -->
      <section class="section"><div class="container coach-layout">
        ${renderCoachCard()}
        <div>
          <h2>Awards & recognition</h2>
          ${renderHonoursList(4)}
          <div class="button-row" style="margin-top:24px">
            <a class="btn btn--ghost" href="#coach">Full profile</a>
            <a class="btn btn--ghost" href="#contact?topic=coach">Ask the coach</a>
          </div>
        </div>
      </div></section>

      <!-- Gallery preview -->
      <section class="section"><div class="container">
        <div class="section-head">
          <div><h2>Gallery</h2></div>
          <a class="btn btn--ghost" href="#gallery">View all photos</a>
        </div>
        ${renderGalleryGrid(GALLERY.slice(0, 6))}
      </div></section>

      <!-- Partners (photo background) -->
      <section class="section section--photo">
        ${renderSectionBackground("imphal")}
        <div class="container">
        <div class="section-head">
          <div><h2>Our partners</h2></div>
          <a class="btn btn--ghost" href="#partners">About our partners</a>
        </div>
        ${renderPartnerGrid()}
      </div>
      </section>

      <!-- Call to action -->
      <section class="section section--band"><div class="container photo-band">
        <div>
          <h2>Your first session is free</h2>
          <p class="lede" style="margin:12px 0 24px">Bring boots, water and a parent. The coach will tell you which group suits your child after the session.</p>
          <a class="btn" href="#book-trial">Book a free trial</a>
        </div>
        ${renderPhoto("teen", { width: 900, ratio: "4/3" })}
      </div></section>`;
  },
};
