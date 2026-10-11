import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorBox, Icon, Spinner, StatusBadge, btnPrimary, inputCls } from '../components/ui';
import { api } from '../lib/api';
import { dateOnly } from '../lib/format';
import type { Order } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function TrackOrder() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [num, setNum] = useState(params.get('order') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { data: recent } = useApi<Order[]>('/orders/mine');

  const go = async (value: string) => {
    if (!value.trim()) return;
    setBusy(true); setError('');
    try { const o = await api.get<Order>(`/orders/track/${encodeURIComponent(value.trim())}`); nav(`/orders/${o.id}`); }
    catch (e) { setError((e as Error).message); setBusy(false); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); void go(num); };
  useEffect(() => { if (params.get('order')) void go(params.get('order')!); /* eslint-disable-next-line */ }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-container-low text-primary flex items-center justify-center"><Icon name="local_shipping" className="text-3xl" /></div>
        <h1 className="font-serif text-3xl font-semibold mt-4">Track your order</h1>
        <p className="text-sm text-on-surface-variant mt-2">Enter the order number from your confirmation, for example MH1001.</p>
      </div>
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Order number" aria-label="Order number" className={`${inputCls} uppercase`} />
        <button className={btnPrimary} disabled={busy || !num.trim()}>{busy ? <Spinner className="border-white/40 border-t-white" /> : 'Track'}</button>
      </form>
      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      {recent && recent.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-sm mb-3">Your recent orders</h2>
          <ul className="space-y-2">
            {recent.slice(0, 4).map((o) => (
              <li key={o.id}><Link to={`/orders/${o.id}`} className="flex items-center justify-between bg-white border border-border-warm rounded-xl px-4 py-3 hover:border-primary">
                <div><div className="font-semibold text-sm">{o.orderNumber}</div><div className="text-xs text-text-muted">{dateOnly(o.createdAt)}</div></div><StatusBadge status={o.status} />
              </Link></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
