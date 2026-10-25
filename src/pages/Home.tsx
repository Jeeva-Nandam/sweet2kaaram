import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Empty, ErrorBox, Icon, PageLoader } from '../components/ui';
import { useStore } from '../context/StoreContext';
import type { Page, Product } from '../lib/types';
import { useApi } from '../lib/useApi';

export default function Home() {
  const { settings: s, categories, ready, error, reload } = useStore();
  const top = useApi<Page<Product>>('/products?featured=1&limit=8');
  const fresh = useApi<Page<Product>>('/products?sort=newest&limit=8');

  if (!ready) return <PageLoader />;
  const topItems = top.data?.items ?? [];
  const freshItems = (fresh.data?.items ?? []).filter((p) => !topItems.some((t) => t.id === p.id));
  const nothing = !top.loading && !fresh.loading && !topItems.length && !freshItems.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
      {error && <div className="mb-4"><ErrorBox message={error} onRetry={reload} /></div>}

      {/* Hero image slot: shown full width, cropped to fit. Recommended upload: 1600 x 700 px. */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-primary-container text-white min-h-[19rem] sm:min-h-[26rem] flex items-end">
        {s.heroImage && <img src={s.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="relative p-6 sm:p-12 max-w-2xl">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight">{s.heroTitle || s.storeName}</h1>
          {s.heroSubtitle && <p className="mt-3 text-sm sm:text-base text-white/90 max-w-lg">{s.heroSubtitle}</p>}
          <div className="mt-6 flex gap-3 flex-wrap">
            <Link to="/shop" className="h-12 px-6 rounded-xl bg-white text-primary font-bold flex items-center hover:bg-primary-fixed transition-colors">Shop now</Link>
            <Link to="/track" className="h-12 px-6 rounded-xl border border-white/60 text-white font-semibold flex items-center hover:bg-white/10 transition-colors">Track an order</Link>
          </div>
        </div>
      </section>

      <ul className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
        {[
          ['local_shipping', 'Free shipping from ₹499 in Tamil Nadu / ₹799 elsewhere'],
          ['payments', s.codEnabled ? 'Cash on delivery available' : 'Secure checkout'],
          ['route', 'Follow every order, step by step'],
        ].map(([icon, text]) => (
          <li key={text} className="flex items-center gap-3 bg-white border border-border-warm rounded-xl px-4 py-3"><Icon name={icon} className="text-primary" />{text}</li>
        ))}
      </ul>

      {categories.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-5">Shop by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((c) => (
              <Link key={c.id} to={`/shop/${c.slug}`} className="bg-white border border-border-warm rounded-2xl p-5 hover:border-primary hover:shadow-md transition">
                <Icon name={c.icon} className="text-3xl text-primary" />
                <div className="font-serif text-lg font-semibold mt-3 leading-snug">{c.name}</div>
                <div className="text-xs text-text-muted mt-1">{c.itemCount ?? 0} item{c.itemCount === 1 ? '' : 's'}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topItems.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-5"><h2 className="font-serif text-2xl sm:text-3xl font-semibold">Top sellers</h2><Link to="/shop" className="text-sm font-bold text-primary">View all</Link></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{topItems.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {freshItems.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-5">New arrivals</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{freshItems.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
      {nothing && <Empty icon="storefront" title="Our shelves are being stocked" text="New products will appear here very soon. Please check back shortly." />}
    </div>
  );
}
