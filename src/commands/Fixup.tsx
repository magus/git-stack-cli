import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";

export function Fixup() {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Fixing up commits…</Ink.Text>}
      function={run}
    />
  );
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const argv = state.argv;

  const relative_number = argv.commit;

  if (!relative_number) {
    actions.output(
      <Ink.Text color={colors.red}>❗️ Usage: git fixup {"<relative-commit-number>"}</Ink.Text>,
    );
    actions.output("");
    actions.output("This script automates the process of adding staged changes as a fixup commit");
    actions.output(
      "and the subsequent git rebase to flatten the commits based on relative commit number",
    );
    actions.output("You can use a `git log` like below to get the relative commit number");
    actions.output("");
    actions.output("    ❯ git stack log");
    actions.output(
      "    1\te329794d5f881cbf0fc3f26d2108cf6f3fdebabe enable drop_error_subtask test param",
    );
    actions.output(
      "    2\t57f43b596e5c6b97bc47e2a591f82ccc81651156 test drop_error_subtask baseline",
    );
    actions.output("    3\t838e878d483c6a2d5393063fc59baf2407225c6d ErrorSubtask test baseline");
    actions.output("");
    actions.output("To target `838e87` above, you would call `fixup 3`");

    actions.exit(0);
  }

  const diff_staged_cmd = await cli("git diff --cached --quiet", {
    ignoreExitCode: true,
  });

  if (!diff_staged_cmd.code) {
    actions.error("🚨 Stage changes before calling fixup");
    actions.exit(1);
    // actions.output(
    //   <Ink.Text color={colors.red}>
    //     ❗️ Usage: git fixup {"<relative-commit-number>"}
    //   </Ink.Text>
    // );
  }

  // Calculate commit SHA based on the relative commit number
  const adjusted_number = Number(relative_number) - 1;

  // get the commit SHA of the target commit
  const commit_sha = (await cli(`git rev-parse HEAD~${adjusted_number}`)).stdout;

  actions.output(
    <FormatText
      wrapper={<Ink.Text color={colors.yellow} />}
      message="🛠️ fixup {relative_number} {commit_sha}"
      values={{
        commit_sha: <Parens>{commit_sha}</Parens>,
        relative_number: relative_number,
      }}
    />,
  );

  await cli(`git commit --fixup ${commit_sha}`);

  // check if stash required
  let save_stash = false;

  const diff_cmd = await cli("git diff-index --quiet HEAD --", {
    ignoreExitCode: true,
  });

  if (diff_cmd.code) {
    save_stash = true;

    await cli("git stash --include-untracked");

    actions.output(
      <Ink.Text color={colors.yellow}>
        <FormatText message="📦 Changes saved to stash" />
      </Ink.Text>,
    );
  }

  try {
    // rebase target needs to account for new commit created above
    const rebase_target = Number(relative_number) + 1;

    await cli(`git rebase -i --autosquash HEAD~${rebase_target}`, {
      env: {
        ...process.env,
        GIT_EDITOR: "true",
      },
    });
  } catch (error) {
    actions.error("🚨 Fixup failed");
    await cli("git rebase --abort");
    await cli("git reset --soft HEAD~1");
  } finally {
    if (save_stash) {
      await cli("git stash pop");

      actions.output(<Ink.Text color={colors.green}>✅ Changes restored from stash</Ink.Text>);
    }
  }

  actions.exit(0);
}
