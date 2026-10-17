// Builds the deployable app into site/index.html (one file, ready for Vercel).
// Usage: node scripts/build-site.mjs
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
execSync("node scripts/build-preview.mjs", { stdio: "inherit" });
mkdirSync("site", { recursive: true });
copyFileSync("dist/human-too.html", "site/index.html");
console.log("site/index.html ready");
