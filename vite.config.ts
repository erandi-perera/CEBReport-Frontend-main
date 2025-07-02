import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/CBRSAPI": {
        target: "http://10.128.1.126",
        changeOrigin: true,
        secure: false,
      },
      "/CEBINFO_API_2025": {
        target: "http://10.128.1.126",
        changeOrigin: true,
        secure: false,
      },
      "/misapi": {
        target: "http://10.128.1.126",
        changeOrigin: true,
        secure: false, // allow self-signed certs
      },
      "/api": {
        target: "http://10.128.1.126",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
