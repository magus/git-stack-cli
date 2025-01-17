import path from "node:path";

import { create_asset } from "~/core/create_asset";
import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// get paths relative to this script
const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;
const DIST_DIR = path.join(REPO_ROOT, "dist");
const BIN_DIR = path.join(DIST_DIR, "bin");

const package_json = await file.read_json(path.join(REPO_ROOT, "package.json"));

const version = package_json.version;

// generates local tarball e.g. git-stack-cli-1.2.0.tgz
await spawn("pnpm pack");

// generate single file executables for all targets
await spawn(`pnpm run compile`);

await spawn.sync(`gh release create ${version} -t ${version} --generate-notes`);

const tarball_asset = await create_asset(`git-stack-cli-${version}.tgz`, { version });
await spawn.sync(`gh release upload ${version} ${tarball_asset.filepath}`);

process.chdir(BIN_DIR);

await zip_upload("git-stack-bun-darwin-arm64");
await zip_upload("git-stack-bun-darwin-x64");
await zip_upload("git-stack-bun-linux-x64");
await zip_upload("git-stack-bun-windows-x64.exe");

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://github.com/magus/git-stack-cli/releases");
console.debug();

async function zip_upload(filepath: string) {
  const zip_filepath = `${filepath}.zip`;
  await spawn.sync(`zip -r ${zip_filepath} ${filepath}`);
  const asset = await create_asset(zip_filepath, { version });
  await spawn.sync(`gh release upload ${version} ${asset.filepath}`);
}
