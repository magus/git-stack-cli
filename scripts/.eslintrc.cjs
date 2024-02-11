const path = require("node:path");
const import_eslint = require("../config/eslint/import.eslint.cjs");

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  ignorePatterns: [],

  overrides: [
    {
      files: [".eslintrc.{js,cjs}"],

      parserOptions: {
        ecmaVersion: 13, // ES2022
        sourceType: "script",
      },

      env: {
        node: true,
      },
    },

    {
      files: ["**/*.{ts,tsx}"],

      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "script",
        project: path.resolve(__dirname, "tsconfig.json"),
      },

      env: {
        node: true,
      },

      settings: {
        "import/resolver": {
          typescript: true,
          node: true,
        },
      },

      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],

      plugins: ["@typescript-eslint", "import"],

      rules: {
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": ["error"],

        ...import_eslint.rules,
      },
    },
  ],
};
