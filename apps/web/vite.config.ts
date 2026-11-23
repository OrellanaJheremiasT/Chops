// Development proxies API requests locally. Production assets use the repository subpath expected by GitHub Pages.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],

  base: command === "serve" ? "/" : "/Chops/",

  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
}));
