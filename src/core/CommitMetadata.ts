/* eslint-disable no-console */

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
  const DEBUG = process.env.DEV && false;

  const state = Store.getState();
  const actions = state.actions;
  const master_branch = state.master_branch;
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
    const last_group: undefined | CommitGroup = group_value_list[i - 1];

    // actions.json({ group });
    actions.debug(`title=${group.title}`);
    actions.debug(`  id=${group.id}`);
    actions.debug(`  master_base=${group.master_base}`);

    // special case
    // boundary between normal commits and master commits
    const MASTER_BASE_BOUNDARY = !group.master_base && last_group && last_group.master_base;

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
      // console.debug("  ", "last_group", last_group.pr?.title.substring(0, 40));
      // console.debug("  ", "last_group.id", last_group.id);

      if (group.master_base) {
        // explicitly set base to master when master_base is true
        group.base = master_branch_name;
      } else if (group.id === UNASSIGNED) {
        // null out base when unassigned and after unassigned
        group.base = null;
      } else if (MASTER_BASE_BOUNDARY) {
        // ensure we set its base to `master`
        actions.debug(`  MASTER_BASE_BOUNDARY set group.base = ${master_branch_name}`);
        group.base = master_branch_name;
      } else if (last_group.base === null) {
        // null out base when last group base is null
        group.base = null;
      } else {
        group.base = last_group.id;
      }
    }

    actions.debug(`  base=${group.base}`);


    if (!group.pr) {
      group.dirty = true;
    } else {
      if (group.pr.baseRefName !== group.base) {
        actions.debug("PR_BASEREF_MISMATCH");
        group.dirty = true;
      } else if (group.master_base) {
        actions.debug("MASTER_BASE_DIFF_COMPARE");

        // special case
        // master_base groups cannot be compared by commit sha
        // instead compare the literal diff local against origin
        // gh pr diff --color=never 110
        // git --no-pager diff --color=never 00c8fe0~1..00c8fe0
        let diff_github = await github.pr_diff(group.pr.number);
        diff_github = normalize_diff(diff_github);

        let diff_local = await git.get_diff(group.commits);
        diff_local = normalize_diff(diff_local);

        // find the first differing character index
        let compare_length = Math.max(diff_github.length, diff_local.length);
        let diff_index = -1;
        for (let c_i = 0; c_i < compare_length; c_i++) {
          if (diff_github[c_i] !== diff_local[c_i]) {
            diff_index = c_i;
            break;
          }
        }
        if (diff_index > -1) {
          group.dirty = true;

          if (DEBUG) {
            // print preview at diff_index for both strings
            const preview_radius = 30;
            const start_index = Math.max(0, diff_index - preview_radius);
            const end_index = Math.min(compare_length, diff_index + preview_radius);

            diff_github = diff_github.substring(start_index, end_index);
            diff_github = JSON.stringify(diff_github).slice(1, -1);

            diff_local = diff_local.substring(start_index, end_index);
            diff_local = JSON.stringify(diff_local).slice(1, -1);

            let pointer_indent = " ".repeat(diff_index - start_index + 1);
            actions.debug(`⚠️ git diff mismatch`);
            actions.debug(`              ${pointer_indent}⌄`);
            actions.debug(`diff_github  …${diff_github}…`);
            actions.debug(`diff_local   …${diff_local}…`);
            actions.debug(`              ${pointer_indent}⌃`);
          }
        }
      } else if (MASTER_BASE_BOUNDARY) {
        // special case
        // boundary between normal commits and master commits

        // collect all previous groups for sha comparison
        const all_commits: Array<git.Commit> = [];
        const previous_groups = group_value_list.slice(0, i);
        for (const g of previous_groups) {
          for (const c of g.commits) {
            all_commits.push(c);
          }
        }
        for (const c of group.commits) {
          all_commits.push(c);
        }

        // compare all commits against pr commits
        if (group.pr.commits.length !== all_commits.length) {
          actions.debug("BOUNDARY_COMMIT_LENGTH_MISMATCH");
          group.dirty = true;
        } else {
          actions.debug("BOUNDARY_COMMIT_SHA_COMPARISON");
          for (let i = 0; i < group.pr.commits.length; i++) {
            const pr_commit = group.pr.commits[i];
            const local_commit = all_commits[i];

            if (pr_commit.oid !== local_commit.sha) {
              group.dirty = true;
            }
          }
        }
      } else if (group.pr.commits.length !== group.commits.length) {
        actions.debug("COMMIT_LENGTH_MISMATCH");
        group.dirty = true;
      } else {
        actions.debug("COMMIT_SHA_COMPARISON");
        // if we still haven't marked this dirty, check each commit
        // comapre literal commit shas in group
        for (let i = 0; i < group.pr.commits.length; i++) {
          const pr_commit = group.pr.commits[i];
          const local_commit = group.commits[i];

          if (pr_commit.oid !== local_commit.sha) {
            actions.json({ pr_commit, local_commit });
            group.dirty = true;
          }
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

function normalize_diff(diff_text: string) {
  diff_text = diff_text.replace(RE.diff_index_line, "");
  diff_text = diff_text.replace(RE.diff_section_header, "");
  return diff_text;
}

const RE = {
  // index 8b7c5f7b37688..84124e0a677ca 100644
  // https://regex101.com/r/YBwF6P/1
  diff_index_line: /^index [0-9a-f]+\.\.[0-9a-f]+.*?\n/gm,
  // @@ -29,6 +29,7 @@ from caas_cli import cli as caas_cli  # type: ignore
  // https://regex101.com/r/ohMeDC/1
  diff_section_header: /^@@ .*? @@(?: .*)?\n/gm,
};
