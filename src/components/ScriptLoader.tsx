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
        // ── Step 1: jQuery (everything depends on it) ──
        await loadScript('https://code.jquery.com/jquery-3.7.1.min.js');

        // ── Step 2: Webflow chunk files (must load before main bundles) ──
        await loadScript('/webflow.schunk.f2efb3c5440a81cf.js');
        await loadScript('/webflow.schunk.81d31091c363b462.js');
        // Extra chunks used by some pages (homepage, gallery, free-estimate)
        await loadScript('/webflow.schunk.f919141e3448519b.js');
        await loadScript('/webflow.schunk.9dfb96661114d3db.js');

        // ── Step 3: ALL Webflow main bundles ──
        // Different pages use different bundles. Loading all is safe —
        // webpack chunk system only initializes modules once.
        await loadScript('/webflow.987c289e.df925483dbcdb1a9.js');
        await loadScript('/webflow.8ef64be1.fc9d6e2e8b58a7f8.js');
        await loadScript('/webflow.4c1b5164.e6782c011d2684fd.js');
        await loadScript('/webflow.cf90aa9a.d07593ecc8d89ceb.js');

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
        await loadScript('https://cdn.jsdelivr.net/gh/Evgeny2723/sos-moving@0ad49c3/script.js');

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
