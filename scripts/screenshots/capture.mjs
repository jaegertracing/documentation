// This script captures the Jaeger UI screenshots under static/img/frontend-ui/
// in a light and a dark variant each, from Jaeger instances that run locally.
// README.md in this directory says which stack serves which capture and how to
// start it. Run it from the repository root, with the names of the captures
// to take; the captures need different stacks, so there is no "all":
//
//   node scripts/screenshots/capture.mjs search-results trace-timeline
//
// Environment: JAEGER_URL (default http://localhost:16686), TRACE_ID for the
// trace-timeline and grafana-embedded captures, GENAI_TRACE_ID for the
// genai-trace capture, GRAFANA_URL (default http://localhost:3000) for the
// grafana-embedded capture.
import { chromium } from '@playwright/test';

const base = process.env.JAEGER_URL ?? 'http://localhost:16686';
const grafana = process.env.GRAFANA_URL ?? 'http://localhost:3000';
const outDir = 'static/img/frontend-ui';
const viewport = { width: 1600, height: 1000 };
const resultsReady = 'text=/\\d+ traces? \\(in/';

// Each capture drives the page to the state to photograph. A capture may
// return a height to crop the viewport screenshot to, when the page has
// empty space below its content.
const captures = {
  'search-results': async (page) => {
    await page.goto(`${base}/search?service=frontend&limit=20&lookback=1h`);
    await page.waitForSelector(resultsReady);
  },
  'trace-timeline': async (page) => {
    await page.goto(`${base}/trace/${required('TRACE_ID')}`);
    await page.waitForSelector('.span-name-wrapper');
    await page.waitForTimeout(1500);
    await enableSidePanel(page);
    await page.locator('.span-name-wrapper').nth(3).click();
    await page.waitForTimeout(1000);
  },
  'system-architecture': async (page) => {
    await page.goto(`${base}/dependencies`);
    await page.waitForTimeout(4000);
  },
  'deep-dependency-graph': async (page) => {
    await page.goto(`${base}/search?service=frontend&limit=20&lookback=1h`);
    await page.waitForSelector(resultsReady);
    await page.getByRole('button', { name: 'Deep Dependency Graph' }).click();
    await page.waitForTimeout(5000);
  },
  'ai-assistant': async (page) => {
    await page.goto(`${base}/search?service=frontend&limit=20&lookback=1h`);
    await page.waitForSelector(resultsReady);
    await page.getByRole('button', { name: 'Open assistant panel' }).click();
    await page
      .getByPlaceholder('Message Jaeger…')
      .fill(
        'Which service causes the errors in the frontend traces from the last hour? Answer in three sentences.'
      );
    await page.getByRole('button', { name: 'Send' }).click();
    // The Send button stays disabled while the input is empty, so the end of
    // the answer shows as the panel text no longer changing. A turn that fails
    // shows "Failed <tool>" instead of "Called <tool>" and is reported.
    const deadline = Date.now() + 180_000;
    let last = '';
    for (let stable = 0; stable < 3; ) {
      if (Date.now() > deadline) throw new Error('the assistant did not finish within 3 minutes');
      await page.waitForTimeout(2000);
      const text = await panelText(page);
      if (/Failed jaeger/.test(text)) throw new Error(`a tool call failed:\n${text}`);
      if (text === last && /Called jaeger/.test(text) && text.length > 400) stable += 1;
      else stable = 0;
      last = text;
    }
    // Scroll the conversation back to the top so the tool calls are visible.
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find(
        (e) => e.children.length === 0 && /Called jaeger/.test(e.textContent)
      );
      let n = el;
      while (n && n.scrollHeight <= n.clientHeight + 2) n = n.parentElement;
      if (n) n.scrollTop = 0;
    });
    await page.waitForTimeout(500);
  },
  'genai-trace': async (page) => {
    await page.goto(`${base}/trace/${required('GENAI_TRACE_ID')}`);
    await page.waitForSelector('.span-name-wrapper');
    await page.waitForTimeout(1500);
    await enableSidePanel(page);
    await page.locator('.span-name-wrapper').filter({ hasText: /search_traces/ }).nth(1).click();
    await page.waitForTimeout(800);
    await page.getByRole('tab', { name: 'GenAI' }).click();
    await page.waitForTimeout(800);
  },
  spm: async (page) => {
    await page.goto(`${base}/monitor`);
    await page.waitForSelector('.select-a-service-input');
    await page.waitForTimeout(2000);
    await page.locator('.select-a-service-input').click();
    await page.locator('.ant-select-item-option').filter({ hasText: /^redis$/ }).click();
    await page.waitForTimeout(1000);
    await page.locator('.select-a-timeframe-input').click();
    await page.locator('.ant-select-item-option').filter({ hasText: 'Last 15 minutes' }).click();
    await page.mouse.move(800, 900);
    await page.waitForTimeout(4000);
    return 705;
  },
  'grafana-embedded': async (page, theme) => {
    const dashboard = `${grafana}/d/jaeger-panel-phase1/jaeger-traces`;
    const query = `orgId=1&theme=${theme}&var-service=frontend&var-traceId=${required('TRACE_ID')}`;
    await page.goto(`${dashboard}?${query}`);
    await page.waitForTimeout(8000);
    return 912;
  },
};

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// The side panel for span details is an option in the trace view settings
// menu. Each capture runs in a fresh browser context, so the option is off
// and one click turns it on.
async function enableSidePanel(page) {
  await page.getByRole('button', { name: 'Trace view settings' }).click();
  await page.getByText('Show Span in Sidebar').click();
  await page.waitForTimeout(500);
}

function panelText(page) {
  return page.evaluate(() => {
    const title = [...document.querySelectorAll('*')].find(
      (e) => e.children.length === 0 && e.textContent.trim() === 'Ask Jaeger'
    );
    let n = title;
    while (n && !n.querySelector('textarea')) n = n.parentElement;
    return n ? n.innerText : '';
  });
}

async function capture(browser, name, theme) {
  const ctx = await browser.newContext({ viewport, colorScheme: theme, deviceScaleFactor: 1 });
  // Jaeger UI keeps its color mode in localStorage; Grafana keeps the docked
  // state of its navigation menu there, and the menu is hidden for the capture.
  await ctx.addInitScript((t) => {
    localStorage.setItem('jaeger-ui-theme', JSON.stringify(t));
    localStorage.setItem('grafana.navigation.docked', 'false');
  }, theme);
  const page = await ctx.newPage();
  const height = (await captures[name](page, theme)) ?? viewport.height;
  await page.waitForTimeout(500);
  const file = `${outDir}/${name}${theme === 'dark' ? '-dark' : ''}.png`;
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: viewport.width, height } });
  console.log(file);
  await ctx.close();
}

const names = process.argv.slice(2);
if (!names.length) throw new Error(`name the captures to take: ${Object.keys(captures).join(', ')}`);
const unknown = names.filter((n) => !captures[n]);
if (unknown.length) throw new Error(`unknown captures: ${unknown.join(', ')}`);
const browser = await chromium.launch();
for (const name of names) {
  for (const theme of ['light', 'dark']) await capture(browser, name, theme);
}
await browser.close();
