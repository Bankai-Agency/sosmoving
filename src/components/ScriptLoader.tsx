'use client';

import { useEffect } from 'react';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Skip if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
}

function loadStyle(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

export default function ScriptLoader() {
  useEffect(() => {
    async function init() {
      try {
        // ── Step 0: Load page config (wf-page ID + correct bundle) ──
        const [pageRes, bundleRes] = await Promise.all([
          fetch('/wf-page-map.json'),
          fetch('/wf-bundle-map.json'),
        ]);
        const pageMap: Record<string, string> = await pageRes.json();
        const bundleMap: Record<string, string> = await bundleRes.json();
        const path = window.location.pathname.replace(/\/$/, '') || '/';

        // Set data-wf-page BEFORE loading Webflow JS (IX2 reads it on init)
        const wfPageId = pageMap[path];
        if (wfPageId) {
          document.documentElement.setAttribute('data-wf-page', wfPageId);
        }

        // ── Step 1: jQuery (everything depends on it) ──
        // Pinned to 3.5.1 to match original Webflow site — 3.7.1 breaks IX2
        // with "t is not a function" error in the animation engine.
        await loadScript('https://code.jquery.com/jquery-3.5.1.min.js');

        // ── Step 2: Webflow chunk files (must load before main bundle) ──
        // Common chunks used by all pages
        await loadScript('/webflow.schunk.f2efb3c5440a81cf.js');
        await loadScript('/webflow.schunk.81d31091c363b462.js');

        // ── Step 3: Page-specific Webflow main bundle ──
        const bundle = bundleMap[path] || 'webflow.8ef64be1.fc9d6e2e8b58a7f8.js';
        // Homepage + gallery need extra chunks
        if (bundle === 'webflow.987c289e.df925483dbcdb1a9.js') {
          await loadScript('/webflow.schunk.f919141e3448519b.js');
          await loadScript('/webflow.schunk.9dfb96661114d3db.js');
        }
        await loadScript('/' + bundle);

        // ── Step 4: GSAP + plugins ──
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
        await Promise.all([
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollToPlugin.min.js'),
        ]);

        // Register GSAP plugins
        if (window.gsap && window.ScrollTrigger && window.ScrollToPlugin) {
          window.gsap.registerPlugin(window.ScrollTrigger, window.ScrollToPlugin);
        }

        // ── Step 5: Extra CSS ──
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.css');
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.css');
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/datepicker/1.0.10/datepicker.min.css');
        loadStyle('https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css');
        loadStyle('https://cdn.jsdelivr.net/gh/Evgeny2723/sos-moving@552da70/style.css');

        // ── Step 6: jQuery plugins (parallel, jQuery already loaded) ──
        await Promise.all([
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/masonry/4.2.2/masonry.pkgd.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@finsweet/attributes-scrolldisable@1/scrolldisable.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery.inputmask/5.0.8/jquery.inputmask.min.js'),
          loadScript('https://cdnjs.cloudflare.com/ajax/libs/datepicker/1.0.10/datepicker.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js'),
        ]);

        // ── Step 7: Custom main script from jsdelivr ──
        // Handles .request-api form submission → MoveBoard CRM
        // (POST api.sosmovingla.net/server/parser/get_lead_parsing).
        // @adaf8ac matches the live old site: adds phone validation and
        // the privacy-policy checkbox check (is-policy).
        await loadScript('https://cdn.jsdelivr.net/gh/Evgeny2723/sos-moving@adaf8ac/script.js');

        // ── Step 8: Custom scripts (exit popup, touchbar, form validation) ──
        await loadScript('/custom-scripts.js');

        console.log('[ScriptLoader] All scripts loaded successfully');
      } catch (error) {
        console.error('[ScriptLoader] Error loading scripts:', error);
      }
    }

    init();
  }, []);

  return null;
}
