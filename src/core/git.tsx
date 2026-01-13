import * as React from "react";

import path from "node:path";
import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";
import * as Metadata from "~/core/Metadata";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { safe_exists } from "~/core/safe_exists";

type CommitList = Awaited<ReturnType<typeof get_commits>>;

export type Commit = CommitList[0];

export async function get_commits(dot_range: string) {
  const log_result = await cli(`git log ${dot_range} --format=${FORMAT} --color=never`);

  if (!log_result.stdout) {
    return [];
  }

  const commit_list = [];

  for (let record of log_result.stdout.split(SEP.record)) {
    record = record.replace(/^\n/, "");
    record = record.replace(/\n$/, "");

    if (!record) continue;

    const [sha, full_message] = record.split(SEP.field);

    // ensure sha is a hex string, otherwise we should throw an error
    if (!RE.git_sha.test(sha)) {
      const actions = Store.getState().actions;
      const sep_values = JSON.stringify(Object.values(SEP));
      const message = `unable to parse git commits, maybe commit message contained ${sep_values}`;
      actions.error(message);
      actions.exit(19);
    }

    const metadata = Metadata.read(full_message);
    const branch_id = metadata.id;
    const subject_line = metadata.subject || "";
    const title = metadata.title;
    const master_base = metadata.base === "master";

    const commit = {
      sha,
      full_message,
      subject_line,
      branch_id,
      title,
      master_base,
    };

    commit_list.push(commit);
  }

  commit_list.reverse();

  return commit_list;
}

type WorktreeAddArgs = {
  name?: string;
  commit_list: CommitList;
};

type WorktreeAddResult = {
  worktree_path: string;
  merge_base: string;
};

export async function worktree_add(args: WorktreeAddArgs): Promise<WorktreeAddResult> {
  const state = Store.getState();
  const actions = state.actions;
  const merge_base = state.merge_base;
  invariant(merge_base, "merge_base must exist");
  const repo_path = state.repo_path;
  invariant(repo_path, "repo_path must exist");

  const worktree_name = args.name || "push_master_group";
  const worktree_path = path.join(
    process.env.HOME,
    ".cache",
    "git-stack",
    "worktrees",
    repo_path,
    worktree_name,
  );

  if (!(await safe_exists(worktree_path))) {
    actions.output(
      <Ink.Text color={colors.white}>
        Creating <Ink.Text color={colors.yellow}>{worktree_path}</Ink.Text>
      </Ink.Text>,
    );
    actions.output(
      <Ink.Text color={colors.gray}>(this may take a moment the first time…)</Ink.Text>,
    );
    await cli(`git worktree add -f --detach ${worktree_path} ${merge_base}`);
  }

  // ensure worktree is clean + on the right base before applying commits
  // - abort any in-progress cherry-pick/rebase
  // - drop local changes/untracked files to fresh state
  const quiet_ignore = { quiet: true, ignoreExitCode: true };
  await cli(`git -C ${worktree_path} cherry-pick --abort`, quiet_ignore);
  await cli(`git -C ${worktree_path} rebase --abort`, quiet_ignore);
  await cli(`git -C ${worktree_path} merge --abort`, quiet_ignore);
  await cli(`git -C ${worktree_path} checkout -f --detach ${merge_base}`);
  await cli(`git -C ${worktree_path} clean -fd`);

  // cherry-pick the group commits onto that base
  const cp_commit_list = args.commit_list.map((c) => c.sha).join(" ");
  await cli(`git -C ${worktree_path} cherry-pick ${cp_commit_list}`);

  return { worktree_path, merge_base };
}

export async function diff_commits(commit_list: CommitList) {
  const { worktree_path, merge_base } = await worktree_add({ commit_list });
  const diff_result = await cli(
    `git -C ${worktree_path} --no-pager diff --color=never ${merge_base}`,
    { quiet: true },
  );
  return diff_result.stdout;
}

// Why these separators?
// - Rare in human written text
// - Supported in git %xNN to write bytes
// - Supported in javascript \xNN to write bytes
// - Used historically as separators in unicode
//   https://en.wikipedia.org/wiki/C0_and_C1_control_codes#Field_separators
const SEP = {
  record: "\x1e",
  field: "\x1f",
};

const FORMAT = `%H${SEP.field}%B${SEP.record}`;

const RE = {
  git_sha: /^[0-9a-fA-F]{40}$/,
};
