/* ==========================================================================
   Law Offices of Victoria Clemans — site behaviour
   Progressive enhancement only: every feature below degrades gracefully and
   the contact form submits normally when JavaScript is unavailable.
   ========================================================================== */
(function () {
  'use strict';

  var ENDPOINT = 'https://vision.leadrai.com/api/forms/ceefb0a93a5066b1f0e7af9fc1d9cb65';

  /* ---------------------------------------------------------------- nav -- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a destination on mobile.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset state when switching to the desktop layout.
    var desktop = window.matchMedia('(min-width: 1000px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  /* --------------------------------------------------------- scrollspy -- */
  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;

    var links = Array.prototype.slice.call(
      document.querySelectorAll('.primary-nav a[href^="#"]')
    );
    if (!links.length) return;

    var map = {};
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) { map[id] = link; sections.push(section); }
    });

    var visible = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible[entry.target.id] = entry.isIntersecting;
      });

      var current = null;
      sections.forEach(function (section) {
        if (visible[section.id] && !current) current = section.id;
      });

      links.forEach(function (link) { link.removeAttribute('aria-current'); });
      if (current && map[current]) map[current].setAttribute('aria-current', 'true');
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* -------------------------------------------------------------- form -- */
  function showThanks(statusEl, form) {
    if (!statusEl) return;
    statusEl.hidden = false;
    if (form) form.hidden = true;
    // Move focus so screen-reader and keyboard users land on the confirmation.
    statusEl.setAttribute('tabindex', '-1');
    try { statusEl.focus({ preventScroll: true }); } catch (err) { statusEl.focus(); }
    statusEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function initForm() {
    var form = document.getElementById('contact-form');
    var statusEl = document.getElementById('form-status');
    var pageField = document.getElementById('form-page');

    // Always record the page the visitor submitted from.
    if (pageField) pageField.value = window.location.href;

    // Plain (no-JS) submissions come back with ?submitted=1 — confirm inline.
    var params = new URLSearchParams(window.location.search);
    if (params.get('submitted') === '1') {
      showThanks(statusEl, form);
      return;
    }

    if (!form) return;

    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return; // let the browser POST normally

      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        e.preventDefault();
        return;
      }

      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      data._page = window.location.href;

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: res.ok }; });
        })
        .then(function (json) {
          if (json && json.ok) {
            showThanks(statusEl, form);
          } else {
            throw new Error('Submission rejected');
          }
        })
        .catch(function () {
          // Network or server failure: fall back to a standard browser POST.
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
          }
          HTMLFormElement.prototype.submit.call(form);
        });
    });
  }

  /* -------------------------------------------------------------- init -- */
  function init() {
    initNav();
    initScrollSpy();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
