(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* ------------------------------------------------------------
     Contact form delivery.
     Leave FORM_ENDPOINT empty to open the visitor's e-mail app
     with a pre-filled message. To receive messages directly,
     create a free form at e.g. formspree.io and paste its URL.
     ------------------------------------------------------------ */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'matchkleurenstijl@ziggo.nl';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header state on scroll ---------- */
  var header = document.getElementById('site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');

  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Menu sluiten' : 'Menu openen';
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
  }
  toggle.addEventListener('click', function () {
    setNav(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setNav(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNav(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
    if (mq.matches) setNav(false);
  });

  /* ---------- Active nav link while scrolling ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + entry.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Colour-season tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.season-tabs [role="tab"]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

  function selectTab(index, focus) {
    tabs.forEach(function (tab, i) {
      var active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
      panels[i].classList.remove('is-entering');
    });
    var panel = panels[index];
    void panel.offsetWidth; // restart the swatch animation
    panel.classList.add('is-entering');
    if (focus) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(i, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); selectTab(next, true); }
    });
  });
  if (tabs.length) {
    panels.forEach(function (p, i) { p.hidden = i !== 0; });
  }

  /* ---------- "Boek deze sessie" pre-selects the service ---------- */
  var serviceSelect = document.getElementById('f-service');
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-service]');
    if (!link || !serviceSelect) return;
    serviceSelect.value = link.getAttribute('data-service');
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (input) {
      var valid = input.value.trim() !== '' && (input.type !== 'email' || /^\S+@\S+\.\S+$/.test(input.value.trim()));
      input.closest('.field').classList.toggle('has-error', !valid);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    return ok;
  }

  form.addEventListener('input', function (e) {
    var field = e.target.closest('.field');
    if (field && field.classList.contains('has-error')) validate();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Vul je naam, een geldig e-mailadres en je bericht in.', true);
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var data = new FormData(form);

    if (FORM_ENDPOINT) {
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      setStatus('Bezig met versturen…');
      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          setStatus('Bedankt voor je bericht! Je ontvangt zo snel mogelijk een reactie.');
        })
        .catch(function () {
          setStatus('Er ging iets mis bij het versturen. Mail gerust direct naar ' + CONTACT_EMAIL + '.', true);
        })
        .then(function () { button.disabled = false; });
      return;
    }

    var subject = 'Aanvraag via website – ' + data.get('interesse');
    var body = [
      'Naam: ' + data.get('naam'),
      'E-mail: ' + data.get('email'),
      'Telefoon: ' + (data.get('telefoon') || '-'),
      'Interesse: ' + data.get('interesse'),
      '',
      data.get('bericht')
    ].join('\n');

    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    setStatus('Je e-mailprogramma wordt geopend met je bericht. Verstuur het daar om het af te ronden.');
  });

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
