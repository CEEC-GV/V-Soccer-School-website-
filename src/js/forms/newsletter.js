/**
 * ============================================================================
 * forms/newsletter.js
 * ----------------------------------------------------------------------------
 * Footer sign-up for fixtures, trial dates and camp updates.
 * Each new sign-up is saved on the device and emailed to the school.
 * ============================================================================
 */
import { BRAND } from "../config/site.config.js";
import { celebrateGoal } from "../components/goal-celebration.js";
import { sendEmail } from "../core/mailer.js";
import { Store } from "../core/store.js";
import { isValidEmail } from "../core/validators.js";

export function bindNewsletterForm() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;
  const input = form.elements.email;
  const hint = document.getElementById("newsletter-hint");

  const setHint = (message, state) => {
    hint.textContent = message;
    hint.className = `field-hint field-hint--${state}`;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = input.value.trim();

    if (!email || !isValidEmail(email)) {
      setHint("Enter a valid email address", "error");
      input.setAttribute("aria-invalid", "true");
      input.focus();
      return;
    }

    input.removeAttribute("aria-invalid");
    if (Store.subscribeNewsletter(email) === "exists") {
      setHint("You're already on the list", "ok");
      return;
    }
    input.value = "";
    setHint("Adding you…", "ok");
    const result = await sendEmail({
      subject: `${BRAND.name} · New newsletter sign-up`,
      fields: [["Email", email], ["Signed up", new Date().toLocaleString("en-IN")]],
      replyTo: email,
    });
    setHint(result.ok ? "Added. We'll send fixtures and trial dates." : "Saved on this device, but we couldn't reach the school. Try again later.", result.ok ? "ok" : "error");
    if (result.ok) celebrateGoal({ title: "You're on the list", message: "We'll email trial dates, camps and match days." });
  });
}
