import { relative } from "node:path";
import { loadSchema } from "../utils/loadSchema";
import { readEnvFile } from "../utils/readEnvFile";
import { fail, ok, warn } from "../utils/print";
import type { Flags } from "../utils/flags";

export async function check(flags: Flags): Promise<number> {
  const { schema, path } = await loadSchema(flags.config);
  const label = flags.system ? "system environment" : flags.file ?? ".env";
  const source = flags.system ? { ...process.env } : readEnvFile(flags.file ?? ".env");

  const result = schema.safeParse(source);

  if (!result.success) {
    fail(`Invalid environment variables in ${label}:`);
    const keys = Object.keys(result.errors);
    const width = Math.max(...keys.map((k) => k.length));
    for (const [k, m] of Object.entries<string>(result.errors)) {
      console.error(`  ${k.padEnd(width)}  ${m}`);
    }
    return 1;
  }

  ok(`${Object.keys(schema.shape).length} variables valid (${label}, schema: ${relative(process.cwd(), path)})`);

  if (!flags.system) {
    const unknown = Object.keys(source).filter((k) => !(k in schema.shape));
    if (unknown.length) warn(`In ${label} but not in schema: ${unknown.join(", ")}`);
  }
  return 0;
}