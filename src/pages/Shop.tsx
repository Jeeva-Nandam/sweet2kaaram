import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Empty, ErrorBox, Spinner, btnGhost, inputCls } from '../components/ui';
import { useStore } from '../context/StoreContext';
import { api, qs } from '../lib/api';
import type { Page, Product } from '../lib/types';

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { categories } = useStore();
  const q = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'popular';
  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { setPage(1); }, [slug, q, sort]);

  useEffect(() => {
    let live = true;
    setLoading(true); setError('');
    api.get<Page<Product>>(`/products${qs({ category: slug, q, sort, page, limit: 12 })}`)
      .then((r) => { if (!live) return; setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items])); setPages(r.pages); setTotal(r.total); })
      .catch((e: Error) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [slug, q, sort, page]);

  const cat = categories.find((c) => c.slug === slug);
  const chip = (active: boolean) => `shrink-0 h-9 px-4 rounded-full text-sm font-semibold border transition-colors flex items-center ${active ? 'bg-primary text-white border-primary' : 'bg-white border-border-warm hover:border-primary'}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{q ? `Results for “${q}”` : cat?.name ?? 'All products'}</h1>
      {cat?.description && !q && <p className="text-on-surface-variant mt-2 max-w-2xl">{cat.description}</p>}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Link to="/shop" className={chip(!slug)}>All</Link>
          {categories.map((c) => <Link key={c.id} to={`/shop/${c.slug}`} className={chip(c.slug === slug)}>{c.name}</Link>)}
        </div>
        <select aria-label="Sort products" value={sort} className={`${inputCls} sm:w-52`}
          onChange={(e) => { const n = new URLSearchParams(params); n.set('sort', e.target.value); setParams(n, { replace: true }); }}>
          <option value="popular">Most popular</option><option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
        </select>
      </div>

      <div className="mt-6">
        {error && <ErrorBox message={error} />}
        {!error && !loading && items.length === 0 && (
          <Empty icon="search_off" title="No products found" text={q ? 'Try a different spelling or browse all products.' : 'There is nothing in this category yet.'} action={<Link to="/shop" className={btnGhost}>See all products</Link>} />
        )}
        {items.length > 0 && <>
          <p className="text-sm text-text-muted mb-4">{total} product{total === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </>}
        {loading && <div className="py-10 flex justify-center"><Spinner className="w-7 h-7" /></div>}
        {!loading && page < pages && <div className="mt-8 text-center"><button className={btnGhost} onClick={() => setPage((p) => p + 1)}>Show more</button></div>}
      </div>
    </div>
  );
}
