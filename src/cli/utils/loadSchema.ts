import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createJiti } from "jiti";
import { UsageError } from "./errors";

const CANDIDATES = [
  "env.config.ts",
  "env.config.mts",
  "env.config.mjs",
  "env.config.js",
  "src/env.config.ts",
];

export interface LoadedSchema {
  schema: { shape: Record<string, any>; safeParse: (s: any) => any };
  path: string;
}

export async function loadSchema(explicit?: string): Promise<LoadedSchema> {
  const paths = explicit ? [explicit] : CANDIDATES;
  const path = paths.map((p) => resolve(p)).find(existsSync);
  if (!path) {
    throw new UsageError(
      explicit
        ? `Schema file not found: ${explicit}`
        : "No schema file found. Create env.config.ts (or pass --config <path>)."
    );
  }

  const jiti = createJiti(import.meta.url);
  const mod: any = await jiti.import(path);
  const schema = mod.envSchema ?? mod.schema ?? mod.default;

  if (!schema || typeof schema.safeParse !== "function" || !schema.shape) {
    throw new UsageError(
      `${path} must export an env.object(...) schema as "envSchema", "schema", or default.`
    );
  }
  return { schema, path };
}