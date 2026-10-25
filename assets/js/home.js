/* home.js
   Home page only. The page is finished without this file: the name is
   plain Latin text in the HTML, and the gloss under it works on hover and
   focus with CSS alone.

   This adds one thing. On the first visit in a session the name appears in
   Devanagari, holds for a moment, and crossfades to Latin. The script adds
   the Devanagari itself, so if it fails the page simply shows the Latin
   name. Any click, key or scroll skips straight to the end. */
(function () {
  'use strict';

  var HOLD_MS = 900;       /* how long the Devanagari stays on screen */
  var SWAP_MS = 650;       /* length of the crossfade */
  var FONT_WAIT_MS = 1000; /* give up waiting for the Devanagari font after this */
  var KEY = 'ng-name-shown';

  var name = document.querySelector('.hero-name');
  if (!name) return;

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) { seen = false; }
  if (reduced || seen) {
    document.documentElement.classList.remove('name-intro');
    return;
  }

  var deva = document.createElement('span');
  deva.className = 'name-deva';
  deva.setAttribute('aria-hidden', 'true');
  deva.lang = 'hi';
  deva.textContent = 'नमन गंभीर';

  var timers = [];
  var done = false;

  function cleanup() {
    document.documentElement.classList.remove('name-intro');
    if (deva.parentNode) deva.parentNode.removeChild(deva);
    name.classList.remove('is-deva', 'is-swapping');
  }

  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.removeEventListener('click', finish);
    document.removeEventListener('keydown', finish);
    window.removeEventListener('scroll', finish);
    cleanup();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* private mode */ }
  }

  function swap() {
    if (done) return;
    name.classList.add('is-swapping');
    timers.push(setTimeout(finish, SWAP_MS + 50));
  }

  function start() {
    if (done) return;
    timers.push(setTimeout(swap, HOLD_MS));
  }

  try {
    name.insertBefore(deva, name.firstChild);
    name.classList.add('is-deva');
    document.documentElement.classList.remove('name-intro');
  } catch (e) {
    cleanup();
    return;
  }

  document.addEventListener('click', finish);
  document.addEventListener('keydown', finish);
  window.addEventListener('scroll', finish, { passive: true });

  /* Wait for the Devanagari font so the first thing seen is the real
     letterform, not a fallback, but never longer than FONT_WAIT_MS. */
  var started = false;
  function startOnce() { if (!started) { started = true; start(); } }
  if (document.fonts && document.fonts.load) {
    document.fonts.load('1em "Tiro Devanagari Hindi"', deva.textContent)
      .then(startOnce, startOnce);
  }
  setTimeout(startOnce, FONT_WAIT_MS);
})();
