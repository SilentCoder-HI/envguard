import { check } from "./check";
import { example } from "./example";
import { scan } from "./scan";
import { doctor } from "./doctor";
import { ok, fail, warn } from "../utils/print";
import type { Flags } from "../utils/flags";

export async function test(flags: Flags): Promise<number> {
  let code = 0;

  const run = async (name: string, fn: () => Promise<number>) => {
    console.log(`\n--- ${name} ---`);
    const c = await fn();
    if (c === 0) ok(`${name} passed`);
    else {
      fail(`${name} failed`);
      code = 1;
    }
    return c;
  };

  await run("check", () => check(flags));
  await run("example --check", () => example({ ...flags, check: true }));
  await run("scan", () => scan(flags));
  await run("doctor", () => doctor(flags));

  console.log("");
  if (code === 0) ok("All tests passed");
  else fail("Some tests failed");
  return code;
}