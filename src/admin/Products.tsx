import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageInput from '../components/ImageInput';
import { Empty, ErrorBox, Field, Icon, Img, Modal, PageLoader, Spinner, Toggle, btnGhost, btnPrimary, inputCls, textareaCls, useToast } from '../components/ui';
import { api, qs } from '../lib/api';
import { rupees } from '../lib/format';
import type { Category, Page, Product } from '../lib/types';

type Form = {
  name: string; nativeTitle: string; category: string; origin: string; weight: string; price: string; originalPrice: string;
  description: string; ingredients: string; shelfLife: string; image: string; badge: string; isVeg: boolean;
  stock: string; lowStockThreshold: string; isActive: boolean; isTopSeller: boolean;
};
const blank: Form = {
  name: '', nativeTitle: '', category: '', origin: '', weight: '', price: '', originalPrice: '', description: '', ingredients: '',
  shelfLife: '', image: '', badge: '', isVeg: true, stock: '0', lowStockThreshold: '10', isActive: true, isTopSeller: false,
};
const toForm = (p: Product): Form => ({
  ...p, price: String(p.price), originalPrice: p.originalPrice ? String(p.originalPrice) : '', ingredients: p.ingredients.join(', '),
  stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold),
});

export default function Products() {
  const toast = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [list, setList] = useState<Page<Product> | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id?: string; form: Form } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = useCallback(() => {
    api.get<Page<Product>>(`/admin/products${qs({ q, category: cat, state, page, limit: 15 })}`).then(setList).catch((e: Error) => setError(e.message));
  }, [q, cat, state, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get<Category[]>('/admin/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => setPage(1), [q, cat, state]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const f = editing.form;
    const body = {
      ...f, price: Number(f.price), originalPrice: Number(f.originalPrice || 0), stock: Number(f.stock || 0), lowStockThreshold: Number(f.lowStockThreshold || 0),
      ingredients: f.ingredients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
    };
    setSaving(true); setFormErr('');
    try {
      if (editing.id) await api.put(`/admin/products/${editing.id}`, body); else await api.post('/admin/products', body);
      toast.ok(editing.id ? 'Product updated' : 'Product added');
      setEditing(null); load();
    } catch (err) { setFormErr((err as Error).message); } finally { setSaving(false); }
  };

  const toggle = async (p: Product) => {
    try { await api.put(`/admin/products/${p.id}`, { isActive: !p.isActive }); load(); } catch (e) { toast.err((e as Error).message); }
  };
  const remove = async (p: Product) => {
    if (!window.confirm(`Delete “${p.name}”? Past orders keep their copy of it.`)) return;
    try { await api.del(`/admin/products/${p.id}`); toast.ok('Product deleted'); load(); } catch (e) { toast.err((e as Error).message); }
  };

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Products</h1>
        <button className={btnPrimary} onClick={() => { setFormErr(''); setEditing({ form: { ...blank, category: cats[0]?.slug ?? '' } }); }}><Icon name="add" />Add product</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <input className={inputCls} placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
        <select className={inputCls} value={state} onChange={(e) => setState(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option><option value="active">Visible</option><option value="hidden">Hidden</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
      </div>

      {error && <ErrorBox message={error} onRetry={() => { setError(''); load(); }} />}
      {!list && !error && <PageLoader />}
      {list && list.items.length === 0 && (
        <div className="bg-white border border-border-warm rounded-2xl">
          <Empty icon="inventory_2" title="No products yet" text={cats.length === 0 ? 'Create a category first, then add your products.' : 'Add your first product to start selling.'}
            action={cats.length === 0 ? <Link to="/adminpage/categories" className={btnPrimary}>Create a category</Link> : <button className={btnPrimary} onClick={() => setEditing({ form: { ...blank, category: cats[0].slug } })}>Add product</button>} />
        </div>
      )}
      {list && list.items.length > 0 && (
        <div className="bg-white border border-border-warm rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[40rem]">
            <thead className="text-left text-xs text-text-muted border-b border-border-warm"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Visible</th><th className="p-3 w-24" /></tr></thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id} className="border-b border-border-warm last:border-0">
                  <td className="p-3"><div className="flex items-center gap-3"><Img src={p.image} alt={p.name} className="w-12 h-12 rounded-lg shrink-0" /><div><div className="font-semibold">{p.name}</div><div className="text-xs text-text-muted">{p.weight}</div></div></div></td>
                  <td className="p-3 text-on-surface-variant">{cats.find((c) => c.slug === p.category)?.name ?? p.category}</td>
                  <td className="p-3 font-semibold">{rupees(p.price)}</td>
                  <td className={`p-3 font-semibold ${p.stock === 0 ? 'text-error' : p.stock <= p.lowStockThreshold ? 'text-secondary' : ''}`}>{p.stock}</td>
                  <td className="p-3"><Toggle checked={p.isActive} onChange={() => toggle(p)} label={`Show ${p.name} in store`} /></td>
                  <td className="p-3"><div className="flex gap-1">
                    <button aria-label={`Edit ${p.name}`} className="p-2 text-on-surface-variant hover:text-primary cursor-pointer" onClick={() => { setFormErr(''); setEditing({ id: p.id, form: toForm(p) }); }}><Icon name="edit" className="text-xl" /></button>
                    <button aria-label={`Delete ${p.name}`} className="p-2 text-on-surface-variant hover:text-error cursor-pointer" onClick={() => remove(p)}><Icon name="delete" className="text-xl" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list && list.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {list.page} of {list.pages}</span>
          <button className={btnGhost} disabled={page >= list.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit product' : 'Add product'} wide>
        {editing && (
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Field label="Product name *"><input required className={inputCls} value={editing.form.name} onChange={(e) => set('name', e.target.value)} /></Field></div>
            <Field label="Name in local language (optional)"><input className={inputCls} value={editing.form.nativeTitle} onChange={(e) => set('nativeTitle', e.target.value)} /></Field>
            <Field label="Category *">
              <select required className={inputCls} value={editing.form.category} onChange={(e) => set('category', e.target.value)}><option value="">Choose…</option>{cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}</select>
            </Field>
            <Field label="Pack weight *" hint="e.g. 500 g"><input required className={inputCls} value={editing.form.weight} onChange={(e) => set('weight', e.target.value)} /></Field>
            <Field label="Origin / region"><input className={inputCls} value={editing.form.origin} onChange={(e) => set('origin', e.target.value)} /></Field>
            <Field label="Selling price (₹) *"><input required type="number" min={1} className={inputCls} value={editing.form.price} onChange={(e) => set('price', e.target.value)} /></Field>
            <Field label="MRP (₹)" hint="Optional. Shows a discount when higher than the price"><input type="number" min={0} className={inputCls} value={editing.form.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} /></Field>
            <Field label="Stock quantity"><input type="number" min={0} className={inputCls} value={editing.form.stock} onChange={(e) => set('stock', e.target.value)} /></Field>
            <Field label="Low-stock alert at" hint="Warn me when stock is at or below this"><input type="number" min={0} className={inputCls} value={editing.form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Description"><textarea className={textareaCls} value={editing.form.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
            <div className="sm:col-span-2"><Field label="Ingredients" hint="Separate with commas"><input className={inputCls} value={editing.form.ingredients} onChange={(e) => set('ingredients', e.target.value)} /></Field></div>
            <Field label="Shelf life"><input className={inputCls} placeholder="e.g. 30 days" value={editing.form.shelfLife} onChange={(e) => set('shelfLife', e.target.value)} /></Field>
            <Field label="Badge (optional)" hint="Small tag on the card, e.g. New"><input className={inputCls} maxLength={30} value={editing.form.badge} onChange={(e) => set('badge', e.target.value)} /></Field>
            <div className="sm:col-span-2"><span className="block text-sm font-semibold mb-1.5">Product image</span><ImageInput kind="product" value={editing.form.image} onChange={(u) => set('image', u)} /></div>
            <div className="sm:col-span-2 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <label className="flex items-center gap-3"><Toggle checked={editing.form.isVeg} onChange={(v) => set('isVeg', v)} label="Vegetarian" />Vegetarian</label>
              <label className="flex items-center gap-3"><Toggle checked={editing.form.isActive} onChange={(v) => set('isActive', v)} label="Visible in store" />Visible in store</label>
              <label className="flex items-center gap-3"><Toggle checked={editing.form.isTopSeller} onChange={(v) => set('isTopSeller', v)} label="Top seller" />Show in “Top sellers”</label>
            </div>
            {formErr && <div className="sm:col-span-2"><ErrorBox message={formErr} /></div>}
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" className={btnGhost} onClick={() => setEditing(null)}>Cancel</button>
              <button className={btnPrimary} disabled={saving}>{saving ? <Spinner className="border-white/40 border-t-white" /> : 'Save product'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
