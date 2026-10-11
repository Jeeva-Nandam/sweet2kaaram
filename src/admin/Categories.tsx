import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Empty, ErrorBox, Field, Icon, Modal, PageLoader, Spinner, Toggle, btnGhost, btnPrimary, inputCls, useToast } from '../components/ui';
import { api } from '../lib/api';
import type { Category } from '../lib/types';

const blank = { name: '', description: '', icon: 'restaurant', isActive: true, sortOrder: '0' };
const ICONS = ['restaurant', 'cookie', 'bakery_dining', 'icecream', 'ramen_dining', 'lunch_dining', 'nutrition', 'eco', 'grain', 'local_dining', 'card_giftcard', 'celebration'];

export default function Categories() {
  const toast = useToast();
  const [list, setList] = useState<Category[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ id?: string; f: typeof blank } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = useCallback(() => { api.get<Category[]>('/admin/categories').then(setList).catch((e: Error) => setError(e.message)); }, []);
  useEffect(load, [load]);

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!edit) return;
    setSaving(true); setFormErr('');
    const body = { ...edit.f, sortOrder: Number(edit.f.sortOrder || 0) };
    try {
      if (edit.id) await api.put(`/admin/categories/${edit.id}`, body); else await api.post('/admin/categories', body);
      toast.ok('Category saved'); setEdit(null); load();
    } catch (err) { setFormErr((err as Error).message); } finally { setSaving(false); }
  };
  const remove = async (c: Category) => {
    if (!window.confirm(`Delete the “${c.name}” category?`)) return;
    try { await api.del(`/admin/categories/${c.id}`); toast.ok('Category deleted'); load(); } catch (e) { toast.err((e as Error).message); }
  };
  const set = (k: keyof typeof blank, v: string | boolean) => setEdit((x) => (x ? { ...x, f: { ...x.f, [k]: v } } : x));

  if (error) return <ErrorBox message={error} onRetry={() => { setError(''); load(); }} />;
  if (!list) return <PageLoader />;
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between"><h1 className="font-serif text-3xl font-semibold">Categories</h1><button className={btnPrimary} onClick={() => { setFormErr(''); setEdit({ f: blank }); }}><Icon name="add" />Add category</button></div>
      {list.length === 0 ? <div className="bg-white border border-border-warm rounded-2xl"><Empty icon="category" title="No categories yet" text="Categories group your products in the store menu, for example Sweets or Pickles." action={<button className={btnPrimary} onClick={() => setEdit({ f: blank })}>Add the first category</button>} /></div> : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {list.map((c) => (
            <li key={c.id} className="bg-white border border-border-warm rounded-2xl p-4 flex gap-4 items-start">
              <span className="w-11 h-11 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0"><Icon name={c.icon} className="text-2xl" /></span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{c.name} {!c.isActive && <span className="text-xs bg-surface-container px-2 py-0.5 rounded ml-1">Hidden</span>}</div>
                <div className="text-xs text-text-muted">{c.itemCount ?? 0} product{c.itemCount === 1 ? '' : 's'} · /shop/{c.slug}</div>
                {c.description && <p className="text-sm text-on-surface-variant mt-1">{c.description}</p>}
              </div>
              <div className="flex">
                <button aria-label={`Edit ${c.name}`} className="p-2 hover:text-primary cursor-pointer" onClick={() => { setFormErr(''); setEdit({ id: c.id, f: { name: c.name, description: c.description, icon: c.icon, isActive: c.isActive, sortOrder: String(c.sortOrder) } }); }}><Icon name="edit" className="text-xl" /></button>
                <button aria-label={`Delete ${c.name}`} className="p-2 hover:text-error cursor-pointer" onClick={() => remove(c)}><Icon name="delete" className="text-xl" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit category' : 'Add category'}>
        {edit && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Name *"><input required className={inputCls} value={edit.f.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Short description"><input className={inputCls} maxLength={300} value={edit.f.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Icon" hint="Pick one, or type any Material Symbols icon name">
              <div className="flex flex-wrap gap-2 mb-2">{ICONS.map((i) => <button key={i} type="button" aria-label={i} onClick={() => set('icon', i)} className={`w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer ${edit.f.icon === i ? 'border-primary bg-surface-container-low text-primary' : 'border-border-warm'}`}><Icon name={i} className="text-xl" /></button>)}</div>
              <input className={inputCls} value={edit.f.icon} onChange={(e) => set('icon', e.target.value.toLowerCase())} />
            </Field>
            <Field label="Menu order" hint="Smaller numbers appear first"><input type="number" min={0} className={inputCls} value={edit.f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></Field>
            <label className="flex items-center gap-3 text-sm"><Toggle checked={edit.f.isActive} onChange={(v) => set('isActive', v)} label="Visible in store" />Visible in store</label>
            {formErr && <ErrorBox message={formErr} />}
            <div className="flex gap-3 justify-end"><button type="button" className={btnGhost} onClick={() => setEdit(null)}>Cancel</button><button className={btnPrimary} disabled={saving}>{saving ? <Spinner className="border-white/40 border-t-white" /> : 'Save'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
