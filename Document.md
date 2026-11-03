# EnvGuard: Complete Build Guide

Package name: `@silentcoderhi/envguard`
Author: Hussnain Iftikhar (SilentCoder)
License: MIT

This guide is written so you can build the whole tool from start to finish without asking anyone. Follow the sections in order. Every file you need is included, plus the behavior of each command, the tests, the publish steps, and how to add it to your site.

---

## 1. What EnvGuard is

EnvGuard is a **typed environment-variable toolkit**. You describe your environment variables once in a schema file (`env.config.ts`). That one schema then powers:

| Use | What it gives you |
|---|---|
| **In your app** | Validated, typed `config` object. The app fails at startup with a clear message if a variable is missing or wrong. |
| **`envguard check`** | Validates a `.env` file (or the system environment) against the schema, before you run or deploy. |
| **`envguard example`** | Generates `.env.example` from the schema, so it never goes out of date. |
| **`envguard scan`** | Reads your source code, finds every `process.env.X` / `import.meta.env.X`, and compares it with the schema. |
| **`envguard doctor`** | Safety checks: is `.env` gitignored, tracked by git, are secrets in `.env.example`, are secrets exposed with public prefixes. |

**One sentence pitch:** *One schema for all your env variables: validate them, document them, generate `.env.example`, find missing ones in your code, and catch unsafe setups.*

### Why someone would use it

A tiny validator alone is not enough (there are many). The reason to adopt EnvGuard is that it **replaces several small scripts people write by hand**:

1. A validation script at startup.
2. A hand-edited `.env.example` that is always outdated.
3. A "did we forget a variable in this file?" check.
4. A grep for `process.env` to find undeclared variables.
5. A pre-commit check that secrets are not committed.

Be honest about this in the README. Similar tools exist (`envalid`, `t3-env`, `znv`). EnvGuard's difference is the CLI side (`example`, `scan`, `doctor`) and zero dependencies in the library.

### What it will NOT do (v1)

- It does not read `process.env[someVariable]` (dynamic access cannot be detected by scanning).
- It does not read multi-line values in `.env`.
- It does not verify that a value is *correct* (a URL being valid does not mean the server exists).
- It does not encrypt or store secrets.
- No AI. Everything is plain code.

---

## 2. How it works (mental model)

```
env.config.ts      <- the schema (rules only, no values)
      |
      +-- App:        schema.parse(process.env)        -> typed config or throws
      +-- check:      schema.safeParse(readEnvFile())  -> errors or OK
      +-- example:    reads schema.shape metadata      -> writes .env.example
      +-- scan:       finds env names in code          -> compares with schema.shape
      +-- doctor:     reads .gitignore, git, files     -> safety report
```

Important rule: **the schema holds rules, never values.** Values come from `.env`, the system environment, or pasted text in the playground.

---

## 3. Version plan

| Version | Contents | Done when |
|---|---|---|
| **v0.1** | Core schema: `string`, `number`, `boolean`, `enum`, `object`; `.default`, `.optional`, `.describe`, `.secret`, `.min/.max/.url/.email/.int/.port`; `parse`, `safeParse`, `parseEnv` | All core tests pass, published to npm |
| **v0.2** | CLI: `check` and `example` (+ `example --check`) | `npx envguard check` and `example` work in a real project |
| **v0.3** | `scan` and `doctor` | Both work on a real project and have tests |
| **v0.4** | Playground on the website, docs pages, badges | Site has EnvGuard card, docs, live demo |
| **v1.0** | Polish, `envguard.json` options, CI example, stable API | You use it in your own projects for a few weeks without changes |
| **Later** | `diff` command, `client()/server()` scopes, `--format markdown` docs | Only if people ask |

Ship v0.1 first. Do not wait for everything.

---

## 4. Folder structure

