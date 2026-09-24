// The published web registry, laid out the way the shadcn CLI installs it, passes Biome's
// recommended preset with one override: `a11y/useSemanticElements` off for the ui alias folder.
//
// The shells install next to that folder, not in it, and `cubeui-reset.css` installs beside
// `components.json`, so neither is covered by the override. Each one that trips a rule on purpose
// carries its own `biome-ignore` (#134), and this is what keeps that true: a new `role="heading"`
// in a shell's RN source without the comment fails here, and so does a comment the rule no longer
// needs, because warnings count.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const published = join(repo, "public/r");
const biome = join(repo, "node_modules/.bin/biome");

// Where the CLI puts a file with no `target`, by its type (components.json's default aliases).
const DIR_FOR_TYPE = {
  "registry:ui": "src/components/ui",
  "registry:component": "src/components",
  "registry:block": "src/components",
  "registry:lib": "src/lib",
  "registry:hook": "src/hooks",
};

function layOut(into) {
  for (const entry of readdirSync(published)) {
    if (!entry.endsWith(".json") || entry === "registry.json") continue;
    const item = JSON.parse(readFileSync(join(published, entry), "utf8"));
    // Stories are for the consumer's Storybook, and skills are agent docs, not source.
    if (item.name.endsWith("-stories") || item.type === "registry:file") continue;
    for (const file of item.files ?? []) {
      let rel;
      if (file.target?.startsWith("~/")) rel = file.target.slice(2);
      else if (file.target) rel = file.target;
      else rel = join(DIR_FOR_TYPE[file.type] ?? "src/components", basename(file.path));
      if (rel.includes(".claude")) continue;
      const to = join(into, rel);
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, file.content);
    }
  }
}

test("the published web items pass Biome's recommended preset with only the ui-folder override", () => {
  // Outside the repo: a root biome.json nested inside it would make the repo's own Biome refuse
  // to run.
  const consumer = mkdtempSync(join(tmpdir(), "cubeui-consumer-lint-"));
  try {
    layOut(consumer);
    // React present, so Biome turns its React-domain rules on, as it would in a real app.
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        name: "consumer",
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
      }),
    );
    writeFileSync(
      join(consumer, "biome.json"),
      JSON.stringify({
        root: true,
        vcs: { enabled: false },
        formatter: { enabled: false },
        assist: { enabled: false },
        css: { parser: { tailwindDirectives: true } },
        linter: { enabled: true, rules: { preset: "recommended" } },
        overrides: [
          {
            includes: ["src/components/ui/**"],
            linter: { rules: { a11y: { useSemanticElements: "off" } } },
          },
        ],
      }),
    );
    const run = spawnSync(biome, ["lint", "--error-on-warnings", "--max-diagnostics=50", "."], {
      cwd: consumer,
      encoding: "utf8",
    });
    assert.equal(run.status, 0, `biome lint in the consumer tree:\n${run.stdout}${run.stderr}`);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
});
