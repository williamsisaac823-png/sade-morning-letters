// Pure helpers — no DOM, so Node can test them.

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const FALLBACK = { date: null, text: 'Thinking of you today.' };

/** True for a real calendar date written as YYYY-MM-DD. */
export function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function validateNote(note) {
  return !!note && isValidDate(note.date) && typeof note.text === 'string' && note.text.trim().length > 0;
}

/** Today's date as YYYY-MM-DD in the device's local time (not UTC). */
export function localToday(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/**
 * Newest valid note dated on or before `today`; if all are in the future,
 * the earliest; if none are valid, null.
 */
export function pickNote(notes, today) {
  const valid = (Array.isArray(notes) ? notes : []).filter(validateNote)
    .slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (!valid.length) return null;
  const past = valid.filter((n) => n.date <= today);
  return past.length ? past[past.length - 1] : valid[0];
}

/** "2026-11-14" → "NOV 14 2026" (postmark style). */
export function formatDate(s) {
  if (!isValidDate(s)) return '';
  const [y, m, d] = s.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d} ${y}`;
}
