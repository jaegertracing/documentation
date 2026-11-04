// Google Analytics 4 configuration. This is Google's gtag.js bootstrap, as
// documented at https://developers.google.com/tag-platform/gtagjs/install,
// plus the Do Not Track check that Hugo's built-in google_analytics.html
// partial adds around it. It lives in a file because the Content-Security-
// Policy forbids inline scripts, and it replaces Hugo's partial for good: the
// gtag API is what this file depends on, not Hugo's template, so nothing here
// needs to track Hugo upgrades. The measurement ID and the Do Not Track
// setting come from data attributes on the script element; see
// layouts/_partials/google_analytics.html.
(function () {
  var script = document.currentScript;
  var id = script && script.dataset.gaId;
  if (!id) return;

  if (script.dataset.respectDnt === 'true') {
    var dnt =
      navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    if (dnt === '1' || dnt === 'yes') return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', id);
})();
