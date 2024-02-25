import path from "node:path";

import { create_asset } from "~/core/create_asset";
import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// get paths relative to this script
const SCRIPT_DIR = import.meta.dir;
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");

const package_json = await file.read_json(
  path.join(PROJECT_DIR, "package.json")
);

const version = package_json.version;

// generates local tarball e.g. git-stack-cli-1.2.0.tgz
await spawn("npm pack");

// prettier-ignore
const tarball_asset = await create_asset(`git-stack-cli-${version}.tgz`, { version });

await spawn.sync(`gh release create ${version} -t ${version} --generate-notes`);

await spawn.sync(`gh release upload ${version} ${tarball_asset.filepath}`);

await file.rm(tarball_asset.filepath);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://github.com/magus/git-stack-cli/releases");
console.debug();
