
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true, // Automatically open the app in the browser
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
