// D3.js Force-Directed Topic Node Graph
(function() {
  'use strict';

  var simulation = null;
  var currentSvg = null;

  // Lighten a hex color by mixing with white
  function lightenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.round(r + (255 - r) * amount);
    g = Math.round(g + (255 - g) * amount);
    b = Math.round(b + (255 - b) * amount);
    return '#' + [r, g, b].map(function(c) { return c.toString(16).padStart(2, '0'); }).join('');
  }

  function renderGraph(container, systemKey, mode) {
    container.innerHTML = '';
    if (simulation) { simulation.stop(); simulation = null; }

    var sys = App.SYSTEMS[systemKey];
    if (!sys) return;

    var topicData = mode === 'theory'
      ? (window.TheoryTopics && window.TheoryTopics[systemKey])
      : (window.PracticalTopics && window.PracticalTopics[systemKey]);

    if (!topicData) {
      container.innerHTML =
        '<div style="text-align:center;padding:48px 16px;color:var(--text-secondary)">' +
        '<div style="font-size:48px;margin-bottom:16px;opacity:0.3">\u2022\u2022\u2022</div>' +
        '<p style="font-size:1.25rem;margin-bottom:8px;font-weight:600">Coming Soon</p>' +
        '<p style="font-size:0.875rem">Content for ' + sys.name + ' ' + mode + ' is being prepared</p>' +
        '</div>';
      return;
    }

    var nodes = topicData.nodes.map(function(d) { return Object.assign({}, d); });
    var links = topicData.links.map(function(d) { return Object.assign({}, d); });

    // Dimensions
    var width = container.clientWidth || 800;
    var height = Math.max(500, Math.min(700, window.innerHeight - 180));

    var svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', '0 0 ' + width + ' ' + height)
      .style('overflow', 'visible');

    currentSvg = svg;

    // Colors
    var mainColor = sys.color;
    var lightColor = lightenColor(mainColor, 0.8);
    var isDashed = mode === 'practicals';

    // Get computed CSS variable values for SVG
    var cs = getComputedStyle(document.documentElement);
    var textColor = cs.getPropertyValue('--text-primary').trim() || '#1A1D23';
    var borderColor = cs.getPropertyValue('--border-subtle').trim() || '#E5E7EB';
    var bgSurface = cs.getPropertyValue('--bg-surface').trim() || '#FFFFFF';

    // --- Links ---
    var link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .style('stroke', borderColor)
      .style('stroke-width', '1.5')
      .style('stroke-dasharray', isDashed ? '6,3' : 'none')
      .style('opacity', '0');

    // --- Nodes ---
    var node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .style('opacity', '0')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    // Node shapes
    if (mode === 'theory') {
      node.append('circle')
        .attr('r', function(d) { return d.type === 'category' ? 30 : 22; })
        .style('fill', function(d) { return d.type === 'category' ? mainColor : lightColor; })
        .style('stroke', mainColor)
        .style('stroke-width', function(d) { return d.type === 'category' ? '2.5' : '1.5'; })
        .attr('class', 'node-shape');
    } else {
      node.append('rect')
        .attr('width', function(d) { return d.type === 'category' ? 60 : 44; })
        .attr('height', function(d) { return d.type === 'category' ? 60 : 44; })
        .attr('x', function(d) { return d.type === 'category' ? -30 : -22; })
        .attr('y', function(d) { return d.type === 'category' ? -30 : -22; })
        .attr('rx', '12')
        .style('fill', function(d) { return d.type === 'category' ? mainColor : lightColor; })
        .style('stroke', mainColor)
        .style('stroke-width', function(d) { return d.type === 'category' ? '2.5' : '1.5'; })
        .attr('class', 'node-shape');
    }

    // Inner icon: arrow for linked nodes, circle for coming soon
    node.append('text')
      .text(function(d) { return d.url ? '\u2192' : '\u25CB'; })
      .attr('text-anchor', 'middle')
      .attr('dy', function(d) { return d.url ? '5' : '4'; })
      .style('font-size', function(d) { return d.url ? '16px' : '10px'; })
      .style('font-weight', '700')
      .style('fill', function(d) {
        return d.type === 'category' ? 'rgba(255,255,255,0.9)' : mainColor;
      })
      .style('pointer-events', 'none');

    // Labels below nodes
    node.append('text')
      .text(function(d) { return d.label; })
      .attr('text-anchor', 'middle')
      .attr('dy', function(d) { return (d.type === 'category' ? 30 : 22) + 16; })
      .style('font-size', function(d) { return d.type === 'category' ? '12px' : '10px'; })
      .style('font-weight', function(d) { return d.type === 'category' ? '700' : '500'; })
      .style('font-family', 'Inter, system-ui, sans-serif')
      .style('fill', textColor)
      .attr('class', 'node-label');

    // Hover effects
    node.on('mouseenter', function(event, d) {
      d3.select(this).select('.node-shape')
        .transition().duration(200)
        .style('filter', 'drop-shadow(0 0 10px ' + mainColor + ')');
      d3.select(this).select('.node-label')
        .transition().duration(200)
        .style('fill', mainColor).style('font-weight', '700');
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).select('.node-shape')
        .transition().duration(200)
        .style('filter', 'none');
      d3.select(this).select('.node-label')
        .transition().duration(200)
        .style('fill', textColor)
        .style('font-weight', function() { return d.type === 'category' ? '700' : '500'; });
    })
    .on('click', function(event, d) {
      handleNodeClick(d, mode);
    });

    // Keyboard support
    node.each(function() {
      var el = this;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var d = d3.select(el).datum();
          handleNodeClick(d, mode);
        }
      });
    });

    // Force simulation
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function(d) { return d.id; }).distance(90).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(function(d) { return d.type === 'category' ? 50 : 38; }))
      .force('x', d3.forceX(width / 2).strength(0.06))
      .force('y', d3.forceY(height / 2).strength(0.06))
      .on('tick', function() {
        nodes.forEach(function(d) {
          d.x = Math.max(50, Math.min(width - 50, d.x));
          d.y = Math.max(50, Math.min(height - 50, d.y));
        });

        link
          .attr('x1', function(d) { return d.source.x; })
          .attr('y1', function(d) { return d.source.y; })
          .attr('x2', function(d) { return d.target.x; })
          .attr('y2', function(d) { return d.target.y; });

        node.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
      });

    // Scatter initial positions from center
    nodes.forEach(function(d) {
      d.x = width / 2 + (Math.random() - 0.5) * 80;
      d.y = height / 2 + (Math.random() - 0.5) * 80;
    });

    // Entry animation
    node.transition()
      .delay(function(d, i) { return i * 60; })
      .duration(500)
      .style('opacity', '1');

    link.transition()
      .delay(300)
      .duration(500)
      .style('opacity', '0.5');
  }

  // Drag handlers
  function dragStarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x; d.fy = event.y;
  }
  function dragEnded(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;
  }

  // Node click handler
  function handleNodeClick(d, mode) {
    if (d.url) {
      if (d.url.endsWith('.md')) {
        openMarkdownPanel(d.url, d.label);
      } else if (d.url.startsWith('http') || d.url.endsWith('.html')) {
        window.open(d.url, '_blank');
      } else {
        window.location.hash = d.url;
      }
    } else {
      showComingSoon(d);
    }
  }

  // Markdown panel
  function openMarkdownPanel(url, title) {
    var panel = document.getElementById('content-panel');
    var body = document.getElementById('content-panel-body');
    if (!panel || !body) return;

    body.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-secondary)"><p>Loading ' + title + '...</p></div>';
    panel.classList.add('med-panel--open');
    panel.setAttribute('aria-hidden', 'false');

    fetch(url)
      .then(function(resp) {
        if (!resp.ok) throw new Error('Failed to load');
        return resp.text();
      })
      .then(function(md) {
        body.innerHTML = '<h1 style="margin-bottom:24px;font-size:1.5rem;font-weight:800">' + title + '</h1>' + marked.parse(md);
      })
      .catch(function(e) {
        body.innerHTML =
          '<div style="text-align:center;padding:48px;color:var(--text-secondary)">' +
          '<p>Could not load content</p>' +
          '<p style="font-size:0.8125rem;margin-top:8px">' + e.message + '</p></div>';
      });
  }

  function closePanel() {
    var panel = document.getElementById('content-panel');
    if (panel) {
      panel.classList.remove('med-panel--open');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  function showComingSoon(d) {
    if (!currentSvg) return;
    var nodeEl = currentSvg.selectAll('.node-group').filter(function(n) { return n.id === d.id; });
    if (nodeEl.empty()) return;

    var tooltip = nodeEl.append('text')
      .text('Coming Soon')
      .attr('text-anchor', 'middle')
      .attr('dy', '-35')
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', 'var(--accent-warm)')
      .style('opacity', '0');

    tooltip.transition().duration(200).style('opacity', '1');
    tooltip.transition().delay(1800).duration(300).style('opacity', '0').remove();
  }

  // Listen for view changes
  window.addEventListener('viewchange', function(e) {
    if (e.detail && e.detail.view === 'system' && e.detail.system) {
      var container = document.getElementById('graph-container');
      var titleEl = document.getElementById('system-title');
      var sys = App.SYSTEMS[e.detail.system];

      if (titleEl && sys) {
        titleEl.textContent = sys.name;
        titleEl.style.color = sys.color;
      }
      if (container) {
        renderGraph(container, e.detail.system, e.detail.mode);
      }
    }
  });

  // Expose close panel on App
  if (window.App) {
    App.closePanel = closePanel;
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      if (window.App) App.closePanel = closePanel;
    });
  }

  window.NodeGraph = { renderGraph: renderGraph, closePanel: closePanel };
})();
