// Builds the single-file preview: bundles src/ with esbuild and inlines the
// JS and CSS into one HTML page (dist/human-too.html).
// Usage: node scripts/build-preview.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const globalModules = execSync("npm root -g").toString().trim();
// Use a local esbuild if installed, otherwise the one bundled with the global tsx.
const local = join("node_modules", "esbuild", "lib", "main.js");
const viaTsx = join(globalModules, "tsx", "node_modules", "esbuild", "lib", "main.js");
const { build } = await import(pathToFileURL(existsSync(local) ? local : viaTsx).href);

const result = await build({
  entryPoints: ["src/main.tsx"],
  bundle: true, write: false, minify: true, format: "iife", target: "es2020",
  jsx: "automatic", outdir: "out", nodePaths: [globalModules, "node_modules"],
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".css": "css" }, logLevel: "warning",
});
const js = result.outputFiles.find(f => f.path.endsWith(".js")).text.replace(/<\/script/gi, "<\\/script");
const css = result.outputFiles.find(f => f.path.endsWith(".css"))?.text ?? "";
const html = readFileSync("preview/template.html", "utf8")
  .replace("/*CSS*/", () => css)
  .replace("/*JS*/", () => js);
mkdirSync("dist", { recursive: true });
writeFileSync("dist/human-too.html", html);
console.log(`dist/human-too.html  ${(html.length / 1024).toFixed(0)} KB`);
