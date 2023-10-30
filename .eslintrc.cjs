/** @type {import('eslint').Linter.Config} */
module.exports = {
  ignorePatterns: ["dist/*", "node_modules/*"],

  overrides: [
    {
      files: [".eslintrc.{js,cjs}"],

      parserOptions: {
        sourceType: "script",
      },

      env: {
        node: true,
      },
    },

    {
      files: ["src/**/*.{ts,tsx}"],

      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },

      env: {
        node: true,
        browser: true,
        es2021: true,
      },

      settings: {
        "react": {
          version: "detect",
        },

        "import/resolver": {
          typescript: true,
          node: true,
        },
      },

      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
      ],

      plugins: ["@typescript-eslint", "import", "react"],

      rules: {
        "no-console": "error",
        "prefer-const": "off",
        "linebreak-style": ["error", "unix"],
        "no-unreachable": "error",

        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "separate-type-imports" },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": ["error"],

        "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
        "import/newline-after-import": ["error"],
        "import/order": [
          "error",
          {
            "newlines-between": "always",

            "alphabetize": {
              order: "asc",
              orderImportKind: "asc",
            },

            "groups": [
              "builtin",
              "external",
              "internal",
              "parent",
              "sibling",
              "index",
              "object",
              "type",
            ],

            "pathGroups": [
              {
                pattern: "react",
                group: "builtin",
                position: "before",
              },
            ],

            "pathGroupsExcludedImportTypes": ["react"],
          },
        ],
      },
    },
  ],
};
