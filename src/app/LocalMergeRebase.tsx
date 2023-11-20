import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import * as Metadata from "../core/Metadata.js";
import { cli } from "../core/cli.js";
import { invariant } from "../core/invariant.js";
import { short_id } from "../core/short_id.js";

import { Await } from "./Await.js";
import { Brackets } from "./Brackets.js";
import { Store } from "./Store.js";

export function LocalMergeRebase() {
  return (
    <Await
      fallback={<Ink.Text color="yellow">Rebasing commits...</Ink.Text>}
      function={run}
    />
  );
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const branch_name = state.branch_name;

  invariant(branch_name, "branch_name must exist");

  // always listen for SIGINT event and restore git state
  process.once("SIGINT", handle_exit);

  const temp_branch_name = `${branch_name}_${short_id()}`;

  const commit_range = await CommitMetadata.range();

  // reverse commit list so that we can cherry-pick in order
  commit_range.group_list.reverse();

  await cli(`git fetch --no-tags -v origin master:master`);
  const master_sha = (await cli(`git rev-parse master`)).stdout;

  let rebase_merge_base = master_sha;
  let rebase_group_index = 0;

  // TODO find index of first non-MERGED pr group
  for (let i = 0; i < commit_range.group_list.length; i++) {
    const group = commit_range.group_list[i];

    if (!group.dirty) {
      continue;
    }

    if (i > 0) {
      const last_group = commit_range.group_list[i - 1];
      const last_commit = last_group.commits[last_group.commits.length - 1];
      rebase_merge_base = last_commit.sha;
      rebase_group_index = i;
    }

    break;
  }

  actions.json({ rebase_merge_base, rebase_group_index });
  actions.exit(999);
  throw new Error("STOP");

  try {
    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${rebase_merge_base}`);

    for (let i = rebase_group_index; i < commit_range.group_list.length; i++) {
      const group = commit_range.group_list[i];

      invariant(group.base, "group.base must exist");

      // cherry-pick and amend commits one by one
      for (const commit of group.commits) {
        await cli(`git cherry-pick ${commit.sha}`);

        if (commit.branch_id !== group.id) {
          const new_message = await Metadata.write(commit.message, group.id);
          await cli(`git commit --amend -m "${new_message}"`);
        }
      }

      actions.output(
        <Ink.Text color="yellow" wrap="truncate-end">
          Syncing <Brackets>{group.pr?.title || group.id}</Brackets>...
        </Ink.Text>
      );
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
    actions.output(<Ink.Text color="#ef4444">Error during rebase.</Ink.Text>);

    if (err instanceof Error) {
      actions.debug(<Ink.Text color="#ef4444">{err.message}</Ink.Text>);
    }

    handle_exit();
  }

  // cleanup git operations if cancelled during manual rebase
  function restore_git() {
    // signint handler MUST run synchronously
    // trying to use `await cli(...)` here will silently fail since
    // all children processes receive the SIGINT signal
    const spawn_options = { ignoreExitCode: true };

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
  }

  function handle_exit() {
    actions.output(
      <Ink.Text color="yellow">
        Restoring <Brackets>{branch_name}</Brackets>...
      </Ink.Text>
    );

    restore_git();

    actions.output(
      <Ink.Text color="yellow">
        Restored <Brackets>{branch_name}</Brackets>.
      </Ink.Text>
    );

    actions.exit(5);
  }
}
