// Browser tests for the Pagefind site search in assets/js/search.js.
// They run against the built site in public/, so `npm run build` (which also
// builds the search index) must run first; `npm run test:search` does both.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  use: { baseURL: 'http://localhost:1414' },
  webServer: {
    // Pagefind serves the site directory from pagefind.yml on port 1414.
    command: 'npx --no-install pagefind --serve',
    url: 'http://localhost:1414/',
    reuseExistingServer: !process.env.CI,
  },
  reporter: process.env.CI ? 'github' : 'list',
});
