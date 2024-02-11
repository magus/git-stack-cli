# notes

## single executable install

explored `bun` but it didn't end up working due to `./yoga.wasm` dependency

```bash
rm bun
bun build ./src/index.tsx --outdir ./bun --target node
bun build ./bun/index.js --outfile ./bun/git-stack-cli --compile
cp ./node_modules/yoga-wasm-web/dist/yoga.wasm ./bun
./bun/git-stack-cli
```

setting up a `rollup` config to achieve a single file resulted in the same exact error

```js
// npm i -D rollup @rollup/plugin-json @rollup/plugin-node-resolve @rollup/plugin-commonjs

import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
  input: "dist/index.js",
  output: {
    file: "rollup/bundle.mjs",
    format: "es",
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    json(),
  ],
};
```

it seems `pkg` works if we use `commonjs` format in a single file including all third party dependencies.
so we use `rollup` to instead compile down to `format: "cjs"`.

unfortunately `ink` dependency and it's `yoga` dependency both are using top-level `await` which is not
supported in commonjs. so we fork and remove this to allow us to create the build.

after this we are finally able to then compile the commonjs output into the final executable using `pkg`.
