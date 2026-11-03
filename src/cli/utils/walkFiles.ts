import { readdirSync, statSync, existsSync } from "node:fs";
import { extname, join } from "node:path";

export interface WalkOptions {
  exclude: string[];
  extensions: string[];
  maxBytes?: number;
}

const TEST_FILE = /\.(test|spec)\.[a-z]+$/;

export function* walkFiles(dir: string, opts: WalkOptions): Generator<string> {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (opts.exclude.includes(entry.name)) continue;
      yield* walkFiles(full, opts);
    } else if (opts.extensions.includes(extname(entry.name)) && !TEST_FILE.test(entry.name)) {
      if (statSync(full).size <= (opts.maxBytes ?? 1_000_000)) yield full;
    }
  }
}