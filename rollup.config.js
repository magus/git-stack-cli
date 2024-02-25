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

const package_json_str = await fs.readFile(PACKAGE_JSON_PATH, "utf-8");
const package_json = JSON.parse(package_json_str);

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
        "process.env.CLI_VERSION": JSON.stringify(String(package_json.version)),
        "process.env.GIT_STACK_STANDALONE": process.env.GIT_STACK_STANDALONE,
      },
    }),
  ],
};
