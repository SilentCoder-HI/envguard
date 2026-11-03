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