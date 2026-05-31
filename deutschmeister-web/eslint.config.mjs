import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Design system enforcement — see .claude/skills/web-design-system/SKILL.md
  // Warn severity while legacy pages are being migrated; flip to error in Phase 3.
  // Exempt token source files + existing legacy pages until their migration phase.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/tokens.ts",
      "src/lib/gradients.ts",
      "src/app/page.tsx",              // landing — frozen, not migrating (user decision)
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
          message:
            "Avoid hex color literals. Use ACCENT/GRADIENT from @/lib/tokens or var(--color-accent-*) from globals.css.",
        },
        {
          selector: "Literal[value=/linear-gradient\\(/]",
          message:
            "Avoid inline linear-gradient strings. Use GRADIENT from @/lib/tokens.",
        },
      ],
    },
  },
  // Pre-existing project-wide lint debt (admin pages, lib/api, types, hook
  // consumers). Kept as warnings so CI (`npm run lint`, errors-only) is not
  // blocked while this is paid down separately. The React Compiler hook rules
  // (refs/set-state-in-effect) are intentionally advisory for now.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
