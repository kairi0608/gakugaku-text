import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      "node_modules.auth-repair-backup/**",
      "node_modules.empty-build-backup/**",
      ".pnpm-store/**",
      ".next/**",
      ".next-production/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "gakugaku-material-hub/**",
      "gakugaku-material-hub-fixed/**",
      "gakugaku-material-hub-supabase/**",
      "gakugaku-ai-system-release/**",
      "gakugaku-ai-system-role-release/**",
      "gakugaku-ai-system-production-ready/**",
    ],
  },
];

export default eslintConfig;
