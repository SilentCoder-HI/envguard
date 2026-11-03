import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadSchema } from "../utils/loadSchema";
import { fail, ok } from "../utils/print";
import type { Flags } from "../utils/flags";

import { buildExample as coreBuildExample } from "../../core/example";

export const buildExample = coreBuildExample;

export async function example(flags: Flags): Promise<number> {
  const { schema } = await loadSchema(flags.config);
  const text = buildExample(schema.shape);
  const out = flags.out ?? ".env.example";

  if (flags.stdout) {
    process.stdout.write(text);
    return 0;
  }

  if (flags.check) {
    const current = existsSync(out) ? readFileSync(out, "utf8") : null;
    if (current !== text) {
      fail(`${out} is ${current === null ? "missing" : "out of date"}. Run: npx envguard example`);
      return 1;
    }
    ok(`${out} is up to date`);
    return 0;
  }

  writeFileSync(out, text);
  ok(`Wrote ${out} (${Object.keys(schema.shape).length} variables)`);
  return 0;
}