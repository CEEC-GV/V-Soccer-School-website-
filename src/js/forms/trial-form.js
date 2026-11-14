/**
 * ============================================================================
 * forms/trial-form.js
 * ----------------------------------------------------------------------------
 * "Book a free trial" form.
 *
 * Flow:
 *   1. Date of birth  -> shows age group and picks the matching programme
 *   2. Programme + ground -> batch list shows only batches that fit
 *   3. Batch -> date list shows the next real session dates
 *   4. Submit -> validates, saves to Store, emails the school automatically
 *                (forms/delivery.js); if the email fails, shows send buttons
 *
 * The same form edits an existing request (opened from My requests).
 * ============================================================================
 */
import { GROUNDS, PROGRAMMES, findGround, findProgramme } from "../config/site.config.js";
import { clearFormHints, escapeHtml, scrollToElement, setFieldHint, showToast } from "../core/dom.js";
import { Store } from "../core/store.js";
import { DAY_LONG, DAY_SHORT, formatPrettyDate, formatTime12, getGroundStatus, getIstNow, getUpcomingDates, toIsoDate } from "../core/time.js";
import { getAgeGroup, isValidEmail, isValidPhone, normalisePhone } from "../core/validators.js";
import { celebrateGoal } from "../components/goal-celebration.js";
import { applyDeliveryResult, deliverRecord, renderDeliveryStatus } from "./delivery.js";
import { renderSendButtons } from "./share.js";
import { summariseTrial } from "./summaries.js";

/* ---------------------------------------------------------------------------
   Option lists
   ------------------------------------------------------------------------ */
const GENDERS = ["Boy", "Girl", "Prefer not to say"];
const EXPERIENCE_LEVELS = ["New to football", "Plays at school", "Has trained at an academy", "Plays league or tournament football"];
const POSITIONS = ["Not sure yet", "Goalkeeper", "Defender", "Midfielder", "Forward"];
const NOTE_LIMIT = 400;

/* ---------------------------------------------------------------------------
   Dependent dropdowns
   ------------------------------------------------------------------------ */

/** Batches at a ground that suit the chosen programme. */
function renderBatchOptions(groundId, programmeId, selected) {
  const ground = findGround(groundId);
  if (!ground) return `<option value="">Choose a ground first</option>`;

  const tier = findProgramme(programmeId)?.tier;
  const batches = ground.sessions
    .map((session, index) => ({ session, index }))
    .filter(({ session }) => !tier || session.tier === "any" || session.tier === tier);

  if (!batches.length) return `<option value="">No batch for this programme here. Pick another ground.</option>`;

  return `<option value="">Choose a batch</option>` + batches.map(({ session, index }) => `
    <option value="${index}" ${String(selected) === String(index) ? "selected" : ""}>
      ${session.days.map((day) => DAY_SHORT[day]).join("/")} · ${formatTime12(session.start)}–${formatTime12(session.end)} · ${escapeHtml(session.group)}
    </option>`).join("");
}

/** Next dates on which the chosen batch runs. */
function renderDateOptions(groundId, batchIndex, selected) {
  const dates = batchIndex === "" || batchIndex === undefined ? [] : getUpcomingDates(findGround(groundId), Number(batchIndex));
  if (!dates.length) return `<option value="">Choose a batch first</option>`;
  return `<option value="">Choose a date</option>` + dates.map((iso) =>
    `<option value="${iso}" ${iso === selected ? "selected" : ""}>${formatPrettyDate(iso)}</option>`).join("");
}

