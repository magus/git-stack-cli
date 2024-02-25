// npm i -D rollup @rollup/plugin-json @rollup/plugin-node-resolve @rollup/plugin-commonjs

import * as fs from "node:fs/promises";
import path from "node:path";
import * as url from "node:url";

import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";

const SCRIPT_DIR = path.dirname(url.fileURLToPath(import.meta.url));

const PACKAGE_JSON_PATH = path.join(SCRIPT_DIR, "package.json");
const PACKAGE_JSON = JSON.parse(await fs.readFile(PACKAGE_JSON_PATH, "utf-8"));

// prettier-ignore
const GIT_SEQUENCE_EDITOR_SCRIPT_PATH = path.join(SCRIPT_DIR, "scripts", "git-sequence-editor.sh");
// prettier-ignore
const UNSAFE_GIT_SEQUENCE_EDITOR_SCRIPT = await fs.readFile(GIT_SEQUENCE_EDITOR_SCRIPT_PATH, "utf-8");
// prettier-ignore
const GIT_SEQUENCE_EDITOR_SCRIPT = UNSAFE_GIT_SEQUENCE_EDITOR_SCRIPT.replace(/`/g, "\\`");

export default {
  input: "src/index.tsx",

  output: {
    file: "dist/cjs/index.cjs",
    format: "cjs",
    inlineDynamicImports: true,
  },

  plugins: [
    // force line break
    typescript(),
    alias({
      entries: [{ find: /^~\//, replacement: "./src/" }],
    }),
    nodeResolve({ exportConditions: ["node"] }),
    commonjs(),
    json(),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.CLI_VERSION": JSON.stringify(String(PACKAGE_JSON.version)),
        "process.env.GIT_STACK_STANDALONE": process.env.GIT_STACK_STANDALONE,
        "process.env.GIT_SEQUENCE_EDITOR_SCRIPT": GIT_SEQUENCE_EDITOR_SCRIPT,
      },
    }),
  ],
};
