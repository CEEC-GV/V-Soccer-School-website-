/**
 * ============================================================================
 * pages/legal.page.js  ->  /privacy/  and  /terms/
 * ----------------------------------------------------------------------------
 * Privacy policy and terms of use. Written to match what this website really
 * does (see forms/, core/store.js, core/mailer.js, core/whatsapp.js).
 * If the site starts collecting anything new, update the matching section
 * and LAST_UPDATED. Have both reviewed by the school's legal adviser.
 * ============================================================================
 */
import { BRAND } from "../config/site.config.js";
import { escapeHtml } from "../core/dom.js";

const LAST_UPDATED = "17 November 2026";

function contactLine() {
  if (BRAND.email) return `email <a href="mailto:${escapeHtml(BRAND.email)}">${escapeHtml(BRAND.email)}</a> or use the <a href="/contact/">Contact page</a>`;
  return `use the <a href="/contact/">Contact page</a>`;
}

function legalLayout(title, intro, body) {
  return `
    <section class="section legal"><div class="container container--narrow">
      <h1>${title}</h1>
      <p class="legal__updated">Last updated ${LAST_UPDATED}</p>
      <p class="lede">${intro}</p>
      ${body}
    </div></section>`;
}

/* ---------------------------------------------------------------------------
   /privacy/
   ------------------------------------------------------------------------ */
export const privacyPage = {
  title: "Privacy Policy",
  navId: "",

  render() {
    return legalLayout("Privacy Policy",
      `This policy explains what ${escapeHtml(BRAND.name)} collects through this website, why, and what happens to it.`, `
      <h2>What we collect</h2>
      <p>We only collect what you type into our forms:</p>
      <ul>
        <li><b>Free trial booking:</b> the player's name, date of birth and gender; the parent or guardian's name, mobile number and email; the area you live in; the ground, batch and date you choose; playing experience, preferred position and any note you add.</li>
        <li><b>Contact form:</b> your name, mobile number, email, the topic, the ground you ask about and your message.</li>
        <li><b>Newsletter:</b> your email address.</li>
      </ul>
      <p>The site has no user accounts, sets no advertising or analytics cookies and does not track you across other websites.</p>

      <h2>Children's information</h2>
      <p>Trial bookings are for players aged 5 to 17, so a parent or guardian fills in the form and confirms they agree before sending. We use a child's details only to arrange their trial and place them in the right age group.</p>

      <h2>Why we use it</h2>
      <ul>
        <li>To arrange and confirm trial sessions and reply to your questions.</li>
        <li>To place players in the right programme for their age.</li>
        <li>To send the newsletter, only if you signed up. You can ask us to stop at any time.</li>
      </ul>
      <p>We don't sell or rent your details, and we don't use them for advertising.</p>

      <h2>Where it goes</h2>
      <ul>
        <li><b>Our inbox:</b> each form is emailed to the school through <a href="https://formsubmit.co" target="_blank" rel="noopener">FormSubmit</a>, a form delivery service.</li>
        <li><b>WhatsApp:</b> if you choose to message us on WhatsApp, that conversation happens in WhatsApp under <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank" rel="noopener">WhatsApp's privacy policy</a>. Requests may also be forwarded to the school's WhatsApp so a coach sees them quickly.</li>
        <li><b>Your own device:</b> a copy of what you send is kept in your browser's local storage so you can see, edit or cancel it under My requests. It stays on that device; clearing your browser data removes it.</li>
      </ul>
      <p>Some photos and the home page video are loaded from <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>, which receives your IP address as part of delivering them.</p>

      <h2>How long we keep it</h2>
      <p>We keep trial and contact details only as long as we need them to arrange sessions and answer you, then delete them.</p>

      <h2>Your choices</h2>
      <p>You can ask to see, correct or delete the details we hold about you or your child at any time. To do so, ${contactLine()}.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we'll update it here and change the date at the top.</p>`);
  },
};

/* ---------------------------------------------------------------------------
   /terms/
   ------------------------------------------------------------------------ */
export const termsPage = {
  title: "Terms of Use",
  navId: "",

  render() {
    return legalLayout("Terms of Use",
      `These terms apply when you use the ${escapeHtml(BRAND.name)} website and book a free trial session through it.`, `
      <h2>Session information</h2>
      <p>Batch days, times and ground details on this site can change because of weather, ground availability or holidays. The live status is a guide, not a guarantee. We'll confirm your trial slot before you travel.</p>

      <h2>Free trial sessions</h2>
      <ul>
        <li>A trial is one normal session in the batch you pick. There's no charge and no obligation to join.</li>
        <li>A parent or guardian must book for players under 18 and agree to them taking part.</li>
        <li>Football is a physical sport. Tell the coach about any medical condition or injury before the session. Players should bring boots or turf shoes, shin pads if they have them, and water.</li>
        <li>We may move or cancel a trial if a ground is unavailable. We'll let you know using the details you gave.</li>
      </ul>

      <h2>Your requests</h2>
      <p>Please give accurate details. You can edit or cancel a request from My requests on the device you used, or by contacting us.</p>

      <h2>Photos and content</h2>
      <p>Text, logo and design on this site belong to ${escapeHtml(BRAND.name)}. Stock photos and video are used under the <a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels licence</a>. If we photograph sessions for the website, we ask parents first.</p>

      <h2>Links to other sites</h2>
      <p>Links to WhatsApp, Google Maps, partners and other sites open services we don't control. Their own terms apply there.</p>

      <h2>Questions</h2>
      <p>To ask about these terms, ${contactLine()}. See also our <a href="/privacy/">Privacy Policy</a>.</p>`);
  },
};
