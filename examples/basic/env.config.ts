import { env } from "@silentcoderhi/envguard";

export const envSchema = env.object({
  NODE_ENV: env.enum(["development", "production", "test"]).default("development"),
  PORT: env.number().port().default(3000).describe("Server port"),
  DATABASE_URL: env.string().url().describe("Postgres connection string"),
  JWT_SECRET: env.string().min(32).secret().describe("Token signing key"),
  ENABLE_AI: env.boolean().default(false),
});