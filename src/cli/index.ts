#!/usr/bin/env node
import { check } from "./commands/check";
import { example } from "./commands/example";
import { scan } from "./commands/scan";
import { doctor } from "./commands/doctor";
import { test } from "./commands/test";
import { parseFlags } from "./utils/flags";
import { UsageError } from "./utils/errors";
import { fail } from "./utils/print";

const HELP = `
envguard - one schema for your environment variables

Usage:
  envguard check    [--file .env] [--system] [--config env.config.ts]
  envguard example  [--stdout] [--check] [--out .env.example]
  envguard scan     [--dir src --dir app] [--strict]
  envguard doctor
  envguard test     [--dir src --dir app] [--strict]

Exit codes: 0 ok, 1 problems found, 2 usage error
`;

const commands = { check, example, scan, doctor, test } as const;

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "-h" || command === "--help") {
    console.log(HELP);
    return 0;
  }
  const run = commands[command as keyof typeof commands];
  if (!run) throw new UsageError(`Unknown command: ${command}`);

  const flags = parseFlags(rest);
  if (flags.help) {
    console.log(HELP);
    return 0;
  }
  return run(flags);
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    fail(e instanceof Error ? e.message : String(e));
    process.exit(e instanceof UsageError ? 2 : 1);
  });