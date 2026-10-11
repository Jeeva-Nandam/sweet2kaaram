import { Link, useParams } from 'react-router-dom';
import { ErrorBox, Icon, PageLoader, btnGhost, btnPrimary } from '../components/ui';
import { rupees } from '../lib/format';
import type { Order } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function OrderSuccess() {
  const { id } = useParams();
  const { data: o, loading, error } = useApi<Order>(`/orders/mine/${id}`);
  if (loading) return <PageLoader />;
  if (error || !o) return <div className="max-w-xl mx-auto px-4 py-16"><ErrorBox message={error || 'Order not found'} /></div>;
  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-tertiary text-white flex items-center justify-center"><Icon name="check" className="text-5xl" /></div>
      <h1 className="font-serif text-3xl font-semibold mt-5">Thank you, your order is placed</h1>
      <p className="text-on-surface-variant mt-2">Order number</p>
      <p className="text-2xl font-bold text-primary tracking-wide">{o.orderNumber}</p>

      <div className="bg-white border border-border-warm rounded-2xl p-5 mt-8 text-left text-sm space-y-3">
        <div className="flex justify-between"><span className="text-text-muted">Items</span><span>{o.items.reduce((n, i) => n + i.quantity, 0)}</span></div>
        <div className="flex justify-between"><span className="text-text-muted">Payment</span><span>{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</span></div>
        <div className="flex justify-between font-bold text-base border-t border-border-warm pt-3"><span>{o.paymentMethod === 'COD' ? 'Amount to pay on delivery' : 'Total'}</span><span>{rupees(o.total)}</span></div>
        <div className="border-t border-border-warm pt-3 text-on-surface-variant">Delivering to <span className="font-semibold text-on-surface">{o.address.name}</span>, {o.address.line1}, {o.address.city} {o.address.pincode}</div>
      </div>
      <p className="text-sm text-text-muted mt-5">You can follow every step of your order, including courier details once it ships.</p>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <Link to={`/orders/${o.id}`} className={btnPrimary}><Icon name="local_shipping" />Track this order</Link>
        <Link to="/shop" className={btnGhost}>Continue shopping</Link>
      </div>
    </div>
  );
}
