import * as fs from "node:fs/promises";
import path from "node:path";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// get paths relative to this script
const SCRIPT_DIR = import.meta.dir;
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");
const NODE_MODULES_BIN = path.join(PROJECT_DIR, "node_modules", ".bin");
const DIST_DIR = path.join(PROJECT_DIR, "dist");
const CJS_DIR = path.join(DIST_DIR, "cjs");
const STANDALONE_DIR = path.join(DIST_DIR, "standalone");

const ARG_LIST = process.argv.slice(2);
const [maybe_target] = ARG_LIST;

let TARGET = "node18-linux-x64,node18-macos-x64,node18-win-x64";
if (maybe_target) {
  TARGET = maybe_target;
}

console.debug(`Building for target [${TARGET}]`);

// clear entire dist output directory
await fs.rmdir(DIST_DIR, { recursive: true });
await fs.mkdir(DIST_DIR, { recursive: true });

const package_json = await file.read_json(
  path.join(PROJECT_DIR, "package.json")
);

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

await file.write_json(
  path.join(STANDALONE_DIR, "package.json"),
  standalone_package_json
);

process.chdir(PROJECT_DIR);

process.env.NODE_ENV = "production";

// run typescript build to generate module output
await spawn("npm run build");

await fs.cp(
  path.join(CJS_DIR, "index.cjs"),
  path.join(STANDALONE_DIR, "index.js")
);

process.chdir(STANDALONE_DIR);

// run pkg to build standalone executable
await spawn([
  path.join(NODE_MODULES_BIN, "pkg"),
  "package.json",
  `--targets=${TARGET}`,
]);
