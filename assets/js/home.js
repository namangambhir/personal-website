/* home.js
   Home page only. The page is finished without this file: the name is
   plain Latin text in the HTML, and the gloss under it works on hover and
   focus with CSS alone.

   This adds the name intro, a typewriter. When the home page is opened
   from outside the site (a link, a bookmark, a reload), the name shows in
   Devanagari with a blinking caret, is backspaced away, and "Naman Gambhir"
   is typed in its place. Then the gloss ("serious greetings") shows under
   the name for a moment.

   Coming back from another page of the site skips it. Any click, key or
   scroll ends it at once. If anything fails, the Latin name is simply
   there: the typed copy is built by this script and removed when done. */
(function () {
  'use strict';

  var HOLD_MS = 900;        /* Devanagari on screen before backspacing starts */
  var BACK_MS = 75;         /* per character, backspacing */
  var PAUSE_MS = 280;       /* empty line, caret blinking, before typing */
  var TYPE_MS = 70;         /* per character typing, plus a little jitter */
  var JITTER_MS = 45;
  var CARET_MS = 900;       /* caret lingers after the last letter */
  var GLOSS_MS = 2600;      /* how long the gloss stays up afterwards */
  var FONT_WAIT_MS = 1200;  /* never wait longer than this for fonts */
  var DEVA = 'नमन गंभीर';

  var name = document.querySelector('.hero-name');
  var latin = name && name.querySelector('.name-latin');
  var root = document.documentElement;
  if (!name || !latin) return;

  function release() { root.classList.remove('name-intro'); }

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fromSite = false;
  try {
    var nav = performance.getEntriesByType('navigation')[0];
    fromSite = !!document.referrer &&
               new URL(document.referrer).origin === location.origin &&
               !(nav && nav.type === 'reload');
  } catch (e) { fromSite = false; }
  if (reduced || fromSite) { release(); return; }

  /* Split into what a reader sees as letters, so a conjunct or a vowel
     sign goes in one keystroke, the way it does on a Hindi keyboard. */
  function graphemes(str) {
    if (window.Intl && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(str),
                        function (s) { return s.segment; });
    }
    return Array.from(str);
  }

  var LATIN = latin.textContent.trim();
  var devaChars = graphemes(DEVA);
  var typed, text, caret, timers = [], done = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function cleanup() {
    release();
    timers.forEach(clearTimeout);
    if (typed && typed.parentNode) typed.parentNode.removeChild(typed);
    name.classList.remove('is-typing');
  }

  function finish(peek) {
    if (done) return;
    done = true;
    document.removeEventListener('click', skip);
    document.removeEventListener('keydown', skip);
    window.removeEventListener('scroll', skip);
    cleanup();
    if (peek) {
      name.classList.add('gloss-peek');
      setTimeout(function () { name.classList.remove('gloss-peek'); }, GLOSS_MS);
    }
  }
  function skip() { finish(false); }

  /* Like a real editor: the caret stays solid while keys are going and
     only blinks once the typing pauses. */
  var idle = 0;
  function show(str, isDeva) {
    caret.classList.add('is-solid');
    clearTimeout(idle);
    idle = setTimeout(function () { caret.classList.remove('is-solid'); }, 450);
    text.textContent = str;
    text.lang = isDeva ? 'hi' : 'en';
    text.className = isDeva ? 'type-text is-deva' : 'type-text';
  }

  function run() {
    if (done) return;
    try {
      typed = document.createElement('span');
      typed.className = 'name-type';
      typed.setAttribute('aria-hidden', 'true');
      text = document.createElement('span');
      caret = document.createElement('span');
      caret.className = 'type-caret';
      typed.appendChild(text);
      typed.appendChild(caret);
      name.insertBefore(typed, name.firstChild);
      name.classList.add('is-typing');
      show(DEVA, true);
      release();
    } catch (e) { finish(false); return; }

    var t = HOLD_MS;
    var i;
    for (i = devaChars.length - 1; i >= 0; i--) {
      (function (n) { later(function () { show(devaChars.slice(0, n).join(''), true); }, t); })(i);
      t += BACK_MS;
    }
    t += PAUSE_MS;
    for (i = 1; i <= LATIN.length; i++) {
      (function (n) { later(function () { show(LATIN.slice(0, n), false); }, t); })(i);
      t += TYPE_MS + Math.random() * JITTER_MS;
    }
    later(function () { finish(true); }, t + CARET_MS);
  }

  document.addEventListener('click', skip);
  document.addEventListener('keydown', skip);
  window.addEventListener('scroll', skip, { passive: true });

  var started = false;
  function startOnce() { if (!started) { started = true; run(); } }
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('1em "Tiro Devanagari Hindi"', DEVA),
      document.fonts.load('1em "Charis SIL"', 'Naman Gambhir')
    ]).then(startOnce, startOnce);
  }
  setTimeout(startOnce, FONT_WAIT_MS);
})();
