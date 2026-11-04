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
  if (!match) throw new Error('netlify.toml has no Content-Security-Policy');
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
const pages = [
  '/',
  `/docs/${latestV2()}/architecture/spm/`,
  '/search/?q=sampling',
];

declare global {
  interface Window {
    cspViolations: string[];
  }
}

for (const path of pages) {
  test(`${path} loads without CSP violations`, async ({ page }) => {
    const csp = productionCsp();
    // The static server sends no headers, so the policy is added to every
    // HTML response the way Netlify adds it.
    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const type = response.headers()['content-type'] ?? '';
      if (!type.includes('text/html')) return route.fulfill({ response });
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
    // Mermaid renders after load, and a blocked worker or font shows up
    // only once the page has settled.
    await page.waitForTimeout(500);
    const violations = await page.evaluate(() => window.cspViolations);
    expect(violations).toEqual([]);
  });
}
