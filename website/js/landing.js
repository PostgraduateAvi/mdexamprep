(function() {
  'use strict';

  // ==================== ENTRY ANIMATION ====================
  function playEntryAnimation() {
    // 1. Split title into characters
    const titleEl = document.getElementById('landing-title');
    const titleText = 'MD Exam Prep';
    titleEl.innerHTML = titleText.split('').map(ch =>
      ch === ' ' ? ' ' : '<span class="char">' + ch + '</span>'
    ).join('');

    const tl = gsap.timeline({ delay: 0.2 });

    // Frame 0-0.3s: Curtain lift - overlay fades out
    tl.to('#entry-overlay', {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: function() {
        var overlay = document.getElementById('entry-overlay');
        if (overlay) overlay.style.display = 'none';
      }
    });

    // Frame 0.3-0.8s: Title characters fade in with stagger
    tl.to('.landing-title .char', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.035,
      ease: 'power3.out',
      startAt: { y: 20, opacity: 0 }
    }, '-=0.1');

    // Frame 0.8-1.2s: Subtitle slides up
    tl.to('#landing-subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      startAt: { y: 15 }
    }, '-=0.2');

    // Frame 1.0-1.6s: Cards scale up with elastic ease
    tl.to('.landing-card', {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      stagger: 0.15,
      ease: 'elastic.out(1, 0.75)',
      startAt: { scale: 0.85 }
    }, '-=0.3');

    // Frame 1.4-2.0s: Footer fades in
    tl.to('#landing-footer', {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.3');

    // After entry animation completes, start continuous animations
    tl.call(function() {
      startBookAnimation();
      startBodyAnimation();
    });

    return tl;
  }

  // ==================== BOOK PAGE-FLIP ANIMATION ====================
  function startBookAnimation() {
    var pages = document.querySelectorAll('.book-3d__page');
    var cover = document.querySelector('.book-3d__cover-front');
    if (!pages.length || !cover) return;

    // Set initial perspective on container
    var book = document.getElementById('book-3d');
    if (book) {
      book.style.transformStyle = 'preserve-3d';
      book.style.perspective = '800px';
    }

    // Set z-index so pages stack correctly
    pages.forEach(function(page, i) {
      page.style.zIndex = i + 1;
    });
    cover.style.zIndex = pages.length + 1;

    // Create a continuous page-flip timeline
    var flipTl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    // First, open the cover
    flipTl.to(cover, {
      rotateY: -160,
      duration: 0.8,
      ease: 'power2.inOut'
    });

    // Then flip each page with stagger
    pages.forEach(function(page) {
      flipTl.to(page, {
        rotateY: -160,
        duration: 0.6,
        ease: 'power2.inOut'
      }, '-=0.2');
    });

    // Pause between open and close
    flipTl.to({}, { duration: 0.5 });

    // Close pages in reverse
    flipTl.to(pages, {
      rotateY: 0,
      duration: 0.4,
      stagger: -0.1,
      ease: 'power2.inOut'
    });

    // Close cover
    flipTl.to(cover, {
      rotateY: 0,
      duration: 0.6,
      ease: 'power2.inOut'
    }, '-=0.2');

    // Small pause before repeating
    flipTl.to({}, { duration: 0.8 });

    // Subtle floating animation on the whole book
    gsap.to('#book-3d', {
      y: -6,
      duration: 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  // ==================== BODY SILHOUETTE ANIMATION ====================
  var SYSTEM_COLORS = {
    neurology: '#8B5CF6',
    cardiology: '#EF4444',
    respiratory: '#0EA5E9',
    gi: '#F59E0B',
    nephrology: '#14B8A6',
    endocrinology: '#F97316',
    hematology: '#F43F5E'
  };
  function getSystemColor(system) {
    return SYSTEM_COLORS[system] || '#fff';
  }

  function startBodyAnimation() {
    var regions = document.querySelectorAll('.body-silhouette__region');
    var labels = document.querySelectorAll('.body-silhouette__label');
    if (!regions.length) return;

    var systems = [
      'neurology',
      'cardiology',
      'respiratory',
      'gi',
      'nephrology',
      'endocrinology',
      'hematology'
    ];
    var currentIndex = 0;

    function highlightNext() {
      // Remove previous highlight
      regions.forEach(function(r) {
        r.classList.remove('body-silhouette__region--active');
        r.style.filter = '';
      });
      labels.forEach(function(l) {
        l.classList.remove('body-silhouette__label--active');
      });

      var system = systems[currentIndex];

      // Highlight current region
      var region = document.querySelector('.body-silhouette__region[data-system="' + system + '"]');
      var label = document.querySelector('.body-silhouette__label[data-system="' + system + '"]');

      if (region) {
        region.classList.add('body-silhouette__region--active');
        region.style.filter = 'drop-shadow(0 0 12px ' + getSystemColor(system) + ')';
      }
      if (label) {
        label.classList.add('body-silhouette__label--active');
        gsap.fromTo(label,
          { opacity: 0, x: 5 },
          { opacity: 1, x: 0, duration: 0.4 }
        );
      }

      currentIndex = (currentIndex + 1) % systems.length;
    }

    // Start cycling with GSAP-managed timing
    function scheduleNext() {
      gsap.delayedCall(1.5, function() {
        highlightNext();
        scheduleNext();
      });
    }
    highlightNext();
    scheduleNext();

    // Subtle float animation on the whole silhouette
    gsap.to('#body-silhouette', {
      y: -5,
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  // ==================== REPLAY ON VIEW RETURN ====================
  window.addEventListener('viewchange', function(e) {
    if (e.detail && e.detail.view === 'landing') {
      gsap.fromTo('.landing-title .char',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.02, ease: 'power2.out' }
      );
      gsap.fromTo('#landing-subtitle',
        { opacity: 0 },
        { opacity: 1, duration: 0.3, delay: 0.1 }
      );
      gsap.fromTo('.landing-card',
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'elastic.out(1, 0.8)', delay: 0.15 }
      );
      gsap.fromTo('#landing-footer',
        { opacity: 0 },
        { opacity: 1, duration: 0.3, delay: 0.3 }
      );
    }
  });

  // ==================== INIT ====================
  function init() {
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        playEntryAnimation();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
