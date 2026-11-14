/**
 * ============================================================================
 * core/actions.js
 * ----------------------------------------------------------------------------
 * Central click handling. Any element with data-action="name" runs the
 * handler registered under that name. Modules register their own actions,
 * so a button and the code it triggers are easy to find:
 *
 *   <button data-action="open-photo" data-index="2">  ->  registerAction("open-photo", ...)
 * ============================================================================
 */

const handlers = new Map();

/** handler(element, event) */
export function registerAction(name, handler) {
  if (handlers.has(name)) console.warn(`Action "${name}" registered twice`);
  handlers.set(name, handler);
}

export function startActionListener(root = document) {
  root.addEventListener("click", (event) => {
    const element = event.target.closest("[data-action]");
    if (!element) return;
    const handler = handlers.get(element.dataset.action);
    if (handler) handler(element, event);
  });
}
