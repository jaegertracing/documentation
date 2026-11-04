// cSpell:ignore activedescendant postbuild subresults
/*
 * Jaeger site search, backed by Pagefind (https://pagefind.app/).
 *
 * Overrides Docsy's assets/js/search.js. Docsy bundles this file into main.js
 * with resources.ExecuteAsTemplate, so the Hugo values below are filled in at
 * build time. The index is built into public/pagefind/ by the postbuild* npm
 * hooks (see pagefind.yml).
 *
 * Everything here must work under the site CSP (netlify.toml): no inline
 * scripts or style attributes; visibility uses the `hidden` attribute and
 * classes only.
 */
(function () {
  'use strict';

  const SEARCH_PAGE = '{{ "search/" | relURL }}';
  const BUNDLE = '{{ "pagefind/" | relURL }}';
  const BASE_URL = '{{ "/" | relURL }}';
  const LATEST = '{{ site.Params.latestV2 }}';
  const SITE = 'site'; // version filter value of non-docs pages
  const ALL = 'all';
  const DROPDOWN_MAX = 8;
  const PAGE_SIZE = 10;
  const SUB_RESULTS_MAX = 3;

  // ---------------------------------------------------------------------------
  // Pagefind loading and version scoping

  let pagefindPromise;

  /** Loads and initializes the Pagefind bundle once, on first use. */
  function loadPagefind() {
    if (!pagefindPromise) {
      pagefindPromise = import(BUNDLE + 'pagefind.js').then(async (pf) => {
        await pf.options({
          basePath: BUNDLE,
          baseUrl: BASE_URL,
          excerptLength: 24,
        });
        await pf.init();
        return pf;
      });
    }
    return pagefindPromise;
  }

  function unavailableMessage() {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(
      location.hostname,
    );
    return isLocal
      ? 'Search index not found. `npm run serve` does not build one: use `npm run serve:search`.'
      : 'Search is unavailable right now. Please try again later.';
  }

  /** Docs version of the current page (e.g. "2.22", "2.dev", "1.76"), or "". */
  function pageVersion() {
    const match = location.pathname.match(/^\/docs\/([^/]+)\//);
    return match ? match[1] : '';
  }

  /**
   * Resolves the requested version scope against the versions in the index.
   * Returns {version, missing}: `missing` is set when the requested version is
   * not indexed (for example, older versions in a local dev build) and the
   * scope fell back to the latest version.
   */
  async function resolveScope(pf, requested) {
    if (requested === ALL) return { version: ALL };
    const filters = await pf.filters();
    const indexed = Object.keys((filters && filters.version) || {});
    const wanted = requested || pageVersion() || LATEST;
    if (indexed.includes(wanted)) return { version: wanted };
    const fallback = indexed.includes(LATEST) ? LATEST : ALL;
    return { version: fallback, missing: wanted };
  }

  /** Pagefind filters for a scope: that docs version plus non-docs pages. */
  function filtersFor(version) {
    return version === ALL ? {} : { version: { any: [version, SITE] } };
  }

  function scopeLabel(version) {
    return version === ALL ? 'all versions' : `${version} docs`;
  }

  function searchUrl(query, version) {
    const url = new URL(SEARCH_PAGE, location.href);
    url.searchParams.set('q', query);
    if (version) url.searchParams.set('v', version);
    return url.pathname + url.search;
  }

  // ---------------------------------------------------------------------------
  // DOM helpers

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function versionBadge(version) {
    if (!version || version === SITE) return null;
    return el('span', 'badge text-bg-secondary td-search__badge', version);
  }

  /** Pagefind excerpts are HTML-escaped text plus <mark> highlights. */
  function excerptNode(className, html) {
    const node = el('div', className);
    node.innerHTML = html || '';
    return node;
  }

  function resultTitle(data) {
    return (data.meta && data.meta.title) || data.url;
  }

  /** The navbar is always dark; make popups follow the page theme instead. */
  function syncTheme(node) {
    node.setAttribute(
      'data-bs-theme',
      document.documentElement.getAttribute('data-bs-theme') || 'light',
    );
  }

  // ---------------------------------------------------------------------------
  // Search box (navbar and mobile sidebar): ARIA combobox with a result popup

  let instances = 0;

  function initSearchBox(root) {
    const input = root.querySelector('.td-search__input');
    const panel = root.querySelector('.td-search__results');
    if (!input || !panel) return;

    const status = panel.querySelector('.td-search__status');
    const list = panel.querySelector('.td-search__list');
    const footer = panel.querySelector('.td-search__footer');
    const id = `td-search-${++instances}`;
    list.id = `${id}-list`;
    input.setAttribute('aria-controls', list.id);

    let options = [];
    let active = -1;

    function open() {
      syncTheme(panel);
      panel.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    function close() {
      panel.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      setActive(-1);
    }

    function setActive(index) {
      active = index;
      options.forEach((option, i) => {
        option.classList.toggle('active', i === index);
        option.setAttribute('aria-selected', String(i === index));
      });
      if (index >= 0) {
        input.setAttribute('aria-activedescendant', options[index].id);
        options[index].scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function showMessage(text) {
      list.replaceChildren();
      footer.replaceChildren();
      options = [];
      status.textContent = text;
      open();
    }

    function render(query, scope, search, results) {
      const total = search.results.length;
      status.textContent =
        total === 0
          ? `No results in ${scopeLabel(scope.version)}.`
          : `${total} result${total === 1 ? '' : 's'} in ${scopeLabel(scope.version)}`;

      options = results.map((data, i) => {
        const option = el('a', 'td-search__option');
        option.id = `${id}-option-${i}`;
        option.href = data.url;
        option.tabIndex = -1;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        const title = el('span', 'td-search__title', resultTitle(data));
        const badge = versionBadge(data.meta && data.meta.version);
        if (badge) title.append(' ', badge);
        option.append(title, excerptNode('td-search__excerpt', data.excerpt));
        const item = el('li');
        item.setAttribute('role', 'none');
        item.append(option);
        return option;
      });
      list.replaceChildren(...options.map((option) => option.parentElement));
      active = -1;
      input.removeAttribute('aria-activedescendant');

      footer.replaceChildren();
      if (total > 0) {
        footer.append(
          link(
            searchUrl(query, scope.version),
            `See all ${total} result${total === 1 ? '' : 's'}`,
          ),
        );
      }
      if (scope.version !== ALL) {
        footer.append(link(searchUrl(query, ALL), 'Search all versions'));
      }
      open();
    }

    function link(href, text) {
      const a = el('a', 'td-search__more', text);
      a.href = href;
      return a;
    }

    async function run() {
      const query = input.value.trim();
      if (!query) {
        close();
        return;
      }
      let pf;
      try {
        pf = await loadPagefind();
      } catch (err) {
        showMessage(unavailableMessage());
        return;
      }
      const scope = await resolveScope(pf, '');
      const search = await pf.debouncedSearch(
        query,
        { filters: filtersFor(scope.version) },
        200,
      );
      // null means a newer keystroke superseded this search.
      if (search === null || query !== input.value.trim()) return;
      const results = await Promise.all(
        search.results.slice(0, DROPDOWN_MAX).map((r) => r.data()),
      );
      if (query !== input.value.trim()) return;
      render(query, scope, search, results);
    }

    input.addEventListener('input', run);

    input.addEventListener('focus', () => {
      loadPagefind().catch(() => {}); // warm up; errors surface on search
      if (input.value.trim() && list.childElementCount) open();
    });

    input.addEventListener('keydown', (e) => {
      const isOpen = !panel.hidden;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp':
          if (!isOpen || !options.length) return;
          e.preventDefault();
          if (e.key === 'ArrowDown') {
            setActive(active + 1 >= options.length ? 0 : active + 1);
          } else {
            setActive(active <= 0 ? options.length - 1 : active - 1);
          }
          break;
        case 'Enter': {
          // Also stops the mobile sidebar's wrapping <form> from submitting.
          e.preventDefault();
          if (isOpen && active >= 0) {
            location.href = options[active].href;
            break;
          }
          const query = input.value.trim();
          if (query) location.href = searchUrl(query, pageVersion());
          break;
        }
        case 'Escape':
          if (isOpen) {
            e.preventDefault();
            close();
          }
          break;
      }
    });

    // Keep focus on the input when clicking in the popup, so the popup does
    // not close (via focusout) before the click lands on a result link.
    panel.addEventListener('mousedown', (e) => e.preventDefault());

    root.addEventListener('focusout', (e) => {
      if (!root.contains(e.relatedTarget)) close();
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) close();
    });
  }

  // ---------------------------------------------------------------------------
  // Search results page (/search/?q=...&v=...)

  function renderPageResult(data) {
    const item = el('li', 'td-search-page__result');

    const heading = el('div', 'td-search-page__heading');
    const title = el('a', 'td-search-page__title', resultTitle(data));
    title.href = data.url;
    heading.append(title);
    const badge = versionBadge(data.meta && data.meta.version);
    if (badge) heading.append(' ', badge);

    item.append(
      heading,
      el('div', 'td-search-page__url', data.url),
      excerptNode('td-search-page__excerpt', data.excerpt),
    );

    const subs = (data.sub_results || [])
      .filter((sub) => sub.url !== data.url && sub.title)
      .slice(0, SUB_RESULTS_MAX);
    if (subs.length) {
      const subList = el('ul', 'td-search-page__subresults');
      subs.forEach((sub) => {
        const a = el('a', null, sub.title);
        a.href = sub.url;
        const li = el('li');
        li.append(a);
        subList.append(li);
      });
      item.append(subList);
    }
    return item;
  }

  async function initResultsPage() {
    const list = document.getElementById('td-search-page-results');
    if (!list) return;

    const form = document.getElementById('td-search-page-form');
    const queryInput = document.getElementById('td-search-page-q');
    const versionSelect = document.getElementById('td-search-page-v');
    const status = document.getElementById('td-search-page-status');
    const more = document.getElementById('td-search-page-more');

    const params = new URLSearchParams(location.search);
    const query = (params.get('q') || '').trim();
    const requested = params.get('v') || '';

    queryInput.value = query;
    document.querySelectorAll('.td-search__input').forEach((input) => {
      input.value = query;
    });
    if ([...versionSelect.options].some((o) => o.value === requested)) {
      versionSelect.value = requested;
    }
    versionSelect.addEventListener('change', () => {
      if (queryInput.value.trim()) form.submit();
    });

    if (!query) {
      status.textContent = 'Enter a search term.';
      queryInput.focus();
      return;
    }

    status.textContent = 'Searching…';
    let pf;
    try {
      pf = await loadPagefind();
    } catch (err) {
      status.textContent = unavailableMessage();
      return;
    }

    const scope = await resolveScope(pf, requested);
    // Show the scope actually searched (after any fallback) in the selector.
    if (scope.version === ALL) versionSelect.value = ALL;
    else if (scope.missing) versionSelect.value = '';
    const search = await pf.search(query, {
      filters: filtersFor(scope.version),
    });
    const total = search.results.length;

    status.textContent = `${total} result${total === 1 ? '' : 's'} for “${query}” in ${scopeLabel(scope.version)}.`;
    if (scope.missing) {
      status.append(
        ` Version ${scope.missing} is not in this site's search index, so ${scopeLabel(scope.version)} are shown.`,
      );
    }
    if (scope.version !== ALL && total === 0) {
      const all = el('a', null, 'Search all versions');
      all.href = searchUrl(query, ALL);
      status.append(' ', all);
    }

    let shown = 0;
    async function showMore() {
      const batch = search.results.slice(shown, shown + PAGE_SIZE);
      const results = await Promise.all(batch.map((r) => r.data()));
      list.append(...results.map(renderPageResult));
      shown += batch.length;
      more.hidden = shown >= total;
    }

    more.addEventListener('click', async () => {
      const first = shown;
      await showMore();
      const next = list.children[first];
      if (next) next.querySelector('a').focus();
    });

    await showMore();
  }

  // ---------------------------------------------------------------------------

  function init() {
    document.querySelectorAll('.td-search').forEach(initSearchBox);
    initResultsPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
