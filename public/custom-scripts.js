// ========================================
// custom-scripts.js
// Loaded AFTER all dependencies (jQuery, GSAP, Webflow JS, plugins)
// by ScriptLoader.tsx — do NOT add script loaders here.
// ========================================

// ── Chatbot (desktop only, excludes certain pages) ──
if (window.innerWidth > 991) {
  const excludedPages = [
    '/confirmation-page',
    '/free-estimate',
    '/la-movers',
    '/torrance-movers',
    '/movers-downtown-los-angeles',
    '/long-beach-movers',
    '/santa-clarita-movers',
    '/los-angeles-movers/pasadena-movers',
    '/corona-movers',
    '/hollywoodland-movers',
    '/huntington-beach-movers',
    '/south-bay-movers',
    '/irvine-movers',
    '/los-angeles-movers/santa-monica-movers',
    '/movers-garden-grove',
    '/culver-city-movers',
    '/denver-movers',
    '/claremont-movers',
    '/van-nuys-movers',
    '/studio-city-movers',
    '/orange-county-movers',
    '/placentia-movers',
    '/los-angeles-movers/west-hollywood-movers',
    '/movers-westminster',
    '/marina-del-rey-movers',
    '/fountain-valley-movers',
    '/costa-mesa-movers',
    '/chino-hills-movers',
    '/santa-ana-movers',
    '/los-angeles-movers/glendale-movers',
    '/brea-movers',
    '/tujunga-movers',
    '/simi-valley-movers',
    '/yorba-linda-movers',
    '/beverly-hills-movers',
    '/azusa-movers',
    '/north-hollywood-movers',
    '/anaheim-movers',
    '/eastvale-movers',
    '/newport-beach-movers',
    '/movers-fullerton',
    '/san-fernando-valley-movers',
    '/movers-buena-park',
    '/commerce-movers',
    '/aliso-viejo-movers',
    '/la-crescenta-movers',
    '/san-gabriel-movers',
    '/el-segundo-movers',
    '/movers-hermosa-beach',
    '/alhambra-movers',
    '/covina-movers',
    '/west-covina-movers',
    '/movers-glendora',
    '/montebello-movers',
    '/los-angeles-movers/calabasas-movers',
    '/manhattan-beach-movers',
    '/redondo-beach-movers',
    '/altadena-movers',
    '/malibu-movers',
    '/norwalk-movers',
    '/venice-movers',
    '/chatsworth-movers',
    '/tustin-movers',
    '/canoga-park-movers',
    '/sherman-oaks-movers',
    '/rancho-palos-verdes-movers',
    '/cerritos-movers',
    '/monrovia-movers',
    '/northridge-movers',
    '/la-mirada-movers',
    '/inglewood-movers',
    '/woodland-hills-movers',
    '/carson-movers',
    '/west-los-angeles-movers',
    '/los-feliz-movers',
    '/san-pedro-movers',
    '/movers-highland-park',
    '/el-monte-movers',
    '/movers-hollywood',
    '/los-angeles-movers/burbank-movers',
    '/baldwin-park-movers',
    '/lakewood-movers',
    '/panorama-city-movers',
    '/la-habra-movers',
    '/pomona-movers',
    '/whittier-movers',
    '/la-puente-movers',
    '/reseda-movers',
    '/hawthorne-movers',
    '/movers-pico-rivera',
    '/compton-movers',
    '/downey-movers',
    '/services/packing-services',
    '/services/long-distance-movers',
    '/services/shared-load-moving'
  ];

  if (!excludedPages.includes(window.location.pathname)) {
    let chatbotLoaded = false;

    function loadChatbot() {
      if (chatbotLoaded) return;
      chatbotLoaded = true;

      (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="Jtjw5-cqniYYU2cG-3yVo";script.domain="www.chatbase.co";document.body.appendChild(script)};onLoad()})();
    }

    // Load after 3 seconds or on first interaction
    setTimeout(loadChatbot, 3000);
    ['click', 'scroll', 'touchstart'].forEach(function(event) {
      document.addEventListener(event, loadChatbot, {once: true, passive: true});
    });
  }
}