```
envguard/
├─ src/
│  ├─ core/                      LIBRARY (zero dependencies, browser-safe)
│  │  ├─ types.ts
│  │  ├─ field.ts                Field class + StringField + NumberField
│  │  ├─ builders.ts             string(), number(), boolean(), enumOf()
│  │  ├─ object.ts               object(), EnvError
│  │  └─ dotenv.ts               parseEnv(text)
│  ├─ cli/                       CLI (uses Node APIs and jiti, never imported by core)
│  │  ├─ index.ts                entry, reads argv, runs command
│  │  ├─ commands/
│  │  │  ├─ check.ts
│  │  │  ├─ example.ts
│  │  │  ├─ scan.ts
│  │  │  └─ doctor.ts
│  │  └─ utils/
│  │     ├─ flags.ts
│  │     ├─ errors.ts
│  │     ├─ loadSchema.ts        finds and loads env.config.ts using jiti
│  │     ├─ readEnvFile.ts
│  │     ├─ options.ts           reads optional envguard.json
│  │     ├─ walkFiles.ts
│  │     └─ print.ts
│  └─ index.ts                   exports the LIBRARY only
├─ test/
│  ├─ core.test.ts
│  ├─ dotenv.test.ts
│  ├─ example.test.ts
│  └─ scan.test.ts
├─ playground/                   your Vite app (already exists)
├─ examples/
│  └─ basic/ (env.config.ts, .env)
├─ .github/workflows/ci.yml
├─ .gitignore
├─ CHANGELOG.md
├─ LICENSE
├─ README.md
├─ package.json
├─ tsconfig.json
└─ tsup.config.ts
```

**Golden rule:** `src/index.ts` and everything in `src/core/` must never import from `src/cli/`. That keeps the library tiny and browser-safe, and lets the playground import `core` directly.

---

## 5. Project setup

```bash
cd envguard
npm i jiti
npm i -D typescript tsup vitest tsx @types/node
```

TypeScript 5.0 or newer is required (the code uses `const` type parameters).

### `package.json`

```json
{
  "name": "@silentcoderhi/envguard",
  "version": "0.1.0",
  "description": "One schema for your environment variables: validate, document, scan, and secure them.",
  "license": "MIT",
  "author": "Hussnain Iftikhar",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "bin": { "envguard": "./dist/cli.js" },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "dev:cli": "tsx src/cli/index.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm test && npm run build"
  },
  "dependencies": { "jiti": "^2.4.0" },
  "devDependencies": {},
  "keywords": ["env", "dotenv", "environment", "validation", "typescript", "cli", "schema"],
  "repository": { "type": "git", "url": "git+https://github.com/SilentCoder-HI/envguard.git" },
  "bugs": { "url": "https://github.com/SilentCoder-HI/envguard/issues" },
  "homepage": "https://silentcodertools.vercel.app/docs/envguard/getting-started",
  "publishConfig": { "access": "public" },
  "engines": { "node": ">=18" }
}
```

Note on `jiti`: it is only needed by the CLI, but because the CLI and library are one package, apps that install EnvGuard also install `jiti`. It is small and does not affect the bundle (the library never imports it). If this bothers you later, split the CLI into a second package, `@silentcoderhi/envguard-cli`.

(After `npm i`, keep the versions npm wrote for `jiti` and the dev dependencies.)

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "resolveJsonModule": true
  },
  "include": ["src", "test"]
}
```

### `tsup.config.ts`

```ts
import { defineConfig } from "tsup";

export default defineConfig([
  {
    // Library: ESM + CJS + types
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2022",
  },
  {
    // CLI: ESM only. tsup keeps the #!/usr/bin/env node line from the source file.
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    clean: false,
    target: "node18",
    external: ["jiti"],
  },
]);
```

### `.gitignore`

```
node_modules
dist
playground/dist
.env
.env.*
!.env.example
*.log
```

---

## 6. Core library code (v0.1)

### `src/core/types.ts`

```ts
export type Source = Record<string, string | undefined>;

export type Check<T = any> = (value: T) => string | null;

export interface FieldMeta {
  kind: "string" | "number" | "boolean" | "enum";
  description?: string;
  secret: boolean;
  optional: boolean;
  hasDefault: boolean;
  default?: unknown;
  enumValues?: readonly string[];
}
```

### `src/core/field.ts`

```ts
import type { Check, FieldMeta } from "./types";

type Ctor<F> = new (
  meta: FieldMeta,
  convert: (raw: string) => unknown,
  checks: Check[]
) => F;

export class Field<T> {
  /** Type-only marker so Infer<> works. Never read at runtime. */
  declare readonly _type: T;

  constructor(
    public readonly meta: FieldMeta,
    protected readonly convert: (raw: string) => unknown,
    protected readonly checks: Check[] = []
  ) {}

  /** Returns a NEW field (fields are immutable). */
  protected make(meta: Partial<FieldMeta>, extra: Check[] = []): this {
    const C = this.constructor as Ctor<this>;
    return new C({ ...this.meta, ...meta }, this.convert, [...this.checks, ...extra]);
  }

  describe(text: string): this {
    return this.make({ description: text });
  }

  /** Marks the value as sensitive: never printed, never written to .env.example. */
  secret(): this {
    return this.make({ secret: true });
  }

