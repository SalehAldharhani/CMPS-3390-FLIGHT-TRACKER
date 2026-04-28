/**
 * validators.js
 * --------------------------------------------------------------------------
 * Pure validation/sanitisation functions. Used on the client BEFORE making
 * a request, and re-used on the server to enforce the same rules.
 *
 * Implements the spec requirement:
 *   "Client/Server data validation/sanitization (verifying email/password
 *    & flight num) (Sanitization Denying SQL Inserts or Injections)"
 */

// IATA airline + flight number, e.g. "AA100", "BA2490", "DL55"
// 2-letter (or 2-char alphanumeric) carrier code + 1-4 digit number.
const FLIGHT_NUMBER_RE = /^[A-Z0-9]{2}\d{1,4}$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Characters that are very commonly the start of an SQL/script injection
// attempt. We REJECT inputs containing these for any free-text field that
// will be persisted server-side. (Real defence is parametrised queries on
// the backend - this is belt-and-braces.)
const DANGEROUS_RE = /['";<>\\]|--|\/\*|\*\//;

/** Strip leading/trailing whitespace and uppercase a flight number. */
export function sanitizeFlightNumber(input = '') {
  return String(input).trim().toUpperCase().replace(/\s+/g, '');
}

export function validateFlightNumber(input) {
  const cleaned = sanitizeFlightNumber(input);
  if (!cleaned)                  return { ok: false, error: 'Flight number required.' };
  if (cleaned.length > 8)        return { ok: false, error: 'Flight number too long.' };
  if (!FLIGHT_NUMBER_RE.test(cleaned))
    return { ok: false, error: 'Use format like AA100 or BA2490.' };
  return { ok: true, value: cleaned };
}

export function validateEmail(input = '') {
  const cleaned = String(input).trim().toLowerCase();
  if (!cleaned)             return { ok: false, error: 'Email required.' };
  if (cleaned.length > 254) return { ok: false, error: 'Email too long.' };
  if (!EMAIL_RE.test(cleaned))
    return { ok: false, error: 'Enter a valid email address.' };
  return { ok: true, value: cleaned };
}

// Username: 3-20 chars, alphanumeric + underscore + hyphen.
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,20}$/;

export function validateUsername(input = '') {
  const cleaned = String(input).trim();
  if (!cleaned)                  return { ok: false, error: 'Username required.' };
  if (cleaned.length < 3)        return { ok: false, error: 'Username must be at least 3 characters.' };
  if (cleaned.length > 20)       return { ok: false, error: 'Username must be 20 characters or fewer.' };
  if (!USERNAME_RE.test(cleaned))
    return { ok: false, error: 'Use letters, numbers, hyphens, and underscores only.' };
  return { ok: true, value: cleaned };
}

export function validatePassword(input = '') {
  if (typeof input !== 'string')
    return { ok: false, error: 'Password required.' };
  if (input.length < 8)
    return { ok: false, error: 'Use at least 8 characters.' };
  if (input.length > 128)
    return { ok: false, error: 'Password too long.' };
  return { ok: true, value: input };
}

/** Generic free-text sanitiser: rejects common injection markers. */
export function validateSafeText(input = '', { max = 500 } = {}) {
  const s = String(input);
  if (s.length > max)        return { ok: false, error: `Max ${max} chars.` };
  if (DANGEROUS_RE.test(s))  return { ok: false, error: 'Disallowed characters.' };
  return { ok: true, value: s.trim() };
}
