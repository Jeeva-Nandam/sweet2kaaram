import { Link } from 'react-router-dom';
import { Empty, Icon, btnPrimary } from '../components/ui';
import { useStore } from '../context/StoreContext';

export function About() {
  const { settings: s } = useStore();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-10">
      <h1 className="font-serif text-4xl font-semibold">About {s.storeName}</h1>
      <div className="mt-6 space-y-4 text-on-surface-variant leading-relaxed">
        <p>{s.tagline || 'We make regional Indian sweets, savouries, pickles and millet foods in small batches.'}</p>
        <p>Every item is prepared and packed to order, so what reaches your door is as fresh as we can make it. You can follow each order from our kitchen to your address on the tracking page.</p>
      </div>
      <Link to="/shop" className={`${btnPrimary} mt-8`}>Explore the range</Link>
    </div>
  );
}

export function Contact() {
  const { settings: s } = useStore();
  const rows = [
    ['call', 'Phone', s.contactPhone, s.contactPhone && `tel:${s.contactPhone}`],
    ['chat', 'WhatsApp', s.whatsapp, s.whatsapp && `https://wa.me/${s.whatsapp.replace(/\D/g, '')}`],
    ['mail', 'Email', s.contactEmail, s.contactEmail && `mailto:${s.contactEmail}`],
    ['location_on', 'Address', s.address, ''],
  ].filter((r) => r[2]);
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-10">
      <h1 className="font-serif text-4xl font-semibold">Contact us</h1>
      {rows.length === 0 ? <Empty icon="support_agent" title="Contact details coming soon" /> : (
        <ul className="mt-6 space-y-3">
          {rows.map(([icon, label, value, href]) => (
            <li key={label as string} className="flex gap-4 items-start bg-white border border-border-warm rounded-xl p-4">
              <Icon name={icon as string} className="text-primary" />
              <div><div className="text-xs text-text-muted font-semibold">{label}</div>
                {href ? <a href={href as string} className="font-semibold hover:text-primary break-all" {...(String(href).startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{value}</a> : <div className="font-semibold">{value}</div>}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NotFound() {
  return <Empty icon="explore_off" title="Page not found" text="The page you are looking for does not exist." action={<Link to="/" className={btnPrimary}>Go home</Link>} />;
}
