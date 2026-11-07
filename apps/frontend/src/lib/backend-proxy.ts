import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

function upstreamApiBase(): string {
  return (process.env.API_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
}

function buildUpstreamUrl(request: NextRequest, pathSegments: string[]): URL {
  const path = pathSegments.length > 0 ? pathSegments.join('/') : '';
  const url = new URL(`${upstreamApiBase()}/api/${path}`);
  url.search = request.nextUrl.search;
  return url;
}

function forwardRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  return headers;
}

function forwardResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === 'content-encoding') return;
    headers.append(key, value);
  });
  return headers;
}

export async function proxyApiRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const url = buildUpstreamUrl(request, pathSegments);
  const headers = forwardRequestHeaders(request);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch {
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const responseHeaders = forwardResponseHeaders(upstream);
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
