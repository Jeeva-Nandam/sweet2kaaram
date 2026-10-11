import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '../lib/types';

export interface CartLine { product: Product; quantity: number; }
interface CartState {
  lines: CartLine[];
  count: number;
  couponCode: string;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCouponCode: (c: string) => void;
}
const Ctx = createContext<CartState>(null as unknown as CartState);
export const useCart = () => useContext(Ctx);

const KEY = 'mh_cart_v2';
const MAX = 20;

function load(): { lines: CartLine[]; couponCode: string } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { lines: Array.isArray(raw.lines) ? raw.lines : [], couponCode: typeof raw.couponCode === 'string' ? raw.couponCode : '' };
  } catch { return { lines: [], couponCode: '' }; }
}

const cap = (p: Product) => Math.max(1, Math.min(MAX, p.stock || MAX));

/** Guests can fill a cart. It lives in this browser and is kept after login. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const add = useCallback((p: Product, qty = 1) => setState((s) => {
    const found = s.lines.find((l) => l.product.id === p.id);
    const lines = found
      ? s.lines.map((l) => (l.product.id === p.id ? { product: p, quantity: Math.min(cap(p), l.quantity + qty) } : l))
      : [...s.lines, { product: p, quantity: Math.min(cap(p), qty) }];
    return { ...s, lines };
  }), []);
  const setQty = useCallback((id: string, qty: number) => setState((s) => ({
    ...s,
    lines: s.lines.map((l) => (l.product.id === id ? { ...l, quantity: Math.max(1, Math.min(cap(l.product), qty)) } : l)),
  })), []);
  const remove = useCallback((id: string) => setState((s) => ({ ...s, lines: s.lines.filter((l) => l.product.id !== id) })), []);
  const clear = useCallback(() => setState({ lines: [], couponCode: '' }), []);
  const setCouponCode = useCallback((couponCode: string) => setState((s) => ({ ...s, couponCode })), []);

  const value = useMemo<CartState>(() => ({
    lines: state.lines, couponCode: state.couponCode,
    count: state.lines.reduce((n, l) => n + l.quantity, 0),
    add, setQty, remove, clear, setCouponCode,
  }), [state, add, setQty, remove, clear, setCouponCode]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
