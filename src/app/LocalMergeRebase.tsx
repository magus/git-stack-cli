import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import * as Metadata from "../core/Metadata.js";
import { cli } from "../core/cli.js";
import { invariant } from "../core/invariant.js";
import { short_id } from "../core/short_id.js";

import { Await } from "./Await.js";
import { Brackets } from "./Brackets.js";
import { FormatText } from "./FormatText.js";
import { Parens } from "./Parens.js";
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
  const commit_range = state.commit_range;

  invariant(branch_name, "branch_name must exist");
  invariant(commit_range, "commit_range must exist");

  // always listen for SIGINT event and restore git state
  process.once("SIGINT", handle_exit);

  const temp_branch_name = `${branch_name}_${short_id()}`;

  try {
    await cli(`git fetch --no-tags -v origin master:master`);
    const master_sha = (await cli(`git rev-parse master`)).stdout;

    const rebase_merge_base = master_sha;

    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${rebase_merge_base}`);

    for (let i = 0; i < commit_range.commit_list.length; i++) {
      const commit = commit_range.commit_list[i];
      const commit_pr = commit_range.pr_map.get(commit.branch_id || "");

      // drop commits that are in groups of merged PRs
      const merged_pr = commit_pr?.state === "MERGED";

      if (merged_pr) {
        if (actions.isDebug()) {
          actions.output(
            <FormatText
              wrapper={<Ink.Text color="yellow" wrap="truncate-end" />}
              message="Dropping {commit_message} {pr_status}"
              values={{
                commit_message: <Brackets>{commit.message}</Brackets>,
                pr_status: <Parens>MERGED</Parens>,
              }}
            />
          );
        }

        continue;
      }

      // cherry-pick and amend commits one by one
      if (actions.isDebug()) {
        actions.output(
          <FormatText
            wrapper={<Ink.Text color="yellow" wrap="truncate-end" />}
            message="Picking {commit_message}"
            values={{
              commit_message: <Brackets>{commit.message}</Brackets>,
            }}
          />
        );
      }
      await cli(`git cherry-pick ${commit.sha}`);
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the newly created temporary branch
    // now we are in locally in sync with github and on the original branch
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);

    restore_git();

    const next_commit_range = await CommitMetadata.range();

    actions.set((state) => {
      state.commit_range = next_commit_range;
      state.step = "status";
    });
  } catch (err) {
    actions.error("Unable to rebase.");

    if (err instanceof Error) {
      if (actions.isDebug()) {
        actions.error(err.message);
      }
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
