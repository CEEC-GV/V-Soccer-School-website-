/**
 * ============================================================================
 * pages/not-found.page.js  ->  any unknown address (and dist/404.html)
 * ----------------------------------------------------------------------------
 * Tells the visitor the page doesn't exist and offers the main destinations.
 * Marked noindex by config/seo.config.js.
 * ============================================================================
 */
import { GROUNDS } from "../config/site.config.js";
import { escapeHtml } from "../core/dom.js";

export const notFoundPage = {
  title: "Page not found",
  navId: "",
  notFound: true,

  render() {
    return `
      <section class="section not-found"><div class="container container--narrow">
        <p class="not-found__code" aria-hidden="true">404</p>
        <h1>This page is off the pitch</h1>
        <p class="lede" style="margin:14px 0 26px">The address may be mistyped, or the page has moved. Try one of these instead.</p>
        <div class="button-row">
          <a class="btn" href="/">Home</a>
          <a class="btn btn--ghost" href="/book-trial/">Book a free trial</a>
          <a class="btn btn--ghost" href="/contact/">Contact us</a>
        </div>
        <h2 style="margin-top:44px">Our grounds</h2>
        <ul class="link-list">
          ${GROUNDS.map((ground) => `<li><a href="/grounds/${ground.id}/">${escapeHtml(ground.name)}</a></li>`).join("")}
        </ul>
      </div></section>`;
  },
};
