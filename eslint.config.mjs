import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierConfig,
  {
    files: ["src/domain/**/*.ts", "src/domain/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/infra/**",
                "@/infra/**",
                "../infra/**",
                "../../infra/**",
              ],
              message:
                "Domain layer must not import from infrastructure. Move shared types to src/domain/.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "**/dist/**",
    "node_modules/**",
    "convex/_generated/**",
    ".tmp/**",
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
