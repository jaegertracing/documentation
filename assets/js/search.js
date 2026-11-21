/*
 * This file connects Pagefind's prebuilt Component UI
 * (https://pagefind.app/docs/components/) to the site. The components render
 * the search box, its popup and the results list. This file sets the docs
 * version that a search covers, for which they have no setting, and keeps the
 * popup's summary, the results page's status line and its address
 * (/search/?q=<query>&v=<version|all>) in step with the search.
 *
 * It overrides Docsy's assets/js/search.js, and Docsy bundles it into main.js
 * as a Hugo template. It must work under the site CSP (netlify.toml), which
 * allows no inline scripts.
 */
(function () {
  'use strict';

  const SEARCH_PAGE = '{{ "search/" | relURL }}';
  const LATEST = '{{ site.Params.latestV2 }}';
  const SITE = 'site'; // version filter value of non-docs pages
  const ALL = 'all';

  /** Pagefind filters for a scope: that docs version plus non-docs pages. */
  const filtersFor = (version) =>
    version === ALL ? {} : { version: { any: [version, SITE] } };

  const scopeLabel = (version) =>
    version === ALL ? 'all versions' : `${version} docs`;

  const countLabel = (total) => `${total} result${total === 1 ? '' : 's'}`;

  function searchUrl(query, version) {
    const url = new URL(SEARCH_PAGE, location.href);
    if (query) url.searchParams.set('q', query);
    if (version) url.searchParams.set('v', version);
    return url.pathname + url.search;
  }

  function link(href, text) {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = text;
    return anchor;
  }

  function removePopupSummary() {
    document
      .querySelectorAll('.td-search__summary')
      .forEach((summary) => summary.remove());
  }

  /** Shows the scope of the popup's results and links to the results page. */
  function renderPopupSummary(query, version, total) {
    removePopupSummary();
    if (!query) return;
    document.querySelectorAll('.pf-searchbox-dropdown').forEach((popup) => {
      const summary = document.createElement('div');
      summary.className = 'td-search__summary';
      summary.append(`${countLabel(total)} in ${scopeLabel(version)}`);
      if (total) summary.append(link(searchUrl(query, version), 'See all'));
      if (version !== ALL)
        summary.append(link(searchUrl(query, ALL), 'Search all versions'));
      popup.prepend(summary);
    });
  }

  function init() {
    const manager = window.PagefindComponents.getInstanceManager();
    const popupSearch = manager.getInstance('default');
    const versionSelect = document.getElementById('td-search-page-v');
    const params = new URLSearchParams(location.search);
    const pathVersion = location.pathname.match(/^\/docs\/([^/]+)\//)?.[1];
    let version = (versionSelect && params.get('v')) || pathVersion || LATEST;

    popupSearch.searchFilters = filtersFor(version);
    popupSearch.on('search', removePopupSummary);
    popupSearch.on('results', (result) =>
      renderPopupSummary(
        popupSearch.searchTerm,
        version,
        result.results.length,
      ),
    );
    // Docsy wraps the sidebar search box in a form, which Enter must not submit.
    document
      .querySelectorAll('form:has(pagefind-searchbox)')
      .forEach((form) =>
        form.addEventListener('submit', (event) => event.preventDefault()),
      );
    if (!versionSelect) return;

    const pageSearch = manager.getInstance('page');
    const status = document.getElementById('td-search-page-status');
    const urlQuery = (params.get('q') || '').trim();
    if (!urlQuery) document.querySelector('pagefind-input input')?.focus();
    const menuValue = version === LATEST ? '' : version;
    const isVersionListed = [...versionSelect.options].some(
      (option) => option.value === menuValue,
    );
    // A version the menu does not list, such as a 1.x archive, gets an entry.
    if (!isVersionListed) {
      const lastOption = versionSelect.options[versionSelect.length - 1];
      versionSelect.add(
        new Option(`${version} (archive)`, version),
        lastOption,
      );
    }
    versionSelect.value = menuValue;

    pageSearch.on('search', (query) =>
      history.replaceState(null, '', searchUrl(query, versionSelect.value)),
    );
    pageSearch.on('results', (result) => {
      const total = result.results.length;
      const query = pageSearch.searchTerm;
      status.textContent = query
        ? `${countLabel(total)} for “${query}” in ${scopeLabel(version)}.`
        : 'Enter a search term.';
      if (query && !total && version !== ALL)
        status.append(' ', link(searchUrl(query, ALL), 'Search all versions'));
    });
    versionSelect.addEventListener('change', () => {
      version = versionSelect.value || LATEST;
      popupSearch.searchFilters = filtersFor(version);
      pageSearch.triggerFilters(filtersFor(version));
    });
    pageSearch.triggerSearchWithFilters(urlQuery, filtersFor(version));
  }

  // The component bundle is a module script, which runs after this file. It
  // is absent when the site has no search index, as under `npm run serve`.
  document.addEventListener('DOMContentLoaded', () => {
    if (window.PagefindComponents) init();
  });
})();
