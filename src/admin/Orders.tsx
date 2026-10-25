import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Empty, ErrorBox, Field, Icon, Img, PageLoader, Spinner, StatusBadge, btnDanger, btnGhost, btnPrimary, inputCls, useToast } from '../components/ui';
import { api, qs } from '../lib/api';
import { dateTime, FLOW, rupees, STATUS_LABEL } from '../lib/format';
import type { Order, OrderStatus, Page } from '../lib/types';
import { useApi } from '../lib/useApi';

const TABS: ('' | OrderStatus)[] = ['', 'PLACED', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export function AdminOrders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const path = `/admin/orders${qs({ status, q, page, limit: 20 })}`;
  const [debounced, setDebounced] = useState(path);
  useEffect(() => { const t = setTimeout(() => setDebounced(path), 250); return () => clearTimeout(t); }, [path]);
  useEffect(() => setPage(1), [status, q]);
  const { data, error, loading, reload } = useApi<Page<Order>>(debounced);
  const remove = async (order: Order) => {
    if (!window.confirm(`Permanently delete order ${order.orderNumber}? This cannot be undone.`)) return;
    try {
      await api.del(`/admin/orders/${order.id}`);
      toast.ok('Order deleted');
      if (data?.items.length === 1 && page > 1) setPage((p) => p - 1);
      else reload();
    } catch (e) { toast.err((e as Error).message); }
  };

  return (
    <div className="max-w-6xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold">Orders</h1>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((t) => <button key={t || 'all'} onClick={() => { const n = new URLSearchParams(); if (t) n.set('status', t); setParams(n); }} className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold border cursor-pointer ${status === t ? 'bg-primary text-white border-primary' : 'bg-white border-border-warm'}`}>{t ? STATUS_LABEL[t] : 'All'}</button>)}
      </div>
      <input className={`${inputCls} max-w-md`} placeholder="Search order no., name, phone or email…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data && <PageLoader />}
      {data && data.items.length === 0 && <div className="bg-white border border-border-warm rounded-2xl"><Empty icon="receipt_long" title="No orders found" text="Orders appear here as soon as customers place them." /></div>}
      {data && data.items.length > 0 && (
        <ul className="bg-white border border-border-warm rounded-2xl divide-y divide-border-warm">
          {data.items.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center gap-x-3">
              <Link to={`/adminpage/orders/${o.id}`} className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 p-4 min-w-0 hover:bg-surface-container-low">
                <div className="min-w-32"><div className="font-bold">{o.orderNumber}</div><div className="text-xs text-text-muted">{dateTime(o.createdAt)}</div></div>
                <div className="flex-1 min-w-40"><div className="font-semibold text-sm">{o.customerName}</div><div className="text-xs text-text-muted">{o.address.city} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</div></div>
                <div className="font-bold">{rupees(o.total)}</div>
                <div className="text-xs text-text-muted w-16">{o.paymentMethod === 'COD' ? 'COD' : 'Online'} · {o.paymentStatus === 'PAID' ? 'Paid' : 'Due'}</div>
                <StatusBadge status={o.status} />
              </Link>
              <button aria-label={`Delete order ${o.orderNumber}`} className="p-3 text-on-surface-variant hover:text-error cursor-pointer" onClick={() => remove(o)}><Icon name="delete" className="text-xl" /></button>
            </li>
          ))}
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

export function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: o, error, loading, reload, setData } = useApi<Order>(`/admin/orders/${id}`);
  const [f, setF] = useState({ status: '' as OrderStatus | '', note: '', courier: '', trackingNumber: '', trackingUrl: '', eta: '', paymentStatus: 'PENDING' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!o) return;
    setF({ status: o.status, note: '', courier: o.tracking.courier, trackingNumber: o.tracking.trackingNumber, trackingUrl: o.tracking.trackingUrl,
      eta: o.tracking.estimatedDelivery ? o.tracking.estimatedDelivery.slice(0, 10) : '', paymentStatus: o.paymentStatus });
  }, [o]);

  if (loading && !o) return <PageLoader />;
  if (error || !o) return <ErrorBox message={error || 'Order not found'} onRetry={reload} />;

  const closed = o.status === 'DELIVERED' || o.status === 'CANCELLED';
  const options: OrderStatus[] = closed ? [o.status] : [o.status, ...FLOW.slice(FLOW.indexOf(o.status) + 1), 'CANCELLED'];
  const next = FLOW[FLOW.indexOf(o.status) + 1] as OrderStatus | undefined;
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e?: FormEvent, forceStatus?: OrderStatus) => {
    e?.preventDefault();
    const status = forceStatus ?? (f.status || o.status);
    if (status === 'CANCELLED' && status !== o.status && !window.confirm('Cancel this order? Stock will be returned.')) return;
    setSaving(true); setFormErr('');
    try {
      const updated = await api.patch<Order>(`/admin/orders/${o.id}`, {
        ...(status !== o.status ? { status } : {}), note: f.note || undefined, courier: f.courier, trackingNumber: f.trackingNumber,
        trackingUrl: f.trackingUrl, estimatedDelivery: f.eta || '', paymentStatus: f.paymentStatus,
      });
      setData(updated); toast.ok('Order updated');
    } catch (err) { setFormErr((err as Error).message); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Permanently delete order ${o.orderNumber}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.del(`/admin/orders/${o.id}`);
      toast.ok('Order deleted');
      navigate('/adminpage/orders', { replace: true });
    } catch (err) { toast.err((err as Error).message); } finally { setDeleting(false); }
  };

  return (
    <div className="max-w-6xl space-y-5">
      <Link to="/adminpage/orders" className="text-sm text-text-muted hover:text-primary inline-flex items-center gap-1"><Icon name="arrow_back" className="text-base" />All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="font-serif text-3xl font-semibold">{o.orderNumber}</h1><p className="text-sm text-text-muted">Placed {dateTime(o.createdAt)}</p></div><div className="flex items-center gap-3"><StatusBadge status={o.status} /><button className={btnDanger} disabled={deleting} onClick={remove}><Icon name="delete" />{deleting ? <Spinner /> : 'Delete order'}</button></div></div>

      <div className="grid lg:grid-cols-[1fr_24rem] gap-6 items-start">
        <div className="space-y-6">
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-bold mb-3">Items</h2>
            <ul className="space-y-3">{o.items.map((i) => (
              <li key={i.product} className="flex gap-3 items-center text-sm"><Img src={i.image} alt={i.name} className="w-14 h-14 rounded-xl shrink-0" /><div className="flex-1"><div className="font-semibold">{i.name}</div><div className="text-xs text-text-muted">{i.weight} × {i.quantity} @ {rupees(i.price)}</div></div><b>{rupees(i.price * i.quantity)}</b></li>
            ))}</ul>
            <dl className="mt-4 pt-4 border-t border-border-warm text-sm space-y-1.5">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-tertiary"><dt>Discount ({o.couponCode})</dt><dd>− {rupees(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{rupees(o.shippingFee)}</dd></div>
              <div className="flex justify-between font-bold text-base pt-2"><dt>Total ({o.paymentMethod === 'COD' ? 'collect on delivery' : 'online'})</dt><dd>{rupees(o.total)}</dd></div>
            </dl>
          </section>
          <section className="bg-white border border-border-warm rounded-2xl p-5 grid sm:grid-cols-2 gap-5 text-sm">
            <div><h2 className="font-bold mb-2">Customer</h2><p className="font-semibold">{o.customerName}</p><a className="text-primary block" href={`tel:${o.customerPhone}`}>{o.customerPhone}</a><a className="text-primary break-all" href={`mailto:${o.customerEmail}`}>{o.customerEmail}</a></div>
            <div><h2 className="font-bold mb-2">Deliver to</h2><p className="text-on-surface-variant">{o.address.line1}{o.address.landmark ? `, ${o.address.landmark}` : ''}<br />{o.address.city}, {o.address.state} {o.address.pincode}</p>{o.customerNote && <p className="mt-2 bg-surface-container-low rounded-lg p-2"><b>Note:</b> {o.customerNote}</p>}</div>
          </section>
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-bold mb-3">History</h2>
            <ol className="space-y-2 text-sm">{[...o.statusHistory].reverse().map((h, i) => <li key={i} className="flex gap-3"><span className="text-text-muted w-32 shrink-0">{dateTime(h.at)}</span><span><b>{STATUS_LABEL[h.status]}</b>{h.note && ` · ${h.note}`}</span></li>)}</ol>
          </section>
        </div>

        <form onSubmit={(e) => submit(e)} className="bg-white border border-border-warm rounded-2xl p-5 space-y-4 lg:sticky lg:top-6">
          <h2 className="font-bold">Update order and tracking</h2>
          {!closed && next && <button type="button" className={`${btnPrimary} w-full`} disabled={saving} onClick={() => submit(undefined, next)}>Move to “{STATUS_LABEL[next]}”</button>}
          <Field label="Status"><select className={inputCls} disabled={closed} value={f.status} onChange={(e) => set('status', e.target.value)}>{options.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></Field>
          <div className="rounded-xl bg-surface-container-low p-3 space-y-3">
            <div className="text-xs font-bold flex items-center gap-1"><Icon name="local_shipping" className="text-base text-primary" />Courier details (customer sees these)</div>
            <Field label="Courier name" hint="Required to mark as Shipped"><input className={inputCls} placeholder="e.g. India Post, DTDC" value={f.courier} onChange={(e) => set('courier', e.target.value)} /></Field>
            <Field label="Tracking number"><input className={inputCls} value={f.trackingNumber} onChange={(e) => set('trackingNumber', e.target.value)} /></Field>
            <Field label="Tracking link" hint="Optional. Must start with https://"><input className={inputCls} placeholder="https://…" value={f.trackingUrl} onChange={(e) => set('trackingUrl', e.target.value)} /></Field>
            <Field label="Expected delivery date"><input type="date" className={inputCls} value={f.eta} onChange={(e) => set('eta', e.target.value)} /></Field>
          </div>
          <Field label="Note for the history (optional)"><input className={inputCls} maxLength={200} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. Packed and handed to courier" /></Field>
          <Field label="Payment status"><select className={inputCls} value={f.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)}><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select></Field>
          {formErr && <ErrorBox message={formErr} />}
          <button className={`${btnGhost} w-full`} disabled={saving}>{saving ? <Spinner /> : 'Save changes'}</button>
          <p className="text-xs text-text-muted">Cash-on-delivery orders are marked Paid automatically when delivered.</p>
        </form>
      </div>
    </div>
  );
}
