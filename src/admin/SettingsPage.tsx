import { FormEvent, ReactNode, useEffect, useState } from 'react';
import ImageInput from '../components/ImageInput';
import { ErrorBox, Field, PageLoader, Spinner, Toggle, btnPrimary, inputCls, useToast } from '../components/ui';
import { useStore } from '../context/StoreContext';
import { api } from '../lib/api';
import type { Settings } from '../lib/types';
import { useApi } from '../lib/useApi';

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="bg-white border border-border-warm rounded-2xl p-5 space-y-4"><h2 className="font-serif text-xl font-semibold">{title}</h2>{children}</section>
);

export default function SettingsPage() {
  const toast = useToast();
  const { reload } = useStore();
  const { data, error, loading } = useApi<Settings>('/admin/settings');
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  useEffect(() => { if (data) setS(data); }, [data]);

  if (loading && !s) return <PageLoader />;
  if (error || !s) return <ErrorBox message={error || 'Could not load settings'} />;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => (x ? { ...x, [k]: v } : x));
  const txt = (k: keyof Settings) => (e: { target: { value: string } }) => set(k, e.target.value as never);

  const save = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      const { onlinePaymentEnabled: _skip, ...rest } = s;
      void _skip;
      await api.put('/admin/settings', { ...rest, freeShippingThreshold: Number(s.freeShippingThreshold), shippingFee: Number(s.shippingFee) });
      reload(); toast.ok('Settings saved');
    } catch (err) { setFormErr((err as Error).message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5">
      <h1 className="font-serif text-3xl font-semibold">Store settings</h1>
      <Card title="Orders">
        <label className="flex items-center gap-3 text-sm"><Toggle checked={s.isAcceptingOrders} onChange={(v) => set('isAcceptingOrders', v)} label="Accepting orders" /><span><b>Accepting new orders</b><br /><span className="text-text-muted">Turn off to pause checkout, for example during holidays.</span></span></label>
        {!s.isAcceptingOrders && <Field label="Message shown to customers"><input className={inputCls} value={s.pausedMessage} onChange={txt('pausedMessage')} /></Field>}
      </Card>
      <Card title="Shipping and payment">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Shipping fee (₹)"><input type="number" min={0} className={inputCls} value={s.shippingFee} onChange={(e) => set('shippingFee', e.target.value as never)} /></Field>
          <Field label="Free shipping above (₹)"><input type="number" min={0} className={inputCls} value={s.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', e.target.value as never)} /></Field>
        </div>
        <label className="flex items-center gap-3 text-sm"><Toggle checked={s.codEnabled} onChange={(v) => set('codEnabled', v)} label="Cash on delivery" />Cash on delivery</label>
        <p className="text-xs text-text-muted">Online payment (UPI and cards) will be added later. Until then, COD is the only way to order.</p>
      </Card>
      <Card title="Home page banner">
        <ImageInput kind="hero" value={s.heroImage} onChange={(u) => set('heroImage', u)} />
        <Field label="Headline"><input className={inputCls} maxLength={100} value={s.heroTitle} onChange={txt('heroTitle')} /></Field>
        <Field label="Sub-heading"><input className={inputCls} maxLength={200} value={s.heroSubtitle} onChange={txt('heroSubtitle')} /></Field>
        <Field label="Top ribbon message" hint="Leave empty to show the free-shipping message"><input className={inputCls} maxLength={200} value={s.announcement} onChange={txt('announcement')} /></Field>
      </Card>
      <Card title="Store details">
        <Field label="Store name"><input required className={inputCls} value={s.storeName} onChange={txt('storeName')} /></Field>
        <Field label="Tagline"><input className={inputCls} value={s.tagline} onChange={txt('tagline')} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone"><input className={inputCls} value={s.contactPhone} onChange={txt('contactPhone')} /></Field>
          <Field label="WhatsApp number" hint="With country code, e.g. 919876543210"><input className={inputCls} value={s.whatsapp} onChange={txt('whatsapp')} /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputCls} value={s.contactEmail} onChange={txt('contactEmail')} /></Field>
        <Field label="Address"><input className={inputCls} value={s.address} onChange={txt('address')} /></Field>
      </Card>
      {formErr && <ErrorBox message={formErr} />}
      <div className="sticky bottom-4"><button className={`${btnPrimary} w-full sm:w-auto shadow-lg`} disabled={saving}>{saving ? <Spinner className="border-white/40 border-t-white" /> : 'Save settings'}</button></div>
    </form>
  );
}
