/**
 * URL base del API.
 * - Local: PUBLIC_API_URL=http://localhost:8080 en .env
 * - Vercel: dejar vacío para usar el proxy de vercel.json (mismo origen, sin CORS)
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

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { timestamp?: string; version?: string };
  error?: { code?: string; message?: string };
}

function unwrapResponse<T>(json: unknown): T {
  if (
    json &&
    typeof json === 'object' &&
    'success' in json &&
    'data' in json
  ) {
    const envelope = json as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new Error(envelope.error?.message || 'Error en la respuesta del servidor');
    }
    return envelope.data;
  }
  return json as T;
}

function networkErrorMessage(url: string, cause: unknown): string {
  const hint =
    typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? ' Comprueba que el backend en Render esté activo.'
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

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
    headers.Authorization = `Bearer ${token}`;
    headers['X-Auth-Token'] = token;
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
    });
  } catch (err) {
    throw new Error(networkErrorMessage(url, err));
  }

  const text = await resp.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!resp.ok) {
    const envelope = json as ApiEnvelope<unknown>;
    const message =
      envelope?.error?.message ||
      (json as { message?: string })?.message ||
      (json as { raw?: string })?.raw ||
      `Error ${resp.status}`;
    if (resp.status === 401) {
      throw new Error('No autorizado. Cierra sesión y vuelve a entrar.');
    }
    throw new Error(message);
  }

  return unwrapResponse<T>(json);
}