// ========================================

// ── Passive listeners for INP ──
window.addEventListener('touchstart', function() {}, {passive: true});
window.addEventListener('wheel', function() {}, {passive: true});

// ========================================

// ── Exit Popup ──
if (document.getElementById("exit-popup")) {
  if (window.location.pathname !== '/confirmation-page') {
    let hasShownPopup = false;
    const ONE_HOUR = 60 * 60 * 1000;
    const STORAGE_KEY = "exitPopupShownAt";

    function showPopup() {
      if (!hasShownPopup) {
        const popupElement = document.getElementById("exit-popup");
        if (popupElement) {
          popupElement.style.display = "flex";
        }
        hasShownPopup = true;
        localStorage.setItem(STORAGE_KEY, Date.now());
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    }

    function shouldShowPopupAgain() {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (!lastShown) return true;
      return Date.now() - parseInt(lastShown, 10) > ONE_HOUR;
    }

    function isMobileOrTablet() {
      const isTouchDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 991;
      return isTouchDevice || isSmallScreen;
    }

    function isFromCPC() {
      const params = new URLSearchParams(window.location.search);
      return params.get('utm_medium') === 'cpc' || params.has('gclid');
    }

    const handleMouseLeave = (e) => {
      if (e.clientY < 10) {
        showPopup();
      }
    };

    if (shouldShowPopupAgain()) {
      const isMobile = isMobileOrTablet();
      const fromCPC = isFromCPC();
      if (isMobile && fromCPC) {
        // Do nothing for mobile CPC users
      } else if (isMobile) {
        setTimeout(showPopup, 45000);
      } else {
        setTimeout(function() {
          document.addEventListener("mouseleave", handleMouseLeave);
        }, 20000);
      }
    }

    const closeButton = document.getElementById("close-popup");
    if (closeButton) {
      closeButton.addEventListener("click", function () {
        document.getElementById("exit-popup").style.display = "none";
      });
    }
  }
}

// ========================================

// ── Form Validation ──
(function() {
  var forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(event) {
      var formIsValid = true;
      var requiredInputs = form.querySelectorAll('[required]');
      requiredInputs.forEach(function(input) {
        if (input.value.trim() === '') {
          formIsValid = false;
        }
      });
      if (!formIsValid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var firstEmptyInput = form.querySelector('[required]:invalid');
        if (firstEmptyInput) {
          firstEmptyInput.reportValidity();
        }
        return false;
      }
    });
  });
})();

// ========================================

// ── Touchbar + Navbar scroll animation (GSAP) ──
(function() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('[custom-scripts] GSAP not available, skipping touchbar animation');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Hide touchbar below viewport initially
  gsap.set(".touchbar", { y: '100%' });

  // Touchbar: как в оригинале — выезжает после прохождения hero
  var heroEl = document.querySelector(".hero-section");
  if (heroEl) {
    gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-section",
        start: "bottom center",
        toggleActions: "play none none reverse"
      }
    }).to(".touchbar", { y: '0%', duration: 0.5, ease: 'power2.out' });
  }

  // Navbar: прячется при скролле вниз, возвращается при ЛЮБОМ скролле
  // вверх (на старом сайте возвращался только у самого верха страницы —
  // осознанное UX-улучшение, не паритет).
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var threshold = function () {
      return heroEl
        ? Math.max(heroEl.offsetTop + heroEl.offsetHeight - window.innerHeight / 2, 120)
        : 200;
    };
    var lastY = window.scrollY;
    var shown = true;
    var setShown = function (v) {
      if (shown === v) return;
      shown = v;
      gsap.to(navbar, { y: v ? '0%' : '-100%', duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y <= threshold()) setShown(true);
        else if (y < lastY - 2) setShown(true);   // скролл вверх
        else if (y > lastY + 2) setShown(false);  // скролл вниз
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }
})();

