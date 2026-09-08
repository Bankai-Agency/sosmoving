/* ============================================================
   sos-native.js - the interactions the Webflow runtime used to provide,
   in plain JS. Loaded by ScriptLoader only when html.sos-native is set
   (?sosnative=1 / localStorage), instead of the Webflow chunks, the
   page bundle and the wf-*-map fetches. No jQuery needed.

   Ported behaviours (measured on the live runtime, see
   docs/animations/README.md):
     - navbar dropdowns: hover open with the 500ms close delay, click
       toggle on touch, w--open classes, aria, z-index while open,
       outside click / Escape close, IX2 a-6/a-7 scale+fade via CSS
     - mobile menu: overlay + slide from above (400ms), body scroll lock,
       menu fade (IX2 a-12/a-13); the burger itself is CSS in sos-native.css
     - current-page highlighting of nav links (w--current)
     - yellow button "stays yellow after hover" quirk (IX2 a-30)
     - multistep quote forms step 1 -> step 2 (IX2 a-34/a-35)
   Not ported on purpose: IX2 a-8/a-9 (target is an empty div), a-31
   (a click flash on a link that navigates away), the scroll scrub (its
   trigger blocks hold no tracks on any page). The About-C marquee is
   already GSAP in custom-scripts.js.
   ============================================================ */
