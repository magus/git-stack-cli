import * as fs from "node:fs/promises";
import path from "node:path";

import * as json from "~/core/json";

// get paths relative to this script
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");
const NODE_MODULES_BIN = path.join(PROJECT_DIR, "node_modules", ".bin");
const DIST_DIR = path.join(PROJECT_DIR, "dist");
const CJS_DIR = path.join(DIST_DIR, "cjs");
const STANDALONE_DIR = path.join(DIST_DIR, "standalone");

// clear entire dist output directory
await fs.rmdir(DIST_DIR, { recursive: true });
await fs.mkdir(DIST_DIR, { recursive: true });

const package_json = await json.read(path.join(PROJECT_DIR, "package.json"));

// prettier-ignore
const { name, version, description, author, license, repository } = package_json;

// include fields necessary for standalone executable build
const standalone_package_json = {
  name,
  version,
  description,
  author,
  license,
  repository,
  bin: {
    "git-stack": "index.js",
  },
};

await json.write(
  path.join(STANDALONE_DIR, "package.json"),
  standalone_package_json
);

process.chdir(PROJECT_DIR);

Bun.env["NODE_ENV"] = "production";

// run typescript build to generate module output
const ts_build_cmd = Bun.spawn(["npm", "run", "build"], {
  stdout: "inherit",
  stderr: "inherit",
});

await ts_build_cmd.exited;

// run rollup to generate commonjs for building standalone
const rollup_cmd = Bun.spawn(
  [path.join(NODE_MODULES_BIN, "rollup"), "-c", "rollup.config.mjs"],
  {
    stdout: "inherit",
    stderr: "inherit",
  }
);

await rollup_cmd.exited;

await fs.cp(
  path.join(CJS_DIR, "index.cjs"),
  path.join(STANDALONE_DIR, "index.js")
);

process.chdir(STANDALONE_DIR);

// run pkg to build standalone executable
const pkg_cmd = await Bun.spawn(
  [path.join(NODE_MODULES_BIN, "pkg"), "package.json"],
  {
    stdout: "inherit",
    stderr: "inherit",
  }
);

await pkg_cmd.exited;
