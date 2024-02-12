import * as fs from "node:fs/promises";
import path from "node:path";

import * as file from "~/core/file";
import { spawn } from "~/core/spawn";

process.env.NODE_ENV = "production";

// get paths relative to this script
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");
const DIST_DIR = path.join(PROJECT_DIR, "dist");

// clear entire dist output directory
await fs.rmdir(DIST_DIR, { recursive: true });
await fs.mkdir(DIST_DIR, { recursive: true });

process.chdir(PROJECT_DIR);

const package_json = await file.read_json(
  path.join(PROJECT_DIR, "package.json")
);

const version = package_json.version;

const git_tag = await spawn.sync(`git tag -l ${version}`);

if (git_tag.stdout) {
  console.error(`tag [${version}] already exists`);
  if (!process.env.GS_NO_CHECK) {
    process.exit(1);
  }
}

// install all dependencies even though we are NODE_ENV=production
await spawn(`npm install --production=false`);

await spawn(`npm run test:all`);

await spawn(`npm run build`);

// confirm all files specified exist
for (const filepath of package_json.files) {
  if (!(await file.exists(filepath))) {
    console.error("missing required file in package.json files", filepath);
    if (!process.env.GS_NO_CHECK) {
      process.exit(2);
    }
  }
}

process.env["GS_RELEASE_NPM"] = "true";
console.info("Publishing to NPM requires a one-time password");
const otp = await input("Enter OTP: ");
await spawn(`npm publish --otp=${otp}`);

process.chdir(PROJECT_DIR);

await spawn.sync(`git commit -a -m ${version}`);
await spawn.sync(`git push`);

// -a: create tag on last commit
// -m: message
await spawn.sync(`git tag -a ${version} -m ${version}`);
await spawn.sync(`git push origin ${version}`);

console.debug();
console.debug("✅", "published", version);
console.debug();
console.debug("  https://github.com/magus/git-stack-cli/releases");
console.debug();

// // https://github.com/magus/git-stack-cli/releases/download/0.8.9/git-stack-cli-linux
// async function create_asset(name: string) {
//   const sha256_cmd = await spawn.sync(`shasum -a 256 ${name}`);
//   const match = sha256_cmd.stdout.match(/(?<sha256>[^\s]+)/i);

//   if (!match?.groups) {
//     throw new Error(`unable to get sha256 for ${name}`);
//   }

//   const sha256 = match.groups.sha256;

//   const url = `https://github.com/magus/git-stack-cli/releases/download/${version}/${name}`;

//   return { name, sha256, url };
// }

// function reFind(list: Array<string>, re: RegExp) {
//   for (const str of list) {
//     const match = str.match(re);

//     if (match?.groups) {
//       return match.groups.value;
//     }
//   }

//   return null;
// }

async function input(prompt: string) {
  process.stdout.write(prompt);
  for await (const value of console) {
    if (value) {
      return value;
    }
    process.stdout.write(prompt);
  }
}
