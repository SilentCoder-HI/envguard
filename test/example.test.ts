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