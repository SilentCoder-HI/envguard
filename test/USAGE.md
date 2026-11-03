# How users will use EnvGuard

## In their app (npm package)

```bash
npm i @silentcoderhi/envguard
```

```ts
import { env } from "@silentcoderhi/envguard";

export const envSchema = env.object({
  PORT: env.number().port().default(3000),
  NODE_ENV: env.enum(["development", "production", "test"]).default("development"),
});

export const config = envSchema.parseOrExit(process.env);
```

## With npx (CLI)

```bash
npx @silentcoderhi/envguard check
npx @silentcoderhi/envguard example
npx @silentcoderhi/envguard scan
npx @silentcoderhi/envguard doctor
```