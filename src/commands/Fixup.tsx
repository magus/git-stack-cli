import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { is_finite_value } from "~/core/is_finite_value";

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

  if (!is_finite_value(relative_number)) {
    actions.output(
      <Ink.Box flexDirection="column">
        <Ink.Text color={colors.red}>❗️ Usage: git fixup {"<relative-commit-number>"}</Ink.Text>
        <Ink.Text color={colors.gray}>
          Automates the process of adding staged changes to a previous commit.
        </Ink.Text>
        <FormatText
          wrapper={<Ink.Text color={colors.gray} />}
          message="You can use {git_stack_log} to get the relative commit number."
          values={{ git_stack_log: <Command>git stack log</Command> }}
        />
        <Ink.Box height={1} />
        <FormatText
          message="    {prompt} git stack log"
          values={{ prompt: <Ink.Text color={colors.green}>❯</Ink.Text> }}
        />
        <FormatText
          message="    0 * {sha}  18 hours ago    noah      homebrew-git-stack 2.9.9"
          values={{ sha: <Ink.Text color={colors.green}>e329794</Ink.Text> }}
        />
        <FormatText
          message="    1 * {sha}  18 hours ago    noah      2.9.9"
          values={{ sha: <Ink.Text color={colors.green}>c7e4065</Ink.Text> }}
        />
        <FormatText
          message="    2 * {sha}  18 hours ago    noah      command: --label + github add labels"
          values={{ sha: <Ink.Text color={colors.green}>f82ac73</Ink.Text> }}
        />
        <Ink.Box height={1} />
        <FormatText
          wrapper={<Ink.Text color={colors.gray} />}
          message="To target {sha} above, use {command}"
          values={{
            sha: <Ink.Text color={colors.green}>838e878</Ink.Text>,
            command: <Command>git stack fixup 2</Command>,
          }}
        />
      </Ink.Box>,
    );

    actions.output("");

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

  // get the commit SHA of the target commit
  const commit_sha = (await cli(`git rev-parse HEAD~${relative_number}`)).stdout;

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
    const rebase_target = Number(relative_number) + 2;

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
