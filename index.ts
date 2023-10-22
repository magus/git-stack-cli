// const { exec } = require("child_process");

import child from "node:child_process";

main();

async function main() {
  const result = await cli("git status");

  console.debug({ result });
}

async function cli(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    child.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(new Error(stderr));
      } else {
        resolve(stdout);
      }
    });
  });
}
