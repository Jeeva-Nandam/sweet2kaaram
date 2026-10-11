import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { ErrorBox, Icon, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

const CLIENT_ID = (import.meta.env.GOOGLE_CLIENT_ID as string | undefined) ?? '';

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const { settings } = useStore();
  const loc = useLocation();
  const st = (loc.state ?? {}) as { from?: string; reason?: string };
  const to = st.from && st.from.startsWith('/') ? st.from : '/';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to={to} replace />;

  const onCredential = async (credential?: string) => {
    if (!credential) { setError('Google did not return a sign-in token. Please try again.'); return; }
    setBusy(true); setError('');
    try { await loginWithGoogle(credential); } catch (e) { setError((e as Error).message); setBusy(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
      <div className="bg-white border border-border-warm rounded-3xl p-7 sm:p-10 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container text-white flex items-center justify-center mb-4"><Icon name="skillet" className="text-3xl" /></div>
        <h1 className="font-serif text-3xl font-semibold">{st.reason === 'checkout' ? 'Log in to checkout' : 'Welcome'}</h1>
        <p className="text-sm text-on-surface-variant mt-2">
          {st.reason === 'checkout'
            ? 'Your cart is saved. Log in with Google to choose a delivery address and place your order.'
            : `Log in with your Google account to order from ${settings.storeName} and track your orders.`}
        </p>

        <div className="mt-8 flex justify-center min-h-11">
          {!CLIENT_ID ? (
            <ErrorBox message="Google login is not set up yet. Add GOOGLE_CLIENT_ID to the frontend environment settings." />
          ) : busy ? (
            <div className="flex items-center gap-3 text-sm text-text-muted"><Spinner />Signing you in…</div>
          ) : (
            <GoogleOAuthProvider clientId={CLIENT_ID}>
              <GoogleLogin onSuccess={(r) => onCredential(r.credential)} onError={() => setError('Google sign-in was cancelled or failed. Please try again.')} text="continue_with" shape="rectangular" size="large" width="300" />
            </GoogleOAuthProvider>
          )}
        </div>
        {error && <div className="mt-5 text-left"><ErrorBox message={error} /></div>}
        <p className="text-xs text-text-muted mt-8">We only use your name, email and photo from Google to create your account. You can browse and fill your cart without logging in.</p>
      </div>
    </div>
  );
}
