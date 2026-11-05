// Browser tests against the Hugo output in public/: the Pagefind site search
// and the Content-Security-Policy check. A build must run first;
// `npm run test:browser` does both. That build uses the production environment,
// so the analytics markup that Hugo emits only in production is covered, and a
// placeholder measurement ID, because the real one lives in Netlify's settings.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  use: { baseURL: 'http://localhost:1414' },
  webServer: {
    // Pagefind indexes the site directory from pagefind.yml, then serves it
    // on port 1414. The index is built here, so the postbuild hook is skipped
    // by running _build instead of build.
    command: 'npm run _pagefind -- --serve',
    url: 'http://localhost:1414/',
    reuseExistingServer: !process.env.CI,
  },
  // The github reporter only annotates failures; list prints every test.
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
});
