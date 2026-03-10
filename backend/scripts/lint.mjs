import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["src", "tests", "scripts"];
const files = [];

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (fullPath.endsWith(".js") || fullPath.endsWith(".mjs")) {
      files.push(fullPath);
    }
  }
};

for (const root of roots) {
  try {
    walk(root);
  } catch {
    // Skip optional folders such as tests before they exist.
  }
}

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
  process.stdout.write(`checked ${relative(process.cwd(), file)}\n`);
}
