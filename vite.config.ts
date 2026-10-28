import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  // Debug logs (some include order and payment details) are stripped from production builds;
  // console.warn/error are kept for real problems.
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks stay cached across site deploys.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@supabase")) return "supabase";
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return "react";
          return undefined;
        },
      },
    },
  },
  esbuild: {
    pure: mode === "production" ? ["console.log", "console.info", "console.debug"] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
