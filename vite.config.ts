import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Matches the tsconfig `@/*` -> `./*` mapping, which is what lets registry sources import each
  // other as `@/registry/...` — the form the shadcn CLI rewrites on install.
  resolve: { alias: { "@": resolve(import.meta.dirname, ".") } },
});
