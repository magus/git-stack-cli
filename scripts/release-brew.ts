import path from "node:path";

import { create_asset } from "~/core/create_asset";
import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// get paths relative to this script
const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;
const DIST_DIR = path.join(REPO_ROOT, "dist");
const BIN_DIR = path.join(DIST_DIR, "bin");
const HOMEBREW_DIR = path.join(REPO_ROOT, "homebrew");

const package_json = await file.read_json(path.join(REPO_ROOT, "package.json"));

const version = package_json.version;

process.chdir(HOMEBREW_DIR);

// before creating new formula, mv the previous into a versioned formula name
const previous_formula_path = path.join(HOMEBREW_DIR, "Formula", "git-stack.rb");

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
previous_formula = previous_formula.replace("class GitStack", `class ${previous_class}`);

await file.write_text(
  path.join(HOMEBREW_DIR, "Formula", `git-stack@${previous_version}.rb`),
  previous_formula,
);

process.chdir(REPO_ROOT);

const tarball_asset = await create_asset(`git-stack-cli-${version}.tgz`, { version });

await spawn(`pnpm run compile`);

process.chdir(BIN_DIR);

const linux_x64_asset = await create_asset("git-stack-bun-linux-x64.zip", { version });
const macos_x64_asset = await create_asset("git-stack-bun-darwin-x64.zip", { version });
const macos_arm64_asset = await create_asset("git-stack-bun-darwin-arm64.zip", { version });
const win_x64_asset = await create_asset("git-stack-bun-windows-x64.exe.zip", { version });

console.debug({ linux_x64_asset, macos_x64_asset, macos_arm64_asset, win_x64_asset });

const re_token = (name: string) => new RegExp(`{{ ${name} }}`, "g");

process.chdir(HOMEBREW_DIR);

// homebrew tap formula (binaries)

let tap = await file.read_text(path.join("templates", "git-stack.tap.rb.template"));

tap = tap.replace(re_token("version"), version);
tap = tap.replace(re_token("mac_x64_bin"), macos_x64_asset.filepath);
tap = tap.replace(re_token("mac_x64_sha256"), macos_x64_asset.sha256);
tap = tap.replace(re_token("mac_arm64_bin"), macos_arm64_asset.filepath);
tap = tap.replace(re_token("mac_arm64_sha256"), macos_arm64_asset.sha256);
tap = tap.replace(re_token("linux_x64_bin"), linux_x64_asset.filepath);
tap = tap.replace(re_token("linux_x64_sha256"), linux_x64_asset.sha256);

await file.write_text(path.join("Formula", "git-stack.rb"), tap);

// homebrew/core formula (build from source)

let core = await file.read_text(path.join("templates", "git-stack.core.rb.template"));

core = core.replace(re_token("version"), version);
core = core.replace(re_token("tarball_sha256"), tarball_asset.sha256);

await file.write_text(path.join("Formula", "git-stack.core.rb"), core);

// commit homebrew repo changes
process.chdir(HOMEBREW_DIR);
await spawn.sync(`git add .`);
await spawn.sync(`git commit -m ${version}`);
await spawn.sync(`git push`);

// commmit changes to main repo
process.chdir(REPO_ROOT);
// prettier-ignore
await spawn.sync(["git", "commit", "-a", "-m", `homebrew-git-stack ${version}`]);
await spawn.sync(`git push`);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://github.com/magus/homebrew-git-stack");
console.debug();
console.debug("https://github.com/magus/git-stack-cli/releases");
console.debug();
