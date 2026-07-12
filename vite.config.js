import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4000,
    open: true
  },
  build: {
    sourcemap: true
  }
});
