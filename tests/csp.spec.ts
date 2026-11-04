// This test loads built pages with the Content-Security-Policy from
// netlify.toml enforced and fails if the browser blocks any resource. Netlify
// adds the header at serve time, so no other check sees it: a resource the
// policy does not allow fails silently in production, as the Google Fonts
// stylesheet and the analytics scripts did for months after the header
// arrived. The site is built for the production environment with a
// placeholder measurement ID, so the analytics markup is present too.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

/** The Content-Security-Policy value that netlify.toml sets for every page. */
function productionCsp(): string {
  const toml = readFileSync('netlify.toml', 'utf8');
  const match = /^\s*Content-Security-Policy\s*=\s*"([^"]*)"/m.exec(toml);
  // A policy that the regex read only in part would make the test pass for
  // the wrong reason, so the value must at least carry its default directive.
  if (!match?.[1].includes('default-src')) {
    throw new Error('netlify.toml has no readable Content-Security-Policy');
  }
  return match[1];
}

/** The current v2 docs version, as hugo.yaml declares it. */
function latestV2(): string {
  const match = /^\s*latestV2:\s*["']?([\d.]+)/m.exec(
    readFileSync('hugo.yaml', 'utf8'),
  );
  if (!match) throw new Error('hugo.yaml has no latestV2');
  return match[1];
}

// Together these pages load every kind of resource the site uses: fonts,
// analytics, the Mermaid bundle on the SPM architecture page, and Pagefind.
// The `ready` selector is an element that appears only once the page's
// scripts have finished, so a blocked script fails the test even when the
// browser fires no violation event the document can see.
const pages = [
  { path: '/', ready: 'footer' },
  { path: `/docs/${latestV2()}/architecture/spm/`, ready: '.mermaid svg' },
  { path: '/search/?q=sampling', ready: '#td-search-page-results > li' },
];

declare global {
  interface Window {
    cspViolations: string[];
  }
}

for (const { path, ready } of pages) {
  test(`${path} loads without CSP violations`, async ({ page }) => {
    const csp = productionCsp();
    // The static server sends no headers, so the policy is added to every
    // response the way Netlify adds it. Workers take their policy from their
    // own script's response, so HTML responses alone would not be enough.
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const headers = { ...response.headers(), 'content-security-policy': csp };
      return route.fulfill({ response, headers });
    });
    // The browser fires one event per blocked resource, before any script in
    // the page runs, so the listener is installed by an init script.
    await page.addInitScript(() => {
      window.cspViolations = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        window.cspViolations.push(
          `${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`,
        );
      });
    });
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator(ready).first()).toBeVisible();
    const violations = await page.evaluate(() => window.cspViolations);
    expect(violations).toEqual([]);
  });
}
