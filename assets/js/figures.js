/* figures.js
   Home and Research pages. Every figure is complete in the HTML as an inline
   SVG, so with this file missing the reader still sees the whole chart.

   This adds two things:
   1. The main line draws itself, left to right, the first time the figure
      scrolls into view. The script hides the line itself just before it
      draws it, so a broken script never leaves a blank chart.
   2. A reading cursor. Hover, touch, or focus the chart and use the arrow
      keys: a guide line follows the nearest month and the line under the
      figure reads out the values.

   Each figure's numbers sit beside it in <script type="application/json"
   class="fig-data">, written out from the paper's own figure data. */
(function () {
  'use strict';

  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(name, attrs) {
    var node = document.createElementNS(SVGNS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function fmt(v) { return (v < 0 ? '−' : '') + Math.abs(v).toFixed(1); }

  function setup(fig) {
    var svg = fig.querySelector('svg.chart');
    var dataNode = fig.querySelector('.fig-data');
    var readout = fig.querySelector('.fig-readout');
    if (!svg || !dataNode || !readout) return;

    var data;
    try { data = JSON.parse(dataNode.textContent); } catch (e) { return; }

    var n = data.n;
    var xAt = function (i) { return data.x0 + (data.x1 - data.x0) * i / (n - 1); };

    /* ---------- reading cursor ---------- */
    var guide = el('line', { 'class': 'cursor', y1: data.top, y2: data.bottom,
                             x1: 0, x2: 0, visibility: 'hidden' });
    svg.appendChild(guide);
    var marks = data.series.map(function () {
      var c = el('circle', { 'class': 'cursor-dot', r: 4, visibility: 'hidden' });
      svg.appendChild(c);
      return c;
    });

    var restText = readout.textContent;
    var current = -1;

    function describe(i) {
      var parts = data.series.map(function (s) {
        if (s.lo) {
          return fmt(s.v[i]) + ' ' + data.unit +
                 ' (95% CI ' + fmt(s.lo[i]) + ' to ' + fmt(s.hi[i]) + ')';
        }
        return s.name + ' ' + s.v[i].toFixed(1) + data.unit;
      });
      return data.labels[i] + ': ' + parts.join(', ');
    }

    function show(i) {
      i = Math.max(0, Math.min(n - 1, i));
      current = i;
      var x = xAt(i);
      guide.setAttribute('x1', x);
      guide.setAttribute('x2', x);
      guide.setAttribute('visibility', 'visible');
      data.series.forEach(function (s, k) {
        marks[k].setAttribute('cx', x);
        marks[k].setAttribute('cy', s.y[i]);
        marks[k].setAttribute('visibility', 'visible');
      });
      readout.textContent = describe(i);
      readout.classList.add('is-live');
    }

    function hide() {
      current = -1;
      guide.setAttribute('visibility', 'hidden');
      marks.forEach(function (m) { m.setAttribute('visibility', 'hidden'); });
      readout.textContent = restText;
      readout.classList.remove('is-live');
    }

    function indexFromEvent(ev) {
      var ctm = svg.getScreenCTM();
      if (!ctm) return -1;
      var pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      var p = pt.matrixTransform(ctm.inverse());
      return Math.round((p.x - data.x0) / (data.x1 - data.x0) * (n - 1));
    }

    svg.addEventListener('pointermove', function (ev) { show(indexFromEvent(ev)); });
    svg.addEventListener('pointerdown', function (ev) { show(indexFromEvent(ev)); });
    svg.addEventListener('pointerleave', hide);

    svg.setAttribute('tabindex', '0');
    svg.addEventListener('focus', function () { show(current < 0 ? n - 1 : current); });
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft')  { show(current - 1); ev.preventDefault(); }
      if (ev.key === 'ArrowRight') { show(current + 1); ev.preventDefault(); }
      if (ev.key === 'Home')       { show(0); ev.preventDefault(); }
      if (ev.key === 'End')        { show(n - 1); ev.preventDefault(); }
    });

    fig.classList.add('is-interactive');

    /* ---------- draw-in ---------- */
    if (reduced || !('IntersectionObserver' in window)) return;
    var lines = svg.querySelectorAll('.line');
    var dots = svg.querySelector('.dots');
    var lens = [];
    try {
      Array.prototype.forEach.call(lines, function (ln) {
        var len = ln.getTotalLength();
        lens.push(len);
        ln.style.strokeDasharray = len;
        ln.style.strokeDashoffset = len;
      });
    } catch (e) {
      Array.prototype.forEach.call(lines, function (ln) {
        ln.style.strokeDasharray = '';
        ln.style.strokeDashoffset = '';
      });
      return;
    }
    if (dots) dots.style.opacity = 0;

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      Array.prototype.forEach.call(lines, function (ln, k) {
        ln.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.45, 0, 0.2, 1) ' + (k * 150) + 'ms';
        ln.style.strokeDashoffset = 0;
      });
      if (dots) {
        dots.style.transition = 'opacity 500ms ease 1200ms';
        dots.style.opacity = 1;
      }
    }, { threshold: 0.4 });
    io.observe(svg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.fig'), function (fig) {
    try { setup(fig); } catch (e) { /* the static chart is already complete */ }
  });
})();