// ── Vidzflow facade hydration ──
// Server-side (src/lib/page-sections.ts) replaces <iframe src="vidzflow..."> with
// <div class="vidzflow-facade" data-src="..."> so the ~9MB video doesn't block
// LCP. Once the page is fully loaded + idle, we swap the facade back to a real
// iframe — user sees the video within ~1-2s after page load, not during it.
(function () {
  function hydrateVidzflowFacades() {
    var facades = document.querySelectorAll('.vidzflow-facade[data-src]');
    if (!facades.length) return;
    facades.forEach(function (el) {
      var iframe = document.createElement('iframe');
      iframe.src = el.dataset.src;
      iframe.setAttribute('width', '100%');
      iframe.setAttribute('height', '100%');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('allow', 'fullscreen');
      if (el.dataset.title) iframe.title = el.dataset.title;
      iframe.style.cssText = 'overflow:hidden;width:100%;height:100%;border:0;';
      el.replaceWith(iframe);
    });
  }
  function schedule() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(hydrateVidzflowFacades, { timeout: 2000 });
    } else {
      setTimeout(hydrateVidzflowFacades, 1200);
    }
  }
  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule);
  }
})();

// ========================================

// ── Lead attribution (first touch + last touch) ──
// The lead form sends no source at all, so every website lead reaches
// MoveBoard with an empty "Source type" — the n/a bucket, ~200 leads a
// month converting at 2%. This module works out where the visitor came
// from and hands the result to the /api/lead dual-write below.
//
// It deliberately does NOT touch the MoveBoard payload: which extra fields
// that endpoint accepts is still an open question with the vendor. Once
// they answer, the CRM side reads the same window.sosAttribution().
//
// First touch is what matters here — a move is chosen over weeks, so
// someone who arrives on an ad and comes back directly a fortnight later
// must still be credited to Google Ads. Both touches are kept in a
// first-party cookie for 90 days.
//
// GBP/maps traffic (the profile link is tagged utm_campaign=gmb) is folded
// into SEO on purpose: the same people run the profile and the organic
// side. The raw utm_campaign still travels with the lead, so the two can
// be pulled apart in reporting whenever that becomes useful.
(function() {
  var COOKIE = 'sos_attr';
  var MAX_AGE = 60 * 60 * 24 * 90; // 90 days
  var LIMIT = 200;                 // per-value cap, keeps the cookie small

  function hostOf(url) {
    try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
  }

  function isOwn(host) {
    return host === window.location.hostname ||
           host === 'sosmovingla.net' ||
           host === 'www.sosmovingla.net' ||
           host === 'secure.sosmovingla.net';
  }

  function trim(v) {
    return v ? String(v).slice(0, LIMIT) : '';
  }

  // Where this particular pageview came from.
  function readTouch() {
    var qs = null;
    try { qs = new URLSearchParams(window.location.search); } catch {}
    var q = function(key) { return qs ? trim(qs.get(key)) : ''; };

    var touch = {
      gclid: q('gclid') || q('gbraid') || q('wbraid'),
      msclkid: q('msclkid'),
      fbclid: q('fbclid'),
      utm_source: q('utm_source'),
      utm_medium: q('utm_medium'),
      utm_campaign: q('utm_campaign'),
      utm_term: q('utm_term'),
      utm_content: q('utm_content'),
      referrer: trim(document.referrer),
      landing_page: trim(window.location.href),
      ts: new Date().toISOString()
    };
    touch.channel = classify(touch);
    return touch;
  }

  // Order matters: paid click ids beat utm tags, utm tags beat the referrer.
  function classify(t) {
    var ref = hostOf(t.referrer);
    var src = t.utm_source.toLowerCase();
    var med = t.utm_medium.toLowerCase();
    var camp = t.utm_campaign.toLowerCase();

    if (t.gclid || med === 'cpc' || med === 'ppc' || med === 'paid') return 'Google Ads';
    if (t.msclkid) return 'Bing Ads';
    // The Google Business Profile link is tagged utm_campaign=gmb.
    if (camp === 'gmb') return 'Web SEO';
    if (t.fbclid || ref.indexOf('facebook.') !== -1 || ref.indexOf('instagram.') !== -1) return 'Web Facebook/Instagram';
    if (ref.indexOf('yelp.') !== -1 || src.indexOf('yelp') !== -1) return 'Web Yelp';
    if (ref.indexOf('chatgpt.com') !== -1 || ref.indexOf('openai.com') !== -1 || src.indexOf('chatgpt') !== -1) return 'Web ChatGPT';
    if (ref.indexOf('perplexity.') !== -1 || ref.indexOf('claude.ai') !== -1 ||
        ref.indexOf('gemini.google') !== -1 || ref.indexOf('copilot.microsoft') !== -1) return 'Web AI assistant';
    if (ref.indexOf('reddit.') !== -1) return 'Web Reddit';
    if (ref.indexOf('google.') !== -1) return 'Web SEO';
    if (ref.indexOf('bing.') !== -1 || ref.indexOf('duckduckgo.') !== -1 ||
        ref.indexOf('search.yahoo') !== -1 || ref.indexOf('ecosia.') !== -1) return 'Web SEO';
    if (ref && !isOwn(ref)) return 'Web Referral';
    return 'Web Direct';
  }

  // Internal navigation carries no new information — it must not overwrite
  // the touch that actually brought the visitor here.
  function isNewSource(t) {
    if (t.gclid || t.msclkid || t.fbclid) return true;
    if (t.utm_source || t.utm_medium || t.utm_campaign) return true;
    var ref = hostOf(t.referrer);
    return !!ref && !isOwn(ref);
  }

  function readCookie() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)sos_attr=([^;]*)/);
      return m ? JSON.parse(decodeURIComponent(m[1])) : null;
    } catch { return null; }
  }

  function writeCookie(data) {
    try {
      document.cookie = COOKIE + '=' + encodeURIComponent(JSON.stringify(data)) +
        ';path=/;max-age=' + MAX_AGE + ';SameSite=Lax' +
        (window.location.protocol === 'https:' ? ';Secure' : '');
    } catch {}
  }

  var stored = readCookie() || {};
  var current = readTouch();

  if (!stored.first || isNewSource(current)) {
    if (!stored.first) stored.first = current;
    if (isNewSource(current)) stored.last = current;
    writeCookie(stored);
  }

  // Flat string map — easy to drop into a form payload or a CRM field.
  window.sosAttribution = function() {
    var s = readCookie() || {};
    var first = s.first || current;
    var last = s.last || first;
    var channel = first.channel || '';
    var gclid = first.gclid || last.gclid || '';

    // An ad click anywhere in the 90-day window wins the label: that is the
    // touch we can report a closed job back to Google Ads against.
    if (gclid && channel !== 'Google Ads') channel = 'Google Ads';

    return {
      channel: channel,
      channel_first: first.channel || '',
      channel_last: last.channel || '',
      gclid: gclid,
      msclkid: first.msclkid || last.msclkid || '',
      fbclid: first.fbclid || last.fbclid || '',
      utm_source: first.utm_source || last.utm_source || '',
      utm_medium: first.utm_medium || last.utm_medium || '',
      utm_campaign: first.utm_campaign || last.utm_campaign || '',
      utm_term: first.utm_term || last.utm_term || '',
      utm_content: first.utm_content || last.utm_content || '',
      referrer: first.referrer || '',
      landing_page: first.landing_page || '',
      first_seen: first.ts || '',
      last_seen: last.ts || '',
      submit_page: trim(window.location.href)
    };
  };
})();

