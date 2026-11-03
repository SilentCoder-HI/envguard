import { describe, it, expect } from "vitest";
import { env, parseEnv } from "../src/index";

describe("smoke", () => {
  it("validates a small env", () => {
    const schema = env.object({ PORT: env.number().default(3000) });
    const result = schema.safeParse(parseEnv("PORT=8080"));
    expect(result).toEqual({ success: true, data: { PORT: 8080 } });
  });
});