  /** Put .optional() and .default() LAST in the chain. */
  optional(): Field<T | undefined> {
    return this.make({ optional: true }) as unknown as Field<T | undefined>;
  }

  default(value: T): Field<T> {
    return this.make({ hasDefault: true, default: value }) as unknown as Field<T>;
  }

  /** Throws Error with a SHORT message that never contains the value. */
  parse(raw: string | undefined): T {
    if (raw === undefined || raw.trim() === "") {
      if (this.meta.hasDefault) return this.meta.default as T;
      if (this.meta.optional) return undefined as T;
      throw new Error("missing");
    }
    const value = this.convert(raw);
    for (const check of this.checks) {
      const message = check(value);
      if (message) throw new Error(message);
    }
    return value as T;
  }
}

export class StringField extends Field<string> {
  min(n: number) {
    return this.make({}, [(v: string) => (v.length < n ? `must be at least ${n} characters` : null)]);
  }
  max(n: number) {
    return this.make({}, [(v: string) => (v.length > n ? `must be at most ${n} characters` : null)]);
  }
  url() {
    return this.make({}, [
      (v: string) => {
        try {
          new URL(v);
          return null;
        } catch {
          return "must be a valid URL";
        }
      },
    ]);
  }
  email() {
    return this.make({}, [(v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "must be a valid email")]);
  }
  matches(re: RegExp, message = "has an invalid format") {
    return this.make({}, [(v: string) => (re.test(v) ? null : message)]);
  }
}

export class NumberField extends Field<number> {
  min(n: number) {
    return this.make({}, [(v: number) => (v < n ? `must be >= ${n}` : null)]);
  }
  max(n: number) {
    return this.make({}, [(v: number) => (v > n ? `must be <= ${n}` : null)]);
  }
  int() {
    return this.make({}, [(v: number) => (Number.isInteger(v) ? null : "must be an integer")]);
  }
  port() {
    return this.make({}, [
      (v: number) => (Number.isInteger(v) && v >= 1 && v <= 65535 ? null : "must be a port (1-65535)"),
    ]);
  }
}
```

### `src/core/builders.ts`

```ts
import { Field, NumberField, StringField } from "./field";
import type { FieldMeta } from "./types";

const base = (kind: FieldMeta["kind"]): FieldMeta => ({
  kind,
  secret: false,
  optional: false,
  hasDefault: false,
});

export const string = () => new StringField(base("string"), (raw) => raw);

export const number = () =>
  new NumberField(base("number"), (raw) => {
    const n = Number(raw.trim());
    if (Number.isNaN(n)) throw new Error("must be a number");
    return n;
  });

const TRUE = ["true", "1", "yes", "on"];
const FALSE = ["false", "0", "no", "off"];

export const boolean = () =>
  new Field<boolean>(base("boolean"), (raw) => {
    const v = raw.trim().toLowerCase();
    if (TRUE.includes(v)) return true;
    if (FALSE.includes(v)) return false;
    throw new Error("must be true/false (or 1/0, yes/no, on/off)");
  });

export function enumOf<const V extends readonly string[]>(values: V) {
  return new Field<V[number]>({ ...base("enum"), enumValues: values }, (raw) => {
    if (!values.includes(raw)) throw new Error(`must be one of: ${values.join(", ")}`);
    return raw;
  });
}
```

### `src/core/object.ts`

```ts
import type { Field } from "./field";
import type { Source } from "./types";

export type Shape = Record<string, Field<any>>;
export type Infer<S extends Shape> = { [K in keyof S]: S[K]["_type"] };

export type Result<S extends Shape> =
  | { success: true; data: Infer<S> }
  | { success: false; errors: Record<string, string> };

export class EnvError extends Error {
  constructor(public readonly errors: Record<string, string>) {
    const width = Math.max(...Object.keys(errors).map((k) => k.length));
    super(
      "Invalid environment variables:\n" +
        Object.entries(errors)
          .map(([k, m]) => `  ${k.padEnd(width)}  ${m}`)
          .join("\n")
    );
    this.name = "EnvError";
  }
}

const defaultSource = (): Source =>
  typeof process !== "undefined" && process.env ? process.env : {};

