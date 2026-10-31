/* Click events for GoatCounter. Page views are counted by GoatCounter's own
   script (count.js); this file only adds named events for the links worth
   knowing about. It listens on the whole document, so any new PDF, email,
   WhatsApp or LinkedIn link is picked up automatically. If GoatCounter is
   blocked or fails to load, this does nothing and the page is unaffected. */
(function () {
  function eventName(a) {
    var href = a.getAttribute('href') || '';
    var h = href.toLowerCase();
    if (h.indexOf('mailto:') === 0) return 'click-email';
    if (h.indexOf('wa.me') !== -1) return 'click-whatsapp';
    if (h.indexOf('linkedin.com') !== -1) return 'click-linkedin';
    if (/\.pdf($|[?#])/.test(h)) {
      var file = h.split(/[?#]/)[0].split('/').pop();
      return file === 'cv.pdf' ? 'click-cv-pdf' : 'click-pdf-' + file.replace(/\.pdf$/, '');
    }
    return null;
  }
  function track(e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var name = eventName(a);
      if (!name || !window.goatcounter || !window.goatcounter.count) return;
      window.goatcounter.count({ event: true, path: name, title: name });
    } catch (err) { /* never block navigation */ }
  }
  document.addEventListener('click', track);
  document.addEventListener('auxclick', track);
})();
