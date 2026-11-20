// cSpell:ignore networkidle
// These tests load the built site in a browser and run real searches, so they
// cover the Pagefind JS bundle and index format together with the UI code in
// assets/js/search.js. The build-time index step alone does not exercise them.
import { expect, test, type Page } from '@playwright/test';

// A term that appears throughout the docs, so every indexed version matches.
const QUERY = 'sampling';

/** Pause matching requests until the test releases them. */
async function holdRequest(page: Page, pattern: string, abort = false) {
  let release!: () => void;
  let requested!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  const started = new Promise<void>((resolve) => (requested = resolve));
  await page.route(pattern, async (route) => {
    requested();
    await held;
    if (abort) await route.abort();
    else await route.continue();
  });
  return { started, release };
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches the status line "<n> result(s) for “<query>” in <scope>." */
function statusFor(scope: string) {
  return new RegExp(
    `^\\d+ results? for “${escapeRegExp(QUERY)}” in ${escapeRegExp(scope)}\\.$`,
  );
}

test('navbar search shows results for a docs query', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  await input.fill(QUERY);
  const options = page.locator('.td-search__option');
  await expect(options.first()).toBeVisible();
  await expect(options.first().locator('.td-search__title')).not.toBeEmpty();
  // Result links are site-relative, so they resolve wherever the site is hosted.
  await expect(options.first()).toHaveAttribute('href', /^\//);
  await expect(page.locator('.td-search__more').last()).toHaveText(
    'Search all versions',
  );
  await expect(page.locator('.td-search__status').first()).toHaveText(
    /^\d+ results? in \S+ docs$/,
  );
});

test('search page lists results scoped to the latest version', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}`);
  // The version selector's default option reads "Latest (<version>)".
  const label = await page
    .locator('#td-search-page-v option[value=""]')
    .textContent();
  const latest = /\((\S+)\)/.exec(label ?? '')?.[1];
  expect(latest).toBeTruthy();
  await expect(page.locator('#td-search-page-status')).toHaveText(
    statusFor(`${latest} docs`),
  );
  const results = page.locator('#td-search-page-results > li');
  await expect(results.first()).toBeVisible();
  await expect(
    results.first().locator('.td-search-page__title'),
  ).not.toBeEmpty();
  await expect(results.first().locator('.td-search__badge')).toHaveText(
    latest!,
  );
});

test('search page scopes results to the requested version', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=2.dev`);
  await expect(page.locator('#td-search-page-status')).toHaveText(
    statusFor('2.dev docs'),
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

// Hold an actual Pagefind request so dismissal happens while work is pending.
// Each test gets a fresh browser context, including a cold WASM cache.
for (const dismiss of ['Escape', 'Tab', 'outside click']) {
  test(`pending navbar search stays closed after ${dismiss}`, async ({
    page,
  }) => {
    const { started, release } = await holdRequest(
      page,
      '**/pagefind/wasm.*.pagefind',
    );
    await page.goto('/');
    const input = page.locator('.td-search__input').first();
    const panel = page.locator('.td-search__results').first();
    await input.fill(QUERY);
    await started;
    if (dismiss === 'outside click')
      await page.locator('body').click({ position: { x: 0, y: 0 } });
    else await input.press(dismiss);
    await expect(panel).toBeHidden();
    release();
    await page.waitForLoadState('networkidle');
    await expect(panel).toBeHidden();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    // Dismissal cancels only the old request; another query must still work.
    await input.fill('collector');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.td-search__option').first()).toBeVisible();
  });
}

test('a late bundle error does not reopen a dismissed popup', async ({
  page,
}) => {
  const { started, release } = await holdRequest(
    page,
    '**/pagefind/pagefind.js',
    true,
  );
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  await input.fill(QUERY);
  await started;
  await input.press('Escape');
  release();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.td-search__results').first()).toBeHidden();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('rapid Show more clicks do not duplicate or skip results', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=2.dev`);
  const results = page.locator('#td-search-page-results > li');
  const more = page.locator('#td-search-page-more');
  await expect(results).toHaveCount(10);
  const status = await page.locator('#td-search-page-status').textContent();
  const total = Number(/^\d+/.exec(status ?? '')?.[0]);
  expect(total).toBeGreaterThan(20);

  const { started, release } = await holdRequest(
    page,
    '**/pagefind/fragment/**',
  );
  // Native clicks in the same task reproduce the overlap without introducing
  // Playwright's automatic wait for the button to become enabled again.
  await more.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await started;
  await expect(more).toBeDisabled();
  release();
  await expect(results).toHaveCount(20);
  await expect(more).toBeEnabled();
  await expect(more).toBeVisible();
  for (let shown = 20; shown < total; shown += 10) {
    await more.click();
    await expect(results).toHaveCount(Math.min(shown + 10, total));
  }
  await expect(more).toBeHidden();
  const urls = await results
    .locator('.td-search-page__title')
    .evaluateAll((links: HTMLAnchorElement[]) =>
      links.map((link) => link.href),
    );
  expect(new Set(urls).size).toBe(total);
});

for (const version of ['1.76', '2.dev', 'all']) {
  test(`navbar preserves results page scope ${version}`, async ({ page }) => {
    await page.goto(`/search/?q=${QUERY}&v=${version}`);
    const scope = version === 'all' ? 'all versions' : `${version} docs`;
    await expect(page.locator('#td-search-page-status')).toHaveText(
      statusFor(scope),
    );
    const input = page.locator('.td-navbar .td-search__input');
    await input.fill('collector');
    const panel = page.locator('.td-navbar .td-search__results');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.td-search__status')).toHaveText(
      new RegExp(`^\\d+ results? in ${escapeRegExp(scope)}$`),
    );
    const badges = await panel.locator('.td-search__badge').allTextContents();
    expect(badges.length).toBeGreaterThan(0);
    if (version !== 'all')
      expect(badges.every((badge) => badge === version)).toBe(true);
    await expect(panel.locator('.td-search__more').first()).toHaveAttribute(
      'href',
      `/search/?q=collector&v=${version}`,
    );
    await input.press('Enter');
    await expect(page).toHaveURL(
      new RegExp(`/search/\\?q=collector&v=${escapeRegExp(version)}$`),
    );
    await expect(
      page.locator('#td-search-page-results > li').first(),
    ).toBeVisible();
  });
}

