/* ============================================================
   ads-v2.js - the interactions of the v2 ad landing (/ads/la-movers).
   Loaded by the page itself (<script defer> in public/pages/ads__la-movers.html)
   so it works before the site's heavy script chain is in; no jQuery.
     - bottom bar on phones (#cro-bbar): shows once the hero form has
       scrolled past the top, hides when it is back on screen;
     - video reviews (#cro-vbox): a card with data-video opens the mp4 in
       an overlay, Esc / backdrop / the button close it and stop playback;
     - the native date field cannot take a past date.
   The FAQ accordion and the smooth scroll to #quote are the site's own
   (sos-main.js dropdowns, sos-native.js anchors) - not duplicated here.
   ============================================================ */
(function () {
  'use strict';

  // ── Bottom bar (phones, CSS hides it above 767px) ──
  var bar = document.getElementById('cro-bbar');
  if (bar) {
    var heroForm = document.querySelector('.services-hero-form-block');
    if (!heroForm) {
      bar.classList.add('on');
    } else {
      var ticking = false;
      var update = function () {
        ticking = false;
        bar.classList.toggle('on', heroForm.getBoundingClientRect().bottom < 80);
      };
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
      update();
    }
  }

  // ── Video reviews overlay ──
  var box = document.getElementById('cro-vbox');
  var video = box && box.querySelector('video');
  if (box && video) {
    var close = function () {
      video.pause();
      video.removeAttribute('src');
      video.load();
      box.classList.remove('on');
    };
    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('[data-video]');
      if (card) {
        e.preventDefault();
        e.stopPropagation();
        video.src = card.getAttribute('data-video');
        box.classList.add('on');
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        return;
      }
      if (e.target === box || (e.target.closest && e.target.closest('#cro-vbox button'))) close();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('on')) close();
    });
  }

  // ── Move date: today or later ──
  var today = new Date();
  var iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  document.querySelectorAll('input[type="date"][name="field_date"]').forEach(function (el) {
    if (!el.min) el.min = iso;
  });
})();
