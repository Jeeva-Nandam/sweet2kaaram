const BASE = ((import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export type Who = 'customer' | 'admin';
const KEY: Record<Who, string> = { customer: 'mh_token', admin: 'mh_admin_token' };

export const tokens = {
  get: (w: Who) => { try { return localStorage.getItem(KEY[w]); } catch { return null; } },
  set: (w: Who, t: string) => { try { localStorage.setItem(KEY[w], t); } catch { /* private mode */ } },
  clear: (w: Who) => { try { localStorage.removeItem(KEY[w]); } catch { /* ignore */ } },
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const who: Who = path.startsWith('/admin') ? 'admin' : 'customer';
  const token = path === '/auth/admin/login' || path === '/auth/google' ? null : tokens.get(who);
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your internet connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent('mh:unauthorized', { detail: who }));
    throw new ApiError(res.status, (data as { message?: string }).message || 'Something went wrong. Please try again.');
  }
  return data as T;
}

export const api = {
  get: <T,>(p: string) => request<T>('GET', p),
  post: <T,>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  put: <T,>(p: string, b: unknown) => request<T>('PUT', p, b),
  patch: <T,>(p: string, b: unknown) => request<T>('PATCH', p, b),
  del: <T,>(p: string) => request<T>('DELETE', p),
};

export const qs = (o: Record<string, string | number | undefined | null | false>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
