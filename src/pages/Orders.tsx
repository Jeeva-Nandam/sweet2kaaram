import { Link } from 'react-router-dom';
import { Empty, ErrorBox, Img, PageLoader, StatusBadge, btnPrimary } from '../components/ui';
import { dateOnly, rupees } from '../lib/format';
import type { Order } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function Orders() {
  const { data, loading, error, reload } = useApi<Order[]>('/orders/mine');
  if (loading) return <PageLoader />;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8">
      <h1 className="font-serif text-3xl font-semibold mb-6">My orders</h1>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <Empty icon="receipt_long" title="No orders yet" text="When you place an order it will show up here, with live tracking." action={<Link to="/shop" className={btnPrimary}>Start shopping</Link>} />}
      <ul className="space-y-3">
        {data?.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="block bg-white border border-border-warm rounded-2xl p-4 hover:border-primary transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div><div className="font-bold">{o.orderNumber}</div><div className="text-xs text-text-muted">{dateOnly(o.createdAt)}</div></div>
                <StatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {o.items.slice(0, 4).map((i) => <Img key={i.product} src={i.image} alt={i.name} className="w-12 h-12 rounded-lg" />)}
                {o.items.length > 4 && <span className="text-xs text-text-muted">+{o.items.length - 4} more</span>}
                <div className="ml-auto font-bold">{rupees(o.total)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
