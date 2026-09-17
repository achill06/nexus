import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'geist-font': fileURLToPath(
        new URL('./node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
});