// ========================================

// ── Lead dual-write / takeover ──
// Primary lead path: /sos-main.js (self-hosted) intercepts .request-api forms
// and POSTs them to MoveBoard CRM (api.sosmovingla.net). In 'dual' mode
// every submission is ALSO beaconed to our /api/lead as a redundant
// backup trail. 'takeover' mode BYPASSES the CRM (we preventDefault, post
// to /api/lead, redirect ourselves) — emergency use only, e.g. if the
// MoveBoard API is down.
(function() {
  var LEAD_MODE = 'dual'; // 'dual' | 'takeover'
  var ENDPOINT = '/api/lead';

  function serialize(form) {
    var fields = {};
    var fd = new FormData(form);
    fd.forEach(function(value, key) {
      if (typeof value === 'string' && value.trim() !== '') fields[key] = value;
    });
    return {
      formName: (form.getAttribute('data-name') || form.getAttribute('name') || form.id || 'form').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      page: window.location.pathname,
      fields: fields,
      attribution: typeof window.sosAttribution === 'function' ? window.sosAttribution() : null
    };
  }

  function track(payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'lead_submit',
      formName: payload.formName,
      page: payload.page,
      lead_channel: payload.attribution ? payload.attribution.channel : ''
    });
  }

  // Capture phase — runs before Webflow's bubble-phase jQuery handlers.
  document.addEventListener('submit', function(event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    // Only Webflow lead forms (both live inside .w-form wrappers)
    if (!form.closest('.w-form')) return;
    if (!form.checkValidity()) return; // let native/Webflow validation run

    // Spam trap — the dedicated honeypot handler below fakes success;
    // don't beacon or track these.
    var trap = form.querySelector('[name="contact_preference"]');
    if (trap && trap.value !== '') return;

    var payload = serialize(form);
    if (Object.keys(payload.fields).length === 0) return;

    if (LEAD_MODE === 'takeover') {
      event.preventDefault();
      event.stopImmediatePropagation();
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
      track(payload);
      window.location.href = form.getAttribute('data-redirect') || '/confirmation-page';
      return;
    }

    // dual: don't interfere with Webflow submission; sendBeacon survives
    // the redirect to /confirmation-page.
    var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob))) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
    track(payload);
  }, true);
})();

