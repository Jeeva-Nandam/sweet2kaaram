import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Empty, ErrorBox, Icon, Img, PageLoader, btnGhost, btnPrimary, useToast } from '../components/ui';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { rupees } from '../lib/format';
import type { Product } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function ProductDetail() {
  const { id } = useParams();
  const { data: p, loading, error } = useApi<Product>(id ? `/products/${id}` : null);
  const { categories } = useStore();
  const { add } = useCart();
  const nav = useNavigate();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [id]);

  if (loading) return <PageLoader />;
  if (error || !p) return <div className="max-w-3xl mx-auto px-4 py-16">{error && !/not found/i.test(error) ? <ErrorBox message={error} /> : <Empty icon="search_off" title="Product not found" text="It may have been removed." action={<Link to="/shop" className={btnPrimary}>Browse products</Link>} />}</div>;

  const max = Math.max(1, Math.min(20, p.stock));
  const out = p.stock <= 0;
  const off = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
  const cat = categories.find((c) => c.slug === p.category);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 pb-4">
      <nav className="text-sm text-text-muted mb-5 flex gap-1.5 flex-wrap" aria-label="Breadcrumb">
        <Link to="/shop" className="hover:text-primary">Shop</Link><span>/</span>
        {cat && <><Link to={`/shop/${cat.slug}`} className="hover:text-primary">{cat.name}</Link><span>/</span></>}
        <span className="text-on-surface">{p.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image slot: square (1:1). Recommended upload 1200 x 1200 px. */}
        <div className="aspect-square rounded-2xl overflow-hidden border border-border-warm bg-surface-container-low relative">
          <Img src={p.image} alt={p.name} className="w-full h-full" />
          {out && <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-sm font-bold text-center py-2">Out of stock</span>}
        </div>

        <div>
          {p.badge && <span className="inline-block bg-accent-gold text-on-surface text-xs font-bold px-2.5 py-1 rounded mb-3">{p.badge}</span>}
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">{p.name}</h1>
          {p.nativeTitle && <div className="text-lg text-text-muted mt-1">{p.nativeTitle}</div>}
          <div className="mt-3 flex items-center gap-3 text-sm text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 border flex items-center justify-center rounded-sm" style={{ borderColor: p.isVeg ? '#2E7D32' : '#ba1a1a' }}><span className="w-2 h-2 rounded-full" style={{ background: p.isVeg ? '#2E7D32' : '#ba1a1a' }} /></span>{p.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</span>
            <span>{p.weight}</span>{p.origin && <span>From {p.origin}</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{rupees(p.price)}</span>
            {off > 0 && <><span className="text-text-muted line-through">{rupees(p.originalPrice)}</span><span className="text-sm font-bold text-tertiary">{off}% off</span></>}
          </div>
          <p className="text-xs text-text-muted mt-1">Inclusive of taxes. Shipping is calculated by your delivery state and order value.</p>

          <p className={`mt-4 text-sm font-semibold ${out ? 'text-error' : p.stock <= p.lowStockThreshold ? 'text-secondary' : 'text-tertiary'}`}>
            {out ? 'Currently out of stock' : p.stock <= p.lowStockThreshold ? `Only ${p.stock} left` : 'In stock'}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="h-12 flex items-center border border-border-warm rounded-lg bg-white">
              <button aria-label="Decrease quantity" disabled={out || qty <= 1} onClick={() => setQty((q) => q - 1)} className="w-11 h-full disabled:opacity-30 cursor-pointer"><Icon name="remove" /></button>
              <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
              <button aria-label="Increase quantity" disabled={out || qty >= max} onClick={() => setQty((q) => q + 1)} className="w-11 h-full disabled:opacity-30 cursor-pointer"><Icon name="add" /></button>
            </div>
            <button disabled={out} className={`${btnPrimary} h-12 flex-1 min-w-36`} onClick={() => { add(p, qty); toast.ok('Added to cart'); }}><Icon name="add_shopping_cart" />Add to cart</button>
            <button disabled={out} className={`${btnGhost} h-12`} onClick={() => { add(p, qty); nav('/cart'); }}>Buy now</button>
          </div>

          {p.description && <section className="mt-8"><h2 className="font-serif text-xl font-semibold mb-2">About this product</h2><p className="text-on-surface-variant leading-relaxed whitespace-pre-line">{p.description}</p></section>}
          {p.ingredients.length > 0 && <section className="mt-6"><h2 className="font-serif text-xl font-semibold mb-2">Ingredients</h2><div className="flex flex-wrap gap-2">{p.ingredients.map((i) => <span key={i} className="px-3 py-1 rounded-full bg-surface-container text-sm">{i}</span>)}</div></section>}
          {p.shelfLife && <p className="mt-6 text-sm"><span className="font-semibold">Shelf life:</span> {p.shelfLife}</p>}
        </div>
      </div>
    </div>
  );
}
