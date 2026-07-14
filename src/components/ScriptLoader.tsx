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
        // All third-party libs live in /vendor (self-hosted): ad-blockers
        // routinely block cdnjs/jsdelivr, and one blocked script used to
        // kill this whole chain — no TOC, dead forms for that visitor.
        await loadScript('/vendor/jquery-3.5.1.min.js');

        // ── Step 2: Webflow chunk files (must load before main bundle) ──
        // Common chunks used by all pages (b2a9fed1 replaced 81d31091
        // after the live-site services redesign; hashes match live).
        await loadScript('/webflow.schunk.f2efb3c5440a81cf.js');
        await loadScript('/webflow.schunk.b2a9fed12100bec1.js');

        // ── Step 3: Page-specific Webflow main bundle ──
        const bundle = bundleMap[path] || 'webflow.8ef64be1.fc9d6e2e8b58a7f8.js';
        // Extra chunks each main bundle needs BEFORE it runs — taken from
        // the live site's <script> lists per page type. Missing chunks fail
        // silently but break bundle modules (e.g. navbar hover dropdowns
        // were dead on /free-estimate while 9dfb9666 wasn't loaded).
        const extraChunks: Record<string, string[]> = {
          'webflow.987c289e.df925483dbcdb1a9.js': ['/webflow.schunk.f919141e3448519b.js'],
          'webflow.4c1b5164.e6782c011d2684fd.js': ['/webflow.schunk.9dfb96661114d3db.js'],
          'webflow.cf90aa9a.d07593ecc8d89ceb.js': [
            '/webflow.schunk.9dfb96661114d3db.js',
            '/webflow.schunk.f919141e3448519b.js',
          ],
        };
        for (const chunk of extraChunks[bundle] ?? []) {
          await loadScript(chunk);
        }
        await loadScript('/' + bundle);

        // ── Step 4: GSAP + plugins ──
        await loadScript('/vendor/gsap.min.js');
        await Promise.all([
          loadScript('/vendor/ScrollTrigger.min.js'),
          loadScript('/vendor/ScrollToPlugin.min.js'),
        ]);

        // Register GSAP plugins
        if (window.gsap && window.ScrollTrigger && window.ScrollToPlugin) {
          window.gsap.registerPlugin(window.ScrollTrigger, window.ScrollToPlugin);
        }

        // ── Step 5: Extra CSS ──
        loadStyle('/vendor/slick.css');
        loadStyle('/vendor/slick-theme.css');
        loadStyle('/vendor/datepicker.min.css');
        loadStyle('/vendor/select2.min.css');
        loadStyle('/sos-main.css');

        // ── Step 6: jQuery plugins (parallel, jQuery already loaded) ──
        await Promise.all([
          loadScript('/vendor/slick.min.js'),
          loadScript('/vendor/masonry.pkgd.min.js'),
          loadScript('/vendor/scrolldisable.js'),
          loadScript('/vendor/jquery.inputmask.min.js'),
          loadScript('/vendor/datepicker.min.js'),
          loadScript('/vendor/select2.min.js'),
        ]);

        // ── Step 6.5: Google Maps Places — the zip/address autocomplete in
        // the quote forms (sos-main.js select2 adapter calls
        // google.maps.places). Same key the old Webflow site shipped in its
        // <head>. Cannot be self-hosted (Google TOS) — non-fatal on purpose:
        // if a blocker kills it, only the address dropdown degrades, the
        // rest of the chain (forms → MoveBoard) must keep working.
        await loadScript(
          'https://maps.googleapis.com/maps/api/js?key=AIzaSyBpG6g21XCE6Kd9cDh6Fb433XaoQVGZP_s&libraries=places',
        ).catch((e) => console.warn('[ScriptLoader] Maps blocked/unavailable:', e));

        // ── Step 7: Main custom script (self-hosted) ──
        // Handles .request-api form submission → MoveBoard CRM
        // (POST api.sosmovingla.net/server/parser/get_lead_parsing), phone
        // validation, privacy-policy checkbox check. Vendored from the
        // public gh/Evgeny2723/sos-moving repo (@adaf8ac) so the site no
        // longer depends on it.
        await loadScript('/sos-main.js');

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
