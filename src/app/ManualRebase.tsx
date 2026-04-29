import * as React from "react";

import fs from "node:fs";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { GitReviseTodo } from "~/core/GitReviseTodo";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { short_id } from "~/core/short_id";

export function ManualRebase() {
  return (
    <Await fallback={<Ink.Text color={colors.yellow}>Rebasing commits…</Ink.Text>} function={run} />
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

  // immediately register abort_handler in case of ctrl+c exit
  actions.register_abort_handler(async function abort_manual_rebase() {
    actions.output(<Ink.Text color={colors.red}>🚨 Abort</Ink.Text>);
    handle_exit();
    return 15;
  });

  const temp_branch_name = `${branch_name}_${short_id()}`;

  try {
    // get latest merge_base relative to local master
    const merge_base = (await cli(`git merge-base HEAD ${master_branch}`)).stdout;

    // ensure merge_base is updated
    actions.set((state) => {
      state.merge_base = merge_base;
    });

    // immediately paint all commit to preserve selected commit ranges
    let commit_range = await CommitMetadata.range(commit_map);

    // The first revise pass rewrites commits from the merge base upward, so it
    // must walk groups in commit application order rather than stack display
    // order. We intentionally do not apply the master_base-first reshuffle
    // here; that only matters for the follow-up pass that chooses a restart
    // point for dirty groups.
    commit_range.group_list = CommitMetadata.stack_order(commit_range).reverse();

    for (const commit of commit_range.commit_list) {
      const group_from_map = commit_map[commit.sha];
      commit.branch_id = group_from_map.id;
      commit.title = group_from_map.title;
      commit.master_base = group_from_map.master_base;
    }

    // // capture commit_range for GitReviseTodo test
    // // doc-link capture-git-revise-todo
    // console.debug(JSON.stringify(commit_range, null, 2));
    // throw new Error("STOP");

    await GitReviseTodo.execute({
      rebase_group_index: 0,
      rebase_merge_base: merge_base,
      commit_range,
    });

    commit_range = await CommitMetadata.range(commit_map);

    // The second revise pass needs the same execution order that
    // find_first_dirty_group() reasons about. Use the centralized rebase order
    // here so the chosen predecessor sha and restart index are computed against
    // the actual order that the follow-up revise pass will run.
    commit_range.group_list = CommitMetadata.rebase_order(commit_range);

    let rebase_merge_base = merge_base;
    let rebase_group_index = 0;

    const dirty = find_first_dirty_group(commit_range);
    if (dirty) {
      rebase_merge_base = dirty.sha;
      rebase_group_index = dirty.index;
    }

    actions.debug(`rebase_merge_base = ${rebase_merge_base}`);
    actions.debug(`rebase_group_index = ${rebase_group_index}`);

    // actions.debug(`commit_range=${JSON.stringify(commit_range, null, 2)}`);

    // must perform rebase from repo root for applying git patch
    process.chdir(repo_root);
    await cli(`pwd`);

    // create temporary branch
    await cli(`git checkout -b ${temp_branch_name}`);

    await GitReviseTodo.execute({
      rebase_group_index,
      rebase_merge_base,
      commit_range,
    });

    // after all commits have been modified move the pointer
    // of original branch to the newly created temporary branch
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);

    restore_git();

    actions.unregister_abort_handler();

    if (argv.sync) {
      actions.set((state) => {
        state.step = "sync-github";
        state.sync_github = { commit_range };
      });
    } else {
      actions.set((state) => {
        state.step = "post-rebase-status";
      });
    }
  } catch (err) {
    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.error("Unable to rebase.");
    actions.exit(16);
  }

  // cleanup git operations if cancelled during manual rebase
  function restore_git() {
    // signint handler MUST run synchronously
    // trying to use `await cli(...)` here will silently fail since
    // all children processes receive the SIGINT signal
    const spawn_options = { ignoreExitCode: true };

    // always hard reset and clean to allow subsequent checkout
    // if there are files checkout will fail and cascade fail subsequent commands
    cli.sync(`git reset --hard`, spawn_options);
    cli.sync(`git cherry-pick --abort`, spawn_options);
    cli.sync(`git clean -fd`, spawn_options);

    // always put self back in original branch
    cli.sync(`git checkout ${branch_name}`, spawn_options);

    // ...and cleanup temporary branch
    cli.sync(`git branch -D ${temp_branch_name}`, spawn_options);

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
      </Ink.Text>,
    );

    restore_git();

    actions.output(
      <Ink.Text color={colors.yellow}>
        Restored <Brackets>{branch_name}</Brackets>.
      </Ink.Text>,
    );
  }
}

function find_first_dirty_group(commit_range: CommitMetadata.CommitRange) {
  for (let i = 0; i < commit_range.group_list.length; i++) {
    const group = commit_range.group_list[i];

    if (!group.dirty) {
      continue;
    }

    if (i > 0) {
      const prev_group = commit_range.group_list[i - 1];
      const prev_commit = prev_group.commits[prev_group.commits.length - 1];
      const sha = prev_commit.sha;
      const index = i;
      return { sha, index };
    }

    break;
  }

  return null;
}
