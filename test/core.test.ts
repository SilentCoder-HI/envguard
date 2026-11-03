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