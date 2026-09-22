#!/usr/bin/env node
/**
 * `npm run install-test` — install the built registry into a throwaway app the way a consumer
 * would, and typecheck what arrived.
 *
 * Every other guard here reads the registry. This one *uses* it: it serves `public/` over HTTP,
 * writes a scratch app with its own `components.json` pointing `@cubeui` at that server, runs
 * `shadcn add` for every item, and then runs the app's own `tsc --noEmit`. That is the only check
 * that sees what the CLI does to a file on the way in — where each type lands, which aliases it
 * rewrites and which specifiers it leaves alone — and it is what found thirty-one items importing
 * `./button` from a directory `button` never lands in.
 *
 * Three apps, all from the same `public/`:
 *
 *   web            Vite + React + TS + Tailwind v4; the stock aliases (`ui` at `@/components/ui`)
 *   web-moved-ui   the same, with `ui` at `@/components/shadcn` — proves the CLI rewrites every
 *                  alias rather than the defaults happening to line up with this repo's
 *   native         React Native + NativeWind 5 against `public/r/native`; typecheck only
 *
 * It needs the network (npm), so it is not part of `npm run check`. Run it after `npm run build`.
 *
 *   node scripts/install-test.mjs                    # all three
 *   node scripts/install-test.mjs web native         # a subset
 *   INSTALL_TEST_DIR=/some/scratch node scripts/install-test.mjs   # where the apps go
 *   SHADCN="npx shadcn@latest" node scripts/install-test.mjs       # a different CLI
 *
 * Story items (`*-stories`) are left out: they need the consumer's Storybook, and rule 10 of
 * `registry:check` is what holds their imports.
 */

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(root, "public");
const SHADCN = process.env.SHADCN ?? `node ${join(root, "node_modules/shadcn/dist/index.js")}`;
const base = process.env.INSTALL_TEST_DIR ?? mkdtempSync(join(tmpdir(), "cubeui-install-"));

const TYPES = { ".json": "application/json", ".css": "text/css", ".html": "text/html" };

