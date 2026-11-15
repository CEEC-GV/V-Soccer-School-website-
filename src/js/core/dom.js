/**
 * ============================================================================
 * core/dom.js
 * ----------------------------------------------------------------------------
 * Small DOM and UI utilities shared by every module:
 * HTML escaping, map links, toast messages, clipboard and form field hints.
 * ============================================================================
 */

/* ---------------------------------------------------------------------------
   Safe HTML output
   Every piece of text that came from config or from a visitor goes through
   escapeHtml before it is placed inside a template string.
   ------------------------------------------------------------------------ */
const HTML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

/* ---------------------------------------------------------------------------
   External links
   ------------------------------------------------------------------------ */
export function mapsUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function whatsappUrl(phone, text = "") {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) digits = `91${digits}`;   // assume India
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/* ---------------------------------------------------------------------------
   Toast notification (bottom of screen, disappears after 2 seconds)
   ------------------------------------------------------------------------ */
let toastTimer = null;

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("toast--visible"), 2000);
}

/* ---------------------------------------------------------------------------
   Clipboard (returns true when the copy worked)
   ------------------------------------------------------------------------ */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied");
    return true;
  } catch {
    showToast("Copy blocked here. Select the text and copy it.");
    return false;
  }
}

/* ---------------------------------------------------------------------------
   Form field hints
   state: "ok" | "error" | "" (neutral)
   ------------------------------------------------------------------------ */
export function setFieldHint(input, message = "", state = "") {
  const hint = input.closest(".field")?.querySelector(".field-hint");
  if (hint) {
    hint.textContent = message;
    hint.className = `field-hint${state ? ` field-hint--${state}` : ""}`;
  }
  if (state === "error") input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

export function clearFormHints(form) {
  form.querySelectorAll(".field-hint").forEach((hint) => { hint.textContent = ""; hint.className = "field-hint"; });
  form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
}

/** Scrolls so an element sits just below the sticky header. */
export function scrollToElement(element, offset = 150) {
  if (!element) return;
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - offset });
}
