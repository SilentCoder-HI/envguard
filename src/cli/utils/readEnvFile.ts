import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "../../core/dotenv";
import { UsageError } from "./errors";

export function readEnvFile(path = ".env"): Record<string, string> {
  if (!existsSync(path)) throw new UsageError(`${path} not found`);
  return parseEnv(readFileSync(path, "utf8"));
}