/** `public/`, read-only, on an ephemeral port. */
function serve() {
  const server = createServer((req, res) => {
    const rel = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    try {
      const body = readFileSync(join(PUBLIC, rel));
      res.writeHead(200, { "content-type": TYPES[extname(rel)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/** Asynchronous on purpose: the registry server is in this process, and a sync child blocks it. */
function run(cmd, cwd) {
  console.log(`  $ ${cmd.length > 200 ? `${cmd.slice(0, 200)}…` : cmd}`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd,
      shell: true,
      stdio: "inherit",
      env: { ...process.env, CI: "1" },
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    );
  });
}

function itemsOf(registry) {
  const index = JSON.parse(readFileSync(join(PUBLIC, registry, "registry.json"), "utf8"));
  return index.items.map((i) => i.name).filter((n) => !n.endsWith("-stories"));
}

function componentsJson(url, ui) {
  return json({
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: {
      config: "",
      css: "src/index.css",
      baseColor: "neutral",
      cssVariables: true,
      prefix: "",
    },
    iconLibrary: "lucide",
    aliases: {
      components: "@/components",
      ui,
      utils: "@/lib/utils",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    registries: { "@cubeui": url },
  });
}

const COMPILER = {
  target: "ES2022",
  lib: ["ES2022", "DOM", "DOM.Iterable"],
  module: "ESNext",
  moduleResolution: "bundler",
  jsx: "react-jsx",
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  allowImportingTsExtensions: true,
  isolatedModules: true,
  baseUrl: ".",
};

function webApp(dir, url, ui) {
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    json({
      name: "cubeui-install-test",
      private: true,
      type: "module",
      dependencies: { react: "19.1.0", "react-dom": "19.1.0" },
      devDependencies: {
        "@tailwindcss/vite": "^4.3.3",
        "@types/react": "~19.2.0",
        "@types/react-dom": "~19.2.0",
        "@vitejs/plugin-react": "^5.0.0",
        tailwindcss: "^4.3.3",
        typescript: "~5.9.3",
        vite: "^7.0.0",
      },
    }),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    json({
      compilerOptions: { ...COMPILER, types: ["vite/client"], paths: { "@/*": ["./src/*"] } },
      include: ["src"],
    }),
  );
  writeFileSync(
    join(dir, "vite.config.ts"),
    [
      'import tailwindcss from "@tailwindcss/vite";',
      'import react from "@vitejs/plugin-react";',
      'import { defineConfig } from "vite";',
      "",
      "export default defineConfig({",
      "  plugins: [react(), tailwindcss()],",
      '  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },',
      "});",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "index.html"),
    '<!doctype html><div id="root"></div><script type="module" src="/src/main.tsx"></script>\n',
  );
  writeFileSync(join(dir, "src/index.css"), '@import "tailwindcss";\n');
  writeFileSync(
    join(dir, "src/main.tsx"),
    [
      'import { createRoot } from "react-dom/client";',
      'import "./index.css";',
      "",
      'createRoot(document.getElementById("root") as HTMLElement).render(<div />);',
      "",
    ].join("\n"),
  );
  writeFileSync(join(dir, "components.json"), componentsJson(url, ui));
}

function nativeApp(dir, url) {
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    json({
      name: "cubeui-install-test-native",
      private: true,
      // `react-dom` because an Expo app has it (Expo web, and the `.web.tsx` halves run there); without
      // it, `radix-ui`'s optional peer floats to a `react-dom` wanting a newer `react` than the app's.
      dependencies: { react: "19.1.0", "react-dom": "19.1.0", "react-native": "0.81.4" },
      devDependencies: { "@types/react": "~19.2.0", typescript: "~5.9.3" },
    }),
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    json({
      compilerOptions: { ...COMPILER, paths: { "@/*": ["./src/*"] } },
      include: ["src", "nativewind-env.d.ts"],
    }),
  );
  // What `nativewind` generates in an Expo app, and what teaches `View` that `className` is a prop.
  writeFileSync(join(dir, "nativewind-env.d.ts"), '/// <reference types="nativewind/types" />\n');
  writeFileSync(join(dir, "src/index.css"), '@import "tailwindcss";\n');
  writeFileSync(join(dir, "components.json"), componentsJson(url, "@/components/ui"));
}

const APPS = {
  web: { registry: "r", make: (dir, url) => webApp(dir, url, "@/components/ui") },
  "web-moved-ui": { registry: "r", make: (dir, url) => webApp(dir, url, "@/components/shadcn") },
  native: { registry: "r/native", make: nativeApp },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(APPS);
const server = await serve();
const { port } = server.address();
const results = [];
try {
  for (const name of wanted) {
    const app = APPS[name];
    if (!app) throw new Error(`unknown app "${name}" — one of ${Object.keys(APPS).join(", ")}`);
    const dir = join(base, name);
    rmSync(dir, { recursive: true, force: true });
    const url = `http://127.0.0.1:${port}/${app.registry}/{name}.json`;
    const items = itemsOf(app.registry);
    console.log(`\n${name}: ${items.length} items from ${url} into ${dir}`);
    app.make(dir, url);
    // Each step is its own verdict, and one app failing does not stop the next from running.
    let step = "npm install";
    try {
      await run("npm install --no-audit --no-fund --loglevel=error", dir);
      step = "shadcn add";
      await run(
        `${SHADCN} add ${items.map((i) => `@cubeui/${i}`).join(" ")} --yes --overwrite`,
        dir,
      );
      step = "tsc";
      await run("npx tsc --noEmit -p tsconfig.json", dir);
      results.push(`${name}: ${items.length} items installed, tsc passed`);
    } catch {
      results.push(`${name}: ${items.length} items — ${step} FAILED`);
    }
  }
} finally {
  server.close();
}

console.log(`\n${results.join("\n")}\n(apps left in ${base})`);
if (results.some((r) => r.endsWith("FAILED"))) process.exit(1);
