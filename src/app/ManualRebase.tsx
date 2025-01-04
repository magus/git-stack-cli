import * as React from "react";

import fs from "node:fs";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { GitReviseTodo } from "~/core/GitReviseTodo";
import * as StackSummaryTable from "~/core/StackSummaryTable";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as github from "~/core/github";
import { invariant } from "~/core/invariant";
import { short_id } from "~/core/short_id";

export function ManualRebase() {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Rebasing commits…</Ink.Text>}
      function={run}
    />
  );
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const argv = state.argv;
  const branch_name = state.branch_name;
  const commit_map = state.commit_map;
  const master_branch = state.master_branch;
  const cwd = state.cwd;
  const repo_root = state.repo_root;

  invariant(branch_name, "branch_name must exist");
  invariant(commit_map, "commit_map must exist");
  invariant(repo_root, "repo_root must exist");

  // always listen for SIGINT event and restore git state
  process.once("SIGINT", handle_exit);

  // get latest merge_base relative to local master
  const merge_base = (await cli(`git merge-base HEAD ${master_branch}`)).stdout;

  // immediately paint all commit to preserve selected commit ranges
  let commit_range = await CommitMetadata.range(commit_map);

  // reverse group list to ensure we create git revise in correct order
  commit_range.group_list.reverse();

  for (const commit of commit_range.commit_list) {
    const group_from_map = commit_map[commit.sha];
    commit.branch_id = group_from_map.id;
    commit.title = group_from_map.title;
  }

  await GitReviseTodo.execute({
    rebase_group_index: 0,
    rebase_merge_base: merge_base,
    commit_range,
  });

  let DEFAULT_PR_BODY = "";
  if (state.pr_template_body) {
    DEFAULT_PR_BODY = state.pr_template_body;
  }

  const temp_branch_name = `${branch_name}_${short_id()}`;

  commit_range = await CommitMetadata.range(commit_map);

  // reverse commit list so that we can cherry-pick in order
  commit_range.group_list.reverse();

  let rebase_merge_base = merge_base;
  let rebase_group_index = 0;

  for (let i = 0; i < commit_range.group_list.length; i++) {
    const group = commit_range.group_list[i];

    if (!group.dirty) {
      continue;
    }

    if (i > 0) {
      const prev_group = commit_range.group_list[i - 1];
      const prev_commit = prev_group.commits[prev_group.commits.length - 1];
      rebase_merge_base = prev_commit.sha;
      rebase_group_index = i;
    }

    break;
  }

  actions.debug(`rebase_merge_base = ${rebase_merge_base}`);
  actions.debug(`rebase_group_index = ${rebase_group_index}`);

  // actions.debug(`commit_range=${JSON.stringify(commit_range, null, 2)}`);

  try {
    // must perform rebase from repo root for applying git patch
    process.chdir(repo_root);
    await cli(`pwd`);

    await rebase_git_revise();

    if (argv.sync) {
      await sync_github();
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the newly created temporary branch
    // now we are in locally in sync with github and on the original branch
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);

    restore_git();

    actions.set((state) => {
      state.step = "post-rebase-status";
    });
  } catch (err) {
    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.error("Unable to rebase.");
    if (!argv.verbose) {
      actions.error("Try again with `--verbose` to see more information.");
    }

    handle_exit();
  }

  async function rebase_git_revise() {
    actions.debug(`rebase_git_revise`);

    actions.output(
      <Ink.Text color={colors.yellow} wrap="truncate-end">
        Rebasing…
      </Ink.Text>
    );

    // create temporary branch
    await cli(`git checkout -b ${temp_branch_name}`);

    await GitReviseTodo.execute({
      rebase_group_index,
      rebase_merge_base,
      commit_range,
    });
  }

  async function sync_group_github(args: {
    group: CommitMetadataGroup;
    pr_url_list: Array<string>;
  }) {
    if (!argv.sync) {
      return;
    }

    const { group, pr_url_list } = args;

    invariant(group.base, "group.base must exist");

    actions.output(
      <FormatText
        wrapper={<Ink.Text color={colors.yellow} wrap="truncate-end" />}
        message="Syncing {group}…"
        values={{
          group: (
            <Brackets>{group.pr?.title || group.title || group.id}</Brackets>
          ),
        }}
      />
    );

    // we may temporarily mark PR as a draft before editing it
    // if it is not already a draft PR, to avoid notification spam
    let is_temp_draft = false;

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

    // push to origin since github requires commit shas to line up perfectly
    const git_push_command = [`git push -f origin HEAD:${group.id}`];

    if (argv.verify === false) {
      git_push_command.push("--no-verify");
    }

    await cli(git_push_command);

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

  async function sync_github() {
    // in order to sync we walk from rebase_group_index to HEAD
    // checking out each group and syncing to github

    // start from HEAD and work backward to rebase_group_index
    const push_group_list = [];
    let lookback_index = 0;
    for (let i = 0; i < commit_range.group_list.length; i++) {
      const index = commit_range.group_list.length - 1 - i;

      // do not go past rebase_group_index
      if (index < rebase_group_index) {
        break;
      }

      const group = commit_range.group_list[index];
      // console.debug({ i, index, group });

      if (i > 0) {
        const prev_group = commit_range.group_list[index + 1];
        lookback_index += prev_group.commits.length;
      }

      // console.debug(`git show head~${lookback_index}`);

      // push group and lookback_index onto front of push_group_list
      push_group_list.unshift({ group, lookback_index });
    }

    const pr_url_list = commit_range.group_list.map(get_group_url);

    // use push_group_list to sync each group HEAD to github
    for (const push_group of push_group_list) {
      const { group } = push_group;

      // move to temporary branch for resetting to lookback_index to create PR
      await cli(`git checkout -b ${group.id}`);

      // prepare branch for sync, reset to commit at lookback index
      await cli(`git reset --hard HEAD~${push_group.lookback_index}`);

      await sync_group_github({ group, pr_url_list });

      // done, remove temp push branch and move back to temp branch
      await cli(`git checkout ${temp_branch_name}`);
      await cli(`git branch -D ${group.id}`);
    }

    // finally, ensure all prs have the updated stack table from updated pr_url_list
    for (let i = 0; i < commit_range.group_list.length; i++) {
      const group = commit_range.group_list[i];

      // use the updated pr_url_list to get the actual selected_url
      const selected_url = pr_url_list[i];

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
  }

  // cleanup git operations if cancelled during manual rebase
  function restore_git() {
    // signint handler MUST run synchronously
    // trying to use `await cli(...)` here will silently fail since
    // all children processes receive the SIGINT signal
    const spawn_options = { ignoreExitCode: true };

    // always clean up any patch files
    cli.sync(`rm ${PATCH_FILE}`, spawn_options);

    // always hard reset and clean to allow subsequent checkout
    // if there are files checkout will fail and cascade fail subsequent commands
    cli.sync(`git reset --hard`, spawn_options);
    cli.sync(`git clean -df`, spawn_options);

    // always put self back in original branch
    cli.sync(`git checkout ${branch_name}`, spawn_options);

    // ...and cleanup temporary branch
    cli.sync(`git branch -D ${temp_branch_name}`, spawn_options);

    if (commit_range) {
      // ...and cleanup pr group branches
      for (const group of commit_range.group_list) {
        cli.sync(`git branch -D ${group.id}`, spawn_options);
      }
    }

    // restore back to original dir
    if (fs.existsSync(cwd)) {
      process.chdir(cwd);
    }
    cli.sync(`pwd`, spawn_options);
  }

  function handle_exit() {
    actions.output(
      <Ink.Text color={colors.yellow}>
        Restoring <Brackets>{branch_name}</Brackets>…
      </Ink.Text>
    );

    restore_git();

    actions.output(
      <Ink.Text color={colors.yellow}>
        Restored <Brackets>{branch_name}</Brackets>.
      </Ink.Text>
    );

    actions.exit(5);
  }
}

type CommitMetadataGroup = CommitMetadata.CommitRange["group_list"][number];
const get_group_url = (group: CommitMetadataGroup) => group.pr?.url || group.id;

const PATCH_FILE = "git-stack-cli-patch.patch";
