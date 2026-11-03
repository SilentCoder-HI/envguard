import { readFileSync } from "node:fs";
import { loadSchema } from "../utils/loadSchema";
import { loadOptions } from "../utils/options";
import { walkFiles } from "../utils/walkFiles";
import { dim, fail, ok, warn } from "../utils/print";
import type { Flags } from "../utils/flags";

export interface Usage {
  name: string;
  file: string;
  line: number;
}

const VITE_BUILTINS = new Set(["MODE", "BASE_URL", "PROD", "DEV", "SSR"]);

export function findUsages(text: string, file: string): Usage[] {
  const found: Usage[] = [];
  const lineOf = (index: number) => text.slice(0, index).split("\n").length;
  const add = (name: string, index: number) => found.push({ name, file, line: lineOf(index) });

  for (const m of text.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) add(m[1]!, m.index!);
  for (const m of text.matchAll(/process\.env\[\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]\s*\]/g)) add(m[1]!, m.index!);
  for (const m of text.matchAll(/import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    if (!VITE_BUILTINS.has(m[1]!)) add(m[1]!, m.index!);
  }
  for (const m of text.matchAll(/\{([^}]*)\}\s*=\s*(?:process\.env|import\.meta\.env)\b/g)) {
    for (const part of m[1]!.split(",")) {
      const name = part.split(/[:=]/)[0]!.trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) add(name, m.index!);
    }
  }
  return found;
}

export async function scan(flags: Flags): Promise<number> {
  const { schema } = await loadSchema(flags.config);
  const options = loadOptions().scan;
  const dirs = flags.dir.length ? flags.dir : options.include;

  const usages: Usage[] = [];
  let fileCount = 0;
  for (const dir of dirs) {
    for (const file of walkFiles(dir, { exclude: options.exclude, extensions: options.extensions })) {
      fileCount++;
      usages.push(...findUsages(readFileSync(file, "utf8"), file));
    }
  }

  const declared = new Set(Object.keys(schema.shape));
  const used = new Set(usages.map((u) => u.name));

  const undeclared = usages.filter((u) => !declared.has(u.name));
  const unused = [...declared].filter((k) => !used.has(k));

  console.log(dim(`Scanned ${fileCount} files in: ${dirs.join(", ")}`));

  let code = 0;
  if (undeclared.length) {
    fail("Used in code but NOT in schema:");
    for (const u of undeclared) console.error(`  ${u.file}:${u.line}  ${u.name}`);
    code = 1;
  }
  if (unused.length) {
    warn(`In schema but never used in scanned code: ${unused.join(", ")}`);
    if (flags.strict) code = 1;
  }
  if (!undeclared.length && !unused.length) ok("Schema and code match");
  else if (!undeclared.length) ok("Every variable used in code is declared in the schema");
  return code;
}