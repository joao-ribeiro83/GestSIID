import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

// base: './' — the API injects <base href="${BASE_PATH}/"> into index.html at startup
// (ARCHITECTURE.md §2).
export default defineConfig({
  base: './',
  // tanstackRouter must come before react() (file-based routing codegen).
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  // `pnpm --filter @gestsiid/api dev:mock` serves the in-memory demo API here (dev-server.ts).
  server: { proxy: { '/api': `http://127.0.0.1:${process.env['DEV_API_PORT'] ?? 3200}` } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
