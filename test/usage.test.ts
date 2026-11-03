import { describe, it, expect } from "vitest";
import { env } from "../src/index";

describe("how a user uses it in an app", () => {
  it("validates process.env-like input", () => {
    const schema = env.object({
      PORT: env.number().port().default(3000),
      NODE_ENV: env.enum(["development", "production", "test"]).default("development"),
    });

    const config = schema.parse({ PORT: "8080" });
    expect(config.PORT).toBe(8080);
    expect(config.NODE_ENV).toBe("development");
  });
});