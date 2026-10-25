import { FormEvent, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ErrorBox, Field, Icon, Img, Spinner, btnGhost, btnPrimary, inputCls, useToast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';
import { INDIAN_STATES, rupees } from '../lib/format';
import { freeShippingMessage } from '../lib/shipping';
import type { Address, Order } from '../lib/types';
import { useQuote } from './Cart';

const blank = { label: 'Home', name: '', phone: '', line1: '', landmark: '', city: '', state: '', pincode: '', isDefault: false };

export default function Checkout() {
  const { user, setAddresses } = useAuth();
  const { lines, couponCode, clear } = useCart();
  const { settings } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const placed = useRef(false);

  const addrs = user?.addresses ?? [];
  const [addrId, setAddrId] = useState<string>(() => (addrs.find((a) => a.isDefault) ?? addrs[0])?.id ?? '');
  const [adding, setAdding] = useState(addrs.length === 0);
  const [form, setForm] = useState({ ...blank, name: user?.name ?? '' });
  const [formErr, setFormErr] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const deliveryState = adding ? form.state : addrs.find((a) => a.id === addrId)?.state ?? '';
  const { quote, error: quoteError } = useQuote(deliveryState);

  if (!lines.length && !placed.current) return <Navigate to="/cart" replace />;
  const set = (k: keyof typeof blank, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const saveAddress = async (e: FormEvent) => {
    e.preventDefault();
    setFormErr(''); setSavingAddr(true);
    try {
      const before = new Set(addrs.map((a) => a.id));
      const list = await api.post<Address[]>('/me/addresses', form);
      setAddresses(list);
      setAddrId((list.find((a) => !before.has(a.id)) ?? list[list.length - 1]).id);
      setAdding(false); setForm({ ...blank, name: user?.name ?? '' });
    } catch (err) { setFormErr((err as Error).message); }
    finally { setSavingAddr(false); }
  };

  const problems = quote?.problems ?? [];
  const canPlace = !!quote && quote.shippingFee !== null && quote.total !== null && !!addrId && !adding
    && problems.length === 0 && !placing && settings.isAcceptingOrders && settings.codEnabled && !(couponCode && quote.couponError);

  const place = async () => {
    setPlacing(true); setError('');
    try {
      const order = await api.post<Order>('/orders', {
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        addressId: addrId, paymentMethod: 'COD', couponCode: couponCode || undefined, customerNote: note,
      });
      placed.current = true;
      clear();
      nav(`/order-success/${order.id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message); setPlacing(false);
      toast.err('Order not placed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
      <h1 className="font-serif text-3xl font-semibold mb-6">Checkout</h1>
      {!settings.isAcceptingOrders && <div className="mb-5"><ErrorBox message={settings.pausedMessage} /></div>}

      <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
        <div className="space-y-6">
          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2"><Icon name="location_on" className="text-primary" />Delivery address</h2>
            {!adding && (
              <div className="space-y-3">
                {addrs.map((a) => (
                  <label key={a.id} className={`flex gap-3 p-4 rounded-xl border cursor-pointer ${addrId === a.id ? 'border-primary bg-surface-container-low' : 'border-border-warm'}`}>
                    <input type="radio" name="address" checked={addrId === a.id} onChange={() => setAddrId(a.id)} className="mt-1 accent-[#932616]" />
                    <div className="text-sm">
                      <div className="font-bold">{a.name} <span className="ml-1 text-xs font-semibold bg-surface-container px-2 py-0.5 rounded">{a.label}</span></div>
                      <div className="text-on-surface-variant mt-1">{a.line1}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} {a.pincode}</div>
                      <div className="text-text-muted mt-0.5">Mobile: {a.phone}</div>
                    </div>
                  </label>
                ))}
                <button className={btnGhost} onClick={() => setAdding(true)}><Icon name="add" />Add a new address</button>
              </div>
            )}
            {adding && (
              <form onSubmit={saveAddress} className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name"><input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" /></Field>
                <Field label="Mobile number" hint="10 digits"><input required inputMode="numeric" maxLength={10} className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value.replace(/\D/g, ''))} autoComplete="tel-national" /></Field>
                <div className="sm:col-span-2"><Field label="Address (house no, street, area)"><input required className={inputCls} value={form.line1} onChange={(e) => set('line1', e.target.value)} autoComplete="street-address" /></Field></div>
                <Field label="Landmark (optional)"><input className={inputCls} value={form.landmark} onChange={(e) => set('landmark', e.target.value)} /></Field>
                <Field label="Pincode"><input required inputMode="numeric" maxLength={6} className={inputCls} value={form.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} autoComplete="postal-code" /></Field>
                <Field label="City"><input required className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} autoComplete="address-level2" /></Field>
                <Field label="State"><select required className={inputCls} value={form.state} onChange={(e) => set('state', e.target.value)}><option value="">Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Save as"><select className={inputCls} value={form.label} onChange={(e) => set('label', e.target.value)}><option>Home</option><option>Work</option><option>Other</option></select></Field>
                {formErr && <div className="sm:col-span-2"><ErrorBox message={formErr} /></div>}
                <div className="sm:col-span-2 flex gap-3">
                  <button className={btnPrimary} disabled={savingAddr}>{savingAddr ? <Spinner className="border-white/40 border-t-white" /> : 'Save and use this address'}</button>
                  {addrs.length > 0 && <button type="button" className={btnGhost} onClick={() => setAdding(false)}>Cancel</button>}
                </div>
              </form>
            )}
          </section>

          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <h2 className="font-serif text-xl font-semibold mb-4 flex items-center gap-2"><Icon name="payments" className="text-primary" />Payment</h2>
            <label className="flex gap-3 p-4 rounded-xl border border-primary bg-surface-container-low">
              <input type="radio" checked readOnly className="mt-1 accent-[#932616]" />
              <div className="text-sm"><div className="font-bold">Cash on delivery</div><div className="text-on-surface-variant">Pay in cash when your order arrives.</div></div>
            </label>
            <div className="flex gap-3 p-4 rounded-xl border border-border-warm mt-3 opacity-60" aria-disabled="true">
              <input type="radio" disabled className="mt-1" />
              <div className="text-sm"><div className="font-bold">UPI, cards and net banking <span className="ml-1 text-xs bg-surface-container px-2 py-0.5 rounded">Coming soon</span></div><div className="text-on-surface-variant">Online payment will be available shortly.</div></div>
            </div>
            {!settings.codEnabled && <p className="text-sm text-error mt-3">Cash on delivery is switched off right now, so orders cannot be placed yet.</p>}
          </section>

          <section className="bg-white border border-border-warm rounded-2xl p-5">
            <Field label="Delivery note (optional)"><input className={inputCls} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Call before delivery" /></Field>
          </section>
        </div>

        <aside className="bg-white border border-border-warm rounded-2xl p-5 lg:sticky lg:top-40">
          <h2 className="font-serif text-xl font-semibold mb-4">Your order</h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {lines.map(({ product: p, quantity }) => (
              <li key={p.id} className="flex gap-3 items-center text-sm">
                <Img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0"><div className="font-semibold truncate">{p.name}</div><div className="text-xs text-text-muted">{p.weight} × {quantity}</div></div>
              </li>
            ))}
          </ul>
          {quoteError && <p className="text-sm text-error mt-3">{quoteError}</p>}
          {!quote && !quoteError && <div className="py-6 flex justify-center"><Spinner /></div>}
          {quote && (
            <dl className="mt-4 space-y-2 text-sm border-t border-border-warm pt-4">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(quote.subtotal)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-tertiary"><dt>Discount ({quote.couponCode})</dt><dd>− {rupees(quote.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{quote.shippingFee === null ? 'Select a state' : quote.shippingFee === 0 ? 'Free' : rupees(quote.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-border-warm pt-3 mt-3 text-base font-bold"><dt>Total to pay</dt><dd>{quote.total === null ? '—' : rupees(quote.total)}</dd></div>
            </dl>
          )}
          {quote && <p className="text-xs text-text-muted mt-3">{freeShippingMessage(quote.subtotal, quote.shippingThreshold)}</p>}
          {!deliveryState && !adding && <p className="text-xs text-text-muted mt-3">Choose a delivery address to calculate shipping and total.</p>}
          {problems.map((m) => <p key={m} className="text-sm text-error mt-3">{m}. <Link to="/cart" className="underline font-semibold">Update cart</Link></p>)}
          {quote?.couponError && couponCode && <p className="text-sm text-error mt-3">{quote.couponError}. <Link to="/cart" className="underline font-semibold">Fix coupon</Link></p>}
          {error && <div className="mt-3"><ErrorBox message={error} /></div>}
          <button className={`${btnPrimary} w-full mt-5 h-12`} disabled={!canPlace} onClick={place}>
            {placing ? <Spinner className="border-white/40 border-t-white" /> : `Place order${quote?.total !== null && quote?.total !== undefined ? ` · ${rupees(quote.total)}` : ''}`}
          </button>
          {!addrId && !adding && <p className="text-xs text-text-muted mt-2 text-center">Choose a delivery address to continue.</p>}
        </aside>
      </div>
    </div>
  );
}
