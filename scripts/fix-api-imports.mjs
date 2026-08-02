import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT_LINE = `import { withApiLogging } from "@/lib/observability/api-log";\n`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

function addMissingImport(source) {
  if (!source.includes("withApiLogging")) return source;
  if (source.includes('from "@/lib/observability/api-log"')) return source;

  const match = source.match(
    /^import[\s\S]*?from\s+["'][^"']+["'];?\n/gm,
  );
  if (!match) return IMPORT_LINE + source;
  const last = match[match.length - 1];
  const at = source.indexOf(last) + last.length;
  return source.slice(0, at) + IMPORT_LINE + source.slice(at);
}

let fixed = 0;
for (const file of walk(path.join(ROOT, "src/app/api"))) {
  const source = readFileSync(file, "utf8");
  const next = addMissingImport(source);
  if (next !== source) {
    writeFileSync(file, next, "utf8");
    fixed++;
  }
}
console.log(`Added import to ${fixed} files.`);
