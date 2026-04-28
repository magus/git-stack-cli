import * as React from "react";

import * as Ink from "ink-cjs";
import last from "lodash/last";

import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import * as CommitMetadata from "~/core/CommitMetadata";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

type Args = {
  commit_map: Parameters<typeof CommitMetadata.range>[0];
  commit_range: CommitMetadata.CommitRange;
};

type PromptState = {
  commit_sha: string;
  diff: string;
  diff_stat: string;
  group_id: string;
  status: string;
  subject: string;
};

export async function maybe_fixup_pre_push_changes(args: Args) {
  const head_commit = last(args.commit_range.commit_list);
  invariant(head_commit, "head_commit must exist");

  const head_group_id = args.commit_map?.[head_commit.sha]?.id ?? head_commit.branch_id;
  const group = args.commit_range.group_list.find((group) => group.id === head_group_id);

  if (!group || group.id === args.commit_range.UNASSIGNED) {
    throw new Error("Unable to find stack tip group");
  }

  const last_commit = last(group.commits);
  invariant(last_commit, "last_commit must exist");

  const before_status = await get_worktree_status();

  try {
    await cli(`git push -f origin --dry-run HEAD:refs/heads/${group.id}`);
    return null;
  } catch (push_error) {
    const after_status = await get_worktree_status();

    if (before_status || !after_status) {
      throw push_error;
    }

    const git_diff_cmd = "git --no-pager diff --color=never";
    const diff_stat_res = await cli(`${git_diff_cmd} --stat`, { quiet: true });
    const diff_stat = diff_stat_res.stdout;

    let diff = "";
    if (Store.getState().argv.verbose) {
      const diff_res = await cli(git_diff_cmd, { quiet: true });
      diff = diff_res.stdout;
    }

    const should_fixup = await new Promise<boolean>((resolve) => {
      Store.getState().actions.output(
        <Prompt
          state={{
            commit_sha: last_commit.sha,
            diff,
            diff_stat,
            group_id: group.id,
            status: after_status,
            subject: last_commit.subject_line,
          }}
          onAnswer={resolve}
        />,
      );
    });

    if (!should_fixup) {
      throw push_error;
    }

    await fixup_worktree_changes_into_commit(last_commit.sha);
    return CommitMetadata.range(args.commit_map ?? undefined);
  }
}

async function get_worktree_status() {
  return (await cli("git status --porcelain", { quiet: true })).stdout;
}

async function fixup_worktree_changes_into_commit(commit_sha: string) {
  const actions = Store.getState().actions;

  actions.output(
    <FormatText
      wrapper={<Ink.Text color={colors.yellow} />}
      message="Folding pre-push changes into {sha}…"
      values={{
        sha: <Parens>{commit_sha}</Parens>,
      }}
    />,
  );

  await cli("git add -A");
  await cli(`git commit --fixup ${commit_sha}`);

  try {
    await cli(`git rebase -i --autosquash ${commit_sha}^`, {
      env: {
        ...process.env,
        GIT_EDITOR: "true",
      },
    });
  } catch (error) {
    actions.error("Autosquash hit conflicts while folding pre-push changes");
    actions.error("Resolve the conflicts, run `git add …`, then `git rebase --continue`.");
    actions.error("Or run `git rebase --abort` to abandon the fold.");
    throw error;
  }
}

type Props = {
  state: PromptState;
  onAnswer: (answer: boolean) => void;
};

function Prompt(props: Props) {
  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />
      <FormatText
        wrapper={<Ink.Text color={colors.yellow} />}
        message="Pre-push modified files while verifying {group}."
        values={{
          group: <Command>{props.state.group_id}</Command>,
        }}
      />
      <FormatText
        wrapper={<Ink.Text color={colors.gray} />}
        message="{subject} {sha}"
        values={{
          sha: <Parens>{props.state.commit_sha}</Parens>,
          subject: <Ink.Text color={colors.white}>{props.state.subject}</Ink.Text>,
        }}
      />

      <Ink.Box height={1} />
      <Ink.Text color={colors.gray}>git status --short</Ink.Text>
      <Ink.Text>{props.state.status}</Ink.Text>

      {!props.state.diff_stat ? null : (
        <React.Fragment>
          <Ink.Box height={1} />
          <Ink.Text color={colors.gray}>git diff --stat</Ink.Text>
          <Ink.Text>{props.state.diff_stat}</Ink.Text>
        </React.Fragment>
      )}

      {props.state.diff ? (
        <React.Fragment>
          <Ink.Box height={1} />
          <Ink.Text color={colors.gray}>git diff</Ink.Text>
          <Ink.Text>{props.state.diff}</Ink.Text>
        </React.Fragment>
      ) : (
        <Ink.Text color={colors.gray}>Run with --verbose to show the full diff here.</Ink.Text>
      )}

      <YesNoPrompt
        message={
          <FormatText
            wrapper={<Ink.Text color={colors.yellow} />}
            message="Fold these changes into the target commit and retry?"
          />
        }
        onYes={() => props.onAnswer(true)}
        onNo={() => props.onAnswer(false)}
      />
    </Ink.Box>
  );
}
