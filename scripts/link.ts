import path from "node:path";

import { spawn } from "~/core/spawn";

const SCRIPT_DIR = import.meta.dir;
const PROJECT_DIR = path.join(SCRIPT_DIR, "..");

process.chdir(PROJECT_DIR);

await spawn.sync("npm unlink git-stack-cli");
await spawn.sync("npm link");

console.debug();
console.debug("✅", "linked");
