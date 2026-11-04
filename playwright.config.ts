// Browser tests for the Pagefind site search in assets/js/search.js.
// They run against the Hugo output in public/, so a build must run first;
// `npm run test:search` does both.
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
