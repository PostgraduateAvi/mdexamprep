/* MD Exam Prep -- Shared template (sub-page back-link + footer) */
(function () {
  "use strict";

  function getBasePath() {
    var path = window.location.pathname.replace(/\/index\.html$/, "/");
    var subs = ["predictor", "theory", "practicals"];
    var inSub = subs.some(function (s) { return path.indexOf("/" + s) !== -1; });
    return inSub ? "../" : "";
  }

  function inject() {
    var base = getBasePath();
    if (!base) return;

    var nav = document.getElementById("site-nav");
    if (nav) {
      nav.innerHTML = "<div class=\"container\"><a href=\"" + base + "index.html\" class=\"back-home\">← Back to Home</a></div>";
    }

    var foot = document.getElementById("site-footer");
    if (foot) {
      foot.innerHTML = "<footer class=\"site-footer\"><div class=\"container\"><p class=\"footer-text\">Built by Avinash Jothish</p></div></footer>";
    }
  }

  document.addEventListener("DOMContentLoaded", inject);
  window.getBasePath = getBasePath;
})();
