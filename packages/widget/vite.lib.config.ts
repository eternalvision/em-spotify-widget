import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/widget.ts',
      formats: ['iife'],
      name: 'SpotifyWidget',
      fileName: () => 'widget.js',
    },
  },
});
