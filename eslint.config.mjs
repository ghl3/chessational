import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // Add recommended rules from the useEffect analysis plugin
  reactYouMightNotNeedAnEffect.configs.recommended,
  {
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-restricted-syntax": [
        "error",
        "FunctionExpression[generator=false]:not(:has(ThisExpression))",
        "FunctionDeclaration[generator=false]:not(:has(ThisExpression))",
      ],
    },
  },
];

export default eslintConfig;
