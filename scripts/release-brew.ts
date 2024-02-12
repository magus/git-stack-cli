import path from "node:path";

import { create_asset } from "~/core/create_asset";
import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// get paths relative to this script
const SCRIPT_DIR = import.meta.dir;
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");
const DIST_DIR = path.join(PROJECT_DIR, "dist");
const STANDALONE_DIR = path.join(DIST_DIR, "standalone");
const HOMEBREW_DIR = path.join(PROJECT_DIR, "homebrew");

const package_json = await file.read_json(
  path.join(PROJECT_DIR, "package.json")
);

const version = package_json.version;

process.chdir(STANDALONE_DIR);

const linux_asset = await create_asset("git-stack-cli-linux", { version });
const macos_asset = await create_asset("git-stack-cli-macos", { version });
const win_asset = await create_asset("git-stack-cli-win.exe", { version });

console.debug({ linux_asset, macos_asset, win_asset });

const re_token = (name: string) => new RegExp(`{{ ${name} }}`, "g");

process.chdir(HOMEBREW_DIR);

let formula = await file.read_text(
  path.join("templates", "git-stack.tap.rb.template")
);

formula = formula.replace(re_token("version"), version);
formula = formula.replace(re_token("mac_bin"), macos_asset.filepath);
formula = formula.replace(re_token("mac_sha256"), macos_asset.sha256);
formula = formula.replace(re_token("linux_bin"), linux_asset.filepath);
formula = formula.replace(re_token("linux_sha256"), linux_asset.sha256);

await file.write_text(path.join("Formula", "git-stack.rb"), formula);

// commit homebrew repo changes
await spawn.sync(`git commit -a -m ${version}`);
await spawn.sync(`git push`);

// commmit changes to main repo
process.chdir(PROJECT_DIR);
await spawn.sync(`git commit -a -m "homebrew-git-stack ${version}"`);
await spawn.sync(`git push`);

// finally upload the assets to the github release
process.chdir(STANDALONE_DIR);
await spawn.sync(`gh release upload ${version} ${linux_asset.filepath}`);
await spawn.sync(`gh release upload ${version} ${macos_asset.filepath}`);
await spawn.sync(`gh release upload ${version} ${win_asset.filepath}`);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://github.com/magus/homebrew-git-stack");
console.debug();
console.debug("https://github.com/magus/git-stack-cli/releases");
console.debug();
