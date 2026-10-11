import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    server: { port: 5173 },
    define: {
      'import.meta.env.API_URL': JSON.stringify(env.API_URL ?? ''),
      'import.meta.env.GOOGLE_CLIENT_ID': JSON.stringify(env.GOOGLE_CLIENT_ID ?? ''),
    },
  };
});
