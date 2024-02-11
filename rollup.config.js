// npm i -D rollup @rollup/plugin-json @rollup/plugin-node-resolve @rollup/plugin-commonjs

import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "dist/ts/index.js",
  output: {
    file: "dist/cjs/index.js",
    format: "cjs",
    inlineDynamicImports: true,
  },
  plugins: [
    // force line break
    nodeResolve({ exportConditions: ["node"] }),
    commonjs(),
    json(),
  ],
};
