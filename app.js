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
  renderDoodle(note);
  const game = $('game-link');
  if (note.game) {
    game.href = note.game;
    game.textContent = note.gameLabel || "Play today's game";
    game.hidden = false;
  } else game.hidden = true;
}

// ---------- today's doodle (optional Lottie animation) ----------
var doodleAnim = null;
var doodleSrc = "";
function renderDoodle(note) {
  const fig = $('doodle');
  const src = note && note.doodle ? String(note.doodle) : '';
  if (src === doodleSrc && doodleAnim) return;
  if (doodleAnim) { doodleAnim.destroy(); doodleAnim = null; }
  doodleSrc = src;
  const isSvg = /\.svg$/i.test(src);
  const isPage = /\.html$/i.test(src);
  $('doodle-anim').textContent = '';
  $('doodle-anim').classList.toggle('wide', isPage);
  $('doodle-anim').style.aspectRatio = isPage && note.doodleRatio ? String(note.doodleRatio) : '';
  const joke = $('doodle-joke');
  joke.textContent = note && note.joke ? String(note.joke) : '';
  joke.hidden = !joke.textContent;
  if (!src || (!isSvg && !isPage && !window.lottie)) { fig.hidden = true; return; }
  $('doodle-cap').textContent = note.caption || '';
  $('doodle-anim').setAttribute('aria-label', note.caption ? `Doodle: ${note.caption}` : "Today's doodle");
  fig.hidden = false;
  if (isPage) {
    // a small 3D / interactive scene in its own page (e.g. doodles/2026-11-16-bean-skate.html)
    const frame = document.createElement('iframe');
    frame.src = src; frame.className = 'doodle-frame';
    frame.title = note.caption || "Today's doodle";
    frame.loading = 'lazy';
    $('doodle-anim').appendChild(frame);
    doodleAnim = { destroy() { $('doodle-anim').textContent = ''; } };
    return;
  }
  if (isSvg) {
    const img = document.createElement('img');
    img.src = src; img.alt = ''; img.className = 'doodle-img';
    $('doodle-anim').appendChild(img);
    doodleAnim = { destroy() { $('doodle-anim').textContent = ''; } };
    return;
  }
  doodleAnim = window.lottie.loadAnimation({
    container: $('doodle-anim'), renderer: 'svg', loop: true,
    autoplay: !reduceMotion(), path: src,
  });
}
renderNote();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && reader.hidden && !busy) renderNote();
});

// Sunrise driven by requestAnimationFrame so it runs the same on every phone.
function sunrise(pic, sky, glow, ms) {
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  const set = (k) => {
    const e = ease(k);
    pic.style.transform = `translateY(${42 * (1 - e)}%) scale(${1.08 - 0.08 * e})`;
    pic.style.filter = `brightness(${0.12 + 0.88 * Math.min(1, k * 1.15)}) saturate(${0.3 + 0.7 * k})`;
    sky.style.opacity = String(0.92 * (1 - Math.min(1, Math.max(0, (k - 0.08) / 0.85))));
    glow.style.top = `${100 - 62 * e}%`;
    glow.style.opacity = String(Math.min(1, k * 1.7));
  };
  if (reduceMotion()) { set(1); return Promise.resolve(); }
  set(0);
  return new Promise((resolve) => {
    let finished = false;
    const done = () => { if (!finished) { finished = true; set(1); resolve(); } };
    setTimeout(done, ms + 600);             // never stall if frames pause
    const t0 = performance.now();
    const step = (now) => {
      if (finished) return;
      const k = Math.min(1, (now - t0) / ms);
      set(k);
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

// ---------- optional intro scene (e.g. a sunrise before the letter) ----------
// note.intro = { image: 'doodles/....jpg', title: 'Happy Tuesday' }
async function playIntro(intro) {
  const box = $('intro'), pic = $('intro-pic'), go = $('intro-go');
  pic.src = String(intro.image);
  $('intro-title').textContent = intro.title || '';
  await new Promise((r) => { if (pic.complete) r(); else { pic.onload = pic.onerror = () => r(); } });
  box.classList.remove('pop', 'leaving');
  box.hidden = false;
  void box.offsetWidth;                     // start from the dark frame
  await sunrise(pic, box.querySelector('.intro-sky'), box.querySelector('.intro-glow'), 4000);
  await wait(200);
  box.classList.add('pop');                 // "Happy Tuesday" pops in
  await wait(600);
  go.focus({ preventScroll: true });
  await new Promise((r) => go.addEventListener('click', r, { once: true }));
  box.classList.add('leaving');
  await wait(500);
  box.hidden = true;
  box.classList.remove('pop', 'leaving');
}

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
  const note = pickNote(NOTES, localToday()) || FALLBACK;
  if (note.intro && note.intro.image) await playIntro(note.intro);
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
if (location.hash === '#open') open();      // preview hook: open straight away
closeBtn.addEventListener('click', close);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !reader.hidden) close();
});
