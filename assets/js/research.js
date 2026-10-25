/* research.js
   Research page only. The page is complete without this file: every title,
   status, abstract paragraph, figure and link is already in the HTML. This
   adds two things. It folds each abstract down to its first paragraph behind
   a toggle, and it wires up the Copy BibTeX buttons, whose text lives in a
   <template> beside each button. */
(function () {
  'use strict';

  /* ---------- Abstracts: fold down to the first paragraph ----------
     The toggle moves: at the end of the first paragraph while collapsed, at
     the end of the last paragraph once open, so the abstract never looks
     like it stops in the middle. */
  var abstracts = document.querySelectorAll('.abstract');

  /* Plain loop rather than querySelectorAll(':scope > p'). A selector the
     browser does not understand throws and takes the whole file down with
     it, and this cannot. */
  function directParagraphs(parent) {
    var out = [];
    var kids = parent.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].tagName === 'P') out.push(kids[i]);
    }
    return out;
  }

  Array.prototype.forEach.call(abstracts, function (abstract) {
    var paras = directParagraphs(abstract);
    var toggle = abstract.querySelector('.abstract-toggle');
    if (!toggle) return;

    /* Nothing to fold away, so no control for it */
    if (paras.length < 2) {
      toggle.parentNode.removeChild(toggle);
      return;
    }

    /* This is what lets the CSS fold the abstract. It is set here rather
       than in the HTML so the paragraphs can only ever be hidden by a script
       that is actually running and has wired up the control. */
    abstract.classList.add('is-collapsible');

    function show(open) {
      abstract.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'less' : 'more';
      (open ? paras[paras.length - 1] : paras[0]).appendChild(toggle);
    }

    show(false);

    toggle.addEventListener('click', function () {
      show(toggle.getAttribute('aria-expanded') !== 'true');
      /* Moving the button between paragraphs can drop focus, so put it back
         for anyone driving this from the keyboard. */
      toggle.focus();
    });
  });

  /* ---------- Copy BibTeX ---------- */
  var buttons = document.querySelectorAll('.copy-bib');
  if (!buttons.length) return;

  function bibtexFor(button) {
    var tpl = button.closest('.item').querySelector('template.bibtex');
    return tpl ? tpl.innerHTML.trim() : '';
  }

  /* Fallback for Safari and for pages not served over https, where
     navigator.clipboard is unavailable. */
  function copyViaTextarea(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function flash(button, message) {
    if (button._timer) clearTimeout(button._timer);
    if (!button._label) button._label = button.textContent;
    button.textContent = message;
    button._timer = setTimeout(function () {
      button.textContent = button._label;
    }, 2000);
  }

  Array.prototype.forEach.call(buttons, function (button) {
    button.addEventListener('click', function () {
      var text = bibtexFor(button);
      if (!text) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          flash(button, 'Copied');
        }, function () {
          flash(button, copyViaTextarea(text) ? 'Copied' : 'Copy failed');
        });
      } else {
        flash(button, copyViaTextarea(text) ? 'Copied' : 'Copy failed');
      }
    });
  });
})();
