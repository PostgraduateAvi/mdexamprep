/* MBBEasy — Nav + Footer injection for sub-pages */
(function () {
  "use strict";

  function currentSection() {
    var path = window.location.pathname;
    if (path.indexOf("/theory") !== -1) return "theory";
    if (path.indexOf("/practicals") !== -1) return "practicals";
    return "";
  }

  function inject() {
    var section = currentSection();

    var nav = document.getElementById("site-nav");
    if (nav) {
      var links = [
        { href: "/theory/", label: "Theory", key: "theory", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' },
        { href: "/practicals/", label: "Practicals", key: "practicals", icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><path d="M22 10a2 2 0 1 0-4 0v0a2 2 0 1 0 4 0"/></svg>' }
      ];
      var linksHtml = links.map(function (l) {
        var cls = l.key === section ? ' class="active"' : '';
        return '<a href="' + l.href + '"' + cls + '>' + l.icon + ' ' + l.label + '</a>';
      }).join("");

      nav.innerHTML =
        '<nav class="nav"><div class="container">' +
          '<a href="/" class="nav-logo">MBBEasy</a>' +
          '<div class="nav-links">' + linksHtml + '</div>' +
        '</div></nav>';
    }

    var foot = document.getElementById("site-footer");
    if (foot) {
      foot.innerHTML =
        '<footer class="site-footer"><div class="container">' +
          '<span class="footer-brand">MBBEasy</span>' +
          'Built by Avinash Jothish. Free forever.' +
        '</div></footer>';
    }
  }

  document.addEventListener("DOMContentLoaded", inject);
})();
