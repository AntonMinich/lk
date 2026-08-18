import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": "http://127.0.0.1:3001",
      "/image": "http://127.0.0.1:3001",
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
});
