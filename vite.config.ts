import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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
        secure: false,
      },
      "/api": {
        target: "http://10.128.1.126",
        changeOrigin: true,
        secure: false,
      },
      // "/debtorsapi": {
      //   target: "http://localhost:44381", 
      //   changeOrigin: true,
      //   secure: false,
      //   rewrite: (path) => path.replace(/^\/debtorsapi/, "") // <-- fix added here
      // },
      "/provincetrial": {
        target: "http://localhost:44381",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/provincetrial/, "") // <-- fix added here

      },

      "/debtorsage": {
        target: "http://localhost:44381",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/debtorsage/, "")
      },

      '/solarapi': {
        target: 'http://localhost:44381',
        changeOrigin: true,
        secure: false
      }


    },
  },
});
