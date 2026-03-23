// MDExamPrep App Controller
(function() {
  'use strict';

  // ==================== STATE ====================
  const state = {
    currentView: 'landing',   // landing | theory | practicals
    currentSystem: null,       // cardiology | respiratory | gi | neurology | nephrology | endocrinology | hematology | id
    mode: null,                // theory | practicals
    darkMode: false,
    transitioning: false
  };

  // ==================== SYSTEMS ====================
  const SYSTEMS = {
    cardiology:     { name: 'Cardiology',           color: '#EF4444', icon: 'heart' },
    respiratory:    { name: 'Respiratory',           color: '#0EA5E9', icon: 'lungs' },
    gi:             { name: 'Gastroenterology',      color: '#F59E0B', icon: 'liver' },
    neurology:      { name: 'Neurology',             color: '#8B5CF6', icon: 'brain' },
    nephrology:     { name: 'Nephrology',            color: '#14B8A6', icon: 'kidney' },
    endocrinology:  { name: 'Endocrinology',         color: '#F97316', icon: 'thyroid' },
    hematology:     { name: 'Hematology',            color: '#F43F5E', icon: 'blood-cells' },
    id:             { name: 'Infectious Diseases',   color: '#22C55E', icon: 'bacteria' }
  };

  // ==================== DARK MODE ====================
  function initDarkMode() {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('mdexam-theme');
    if (stored) {
      state.darkMode = stored === 'dark';
    } else {
      state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyDarkMode();
  }

  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('mdexam-theme', state.darkMode ? 'dark' : 'light');
    applyDarkMode();
  }

  function applyDarkMode() {
    document.documentElement.classList.toggle('dark', state.darkMode);
    const btn = document.getElementById('dark-toggle');
    if (btn) btn.textContent = state.darkMode ? '☀' : '☽';
  }

  // ==================== ROUTER ====================
  function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute(); // handle initial route
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    const parts = hash.split('/');
    const view = parts[0];
    const system = parts[1] || null;

    if (state.transitioning) return;

    if (view === 'landing') {
      navigateTo('landing');
    } else if (view === 'theory') {
      state.mode = 'theory';
      if (system && SYSTEMS[system]) {
        navigateTo('system', system);
      } else {
        navigateTo('body');
      }
    } else if (view === 'practicals') {
      state.mode = 'practicals';
      if (system && SYSTEMS[system]) {
        navigateTo('system', system);
      } else {
        navigateTo('body');
      }
    }
  }

  function navigateTo(view, system) {
    // Hide all views
    document.querySelectorAll('.view').forEach(function(v) {
      v.classList.remove('view--active');
    });

    state.currentView = view;
    state.currentSystem = system || null;

    // Show target view
    var target = document.getElementById('view-' + view);
    if (target) {
      target.classList.add('view--active');
    }

    // Update header
    updateHeader();

    // Dispatch custom event for view-specific init
    window.dispatchEvent(new CustomEvent('viewchange', {
      detail: { view: view, system: system, mode: state.mode }
    }));
  }

  // ==================== HEADER ====================
  function updateHeader() {
    var backBtn = document.getElementById('back-btn');
    var breadcrumb = document.getElementById('breadcrumb');

    if (state.currentView === 'landing') {
      if (backBtn) backBtn.style.display = 'none';
      if (breadcrumb) breadcrumb.innerHTML = '';
    } else if (state.currentView === 'body') {
      if (backBtn) backBtn.style.display = 'flex';
      if (breadcrumb) {
        breadcrumb.innerHTML = '<span class="med-breadcrumb__current">' +
          (state.mode === 'theory' ? 'Theory' : 'Clinical Medicine') + '</span>';
      }
    } else if (state.currentView === 'system' && state.currentSystem) {
      if (backBtn) backBtn.style.display = 'flex';
      var sysName = SYSTEMS[state.currentSystem] ? SYSTEMS[state.currentSystem].name : '';
      var modeLabel = state.mode === 'theory' ? 'Theory' : 'Clinical Medicine';
      if (breadcrumb) {
        breadcrumb.innerHTML =
          '<a href="#' + state.mode + '" class="med-breadcrumb__link">' + modeLabel + '</a>' +
          '<span class="med-breadcrumb__separator">/</span>' +
          '<span class="med-breadcrumb__current">' + sysName + '</span>';
      }
    }
  }

  function goBack() {
    if (state.currentView === 'system') {
      window.location.hash = state.mode;
    } else if (state.currentView === 'body') {
      window.location.hash = 'landing';
    } else {
      window.location.hash = 'landing';
    }
  }

  // ==================== PRELOADER ====================
  function hidePreloader() {
    var preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.transition = 'opacity 0.4s ease';
      setTimeout(function() {
        preloader.style.display = 'none';
      }, 400);
    }
  }

  // ==================== INIT ====================
  function init() {
    initDarkMode();

    // Wire up dark mode toggle
    var darkToggle = document.getElementById('dark-toggle');
    if (darkToggle) darkToggle.addEventListener('click', toggleDarkMode);

    // Wire up back button
    var backBtn = document.getElementById('back-btn');
    if (backBtn) backBtn.addEventListener('click', goBack);

    // Hide preloader once page is ready
    hidePreloader();

    // Init router (this triggers the first view)
    initRouter();
  }

  // Expose public API
  window.App = {
    state: state,
    SYSTEMS: SYSTEMS,
    navigateTo: navigateTo,
    goBack: goBack,
    toggleDarkMode: toggleDarkMode,
    init: init
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
