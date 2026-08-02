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

function findParamListEnd(source, openParenIndex) {
  let depth = 0;
  for (let i = openParenIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function findBodyEnd(source, braceStart) {
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function insertImport(source) {
  if (source.includes("withApiLogging")) return source;
  const importEnd = [...source.matchAll(/^import .+;\n/gm)].pop();
  if (!importEnd) return IMPORT_LINE + source;
  const at = importEnd.index + importEnd[0].length;
  return source.slice(0, at) + IMPORT_LINE + source.slice(at);
}

function wrapFileContent(source) {
  if (source.includes("withApiLogging")) return null;

  const segments = [];
  const findRe = /export async function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/g;
  let match;
  while ((match = findRe.exec(source)) !== null) {
    const method = match[1];
    const start = match.index;
    const openParen = match.index + match[0].length - 1;
    const paramsEnd = findParamListEnd(source, openParen);
    if (paramsEnd === -1) continue;
    const braceStart = source.indexOf("{", paramsEnd);
    if (braceStart === -1) continue;
    const end = findBodyEnd(source, braceStart);
    if (end === -1) continue;
    segments.push({ method, start, end });
  }

  if (segments.length === 0) return null;

  let out = source;
  for (let i = segments.length - 1; i >= 0; i--) {
    const { method, start, end } = segments[i];
    const fnBody = out.slice(start, end);
    const inner = fnBody
      .replace(
        new RegExp(`^export async function ${method}\\s*\\(`),
        `async function ${method}(`,
      )
      .trimEnd();
    const wrapped = `export const ${method} = withApiLogging(${inner});`;
    out = out.slice(0, start) + wrapped + out.slice(end);
  }

  return insertImport(out);
}

const files = walk(path.join(ROOT, "src/app/api"));
let changed = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const wrapped = wrapFileContent(source);
  if (wrapped && wrapped !== source) {
    writeFileSync(file, wrapped, "utf8");
    changed++;
  }
}

console.log(`Wrapped ${changed} API route files.`);
