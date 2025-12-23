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

    // immediately paint all commit to preserve selected commit ranges
    let commit_range = await CommitMetadata.range(commit_map);

    // reverse group list to ensure we create git revise in correct order
    commit_range.group_list.reverse();

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
        state.sync_github = { commit_range, rebase_group_index };
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
    if (!argv.verbose) {
      actions.error("Try again with `--verbose` to see more information.");
    }

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
    cli.sync(`git clean -df`, spawn_options);

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
