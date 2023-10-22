// const { exec } = require("child_process");

import child from "node:child_process";
import { assert } from "node:console";

main();

async function main() {
  const branch_name = await cli("git rev-parse --abbrev-ref HEAD");

  const git_log_line_list = lines(
    await cli("git log master..HEAD --oneline --color=never")
  );

  console.debug({ branch_name, git_log_line_list });

  // create temporary branch

  for (const line of git_log_line_list) {
    const sha = match_group(line, RE.sha_line_start, "sha");
    console.debug({ sha, line });
  }
}

const RE = {
  sha_line_start: /^(?<sha>[a-z0-9]+)\s/i,
};

function match_group(value: string, re: RegExp, group: string) {
  const match = value.match(re);
  const debug = `["${value}".match(${re})]`;
  invariant(match?.groups, `match.groups must exist ${debug}`);
  const result = match?.groups[group];
  invariant(result, `match.groups must contain [${group}] ${debug}`);
  return result;
}

function invariant(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function lines(value: string) {
  return value.split("\n");
}

async function cli(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    child.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(new Error(stderr));
      } else {
        let output = stdout.trimEnd();
        resolve(output);
      }
    });
  });
}
