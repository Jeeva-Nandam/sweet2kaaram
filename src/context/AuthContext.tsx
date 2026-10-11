import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../lib/api';
import type { Address, User } from '../lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setAddresses: (a: Address[]) => void;
}
const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokens.get('customer'));

  useEffect(() => {
    if (!tokens.get('customer')) return;
    api.get<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokens.clear('customer'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      if ((e as CustomEvent).detail === 'customer') { tokens.clear('customer'); setUser(null); }
    };
    window.addEventListener('mh:unauthorized', h);
    return () => window.removeEventListener('mh:unauthorized', h);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/google', { credential });
    tokens.set('customer', r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => { tokens.clear('customer'); setUser(null); }, []);
  const setAddresses = useCallback((addresses: Address[]) => setUser((u) => (u ? { ...u, addresses } : u)), []);

  return <Ctx.Provider value={{ user, loading, loginWithGoogle, logout, setAddresses }}>{children}</Ctx.Provider>;
}
