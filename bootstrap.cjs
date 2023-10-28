#!/usr/bin/env node

const tsConfigPaths = require("tsconfig-paths");

const cleanup = tsConfigPaths.register({
  // either absolute or relative path
  // if relative it's resolved to current working directory.
  baseUrl: "./",

  paths: {
    "~/*": ["./dist/*"],
  },
});
