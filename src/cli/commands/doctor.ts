import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { loadSchema } from "../utils/loadSchema";
import { fail, ok, warn } from "../utils/print";
import { buildExample } from "./example";
import type { Flags } from "../utils/flags";

const SECRET_PATTERNS: [string, RegExp][] = [
  ["Stripe live key", /sk_live_[A-Za-z0-9]{10,}/],
  ["AWS access key", /AKIA[0-9A-Z]{16}/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["Private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

const PUBLIC_PREFIX = /^(NEXT_PUBLIC_|VITE_|PUBLIC_|REACT_APP_|EXPO_PUBLIC_|NUXT_PUBLIC_)/;

type Level = "ok" | "warn" | "error";
interface Finding {
  level: Level;
  message: string;
}

function isGitIgnored(): boolean {
  if (!existsSync(".gitignore")) return false;
  const lines = readFileSync(".gitignore", "utf8").split(/\r?\n/).map((l) => l.trim());
  return lines.some((l) => [".env", "/.env", ".env*", ".env.*", "*.env"].includes(l));
}

function isTrackedByGit(file: string): boolean {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", file], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function doctor(flags: Flags): Promise<number> {
  const { schema } = await loadSchema(flags.config);
  const findings: Finding[] = [];
  const add = (level: Level, message: string) => findings.push({ level, message });

  if (isGitIgnored()) add("ok", ".env is listed in .gitignore");
  else add("error", ".env is NOT in .gitignore. Add a line: .env");

  if (existsSync(".env")) {
    if (isTrackedByGit(".env")) add("error", ".env is tracked by git. Run: git rm --cached .env (and rotate any real secrets)");
    else add("ok", ".env is not tracked by git");
  }

  if (!existsSync(".env.example")) {
    add("warn", ".env.example is missing. Run: npx envguard example");
  } else {
    const current = readFileSync(".env.example", "utf8");
    if (current !== buildExample(schema.shape)) add("warn", ".env.example is out of date. Run: npx envguard example");
    else add("ok", ".env.example is up to date");

    const leaked = SECRET_PATTERNS.filter(([, re]) => re.test(current)).map(([name]) => name);
    if (leaked.length) add("error", `.env.example contains what looks like a real secret: ${leaked.join(", ")}`);
  }

  for (const [key, field] of Object.entries<any>(schema.shape)) {
    if (field.meta.secret && PUBLIC_PREFIX.test(key)) {
      add("error", `${key} is marked secret() but its name is exposed to the browser by frameworks`);
    }
  }

  for (const [key, field] of Object.entries<any>(schema.shape)) {
    if (/(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY)/.test(key) && !field.meta.secret) {
      add("warn", `${key} looks sensitive but is not marked .secret()`);
    }
  }

  for (const f of findings) {
    if (f.level === "ok") ok(f.message);
    else if (f.level === "warn") warn(f.message);
    else fail(f.message);
  }
  return findings.some((f) => f.level === "error") ? 1 : 0;
}