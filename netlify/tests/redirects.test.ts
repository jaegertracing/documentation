// Test redirects against a live site
// Run from netlify/ folder: deno run --allow-net tests/redirects.test.ts <base-url>
// Example: deno run --allow-net tests/redirects.test.ts https://deploy-preview-123--jaegertracing.netlify.app

const baseUrl = Deno.args[0];

if (!baseUrl) {
  console.error('Usage: deno run --allow-net tests/redirects.test.ts <base-url>');
  console.error('Example: deno run --allow-net tests/redirects.test.ts https://jaegertracing.io');
  Deno.exit(1);
}

// Remove trailing slash from base URL
const base = baseUrl.replace(/\/$/, '');

// Test cases: [input path, expected redirect path (null = no redirect)]
const tests = [
  { input: '/docs/1.57', expectedRedirect: '/docs/1.76' },
  { input: '/docs/1.65/', expectedRedirect: '/docs/1.76/' },
  { input: '/docs/1.13/faq/', expectedRedirect: '/docs/1.76/faq/' },
  { input: '/docs/1.50/deployment/cli/', expectedRedirect: '/docs/1.76/deployment/cli/' },
  { input: '/docs/1.18/client-libraries/', expectedRedirect: '/docs/1.76/client-libraries/' },
  // Last v1, no redirect
  { input: '/docs/1.76/', expectedRedirect: null },
  { input: '/docs/1.76/faq/', expectedRedirect: null },
  // Last v2, no redirect
  { input: '/docs/2.1/apis/', expectedRedirect: '/docs/2.1/architecture/apis/' },
  { input: '/docs/2.14/architecture/', expectedRedirect: null },
];

console.log(`Testing redirects against: ${base}\n`);

let passed = 0;
let failed = 0;

for (const { input, expectedRedirect } of tests) {
  const url = `${base}${input}`;

  try {
    // Don't follow redirects automatically
    const response = await fetch(url, { redirect: 'manual' });
    const location = response.headers.get('location');
    const isRedirect = response.status === 301 || response.status === 302;

    let ok: boolean;
    let result: string;

    if (expectedRedirect === null) {
      // Expect no redirect
      ok = !isRedirect;
      result = ok ? `${response.status} (no redirect)` : `${response.status} → ${location}`;
    } else {
      // Expect redirect to specific path
      const expectedLocation = `${base}${expectedRedirect}`;
      // Also check for relative redirects
      ok = isRedirect && (location === expectedLocation || location === expectedRedirect);
      result = isRedirect ? `${response.status} → ${location}` : `${response.status} (no redirect)`;
    }

    const status = ok ? '✓' : '✗';
    console.log(`${status} ${input} → ${result}`);

    if (!ok) {
      const expected = expectedRedirect
        ? `301/302 → ${base}${expectedRedirect}`
        : 'no redirect';
      console.log(`  Expected: ${expected}`);
      failed++;
    } else {
      passed++;
    }
  } catch (error) {
    console.log(`✗ ${input} → ERROR: ${error.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
console.log(`Base URL: ${base}`);

if (failed > 0) {
  Deno.exit(1);
}
