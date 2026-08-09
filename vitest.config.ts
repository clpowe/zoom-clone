import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["app/**/*.test.ts", "server/**/*.test.ts"],
          exclude: ["app/**/*.nuxt.test.ts"],
          environment: "node",
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["app/**/*.nuxt.test.ts"],
          environment: "nuxt",
        },
      }),
    ],
  },
});
