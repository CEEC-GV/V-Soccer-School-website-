/**
 * ============================================================================
 * pages/book-trial.page.js  ->  /book-trial/
 * ----------------------------------------------------------------------------
 * Query options:
 *   ?ground=<id>&batch=<n>&programme=<id>&date=<yyyy-mm-dd>  pre-fill the form
 *   ?edit=<requestId>                                       edit a saved trial
 * ============================================================================
 */
import { renderContactDetails } from "../components/cards.js";
import { renderPageBanner, renderPhoto } from "../components/media.js";
import { Store } from "../core/store.js";
import { bindTrialForm, renderTrialForm } from "../forms/trial-form.js";

export const bookTrialPage = {
  title: "Book a trial",
  navId: "",

  render(query) {
    const existing = query.edit ? Store.get("trials", query.edit) : null;

    return `
      ${renderPageBanner({
        title: existing ? "Edit trial request" : "Book a free trial",
        intro: "Fill this in and your child joins a normal batch for one session.",
        photo: "practice",
      })}

      <section class="section"><div class="container form-layout">
        <div id="trial-form-container">${renderTrialForm(query, existing)}</div>
        <aside class="side-panel">
          ${renderPhoto("teen", { width: 700, ratio: "16/10" })}
          <div class="side-panel__body">
            <h3>What happens next</h3>
            <p>We confirm your slot at the ground you pick. After the session the coach tells you which group suits your child.</p>
            <p>Bring football boots or turf shoes, shin pads if you have them, and a water bottle.</p>
            ${renderContactDetails()}
            <a class="text-link" href="/my-requests/">View my requests</a>
          </div>
        </aside>
      </div></section>`;
  },

  mount: bindTrialForm,
};
