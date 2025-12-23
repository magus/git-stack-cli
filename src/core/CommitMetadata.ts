import { Store } from "~/app/Store";
import * as git from "~/core/git";
import * as github from "~/core/github";

export type CommitRange = Awaited<ReturnType<typeof range>>;

type GithubPRStatus = ReturnType<typeof github.pr_status>;
type PullRequest = NonNullable<Awaited<GithubPRStatus>>;

type CommitGroup = {
  id: string;
  title: string;
  pr: null | PullRequest;
  base: null | string;
  dirty: boolean;
  commits: Array<git.Commit>;
  master_base: boolean;
};

type CommitRangeGroup = {
  id: string;
  title: string;
  master_base: boolean;
};

type CommitGroupMap = { [sha: string]: CommitRangeGroup };

export async function range(commit_group_map?: CommitGroupMap) {
  // gather all open prs in repo first
  // cheaper query to populate cache
  await github.pr_list();

  const master_branch = Store.getState().master_branch;
  const master_branch_name = master_branch.replace(/^origin\//, "");
  const commit_list = await git.get_commits(`${master_branch}..HEAD`);

  const pr_lookup: Record<string, void | PullRequest> = {};

  let invalid = false;
  let last_group_id: null | string = null;

  const group_map = new Map<string, CommitGroup>();

  for (const commit of commit_list) {
    let id = commit.branch_id;
    let title = commit.title || id;
    let master_base = commit.master_base;

    // console.debug({ commit, id });

    // use commit map if provided (via select commit ranges)
    if (commit_group_map) {
      const group = commit_group_map[commit.sha];

      if (group) {
        id = group.id;
        title = group.title;
        master_base = group.master_base;
      }
    }

    if (!id) {
      // console.debug("INVALID", "MISSING ID");
      invalid = true;
    }

    if (id) {
      if (group_map.has(id) && last_group_id !== id) {
        // if we've seen this id before and it's not
        // the last added key then we are out of order
        // console.debug("INVALID", "OUT OF ORDER");
        invalid = true;
      }
    } else {
      // console.debug("INVALID", "NEW COMMIT");
      invalid = true;
      id = UNASSIGNED;
    }

    if (!title) {
      title = id;
    }

    const group = group_map.get(id) || {
      id,
      title,
      master_base,
      pr: null,
      base: null,
      dirty: false,
      commits: [],
    };

    group.commits.push(commit);
    group_map.set(id, group);
    last_group_id = id;
  }

  // check each group for dirty state and base
  const group_value_list = Array.from(group_map.values());

  const group_list = [];
  let unassigned_group;

  // collect github pr status in parallel
  const pr_status_promise_list: Record<string, GithubPRStatus> = {};
  for (const group of group_value_list) {
    if (group.id !== UNASSIGNED) {
      pr_status_promise_list[group.id] = github.pr_status(group.id);
    }
  }

  await Promise.all(Array.from(Object.values(pr_status_promise_list)));

  for (const [group_id, pr_status_promise] of Object.entries(pr_status_promise_list)) {
    const pr_status = await pr_status_promise;
    if (pr_status) {
      pr_lookup[group_id] = pr_status;
    }
  }

  for (let i = 0; i < group_value_list.length; i++) {
    const group = group_value_list[i];

    if (group.id !== UNASSIGNED) {
      let pr_result = pr_lookup[group.id];

      if (pr_result && pr_result.state !== "CLOSED") {
        group.pr = pr_result;
      }
    }

    // console.debug("group", group.pr?.title.substring(0, 40));
    // console.debug("  ", "id", group.id);

    if (group.id === UNASSIGNED) {
      unassigned_group = group;
    } else {
      group_list.push(group);
    }

    if (i === 0) {
      group.base = master_branch_name;
    } else {
      const last_group = group_value_list[i - 1];
      // console.debug("  ", "last_group", last_group.pr?.title.substring(0, 40));
      // console.debug("  ", "last_group.id", last_group.id);

      if (group.master_base) {
        // explicitly set base to master when master_base is true
        group.base = master_branch_name;
      } else if (group.id === UNASSIGNED) {
        // null out base when unassigned and after unassigned
        group.base = null;
      } else if (last_group.base === null) {
        // null out base when last group base is null
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

  // reverse group_list to match git log
  group_list.reverse();

  // insert unassigned group at front
  if (unassigned_group) {
    group_list.unshift(unassigned_group);
  }

  return { invalid, group_list, commit_list, pr_lookup, UNASSIGNED };
}

export const UNASSIGNED = "unassigned";
