import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "shared",
      include: ["packages/shared/**/*.test.ts"],
    },
  },
  {
    test: {
      name: "logger",
      include: ["packages/logger/**/*.test.ts"],
    },
  },
]);