// ========================================

// ── Video Reviews player (/about-us/video-reviews) ──
// Ported from the live page's inline w-script embed (the page scraper
// strips <script> tags, which left the <video> grid without play logic).
// custom-scripts.js loads after DOMContentLoaded, so run immediately.
(function() {
  if (!document.querySelector('.reviews-video-wrapper')) return;

  var isDragging = false;
  document.body.addEventListener('mousedown', function() { isDragging = false; });
  document.body.addEventListener('mousemove', function() { isDragging = true; });

  document.body.addEventListener('click', function(event) {
    if (isDragging) return;
    var container = event.target.closest('.reviews-video-wrapper');
    if (container) handleVideoPlay(container);
  });

  function handleVideoPlay(clickedContainer) {
    var videoToPlay = clickedContainer.querySelector('video.reviews-video');
    var playButton = clickedContainer.querySelector('.review-video-play-btn');
    if (!videoToPlay || !playButton) return;

    if (videoToPlay.paused) {
      document.querySelectorAll('video.reviews-video').forEach(function(otherVideo) {
        if (otherVideo !== videoToPlay && !otherVideo.paused) {
          otherVideo.pause();
          var otherContainer = otherVideo.closest('.reviews-video-wrapper');
          var otherPlayButton = otherContainer && otherContainer.querySelector('.review-video-play-btn');
          if (otherPlayButton) otherPlayButton.classList.remove('is-hidden');
        }
      });
      videoToPlay.play();
      playButton.classList.add('is-hidden');
    } else {
      videoToPlay.pause();
      playButton.classList.remove('is-hidden');
    }
  }
})();

// ========================================

