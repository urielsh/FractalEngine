import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    sourcemap: mode !== 'production',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['three'],
  },
}));
