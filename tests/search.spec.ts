// cSpell:ignore activedescendant
// These tests load the built site in a browser and run real searches, so they
// cover the Pagefind JS bundle and index format together with the UI code in
// assets/js/search.js. Every response is served with the production
// Content-Security-Policy from netlify.toml, so a Pagefind upgrade that needs
// a new CSP directive fails here rather than on the live site.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// A term that appears throughout the docs, so every indexed version matches.
const QUERY = 'sampling';

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches the status line "<n> result(s) for “<query>” in <scope>." */
function statusFor(scope: string) {
  return new RegExp(
    `^\\d+ results? for “${escapeRegExp(QUERY)}” in ${escapeRegExp(scope)}\\.$`,
  );
}

// The production CSP, minus upgrade-insecure-requests: the test server is
// plain http on localhost.
const CSP = (() => {
  const toml = readFileSync('netlify.toml', 'utf8');
  const match = /Content-Security-Policy\s*=\s*"([^"]*)"/.exec(toml);
  if (!match) throw new Error('No Content-Security-Policy in netlify.toml');
  return match[1]
    .split(';')
    .map((directive) => directive.trim())
    .filter(
      (directive) => directive && directive !== 'upgrade-insecure-requests',
    )
    .join('; ');
})();

// CSP violations that are known and tracked separately; anything else fails.
// The site still loads Pontano Sans from Google Fonts, which the CSP blocks;
// remove this entry once the font is self-hosted.
const KNOWN_VIOLATIONS: RegExp[] = [
  /^style-src-elem https:\/\/fonts\.googleapis\.com\//,
];

const UNAVAILABLE = /^(Search index not found|Search is unavailable)/;

// Console warnings from the current test's page.
let warnings: string[] = [];

test.beforeEach(async ({ page, baseURL }) => {
  await page.route(`${baseURL}/**`, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': CSP },
    });
  });
  await page.addInitScript(() => {
    const store = ((window as any).__cspViolations = [] as string[]);
    document.addEventListener('securitypolicyviolation', (e) => {
      store.push(`${e.effectiveDirective} ${e.blockedURI}`);
    });
  });
  warnings = [];
  page.on('console', (message) => {
    // Pagefind falls back to the main thread when its worker is blocked, so
    // a worker-src or WASM regression would otherwise only slow search down.
    // (CSP violations themselves are collected above.)
    if (/falling back to main thread/.test(message.text())) {
      warnings.push(message.text());
    }
  });
});

test.afterEach(async ({ page }) => {
  const violations: string[] = await page
    .evaluate(() => (window as any).__cspViolations || [])
    .catch(() => []);
  expect(
    violations.filter((v) => !KNOWN_VIOLATIONS.some((known) => known.test(v))),
    'CSP violations',
  ).toEqual([]);
  expect(warnings, 'Pagefind or CSP warnings').toEqual([]);
});

/** Lets any search still in flight (debounce, worker, fragments) finish. */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
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
  // Announced from a live region outside the popup.
  await expect(page.locator('.td-search__live').first()).toHaveText(
    /^\d+ results? in \S+ docs$/,
  );
});

test('search runs in the Pagefind web worker', async ({ page }) => {
  const workers: string[] = [];
  page.on('worker', (worker) => workers.push(worker.url()));
  await page.goto('/');
  await page.locator('.td-search__input').first().fill(QUERY);
  await expect(page.locator('.td-search__option').first()).toBeVisible();
  expect(
    workers.some((url) => url.includes('/pagefind/pagefind-worker.js')),
  ).toBe(true);
});

test('typing while the index loads still shows the final query', async ({
  page,
}) => {
  // Hold the WASM back so every keystroke lands before the index is ready.
  await page.route('**/pagefind/wasm.*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.fallback();
  });
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  await input.pressSequentially(QUERY, { delay: 40 });
  await expect(page.locator('.td-search__option').first()).toBeVisible();
  await expect(page.locator('.td-search__status').first()).toHaveText(
    /^\d+ results? in \S+ docs$/,
  );
});

test('a closed popup stays closed when a pending search finishes', async ({
  page,
}) => {
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  const panel = page.locator('.td-search__results').first();
  await input.fill(QUERY);
  await expect(panel.locator('.td-search__option').first()).toBeVisible();

  // Escape while the search for the edited query is pending.
  await input.press('s');
  await input.press('Escape');
  await settle(page);
  await expect(panel).toBeHidden();
  await expect(input).toHaveAttribute('aria-expanded', 'false');

  // ArrowDown reopens it, searching the current text.
  await input.press('ArrowDown');
  await expect(panel).toBeVisible();

  // Leaving the box while a search is pending.
  await input.press('Backspace');
  await input.blur();
  await settle(page);
  await expect(panel).toBeHidden();
});

