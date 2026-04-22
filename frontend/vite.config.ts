import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev-only: where Vite's HTTP proxy forwards /api and /ws. Inside Docker Compose, must be the
// API container hostname (e.g. http://csms-api:3000), not 127.0.0.1 — that loopback is the frontend pod.
const devApiProxyTarget =
  process.env.DEV_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Ensures ESM prebundle in Vite 5+ when /app/node_modules is a Docker volume
    include: ['react-leaflet', 'leaflet', '@react-leaflet/core'],
  },
  server: {
    port: 3001,
    host: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: devApiProxyTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: devApiProxyTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
