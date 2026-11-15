/**
 * ============================================================================
 * apps-script/whatsapp-relay.gs
 * ----------------------------------------------------------------------------
 * Google Apps Script web app that forwards website requests to the school's
 * WhatsApp through CallMeBot. It runs on Google's servers, so the phone
 * number and API key stay private: they are stored in this script's
 * Script Properties, never in this file, the website or GitHub.
 *
 * Setup (once, signed in to a long-lived Google account):
 *   1. script.google.com > New project > paste this file into Code.gs.
 *   2. Project Settings > Script Properties > add:
 *        SCHOOL_PHONE       the WhatsApp number to receive requests, e.g. +919845012345
 *        CALLMEBOT_APIKEY   the key CallMeBot sent to that number on WhatsApp
 *   3. Deploy > New deployment > type "Web app"
 *        Execute as: Me      Who has access: Anyone
 *      Authorise when asked, then copy the Web app URL.
 *   4. Put that URL in the website's SCHOOL_WHATSAPP_RELAY (.env and the
 *      GitHub secret of the same name).
 * After editing this code: Deploy > Manage deployments > Edit > New version.
 * ============================================================================
 */

const MAX_LENGTH = 1500;          // longest message accepted
const MAX_PER_HOUR = 40;          // simple spam limit for the whole site

/* ---------------------------------------------------------------------------
   Website posts here: body is {"text": "..."}
   ------------------------------------------------------------------------ */
function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const text = String(payload.text || "").trim();
    if (!text) return reply({ ok: false, error: "Empty message." });
    if (text.length > MAX_LENGTH) return reply({ ok: false, error: "Message too long." });
    if (!withinHourlyLimit()) return reply({ ok: false, error: "Too many requests right now. Try again later." });

    const props = PropertiesService.getScriptProperties();
    const phone = props.getProperty("SCHOOL_PHONE");
    const apiKey = props.getProperty("CALLMEBOT_APIKEY");
    if (!phone || !apiKey) return reply({ ok: false, error: "WhatsApp relay isn't set up yet." });

    const url = "https://api.callmebot.com/whatsapp.php"
      + "?phone=" + encodeURIComponent(phone)
      + "&apikey=" + encodeURIComponent(apiKey)
      + "&text=" + encodeURIComponent(text);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const body = response.getContentText();

    // CallMeBot answers with a short HTML page; a wrong number or key says "invalid"
    const ok = response.getResponseCode() === 200 && !/invalid/i.test(body);
    return reply(ok ? { ok: true } : { ok: false, error: "WhatsApp service refused the message." });
  } catch (error) {
    return reply({ ok: false, error: "Relay error." });
  }
}

/* Opening the URL in a browser shows this, handy to check it's deployed. */
function doGet() {
  return reply({ ok: true, status: "V Soccer School WhatsApp relay is running." });
}

/* ---------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------ */
function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function withinHourlyLimit() {
  const cache = CacheService.getScriptCache();
  const key = "count-" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMddHH");
  const count = Number(cache.get(key) || 0);
  if (count >= MAX_PER_HOUR) return false;
  cache.put(key, String(count + 1), 3600);
  return true;
}

/* Run this once from the editor (select testRelay > Run) to send yourself a test. */
function testRelay() {
  const result = doPost({ postData: { contents: JSON.stringify({ text: "Test from the V Soccer School website relay" }) } });
  Logger.log(result.getContent());
}
