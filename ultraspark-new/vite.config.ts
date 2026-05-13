import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Static Render deployment note:
// This frontend is deployed as a client-side SPA. Render Static Sites do not run
// TanStack Start's SSR/server output, so this config intentionally builds only
// the browser bundle into dist/client.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
