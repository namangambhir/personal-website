/* home.js
   Home page only. The page is finished without this file: the name is
   plain Latin text in the HTML, and the gloss under it works on hover and
   focus with CSS alone.

   This adds the name intro. When the home page is opened from outside the
   site (a link, a bookmark, a reload), the name appears in Devanagari and
   then transliterates itself, one syllable at a time, left to right:
   न becomes Na, म becomes ma, and so on, each syllable dropping away as
   its Latin spelling rises in and the word reflows to its Latin width.
   Then the gloss under the name ("serious greetings") shows for a moment.

   Coming back from another page of the site skips it. Any click, key or
   scroll ends it at once. If anything fails, the Latin name is simply
   there, because the script builds the animated copy itself. */
(function () {
  'use strict';

  var HOLD_MS = 900;        /* Devanagari on screen before the first syllable turns */
  var STEP_MS = 120;        /* gap between one syllable turning and the next */
  var TURN_MS = 450;        /* how long one syllable takes to turn */
  var GLOSS_MS = 2600;      /* how long the gloss stays up afterwards */
  var FONT_WAIT_MS = 1200;  /* never wait longer than this for fonts */

  /* Each pair is one Devanagari syllable and its Latin spelling. */
  var SYLLABLES = [
    ['न', 'Na'], ['म', 'ma'], ['न', 'n'],
    [' ', ' '],
    ['गं', 'Gam'], ['भी', 'bhi'], ['र', 'r']
  ];

  var name = document.querySelector('.hero-name');
  var root = document.documentElement;
  if (!name) return;

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

  var timers = [];
  var done = false;
  var anim = null;
  var cells = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  function cleanup() {
    release();
    if (anim && anim.parentNode) anim.parentNode.removeChild(anim);
    name.classList.remove('is-anim');
  }

  function finish(keepGloss) {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('click', skip);
    document.removeEventListener('keydown', skip);
    window.removeEventListener('scroll', skip);
    cleanup();
    if (keepGloss === true) {
      name.classList.add('gloss-peek');
      setTimeout(function () { name.classList.remove('gloss-peek'); }, GLOSS_MS);
    }
  }
  function skip() { finish(false); }

  function build() {
    anim = document.createElement('span');
    anim.className = 'name-anim';
    anim.setAttribute('aria-hidden', 'true');
    SYLLABLES.forEach(function (pair) {
      var cell = document.createElement('span');
      cell.className = 'ch';
      var d = document.createElement('span');
      d.className = 'd';
      d.lang = 'hi';
      d.textContent = pair[0];
      var l = document.createElement('span');
      l.className = 'l';
      l.textContent = pair[1];
      cell.appendChild(d);
      cell.appendChild(l);
      anim.appendChild(cell);
      cells.push({ cell: cell, d: d, l: l });
    });
    name.insertBefore(anim, name.firstChild);
    name.classList.add('is-anim');
    release();

    /* Lock each cell to its Devanagari width; it eases to the Latin width
       as it turns, so the word reflows smoothly instead of jumping. */
    cells.forEach(function (c) {
      c.dw = c.d.getBoundingClientRect().width;
      c.lw = c.l.getBoundingClientRect().width;
      c.cell.style.width = c.dw + 'px';
    });
  }

  function run() {
    if (done) return;
    try { build(); } catch (e) { finish(false); return; }

    cells.forEach(function (c, i) {
      later(function () {
        c.cell.style.width = c.lw + 'px';
        c.cell.classList.add('is-turned');
      }, HOLD_MS + i * STEP_MS);
    });
    later(function () { finish(true); },
          HOLD_MS + (cells.length - 1) * STEP_MS + TURN_MS + 80);
  }

  document.addEventListener('click', skip);
  document.addEventListener('keydown', skip);
  window.addEventListener('scroll', skip, { passive: true });

  /* Measure only once both fonts are in, or the widths would be wrong. */
  var started = false;
  function startOnce() { if (!started) { started = true; run(); } }
  if (document.fonts && document.fonts.load) {
    Promise.all([
      document.fonts.load('1em "Tiro Devanagari Hindi"', 'नमन गंभीर'),
      document.fonts.load('1em "Charis SIL"', 'Naman Gambhir')
    ]).then(startOnce, startOnce);
  }
  setTimeout(startOnce, FONT_WAIT_MS);
})();
