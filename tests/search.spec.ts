// These tests load the built site in a browser and run real searches, so they
// cover the Pagefind JS bundle and index format together with the UI code in
// assets/js/search.js. The build-time index step alone does not exercise them.
import { expect, test } from '@playwright/test';

// A term that appears throughout the docs, so every indexed version matches.
const QUERY = 'sampling';

test('navbar search shows results for a docs query', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  await input.fill(QUERY);
  const options = page.locator('.td-search__option');
  await expect(options.first()).toBeVisible();
  await expect(options.first().locator('.td-search__title')).not.toBeEmpty();
  await expect(options.first()).toHaveAttribute('href', /\//);
  await expect(page.locator('.td-search__more').last()).toHaveText(
    'Search all versions',
  );
  await expect(page.locator('.td-search__status').first()).toHaveText(
    /\d+ results? in /,
  );
});

test('search page lists results scoped to the latest version', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}`);
  const status = page.locator('#td-search-page-status');
  await expect(status).toHaveText(/\d+ results? for “sampling” in \S+ docs\./);
  const results = page.locator('#td-search-page-results > li');
  await expect(results.first()).toBeVisible();
  await expect(
    results.first().locator('.td-search-page__title'),
  ).not.toBeEmpty();
});

test('search page scopes results to the requested version', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=2.dev`);
  await expect(page.locator('#td-search-page-status')).toHaveText(
    /^\d+ results? for “sampling” in 2\.dev docs\.$/,
  );
  const results = page.locator('#td-search-page-results > li');
  await expect(results.first()).toBeVisible();
  // Every docs result carries the version badge; non-docs pages carry none.
  const badges = results.locator('.td-search__badge');
  await expect(badges.first()).toHaveText('2.dev');
  for (const badge of await badges.allTextContents()) {
    expect(badge).toBe('2.dev');
  }
});
