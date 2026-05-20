// Minimal HTTP client for integration tests — uses the global fetch (Node 20+),
// so no extra test dependency is needed.

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

export async function apiRequest<T = Record<string, unknown>>(
  baseUrl: string,
  method: string,
  path: string,
  opts: { body?: unknown; token?: string } = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body: body as T };
}