export function object<S extends Shape>(shape: S) {
  const safeParse = (source: Source = defaultSource()): Result<S> => {
    const data: Record<string, unknown> = {};
    const errors: Record<string, string> = {};
    for (const key of Object.keys(shape)) {
      try {
        data[key] = shape[key]!.parse(source[key]);
      } catch (e) {
        errors[key] = e instanceof Error ? e.message : "invalid";
      }
    }
    return Object.keys(errors).length
      ? { success: false, errors }
      : { success: true, data: data as Infer<S> };
  };

  /** Throws EnvError. Use in libraries and tests. */
  const parse = (source: Source = defaultSource()): Infer<S> => {
    const result = safeParse(source);
    if (!result.success) throw new EnvError(result.errors);
    return result.data;
  };

  /** Prints a clean message and exits with code 1. Use in app entry points. */
  const parseOrExit = (source: Source = defaultSource()): Infer<S> => {
    const result = safeParse(source);
    if (!result.success) {
      console.error(new EnvError(result.errors).message);
      process.exit(1);
    }
    return result.data;
  };

  return { shape, safeParse, parse, parseOrExit };
}
```

### `src/core/dotenv.ts`

```ts
/** Parses the text of a .env file. Pure function, works in the browser too. */
export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice(7).trim();

    const eq = line.indexOf("="); // first "=" only, so URLs with ?a=b stay intact
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eq + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) {
      value = value.slice(1, -1);
      if (quote === '"') value = value.replace(/\\n/g, "\n");
    } else {
      const hash = value.search(/\s#/); // inline comment on unquoted values
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    out[key] = value;
  }
  return out;
}
```

### `src/index.ts` (library entry)

```ts
import { string, number, boolean, enumOf } from "./core/builders";
import { object } from "./core/object";

export const env = { string, number, boolean, enum: enumOf, object };

export { EnvError } from "./core/object";
export { parseEnv } from "./core/dotenv";
export { Field, StringField, NumberField } from "./core/field";
export type { Infer, Shape, Result } from "./core/object";
export type { FieldMeta, Source } from "./core/types";
```

### v0.1 is done when this works

`env.config.ts`:

```ts
import { env } from "./src/index";

export const envSchema = env.object({
  NODE_ENV: env.enum(["development", "production", "test"]).default("development"),
  PORT: env.number().port().default(3000).describe("Server port"),
  DATABASE_URL: env.string().url().describe("Postgres connection string"),
  JWT_SECRET: env.string().min(32).secret().describe("Token signing key"),
  ENABLE_AI: env.boolean().default(false),
});
```

App:

```ts
import { envSchema } from "./env.config";
export const config = envSchema.parseOrExit(process.env);
// config.PORT is number, config.NODE_ENV is "development" | "production" | "test"
```

Publish v0.1 here (section 14) before building the CLI.

---

## 7. CLI code (v0.2 and v0.3)

### Behavior contract (all commands)

| Exit code | Meaning |
|---|---|
| `0` | Everything OK |
| `1` | Problems found (invalid env, missing vars, unsafe setup) |
| `2` | Usage or config error (schema file not found, unknown option) |

This lets people write `npx envguard check && npm run deploy`.

Common options:

| Option | Meaning |
|---|---|
| `--config <path>` | Schema file (default: auto-find `env.config.ts`) |
| `--file <path>` | Env file to read (default `.env`) |
| `-h`, `--help` | Show help |

### `src/cli/utils/errors.ts`

```ts
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
```

### `src/cli/utils/print.ts`

```ts
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code: number) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const red = paint(31);
export const green = paint(32);
export const yellow = paint(33);
export const dim = paint(2);
export const bold = paint(1);

export const ok = (m: string) => console.log(`${green("✔")} ${m}`);
export const fail = (m: string) => console.error(`${red("✖")} ${m}`);
export const warn = (m: string) => console.log(`${yellow("⚠")} ${m}`);
export const info = (m: string) => console.log(m);
```

### `src/cli/utils/flags.ts`

```ts
import { UsageError } from "./errors";

export interface Flags {
  file?: string;
  config?: string;
  out?: string;
  dir: string[];
  stdout: boolean;
  check: boolean;
  strict: boolean;
  system: boolean;
  help: boolean;
}

export function parseFlags(args: string[]): Flags {
  const f: Flags = { dir: [], stdout: false, check: false, strict: false, system: false, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const next = () => {
      const v = args[++i];
      if (v === undefined) throw new UsageError(`Option ${a} needs a value`);
      return v;
    };
    switch (a) {
      case "--file": f.file = next(); break;
      case "--config": f.config = next(); break;
      case "--out": f.out = next(); break;
      case "--dir": f.dir.push(next()); break;
      case "--stdout": f.stdout = true; break;
      case "--check": f.check = true; break;
      case "--strict": f.strict = true; break;
      case "--system": f.system = true; break;
      case "-h":
      case "--help": f.help = true; break;
      default: throw new UsageError(`Unknown option: ${a}`);
    }
  }
  return f;
}
```

### `src/cli/utils/readEnvFile.ts`

```ts
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "../../core/dotenv";
import { UsageError } from "./errors";

