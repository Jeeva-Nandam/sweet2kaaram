import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Icon } from './ui';

export default function Footer() {
  const { settings: s, categories } = useStore();
  return (
    <footer className="bg-inverse-surface text-inverse-on-surface mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-serif text-2xl font-bold text-white">{s.storeName}</div>
          {s.tagline && <p className="text-sm mt-2 text-inverse-on-surface/80 max-w-xs">{s.tagline}</p>}
        </div>
        <div>
          <h3 className="font-bold text-white mb-3">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/shop">All products</Link></li>
            {categories.map((c) => <li key={c.id}><Link className="hover:text-white" to={`/shop/${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white mb-3">Help</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/orders">My orders</Link></li>
            <li><Link className="hover:text-white" to="/track">Track an order</Link></li>
            <li><Link className="hover:text-white" to="/about">About us</Link></li>
            <li><Link className="hover:text-white" to="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white mb-3">Contact</h3>
          <ul className="space-y-2 text-sm">
            {s.contactPhone && <li className="flex gap-2"><Icon name="call" className="text-lg" /><a href={`tel:${s.contactPhone}`} className="hover:text-white">{s.contactPhone}</a></li>}
            {s.contactEmail && <li className="flex gap-2"><Icon name="mail" className="text-lg" /><a href={`mailto:${s.contactEmail}`} className="hover:text-white break-all">{s.contactEmail}</a></li>}
            {s.address && <li className="flex gap-2"><Icon name="location_on" className="text-lg shrink-0" /><span>{s.address}</span></li>}
            {!s.contactPhone && !s.contactEmail && !s.address && <li className="text-inverse-on-surface/70">[EMAIL_ADDRESS]</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-inverse-on-surface/70">© {new Date().getFullYear()} {s.storeName}</div>
    </footer>
  );
}
