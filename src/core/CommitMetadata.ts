import * as Metadata from "./Metadata.js";
import { cli } from "./cli.js";
import * as github from "./github.js";

export type CommitMetadata = Awaited<ReturnType<typeof commit>>;
export type CommitRange = Awaited<ReturnType<typeof range>>;

type PullRequest = NonNullable<CommitMetadata["pr"]>;

type CommitGroup = {
  id: string;
  pr: null | PullRequest;
  base: null | string;
  dirty: boolean;
  commits: Array<CommitMetadata>;
};

export async function range() {
  const commit_list = await get_commit_list();

  let invalid = false;
  const group_map = new Map<string, CommitGroup>();

  for (const commit of commit_list) {
    let id = commit.metadata.id;
    const pr = commit.pr;

    if (!pr) {
      // console.debug("INVALID", "MISSING PR", commit.message);
      invalid = true;
    }

    if (id) {
      const group_key_list = Array.from(group_map.keys());
      const last_key = group_key_list[group_key_list.length - 1];

      if (group_map.has(id) && last_key !== id) {
        // if we've seen this id before and it's not
        // the last added key then we are out of order
        // console.debug("INVALID", "OUT OF ORDER", commit.message, id);
        invalid = true;
      }
    } else {
      // console.debug("INVALID", "NEW COMMIT", { commit });
      invalid = true;

      id = UNASSIGNED;
    }

    const group = group_map.get(id) || {
      id,
      pr,
      base: null,
      dirty: false,
      commits: [],
    };

    group.commits.push(commit);
    group_map.set(id, group);
  }

  // check each group for dirty state and base
  const group_value_list = Array.from(group_map.values());

  for (let i = 0; i < group_value_list.length; i++) {
    const group = group_value_list[i];

    // console.debug("group", group.pr?.title.substring(0, 40));
    // console.debug("  ", "id", group.id);

    if (i === 0) {
      group.base = "master";
    } else {
      const last_group = group_value_list[i - 1];
      // console.debug("  ", "last_group", last_group.pr?.title.substring(0, 40));
      // console.debug("  ", "last_group.id", last_group.id);

      // null out base when unassigned and after unassigned
      if (group.id === UNASSIGNED) {
        group.base = null;
      } else if (last_group.base === null) {
        group.base = null;
      } else {
        group.base = last_group.id;
      }

      // console.debug("  ", "group.base", group.base);
    }

    if (!group.pr) {
      group.dirty = true;
    } else if (group.pr.commits.length !== group.commits.length) {
      group.dirty = true;
    } else if (group.pr.baseRefName !== group.base) {
      group.dirty = true;
    } else {
      for (let i = 0; i < group.pr.commits.length; i++) {
        const pr_commit = group.pr.commits[i];
        const local_commit = group.commits[i];

        if (pr_commit.oid !== local_commit.sha) {
          group.dirty = true;
        }
      }
    }

    // console.debug("  ", "group.dirty", group.dirty);
  }

  return { invalid, group_map, commit_list };
}

async function get_commit_list() {
  const log_result = await cli(
    `git log master..HEAD --oneline --format=%H --color=never`
  );

  const sha_list = lines(log_result.stdout).reverse();

  const commit_metadata_list = [];

  for (let i = 0; i < sha_list.length; i++) {
    const sha = sha_list[i];
    const commit_metadata = await commit(sha);
    commit_metadata_list.push(commit_metadata);
  }

  return commit_metadata_list;
}

export async function commit(sha: string) {
  const raw_message = (await cli(`git show -s --format=%B ${sha}`)).stdout;
  const metadata = await Metadata.read(raw_message);
  const message = display_message(raw_message);

  let pr = null;

  if (metadata.id) {
    const pr_branch = metadata.id;

    const pr_result = await github.pr_status(pr_branch);

    if (pr_result && pr_result.state === "OPEN") {
      pr = pr_result;
    }
  }

  return {
    sha,
    message,
    raw_message,
    pr,
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

const UNASSIGNED = "unassigned";
