/**
 * ============================================================================
 * forms/summaries.js
 * ----------------------------------------------------------------------------
 * Turns saved records into labelled fields. The same fields feed:
 *   - the email sent to the school (one table row per field)
 *   - the plain text used for WhatsApp / copy-paste
 * ============================================================================
 */
import { BRAND, findGround, findProgramme } from "../config/site.config.js";
import { formatPrettyDate, formatTime12 } from "../core/time.js";

export const CONTACT_TOPICS = [
  { id: "general", label: "General question" },
  { id: "coach", label: "Question for the coach" },
  { id: "fees", label: "Fees and batches" },
  { id: "partnership", label: "Partnership or sponsorship" },
  { id: "feedback", label: "Feedback" },
];

export function topicLabel(id) {
  return CONTACT_TOPICS.find((topic) => topic.id === id)?.label || id;
}

/* ---------------------------------------------------------------------------
   Trial request -> [label, value] pairs
   ------------------------------------------------------------------------ */
export function trialFields(trial) {
  const ground = findGround(trial.ground);
  const session = ground?.sessions[trial.batch];
  const programme = findProgramme(trial.programme);

  return [
    ["Player", trial.player],
    ["Date of birth", `${trial.dob} (U${trial.underAge})`],
    ["Gender", trial.gender],
    ["Programme", programme?.name || ""],
    ["Ground", ground?.name || ""],
    ["Batch", session ? `${formatTime12(session.start)}–${formatTime12(session.end)} · ${session.group}` : ""],
    ["Trial date", formatPrettyDate(trial.date)],
    ["Experience", trial.experience],
    ["Position", trial.position],
    ["Parent / guardian", trial.parent],
    ["Mobile", trial.phone],
    ["Email", trial.email],
    ["Area", trial.area],
    ["Note", trial.note],
    ["Reference", trial.id],
  ];
}

/* ---------------------------------------------------------------------------
   Contact message -> [label, value] pairs
   ------------------------------------------------------------------------ */
export function messageFields(message) {
  return [
    ["Name", message.name],
    ["Mobile", message.phone],
    ["Email", message.email],
    ["Topic", topicLabel(message.topic)],
    ["Ground", findGround(message.ground)?.name || ""],
    ["Message", message.message],
    ["Reference", message.id],
  ];
}

export function fieldsFor(collection, record) {
  return collection === "trials" ? trialFields(record) : messageFields(record);
}

/* ---------------------------------------------------------------------------
   Plain text (WhatsApp / copy)
   ------------------------------------------------------------------------ */
function toText(title, fields) {
  return [title, ...fields.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`)].join("\n");
}

export function summariseTrial(trial) {
  return toText(`Trial request: ${BRAND.name}`, trialFields(trial));
}

export function summariseMessage(message) {
  return toText(`Message to ${BRAND.name}`, messageFields(message));
}

export function summarise(collection, record) {
  return collection === "trials" ? summariseTrial(record) : summariseMessage(record);
}
