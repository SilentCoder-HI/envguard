import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "es2022",
  },
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm"],
    clean: false,
    target: "node18",
    external: ["jiti"],
  },
]);