export function readEnvFile(path = ".env"): Record<string, string> {
  if (!existsSync(path)) throw new UsageError(`${path} not found`);
  return parseEnv(readFileSync(path, "utf8"));
}
```

### `src/cli/utils/loadSchema.ts`

```ts
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
  const path = (explicit ? [explicit] : CANDIDATES).map((p) => resolve(p)).find(existsSync);
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

  // Duck typing, not instanceof: the user's copy of envguard may differ from the CLI's copy.
  if (!schema || typeof schema.safeParse !== "function" || !schema.shape) {
    throw new UsageError(
      `${path} must export an env.object(...) schema as "envSchema", "schema", or default.`
    );
  }
  return { schema, path };
}
```

### `src/cli/utils/options.ts` (optional `envguard.json`)

```ts
import { existsSync, readFileSync } from "node:fs";

export interface Options {
  scan: { include: string[]; exclude: string[]; extensions: string[] };
}

const DEFAULTS: Options = {
  scan: {
    include: ["src", "app", "pages", "lib", "server"],
    exclude: ["node_modules", "dist", "build", ".next", ".nuxt", "coverage", ".git", ".turbo"],
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".vue", ".svelte"],
  },
};

export function loadOptions(): Options {
  if (!existsSync("envguard.json")) return DEFAULTS;
  const user = JSON.parse(readFileSync("envguard.json", "utf8"));
  return { scan: { ...DEFAULTS.scan, ...(user.scan ?? {}) } };
}
```

### `src/cli/commands/check.ts`

```ts
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
```

What it checks: every schema key is present (or has a default/optional), non-empty, and passes its rules. Extra keys in the file only produce a warning.

### `src/cli/commands/example.ts`

```ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadSchema } from "../utils/loadSchema";
import { fail, ok } from "../utils/print";
import type { Flags } from "../utils/flags";