// ── Multistep form: gate step 1 on the policy checkbox ──
// The step-1 "Next" control is an <a href="#">. sos-main.js validates the
// .is-policy checkbox only on final submit — but by then step 1 (with the
// checkbox) is hidden, its offset() is 0, and the "scroll to the error"
// animation jumps to the top of the page instead. Block advancing to
// step 2 until the checkbox is ticked and show the error next to it,
// while it is still visible.
(function() {
  document.addEventListener('click', function(event) {
    var next = event.target.closest('.form-step-1 a.is-form-button');
    if (!next) return;
    var form = next.closest('form');
    if (!form) return;
    var checkbox = form.querySelector('.form-step-1 input.is-policy');
    if (!checkbox || checkbox.checked) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    var wrapper = checkbox.closest('label, .w-checkbox') || checkbox;
    wrapper.classList.add('is-error');
    if (wrapper.scrollIntoView) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    checkbox.addEventListener('change', function onFix() {
      wrapper.classList.remove('is-error');
      checkbox.removeEventListener('change', onFix);
    });
  }, true);
})();

// ========================================

// ── Honeypot ──
// An invisible text field is injected into every Webflow form. Humans
// never see it; dumb bots fill everything. A submission with the trap
// filled is silently "accepted" (redirect to the usual thank-you page)
// but never reaches MoveBoard or the e-mail backup — only a HONEYPOT
// log entry in /api/lead so we can monitor for false positives.
(function() {
  var NAME = 'contact_preference';

  document.querySelectorAll('.w-form form').forEach(function(form) {
    if (form.querySelector('[name="' + NAME + '"]')) return;
    var input = document.createElement('input');
    input.type = 'text';
    input.name = NAME;
    input.tabIndex = -1;
    input.autocomplete = 'off';
    input.setAttribute('aria-hidden', 'true');
    input.style.cssText =
      'position:absolute!important;left:-9999px!important;top:auto!important;' +
      'width:1px;height:1px;opacity:0;pointer-events:none;';
    form.appendChild(input);
  });

  document.addEventListener('submit', function(event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    var trap = form.querySelector('[name="' + NAME + '"]');
    if (!trap || trap.value === '') return;

    event.preventDefault();
    event.stopImmediatePropagation(); // sos-main/webflow handlers never run

    try {
      var blob = new Blob(
        [JSON.stringify({
          formName: 'HONEYPOT',
          page: window.location.pathname,
          fields: { trap: String(trap.value).slice(0, 200) }
        })],
        { type: 'application/json' }
      );
      navigator.sendBeacon && navigator.sendBeacon('/api/lead', blob);
    } catch (e) { /* ignore */ }

    window.location.href = form.getAttribute('data-redirect') || '/confirmation-page';
  }, true);
})();

// ========================================

