(function() {
  'use strict';

  // Organ positions on the body (relative to SVG viewBox 0 0 200 500)
  const ORGAN_POSITIONS = {
    neurology:      { cx: 100, cy: 42,  rx: 28, ry: 24, iconX: 76, iconY: 18, labelY: -5 },
    endocrinology:  { cx: 100, cy: 88,  rx: 14, ry: 10, iconX: 86, iconY: 78, labelY: 0 },
    respiratory:    { cx: 100, cy: 135, rx: 38, ry: 28, iconX: 68, iconY: 107, labelY: 0 },
    cardiology:     { cx: 90,  cy: 145, rx: 18, ry: 16, iconX: 72, iconY: 129, labelY: 0 },
    gi:             { cx: 100, cy: 195, rx: 28, ry: 20, iconX: 72, iconY: 175, labelY: 0 },
    nephrology:     { cx: 100, cy: 220, rx: 24, ry: 14, iconX: 76, iconY: 206, labelY: 0 },
    hematology:     { cx: 100, cy: 260, rx: 30, ry: 16, iconX: 70, iconY: 244, labelY: 0 },
    id:             { cx: 100, cy: 300, rx: 30, ry: 20, iconX: 70, iconY: 280, labelY: 0 }
  };

  let iconCache = {};
  let currentMode = null; // 'theory' or 'practicals'

  // Load SVG icon as text
  async function loadIcon(name) {
    if (iconCache[name]) return iconCache[name];
    try {
      const resp = await fetch(`assets/icons/${name}.svg`);
      const text = await resp.text();
      iconCache[name] = text;
      return text;
    } catch(e) {
      console.warn('Failed to load icon:', name, e);
      return '';
    }
  }

  // Build the interactive body SVG
  async function renderBody(container, mode) {
    currentMode = mode;
    container.innerHTML = '';

    // Create wrapper with perspective for 3D effect
    const wrapper = document.createElement('div');
    wrapper.id = 'body-wrapper';
    wrapper.style.cssText = `
      perspective: 1200px;
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
      position: relative;
    `;

    const inner = document.createElement('div');
    inner.id = 'body-inner';
    inner.style.cssText = `
      transform-style: preserve-3d;
      transition: transform 0.1s ease-out;
      position: relative;
    `;

    // Create the SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 500');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.cssText = 'max-height: 70vh; display: block; margin: 0 auto;';

    // Defs for filters
    const defs = document.createElementNS(svgNS, 'defs');

    // Glow filter for each system
    Object.entries(App.SYSTEMS).forEach(([key, sys]) => {
      const filter = document.createElementNS(svgNS, 'filter');
      filter.setAttribute('id', `glow-${key}`);
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '200%');

      const blur = document.createElementNS(svgNS, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '4');
      blur.setAttribute('result', 'blur');

      const merge = document.createElementNS(svgNS, 'feMerge');
      const m1 = document.createElementNS(svgNS, 'feMergeNode');
      m1.setAttribute('in', 'blur');
      const m2 = document.createElementNS(svgNS, 'feMergeNode');
      m2.setAttribute('in', 'SourceGraphic');
      merge.appendChild(m1);
      merge.appendChild(m2);

      filter.appendChild(blur);
      filter.appendChild(merge);
      defs.appendChild(filter);
    });
    svg.appendChild(defs);

    // Human body outline — anatomical silhouette
    // Head, neck, shoulders, torso, arms, pelvis, legs, feet
    const bodyPath = document.createElementNS(svgNS, 'path');
    bodyPath.setAttribute('d', [
      // Head (cranium)
      'M100 10',
      'C82 10 74 22 74 35',
      'C74 48 82 58 100 58',
      'C118 58 126 48 126 35',
      'C126 22 118 10 100 10 Z',

      // Neck
      'M92 58 L90 70 L110 70 L108 58',

      // Torso + arms (single continuous outline)
      // Left shoulder → left arm
      'M90 70',
      'C72 72 56 76 46 84',
      'L34 100',
      'C28 108 24 118 22 130',
      'L18 160',
      'C16 168 14 176 16 180',
      'L22 180',
      'C24 176 24 168 26 160',
      'L32 132',
      'L38 120',

      // Left torso side
      'L42 140',
      'L40 180',
      'L38 220',
      'L40 250',

      // Left hip → left leg
      'L42 270',
      'C44 290 44 310 44 330',
      'L44 370',
      'L42 410',
      'C40 425 40 435 42 440',
      'L36 455',
      'C34 462 36 468 42 470',
      'L56 470',
      'C60 468 60 462 58 458',
      'L54 440',
      'L56 410',
      'L58 370',
      'L60 330',

      // Crotch
      'L66 290',
      'L76 280',
      'L100 276',
      'L124 280',
      'L134 290',

      // Right leg
      'L140 330',
      'L142 370',
      'L144 410',
      'L146 440',
      'L142 458',
      'C140 462 140 468 144 470',
      'L158 470',
      'C164 468 166 462 164 455',
      'L158 440',
      'C160 435 160 425 158 410',
      'L156 370',
      'L156 330',
      'C156 310 156 290 158 270',

      // Right hip → right torso
      'L160 250',
      'L162 220',
      'L160 180',
      'L158 140',

      // Right arm
      'L162 120',
      'L168 132',
      'L174 160',
      'C176 168 176 176 178 180',
      'L184 180',
      'C186 176 184 168 182 160',
      'L178 130',
      'C176 118 172 108 166 100',
      'L154 84',
      'C144 76 128 72 110 70',

      'Z'
    ].join(' '));
    bodyPath.setAttribute('fill', 'none');
    bodyPath.setAttribute('stroke', 'var(--text-tertiary)');
    bodyPath.setAttribute('stroke-width', '1.2');
    bodyPath.setAttribute('opacity', '0.4');
    bodyPath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(bodyPath);

    // Add organ regions
    for (const [key, pos] of Object.entries(ORGAN_POSITIONS)) {
      const sys = App.SYSTEMS[key];
      if (!sys) continue;

      // Create group for this organ
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('class', 'organ-region');
      g.setAttribute('data-system', key);
      g.style.cursor = 'pointer';

      // Invisible hit area (larger than visual for easy clicking)
      const hitArea = document.createElementNS(svgNS, 'ellipse');
      hitArea.setAttribute('cx', pos.cx);
      hitArea.setAttribute('cy', pos.cy);
      hitArea.setAttribute('rx', pos.rx + 5);
      hitArea.setAttribute('ry', pos.ry + 5);
      hitArea.setAttribute('fill', 'transparent');
      g.appendChild(hitArea);

      // Glow ellipse (visible on hover)
      const glow = document.createElementNS(svgNS, 'ellipse');
      glow.setAttribute('cx', pos.cx);
      glow.setAttribute('cy', pos.cy);
      glow.setAttribute('rx', pos.rx);
      glow.setAttribute('ry', pos.ry);
      glow.setAttribute('fill', sys.color);
      glow.setAttribute('opacity', '0');
      glow.setAttribute('class', 'organ-glow');
      glow.setAttribute('filter', `url(#glow-${key})`);
      g.appendChild(glow);

      // Organ icon (loaded async, placed via foreignObject)
      const fo = document.createElementNS(svgNS, 'foreignObject');
      fo.setAttribute('x', pos.iconX);
      fo.setAttribute('y', pos.iconY);
      fo.setAttribute('width', '48');
      fo.setAttribute('height', '48');
      fo.setAttribute('class', 'organ-icon-fo');

      const iconDiv = document.createElement('div');
      iconDiv.style.cssText = 'width:48px;height:48px;display:flex;align-items:center;justify-content:center;';
      iconDiv.className = 'organ-icon-wrapper';
      iconDiv.setAttribute('data-system', key);

      // Load icon async
      loadIcon(sys.icon).then(svgText => {
        iconDiv.innerHTML = svgText;
        const svgEl = iconDiv.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '40px';
          svgEl.style.height = '40px';
        }
      });

      fo.appendChild(iconDiv);
      g.appendChild(fo);

      // System label
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', pos.cx);
      text.setAttribute('y', pos.cy + pos.ry + 16);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'var(--text-secondary)');
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      text.setAttribute('class', 'organ-label');
      text.textContent = sys.name;
      g.appendChild(text);

      // Hover and click handlers
      g.addEventListener('mouseenter', () => handleOrganHover(key, true));
      g.addEventListener('mouseleave', () => handleOrganHover(key, false));
      g.addEventListener('click', () => handleOrganClick(key));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOrganClick(key);
        }
      });
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `${sys.name} - click to explore topics`);

      svg.appendChild(g);
    }

    inner.appendChild(svg);
    wrapper.appendChild(inner);
    container.appendChild(wrapper);

    // Parallax mouse tracking
    setupParallax(wrapper, inner);

    // Entry animation
    animateBodyEntry(svg);

    // If practicals mode, add breathing animation to organs
    if (mode === 'practicals') {
      startBreathingAnimation();
    }
  }

  function handleOrganHover(systemKey, isEnter) {
    const glow = document.querySelector(`.organ-region[data-system="${systemKey}"] .organ-glow`);
    const icon = document.querySelector(`.organ-icon-wrapper[data-system="${systemKey}"]`);
    const label = document.querySelector(`.organ-region[data-system="${systemKey}"] .organ-label`);

    if (isEnter) {
      gsap.to(glow, { opacity: 0.25, duration: 0.3 });
      gsap.to(icon, { scale: 1.15, duration: 0.3, ease: 'elastic.out(1, 0.7)' });
      if (label) gsap.to(label, { fill: App.SYSTEMS[systemKey]?.color || '#fff', duration: 0.2 });
    } else {
      gsap.to(glow, { opacity: 0, duration: 0.3 });
      gsap.to(icon, { scale: 1, duration: 0.3 });
      if (label) gsap.to(label, { fill: 'var(--text-secondary)', duration: 0.2 });
    }
  }

  function handleOrganClick(systemKey) {
    const mode = App.state.mode || 'theory';

    // Animate the clicked organ expanding
    const region = document.querySelector(`.organ-region[data-system="${systemKey}"]`);
    if (region) {
      gsap.to(region, {
        scale: 1.3,
        opacity: 0.8,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          window.location.hash = `${mode}/${systemKey}`;
        }
      });

      // Fade out other organs
      document.querySelectorAll(`.organ-region:not([data-system="${systemKey}"])`).forEach(el => {
        gsap.to(el, { opacity: 0.2, duration: 0.3 });
      });
    }
  }

  function setupParallax(wrapper, inner) {
    let rafId = null;

    function onMove(e) {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        inner.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 5}deg)`;
        rafId = null;
      });
    }

    function onLeave() {
      gsap.to(inner, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
    }

    // Mouse
    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', onLeave);

    // Touch (simplified - use tilt based on touch position)
    wrapper.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      onMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });
    wrapper.addEventListener('touchend', onLeave);
  }

  function animateBodyEntry(svg) {
    const organs = svg.querySelectorAll('.organ-region');
    gsap.fromTo(organs,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.6, stagger: 0.08, ease: 'elastic.out(1, 0.7)', delay: 0.2 }
    );
  }

  function startBreathingAnimation() {
    const glows = document.querySelectorAll('.organ-glow');
    glows.forEach((glow, i) => {
      gsap.to(glow, {
        opacity: 0.15,
        duration: 2 + Math.random(),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * 0.3
      });
    });
  }

  // ==================== LISTEN FOR VIEW CHANGES ====================
  window.addEventListener('viewchange', function(e) {
    if (e.detail.view === 'body') {
      const container = document.getElementById('interactive-body');
      const titleEl = document.getElementById('body-view-title');
      const subtitleEl = document.getElementById('body-view-subtitle');

      if (titleEl) titleEl.textContent = e.detail.mode === 'theory' ? 'Theory' : 'Clinical Medicine';
      if (subtitleEl) subtitleEl.textContent = 'Select an organ system to explore';

      if (container) {
        renderBody(container, e.detail.mode);
      }
    }
  });

  // Expose for external use
  window.BodyScene = { renderBody };
})();