(function () {
  'use strict';
  var html = document.documentElement;
  if (!html.classList.contains('sos-native')) return;

  // ── Webflow.push shim ──
  // sos-main.js wraps its whole init (slick sliders, select2, input masks,
  // page_path, the form -> CRM handlers) in `Webflow.push(fn)`. The runtime
  // ran those callbacks on DOM ready; without it window.Webflow is a bare
  // array and the callbacks would just sit there. Same contract here.
  (function shim() {
    var queued = Array.isArray(window.Webflow) ? window.Webflow.slice() : [];
    var run = function (fn) {
      if (typeof fn !== 'function') return;
      var go = function () { try { fn(); } catch (e) { console.error('[sos-native] Webflow.push callback failed:', e); } };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
      else go();
    };
    window.Webflow = {
      push: run,
      ready: function () {},
      require: function () { return null; },
      env: function () { return false; },
      destroy: function () {},
    };
    queued.forEach(run);
  })();

  var TOUCH = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (TOUCH) html.classList.add('w-mod-touch');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = function () { return window.innerWidth > 767; };
  var reflow = function (el) { return el.offsetHeight; };

  // ── Current page in the navbar (Webflow "links" module) ──
  (function markCurrent() {
    var path = location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.w-nav a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/^https?:/.test(href) || href.charAt(0) !== '/') return;
      var target = href.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
      if (target === path) { a.classList.add('w--current'); a.setAttribute('aria-current', 'page'); }
    });
  })();

  // ── Dropdowns (Webflow "dropdown" module + IX2 a-6/a-7) ──
  var openDropdowns = [];
  function ddClose(dd, immediate) {
    var d = dd.__sosDd; if (!d || !d.open) return;
    d.open = false; d.hovering = false;
    clearTimeout(d.timer);
    d.toggle.setAttribute('aria-expanded', 'false');
    d.list.classList.remove('sos-dd-in');
    var finish = function () {
      if (d.open) return;
      d.list.classList.remove('w--open');
      d.toggle.classList.remove('w--open');
      dd.classList.remove('sos-dd-open');
    };
    if (immediate || reduced) finish(); else d.timer = setTimeout(finish, 500);
    openDropdowns = openDropdowns.filter(function (x) { return x !== dd; });
  }
  function ddOpen(dd) {
    var d = dd.__sosDd; if (!d || d.open) return;
    clearTimeout(d.timer);
    d.open = true;
    openDropdowns.forEach(function (other) { if (other !== dd && !other.contains(dd)) ddClose(other, false); });
    openDropdowns.push(dd);
    dd.classList.add('sos-dd-open');
    d.toggle.classList.add('w--open');
    d.list.classList.add('w--open');
    d.toggle.setAttribute('aria-expanded', 'true');
    reflow(d.list);
    requestAnimationFrame(function () { if (d.open) d.list.classList.add('sos-dd-in'); });
  }
  document.querySelectorAll('.w-dropdown').forEach(function (dd, i) {
    var toggle = dd.querySelector(':scope > .w-dropdown-toggle');
    var list = dd.querySelector(':scope > .w-dropdown-list');
    if (!toggle || !list) return;
    var hover = dd.getAttribute('data-hover') === 'true';
    var delay = parseInt(dd.getAttribute('data-delay') || '0', 10) || 0;
    var d = dd.__sosDd = { toggle: toggle, list: list, open: false, hovering: false, timer: 0 };
    if (!toggle.id) toggle.id = 'w-dropdown-toggle-' + i;
    if (!list.id) list.id = 'w-dropdown-list-' + i;
    toggle.setAttribute('aria-controls', list.id);
    toggle.setAttribute('aria-haspopup', 'menu');
    toggle.setAttribute('aria-expanded', 'false');
    if (toggle.tagName !== 'BUTTON') { toggle.setAttribute('role', 'button'); if (!toggle.hasAttribute('tabindex')) toggle.setAttribute('tabindex', '0'); }
    list.setAttribute('aria-labelledby', toggle.id);

    if (hover && !TOUCH) {
      dd.addEventListener('mouseenter', function () { d.hovering = true; clearTimeout(d.timer); if (isDesktop()) ddOpen(dd); });
      dd.addEventListener('mouseleave', function () {
        d.hovering = false;
        clearTimeout(d.timer);
        d.timer = setTimeout(function () { if (!d.hovering) ddClose(dd, false); }, delay);
      });
    }
    toggle.addEventListener('click', function (e) {
      // The toggle may wrap a real link (About us) - let it navigate on desktop hover menus.
      if (e.target.closest('a[href]') && !TOUCH && hover) return;
      if (e.target.closest('a[href]') && TOUCH) e.preventDefault();
      if (d.open) ddClose(dd, false); else ddOpen(dd);
    });
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (d.open) ddClose(dd, false); else ddOpen(dd); }
      if (e.key === 'Escape' && d.open) { ddClose(dd, false); toggle.focus(); }
    });
    dd.addEventListener('focusout', function (e) {
      if (!dd.contains(e.relatedTarget)) ddClose(dd, false);
    });
  });
  document.addEventListener('click', function (e) {
    openDropdowns.slice().forEach(function (dd) { if (!dd.contains(e.target)) ddClose(dd, false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') openDropdowns.slice().forEach(function (dd) { ddClose(dd, false); });
  });

  // ── Mobile menu (Webflow "navbar" module, data-animation="default", + IX2 a-12/a-13) ──
  (function navbar() {
    var nav = document.querySelector('.w-nav');
    if (!nav) return;
    var button = nav.querySelector('.w-nav-button');
    var menu = nav.querySelector('.w-nav-menu');
    if (!button || !menu) return;
    var duration = parseInt(nav.getAttribute('data-duration') || '400', 10) || 400;
    var easing = nav.getAttribute('data-easing') || 'ease';
    var easing2 = nav.getAttribute('data-easing2') || 'ease';
    var overlay = document.createElement('div');
    overlay.className = 'w-nav-overlay';
    overlay.setAttribute('data-wf-ignore', '');
    overlay.id = 'w-nav-overlay-0';
    overlay.style.display = 'none';
    nav.appendChild(overlay);
    var parent = menu.parentNode, nextSibling = menu.nextSibling;
    var open = false, animating = false;
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    if (!button.getAttribute('aria-label')) button.setAttribute('aria-label', 'menu');
    button.setAttribute('aria-controls', overlay.id);
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');

    function docHeight() {
      var b = document.body, d = document.documentElement;
      return Math.max(b.scrollHeight, b.offsetHeight, d.clientHeight, d.scrollHeight, d.offsetHeight);
    }
    function openMenu() {
      if (open || animating) return;
      open = true; animating = true;
      button.classList.add('w--open');
      button.setAttribute('aria-expanded', 'true');
      overlay.appendChild(menu);
      menu.setAttribute('data-nav-menu-open', '');
      overlay.style.height = docHeight() + 'px';
      overlay.style.display = 'block';
      nav.querySelectorAll('.w-dropdown-list').forEach(function (l) { l.classList.add('w--nav-dropdown-list-open'); });
      nav.querySelectorAll('.w-dropdown-toggle').forEach(function (t) { t.classList.add('w--nav-dropdown-toggle-open'); });
      nav.querySelectorAll('.w-dropdown').forEach(function (t) { t.classList.add('w--nav-dropdown-open'); });
      nav.querySelectorAll('.w-nav-link').forEach(function (t) { t.classList.add('w--nav-link-open'); });
      document.body.style.overflow = 'hidden';
      document.body.style.top = '0px';
      var offset = menu.offsetHeight + nav.offsetHeight;
      menu.style.transition = 'none';
      menu.style.transform = 'translateY(-' + offset + 'px)';
      reflow(menu);
      var ms = reduced ? 0 : duration;
      menu.style.transition = 'transform ' + ms + 'ms ' + easing;
      menu.style.transform = 'translateY(0px)';
      requestAnimationFrame(function () { menu.classList.add('sos-menu-in'); });
      setTimeout(function () { animating = false; }, ms);
    }
    function closeMenu() {
      if (!open || animating) return;
      open = false; animating = true;
      button.classList.remove('w--open');
      button.setAttribute('aria-expanded', 'false');
      menu.classList.remove('sos-menu-in');
      var offset = menu.offsetHeight + nav.offsetHeight;
      var ms = reduced ? 0 : duration;
      menu.style.transition = 'transform ' + ms + 'ms ' + easing2;
      menu.style.transform = 'translateY(-' + offset + 'px)';
      setTimeout(function () {
        menu.style.transition = '';
        menu.style.transform = '';
        menu.removeAttribute('data-nav-menu-open');
        parent.insertBefore(menu, nextSibling);
        overlay.style.display = 'none';
        overlay.style.height = '';
        nav.querySelectorAll('.w--nav-dropdown-list-open, .w--nav-dropdown-toggle-open, .w--nav-dropdown-open, .w--nav-link-open').forEach(function (t) {
          t.classList.remove('w--nav-dropdown-list-open', 'w--nav-dropdown-toggle-open', 'w--nav-dropdown-open', 'w--nav-link-open');
        });
        document.body.style.overflow = '';
        document.body.style.top = '';
        animating = false;
      }, ms);
    }
    button.addEventListener('click', function () { if (open) closeMenu(); else openMenu(); });
    button.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (open) closeMenu(); else openMenu(); }
      if (e.key === 'Escape' && open) closeMenu();
    });
    // A tap on a real link inside the open menu closes it (Webflow does the same).
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (open && a && !a.classList.contains('w-dropdown-toggle')) closeMenu();
    });
    // The overlay height follows the document; a resize to desktop closes the menu.
    window.addEventListener('resize', function () {
      if (open && isDesktop()) closeMenu();
      else if (open) overlay.style.height = docHeight() + 'px';
    });
  })();

  // ── Yellow button quirk (IX2 a-30 writes the yellow rest state on mouse-out) ──
  document.addEventListener('mouseout', function (e) {
    var btn = e.target.closest && e.target.closest('a.button.reviews');
    if (btn && !btn.contains(e.relatedTarget)) btn.classList.add('sos-hovered');
  });

  // ── Multistep quote forms (IX2 a-34 hero / a-35 CTA) ──
  // Bubble phase on purpose: custom-scripts.js gates this click in the
  // capture phase (policy checkbox) and stops propagation when it fails.
  document.addEventListener('click', function (e) {
    var next = e.target.closest && e.target.closest('.form-step-1 a.is-form-button, .cta-form-step-1 a.is-form-button');
    if (!next) return;
    var form = next.closest('form') || next.closest('.form-steps-w') || document;
    var cta = !!next.closest('.cta-form-step-1');
    var step1 = next.closest(cta ? '.cta-form-step-1' : '.form-step-1');
    var wrap = form.querySelector(cta ? '.cta-form-step-1 .cta-form-input-wrap' : '.form-step-1 .services-hero-form-input-wrap') || step1;
    var step2 = form.querySelector(cta ? '.cta-form-step-2' : '.form-step-2');
    var inputs = step2 && step2.querySelector(cta ? '.cta-move-inputs' : '.services-hero-move-inputs');
    if (!step1 || !step2) return;
    if (next.getAttribute('href') === '#') e.preventDefault();
    if (step1.__sosBusy) return;
    step1.__sosBusy = true;
    if (inputs) inputs.classList.add('sos-step-pre');
    wrap.classList.add('sos-step-out');
    var out = reduced ? 0 : 1000;
    setTimeout(function () {
      step1.classList.add('sos-step-hidden');
      step2.classList.add('sos-step-shown');
      if (inputs) {
        reflow(inputs);
        requestAnimationFrame(function () { inputs.classList.remove('sos-step-pre'); });
      }
      step1.__sosBusy = false;
    }, out);
  });
})();
