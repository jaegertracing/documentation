// This file renders the diagrams that the mermaid shortcode emits, and it
// redraws them when the Docsy color mode changes. Mermaid chooses its colors
// once per initialize() call, so a theme change needs a fresh render from the
// original diagram source, which this file keeps on each element.
(() => {
  if (!window.mermaid || window.jaegerMermaidInit) {
    return;
  }
  window.jaegerMermaidInit = true;

  // Mermaid would otherwise run on window load and parse the rendered SVG as
  // diagram text. Nodes are also marked processed so run() skips them.
  window.mermaid.initialize({ startOnLoad: false });

  const baseConfig = {
    startOnLoad: false,

    // useMaxWidth:true ensures the SVG scales with the main panel as it's resized
    // and prevents the image from overlapping with menu panels.
    flowchart: { useMaxWidth: true, htmlLabels: false },

    // See: https://github.com/mermaid-js/mermaid/issues/790#issuecomment-478860052
    // Prevents text in labels from getting cut off at the end.
    themeCSS: '.label foreignObject { font-size: 90%; overflow: visible; }',
  };

  // The shortcode leaves the diagram as HTML, so <br/> is an element and
  // textContent would drop it. The source is taken as markup, like Mermaid's
  // own loader does, and the entities that Hugo escaped are decoded.
  const decoder = document.createElement('textarea');
  const diagramSource = (node) => {
    decoder.innerHTML = node.innerHTML;
    return decoder.value;
  };

  const isDark = () =>
    document.documentElement.getAttribute('data-bs-theme') === 'dark';

  // Mermaid cannot run two render() calls at once, and the color-mode script
  // changes the theme attribute during page load, so renders are queued and a
  // render that a newer one has overtaken stops without touching the page.
  let generation = 0;
  let queue = Promise.resolve();

  const render = async () => {
    const id = ++generation;
    await queue;
    if (id !== generation) {
      return;
    }
    window.mermaid.initialize({
      ...baseConfig,
      theme: isDark() ? 'dark' : 'default',
    });
    const nodes = Array.from(document.querySelectorAll('.mermaid'));
    for (const [index, node] of nodes.entries()) {
      if (node.dataset.source === undefined) {
        node.dataset.source = diagramSource(node);
      }
      const { svg } = await window.mermaid.render(
        `mermaid-${id}-${index}`,
        node.dataset.source,
      );
      if (id !== generation) {
        return;
      }
      node.innerHTML = svg;
      node.dataset.processed = 'true';
    }
  };

  const schedule = () => {
    queue = render().catch((err) =>
      console.error('mermaid render failed', err),
    );
  };

  new MutationObserver(schedule).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-bs-theme'],
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule);
  } else {
    schedule();
  }
})();
