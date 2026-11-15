/**
 * ============================================================================
 * core/validators.js
 * ----------------------------------------------------------------------------
 * Input checks used by the trial, contact and newsletter forms.
 * ============================================================================
 */
import { PROGRAMMES, findProgramme } from "../config/site.config.js";
import { getIstNow } from "./time.js";

const MIN_AGE = 5;
const MAX_AGE = 17;
const AGE_GROUP_LIMITS = [8, 10, 12, 14, 17];

/* ---------------------------------------------------------------------------
   Phone: Indian 10-digit mobile, with or without +91 / 0 prefix
   ------------------------------------------------------------------------ */
export function normalisePhone(value) {
  return String(value || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
}

export function isValidPhone(value) {
  const digits = normalisePhone(value);
  return digits.length === 10 && /^[6-9]/.test(digits);
}

/* ---------------------------------------------------------------------------
   Email (optional fields pass when empty)
   ------------------------------------------------------------------------ */
export function isValidEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* ---------------------------------------------------------------------------
   Age group from date of birth
   Uses the season year, the way Indian age-group football does.
   Returns { underAge, programme, age } or { error }.
   ------------------------------------------------------------------------ */
export function getAgeGroup(dateOfBirth) {
  if (!dateOfBirth) return null;

  const birthYear = new Date(dateOfBirth).getFullYear();
  const age = getIstNow().date.getFullYear() - birthYear;

  if (Number.isNaN(age) || age < 0 || age > 60) return { error: "Check the date of birth." };
  if (age < MIN_AGE) return { error: `We start players from age ${MIN_AGE}.` };
  if (age > MAX_AGE) return { error: `Our batches run up to U${MAX_AGE}.` };

  const underAge = AGE_GROUP_LIMITS.find((limit) => age < limit) || MAX_AGE;
  const programme =
    PROGRAMMES.find((p) => p.ageBand && age >= p.ageBand[0] && age < p.ageBand[1]) || findProgramme("youth");

  return { underAge, programme, age };
}
