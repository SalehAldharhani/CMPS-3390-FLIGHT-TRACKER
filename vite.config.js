import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config: dev server proxies /api/* to the Express backend on :3001
// so the team can develop client + server simultaneously without CORS issues.
//
// PWA support is provided manually via /public/manifest.json and /public/sw.js
// rather than a plugin — easier to read, easier to demo, no build magic.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
