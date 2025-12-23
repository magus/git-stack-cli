import * as React from "react";

import * as Ink from "ink-cjs";
import last from "lodash/last";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import * as StackSummaryTable from "~/core/StackSummaryTable";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as github from "~/core/github";
import { invariant } from "~/core/invariant";

import type * as CommitMetadata from "~/core/CommitMetadata";

export function SyncGithub() {
  return <Await fallback={<Ink.Text color={colors.yellow}>Syncing…</Ink.Text>} function={run} />;
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const argv = state.argv;
  const branch_name = state.branch_name;
  const commit_map = state.commit_map;
  const master_branch = state.master_branch;
  const repo_root = state.repo_root;
  const sync_github = state.sync_github;

  invariant(branch_name, "branch_name must exist");
  invariant(commit_map, "commit_map must exist");
  invariant(repo_root, "repo_root must exist");
  invariant(sync_github, "sync_github must exist");

  const commit_range = sync_github.commit_range;
  const rebase_group_index = sync_github.rebase_group_index;

  let DEFAULT_PR_BODY = "";
  if (state.pr_template_body) {
    DEFAULT_PR_BODY = state.pr_template_body;
  }

  const push_group_list = get_push_group_list();

  // console.debug({ push_group_list });
  // throw new Error("STOP");

  // for all push targets in push_group_list
  // things that can be done in parallel are grouped by numbers
  //
  // --------------------------------------
  // 1 push simultaneously to github
  // --------------------------------------
  // 2 create PR / edit PR
  // --------------------------------------

  function create_git_push_command(base: string, target: string) {
    const command = [`${base} push -f origin`];

    if (argv.verify === false) {
      command.push("--no-verify");
    }

    command.push(target);
    return command;
  }

  try {
    const before_push_tasks = [];
    for (const group of push_group_list) {
      before_push_tasks.push(before_push({ group }));
    }

    await Promise.all(before_push_tasks);

    const git_push_target_list: Array<string> = [];

    for (let i = 0; i < push_group_list.length; i++) {
      const group = push_group_list[i];
      const last_commit = last(group.commits);
      invariant(last_commit, "last_commit must exist");

      // push group in isolation if master_base is set
      // for the first group (i > 0) we can skip this
      // since it'll be based off master anyway
      if (group.master_base && i > 0) {
        await push_master_group(group);
        continue;
      }

      // explicit refs/heads head branch to avoid push failing
      //
      //   ❯ git push -f origin --no-verify f6e249051b4820a03deb957ddebc19acfd7dfd7c:gs-ED2etrzv2
      //   error: The destination you provided is not a full refname (i.e.,
      //   starting with "refs/"). We tried to guess what you meant by:
      //
      //   - Looking for a ref that matches 'gs-ED2etrzv2' on the remote side.
      //   - Checking if the <src> being pushed ('f6e249051b4820a03deb957ddebc19acfd7dfd7c')
      //     is a ref in "refs/{heads,tags}/". If so we add a corresponding
      //     refs/{heads,tags}/ prefix on the remote side.
      //
      //   Neither worked, so we gave up. You must fully qualify the ref.
      //   hint: The <src> part of the refspec is a commit object.
      //   hint: Did you mean to create a new branch by pushing to
      //   hint: 'f6e249051b4820a03deb957ddebc19acfd7dfd7c:refs/heads/gs-ED2etrzv2'?
      //   error: failed to push some refs to 'github.com:magus/git-multi-diff-playground.git'
      //
      const target = `${last_commit.sha}:refs/heads/${group.id}`;
      git_push_target_list.push(target);
    }

    if (git_push_target_list.length > 0) {
      const push_target = git_push_target_list.join(" ");
      const git_push_command = create_git_push_command("git", push_target);
      await cli(git_push_command);
    }

    const pr_url_by_group_id: Record<string, string> = {};

    const after_push_tasks = [];
    for (const group of push_group_list) {
      after_push_tasks.push(after_push({ group, pr_url_by_group_id }));
    }

    await Promise.all(after_push_tasks);

    // finally, ensure all prs have the updated stack table from updated pr_url_by_group_id
    // this step must come after the after_push since that step may create new PRs
    // we need the urls for all prs at this step so we run it after the after_push
    const all_pr_groups: Array<CommitMetadataGroup> = [];
    // collect all groups and existing pr urls
    for (const group of commit_range.group_list) {
      if (group.id !== commit_range.UNASSIGNED) {
        // collect all groups
        all_pr_groups.push(group);

        if (group.pr) {
          pr_url_by_group_id[group.id] = group.pr.url;
        }
      }
    }

    // get pr url list for all pr groups
    const pr_url_list = all_pr_groups.map((g) => pr_url_by_group_id[g.id]);

    // update PR body for all pr groups (not just push_group_list)
    const update_pr_body_tasks = [];
    for (let i = 0; i < all_pr_groups.length; i++) {
      const group = all_pr_groups[i];

      const selected_url = pr_url_by_group_id[group.id];

      const task = update_pr_body({ group, selected_url, pr_url_list });
      update_pr_body_tasks.push(task);
    }

    await Promise.all(update_pr_body_tasks);

    actions.unregister_abort_handler();

    actions.set((state) => {
      state.step = "post-rebase-status";
    });
  } catch (err) {
    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.error("Unable to sync.");
    if (!argv.verbose) {
      actions.error("Try again with `--verbose` to see more information.");
    }

    actions.exit(15);
  }

  function get_push_group_list() {
    // start from HEAD and work backward to rebase_group_index
    const push_group_list = [];

    for (let i = 0; i < commit_range.group_list.length; i++) {
      const index = commit_range.group_list.length - 1 - i;

      // do not go past rebase_group_index
      if (index < rebase_group_index) {
        break;
      }

      const group = commit_range.group_list[index];

      if (group.id !== commit_range.UNASSIGNED) {
        push_group_list.unshift(group);
      }
    }

    return push_group_list;
  }

  async function before_push(args: { group: CommitMetadataGroup }) {
    const { group } = args;

    invariant(group.base, "group.base must exist");

    // before pushing reset base to master temporarily
    // avoid accidentally pointing to orphaned parent commit
    // should hopefully fix issues where a PR includes a bunch of commits after pushing
    if (group.pr) {
      // only update base if it is different
      // github api started returning errors here on 2025-12-08
      //
      // ```
      // [2025-12-08 17:54:44.114] [start] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master
      // [2025-12-08 17:54:45.935] [end] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // [2025-12-08 17:54:45.937] GraphQL: A pull request already exists for base branch 'master' and head branch 'noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu' (updatePullRequest)
      //
      // [2025-12-08 17:54:45.938] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // GraphQL: A pull request already exists for base branch 'master' and head branch 'noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu' (updatePullRequest)
      // gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // Unable to sync.
      // ```
      //
      if (!is_master_base(group)) {
        await github.pr_edit({
          branch: group.id,
          base: master_branch,
        });
      }
    }
  }

  async function after_push(args: {
    group: CommitMetadataGroup;
    pr_url_by_group_id: Record<string, string>;
  }) {
    const { group } = args;

    invariant(group.base, "group.base must exist");

    if (group.pr) {
      if (!is_master_base(group)) {
        // ensure base matches pr in github
        await github.pr_edit({ branch: group.id, base: group.base });
      } else {
        await github.pr_edit({ branch: group.id });
      }
    } else {
      // create pr in github
      const pr_url = await github.pr_create({
        branch: group.id,
        base: group.base,
        title: group.title,
        body: DEFAULT_PR_BODY,
        draft: argv.draft,
      });

      if (!pr_url) {
        throw new Error("unable to create pr");
      }

      // update pr_url_by_group_id with created pr_url
      args.pr_url_by_group_id[group.id] = pr_url;
    }
  }

  async function update_pr_body(args: {
    group: CommitMetadataGroup;
    selected_url: string;
    pr_url_list: Array<string>;
  }) {
    const { group, selected_url, pr_url_list } = args;

    invariant(group.base, "group.base must exist");

    const body = group.pr?.body || DEFAULT_PR_BODY;

    const update_body = StackSummaryTable.write({
      body,
      pr_url_list,
      selected_url,
    });

    const debug_meta = `${group.id} ${selected_url}`;

    if (update_body === body) {
      actions.debug(`Skipping body update ${debug_meta}`);
    } else {
      actions.debug(`Update body ${debug_meta}`);

      await github.pr_edit({
        branch: group.id,
        base: group.base,
        body: update_body,
      });
    }
  }

  function is_master_base(group: CommitMetadataGroup) {
    if (!group.pr) {
      return false;
    }

    return group.master_base || `origin/${group.pr.baseRefName}` === master_branch;
  }

  async function push_master_group(group: CommitMetadataGroup) {
    const worktree_path = `.git/git-stack-worktrees/push_master_group`;

    // ensure previous instance of worktree is removed
    await cli(`git worktree remove --force ${worktree_path}`, { ignoreExitCode: true });

    // create temp worktree at master (or group.base if you prefer)
    await cli(`git worktree add -f ${worktree_path} ${master_branch}`);

    try {
      // cherry-pick the group commits onto that base
      const cp_commit_list = group.commits.map((c) => c.sha);
      await cli(`git -C ${worktree_path} cherry-pick ${cp_commit_list}`);

      `git -C ${worktree_path} push -f origin HEAD:refs/heads/${group.id}`;

      const push_target = `HEAD:refs/heads/${group.id}`;
      const git_push_command = create_git_push_command(`git -C ${worktree_path}`, push_target);

      await cli(git_push_command);
    } finally {
      // clean up even if push fails
      await cli(`git worktree remove --force ${worktree_path}`);
    }
  }
}

type CommitMetadataGroup = CommitMetadata.CommitRange["group_list"][number];
