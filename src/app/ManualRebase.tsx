import * as React from "react";

import * as Ink from "ink";
import { v4 as uuid_v4 } from "uuid";

import * as CommitMetadata from "../core/CommitMetadata.js";
import * as Metadata from "../core/Metadata.js";
import { cli } from "../core/cli.js";
import * as github from "../core/github.js";
import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { Brackets } from "./Brackets.js";
import { Store } from "./Store.js";

export function ManualRebase() {
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
  const argv = state.argv;
  const branch_name = state.branch_name;
  const merge_base = state.merge_base;
  const commit_map = state.commit_map;

  invariant(argv, "argv must exist");
  invariant(branch_name, "branch_name must exist");
  invariant(merge_base, "merge_base must exist");
  invariant(commit_map, "commit_map must exist");

  // always listen for SIGINT event and restore git state
  process.once("SIGINT", restore_git);

  const temp_branch_name = `${branch_name}_${uuid_v4()}`;

  let commit_range: Awaited<ReturnType<typeof CommitMetadata.range>>;

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
      const last_group = commit_range.group_list[i - 1];
      const last_commit = last_group.commits[last_group.commits.length - 1];
      rebase_merge_base = last_commit.sha;
      rebase_group_index = i;
    }

    break;
  }

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

      // push to origin since github requires commit shas to line up perfectly
      await cli(`git push -f origin HEAD:${group.id}`);

      if (group.pr) {
        // ensure base matches pr in github
        await github.pr_base(group.id, group.base);
      } else {
        // delete local group branch if leftover
        await cli(`git branch -D ${group.id}`, { ignoreExitCode: true });

        // move to temporary branch for creating pr
        await cli(`git checkout -b ${group.id}`);

        // create pr in github
        await github.pr_create(group.id, group.base);

        // move back to temp branch
        await cli(`git checkout ${temp_branch_name}`);
      }
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the newly created temporary branch
    // now we are in locally in sync with github and on the original branch
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);
  } catch (err) {
    actions.output(<Ink.Text color="red">Error during rebase.</Ink.Text>);

    if (argv.debug) {
      if (err instanceof Error) {
        actions.output(<Ink.Text color="red">{err.message}</Ink.Text>);
      }
    }
  } finally {
    restore_git();
  }

  // cleanup git operations if cancelled during manual rebase
  function restore_git() {
    actions.output(
      <Ink.Text color="yellow">
        Restoring original branch <Brackets>{branch_name}</Brackets>...
      </Ink.Text>
    );

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

    actions.output(
      <Ink.Text color="yellow">
        Restored <Brackets>{branch_name}</Brackets>.
      </Ink.Text>
    );

    actions.exit(5);
  }
}
