import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { rupees } from '../lib/format';
import type { Product } from '../lib/types';
import { Icon, Img, useToast } from './ui';

export default function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const toast = useToast();
  const off = p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
  const out = p.stock <= 0;
  return (
    <article className="group bg-white rounded-2xl border border-border-warm overflow-hidden flex flex-col">
      <Link to={`/product/${p.id}`} className="relative block aspect-[4/3] bg-surface-container-low overflow-hidden">
        {/* Image slot: 4:3, cropped to fill. Square product photos lose 12% at the top and bottom. */}
        <Img src={p.image} alt={p.name} className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${out ? 'opacity-60' : ''}`} />
        <span className="absolute top-3 left-3 w-5 h-5 bg-white rounded-sm border flex items-center justify-center" style={{ borderColor: p.isVeg ? '#2E7D32' : '#ba1a1a' }} title={p.isVeg ? 'Vegetarian' : 'Non-vegetarian'}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.isVeg ? '#2E7D32' : '#ba1a1a' }} />
        </span>
        {p.badge && !out && <span className="absolute top-3 right-3 bg-accent-gold text-on-surface text-[11px] font-bold px-2 py-1 rounded">{p.badge}</span>}
        {out && <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs font-bold text-center py-1.5">Out of stock</span>}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/product/${p.id}`} className="font-serif text-lg font-semibold leading-snug hover:text-primary line-clamp-2">{p.name}</Link>
        <div className="text-xs text-text-muted mt-1">{[p.weight, p.origin].filter(Boolean).join(' · ')}</div>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-bold">{rupees(p.price)}</span>
            {off > 0 && <><span className="ml-2 text-xs text-text-muted line-through">{rupees(p.originalPrice)}</span><span className="ml-1.5 text-xs font-bold text-tertiary">{off}% off</span></>}
          </div>
          <button disabled={out} onClick={() => { add(p); toast.ok(`${p.name} added to cart`); }} aria-label={`Add ${p.name} to cart`}
            className="h-10 w-10 shrink-0 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
            <Icon name="add_shopping_cart" className="text-xl" />
          </button>
        </div>
      </div>
    </article>
  );
}
