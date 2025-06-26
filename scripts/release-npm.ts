import * as fs from "node:fs/promises";
import path from "node:path";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

process.env.NODE_ENV = "production";

// get paths relative to this script
const REPO_ROOT = (await spawn.sync("git rev-parse --show-toplevel")).stdout;
const DIST_DIR = path.join(REPO_ROOT, "dist");

// clear entire dist output directory
await fs.rmdir(DIST_DIR, { recursive: true });
await fs.mkdir(DIST_DIR, { recursive: true });

process.chdir(REPO_ROOT);

// require clean git status besides changes to package.json version
const git_status = await spawn.sync("git status --porcelain");
if (!/^M\s+package.json/.test(git_status.stdout)) {
  console.error(
    "please commit local changes and only update package.json version before running release",
  );
  process.exit(4);
}

const package_json = await file.read_json(path.join(REPO_ROOT, "package.json"));

const version = package_json.version;

const git_tag = await spawn.sync(`git tag -l ${version}`);

if (git_tag.stdout) {
  console.error(`tag [${version}] already exists`);
  if (!process.env.GS_NO_CHECK) {
    process.exit(1);
  }
}

// install all dependencies even though we are NODE_ENV=production
await spawn(`pnpm install --frozen-lockfile --production=false`);

await spawn(`pnpm run test:all`);

await spawn(`pnpm run build`);

// confirm all files specified exist
for (const filepath of package_json.files) {
  if (!(await file.exists(filepath))) {
    console.error("missing required file in package.json files", filepath);
    if (!process.env.GS_NO_CHECK) {
      process.exit(2);
    }
  }
}

process.chdir(REPO_ROOT);

await spawn.sync(`git commit -a -m ${version}`);
await spawn.sync(`git push`);

// -a: create tag on last commit
// -m: message
await spawn.sync(`git tag -a ${version} -m ${version}`);
await spawn.sync(`git push origin ${version}`);

process.env.GS_RELEASE_NPM = "true";
console.info("Publishing to NPM requires a one-time password");
const otp = await input("Enter OTP: ");
await spawn(["npm", "publish", `--otp=${otp}`]);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("https://www.npmjs.com/package/git-stack-cli");
console.debug();

async function input(prompt: string) {
  process.stdout.write(prompt);
  for await (const value of console) {
    if (value) {
      return value;
    }
    process.stdout.write(prompt);
  }
}
