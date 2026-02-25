import * as React from "react";

import fs from "node:fs";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Status } from "~/app/Status";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { short_id } from "~/core/short_id";

type Props = {
  onComplete?: () => void;
};

export function Rebase(props: Props) {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Rebasing…</Ink.Text>}
      function={() => Rebase.run(props)}
    />
  );
}

Rebase.run = async function run(props: Props) {
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

  const abort_controller = new AbortController();
  const signal = abort_controller.signal;

  // immediately register abort_handler in case of ctrl+c exit
  actions.register_abort_handler(async function abort_rebase() {
    abort_controller.abort();
    actions.output(<Ink.Text color={colors.red}>🚨 Abort</Ink.Text>);
    handle_exit();
    return 19;
  });

  const master_branch_name = master_branch.replace(/^origin\//, "");
  const temp_branch_name = `${branch_name}_${short_id()}`;

  try {
    // actions.debug(`commit_range=${JSON.stringify(commit_range, null, 2)}`);

    // must perform rebase from repo root for applying git patch
    process.chdir(repo_root);
    await cli(`pwd`);

    // fetch origin master branch for latest sha
    await cli(`git fetch --no-tags -v origin ${master_branch_name}`, { signal });

    if (branch_name === master_branch_name) {
      await rebase_master();
    } else {
      await rebase_branch();
    }

    actions.unregister_abort_handler();
  } catch (err) {
    actions.unregister_abort_handler();
    actions.error("Unable to rebase.");

    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.output(
      <Ink.Box flexDirection="column">
        <Ink.Box height={1} />
        <Ink.Text>⚠️ WARNING</Ink.Text>
        <FormatText
          message="You are in a temporary branch {branch_name} based on {original_branch}"
          values={{
            branch_name: <Brackets>{temp_branch_name}</Brackets>,
            original_branch: <Brackets>{branch_name}</Brackets>,
          }}
        />
        <FormatText
          message="Fix merge conflicts then run {cp_continue} to proceed"
          values={{
            cp_continue: <Command>git cherry-pick --continue</Command>,
          }}
        />
        <FormatText
          message="To go back to the original branch run {checkout_original}"
          values={{
            checkout_original: (
              <Command>git cherry-pick --abort && git checkout -f {branch_name}</Command>
            ),
          }}
        />
      </Ink.Box>,
    );

    actions.exit(8);
  }

  actions.debug("start CommitMetadata.range");
  const next_commit_range = await CommitMetadata.range();
  actions.debug("end CommitMetadata.range");

  actions.output(
    <FormatText
      wrapper={<Ink.Text color={colors.green} />}
      message="✅ {branch_name} in sync with {origin_branch}"
      values={{
        branch_name: <Brackets>{branch_name}</Brackets>,
        origin_branch: <Brackets>{master_branch}</Brackets>,
      }}
    />,
  );

  actions.set((state) => {
    state.commit_range = next_commit_range;
  });

  if (props.onComplete) {
    props.onComplete();
  } else {
    actions.output(<Status />);
    actions.exit(0);
  }

  async function rebase_master() {
    await cli(`git switch -C "${master_branch_name}" "${master_branch}"`, { signal });
  }

  async function rebase_branch() {
    invariant(commit_range, "commit_range must exist");

    const master_sha = (await cli(`git rev-parse ${master_branch}`)).stdout;
    const rebase_merge_base = master_sha;

    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${rebase_merge_base}`, { signal });

    const picked_commit_list = [];

    for (let i = 0; i < commit_range.commit_list.length; i++) {
      const commit = commit_range.commit_list[i];
      const commit_pr = commit_range.pr_lookup[commit.branch_id || ""];

      // drop commits that are in groups of merged PRs
      const merged_pr = commit_pr?.state === "MERGED";
      const commit_message = <Ink.Text color={colors.blue}>{commit.subject_line}</Ink.Text>;

      if (merged_pr) {
        actions.output(
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} wrap="truncate-end" />}
            message="Dropping {pr_status} {commit_message}"
            values={{
              pr_status: <Ink.Text color={colors.purple}>MERGED</Ink.Text>,
              commit_message,
            }}
          />,
        );

        continue;
      }

      actions.output(
        <FormatText
          wrapper={<Ink.Text color={colors.yellow} wrap="truncate-end" />}
          message="Picking {commit_message}"
          values={{
            commit_message,
          }}
        />,
      );

      picked_commit_list.push(commit);
    }

    if (picked_commit_list.length > 0) {
      // ensure clean base to avoid conflicts when applying patch
      await cli(`git clean -fd`, { signal });

      // create list of sha for cherry-pick
      const sha_list = picked_commit_list.map((commit) => commit.sha).join(" ");

      await cli(`git cherry-pick --keep-redundant-commits ${sha_list}`, { signal });
    }

    // after all commits have been cherry-picked move the pointer
    // of original branch to the newly created temporary branch
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`, { signal });

    actions.debug("start restore_git()");
    restore_git();
    actions.debug("end restore_git()");
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
};
