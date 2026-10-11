import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../lib/api';

interface AdminState {
  admin: { email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
const Ctx = createContext<AdminState>(null as unknown as AdminState);
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(!!tokens.get('admin'));

  useEffect(() => {
    if (!tokens.get('admin')) return;
    api.get<{ admin: string }>('/admin/ping')
      .then((r) => setAdmin({ email: r.admin }))
      .catch(() => tokens.clear('admin'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === 'admin') { tokens.clear('admin'); setAdmin(null); }
    };
    window.addEventListener('mh:unauthorized', h);
    return () => window.removeEventListener('mh:unauthorized', h);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ token: string; admin: { email: string } }>('/auth/admin/login', { email, password });
    tokens.set('admin', r.token);
    setAdmin(r.admin);
  }, []);
  const logout = useCallback(() => { tokens.clear('admin'); setAdmin(null); }, []);

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}
