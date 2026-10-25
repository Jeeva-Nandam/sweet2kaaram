import { useEffect, useState } from 'react';
import { Empty, ErrorBox, Icon, PageLoader, inputCls, useToast } from '../components/ui';
import { dateOnly, rupees } from '../lib/format';
import { api, qs } from '../lib/api';

interface Row { id: string; name: string; email: string; picture: string; phone: string; city: string; orders: number; spent: number; lastOrderAt: string | null; createdAt: string; }

export default function Customers() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { api.get<Row[]>(`/admin/customers${qs({ q })}`).then(setRows).catch((e: Error) => setError(e.message)); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const remove = async (customer: Row) => {
    const orderWord = customer.orders === 1 ? 'order' : 'orders';
    if (!window.confirm(`Permanently delete ${customer.name} and their ${customer.orders} ${orderWord}? This cannot be undone.`)) return;
    setDeleting(customer.id);
    try {
      await api.del(`/admin/customers/${customer.id}`);
      setRows((current) => current?.filter((row) => row.id !== customer.id) ?? null);
      toast.ok('Customer and linked orders deleted');
    } catch (e) { toast.err((e as Error).message); } finally { setDeleting(null); }
  };
  return (
    <div className="max-w-6xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold">Customers</h1>
      <input className={`${inputCls} max-w-md`} placeholder="Search name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
      {error && <ErrorBox message={error} />}
      {!rows && !error && <PageLoader />}
      {rows && rows.length === 0 && <div className="bg-white border border-border-warm rounded-2xl"><Empty icon="group" title="No customers yet" text="Customers appear here after they log in with Google." /></div>}
      {rows && rows.length > 0 && (
        <div className="bg-white border border-border-warm rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[40rem]">
            <thead className="text-left text-xs text-text-muted border-b border-border-warm"><tr><th className="p-3">Customer</th><th className="p-3">Phone</th><th className="p-3">City</th><th className="p-3">Orders</th><th className="p-3">Spent</th><th className="p-3">Last order</th><th className="p-3">Joined</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{rows.map((c) => (
              <tr key={c.id} className="border-b border-border-warm last:border-0">
                <td className="p-3"><div className="flex items-center gap-3">{c.picture ? <img src={c.picture} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full" /> : <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold">{c.name[0]}</span>}<div><div className="font-semibold">{c.name}</div><div className="text-xs text-text-muted">{c.email}</div></div></div></td>
                <td className="p-3">{c.phone || '—'}</td><td className="p-3">{c.city || '—'}</td><td className="p-3 font-semibold">{c.orders}</td><td className="p-3 font-semibold">{rupees(c.spent)}</td>
                <td className="p-3">{c.lastOrderAt ? dateOnly(c.lastOrderAt) : '—'}</td><td className="p-3">{dateOnly(c.createdAt)}</td>
                <td className="p-3"><button aria-label={`Delete customer ${c.name} and linked orders`} title="Delete customer and linked orders" disabled={deleting === c.id} className="p-2 text-on-surface-variant hover:text-error disabled:opacity-50 cursor-pointer" onClick={() => remove(c)}><Icon name={deleting === c.id ? 'hourglass_top' : 'delete'} className="text-xl" /></button></td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
