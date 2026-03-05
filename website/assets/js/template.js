/* MD Exam Prep -- Shared template (glassmorphic header + footer for sub-pages) */
(function () {
  "use strict";

  function getBasePath() {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    // Depth 1: predictor/, theory/, practicals/
    if (/\/(predictor|theory|practicals)\//.test(path)) {
      // Depth 2: theory/tools/
      if (/\/theory\/tools\//.test(path)) return "../../";
      return "../";
    }
    return "";
  }

  function currentSection() {
    var path = window.location.pathname;
    if (path.indexOf("/predictor") !== -1) return "predictor";
    if (path.indexOf("/practicals") !== -1) return "practicals";
    if (path.indexOf("/theory") !== -1) return "theory";
    return "";
  }

  function inject() {
    var base = "/";

    var section = currentSection();

    /* — Glassmorphic header — */
    var nav = document.getElementById("site-nav");
    if (nav) {
      var links = [
        { href: "/predictor?demo=1", label: "Predictor", key: "predictor" },
        { href: "/practicals", label: "Practicals", key: "practicals" },
        { href: "/theory", label: "Theory", key: "theory" }
      ];

      var navLinksHtml = links.map(function (l) {
        var cls = "glass-header-nav-link" + (l.key === section ? " active" : "");
        return '<a href="' + l.href + '" class="' + cls + '">' + l.label + '</a>';
      }).join("");

      nav.innerHTML =
        '<header class="glass-header">' +
          '<div class="container">' +
            '<a href="/" class="glass-header-logo">MD Exam Prep</a>' +
            '<nav class="glass-header-nav">' +
              navLinksHtml +
            '</nav>' +
          '</div>' +
        '</header>' +
        '<div class="glass-header-spacer"></div>';
    }

    /* — Footer — */
    var foot = document.getElementById("site-footer");
    if (foot) {
      foot.innerHTML =
        '<footer class="site-footer">' +
          '<div class="container">' +
            '<p class="footer-text">Built by Avinash Jothish. Free forever.</p>' +
          '</div>' +
        '</footer>';
    }
  }

  document.addEventListener("DOMContentLoaded", inject);
  window.getBasePath = getBasePath;
})();
