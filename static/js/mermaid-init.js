(() => {
  const config = {
    startOnLoad: true,

    // useMaxWidth:true ensures the SVG scales with the main panel as it's resized
    // and prevents the image from overlapping with menu panels.
    flowchart: { useMaxWidth: true, htmlLabels: false },

    // See: https://github.com/mermaid-js/mermaid/issues/790#issuecomment-478860052
    // Prevents text in labels from getting cut off at the end.
    themeCSS: '.label foreignObject { font-size: 90%; overflow: visible; }',
  };

  if (!window.mermaid) {
    return;
  }

  window.mermaid.initialize(config);
})();