test('Escape keeps the popup closed when pending result data arrives', async ({
  page,
}) => {
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  const panel = page.locator('.td-search__results').first();
  await input.fill(QUERY);
  await expect(panel.locator('.td-search__option').first()).toBeVisible();

  const { started, release } = await holdRequest(
    page,
    '**/pagefind/fragment/**',
  );
  // Matching results should still reopen when focus returns.
  await input.press('Tab');
  await input.focus();
  await expect(panel).toBeVisible();

  await input.fill('windows');
  await started;
  // The previous results are still visible. Escape must close them without
  // changing the query, so query-text comparisons cannot cancel this request.
  await expect(panel).toBeVisible();
  await input.press('Escape');
  await expect(input).toHaveValue('windows');
  await input.press('Tab');
  await input.focus();
  await expect(panel).toBeHidden();
  release();
  await page.waitForLoadState('networkidle');
  await expect(panel).toBeHidden();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await input.press('Tab');
  await input.focus();
  await expect(panel).toBeHidden();
  // A subsequent search renders fresh results that can reopen on focus.
  await input.fill('collector');
  await expect(panel.locator('.td-search__option').first()).toBeVisible();
  await input.press('Tab');
  await input.focus();
  await expect(panel).toBeVisible();
});

test('search page shows an archived version that the menu does not list', async ({
  page,
}) => {
  // The 1.x docs are built but not listed in the version menu.
  await page.goto(`/search/?q=${QUERY}&v=1.76`);
  await expect(page.locator('#td-search-page-status')).toHaveText(
    statusFor('1.76 docs'),
  );
  await expect(page.locator('#td-search-page-v')).toHaveValue('1.76');
  await expect(page.locator('#td-search-page-v option:checked')).toHaveText(
    '1.76 (archive)',
  );
});
