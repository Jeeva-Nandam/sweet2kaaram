import { Link } from 'react-router-dom';
import { ErrorBox, Icon, Img, PageLoader, StatusBadge } from '../components/ui';
import { dateTime, rupees, STATUS_LABEL } from '../lib/format';
import type { Category, Order, OrderStatus, Product } from '../lib/types';
import { useApi } from '../lib/useApi';

interface Stats {
  revenue: number; orders: number; todayOrders: number; todayRevenue: number; pending: number; inTransit: number;
  statusCounts: Record<string, number>; customers: number; products: number; outOfStock: number;
  last7: { date: string; orders: number; revenue: number }[]; recentOrders: Order[]; lowStock: Product[];
  topProducts: { id: string; name: string; image: string; sold: number; revenue: number }[];
}

const Card = ({ icon, label, value, sub, to }: { icon: string; label: string; value: string | number; sub?: string; to?: string }) => {
  const body = (
    <div className="bg-white border border-border-warm rounded-2xl p-4 h-full hover:border-primary transition-colors">
      <div className="flex items-center gap-2 text-text-muted text-sm"><Icon name={icon} className="text-xl text-primary" />{label}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {sub && <div className="text-xs text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
};

export default function Dashboard() {
  const { data: s, loading, error, reload } = useApi<Stats>('/admin/stats');
  const cats = useApi<Category[]>('/admin/categories');
  if (loading && !s) return <PageLoader />;
  if (error || !s) return <ErrorBox message={error || 'Could not load the dashboard'} onRetry={reload} />;

  const max = Math.max(1, ...s.last7.map((d) => d.revenue));
  const fresh = s.products === 0;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between"><h1 className="font-serif text-3xl font-semibold">Dashboard</h1><button onClick={reload} className="text-sm font-semibold text-primary flex items-center gap-1 cursor-pointer"><Icon name="refresh" className="text-lg" />Refresh</button></div>

      {fresh && (
        <section className="bg-white border border-primary/30 rounded-2xl p-5">
          <h2 className="font-serif text-xl font-semibold">Let’s set up your store</h2>
          <ol className="mt-3 space-y-2 text-sm">
            {[
              [(cats.data?.length ?? 0) > 0, 'Create your first category', '/adminpage/categories'],
              [s.products > 0, 'Add your first product with a photo', '/adminpage/products'],
              [false, 'Add contact details and a hero banner', '/adminpage/settings'],
            ].map(([done, label, to]) => (
              <li key={label as string}><Link to={to as string} className="flex items-center gap-3 hover:text-primary"><Icon name={done ? 'check_circle' : 'radio_button_unchecked'} className={done ? 'text-tertiary' : 'text-text-muted'} />{label as string}</Link></li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon="payments" label="Total revenue" value={rupees(s.revenue)} sub={`${s.orders} orders (excl. cancelled)`} />
        <Card icon="today" label="Today" value={rupees(s.todayRevenue)} sub={`${s.todayOrders} order${s.todayOrders === 1 ? '' : 's'}`} />
        <Card icon="pending_actions" label="Needs action" value={s.pending} sub="Placed, confirmed or preparing" to="/adminpage/orders" />
        <Card icon="local_shipping" label="In transit" value={s.inTransit} sub="Shipped or out for delivery" to="/adminpage/orders" />
        <Card icon="group" label="Customers" value={s.customers} to="/adminpage/customers" />
        <Card icon="inventory_2" label="Products" value={s.products} to="/adminpage/products" />
        <Card icon="production_quantity_limits" label="Out of stock" value={s.outOfStock} to="/adminpage/inventory" />
        <Card icon="cancel" label="Cancelled" value={s.statusCounts.CANCELLED ?? 0} />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <section className="bg-white border border-border-warm rounded-2xl p-5">
          <h2 className="font-bold mb-4">Revenue, last 7 days</h2>
          <div className="flex items-end gap-2 h-44">
            {s.last7.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1" title={`${d.date}: ${rupees(d.revenue)}, ${d.orders} orders`}>
                <span className="text-[10px] text-text-muted">{d.revenue ? rupees(d.revenue) : ''}</span>
                <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(d.revenue ? 4 : 1, (d.revenue / max) * 100)}%`, minHeight: 2 }} />
                <span className="text-[10px] text-text-muted">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="bg-white border border-border-warm rounded-2xl p-5">
          <h2 className="font-bold mb-3">Orders by status</h2>
          <ul className="space-y-2 text-sm">
            {(['PLACED', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
              <li key={st}><Link to={`/adminpage/orders?status=${st}`} className="flex justify-between hover:text-primary"><span>{STATUS_LABEL[st]}</span><b>{s.statusCounts[st] ?? 0}</b></Link></li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-border-warm rounded-2xl p-5">
          <div className="flex justify-between mb-3"><h2 className="font-bold">Recent orders</h2><Link to="/adminpage/orders" className="text-sm font-semibold text-primary">All orders</Link></div>
          {s.recentOrders.length === 0 ? <p className="text-sm text-text-muted">No orders yet.</p> : (
            <ul className="divide-y divide-border-warm">
              {s.recentOrders.map((o) => (
                <li key={o.id}><Link to={`/adminpage/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-surface-container-low -mx-2 px-2 rounded-lg">
                  <div className="min-w-0"><div className="font-semibold text-sm">{o.orderNumber} · {o.customerName}</div><div className="text-xs text-text-muted">{dateTime(o.createdAt)} · {rupees(o.total)}</div></div><StatusBadge status={o.status} />
                </Link></li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-6">
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold">Low stock</h2><Link to="/adminpage/inventory" className="text-sm font-semibold text-primary">Manage</Link></div>
            {s.lowStock.length === 0 ? <p className="text-sm text-text-muted">Nothing is running low.</p> : (
              <ul className="space-y-2">{s.lowStock.map((p) => <li key={p.id} className="flex justify-between text-sm"><span className="truncate">{p.name} <span className="text-text-muted">{p.weight}</span></span><b className={p.stock === 0 ? 'text-error' : 'text-secondary'}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</b></li>)}</ul>
            )}
          </section>
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-bold mb-3">Best sellers</h2>
            {s.topProducts.length === 0 ? <p className="text-sm text-text-muted">Sales will show up here.</p> : (
              <ul className="space-y-2">{s.topProducts.map((p) => <li key={p.id} className="flex items-center gap-3 text-sm"><Img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg" /><span className="flex-1 truncate">{p.name}</span><span className="text-text-muted">{p.sold} sold</span></li>)}</ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
