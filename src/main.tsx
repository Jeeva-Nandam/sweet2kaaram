import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ToastProvider } from './components/ui';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';

createRoot(document.getElementById('root')!).render(
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
