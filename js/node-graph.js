(function() {
  'use strict';

  let simulation = null;
  let currentSvg = null;

  function renderGraph(container, systemKey, mode) {
    // Clear previous
    container.innerHTML = '';
    if (simulation) simulation.stop();

    const sys = App.SYSTEMS[systemKey];
    if (!sys) return;

    // Get topic data
    const topicData = mode === 'theory'
      ? (window.TheoryTopics && window.TheoryTopics[systemKey])
      : (window.PracticalTopics && window.PracticalTopics[systemKey]);

    if (!topicData) {
      container.innerHTML = `
        <div style="text-align:center;padding:var(--space-12);color:var(--text-secondary)">
          <p style="font-size:var(--text-xl);margin-bottom:var(--space-4)">Coming Soon</p>
          <p style="font-size:var(--text-sm)">Content for ${sys.name} ${mode} is being prepared</p>
        </div>
      `;
      return;
    }

    const nodes = topicData.nodes.map(d => ({...d}));
    const links = topicData.links.map(d => ({...d}));

    // Dimensions
    const width = container.clientWidth || 800;
    const height = Math.max(500, window.innerHeight - 200);

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    currentSvg = svg;

    // Arrow marker for directed links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'var(--border-subtle)');

    // Links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'var(--border-subtle)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', mode === 'practicals' ? '6,3' : 'none')
      .attr('opacity', 0.6);

    // Node groups
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .attr('cursor', 'pointer')
      .attr('tabindex', '0')
      .attr('role', 'button')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    // Node shapes
    if (mode === 'theory') {
      // Circles for theory
      node.append('circle')
        .attr('r', d => d.type === 'category' ? 28 : 20)
        .attr('fill', d => d.type === 'category' ? sys.color : `color-mix(in srgb, ${sys.color} 20%, var(--bg-surface))`)
        .attr('stroke', sys.color)
        .attr('stroke-width', d => d.type === 'category' ? 2.5 : 1.5)
        .attr('class', 'node-shape');
    } else {
      // Rounded rectangles for practicals
      node.append('rect')
        .attr('width', d => d.type === 'category' ? 56 : 40)
        .attr('height', d => d.type === 'category' ? 56 : 40)
        .attr('x', d => d.type === 'category' ? -28 : -20)
        .attr('y', d => d.type === 'category' ? -28 : -20)
        .attr('rx', 10)
        .attr('fill', d => d.type === 'category' ? sys.color : `color-mix(in srgb, ${sys.color} 20%, var(--bg-surface))`)
        .attr('stroke', sys.color)
        .attr('stroke-width', d => d.type === 'category' ? 2.5 : 1.5)
        .attr('class', 'node-shape');
    }

    // Node labels
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.type === 'category' ? 28 : 20) + 14)
      .attr('font-size', d => d.type === 'category' ? '11' : '9')
      .attr('font-weight', d => d.type === 'category' ? '700' : '500')
      .attr('font-family', 'Inter, system-ui, sans-serif')
      .attr('fill', 'var(--text-primary)')
      .attr('class', 'node-label');

    // "Coming Soon" or URL indicator
    node.filter(d => !d.url)
      .append('text')
      .text('\u25CB')
      .attr('text-anchor', 'middle')
      .attr('dy', '4')
      .attr('font-size', '10')
      .attr('fill', 'rgba(255,255,255,0.6)');

    node.filter(d => !!d.url)
      .append('text')
      .text('\u2192')
      .attr('text-anchor', 'middle')
      .attr('dy', '5')
      .attr('font-size', '14')
      .attr('font-weight', '700')
      .attr('fill', 'rgba(255,255,255,0.9)');

    // Hover effects
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('.node-shape')
        .transition()
        .duration(200)
        .attr('filter', `drop-shadow(0 0 8px ${sys.color})`);
      d3.select(this).select('.node-label')
        .transition()
        .duration(200)
        .attr('font-weight', '700')
        .attr('fill', sys.color);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('.node-shape')
        .transition()
        .duration(200)
        .attr('filter', 'none');
      d3.select(this).select('.node-label')
        .transition()
        .duration(200)
        .attr('font-weight', d => d.type === 'category' ? '700' : '500')
        .attr('fill', 'var(--text-primary)');
    })
    .on('click', function(event, d) {
      handleNodeClick(d, mode);
    });

    // Force simulation
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.type === 'category' ? 45 : 35))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .on('tick', () => {
        // Constrain to bounds
        nodes.forEach(d => {
          d.x = Math.max(40, Math.min(width - 40, d.x));
          d.y = Math.max(40, Math.min(height - 40, d.y));
        });

        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node.attr('transform', d => `translate(${d.x},${d.y})`);
      });

    // Entry animation: nodes start from center and spread out
    nodes.forEach(d => {
      d.x = width / 2 + (Math.random() - 0.5) * 50;
      d.y = height / 2 + (Math.random() - 0.5) * 50;
    });

    // Fade in nodes
    node.attr('opacity', 0);
    node.transition()
      .delay((d, i) => i * 50)
      .duration(400)
      .attr('opacity', 1);

    link.attr('opacity', 0);
    link.transition()
      .delay(200)
      .duration(400)
      .attr('opacity', 0.6);
  }

  // Drag handlers
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  // Handle node clicks
  function handleNodeClick(d, mode) {
    if (d.url) {
      // Check if it's a markdown file
      if (d.url.endsWith('.md')) {
        openMarkdownPanel(d.url, d.label);
      } else if (d.url.startsWith('http') || d.url.endsWith('.html')) {
        // External link or HTML file - open directly
        window.open(d.url, '_blank');
      } else {
        // Hash navigation
        window.location.hash = d.url;
      }
    } else {
      // Show "Coming Soon" tooltip briefly
      showComingSoon(d);
    }
  }

  // Open markdown content in slide-in panel
  async function openMarkdownPanel(url, title) {
    const panel = document.getElementById('content-panel');
    const body = document.getElementById('content-panel-body');
    if (!panel || !body) return;

    body.innerHTML = '<div style="text-align:center;padding:var(--space-12);color:var(--text-secondary)">Loading...</div>';
    panel.classList.add('med-panel--open');
    panel.setAttribute('aria-hidden', 'false');

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Failed to load');
      const md = await resp.text();
      body.innerHTML = marked.parse(md);
    } catch(e) {
      body.innerHTML = `<div style="text-align:center;padding:var(--space-12);color:var(--text-secondary)">
        <p>Could not load content</p>
        <p style="font-size:var(--text-sm);margin-top:var(--space-2)">${e.message}</p>
      </div>`;
    }
  }

  // Close panel
  function closePanel() {
    const panel = document.getElementById('content-panel');
    if (panel) {
      panel.classList.remove('med-panel--open');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  // Show "Coming Soon" indicator on a node
  function showComingSoon(d) {
    const nodeEl = currentSvg?.selectAll('.node-group')
      .filter(n => n.id === d.id);

    if (nodeEl) {
      // Briefly show a tooltip
      const tooltip = nodeEl.append('text')
        .text('Coming Soon')
        .attr('text-anchor', 'middle')
        .attr('dy', -30)
        .attr('font-size', '9')
        .attr('font-weight', '600')
        .attr('fill', 'var(--accent-warm)')
        .attr('opacity', 0);

      tooltip.transition().duration(200).attr('opacity', 1);
      tooltip.transition().delay(1500).duration(300).attr('opacity', 0).remove();
    }
  }

  // Listen for view changes
  window.addEventListener('viewchange', function(e) {
    if (e.detail.view === 'system' && e.detail.system) {
      const container = document.getElementById('graph-container');
      const titleEl = document.getElementById('system-title');
      const sys = App.SYSTEMS[e.detail.system];

      if (titleEl && sys) {
        titleEl.textContent = sys.name;
        titleEl.style.color = sys.color;
      }
      if (container) {
        renderGraph(container, e.detail.system, e.detail.mode);
      }
    }
  });

  // Expose close panel
  App.closePanel = closePanel;

  window.NodeGraph = { renderGraph, closePanel };
})();
