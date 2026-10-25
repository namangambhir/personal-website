/* home.js
   Home page only. The page is finished without this file: the name, the
   about text, the buttons and the photo are all in the HTML and all visible.

   This adds one thing, the redaction reveal. A bar is laid over each
   rendered line of the about text and retracts to the right, a line at a
   time, so the text appears to be unredacted.

   The rule this follows: anything the animation hides, the script hides
   itself. Nothing in the HTML or the stylesheet starts hidden. So if this
   file is stale, blocked, or throws, the page is simply complete. */
(function () {
  'use strict';

  var LINE_MS = 250;       /* how long one bar takes to retract */
  var STAGGER_MS = 80;     /* gap between one line starting and the next */
  var START_MS = 350;      /* let the name land before anything moves */
  var FONT_WAIT_MS = 1200; /* give up waiting for webfonts after this */
  var KEY = 'ng-about-revealed';

  var about = document.querySelector('.about-text');
  if (!about) return;

  var fades = document.querySelectorAll('.hero-actions, .hero-aside');
  var bars = [];
  var timers = [];
  var finished = false;

  function showFades() {
    Array.prototype.forEach.call(fades, function (el) {
      el.classList.remove('reveal-pending');
      el.classList.add('reveal-in');
    });
  }

  function hideFades() {
    Array.prototype.forEach.call(fades, function (el) {
      el.classList.add('reveal-pending');
    });
  }

  function removeSkips() {
    document.removeEventListener('click', finish);
    document.removeEventListener('keydown', finish);
    window.removeEventListener('scroll', finish);
    window.removeEventListener('resize', finish);
  }

  /* Ends the animation wherever it had got to and leaves the finished page */
  function finish() {
    if (finished) return;
    finished = true;
    var i;
    for (i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    for (i = 0; i < bars.length; i++) {
      if (bars[i].parentNode) bars[i].parentNode.removeChild(bars[i]);
    }
    bars = [];
    showFades();
    removeSkips();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* private mode */ }
  }

  /* Anyone who asked for less motion, or who has already watched this once
     in this session, gets the finished page and no bars at all. */
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) { seen = false; }
  if (reduced || seen) return;

  /* One bar per line box of real rendered text. Measuring the line boxes
     rather than guessing is what keeps the bars on the lines at any width. */
  function buildBars() {
    var base = about.getBoundingClientRect();
    var paras = about.getElementsByTagName('p');
    var i, j;

    for (i = 0; i < paras.length; i++) {
      var range = document.createRange();
      range.selectNodeContents(paras[i]);
      var rects = range.getClientRects();

      for (j = 0; j < rects.length; j++) {
        var r = rects[j];
        if (r.width < 1 || r.height < 1) continue;
        var bar = document.createElement('span');
        bar.className = 'redact-bar';
        bar.setAttribute('aria-hidden', 'true');
        bar.style.left = (r.left - base.left) + 'px';
        bar.style.top = (r.top - base.top) + 'px';
        bar.style.width = r.width + 'px';
        bar.style.height = r.height + 'px';
        about.appendChild(bar);
        bars.push(bar);
      }
    }
  }

  function start() {
    if (finished) return;
    try {
      buildBars();
    } catch (e) {
      finish();
      return;
    }
    if (!bars.length) { finish(); return; }

    /* Any of these means the reader is done waiting */
    document.addEventListener('click', finish);
    document.addEventListener('keydown', finish);
    window.addEventListener('scroll', finish, { passive: true });
    /* A resize would leave the bars measured against the old line boxes, so
       rather than show them in the wrong place, end the animation. */
    window.addEventListener('resize', finish);

    bars.forEach(function (bar, i) {
      timers.push(setTimeout(function () {
        bar.classList.add('is-retracting');
      }, START_MS + i * STAGGER_MS));
    });

    var lastStart = START_MS + (bars.length - 1) * STAGGER_MS;

    /* Buttons and photo come in with the last line */
    timers.push(setTimeout(showFades, lastStart));
    timers.push(setTimeout(finish, lastStart + LINE_MS + 100));
  }

  /* Webfonts change where the lines break, so measure once the font in use
     is the final one. document.fonts.ready settles even when a font fails,
     but the timeout means a browser without it still runs. */
  hideFades();

  var started = false;
  function startOnce() {
    if (started) return;
    started = true;
    start();
  }

  setTimeout(startOnce, FONT_WAIT_MS);
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(startOnce, startOnce);
  } else {
    startOnce();
  }
})();
