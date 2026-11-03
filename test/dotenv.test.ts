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