import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  /** Set `VITE_BASE_PATH=/repo-name/` when hosting on GitHub Pages project sites (e.g. `/digitalhealthevvm-frontend/`). */
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    host: "::",
    port: 5173,
    /** Avoid browser CORS when calling purl.dev / mpp.dev from the Vite dev server. */
    proxy: {
      "/purl-dev": {
        target: "https://www.purl.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/purl-dev/, ""),
      },
      "/mpp-dev": {
        target: "https://mpp.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mpp-dev/, ""),
      },
      "/parallel-dev": {
        target: "https://parallelmpp.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/parallel-dev/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
