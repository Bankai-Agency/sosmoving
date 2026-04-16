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
    '/services/long-distance-movers'
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

  // Animate on scroll past hero section
  var heroEl = document.querySelector(".hero-section");
  if (heroEl) {
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-section",
        start: "bottom center",
        toggleActions: "play none none reverse"
      }
    });

    tl.to(".touchbar", {
      y: '0%',
      duration: 0.5,
      ease: 'power2.out'
    })
    .to(".navbar", {
      y: '-100%',
      duration: 0.5,
      ease: 'power2.out'
    }, "<");
  }
})();
