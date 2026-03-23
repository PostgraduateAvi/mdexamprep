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
        { href: "/theory/", label: "Theory", key: "theory" },
        { href: "/practicals/", label: "Practicals", key: "practicals" }
      ];
      var linksHtml = links.map(function (l) {
        var cls = l.key === section ? ' class="active"' : '';
        return '<a href="' + l.href + '"' + cls + '>' + l.label + '</a>';
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
          'Built by Avinash Jothish. Free forever.' +
        '</div></footer>';
    }
  }

  document.addEventListener("DOMContentLoaded", inject);
})();
