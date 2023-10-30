import * as Metadata from "./Metadata.js";
import { cli } from "./cli.js";
import * as github from "./github.js";

export type Type = Awaited<ReturnType<typeof commit>>;

export async function all() {
  const log_result = await cli(
    `git log master..HEAD --oneline --format=%H --color=never`
  );

  const sha_list = lines(log_result.stdout).reverse();

  const commit_metadata_list = [];

  for (let i = 0; i < sha_list.length; i++) {
    const sha = sha_list[i];

    let base;
    if (i === 0) {
      base = "master";
    } else {
      base = commit_metadata_list[i - 1].metadata.id;
    }

    const commit_metadata = await commit(sha, base);
    commit_metadata_list.push(commit_metadata);
  }

  return commit_metadata_list;
}

export async function commit(sha: string, base: null | string) {
  const raw_message = (await cli(`git show -s --format=%B ${sha}`)).stdout;
  const metadata = await Metadata.read(raw_message);
  const message = display_message(raw_message);

  let pr = null;
  let pr_dirty = false;

  if (metadata.id) {
    const pr_branch = metadata.id;

    const pr_result = await github.pr_status(pr_branch);

    if (pr_result && pr_result.state === "OPEN") {
      pr = pr_result;

      const last_commit = pr.commits[pr.commits.length - 1];
      pr_dirty = last_commit.oid !== sha;

      if (pr.baseRefName !== base) {
        // requires base update
        pr_dirty = true;
      }
    }
  }

  return {
    sha,
    base,
    message,
    pr,
    pr_dirty,
    metadata,
  };
}

function display_message(message: string) {
  const line_list = lines(message);
  const first_line = line_list[0];

  let result = first_line;

  // remove metadata
  result = result.replace(new RegExp(Metadata.id_regex(), "g"), "");

  result = result.trimEnd();

  return result;
}

function lines(value: string) {
  return value.split("\n");
}
