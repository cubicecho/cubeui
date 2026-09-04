import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Served from a project Pages site, so every asset URL is prefixed. `public/r` rides along:
  // the registry lands at /cubeui/r/{name}.json, which is the URL components.json names.
  base: "/cubeui/",
  plugins: [react(), tailwindcss()],
  // Matches the tsconfig `@/*` -> `./*` mapping, which is what lets registry sources import each
  // other as `@/registry/...` — the form the shadcn CLI rewrites on install.
  resolve: { alias: { "@": resolve(import.meta.dirname, ".") } },
});
