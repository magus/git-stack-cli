import * as React from "react";

import fs from "node:fs";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { short_id } from "~/core/short_id";

export function LocalMergeRebase() {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Rebasing commits...</Ink.Text>}
      function={run}
    />
  );
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const branch_name = state.branch_name;
  const commit_range = state.commit_range;
  const master_branch = state.master_branch;
  const cwd = state.cwd;
  const repo_root = state.repo_root;

  invariant(branch_name, "branch_name must exist");
  invariant(commit_range, "commit_range must exist");
  invariant(repo_root, "repo_root must exist");

  // always listen for SIGINT event and restore git state
  process.once("SIGINT", handle_exit);

  const temp_branch_name = `${branch_name}_${short_id()}`;

  try {
    actions.debug(`commit_range=${JSON.stringify(commit_range, null, 2)}`);

    // must perform rebase from repo root for applying git patch
    process.chdir(repo_root);
    await cli(`pwd`);

    // update local master to match remote
    await cli(
      `git fetch --no-tags -v origin ${master_branch}:${master_branch}`
    );

    const master_sha = (await cli(`git rev-parse ${master_branch}`)).stdout;
    const rebase_merge_base = master_sha;

    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${rebase_merge_base}`);

    const picked_commit_list = [];

    for (let i = 0; i < commit_range.commit_list.length; i++) {
      const commit = commit_range.commit_list[i];
      const commit_pr = commit_range.pr_lookup[commit.branch_id || ""];

      // drop commits that are in groups of merged PRs
      const merged_pr = commit_pr?.state === "MERGED";

      if (merged_pr) {
        if (actions.isDebug()) {
          actions.output(
            <FormatText
              wrapper={<Ink.Text color={colors.yellow} wrap="truncate-end" />}
              message="Dropping {commit_message} {pr_status}"
              values={{
                commit_message: <Brackets>{commit.subject_line}</Brackets>,
                pr_status: <Parens>MERGED</Parens>,
              }}
            />
          );
        }

        continue;
      }

      if (actions.isDebug()) {
        actions.output(
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} wrap="truncate-end" />}
            message="Picking {commit_message}"
            values={{
              commit_message: <Brackets>{commit.subject_line}</Brackets>,
            }}
          />
        );
      }

      picked_commit_list.push(commit);
    }

    if (picked_commit_list.length > 0) {
      const first_commit = picked_commit_list.at(0);
      const last_commit = picked_commit_list.at(-1);

      invariant(first_commit, "first_commit must exist");
      invariant(last_commit, "last_commit must exist");

      // ensure clean base to avoid conflicts when applying patch
      await cli(`git clean -fd`);

      await cli(`git cherry-pick "${first_commit.sha}^..${last_commit.sha}"`);
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the newly created temporary branch
    // now we are locally in sync with github and on the original branch
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
        Restoring <Brackets>{branch_name}</Brackets>...
      </Ink.Text>
    );

    restore_git();

    actions.output(
      <Ink.Text color={colors.yellow}>
        Restored <Brackets>{branch_name}</Brackets>.
      </Ink.Text>
    );

    actions.exit(6);
  }
}

const PATCH_FILE = "git-stack-cli-patch.patch";