export function buildExample(shape: Record<string, any>): string {
  const blocks = Object.entries(shape).map(([key, field]) => {
    const m = field.meta;
    const lines: string[] = [];
    if (m.description) lines.push(`# ${m.description}`);

    const type = m.kind === "enum" ? `one of: ${m.enumValues.join(" | ")}` : m.kind;
    const need = m.hasDefault
      ? `optional, default: ${m.secret ? "(hidden)" : String(m.default)}`
      : m.optional
        ? "optional"
        : "required";
    lines.push(`# ${type} - ${need}${m.secret ? " - SECRET" : ""}`);

    const value = m.hasDefault && !m.secret ? String(m.default) : "";
    lines.push(`${key}=${value}`);
    return lines.join("\n");
  });

  return (
    "# Generated by envguard. Do not edit by hand.\n" +
    "# Regenerate with: npx envguard example\n\n" +
    blocks.join("\n\n") +
    "\n"
  );
}

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
```

Rules for the generated file: secrets never get a value; non-secret defaults are written; descriptions become comments. `example --check` is meant for CI and pre-commit hooks, so `.env.example` can never silently go out of date.

### `src/cli/utils/walkFiles.ts`

```ts
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
```

### `src/cli/commands/scan.ts`

```ts
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

  // process.env.NAME
  for (const m of text.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) add(m[1]!, m.index!);

  // process.env["NAME"] / process.env['NAME'] / process.env[`NAME`]
  for (const m of text.matchAll(/process\.env\[\s*["'`]([A-Za-z_][A-Za-z0-9_]*)["'`]\s*\]/g)) add(m[1]!, m.index!);

  // import.meta.env.NAME
  for (const m of text.matchAll(/import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    if (!VITE_BUILTINS.has(m[1]!)) add(m[1]!, m.index!);
  }

  // const { A, B: renamed, C = "x" } = process.env
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
```

Scan rules (explain in the README):

- Reads only the folders in `scan.include` (defaults: `src`, `app`, `pages`, `lib`, `server`), never the whole project.
- Skips `node_modules`, `dist`, `build`, `.next`, `.nuxt`, `coverage`, `.git`, and test files.
- Only reads known source extensions, and files up to 1 MB.
- Uses regex, no AI and no AST. Detects `process.env.X`, `process.env["X"]`, `import.meta.env.X`, and destructuring from `process.env`.
- Cannot detect dynamic access like `process.env[name]`.
- "Unused in schema" is only a warning unless `--strict`.

### `src/cli/commands/doctor.ts`

```ts
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
    return false; // not tracked, or not a git repo
  }
}

export async function doctor(flags: Flags): Promise<number> {
  const { schema } = await loadSchema(flags.config);
  const findings: Finding[] = [];
  const add = (level: Level, message: string) => findings.push({ level, message });

  // 1. .env ignored by git
  if (isGitIgnored()) add("ok", ".env is listed in .gitignore");
  else add("error", ".env is NOT in .gitignore. Add a line: .env");

  // 2. .env tracked by git
  if (existsSync(".env")) {
    if (isTrackedByGit(".env")) add("error", ".env is tracked by git. Run: git rm --cached .env (and rotate any real secrets)");
    else add("ok", ".env is not tracked by git");
  }

  // 3. .env.example exists and is in sync
  if (!existsSync(".env.example")) {
    add("warn", ".env.example is missing. Run: npx envguard example");
  } else {
    const current = readFileSync(".env.example", "utf8");
    if (current !== buildExample(schema.shape)) add("warn", ".env.example is out of date. Run: npx envguard example");
    else add("ok", ".env.example is up to date");

    // 4. Real-looking secrets inside .env.example
    const leaked = SECRET_PATTERNS.filter(([, re]) => re.test(current)).map(([name]) => name);
    if (leaked.length) add("error", `.env.example contains what looks like a real secret: ${leaked.join(", ")}`);
  }

  // 5. Secret variables with public prefixes (exposed to the browser)
  for (const [key, field] of Object.entries<any>(schema.shape)) {
    if (field.meta.secret && PUBLIC_PREFIX.test(key)) {
      add("error", `${key} is marked secret() but its name is exposed to the browser by frameworks`);
    }
  }

  // 6. Sensitive-looking names that are not marked secret
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
```

### `src/cli/index.ts` (entry)

```ts
#!/usr/bin/env node
import { check } from "./commands/check";
import { example } from "./commands/example";
import { scan } from "./commands/scan";
import { doctor } from "./commands/doctor";
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

Exit codes: 0 ok, 1 problems found, 2 usage error
`;

const commands = { check, example, scan, doctor } as const;

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
```

### Run it while developing

```bash
npx tsx src/cli/index.ts check --file .env
npx tsx src/cli/index.ts example --stdout
npx tsx src/cli/index.ts scan --dir src
npx tsx src/cli/index.ts doctor
```

Test as a real command:

```bash
npm run build
npm link
envguard check
npm unlink -g @silentcoderhi/envguard
```

---

## 8. Optional config file: `envguard.json`

Only needed to change scan behavior:

```json
{
  "scan": {
    "include": ["src", "app", "server"],
    "exclude": ["node_modules", "dist", ".next", "generated"],
    "extensions": [".ts", ".tsx"]
  }
}
```

---

## 9. Tests (Vitest)

### `test/core.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { env } from "../src/index";

const schema = env.object({
  PORT: env.number().port().default(3000),
  HOST: env.string(),
  DEBUG: env.boolean().default(false),
  MODE: env.enum(["dev", "prod"]),
  KEY: env.string().min(8).secret(),
  OPT: env.string().optional(),
});

describe("object()", () => {
  it("parses valid values and converts types", () => {
    const r = schema.safeParse({ HOST: "x", MODE: "dev", KEY: "12345678", PORT: "8080", DEBUG: "yes" });
    expect(r).toEqual({
      success: true,
      data: { PORT: 8080, HOST: "x", DEBUG: true, MODE: "dev", KEY: "12345678", OPT: undefined },
    });
  });

  it("uses defaults for missing values", () => {
    const r: any = schema.safeParse({ HOST: "x", MODE: "dev", KEY: "12345678" });
    expect(r.data.PORT).toBe(3000);
    expect(r.data.DEBUG).toBe(false);
  });

  it("reports ALL errors at once", () => {
    const r: any = schema.safeParse({ PORT: "abc", MODE: "staging", KEY: "short" });
    expect(Object.keys(r.errors).sort()).toEqual(["HOST", "KEY", "MODE", "PORT"]);
  });

  it("accepts 0 as a number (regression)", () => {
    const s = env.object({ N: env.number() });
    expect(s.parse({ N: "0" })).toEqual({ N: 0 });
  });

  it("never puts the value in the error message", () => {
    const r: any = schema.safeParse({ HOST: "x", MODE: "dev", KEY: "SUPERSECRET".slice(0, 5) });
    expect(JSON.stringify(r.errors)).not.toContain("SUPER");
  });

  it("parse() throws EnvError, parseOrExit is separate", () => {
    expect(() => schema.parse({})).toThrow(/Invalid environment variables/);
  });
});
```

### `test/dotenv.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "../src/index";

describe("parseEnv", () => {
  it("handles comments, quotes, export, and = inside values", () => {
    const out = parseEnv(`
# comment
A=1
export B="two words"
C='single'
D=https://x.com/?a=b&c=d
E=value # inline comment
F=
bad line
`);
    expect(out).toEqual({
      A: "1",
      B: "two words",
      C: "single",
      D: "https://x.com/?a=b&c=d",
      E: "value",
      F: "",
    });
  });
});
```

### `test/example.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { env } from "../src/index";
import { buildExample } from "../src/cli/commands/example";

describe("buildExample", () => {
  const schema = env.object({
    PORT: env.number().default(3000).describe("Server port"),
    DATABASE_URL: env.string().url().describe("Postgres URL"),
    JWT_SECRET: env.string().secret().default("hidden"),
  });

  it("writes defaults, empty required values, and hides secrets", () => {
    const text = buildExample(schema.shape);
    expect(text).toContain("PORT=3000");
    expect(text).toContain("DATABASE_URL=\n");
    expect(text).toContain("JWT_SECRET=\n");
    expect(text).not.toContain("hidden\n# ");
  });
});
```

### `test/scan.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { findUsages } from "../src/cli/commands/scan";

describe("findUsages", () => {
  it("finds all supported patterns", () => {
    const code = `
const a = process.env.API_URL;
const b = process.env["DB_HOST"];
const c = import.meta.env.VITE_KEY;
const d = import.meta.env.MODE;
const { X, Y: renamed, Z = "1" } = process.env;
`;
    const names = findUsages(code, "a.ts").map((u) => u.name).sort();
    expect(names).toEqual(["API_URL", "DB_HOST", "VITE_KEY", "X", "Y", "Z"]);
  });

  it("reports correct line numbers", () => {
    const u = findUsages("\n\nconst a = process.env.A;", "f.ts");
    expect(u[0]!.line).toBe(3);
  });
});
```

### Test data to reuse (playground and manual tests)

Valid:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=dummy_secret_key_that_is_32_chars_long_ok
ENABLE_AI=true
```

Invalid (should fail):

```env
NODE_ENV=staging
PORT=abc
DATABASE_URL=not a url
JWT_SECRET=short
ENABLE_AI=maybe
```

Missing everything: an empty file, or only `PORT=3000`.

---

## 10. Playground (website demo)

Your playground is a Vite + React app. Rules:

1. Import only from `core` (never `cli`): `import { env, parseEnv } from "../../src/index"`.
2. The user pastes `.env` text into a textarea. Call `parseEnv(text)` then `schema.safeParse(values)`.
3. Use a **preset schema** (or a dropdown of presets) instead of executing code typed by the user. Running arbitrary typed code needs `eval`, which is risky and unnecessary for a demo.
4. Show: success state with typed output, or a list of errors, one per variable.
5. Add buttons: "Load valid example", "Load invalid example".
6. Add a second tab showing the generated `.env.example` from the same schema (call `buildExample`, which you can move into `core` if you want it in the browser).
7. Show a warning: "Do not paste real secrets."
8. Delete one of `App.jsx` or `App.tsx` so Vite does not get confused.

---

## 11. Website integration

**Homepage and Tools page card:**

- Title: EnvGuard
- Tagline: Typed, safe environment variables.
- Description: One schema to validate env vars, generate `.env.example`, find undeclared variables in code, and catch unsafe setups.
- Tags: TypeScript, Node, CLI
- Links: Read guide, GitHub, npm

**Docs pages to write** (`/docs/envguard/...`):

1. `getting-started` (install, first schema, first check)
2. `schema` (every builder and chain method)
3. `cli` (every command, option, exit code)
4. `recipes` (Next.js, Vite, Docker, CI, pre-commit)
5. `limitations`

**Badges** for the README and the site:

```
https://img.shields.io/npm/v/@silentcoderhi/envguard
https://img.shields.io/npm/dw/@silentcoderhi/envguard
https://img.shields.io/npm/l/@silentcoderhi/envguard
https://img.shields.io/github/stars/SilentCoder-HI/envguard
```

Track downloads: `https://api.npmjs.org/downloads/point/last-week/@silentcoderhi/envguard`

---

## 12. How people will use it (recipes)

**Plain Node app:**

```ts
import { envSchema } from "./env.config";
export const config = envSchema.parseOrExit(process.env);
```

Load the `.env` first: `node --env-file=.env app.js` (Node 20.6+) or `dotenv`.

**Next.js:** put `env.config.ts` in the project root and import it in server code. Next.js already loads `.env` into `process.env`. Do not mark server secrets with `NEXT_PUBLIC_`; `doctor` will warn you.

**Vite:** `envSchema.parse(import.meta.env)`. Only `VITE_` variables reach the browser.

**package.json scripts (check before running):**

```json
{
  "scripts": {
    "predev": "envguard check",
    "prebuild": "envguard check --system",
    "env:example": "envguard example",
    "env:verify": "envguard example --check && envguard scan && envguard doctor"
  }
}
```

**GitHub Actions:**

```yaml
- run: npx envguard example --check
- run: npx envguard scan
- run: npx envguard doctor
- run: npx envguard check --system   # with secrets provided as env
```

**Pre-commit (husky):** run `npx envguard example --check` so `.env.example` can never drift.

**Deploy gate:**

```bash
npx envguard check --file .env.production && npm run deploy
```

---

## 13. Edge cases and decisions (keep these consistent)

| Situation | Behavior |
|---|---|
| Variable is `""` (empty) | Treated as missing, so default/optional applies |
| Number `0` | Valid (do not use `!n`) |
| Boolean text | `true/1/yes/on` and `false/0/no/off`, case-insensitive |
| Error messages | Never include the value |
| `.default()` on `.secret()` | Allowed, but the default is hidden in `.env.example` |
| `.optional().url()` | Not typed. Put `.optional()` and `.default()` last |
| Unknown keys in `.env` | Warning only |
| Schema file exports | `envSchema`, `schema`, or default export |
| Schema file is not found | Exit code 2 with a clear message |
| Not a git repo | `doctor` skips the tracked-by-git result without crashing |

---

## 14. Publish checklist

1. `LICENSE` file with MIT text and your name.
2. `README.md` (the one provided with this guide).
3. `npm run typecheck && npm test && npm run build`.
4. `npm pack --dry-run`. Confirm only `dist`, `README.md`, `LICENSE`, `package.json` are included.
5. Test in a fresh folder: `npm i /path/to/envguard-0.1.0.tgz` then run a real schema and the CLI.
6. `npm login` (enable 2FA on your npm account).
7. `npm publish --access public`.
8. `git tag v0.1.0 && git push --tags`, then create a GitHub Release.
9. Update the website card, docs, and badges.

Version rules (semver): bug fix = `0.1.1`, new feature = `0.2.0`. Add a line to `CHANGELOG.md` every release.

CI file `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

---

## 15. Build order (day-by-day)

| Day | Task |
|---|---|
| 1 | Setup (package.json, tsconfig, tsup). Write `types`, `field`, `builders`, `object`, `dotenv`, `index`. |
| 2 | Core tests. Fix bugs. Publish **v0.1.0**. |
| 3 | CLI utils (`flags`, `print`, `loadSchema`, `readEnvFile`) and `check`. |
| 4 | `example` + `example --check`. Test with `npm link` in a real project of yours. Publish **v0.2.0**. |
| 5 | `scan` (regex and walker) + tests. |
| 6 | `doctor` + tests. Publish **v0.3.0**. |
| 7 | Playground tabs, website card, docs pages, badges. |
| 8+ | Use it in your own projects. Fix whatever annoys you. Publish **v1.0.0**. |

---

## 16. Final checklist (done means all ticked)

- [ ] `core` has no Node imports and no `cli` imports
- [ ] Error messages never print values
- [ ] `0` and `false` work as valid values
- [ ] `check`, `example`, `scan`, `doctor` return codes 0, 1, 2 correctly
- [ ] `example --check` fails in CI when `.env.example` is stale
- [ ] `scan` documented limitation: dynamic `process.env[x]` is not detected
- [ ] `npm pack --dry-run` shows only intended files
- [ ] README has an honest comparison with `envalid` and `t3-env`
- [ ] Used in at least one of your own real projects
- [ ] Playground works and warns about real secrets

---

## 17. Later ideas (do not build yet)

- `envguard diff .env .env.production`: shows keys missing in one file.
- `.client()` / `.server()` scopes: stop server secrets from reaching browser bundles.
- `envguard docs --markdown`: prints a table of all variables (no AI, it just uses `.describe()` text).
- Split the CLI into its own package if the `jiti` dependency bothers library users.
- VS Code extension: show schema descriptions when hovering over a variable in `.env`.

Build the core, ship it, then add one command at a time. Every release should be small and usable.