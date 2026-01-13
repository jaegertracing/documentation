// Tests for docs-1x-redirect
//
// Run from repo's netlify/ folder: deno run tests/docs-1x-redirect.test.ts

import handler from '../edge-functions/docs-1x-redirect.ts';

// Mock Netlify context
const mockContext = {
  next: () => new Response(null, { status: 200 }),
} as Parameters<typeof handler>[1];

// Helper to create a mock request
function createRequest(path: string): Request {
  return new Request(`https://jaegertracing.io${path}`);
}

// Test cases
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
  { input: '/docs/2.1/apis/', expectedRedirect: null },
  { input: '/docs/2.14/architecture/', expectedRedirect: null },
];

console.log('Testing docs-1x-redirect handler:\n');

let passed = 0;
let failed = 0;

for (const { input, expectedRedirect } of tests) {
  const request = createRequest(input);
  const response = await handler(request, mockContext);

  const location = response.headers.get('location');
  const isRedirect = response.status === 301;

  let ok: boolean;
  let result: string;

  if (expectedRedirect === null) {
    // Expect no redirect (pass-through)
    ok = !isRedirect;
    result = ok ? '(no redirect)' : `unexpected redirect to ${location}`;
  } else {
    // Expect redirect
    const expectedLocation = `https://jaegertracing.io${expectedRedirect}`;
    ok = isRedirect && location === expectedLocation;
    result = isRedirect ? location! : '(no redirect)';
  }

  const status = ok ? '✓' : '✗';
  console.log(`${status} ${input} → ${result}`);

  if (!ok) {
    const expected = expectedRedirect
      ? `https://jaegertracing.io${expectedRedirect}`
      : '(no redirect)';
    console.log(`  Expected: ${expected}`);
    failed++;
  } else {
    passed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  Deno.exit(1);
}
