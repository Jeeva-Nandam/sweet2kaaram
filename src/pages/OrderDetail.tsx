import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import OrderTimeline from '../components/OrderTimeline';
import { ErrorBox, Icon, Img, PageLoader, StatusBadge, btnDanger, btnGhost, useToast } from '../components/ui';
import { api } from '../lib/api';
import { dateOnly, dateTime, rupees } from '../lib/format';
import type { Order } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function OrderDetail() {
  const { id } = useParams();
  const { data: o, loading, error, reload, setData } = useApi<Order>(`/orders/mine/${id}`);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  if (loading && !o) return <PageLoader />;
  if (error || !o) return <div className="max-w-2xl mx-auto px-4 py-16"><ErrorBox message={error || 'Order not found'} onRetry={reload} /></div>;

  const t = o.tracking;
  const hasTracking = !!(t.courier || t.trackingNumber || t.trackingUrl);
  const canCancel = o.status === 'PLACED' || o.status === 'CONFIRMED';

  const cancel = async () => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    setBusy(true);
    try { setData(await api.post<Order>(`/orders/mine/${o.id}/cancel`)); toast.ok('Order cancelled'); }
    catch (e) { toast.err((e as Error).message); }
    finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(t.trackingNumber); toast.ok('Tracking number copied'); } catch { toast.err('Could not copy'); } };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-8">
      <Link to="/orders" className="text-sm text-text-muted hover:text-primary inline-flex items-center gap-1"><Icon name="arrow_back" className="text-base" />My orders</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-serif text-3xl font-semibold">{o.orderNumber}</h1><p className="text-sm text-text-muted">Placed on {dateTime(o.createdAt)}</p></div>
        <div className="flex items-center gap-3"><StatusBadge status={o.status} /><button className={btnGhost} onClick={reload}><Icon name="refresh" className="text-lg" />Refresh</button></div>
      </div>

      <div className="mt-6 grid md:grid-cols-[1fr_20rem] gap-6 items-start">
        <div className="space-y-6">
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-serif text-xl font-semibold mb-5">Order progress</h2>
            <OrderTimeline order={o} />
          </section>

          {hasTracking && (
            <section className="bg-white border border-border-warm rounded-2xl p-5">
              <h2 className="font-serif text-xl font-semibold mb-3 flex items-center gap-2"><Icon name="local_shipping" className="text-primary" />Courier details</h2>
              <dl className="text-sm space-y-2">
                {t.courier && <div className="flex justify-between gap-4"><dt className="text-text-muted">Courier</dt><dd className="font-semibold">{t.courier}</dd></div>}
                {t.trackingNumber && <div className="flex justify-between gap-4 items-center"><dt className="text-text-muted">Tracking number</dt><dd className="font-semibold flex items-center gap-2 break-all">{t.trackingNumber}<button onClick={copy} aria-label="Copy tracking number" className="text-primary cursor-pointer"><Icon name="content_copy" className="text-lg" /></button></dd></div>}
                {t.estimatedDelivery && o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && <div className="flex justify-between gap-4"><dt className="text-text-muted">Expected by</dt><dd className="font-semibold">{dateOnly(t.estimatedDelivery)}</dd></div>}
              </dl>
              {t.trackingUrl && <a href={t.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Track on the courier website<Icon name="open_in_new" className="text-base" /></a>}
            </section>
          )}
          {!hasTracking && o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
            <p className="text-sm text-text-muted bg-surface-container-low rounded-xl px-4 py-3">Courier details will appear here as soon as your order is shipped.</p>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-serif text-xl font-semibold mb-3">Items</h2>
            <ul className="space-y-3">
              {o.items.map((i) => (
                <li key={i.product} className="flex gap-3 items-center text-sm">
                  {/* Order thumbnail slot: 56 x 56 px square. */}
                  <Img src={i.image} alt={i.name} className="w-14 h-14 rounded-xl border border-border-warm shrink-0" />
                  <div className="flex-1 min-w-0"><div className="font-semibold">{i.name}</div><div className="text-xs text-text-muted">{i.weight} × {i.quantity}</div></div>
                  <div className="font-semibold">{rupees(i.price * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-border-warm text-sm space-y-1.5">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-tertiary"><dt>Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>− {rupees(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shippingFee ? rupees(o.shippingFee) : 'Free'}</dd></div>
              <div className="flex justify-between font-bold text-base pt-2"><dt>Total</dt><dd>{rupees(o.total)}</dd></div>
            </dl>
            <p className="text-xs text-text-muted mt-3">{o.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online payment'} · {o.paymentStatus === 'PAID' ? 'Paid' : o.status === 'CANCELLED' ? 'Not charged' : 'Payment pending'}</p>
          </section>

          <section className="bg-white border border-border-warm rounded-2xl p-5 text-sm">
            <h2 className="font-serif text-xl font-semibold mb-2">Delivery address</h2>
            <p className="font-semibold">{o.address.name}</p>
            <p className="text-on-surface-variant">{o.address.line1}{o.address.landmark ? `, ${o.address.landmark}` : ''}<br />{o.address.city}, {o.address.state} {o.address.pincode}</p>
            <p className="text-text-muted mt-1">Mobile: {o.address.phone}</p>
          </section>

          {canCancel && <button className={`${btnDanger} w-full`} disabled={busy} onClick={cancel}>Cancel order</button>}
        </div>
      </div>
    </div>
  );
}
