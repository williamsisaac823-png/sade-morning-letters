import { pickNote, localToday, formatDate, FALLBACK } from './pick.js';
import { NOTES } from './notes.js';

const $ = (id) => document.getElementById(id);
const sealed = $('sealed');
const envelope = $('envelope');
const reader = $('reader');
const sheet = $('sheet');
const noteEl = $('note');
const closeBtn = $('close');

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion() ? 0 : ms));

// ---------- fill in today's note ----------
// Re-run before every opening and when the tab comes back, so a tab left
// open overnight still shows the new day's note.
function renderNote() {
  const note = pickNote(NOTES, localToday()) || FALLBACK;
  const stamped = formatDate(note.date);
  $('postmark-date').textContent = stamped || 'TODAY';
  $('sheet-date').textContent = stamped;
  noteEl.textContent = '';
  for (const para of String(note.text).split(/\n\s*\n/)) {
    const p = document.createElement('p');
    p.textContent = para.trim();
    noteEl.appendChild(p);
  }
}
renderNote();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && reader.hidden && !busy) renderNote();
});

// ---------- open / close ----------
let busy = false;

async function open() {
  if (busy) return;
  busy = true;
  renderNote();
  envelope.classList.add('open');           // flap folds back
  await wait(260);
  envelope.classList.add('flap-behind');    // flap tucks behind the letter
  await wait(240);
  envelope.classList.add('rise');           // letter slides up
  await wait(650);
  sealed.classList.add('leaving');          // envelope drops away
  await wait(350);
  sealed.hidden = true;
  reader.hidden = false;                    // sheet unfolds into view
  sheet.focus({ preventScroll: true });
  busy = false;
}

async function close() {
  if (busy) return;
  busy = true;
  reader.classList.add('leaving');
  await wait(430);
  reader.hidden = true;
  reader.classList.remove('leaving');
  sealed.hidden = false;
  envelope.classList.remove('rise', 'flap-behind', 'open');
  await wait(20);
  sealed.classList.remove('leaving');
  await wait(450);
  envelope.focus({ preventScroll: true });
  busy = false;
}

envelope.addEventListener('click', open);
closeBtn.addEventListener('click', close);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !reader.hidden) close();
});
