export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.PUBLIC_API_URL;
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('PUBLIC_API_URL no está configurada. Revisa tu archivo .env');
  }
  return baseUrl.replace(/\/+$/, '');
}

export function getAuthToken(): string {
  return localStorage.getItem('eternamente_token') || '';
}

export async function api<T = Record<string, unknown>>(
  endpoint: string,
  method: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${endpoint}`;
  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await resp.text();
  let json: T & { message?: string; raw?: string };
  try {
    json = text ? JSON.parse(text) : ({} as T);
  } catch {
    json = { raw: text } as T & { raw?: string };
  }

  if (!resp.ok) {
    const err = json as { message?: string; raw?: string };
    throw new Error(err.message || err.raw || `Error ${resp.status}`);
  }
  return json;
}
