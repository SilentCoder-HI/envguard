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