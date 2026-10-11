import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { Category, Settings } from '../lib/types';

const DEFAULTS: Settings = {
  storeName: 'Sweet2Kaaram', tagline: 'The Soul of Native Taste', announcement: '', isAcceptingOrders: true, pausedMessage: '',
  freeShippingThreshold: 699, shippingFee: 80, codEnabled: true, onlinePaymentEnabled: false,
  contactPhone: '', contactEmail: 'sweet2karram26@gmail.com', whatsapp: '', address: '', heroImage: '', heroTitle: '', heroSubtitle: '',
};

interface StoreState { settings: Settings; categories: Category[]; ready: boolean; error: string; reload: () => void; }
const Ctx = createContext<StoreState>(null as unknown as StoreState);
export const useStore = () => useContext(Ctx);

/** Store-wide public data (settings + categories). Loaded once; everything else is fetched per page. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setError('');
    Promise.all([api.get<Settings>('/settings'), api.get<Category[]>('/categories')])
      .then(([s, c]) => {
        setSettings({
          ...DEFAULTS,
          ...s,
          contactEmail: s.contactEmail || DEFAULTS.contactEmail,
        });
        setCategories(c);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setReady(true));
  }, []);
  useEffect(reload, [reload]);

  return <Ctx.Provider value={{ settings, categories, ready, error, reload }}>{children}</Ctx.Provider>;
}
