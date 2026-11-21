// These tests load the built site in a browser and run real searches, so they
// cover the Pagefind bundle, its prebuilt components and the index format
// together with the version scoping in assets/js/search.js. The build-time
// index step alone does not exercise them.
import { expect, test, type Page } from '@playwright/test';
import { latestV2 } from './site-params';

// A term that appears throughout the docs, so every indexed version matches.
const QUERY = 'sampling';

/** The href of every result link under `container`. */
function resultHrefs(page: Page, container: string) {
  return page
    .locator(`${container} a[href]`)
    .evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href') ?? ''),
    );
}

/**
 * The docs versions that the result links under `container` point at. Links
 * to non-docs pages, which every scope includes, are left out.
 */
async function linkedDocsVersions(page: Page, container: string) {
  const versions = (await resultHrefs(page, container))
    .map((href) => /^\/docs\/([^/]+)\//.exec(href)?.[1])
    .filter((version) => version !== undefined);
  return [...new Set(versions)];
}

const NAVBAR_INPUT = '.td-navbar pagefind-searchbox input';
const NAVBAR_RESULTS = '.td-navbar pagefind-searchbox [role="listbox"]';
const NAVBAR_SUMMARY = '.td-navbar .td-search__summary';
const PAGE_RESULTS = 'pagefind-results';
const PAGE_STATUS = '#td-search-page-status';

const navbarScopes = [
  { path: '/', version: latestV2() },
  { path: '/docs/2.dev/', version: '2.dev' },
  { path: '/docs/1.76/', version: '1.76' },
  { path: `/search/?q=${QUERY}&v=1.76`, version: '1.76' },
];

for (const { path, version } of navbarScopes) {
  test(`navbar search on ${path} is scoped to ${version}`, async ({ page }) => {
    await page.goto(path);
    await page.locator(NAVBAR_INPUT).fill('collector');
    await expect
      .poll(() => linkedDocsVersions(page, NAVBAR_RESULTS))
      .toEqual([version]);
  });
}

const pageScopes = [
  { params: `q=${QUERY}`, version: latestV2(), menuValue: '' },
  { params: `q=${QUERY}&v=2.dev`, version: '2.dev', menuValue: '2.dev' },
  // The 1.x docs are built but not listed in the version menu.
  { params: `q=${QUERY}&v=1.76`, version: '1.76', menuValue: '1.76' },
];

for (const { params, version, menuValue } of pageScopes) {
  test(`search page ?${params} is scoped to ${version}`, async ({ page }) => {
    await page.goto(`/search/?${params}`);
    await expect(page.locator('pagefind-input input')).toHaveValue(QUERY);
    await expect(page.locator('#td-search-page-v')).toHaveValue(menuValue);
    await expect(page.locator(PAGE_STATUS)).toHaveText(
      new RegExp(`^\\d+ results for “${QUERY}” in ${version} docs\\.$`),
    );
    await expect
      .poll(() => linkedDocsVersions(page, PAGE_RESULTS))
      .toEqual([version]);
    // Every docs result carries the version badge; non-docs pages show none.
    const badges = page.locator(`${PAGE_RESULTS} .td-search__badge:visible`);
    await expect
      .poll(async () => [...new Set(await badges.allTextContents())])
      .toEqual([version]);
  });
}

test('search page adds no menu entry for a version the menu lists', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=${latestV2()}`);
  await expect(page.locator(`${PAGE_RESULTS} a[href]`).first()).toBeVisible();
  await expect(page.locator('#td-search-page-v')).toHaveValue('');
  await expect(
    page.locator('#td-search-page-v option', { hasText: '(archive)' }),
  ).toHaveCount(0);
});

test('search page shows an archived version that the menu does not list', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=1.76`);
  await expect(page.locator('#td-search-page-v option:checked')).toHaveText(
    '1.76 (archive)',
  );
});

test('search page searches every version for v=all', async ({ page }) => {
  await page.goto(`/search/?q=${QUERY}&v=all`);
  await expect
    .poll(async () => (await linkedDocsVersions(page, PAGE_RESULTS)).length)
    .toBeGreaterThan(1);
});

test('search page keeps the address bar in step with the search', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}`);
  await expect(page.locator(`${PAGE_RESULTS} a[href]`).first()).toBeVisible();
  await page.locator('#td-search-page-v').selectOption('2.dev');
  await expect(page.locator(PAGE_STATUS)).toHaveText(/ in 2\.dev docs\.$/);
  await expect(page).toHaveURL(new RegExp(`/search/\\?q=${QUERY}&v=2\\.dev$`));
  await expect
    .poll(() => linkedDocsVersions(page, PAGE_RESULTS))
    .toEqual(['2.dev']);
  await page.locator('pagefind-input input').fill('collector');
  await expect(page).toHaveURL(/\/search\/\?q=collector&v=2\.dev$/);
});

test('search page offers all versions when a version has no results', async ({
  page,
}) => {
  await page.goto('/search/?q=zzzqqq');
  const allVersionsLink = page.locator(`${PAGE_STATUS} a`);
  await expect(allVersionsLink).toHaveText('Search all versions');
  await expect(allVersionsLink).toHaveAttribute(
    'href',
    '/search/?q=zzzqqq&v=all',
  );
});

test('navbar popup states its scope and links to the results page', async ({
  page,
}) => {
  await page.goto('/docs/2.dev/');
  await page.locator(NAVBAR_INPUT).fill(QUERY);
  const summary = page.locator(NAVBAR_SUMMARY);
  await expect(summary).toContainText(/^\d+ results in 2\.dev docs/);
  await expect(summary.locator('a').last()).toHaveAttribute(
    'href',
    `/search/?q=${QUERY}&v=all`,
  );
  await summary.getByText('See all').click();
  await expect(page).toHaveURL(new RegExp(`/search/\\?q=${QUERY}&v=2\\.dev$`));
  await expect(page.locator(PAGE_STATUS)).toHaveText(/ in 2\.dev docs\.$/);
});

test('navbar search on the results page keeps the all-versions scope', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=all`);
  await page.locator(NAVBAR_INPUT).fill('collector');
  await expect
    .poll(async () => (await linkedDocsVersions(page, NAVBAR_RESULTS)).length)
    .toBeGreaterThan(1);
});

test('navbar search follows the version picked on the results page', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}`);
  await page.locator('#td-search-page-v').selectOption('2.dev');
  await page.locator(NAVBAR_INPUT).fill('collector');
  await expect
    .poll(() => linkedDocsVersions(page, NAVBAR_RESULTS))
    .toEqual(['2.dev']);
});

test('search page without a query focuses its search field', async ({
  page,
}) => {
  await page.goto('/search/');
  await expect(page.locator('pagefind-input input')).toBeFocused();
});

test('Enter in the mobile sidebar search box does not submit its form', async ({
  page,
}) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto('/docs/2.dev/');
  const input = page.locator('.td-sidebar pagefind-searchbox input');
  // A query without results leaves no highlighted result for Enter to open.
  await input.fill('zzzqqq');
  await expect(page.locator('.td-sidebar .td-search__summary')).toBeVisible();
  await input.press('Enter');
  await expect(input).toHaveValue('zzzqqq');
  await expect(page).toHaveURL(/\/docs\/2\.dev\/$/);
});

test('result links are site-relative', async ({ page }) => {
  // Site-relative links resolve wherever the site is hosted.
  await page.goto(`/search/?q=${QUERY}`);
  await expect(page.locator(`${PAGE_RESULTS} a[href]`).first()).toBeVisible();
  for (const href of await resultHrefs(page, PAGE_RESULTS))
    expect(href).toMatch(/^\//);
});
