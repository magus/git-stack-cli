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

process.chdir(HOMEBREW_DIR);

// before creating new formula, mv the previous into a versioned formula name
const previous_formula_path = path.join(
  HOMEBREW_DIR,
  "Formula",
  "git-stack.rb"
);

// match either version format from core or tap formula
//
//   version "1.0.4"
//   version = "1.0.4"
//
let previous_formula = await file.read_text(previous_formula_path);
const re_version = /version(?: =)? "(?<version>\d+\.\d+\.\d+)"/m;
const previous_version_match = previous_formula.match(re_version);

if (!previous_version_match?.groups) {
  console.error("previous version missing in formula", previous_formula_path);
  process.exit(3);
}

const previous_version = previous_version_match.groups.version;
// convert `1.0.4` to `104`
const not_dot_version = previous_version.replace(/\./g, "");
const previous_class = `GitStackAT${not_dot_version}`;
previous_formula = previous_formula.replace(
  "class GitStack",
  `class ${previous_class}`
);

await file.write_text(
  path.join(HOMEBREW_DIR, "Formula", `git-stack@${previous_version}.rb`),
  previous_formula
);

process.chdir(PROJECT_DIR);

await spawn(`npm run build:standalone`);

process.chdir(STANDALONE_DIR);

const linux_asset = await create_asset("git-stack-cli-linux", { version });
const macos_asset = await create_asset("git-stack-cli-macos", { version });
const win_asset = await create_asset("git-stack-cli-win.exe", { version });

console.debug({ linux_asset, macos_asset, win_asset });

const re_token = (name: string) => new RegExp(`{{ ${name} }}`, "g");

process.chdir(HOMEBREW_DIR);

let tap = await file.read_text(
  path.join("templates", "git-stack.tap.rb.template")
);

tap = tap.replace(re_token("version"), version);
tap = tap.replace(re_token("mac_bin"), macos_asset.filepath);
tap = tap.replace(re_token("mac_sha256"), macos_asset.sha256);
tap = tap.replace(re_token("linux_bin"), linux_asset.filepath);
tap = tap.replace(re_token("linux_sha256"), linux_asset.sha256);

await file.write_text(path.join("Formula", "git-stack.rb"), tap);

let core = await file.read_text(
  path.join("templates", "git-stack.core.rb.template")
);

core = core.replace(re_token("version"), version);
core = core.replace(re_token("mac_bin"), macos_asset.filepath);
core = core.replace(re_token("mac_sha256"), macos_asset.sha256);
core = core.replace(re_token("linux_bin"), linux_asset.filepath);
core = core.replace(re_token("linux_sha256"), linux_asset.sha256);

await file.write_text(path.join("Formula", "git-stack.core.rb"), core);

// finally upload the assets to the github release
process.chdir(STANDALONE_DIR);
await spawn.sync(`gh release upload ${version} ${linux_asset.filepath}`);
await spawn.sync(`gh release upload ${version} ${macos_asset.filepath}`);
await spawn.sync(`gh release upload ${version} ${win_asset.filepath}`);

// commit homebrew repo changes
process.chdir(HOMEBREW_DIR);
await spawn.sync(`git add .`);
await spawn.sync(`git commit -m ${version}`);
await spawn.sync(`git push`);

// commmit changes to main repo
process.chdir(PROJECT_DIR);
await spawn.sync([
  "git",
  "commit",
  "-a",
  "-m",
  `homebrew-git-stack ${version}`,
]);
await spawn.sync(`git push`);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://github.com/magus/homebrew-git-stack");
console.debug();
console.debug("https://github.com/magus/git-stack-cli/releases");
console.debug();
