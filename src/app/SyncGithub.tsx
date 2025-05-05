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

  // immediately register abort_handler in case of ctrl+c exit
  actions.register_abort_handler(async function abort_sync_github() {
    actions.output(<Ink.Text color={colors.red}>🚨 Abort</Ink.Text>);
    handle_exit();
    return 17;
  });

  let DEFAULT_PR_BODY = "";
  if (state.pr_template_body) {
    DEFAULT_PR_BODY = state.pr_template_body;
  }

  const push_group_list = get_push_group_list();

  // for all push targets in push_group_list
  // things that can be done in parallel are grouped by numbers
  //
  // -----------------------------------
  // 1 (before_push) temp mark draft
  // --------------------------------------
  // 2 push simultaneously to github
  // --------------------------------------
  // 2 create PR / edit PR
  // 2 (after_push) undo temp mark draft
  // --------------------------------------

  try {
    const before_push_tasks = [];
    for (const group of push_group_list) {
      before_push_tasks.push(before_push({ group }));
    }

    await Promise.all(before_push_tasks);

    const git_push_command = [`git push -f origin`];

    if (argv.verify === false) {
      git_push_command.push("--no-verify");
    }

    for (const group of push_group_list) {
      const last_commit = last(group.commits);
      invariant(last_commit, "last_commit must exist");

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
      git_push_command.push(target);
    }

    await cli(git_push_command);

    const pr_url_list = commit_range.group_list.map(get_group_url);

    const after_push_tasks = [];
    for (const group of push_group_list) {
      after_push_tasks.push(after_push({ group, pr_url_list }));
    }

    await Promise.all(after_push_tasks);

    // finally, ensure all prs have the updated stack table from updated pr_url_list
    // this step must come after the after_push since that step may create new PRs
    // we need the urls for all prs at this step so we run it after the after_push
    const update_pr_body_tasks = [];
    for (let i = 0; i < commit_range.group_list.length; i++) {
      const group = commit_range.group_list[i];

      // use the updated pr_url_list to get the actual selected_url
      const selected_url = pr_url_list[i];

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

    actions.exit(18);
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

      push_group_list.unshift(group);
    }

    return push_group_list;
  }

  async function before_push(args: { group: CommitMetadataGroup }) {
    const { group } = args;

    invariant(group.base, "group.base must exist");

    // we may temporarily mark PR as a draft before editing it
    // if it is not already a draft PR, to avoid notification spam
    let is_temp_draft = !group.pr?.isDraft;

    // before pushing reset base to master temporarily
    // avoid accidentally pointing to orphaned parent commit
    // should hopefully fix issues where a PR includes a bunch of commits after pushing
    if (group.pr) {
      if (!group.pr.isDraft) {
        is_temp_draft = true;
      }

      if (is_temp_draft) {
        await github.pr_draft({
          branch: group.id,
          draft: true,
        });
      }

      await github.pr_edit({
        branch: group.id,
        base: master_branch,
      });
    }
  }

  async function after_push(args: { group: CommitMetadataGroup; pr_url_list: Array<string> }) {
    const { group, pr_url_list } = args;

    invariant(group.base, "group.base must exist");

    const selected_url = get_group_url(group);

    if (group.pr) {
      // ensure base matches pr in github
      await github.pr_edit({
        branch: group.id,
        base: group.base,
        body: StackSummaryTable.write({
          body: group.pr.body,
          pr_url_list,
          selected_url,
        }),
      });

      // we may temporarily mark PR as a draft before editing it
      // if it is not already a draft PR, to avoid notification spam
      let is_temp_draft = !group.pr?.isDraft;

      if (is_temp_draft) {
        // mark pr as ready for review again
        await github.pr_draft({
          branch: group.id,
          draft: false,
        });
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

      // update pr_url_list with created pr_url
      for (let i = 0; i < pr_url_list.length; i++) {
        const url = pr_url_list[i];
        if (url === selected_url) {
          pr_url_list[i] = pr_url;
        }
      }
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

    if (update_body === body) {
      actions.debug(`Skipping body update for ${selected_url}`);
    } else {
      actions.debug(`Update body for ${selected_url}`);

      await github.pr_edit({
        branch: group.id,
        base: group.base,
        body: update_body,
      });
    }
  }

  function handle_exit() {
    actions.output(<Ink.Text color={colors.yellow}>Restoring PR state…</Ink.Text>);

    for (const group of push_group_list) {
      // we may temporarily mark PR as a draft before editing it
      // if it is not already a draft PR, to avoid notification spam
      let is_temp_draft = !group.pr?.isDraft;

      // restore PR to non-draft state
      if (is_temp_draft) {
        github
          .pr_draft({
            branch: group.id,
            draft: false,
          })
          .catch(actions.error);
      }
    }

    actions.output(<Ink.Text color={colors.yellow}>Restored PR state.</Ink.Text>);
  }
}

type CommitMetadataGroup = CommitMetadata.CommitRange["group_list"][number];
const get_group_url = (group: CommitMetadataGroup) => group.pr?.url || group.id;
