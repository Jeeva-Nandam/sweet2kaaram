import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Empty, ErrorBox, Field, Icon, Modal, PageLoader, Spinner, Toggle, btnGhost, btnPrimary, inputCls, useToast } from '../components/ui';
import { api } from '../lib/api';
import { dateOnly, rupees } from '../lib/format';
import type { Coupon } from '../lib/types';

const blank = { code: '', description: '', type: 'PERCENT' as 'PERCENT' | 'FLAT', value: '', maxDiscount: '', minOrder: '', expiresAt: '', usageLimit: '', isActive: true };
const ist = (d: string) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export default function Coupons() {
  const toast = useToast();
  const [list, setList] = useState<Coupon[] | null>(null);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<{ id?: string; f: typeof blank } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  const load = useCallback(() => { api.get<Coupon[]>('/admin/coupons').then(setList).catch((e: Error) => setError(e.message)); }, []);
  useEffect(load, [load]);
  const set = (k: keyof typeof blank, v: string | boolean) => setEdit((x) => (x ? { ...x, f: { ...x.f, [k]: v } } : x));

  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!edit) return;
    const f = edit.f;
    const body = { code: f.code, description: f.description, type: f.type, value: Number(f.value), maxDiscount: Number(f.maxDiscount || 0), minOrder: Number(f.minOrder || 0),
      usageLimit: Number(f.usageLimit || 0), isActive: f.isActive, expiresAt: f.expiresAt ? `${f.expiresAt}T23:59:59+05:30` : null };
    setSaving(true); setFormErr('');
    try {
      if (edit.id) await api.put(`/admin/coupons/${edit.id}`, body); else await api.post('/admin/coupons', body);
      toast.ok('Coupon saved'); setEdit(null); load();
    } catch (err) { setFormErr((err as Error).message); } finally { setSaving(false); }
  };
  const remove = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await api.del(`/admin/coupons/${c.id}`); toast.ok('Coupon deleted'); load(); } catch (e) { toast.err((e as Error).message); }
  };
  const flip = async (c: Coupon) => {
    try { await api.put(`/admin/coupons/${c.id}`, { ...c, expiresAt: c.expiresAt, isActive: !c.isActive }); load(); } catch (e) { toast.err((e as Error).message); }
  };

  if (error) return <ErrorBox message={error} onRetry={() => { setError(''); load(); }} />;
  if (!list) return <PageLoader />;
  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between"><h1 className="font-serif text-3xl font-semibold">Coupons</h1><button className={btnPrimary} onClick={() => { setFormErr(''); setEdit({ f: blank }); }}><Icon name="add" />Add coupon</button></div>
      {list.length === 0 ? <div className="bg-white border border-border-warm rounded-2xl"><Empty icon="sell" title="No coupons yet" text="Create a discount code that customers can apply in their cart." /></div> : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {list.map((c) => {
            const expired = !!c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <li key={c.id} className="bg-white border border-border-warm rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-bold tracking-wide text-primary">{c.code}</div><div className="text-sm font-semibold">{c.type === 'PERCENT' ? `${c.value}% off${c.maxDiscount ? ` (up to ${rupees(c.maxDiscount)})` : ''}` : `${rupees(c.value)} off`}</div></div>
                  <Toggle checked={c.isActive} onChange={() => flip(c)} label={`Activate ${c.code}`} />
                </div>
                <div className="text-xs text-text-muted mt-2 space-y-0.5">
                  {c.description && <div>{c.description}</div>}
                  <div>{c.minOrder ? `Min order ${rupees(c.minOrder)}` : 'No minimum order'} · Used {c.timesUsed}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</div>
                  <div className={expired ? 'text-error font-semibold' : ''}>{c.expiresAt ? `${expired ? 'Expired' : 'Valid until'} ${dateOnly(c.expiresAt)}` : 'No expiry'}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className={`${btnGhost} h-9 px-3`} onClick={() => { setFormErr(''); setEdit({ id: c.id, f: { code: c.code, description: c.description, type: c.type, value: String(c.value), maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '', minOrder: c.minOrder ? String(c.minOrder) : '', expiresAt: c.expiresAt ? ist(c.expiresAt) : '', usageLimit: c.usageLimit ? String(c.usageLimit) : '', isActive: c.isActive } }); }}>Edit</button>
                  <button className="h-9 px-3 text-sm text-error font-semibold cursor-pointer" onClick={() => remove(c)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit coupon' : 'Add coupon'}>
        {edit && (
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-4">
            <Field label="Code *" hint="Letters and numbers, e.g. WELCOME10"><input required className={`${inputCls} uppercase`} value={edit.f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} /></Field>
            <Field label="Discount type"><select className={inputCls} value={edit.f.type} onChange={(e) => set('type', e.target.value)}><option value="PERCENT">Percentage (%)</option><option value="FLAT">Flat amount (₹)</option></select></Field>
            <Field label={edit.f.type === 'PERCENT' ? 'Percent off *' : 'Rupees off *'}><input required type="number" min={1} max={edit.f.type === 'PERCENT' ? 100 : undefined} className={inputCls} value={edit.f.value} onChange={(e) => set('value', e.target.value)} /></Field>
            {edit.f.type === 'PERCENT' && <Field label="Maximum discount (₹)" hint="0 or empty = no cap"><input type="number" min={0} className={inputCls} value={edit.f.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} /></Field>}
            <Field label="Minimum order (₹)"><input type="number" min={0} className={inputCls} value={edit.f.minOrder} onChange={(e) => set('minOrder', e.target.value)} /></Field>
            <Field label="Total uses allowed" hint="Empty = unlimited"><input type="number" min={0} className={inputCls} value={edit.f.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} /></Field>
            <Field label="Valid until (optional)"><input type="date" className={inputCls} value={edit.f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field label="Description (optional)"><input className={inputCls} maxLength={160} value={edit.f.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
            <label className="sm:col-span-2 flex items-center gap-3 text-sm"><Toggle checked={edit.f.isActive} onChange={(v) => set('isActive', v)} label="Active" />Active</label>
            {formErr && <div className="sm:col-span-2"><ErrorBox message={formErr} /></div>}
            <div className="sm:col-span-2 flex gap-3 justify-end"><button type="button" className={btnGhost} onClick={() => setEdit(null)}>Cancel</button><button className={btnPrimary} disabled={saving}>{saving ? <Spinner className="border-white/40 border-t-white" /> : 'Save coupon'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
