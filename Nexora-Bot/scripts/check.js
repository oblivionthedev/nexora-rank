import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? files(fullPath) : entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

const targets = [...files("src"), ...files("config"), ...files("scripts"), ...files("tests")];
for (const target of targets) {
  const result = spawnSync(process.execPath, ["--check", target], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Checked ${targets.length} JavaScript files.`);
