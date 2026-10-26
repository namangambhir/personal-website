/* home.js
   Home page only. The page is finished without this file: the name is
   plain text in the HTML, and the gloss under it works on hover and focus
   with CSS alone.

   This adds the name intro. "Naman" is a palindrome, so it is revealed
   from both ends inward: N and n together, then a and a, then the m in the
   middle. A caret then appears and types " Gambhir". Then the gloss shows
   under the name for a moment.

   It runs when the home page is opened from outside the site (a link, a
   bookmark, a reload). Coming back from another page of the site skips it.
   Any click, key or scroll ends it at once. If anything fails, the name is
   simply there: the animated copy is built by this script and removed when
   done. */
(function () {
  'use strict';

  var START_MS = 250;       /* blank line before the first pair appears */
  var PAIR_MS = 300;        /* between pairs of "Naman" */
  var HOLD_MS = 450;        /* "Naman" alone, before the surname */
  var TYPE_MS = 70;         /* per character typing, plus a little jitter */
  var JITTER_MS = 45;
  var CARET_MS = 900;       /* caret lingers after the last letter */
  var GLOSS_MS = 2600;      /* how long the gloss stays up afterwards */
  var FONT_WAIT_MS = 1200;  /* never wait longer than this for fonts */

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

  var FULL = latin.textContent.trim();
  var space = FULL.indexOf(' ');
  var FIRST = space > 0 ? FULL.slice(0, space) : FULL;
  var typed, chars = [], caret, timers = [], done = false;

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

  function on(i) { if (chars[i]) chars[i].classList.add('is-on'); }

  /* The caret stays solid while keys are going and only blinks once the
     typing pauses, like a real editor. */
  var idle = 0;
  function typeTo(i) {
    on(i);
    chars[i].parentNode.insertBefore(caret, chars[i].nextSibling);
    caret.classList.add('is-solid');
    clearTimeout(idle);
    idle = setTimeout(function () { caret.classList.remove('is-solid'); }, 450);
  }

  function run() {
    if (done) return;
    try {
      /* Every letter is laid out from the start, hidden, so revealed
         letters never move. */
      typed = document.createElement('span');
      typed.className = 'name-type';
      typed.setAttribute('aria-hidden', 'true');
      Array.from(FULL).forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        typed.appendChild(s);
        chars.push(s);
      });
      caret = document.createElement('span');
      caret.className = 'type-caret';
      caret.style.marginRight = '-0.095em';
      name.insertBefore(typed, name.firstChild);
      name.classList.add('is-typing');
      release();
    } catch (e) { finish(false); return; }

    /* Outside in: (0, last), (1, last - 1), ... meeting in the middle */
    var t = START_MS;
    for (var a = 0, b = FIRST.length - 1; a <= b; a++, b--) {
      (function (x, y) { later(function () { on(x); on(y); }, t); })(a, b);
      t += PAIR_MS;
    }
    t += HOLD_MS - PAIR_MS;
    later(function () { typeTo(FIRST.length - 1); }, t);
    t += HOLD_MS;
    for (var i = FIRST.length; i < FULL.length; i++) {
      (function (n) { later(function () { typeTo(n); }, t); })(i);
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
    document.fonts.load('1em "Charis SIL"', FULL).then(startOnce, startOnce);
  }
  setTimeout(startOnce, FONT_WAIT_MS);
})();
