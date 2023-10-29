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
  let pr_exists = false;
  let pr_dirty = false;

  if (metadata.id) {
    const pr_branch = metadata.id;

    pr = await github.pr_status(pr_branch);

    if (pr && pr.state === "OPEN") {
      pr_exists = true;

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
    pr_exists,
    pr_dirty,
    metadata,
  };
}

function display_message(message: string) {
  // remove metadata
  let result = message;
  result = result.replace(new RegExp(Metadata.id_regex(), "g"), "");
  result = result.replace(/\n/g, " ");
  result = result.trimEnd();
  return result;
}

function lines(value: string) {
  return value.split("\n");
}
