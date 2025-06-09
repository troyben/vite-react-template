import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  build: {
    rollupOptions: {
      input: {
        app: './index.html',
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          styles: ['./src/react-app/styles/base.css'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src/react-app',
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
