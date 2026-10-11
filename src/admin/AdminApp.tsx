import { FormEvent, useState } from 'react';
import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ErrorBox, Icon, PageLoader, Spinner, btnPrimary, inputCls, Field } from '../components/ui';
import { useAdmin } from '../context/AdminContext';
import { useStore } from '../context/StoreContext';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import { AdminOrders, AdminOrderDetail } from './Orders';
import Inventory from './Inventory';
import Customers from './Customers';
import Coupons from './Coupons';
import SettingsPage from './SettingsPage';

function Login() {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await login(email, password); } catch (err) { setError((err as Error).message); setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-border-warm rounded-3xl p-7 shadow-sm space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary text-white flex items-center justify-center"><Icon name="admin_panel_settings" className="text-3xl" /></div>
          <h1 className="font-serif text-2xl font-semibold mt-3">Admin sign in</h1>
          <p className="text-sm text-text-muted mt-1">Authorised staff only.</p>
        </div>
        {error && <ErrorBox message={error} />}
        <Field label="Email"><input type="email" required autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" required autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? <Spinner className="border-white/40 border-t-white" /> : 'Sign in'}</button>
        {import.meta.env.DEV && (
          <p className="text-xs text-text-muted bg-surface-container rounded-lg p-3">
            <b>Local development only:</b> sign in with the <code>ADMIN_EMAIL</code> and the password you hashed into <code>ADMIN_PASSWORD_HASH</code> in <code>backend/.env</code>. This hint is not shown on the deployed site.
          </p>
        )}
      </form>
    </div>
  );
}

const links = [
  ['dashboard', 'dashboard', 'Dashboard'], ['orders', 'receipt_long', 'Orders'], ['products', 'inventory_2', 'Products'],
  ['categories', 'category', 'Categories'], ['inventory', 'warehouse', 'Inventory'], ['customers', 'group', 'Customers'],
  ['coupons', 'sell', 'Coupons'], ['settings', 'settings', 'Settings'],
];

function Shell() {
  const { admin, logout } = useAdmin();
  const { settings } = useStore();
  const [open, setOpen] = useState(false);
  const item = ({ isActive }: { isActive: boolean }) => `flex items-center gap-3 px-4 h-11 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`;
  const nav = (
    <nav className="space-y-1" onClick={() => setOpen(false)}>
      {links.map(([to, icon, label]) => <NavLink key={to} to={`/adminpage/${to}`} className={item}><Icon name={icon} className="text-xl" />{label}</NavLink>)}
    </nav>
  );
  return (
    <div className="min-h-screen bg-surface-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:flex flex-col bg-white border-r border-border-warm p-4 sticky top-0 h-screen">
        <div className="font-serif text-xl font-bold text-primary px-2 mb-6">{settings.storeName}<div className="text-[11px] font-sans font-semibold text-text-muted">Admin portal</div></div>
        {nav}
        <div className="mt-auto space-y-1 pt-4 border-t border-border-warm">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 h-10 text-sm text-on-surface-variant hover:text-primary"><Icon name="open_in_new" className="text-xl" />View store</a>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 h-10 text-sm text-error cursor-pointer"><Icon name="logout" className="text-xl" />Sign out</button>
          <div className="px-4 text-xs text-text-muted truncate">{admin?.email}</div>
        </div>
      </aside>

      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-border-warm h-14 px-4 flex items-center justify-between">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="cursor-pointer"><Icon name="menu" /></button>
        <span className="font-serif font-bold text-primary">Admin</span>
        <button onClick={logout} aria-label="Sign out" className="cursor-pointer"><Icon name="logout" /></button>
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>{nav}</div>
        </div>
      )}

      <main className="p-4 sm:p-8 min-w-0"><Outlet /></main>
    </div>
  );
}

export default function AdminApp() {
  const { admin, loading } = useAdmin();
  if (loading) return <PageLoader />;
  if (!admin) return <Login />;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}
