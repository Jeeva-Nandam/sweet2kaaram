import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App';
import { ToastProvider } from './components/ui';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';

const GOOGLE_CLIENT_ID = (import.meta.env.GOOGLE_CLIENT_ID as string | undefined) ?? '';

const application = (
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <AuthProvider>
            <CartProvider>
              <AdminProvider>
                <App />
              </AdminProvider>
            </CartProvider>
          </AuthProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);

createRoot(document.getElementById('root')!).render(
  GOOGLE_CLIENT_ID
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{application}</GoogleOAuthProvider>
    : application
);
