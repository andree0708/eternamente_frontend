/**
 * URL base del API.
 * - Local: PUBLIC_API_URL=http://localhost:8080 en .env
 * - Vercel: dejar vacío o "/" para usar el proxy de vercel.json (mismo origen, sin CORS)
 */
export function getApiBaseUrl(): string {
  const configured = (import.meta.env.PUBLIC_API_URL as string | undefined)?.trim();

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');

    if (isLocal && configured) {
      return configured.replace(/\/+$/, '');
    }

    // Producción en Vercel: rutas relativas → proxy en vercel.json
    if (!isLocal) {
      if (!configured || configured === '/' || configured === 'PROXY') {
        return '';
      }
      return configured.replace(/\/+$/, '');
    }
  }

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  return 'http://localhost:8080';
}

export function getAuthToken(): string {
  return localStorage.getItem('eternamente_token') || '';
}

function networkErrorMessage(url: string, cause: unknown): string {
  const hint =
    typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? ' Comprueba que el backend en Render esté activo y que hayas redesplegado front y back.'
      : ' ¿Está el backend en marcha (puerto 8080)?';
  const detail = cause instanceof Error ? cause.message : String(cause);
  return `No se pudo conectar con el servidor (${url}).${hint} Detalle: ${detail}`;
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

  const base = getApiBaseUrl();
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = base ? `${base}${path}` : path;

  let resp: Response;
  try {
    resp = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      mode: 'cors',
    });
  } catch (err) {
    throw new Error(networkErrorMessage(url, err));
  }

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