test('arrow keys pick a result and Enter opens it', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('.td-search__input').first();
  await input.fill(QUERY);
  const first = page.locator('.td-search__option').first();
  await expect(first).toBeVisible();
  await input.press('ArrowDown');
  await expect(first).toHaveClass(/\bactive\b/);
  await expect(input).toHaveAttribute(
    'aria-activedescendant',
    (await first.getAttribute('id'))!,
  );
  const href = (await first.getAttribute('href'))!;
  await input.press('Enter');
  await page.waitForURL((url) => url.pathname === href);
});

test('editing the query drops the highlighted result', async ({ page }) => {
  await page.goto('/docs/2.dev/getting-started/');
  const input = page.locator('.td-search__input').first();
  await input.fill(QUERY);
  await expect(page.locator('.td-search__option').first()).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  // Enter right after typing searches the new text instead of opening the
  // option highlighted for the old one. Checked at once, not retried: the
  // next render would clear the highlight anyway.
  await input.press('s');
  expect(
    await input.evaluate((node) => node.getAttribute('aria-activedescendant')),
  ).toBeNull();
  await input.press('Enter');
  await page.waitForURL(/\/search\/\?q=samplings&v=2\.dev$/);
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

test('rapid Show more clicks add each result once', async ({ page }) => {
  await page.goto(`/search/?q=${QUERY}&v=all`);
  const results = page.locator('#td-search-page-results > li');
  const more = page.locator('#td-search-page-more');
  await expect(results).toHaveCount(10);
  await expect(more).toBeVisible();

  // Two clicks before the first batch has loaded.
  await more.evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await settle(page);
  await expect(results).toHaveCount(20);
  const hrefs = await results
    .locator('.td-search-page__title')
    .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  // Focus moves to the first new result.
  await expect(results.nth(10).locator('a').first()).toBeFocused();
});

test('changing the version waits for the Search button', async ({ page }) => {
  await page.goto(`/search/?q=${QUERY}`);
  await expect(page.locator('#td-search-page-status')).toHaveText(
    /results? for/,
  );
  const select = page.locator('#td-search-page-v');
  await select.selectOption('all');
  await settle(page);
  expect(new URL(page.url()).searchParams.get('v')).toBeNull();
  await page.locator('#td-search-page-form button[type=submit]').click();
  await page.waitForURL(/[?&]v=all\b/);
  await expect(page.locator('#td-search-page-status')).toHaveText(
    statusFor('all versions'),
  );
});

test('navbar search on the results page keeps its version', async ({
  page,
}) => {
  await page.goto(`/search/?q=${QUERY}&v=2.dev`);
  const input = page.locator('.td-search__input').first();
  await input.fill('collector');
  await expect(page.locator('.td-search__status').first()).toHaveText(
    /^\d+ results? in 2\.dev docs$/,
  );
  await input.press('Enter');
  await page.waitForURL(/\/search\/\?q=collector&v=2\.dev$/);
});

test('search reports an unavailable index instead of hanging', async ({
  page,
}) => {
  await page.route('**/pagefind/pagefind-entry.json*', (route) =>
    route.fulfill({ status: 404, body: 'Not found' }),
  );
  await page.goto(`/search/?q=${QUERY}`);
  await expect(page.locator('#td-search-page-status')).toHaveText(UNAVAILABLE);

  await page.goto('/');
  await page.locator('.td-search__input').first().fill(QUERY);
  await expect(page.locator('.td-search__status').first()).toHaveText(
    UNAVAILABLE,
  );
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the navbar search link keeps the docs version', async ({ page }) => {
    await page.goto('/docs/2.dev/getting-started/');
    const link = page.locator('#main_navbar li.d-lg-none a.nav-link');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/search/?v=2.dev');
    await link.click();
    await expect(page.locator('#td-search-page-v')).toHaveValue('2.dev');
  });

  test('sidebar search goes to the results page for the docs version', async ({
    page,
  }) => {
    await page.goto('/docs/2.dev/getting-started/');
    const input = page.locator('.td-sidebar__search .td-search__input');
    await expect(input).toBeVisible();
    await input.fill(QUERY);
    await expect(
      page.locator('.td-sidebar__search .td-search__option').first(),
    ).toBeVisible();
    // Enter must not submit Docsy's wrapping <form>.
    await input.press('Enter');
    await page.waitForURL(/\/search\/\?q=sampling&v=2\.dev$/);
  });

  test('long excerpts do not widen the page', async ({ page }) => {
    // Excerpts include a long comma-joined --feature-gates flag list.
    await page.goto('/search/?q=feature-gates&v=all');
    await expect(
      page.locator('#td-search-page-results > li').first(),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
