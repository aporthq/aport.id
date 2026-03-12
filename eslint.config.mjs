import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      ".wrangler/**",
      "migrations/**",
      "scripts/**",
      "next-env.d.ts",
      "tailwind.config.js",
      "postcss.config.js",
      "*.config.js",
      "*.config.mjs",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Turn off for now, too many instances
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "off", // Allow require in config files
      "@typescript-eslint/triple-slash-reference": "off", // Allow in next-env.d.ts
      "@typescript-eslint/no-empty-object-type": "off", // Allow empty interfaces (UI component pattern)
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off", // Allow quotes/apostrophes in JSX
      "@next/next/no-html-link-for-pages": "warn", // Warn instead of error for <a> tags
      "import/no-anonymous-default-export": "off", // Allow anonymous default exports
    },
  },
];

export default eslintConfig;
