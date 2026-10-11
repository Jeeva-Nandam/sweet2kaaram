import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Empty, Icon, Img, Spinner, btnGhost, btnPrimary, inputCls } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';
import { rupees } from '../lib/format';
import type { Quote } from '../lib/types';

/** Totals shown here come from the server (/orders/quote), so they match what checkout will charge. */
export function useQuote() {
  const { lines, couponCode } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify([lines.map((l) => [l.product.id, l.quantity]), couponCode]);

  useEffect(() => {
    if (!lines.length) { setQuote(null); return; }
    let live = true;
    setLoading(true);
    const t = setTimeout(() => {
      api.post<Quote>('/orders/quote', { items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })), couponCode: couponCode || undefined })
        .then((q) => { if (live) { setQuote(q); setError(''); } })
        .catch((e: Error) => live && setError(e.message))
        .finally(() => live && setLoading(false));
    }, 250);
    return () => { live = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quote, error, loading };
}

export default function Cart() {
  const { lines, setQty, remove, couponCode, setCouponCode } = useCart();
  const { settings } = useStore();
  const { quote, error, loading } = useQuote();
  const [code, setCode] = useState(couponCode);
  const nav = useNavigate();

  if (!lines.length) return <Empty icon="shopping_bag" title="Your cart is empty" text="Add something delicious to get started." action={<Link to="/shop" className={btnPrimary}>Browse products</Link>} />;

  const live = (id: string) => quote?.lines.find((l) => l.productId === id);
  const gone = (id: string) => !!quote && !live(id);
  const over = (id: string, qty: number) => { const l = live(id); return !!l && l.stock < qty; };
  const blocked = !quote || quote.problems.length > 0 || lines.some((l) => gone(l.product.id) || over(l.product.id, l.quantity)) || !settings.isAcceptingOrders;
  const toFree = quote ? settings.freeShippingThreshold - quote.subtotal : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8">
      <h1 className="font-serif text-3xl font-semibold mb-6">Your cart</h1>
      <div className="grid lg:grid-cols-[1fr_22rem] gap-8 items-start">
        <ul className="space-y-3">
          {lines.map(({ product: p, quantity }) => {
            const l = live(p.id);
            const price = l?.price ?? p.price;
            return (
              <li key={p.id} className="bg-white border border-border-warm rounded-2xl p-3 sm:p-4 flex gap-4">
                <Link to={`/product/${p.id}`}><Img src={l?.image ?? p.image} alt={p.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl" /></Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <Link to={`/product/${p.id}`} className="font-serif font-semibold leading-snug hover:text-primary">{p.name}</Link>
                    <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className="text-text-muted hover:text-error cursor-pointer"><Icon name="delete" className="text-xl" /></button>
                  </div>
                  <div className="text-xs text-text-muted">{p.weight}</div>
                  {gone(p.id) && <div className="text-xs font-bold text-error mt-1">No longer available. Please remove it.</div>}
                  {over(p.id, quantity) && !gone(p.id) && <div className="text-xs font-bold text-error mt-1">{(l?.stock ?? 0) === 0 ? 'Out of stock. Please remove it.' : `Only ${l?.stock} left. Lower the quantity.`}</div>}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-9 flex items-center border border-border-warm rounded-lg">
                      <button aria-label="Decrease quantity" onClick={() => (quantity > 1 ? setQty(p.id, quantity - 1) : remove(p.id))} className="w-9 h-full cursor-pointer"><Icon name="remove" className="text-lg" /></button>
                      <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                      <button aria-label="Increase quantity" onClick={() => setQty(p.id, quantity + 1)} className="w-9 h-full cursor-pointer"><Icon name="add" className="text-lg" /></button>
                    </div>
                    <div className="font-bold">{rupees(price * quantity)}</div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="bg-white border border-border-warm rounded-2xl p-5 lg:sticky lg:top-40">
          <h2 className="font-serif text-xl font-semibold mb-4">Order summary</h2>
          <form className="flex gap-2 mb-1" onSubmit={(e) => { e.preventDefault(); setCouponCode(code.trim().toUpperCase()); }}>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className={`${inputCls} uppercase`} />
            <button className={btnGhost} type="submit">Apply</button>
          </form>
          {quote?.couponError && <p className="text-xs text-error mb-2">{quote.couponError}</p>}
          {quote?.couponCode && <p className="text-xs text-tertiary font-semibold mb-2 flex items-center gap-1">Coupon {quote.couponCode} applied <button className="underline text-text-muted font-normal cursor-pointer" onClick={() => { setCouponCode(''); setCode(''); }}>remove</button></p>}

          {error && <p className="text-sm text-error my-3">{error}</p>}
          {!quote && !error && <div className="py-6 flex justify-center"><Spinner /></div>}
          {quote && (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{rupees(quote.subtotal)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-tertiary"><dt>Discount</dt><dd>− {rupees(quote.discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{quote.shippingFee === 0 ? 'Free' : rupees(quote.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-border-warm pt-3 mt-3 text-base font-bold"><dt>Total</dt><dd>{rupees(quote.total)}</dd></div>
            </dl>
          )}
          {quote && toFree > 0 && <p className="text-xs text-text-muted mt-3">Add {rupees(toFree)} more for free shipping.</p>}
          {!settings.isAcceptingOrders && <p className="text-sm text-error mt-3">{settings.pausedMessage}</p>}
          <button disabled={blocked || loading} onClick={() => nav('/checkout')} className={`${btnPrimary} w-full mt-5 h-12`}>Proceed to checkout</button>
          <p className="text-xs text-text-muted mt-3 text-center">You will be asked to log in with Google before checkout.</p>
        </aside>
      </div>
    </div>
  );
}
