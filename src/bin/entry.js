#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const child = require("child_process");

const script_dir = path.dirname(fs.realpathSync(__filename));
const script_path = path.join(script_dir, "..", "index.ts");

const args = process.argv.slice(2).join(" ");
const command = `npx tsx "${script_path}" ${args}`;

try {
  child.execSync(command, { stdio: "inherit" });
} catch (err) {
  process.exit(err.status);
}