const options = (list, selected) => list.map((item) => `<option ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");

/* ---------------------------------------------------------------------------
   Form markup
   prefill: values from the URL (ground, batch, programme, date)
   existing: a saved trial being edited
   ------------------------------------------------------------------------ */
export function renderTrialForm(prefill = {}, existing = null) {
  const data = { ...prefill, ...(existing || {}) };
  const value = (key) => escapeHtml(data[key] ?? "");

  return `
    <form id="trial-form" novalidate data-editing="${existing ? existing.id : ""}">
      <!-- Player -->
      <h3 class="form-section-title">Player</h3>
      <div class="form-grid">
        <div class="field">
          <label for="trial-player">Player's full name</label>
          <input class="input" id="trial-player" name="player" required autocomplete="off" value="${value("player")}">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-dob">Date of birth</label>
          <input class="input" id="trial-dob" name="dob" type="date" required value="${value("dob")}">
          <span class="field-hint"></span>
        </div>
        <div class="field field--full">
          <span class="field-label">Gender</span>
          <div class="choice-group">
            ${GENDERS.map((gender) => `
              <label class="choice"><input type="radio" name="gender" value="${gender}" ${(data.gender || GENDERS[0]) === gender ? "checked" : ""}>${gender}</label>`).join("")}
          </div>
        </div>
        <div class="field">
          <label for="trial-experience">Football experience</label>
          <select class="input" id="trial-experience" name="experience">${options(EXPERIENCE_LEVELS, data.experience)}</select>
        </div>
        <div class="field">
          <label for="trial-position">Favourite position</label>
          <select class="input" id="trial-position" name="position">${options(POSITIONS, data.position)}</select>
        </div>
      </div>

      <!-- Session -->
      <h3 class="form-section-title">Session</h3>
      <div class="form-grid">
        <div class="field">
          <label for="trial-programme">Programme</label>
          <select class="input" id="trial-programme" name="programme" required>
            <option value="">Choose a programme</option>
            ${PROGRAMMES.map((p) => `<option value="${p.id}" ${data.programme === p.id ? "selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(p.ages)})</option>`).join("")}
          </select>
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-ground">Ground</label>
          <select class="input" id="trial-ground" name="ground" required>
            <option value="">Choose a ground</option>
            ${GROUNDS.map((g) => `<option value="${g.id}" ${data.ground === g.id ? "selected" : ""}>${escapeHtml(g.name)}</option>`).join("")}
          </select>
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-batch">Batch</label>
          <select class="input" id="trial-batch" name="batch" required>${renderBatchOptions(data.ground, data.programme, data.batch)}</select>
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-date">Trial date</label>
          <select class="input" id="trial-date" name="date" required>${renderDateOptions(data.ground, data.batch, data.date)}</select>
          <span class="field-hint"></span>
        </div>
      </div>

      <!-- Parent or guardian -->
      <h3 class="form-section-title">Parent or guardian</h3>
      <div class="form-grid">
        <div class="field">
          <label for="trial-parent">Name</label>
          <input class="input" id="trial-parent" name="parent" required autocomplete="name" value="${value("parent")}">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-phone">Mobile</label>
          <input class="input" id="trial-phone" name="phone" required inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" value="${value("phone")}">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-email">Email (optional)</label>
          <input class="input" id="trial-email" name="email" type="email" autocomplete="email" value="${value("email")}">
          <span class="field-hint"></span>
        </div>
        <div class="field">
          <label for="trial-area">Area you live in</label>
          <input class="input" id="trial-area" name="area" placeholder="e.g. Whitefield" value="${value("area")}">
          <span class="field-hint"></span>
        </div>
        <div class="field field--full">
          <label for="trial-note">Anything we should know</label>
          <textarea class="input" id="trial-note" name="note" maxlength="${NOTE_LIMIT}" placeholder="Injuries, a sibling also enquiring, preferred days">${value("note")}</textarea>
          <span class="char-count" id="trial-note-count">0 / ${NOTE_LIMIT}</span>
        </div>
        <label class="consent">
          <input type="checkbox" name="consent" ${existing ? "checked" : ""}>
          <span>I am the parent or guardian and agree to the school contacting me about this trial.</span>
        </label>
      </div>

      <!-- Spam trap: hidden from people, bots fill it in -->
      <input class="honeypot" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">

      <!-- Submit -->
      <div class="button-row" style="margin-top:24px">
        <button class="btn" type="submit">${existing ? "Save changes" : "Request trial"}</button>
        ${existing ? `<a class="btn btn--ghost" href="#my-requests">Cancel editing</a>` : `<button class="btn btn--ghost" type="reset">Clear form</button>`}
        <span class="field-hint" id="trial-form-status"></span>
      </div>
    </form>`;
}

/* ---------------------------------------------------------------------------
   Confirmation shown after saving
   The status line updates when the email attempt finishes; the send buttons
   appear only if the automatic email fails.
   ------------------------------------------------------------------------ */
export function renderTrialConfirmation(trial) {
  const ground = findGround(trial.ground);
  return `
    <div class="confirmation">
      <p data-delivery>${renderDeliveryStatus("sending")}</p>
      <h3>${escapeHtml(trial.player)} · U${trial.underAge} at ${escapeHtml(ground?.name)}</h3>
      <p class="muted" style="margin-top:8px">Trial on ${formatPrettyDate(trial.date)}.</p>
      <pre>${escapeHtml(summariseTrial(trial))}</pre>
      <div class="button-row" data-fallback hidden>${renderSendButtons("trials", trial)}</div>
      <div class="button-row">
        <a class="text-link" href="#my-requests">View my requests</a>
        <a class="text-link" href="#book-trial">Book another player</a>
        <a class="text-link" href="#ground-${trial.ground}">Ground details</a>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------------
   Behaviour: live validation, dependent dropdowns, submit
   Call once after the form is placed on the page.
   ------------------------------------------------------------------------ */
export function bindTrialForm() {
  const form = document.getElementById("trial-form");
  if (!form) return;
  const field = (name) => form.elements[name];

  /* -- Dependent dropdowns ------------------------------------------------ */
  const refreshDates = () => {
    field("date").innerHTML = renderDateOptions(field("ground").value, field("batch").value, field("date").value);
  };
  const refreshBatches = () => {
    field("batch").innerHTML = renderBatchOptions(field("ground").value, field("programme").value, field("batch").value);
    refreshDates();
  };

  /* -- Field checks -------------------------------------------------------- */
  const checkDob = () => {
    const result = getAgeGroup(field("dob").value);
    if (!result) return setFieldHint(field("dob"));
    if (result.error) return setFieldHint(field("dob"), result.error, "error");
    setFieldHint(field("dob"), `Plays in U${result.underAge} this season · ${result.programme.name} programme`, "ok");
    if (field("programme").value !== "advanced") {
      field("programme").value = result.programme.id;
      refreshBatches();
    }
  };

  const showGroundStatus = () => {
    const ground = findGround(field("ground").value);
    if (!ground) return setFieldHint(field("ground"));
    const { live, next } = getGroundStatus(ground);
    setFieldHint(field("ground"), live ? "A batch is training there right now" : `Next session ${DAY_LONG[next.day]} ${formatTime12(next.start)}`, live ? "ok" : "");
  };

  const checkPhone = () => {
    const input = field("phone");
    if (!input.value) return setFieldHint(input);
    isValidPhone(input.value) ? setFieldHint(input, "Looks good", "ok") : setFieldHint(input, "Enter a 10-digit Indian mobile number", "error");
  };

  const checkEmail = () => {
    const input = field("email");
    isValidEmail(input.value) ? setFieldHint(input) : setFieldHint(input, "Check the email address", "error");
  };

  const updateNoteCount = () => {
    document.getElementById("trial-note-count").textContent = `${field("note").value.length} / ${NOTE_LIMIT}`;
  };

  /* -- Wire events --------------------------------------------------------- */
  field("dob").max = toIsoDate(getIstNow().date);
  field("dob").addEventListener("input", checkDob);
  field("programme").addEventListener("change", refreshBatches);
  field("ground").addEventListener("change", () => { refreshBatches(); showGroundStatus(); });
  field("batch").addEventListener("change", refreshDates);
  field("phone").addEventListener("input", checkPhone);
  field("email").addEventListener("input", checkEmail);
  field("note").addEventListener("input", updateNoteCount);
  ["player", "parent", "date"].forEach((name) => field(name).addEventListener("input", () => setFieldHint(field(name))));

  form.addEventListener("reset", () => setTimeout(() => {
    clearFormHints(form);
    refreshBatches();
    updateNoteCount();
  }));

  showGroundStatus();
  updateNoteCount();
  if (field("dob").value) checkDob();

  /* -- Submit -------------------------------------------------------------- */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const status = document.getElementById("trial-form-status");
    const errors = [];
    const fail = (name, message) => { setFieldHint(field(name), message, "error"); errors.push(name); };

    if (!values.player.trim()) fail("player", "Enter the player's name");
    const ageGroup = getAgeGroup(values.dob);
    if (!ageGroup || ageGroup.error) fail("dob", ageGroup ? ageGroup.error : "Add a date of birth");
    ["programme", "ground", "batch", "date"].forEach((name) => { if (!values[name]) fail(name, "Required"); });
    if (!values.parent.trim()) fail("parent", "Enter your name");
    if (!isValidPhone(values.phone)) fail("phone", "Enter a 10-digit Indian mobile number");
    if (!isValidEmail(values.email)) fail("email", "Check the email address");

    if (errors.length || !values.consent) {
      status.className = "field-hint field-hint--error";
      status.textContent = errors.length
        ? `Fix ${errors.length} highlighted ${errors.length === 1 ? "field" : "fields"} to continue.`
        : "Tick the consent box to continue.";
      (errors.length ? field(errors[0]) : form.elements.consent).focus();
      return;
    }

    const record = {
      player: values.player.trim(), dob: values.dob, gender: values.gender,
      experience: values.experience, position: values.position,
      programme: values.programme, ground: values.ground, batch: values.batch, date: values.date,
      parent: values.parent.trim(), phone: normalisePhone(values.phone), email: values.email.trim(),
      area: values.area.trim(), note: values.note.trim(), underAge: ageGroup.underAge,
    };

    // 1. Save on this device
    const editingId = form.dataset.editing;
    const saved = editingId ? Store.update("trials", editingId, { ...record, status: "new" }) : Store.add("trials", record);

    // 2. Show the confirmation straight away
    const container = document.getElementById("trial-form-container");
    container.innerHTML = renderTrialConfirmation(saved);
    scrollToElement(container);

    // 3. Celebrate, then email the school and update the confirmation
    celebrateGoal({
      title: editingId ? "Trial request updated" : "Trial request sent",
      message: `${saved.player} · trial on ${formatPrettyDate(saved.date)} at ${findGround(saved.ground)?.name || ""}`,
    });
    deliverRecord("trials", saved, editingId ? "updated" : "new", values._honey).then((result) => {
      applyDeliveryResult(container, result);
      if (!result.ok) showToast("Saved. Send it with a button below");   // success is shown by the player pop-up
    });
  });
}
