import { defineConfig } from 'vitest/config';

const worker = 'http://127.0.0.1:8790';

export default defineConfig({
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': worker,
      '/card.svg': worker,
      '/embed': worker,
      '/widget.js': worker,
    },
  },
  test: { name: 'widget', environment: 'happy-dom' },
});
