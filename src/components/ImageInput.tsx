import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { Icon, Img, Spinner, inputCls } from './ui';

type Kind = 'product' | 'hero';
const TARGET: Record<Kind, { w: number; h: number }> = { product: { w: 1200, h: 1200 }, hero: { w: 1600, h: 700 } };

/** Centre-crops the picked photo to the exact shape the site uses, shrinks it, and returns a JPEG blob. */
async function prepare(file: File, kind: Kind): Promise<Blob> {
  const { w, h } = TARGET[kind];
  const bmp = await createImageBitmap(file);
  const ratio = w / h;
  let cw = bmp.width, ch = bmp.width / ratio;
  if (ch > bmp.height) { ch = bmp.height; cw = bmp.height * ratio; }
  const cx = (bmp.width - cw) / 2, cy = (bmp.height - ch) / 2;
  const outW = Math.min(w, Math.round(cw)), outH = Math.round(outW / ratio);
  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot process images');
  ctx.drawImage(bmp, cx, cy, cw, ch, 0, 0, outW, outH);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not prepare the image'))), 'image/jpeg', 0.86));
}

async function uploadToCloudinary(blob: Blob, kind: Kind): Promise<string> {
  const sig = await api.post<{ cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string }>('/admin/settings/upload-signature', { kind });
  const fd = new FormData();
  fd.append('file', blob);
  fd.append('api_key', sig.apiKey);
  fd.append('timestamp', String(sig.timestamp));
  fd.append('folder', sig.folder);
  fd.append('signature', sig.signature);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.secure_url) throw new Error(j?.error?.message || 'Upload failed. Please try again');
  return j.secure_url as string;
}

export default function ImageInput({ value, onChange, kind }: { value: string; onChange: (url: string) => void; kind: Kind }) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const pick = async (f?: File) => {
    if (!f) return;
    setErr('');
    if (!f.type.startsWith('image/')) return setErr('Please choose an image file (JPG, PNG or WebP)');
    if (f.size > 15 * 1024 * 1024) return setErr('That file is over 15 MB. Choose a smaller photo');
    setBusy(true);
    try { onChange(await uploadToCloudinary(await prepare(f, kind), kind)); }
    catch (e) {
      const m = (e as Error).message;
      setErr(m);
      if (/not set up/i.test(m)) setTab('url');
    } finally { setBusy(false); if (file.current) file.current.value = ''; }
  };

  const t = (a: typeof tab) => `h-9 px-4 text-sm font-semibold rounded-lg cursor-pointer ${tab === a ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`;
  const guide = kind === 'product'
    ? 'Best size: 1200 × 1200 px (square), JPG or WebP, under 500 KB. Keep the food in the middle: the home card trims 12% off the top and bottom.'
    : 'Best size: 1600 × 700 px (wide), JPG or WebP, under 600 KB. Keep the main subject in the centre; phones show a narrower slice.';

  return (
    <div className="rounded-xl border border-border-warm p-4 bg-surface-container-low/50">
      <div className="flex gap-2 mb-3">
        <button type="button" className={t('upload')} onClick={() => setTab('upload')}>Upload from device</button>
        <button type="button" className={t('url')} onClick={() => setTab('url')}>Paste image link</button>
      </div>

      {tab === 'upload' ? (
        <div>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => file.current?.click()}
            className="w-full h-24 rounded-xl border-2 border-dashed border-border-warm bg-white flex flex-col items-center justify-center gap-1 text-sm text-on-surface-variant hover:border-primary cursor-pointer disabled:opacity-60">
            {busy ? <><Spinner /><span>Uploading…</span></> : <><Icon name="cloud_upload" className="text-3xl text-primary" /><span>Tap to choose a photo. It is cropped and compressed for you.</span></>}
          </button>
        </div>
      ) : (
        <input className={inputCls} placeholder="https://example.com/photo.jpg" value={value} onChange={(e) => { setErr(''); onChange(e.target.value.trim()); }} aria-label="Image link" />
      )}

      <p className="text-xs text-text-muted mt-2">{guide}</p>
      {err && <p className="text-sm text-error mt-2" role="alert">{err}</p>}

      {value ? (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold">Preview: how it will look</span><button type="button" className="text-xs text-error font-semibold cursor-pointer" onClick={() => onChange('')}>Remove image</button></div>
          {kind === 'product' ? (
            <div className="flex gap-4 items-end flex-wrap">
              <figure><Img src={value} alt="Home card preview" className="w-40 aspect-[4/3] rounded-xl" /><figcaption className="text-[11px] text-text-muted mt-1">Home page card (4:3)</figcaption></figure>
              <figure><Img src={value} alt="Product page preview" className="w-28 aspect-square rounded-xl" /><figcaption className="text-[11px] text-text-muted mt-1">Product page (square)</figcaption></figure>
              <figure><Img src={value} alt="Order thumbnail preview" className="w-14 h-14 rounded-xl" /><figcaption className="text-[11px] text-text-muted mt-1">Order details (56 px)</figcaption></figure>
            </div>
          ) : <Img src={value} alt="Hero preview" className="w-full aspect-[16/7] rounded-xl" />}
        </div>
      ) : null}
    </div>
  );
}
