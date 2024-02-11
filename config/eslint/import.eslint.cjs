module.exports = {
  rules: {
    "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
    "import/first": "error",
    "import/newline-after-import": ["error", { considerComments: true }],
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
};
