import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { Icon } from './ui';

export default function Header() {
  const { settings, categories } = useStore();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const loc = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMenu(false), [loc.pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const submit = (e: FormEvent) => { e.preventDefault(); nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop'); };

  const ribbon = !settings.isAcceptingOrders
    ? settings.pausedMessage || 'We are not taking new orders right now.'
    : settings.announcement || 'Shipping calculated by delivery state and order value';

  const tab = ({ isActive }: { isActive: boolean }) =>
    `shrink-0 px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'}`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-warm">
      <div className={`${settings.isAcceptingOrders ? 'bg-primary' : 'bg-error'} text-white text-xs font-semibold text-center py-1.5 px-4`}>{ribbon}</div>

      <div className="max-w-7xl mx-auto px-3 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
        {/* Left: Logo */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-transform"
            aria-label={`${settings.storeName || 'Sweet2Kaaram'} home`}
          >
            <img
              src="https://res.cloudinary.com/dvw4oasd1/image/upload/v1791729052/s2k-logo-removebg-preview_qzpgkp.png"
              alt={settings.storeName || 'Sweet2Kaaram'}
              className="h-9 sm:h-11 md:h-14 lg:h-15 w-auto aspect-[3/2] object-contain transition-transform duration-200 group-hover:scale-105"
              loading="eager"
              decoding="async"
            />
          </Link>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center px-2 sm:px-4 md:px-6 min-w-0">
          <form onSubmit={submit} role="search" className="w-full max-w-md lg:max-w-xl relative">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-lg sm:text-xl pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sweets, snacks, pickles…"
              aria-label="Search products"
              className="w-full h-9 sm:h-10 md:h-11 pl-9 sm:pl-10 pr-3 sm:pr-4 rounded-full border border-border-warm bg-surface/80 hover:bg-surface focus:bg-white text-xs sm:text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
            />
          </form>
        </div>

        {/* Right: Cart & Account */}
        <div className="flex items-center justify-end gap-1 sm:gap-3 shrink-0">
          <Link
            to="/cart"
            className="relative p-2 text-on-surface hover:text-primary transition-colors rounded-full hover:bg-surface-container"
            aria-label={`Cart, ${count} items`}
          >
            <Icon name="shopping_bag" className="text-2xl sm:text-[26px]" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setMenu((m) => !m)}
                aria-haspopup="menu"
                aria-expanded={menu}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container cursor-pointer transition-colors"
              >
                {user.picture ? (
                  <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover" />
                ) : (
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs sm:text-sm">
                    {user.name[0]}
                  </span>
                )}
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-60 bg-white border border-border-warm rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-border-warm mb-1">
                    <div className="font-semibold text-sm truncate">{user.name}</div>
                    <div className="text-xs text-text-muted truncate">{user.email}</div>
                  </div>
                  <Link role="menuitem" to="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-container"><Icon name="receipt_long" className="text-xl" />My orders</Link>
                  <Link role="menuitem" to="/track" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-container"><Icon name="local_shipping" className="text-xl" />Track an order</Link>
                  <button role="menuitem" onClick={() => { logout(); nav('/'); }} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-surface-container cursor-pointer"><Icon name="logout" className="text-xl" />Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-lg border border-primary text-primary text-xs sm:text-sm font-bold flex items-center hover:bg-primary hover:text-white transition-colors shrink-0"
            >
              Log in
            </Link>
          )}
        </div>
      </div>

      <nav aria-label="Categories" className="border-t border-border-warm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex overflow-x-auto [scrollbar-width:none]">
          <NavLink to="/" end className={tab}>Home</NavLink>
          <NavLink to="/shop" end className={tab}>All products</NavLink>
          {categories.map((c) => <NavLink key={c.id} to={`/shop/${c.slug}`} className={tab}>{c.name}</NavLink>)}
          <NavLink to="/track" className={tab}>Track order</NavLink>
        </div>
      </nav>
    </header>
  );
}
