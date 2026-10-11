import { useCallback, useEffect, useState } from 'react';
import { Empty, ErrorBox, Img, PageLoader, Spinner, btnGhost, btnPrimary, inputCls, useToast } from '../components/ui';
import { api, qs } from '../lib/api';
import type { Page, Product } from '../lib/types';

export default function Inventory() {
  const toast = useToast();
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Product> | null>(null);
  const [error, setError] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    api.get<Page<Product>>(`/admin/products${qs({ state, q, page, limit: 20 })}`).then(setData).catch((e: Error) => setError(e.message));
  }, [state, q, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => setPage(1), [state, q]);

  const save = async (p: Product) => {
    const v = Number(edits[p.id]);
    if (!Number.isInteger(v) || v < 0) return toast.err('Enter a whole number, 0 or more');
    setBusy(p.id);
    try {
      await api.patch(`/admin/products/${p.id}/stock`, { stock: v });
      setEdits((e) => { const n = { ...e }; delete n[p.id]; return n; });
      toast.ok(`${p.name}: stock set to ${v}`); load();
    } catch (e) { toast.err((e as Error).message); } finally { setBusy(''); }
  };

  return (
    <div className="max-w-5xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold">Inventory</h1>
      <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
        <input className={inputCls} placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className={inputCls} value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter"><option value="">All products</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
      </div>
      {error && <ErrorBox message={error} onRetry={() => { setError(''); load(); }} />}
      {!data && !error && <PageLoader />}
      {data && data.items.length === 0 && <div className="bg-white border border-border-warm rounded-2xl"><Empty icon="warehouse" title="Nothing to show" text="Add products first, or change the filter." /></div>}
      {data && data.items.length > 0 && (
        <ul className="bg-white border border-border-warm rounded-2xl divide-y divide-border-warm">
          {data.items.map((p) => {
            const dirty = edits[p.id] !== undefined && edits[p.id] !== String(p.stock);
            return (
              <li key={p.id} className="p-4 flex flex-wrap items-center gap-4">
                <Img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 min-w-40"><div className="font-semibold text-sm">{p.name}</div><div className="text-xs text-text-muted">{p.weight} · alert at {p.lowStockThreshold}</div></div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock <= p.lowStockThreshold ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{p.stock === 0 ? 'Out of stock' : p.stock <= p.lowStockThreshold ? 'Low' : 'OK'}</span>
                <input type="number" min={0} aria-label={`Stock for ${p.name}`} className={`${inputCls} w-24`} value={edits[p.id] ?? String(p.stock)} onChange={(e) => setEdits((x) => ({ ...x, [p.id]: e.target.value }))} />
                <button className={dirty ? btnPrimary : btnGhost} disabled={!dirty || busy === p.id} onClick={() => save(p)}>{busy === p.id ? <Spinner /> : 'Save'}</button>
              </li>
            );
          })}
        </ul>
      )}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>Page {data.page} of {data.pages}</span>
          <button className={btnGhost} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
