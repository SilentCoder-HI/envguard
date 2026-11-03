# EnvGuard

**One schema for your environment variables.** Validate them at startup, generate `.env.example`, find undeclared variables in your code, and catch unsafe setups, all from the same file.

[![npm](https://img.shields.io/npm/v/@silentcoderhi/envguard)](https://www.npmjs.com/package/@silentcoderhi/envguard)
[![downloads](https://img.shields.io/npm/dw/@silentcoderhi/envguard)](https://www.npmjs.com/package/@silentcoderhi/envguard)
[![license](https://img.shields.io/npm/l/@silentcoderhi/envguard)](./LICENSE)

- **Typed:** `config.PORT` is a `number`, `config.NODE_ENV` is a union, with autocomplete.
- **Clear errors:** every problem at once, and secret values are never printed.
- **Zero dependencies in the library**, browser-safe, ESM and CJS.
- **A CLI that uses the same schema:** `check`, `example`, `scan`, `doctor`.
- **No AI, no network.** Plain code that runs locally.

## Install

```bash
npm i @silentcoderhi/envguard
```

Requires Node 18+ and TypeScript 5+ (for types).

## Quick start

**1. Describe your variables once** in `env.config.ts`:

```ts
import { env } from "@silentcoderhi/envguard";

export const envSchema = env.object({
  NODE_ENV: env.enum(["development", "production", "test"]).default("development"),
  PORT: env.number().port().default(3000).describe("Server port"),
  DATABASE_URL: env.string().url().describe("Postgres connection string"),
  JWT_SECRET: env.string().min(32).secret().describe("Token signing key"),
  ENABLE_AI: env.boolean().default(false),
});
```

**2. Use it in your app:**

```ts
import { envSchema } from "./env.config";

export const config = envSchema.parseOrExit(process.env);

config.PORT;     // number
config.NODE_ENV; // "development" | "production" | "test"
```

If something is wrong, the app stops immediately:

```
✖ Invalid environment variables:
  DATABASE_URL  missing
  JWT_SECRET    must be at least 32 characters
```

**3. Use the same schema from the terminal:**

```bash
npx envguard check      # is my .env valid?
npx envguard example    # write .env.example from the schema
npx envguard scan       # is every process.env.X in my code declared?
npx envguard doctor     # is my env setup safe?
```

## Schema reference

| Builder | Type | Chain methods |
|---|---|---|
| `env.string()` | `string` | `.min(n)` `.max(n)` `.url()` `.email()` `.matches(regex, message?)` |
| `env.number()` | `number` | `.min(n)` `.max(n)` `.int()` `.port()` |
| `env.boolean()` | `boolean` | accepts `true/false`, `1/0`, `yes/no`, `on/off` |
| `env.enum([...])` | union of the values | |

Methods available on every builder:

| Method | Meaning |
|---|---|
| `.default(value)` | Used when the variable is missing or empty |
| `.optional()` | Variable may be missing (type becomes `T \| undefined`) |
| `.describe(text)` | Documentation, written into `.env.example` |
| `.secret()` | Never printed and never given a value in `.env.example` |

Put `.optional()` and `.default()` **last** in the chain.

Schema methods:

| Method | Behavior |
|---|---|
| `schema.parse(source)` | Returns typed data or throws `EnvError` |
| `schema.parseOrExit(source)` | Prints a clean message and exits with code 1 |
| `schema.safeParse(source)` | Returns `{ success, data }` or `{ success: false, errors }`, never throws |

Helper: `parseEnv(text)` turns the text of a `.env` file into an object (works in the browser).

## CLI reference

### `envguard check`

Validates a `.env` file (or the real system environment) against your schema.

```bash
envguard check                          # reads .env
envguard check --file .env.production   # another file
envguard check --system                 # checks process.env (for CI and deploys)
```

Reports missing, empty, and invalid values. Extra variables in the file that are not in the schema only produce a warning.

### `envguard example`

Writes `.env.example` from the schema (descriptions become comments, secrets stay empty).

```bash
envguard example                # write .env.example
envguard example --stdout       # print instead of writing
envguard example --check        # fail if .env.example is missing or outdated (for CI)
envguard example --out .env.sample
```

### `envguard scan`

Searches your source code for `process.env.X`, `process.env["X"]`, `import.meta.env.X`, and `const { X } = process.env`, then compares them with the schema.

```bash
envguard scan
envguard scan --dir src --dir server
envguard scan --strict          # also fail on schema variables that are never used
```

- Reads only `src`, `app`, `pages`, `lib`, `server` by default (not your whole project).
- Skips `node_modules`, `dist`, `build`, `.next`, `coverage`, and test files.
- Configure with `envguard.json`:

```json
{
  "scan": {
    "include": ["src", "app"],
    "exclude": ["node_modules", "dist", "generated"]
  }
}
```

### `envguard doctor`

Safety checks:

- `.env` is listed in `.gitignore`
- `.env` is not tracked by git
- `.env.example` exists and is up to date
- `.env.example` contains no real-looking secrets (Stripe, AWS, GitHub, Slack keys, private keys)
- Variables marked `.secret()` do not use browser-exposed prefixes (`NEXT_PUBLIC_`, `VITE_`, ...)
- Sensitive-looking names (`*_SECRET`, `*_TOKEN`, `*_API_KEY`) are marked `.secret()`

### Exit codes

| Code | Meaning |
|---|---|
| `0` | OK |
| `1` | Problems found |
| `2` | Usage error (schema not found, unknown option) |

## Recipes

**Run checks before dev and build** (`package.json`):

```json
{
  "scripts": {
    "predev": "envguard check",
    "prebuild": "envguard check --system",
    "env:verify": "envguard example --check && envguard scan && envguard doctor"
  }
}
```

**Block a bad deploy:**

```bash
npx envguard check --file .env.production && npm run deploy
```

**GitHub Actions:**

```yaml
- run: npx envguard example --check
- run: npx envguard scan
- run: npx envguard doctor
```

**Vite:** `envSchema.parse(import.meta.env)`
**Next.js:** import `envSchema` in server code (Next already loads `.env` into `process.env`).
**Plain Node:** `node --env-file=.env app.js` (Node 20.6+) or load with `dotenv`, then call `parseOrExit`.

## How is this different from envalid, t3-env, or a Zod schema?

Honestly, validating variables is the easy part, and those tools do it well. EnvGuard adds the surrounding workflow in one tool:

- generates and verifies `.env.example` from the schema,
- finds variables used in code but missing from the schema,
- checks for unsafe setups (gitignore, tracked files, leaked keys, public prefixes),
- ships with zero runtime dependencies in the library.

If you only need validation and already use Zod, you may not need EnvGuard.

## Limitations

- Dynamic access such as `process.env[name]` cannot be detected by `scan`.
- Multi-line values in `.env` files are not supported.
- Validation checks the *shape* of a value, not whether the service behind it works.
- `scan` is regex-based, so it can miss unusual code patterns.
- `doctor` checks only common secret formats.

## Development

```bash
npm install
npm test
npm run build
npx tsx src/cli/index.ts check
```

## License

MIT, by [Hussnain Iftikhar](https://hussnaintech.vercel.app/). Part of [SilentCoder Tools](https://silentcodertools.vercel.app/).