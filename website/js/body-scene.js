// Interactive SVG Body Scene — Theory + Practicals
(function() {
  'use strict';

  var iconCache = {};

  // System colors (duplicated here to avoid dependency timing issues)
  var SYS_COLORS = {
    cardiology: '#EF4444', respiratory: '#0EA5E9', gi: '#F59E0B',
    neurology: '#8B5CF6', nephrology: '#14B8A6', endocrinology: '#F97316',
    hematology: '#F43F5E', id: '#22C55E'
  };

  var SYS_NAMES = {
    cardiology: 'Cardiology', respiratory: 'Respiratory', gi: 'Gastroenterology',
    neurology: 'Neurology', nephrology: 'Nephrology', endocrinology: 'Endocrinology',
    hematology: 'Hematology', id: 'Infectious Diseases'
  };

  // Organ positions — arranged around a central body silhouette
  // The body SVG viewBox is 300 x 520. Organs are placed at anatomical positions
  // with labels offset to left or right to avoid overlap
  var ORGANS = [
    { key: 'neurology',     cx: 150, cy: 45,  r: 24, labelSide: 'right', labelText: 'Neurology' },
    { key: 'endocrinology', cx: 150, cy: 100, r: 16, labelSide: 'left',  labelText: 'Endocrinology' },
    { key: 'respiratory',   cx: 150, cy: 155, r: 28, labelSide: 'right', labelText: 'Respiratory' },
    { key: 'cardiology',    cx: 135, cy: 170, r: 18, labelSide: 'left',  labelText: 'Cardiology' },
    { key: 'gi',            cx: 150, cy: 225, r: 22, labelSide: 'right', labelText: 'Gastroenterology' },
    { key: 'nephrology',    cx: 150, cy: 265, r: 18, labelSide: 'left',  labelText: 'Nephrology' },
    { key: 'hematology',    cx: 150, cy: 310, r: 20, labelSide: 'right', labelText: 'Hematology' },
    { key: 'id',            cx: 150, cy: 360, r: 20, labelSide: 'left',  labelText: 'Infectious Diseases' }
  ];

  // Load SVG icon as text (cached)
  function loadIcon(name) {
    if (iconCache[name]) return Promise.resolve(iconCache[name]);
    return fetch('assets/icons/' + name + '.svg')
      .then(function(r) { return r.text(); })
      .then(function(text) { iconCache[name] = text; return text; })
      .catch(function() { return ''; });
  }

  // Build the full interactive body
  function renderBody(container, mode) {
    container.innerHTML = '';

    // Wrapper with perspective
    var wrapper = document.createElement('div');
    wrapper.id = 'body-wrapper';
    wrapper.style.cssText = 'perspective:1200px;width:100%;max-width:500px;margin:0 auto;position:relative;';

    var inner = document.createElement('div');
    inner.id = 'body-inner';
    inner.style.cssText = 'transform-style:preserve-3d;transition:transform 0.15s ease-out;position:relative;';

    // Create SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 300 520');
    svg.setAttribute('width', '100%');
    svg.style.cssText = 'max-height:72vh;display:block;margin:0 auto;overflow:visible;';

    // --- Defs: glow filters ---
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    ORGANS.forEach(function(org) {
      var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'glow-' + org.key);
      filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
      var blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('stdDeviation', '6'); blur.setAttribute('result', 'blur');
      var merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
      var mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      mn1.setAttribute('in', 'blur');
      var mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      mn2.setAttribute('in', 'SourceGraphic');
      merge.appendChild(mn1); merge.appendChild(mn2);
      filter.appendChild(blur); filter.appendChild(merge);
      defs.appendChild(filter);
    });
    svg.appendChild(defs);

    // --- Body silhouette (separate elements for head, neck, torso, arms, legs) ---
    var bodyGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    bodyGroup.setAttribute('opacity', '0.3');
    bodyGroup.setAttribute('fill', 'none');
    bodyGroup.setAttribute('stroke', 'var(--text-tertiary)');
    bodyGroup.setAttribute('stroke-width', '1.5');
    bodyGroup.setAttribute('stroke-linejoin', 'round');
    bodyGroup.setAttribute('stroke-linecap', 'round');

    // Head
    var head = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    head.setAttribute('cx', '150'); head.setAttribute('cy', '40');
    head.setAttribute('rx', '22'); head.setAttribute('ry', '26');
    bodyGroup.appendChild(head);

    // Neck
    var neck = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    neck.setAttribute('d', 'M140 64 L138 80 L162 80 L160 64');
    bodyGroup.appendChild(neck);

    // Torso
    var torso = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    torso.setAttribute('d', 'M138 80 C120 82 100 90 90 100 L82 120 L80 160 L78 200 L80 240 L84 280 C88 295 100 300 120 305 L150 310 L180 305 C200 300 212 295 216 280 L220 240 L222 200 L220 160 L218 120 L210 100 C200 90 180 82 162 80');
    bodyGroup.appendChild(torso);

    // Left arm
    var lArm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lArm.setAttribute('d', 'M90 100 C78 108 68 120 60 140 L50 170 L42 200 C38 212 36 220 38 226 L44 228 C48 222 50 212 54 200 L62 172 L72 148');
    bodyGroup.appendChild(lArm);

    // Right arm
    var rArm = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rArm.setAttribute('d', 'M210 100 C222 108 232 120 240 140 L250 170 L258 200 C262 212 264 220 262 226 L256 228 C252 222 250 212 246 200 L238 172 L228 148');
    bodyGroup.appendChild(rArm);

    // Left leg
    var lLeg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lLeg.setAttribute('d', 'M120 305 L116 340 L112 380 L108 420 L106 450 C104 462 102 470 104 478 L98 490 C96 496 100 500 106 500 L118 500 C122 498 122 494 120 490 L116 478 L118 450 L120 420 L124 380 L128 340 L132 310');
    bodyGroup.appendChild(lLeg);

    // Right leg
    var rLeg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    rLeg.setAttribute('d', 'M180 305 L184 340 L188 380 L192 420 L194 450 C196 462 198 470 196 478 L202 490 C204 496 200 500 194 500 L182 500 C178 498 178 494 180 490 L184 478 L182 450 L180 420 L176 380 L172 340 L168 310');
    bodyGroup.appendChild(rLeg);

    svg.appendChild(bodyGroup);

    // --- Organ interactive regions ---
    ORGANS.forEach(function(org, idx) {
      var color = SYS_COLORS[org.key];
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'organ-region');
      g.setAttribute('data-system', org.key);
      g.style.cursor = 'pointer';
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', org.labelText + ' — click to explore topics');

      // Hit area (invisible, larger)
      var hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hit.setAttribute('cx', org.cx); hit.setAttribute('cy', org.cy);
      hit.setAttribute('r', org.r + 8);
      hit.setAttribute('fill', 'transparent');
      g.appendChild(hit);

      // Glow circle (shows on hover)
      var glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', org.cx); glow.setAttribute('cy', org.cy);
      glow.setAttribute('r', org.r);
      glow.setAttribute('fill', color);
      glow.setAttribute('opacity', '0');
      glow.setAttribute('class', 'organ-glow');
      glow.setAttribute('filter', 'url(#glow-' + org.key + ')');
      g.appendChild(glow);

      // Icon container (circle with clipped icon inside)
      var iconCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      iconCircle.setAttribute('cx', org.cx); iconCircle.setAttribute('cy', org.cy);
      iconCircle.setAttribute('r', org.r - 2);
      iconCircle.setAttribute('fill', 'var(--bg-surface)');
      iconCircle.setAttribute('stroke', color);
      iconCircle.setAttribute('stroke-width', '2');
      iconCircle.setAttribute('class', 'organ-circle');
      g.appendChild(iconCircle);

      // Icon via foreignObject
      var fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      var iconSize = Math.round(org.r * 1.4);
      fo.setAttribute('x', org.cx - iconSize / 2);
      fo.setAttribute('y', org.cy - iconSize / 2);
      fo.setAttribute('width', iconSize);
      fo.setAttribute('height', iconSize);

      var iconDiv = document.createElement('div');
      iconDiv.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      iconDiv.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;';
      iconDiv.className = 'organ-icon-wrapper';
      iconDiv.setAttribute('data-system', org.key);

      var iconName = (App && App.SYSTEMS && App.SYSTEMS[org.key]) ? App.SYSTEMS[org.key].icon : org.key;
      loadIcon(iconName).then(function(svgText) {
        iconDiv.innerHTML = svgText;
        var svgEl = iconDiv.querySelector('svg');
        if (svgEl) {
          svgEl.style.width = '100%';
          svgEl.style.height = '100%';
        }
      });
      fo.appendChild(iconDiv);
      g.appendChild(fo);

      // Label — positioned to left or right
      var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('y', org.cy + 4);
      label.setAttribute('fill', 'var(--text-secondary)');
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '600');
      label.setAttribute('font-family', 'Inter, system-ui, sans-serif');
      label.setAttribute('class', 'organ-label');
      label.textContent = org.labelText;

      // Connector line from organ to label
      var connector = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      connector.setAttribute('y1', org.cy); connector.setAttribute('y2', org.cy);
      connector.setAttribute('stroke', color);
      connector.setAttribute('stroke-width', '1');
      connector.setAttribute('opacity', '0.3');
      connector.setAttribute('class', 'organ-connector');

      if (org.labelSide === 'right') {
        label.setAttribute('x', org.cx + org.r + 30);
        label.setAttribute('text-anchor', 'start');
        connector.setAttribute('x1', org.cx + org.r + 2);
        connector.setAttribute('x2', org.cx + org.r + 26);
      } else {
        label.setAttribute('x', org.cx - org.r - 30);
        label.setAttribute('text-anchor', 'end');
        connector.setAttribute('x1', org.cx - org.r - 2);
        connector.setAttribute('x2', org.cx - org.r - 26);
      }

      g.appendChild(connector);
      g.appendChild(label);

      // --- Event handlers ---
      g.addEventListener('mouseenter', function() { hoverOrgan(org.key, true); });
      g.addEventListener('mouseleave', function() { hoverOrgan(org.key, false); });
      g.addEventListener('click', function() { clickOrgan(org.key, mode); });
      g.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickOrgan(org.key, mode); }
      });

      svg.appendChild(g);
    });

    inner.appendChild(svg);
    wrapper.appendChild(inner);
    container.appendChild(wrapper);

    // Parallax
    setupParallax(wrapper, inner);

    // Entry animation
    var regions = svg.querySelectorAll('.organ-region');
    gsap.fromTo(regions,
      { opacity: 0, scale: 0.5, transformOrigin: 'center center' },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(1.4)', delay: 0.15 }
    );

    // Practicals mode: subtle breathing on glows
    if (mode === 'practicals') {
      svg.querySelectorAll('.organ-glow').forEach(function(glow, i) {
        gsap.to(glow, {
          opacity: 0.15,
          duration: 2 + Math.random(),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.25
        });
      });
    }
  }

  function hoverOrgan(key, isEnter) {
    var g = document.querySelector('.organ-region[data-system="' + key + '"]');
    if (!g) return;
    var glow = g.querySelector('.organ-glow');
    var circle = g.querySelector('.organ-circle');
    var label = g.querySelector('.organ-label');
    var connector = g.querySelector('.organ-connector');
    var color = SYS_COLORS[key];

    if (isEnter) {
      gsap.to(glow, { opacity: 0.35, duration: 0.3 });
      gsap.to(circle, { scale: 1.1, transformOrigin: 'center center', duration: 0.3, ease: 'elastic.out(1, 0.6)' });
      if (label) { label.setAttribute('fill', color); label.style.fontWeight = '700'; }
      if (connector) gsap.to(connector, { opacity: 0.7, duration: 0.2 });
    } else {
      gsap.to(glow, { opacity: 0, duration: 0.3 });
      gsap.to(circle, { scale: 1, duration: 0.3 });
      if (label) { label.setAttribute('fill', 'var(--text-secondary)'); label.style.fontWeight = '600'; }
      if (connector) gsap.to(connector, { opacity: 0.3, duration: 0.2 });
    }
  }

  function clickOrgan(key, mode) {
    var m = mode || (App && App.state && App.state.mode) || 'theory';
    var g = document.querySelector('.organ-region[data-system="' + key + '"]');

    if (g) {
      // Pulse the clicked organ
      gsap.to(g.querySelector('.organ-glow'), { opacity: 0.6, duration: 0.2 });
      gsap.to(g.querySelector('.organ-circle'), { scale: 1.2, duration: 0.2, ease: 'power2.in' });

      // Fade others
      document.querySelectorAll('.organ-region:not([data-system="' + key + '"])').forEach(function(el) {
        gsap.to(el, { opacity: 0.15, duration: 0.3 });
      });

      // Navigate after brief delay for visual feedback
      gsap.delayedCall(0.35, function() {
        window.location.hash = m + '/' + key;
      });
    }
  }

  function setupParallax(wrapper, inner) {
    var rafId = null;
    function onMove(e) {
      if (rafId) return;
      rafId = requestAnimationFrame(function() {
        var rect = wrapper.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        inner.style.transform = 'rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 4) + 'deg)';
        rafId = null;
      });
    }
    function onLeave() {
      gsap.to(inner, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
    }
    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', onLeave);
    wrapper.addEventListener('touchmove', function(e) {
      var t = e.touches[0];
      onMove({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    wrapper.addEventListener('touchend', onLeave);
  }

  // Listen for view changes
  window.addEventListener('viewchange', function(e) {
    if (e.detail && e.detail.view === 'body') {
      var container = document.getElementById('interactive-body');
      var titleEl = document.getElementById('body-view-title');
      var subtitleEl = document.getElementById('body-view-subtitle');

      if (titleEl) titleEl.textContent = e.detail.mode === 'theory' ? 'Theory' : 'Clinical Medicine';
      if (subtitleEl) subtitleEl.textContent = 'Select an organ system to explore';

      if (container) {
        renderBody(container, e.detail.mode);
      }
    }
  });

  window.BodyScene = { renderBody: renderBody };
})();
