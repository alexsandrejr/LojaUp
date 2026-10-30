import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Em desenvolvimento, as chamadas à API vão para o servidor local (server/dev.js)
    proxy: { '/api': 'http://127.0.0.1:5174' },
  },
  build: { outDir: 'dist', emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
