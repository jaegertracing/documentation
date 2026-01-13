import type { Context } from 'https://edge.netlify.com';

const V1_LAST = '1.76';

export default async function handler(
  request: Request,
  context: Context,
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  const match = path.match(/^\/docs\/(1\.\d+)(\/.*)?$/);
  if (!match || match[1] === V1_LAST) {
    return context.next();
  }
  const splat = match[2] ?? '';
  const newPath = `/docs/${V1_LAST}${splat}`;
  const newUrl = new URL(newPath, url.origin);
  newUrl.search = url.search;

  return Response.redirect(newUrl.toString(), 301);
}
