import path from "node:path";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

// cli args
const args = process.argv.slice(2);
const NO_CHECK = args.includes("--no-check");
const COMMIT = args.includes("--commit");

// get paths relative to this script
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");
const DIST_DIR = path.join(PROJECT_DIR, "dist");
const STANDALONE_DIR = path.join(DIST_DIR, "standalone");
const HOMEBREW_DIR = path.join(PROJECT_DIR, "homebrew");

const package_json = await file.read_json(
  path.join(PROJECT_DIR, "package.json")
);

const version = package_json.version;

process.chdir(STANDALONE_DIR);

const linux_asset = await create_asset("git-stack-cli-linux");
const macos_asset = await create_asset("git-stack-cli-macos");
const win_asset = await create_asset("git-stack-cli-win.exe");

console.debug({ linux_asset, macos_asset, win_asset });

const re_token = (name: string) => new RegExp(`{{ ${name} }}`, "g");

process.chdir(HOMEBREW_DIR);

let formula = await file.read_text("git-stack.rb.template");

formula = formula.replace(re_token("version"), version);
formula = formula.replace(re_token("mac_bin"), macos_asset.name);
formula = formula.replace(re_token("mac_sha256"), macos_asset.sha256);
formula = formula.replace(re_token("linux_bin"), linux_asset.name);
formula = formula.replace(re_token("linux_sha256"), linux_asset.sha256);

await file.write_text("git-stack.rb", formula);

if (COMMIT) {
  await spawn.sync(`git commit -a -m ${version}`);
  await spawn.sync(`git push`);
}

process.chdir(PROJECT_DIR);

await spawn(`npm i`);

if (COMMIT) {
  await spawn.sync(`git commit -a -m ${version}`);
  await spawn.sync(`git push`);
}

// -a: create tag on last commit
// -m: message
if (COMMIT) {
  await spawn.sync(`git tag -a ${version} -m ${version}`);
  await spawn.sync(`git push origin ${version}`);

  await spawn.sync(
    `gh release create ${version} -t ${version} --generate-notes`
  );

  process.chdir(STANDALONE_DIR);

  await spawn.sync(`gh release upload ${version} ${linux_asset.name}`);
  await spawn.sync(`gh release upload ${version} ${macos_asset.name}`);
  await spawn.sync(`gh release upload ${version} ${win_asset.name}`);
}

console.debug();
console.debug("✅", "published", version);
console.debug("  COMMIT", COMMIT);
console.debug("  NO_CHECK", NO_CHECK);
console.debug();
console.debug("  https://github.com/magus/git-stack-cli/releases");
console.debug();

console.debug();
console.debug("Don't forget to run `npm publish` to update the NPM registry!");
console.debug();
console.debug("  npm publish");
console.debug();

// https://github.com/magus/git-stack-cli/releases/download/0.8.9/git-stack-cli-linux
async function create_asset(name: string) {
  const sha256_cmd = await spawn.sync(`shasum -a 256 ${name}`);
  const match = sha256_cmd.stdout.match(/(?<sha256>[^\s]+)/i);

  if (!match?.groups) {
    throw new Error(`unable to get sha256 for ${name}`);
  }

  const sha256 = match.groups.sha256;

  const url = `https://github.com/magus/git-stack-cli/releases/download/${version}/${name}`;

  return { name, sha256, url };
}
