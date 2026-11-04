// Google Analytics 4 configuration. This is the snippet that Hugo's built-in
// google_analytics.html partial writes inline, moved to a file so that the
// Content-Security-Policy does not need 'unsafe-inline' in script-src. The
// measurement ID and the Do Not Track setting come from data attributes on the
// script element; see layouts/_partials/google_analytics.html.
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
