import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      // Разрешаем использование any в крайних случаях
      "@typescript-eslint/no-explicit-any": "warn",
      // Разрешаем неиспользуемые переменные с _ префиксом
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      // Предупреждения вместо ошибок для img
      "@next/next/no-img-element": "warn",
    }
  },
  {
    ignores: [
      "node_modules/",
      ".next/",
      "public/",
      "functions/",
      "tests/"
    ]
  }
];

export default eslintConfig;