// ── Homepage About-C marquee (IX2 fallback) ──
// Webflow defines this as a PAGE_FINISH loop (action list a-16 "About C
// Animation": left track 100%→0, right track 0→100, 10s per pass,
// linear, seamless snap-back thanks to the cloned image blocks). In our
// hydrated setup that IX2 event never spawns instances, so the tracks
// froze. Reproduce the exact spec with GSAP; if IX2 ever starts driving
// the tracks itself, we detect movement and stay out of the way.
(function () {
  // 1. Самосборка клонов (все страницы с секцией About-C).
  // Бесшовность ленты держится на том, что clone-top и clone-bottom —
  // точные копии center-блока. Синхронизируем их на каждой загрузке:
  // фото добавляются/удаляются ТОЛЬКО в .about-c-images-center, копии
  // соберутся сами и лента не разойдётся на стыке.
  document.querySelectorAll('.about-c-images-track').forEach(function (track) {
    var center = track.querySelector('.about-c-images-center');
    var top = track.querySelector('.about-c-images-clone-top');
    var bottom = track.querySelector('.about-c-images-clone-bottom');
    if (!center) return;
    if (top) top.innerHTML = center.innerHTML;
    if (bottom) bottom.innerHTML = center.innerHTML;
  });

  // 2. Маркиза (IX2-фолбэк) - процентная, поэтому не зависит от
  // количества фото: один проход ленты всегда 10s, как в оригинале.
  // Не только главная: IX2 диспатчит PAGE_FINISH по window.load, а наш
  // ScriptLoader грузит вебфлоу-бандл асинхронно после гидрации. Если
  // load успел раньше бандла (localhost, быстрый кэшированный повтор),
  // событие пропадает и ленты замирают на любой из ~135 страниц
  // с секцией. Поэтому решение по каждому треку отдельно: двигается -
  // IX2 победил гонку, не трогаем.
  function start() {
    if (typeof gsap === 'undefined') return;
    // Крутим только треки с клонами (структура бесшовной ленты).
    // Коллажи-стопки без .about-c-images-center на тех же классах
    // is-left/right-track статичны и в оригинале - их не трогаем.
    var tracks = [];
    document.querySelectorAll(
      '.about-c-images-track.is-left-track, .about-c-images-track.is-right-track'
    ).forEach(function (t) {
      if (t.querySelector('.about-c-images-center')) tracks.push(t);
    });
    if (!tracks.length) return;
    // Детект по инлайновому transform: IX2 пишет туда каждый кадр,
    // а догрузка фото меняет только computed-пиксели (процент от
    // выросшей высоты) - на инлайне ложных срабатываний нет.
    var before = tracks.map(function (t) { return t.style.transform; });
    setTimeout(function () {
      tracks.forEach(function (t, i) {
        if (t.style.transform !== before[i]) return; // IX2 работает сам
        if (t.classList.contains('is-left-track')) {
          gsap.fromTo(t, { yPercent: 100 }, { yPercent: 0, duration: 10, ease: 'none', repeat: -1 });
        } else {
          gsap.fromTo(t, { yPercent: 0 }, { yPercent: 100, duration: 10, ease: 'none', repeat: -1 });
        }
      });
    }, 2000);
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();

// ========================================

// ── Gallery lightbox (/about-us/gallery) ──
// The Webflow lightbox never fires here: its per-link JSON configs
// (<script class="w-json">) were stripped when the pages were scraped,
// leaving the .w-lightbox anchors as dead href="#" links. (On the old
// site the photo configs pointed at leftover TEMPLATE stock images
// anyway — rebuilding beats restoring.) Photos open the actual displayed
// images, video cards open their YouTube embeds; both groups get
// prev/next arrows, a counter, keyboard (Esc/←/→) and swipe.
(function () {
  // The YouTube ids lived only in the stripped w-json. Keyed by slide
  // title because slick clones the video slides — DOM index is unstable.
  var VIDEO_IDS = {
    'SOS Commercial': 'K8ipQ81G8lg',
    'SOS Moving TOP-10 Moving Company in Los Angeles': 'dQriI7gJR2Y',
    'SOS Commercial with Vivi Castrillon': 'ghzS1cCBruY',
    'SOS Commercial with Tawny Jordan': '5m4c8EoGzT8'
  };

  var overlay, stage, counterEl, captionEl, prevBtn, nextBtn, closeBtn;
  var items = [], index = 0, lastFocus = null, touchX = null;

  function build() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'sos-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Gallery lightbox');
    overlay.innerHTML =
      '<button type="button" class="sos-lightbox-close" aria-label="Close gallery">✕</button>' +
      '<button type="button" class="sos-lightbox-arrow is-prev" aria-label="Previous item">‹</button>' +
      '<div class="sos-lightbox-stage"></div>' +
      '<button type="button" class="sos-lightbox-arrow is-next" aria-label="Next item">›</button>' +
      '<div class="sos-lightbox-meta"><div class="sos-lightbox-caption"></div>' +
      '<div class="sos-lightbox-counter"></div></div>';
    document.body.appendChild(overlay);

    stage = overlay.querySelector('.sos-lightbox-stage');
    counterEl = overlay.querySelector('.sos-lightbox-counter');
    captionEl = overlay.querySelector('.sos-lightbox-caption');
    prevBtn = overlay.querySelector('.is-prev');
    nextBtn = overlay.querySelector('.is-next');
    closeBtn = overlay.querySelector('.sos-lightbox-close');

    prevBtn.addEventListener('click', function () { show(index - 1); });
    nextBtn.addEventListener('click', function () { show(index + 1); });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      // Backdrop click closes; clicks on the media/buttons don't.
      if (e.target === overlay || e.target === stage) close();
    });
    overlay.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });
    overlay.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) < 40) return;
      show(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowLeft') { show(index - 1); return; }
    if (e.key === 'ArrowRight') { show(index + 1); return; }
    if (e.key === 'Tab') {
      // Keep focus inside the dialog: cycle through its buttons.
      var focusables = [closeBtn, prevBtn, nextBtn].filter(function (b) {
        return b.offsetParent !== null;
      });
      var i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      var next = i + (e.shiftKey ? -1 : 1);
      focusables[(next + focusables.length) % focusables.length].focus();
    }
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var item = items[index];
    stage.innerHTML = '';
    if (item.type === 'video') {
      var frame = document.createElement('iframe');
      frame.className = 'sos-lightbox-frame';
      frame.src = 'https://www.youtube.com/embed/' + item.id + '?autoplay=1&rel=0';
      frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      frame.setAttribute('allowfullscreen', '');
      frame.title = item.title;
      stage.appendChild(frame);
    } else {
      var img = document.createElement('img');
      img.className = 'sos-lightbox-img';
      img.src = item.src;
      img.alt = item.alt || 'Gallery photo';
      stage.appendChild(img);
      // Warm up the neighbours so arrows feel instant.
      [index + 1, index - 1].forEach(function (n) {
        var near = items[(n + items.length) % items.length];
        if (near.type !== 'video') new Image().src = near.src;
      });
    }
    captionEl.textContent = item.title || '';
    counterEl.textContent = (index + 1) + ' / ' + items.length;
    var single = items.length < 2;
    prevBtn.style.display = single ? 'none' : '';
    nextBtn.style.display = single ? 'none' : '';
  }

  function open(list, start) {
    build();
    items = list;
    lastFocus = document.activeElement;
    document.body.classList.add('sos-lightbox-lock');
    overlay.classList.add('is-open');
    document.addEventListener('keydown', onKeydown);
    show(start);
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    stage.innerHTML = ''; // drop the iframe → stops YouTube playback
    document.body.classList.remove('sos-lightbox-lock');
    document.removeEventListener('keydown', onKeydown);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var photo = e.target.closest('a.gallery-photo-lightbox');
    var video = photo ? null : e.target.closest('a.gallery-video-lightbox');
    if (!photo && !video) return;
    e.preventDefault();

    if (photo) {
      var anchors = Array.prototype.slice.call(
        document.querySelectorAll('a.gallery-photo-lightbox')
      );
      var list = anchors.map(function (a) {
        var img = a.querySelector('img');
        return { type: 'image', src: img.currentSrc || img.src, alt: img.alt };
      });
      open(list, anchors.indexOf(photo));
      return;
    }

    // Videos: dedupe by title — slick clones every slide for the loop.
    var seen = {};
    var list = [];
    document.querySelectorAll('a.gallery-video-lightbox').forEach(function (a) {
      var titleEl = a.querySelector('.gallery-video-title');
      var title = titleEl ? titleEl.textContent.trim() : '';
      if (!VIDEO_IDS[title] || seen[title]) return;
      seen[title] = true;
      list.push({ type: 'video', id: VIDEO_IDS[title], title: title });
    });
    var clickedEl = video.querySelector('.gallery-video-title');
    var clicked = clickedEl ? clickedEl.textContent.trim() : '';
    var start = 0;
    list.forEach(function (item, i) { if (item.title === clicked) start = i; });
    if (!list.length) return;
    open(list, start);
  });
})();
