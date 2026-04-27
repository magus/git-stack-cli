import * as React from "react";

import * as Ink from "ink-cjs";
import last from "lodash/last";

import { Await } from "~/app/Await";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { Store } from "~/app/Store";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import * as CommitMetadata from "~/core/CommitMetadata";
import * as StackSummaryTable from "~/core/StackSummaryTable";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as git from "~/core/git";
import * as github from "~/core/github";
import { invariant } from "~/core/invariant";
import { sleep } from "~/core/sleep";

export function SyncGithub() {
  const [fold_prompt, set_fold_prompt] = React.useState<null | FoldPromptState>(null);

  const ask_fold = React.useCallback((args: FoldPromptArgs) => {
    return new Promise<boolean>((resolve) => {
      set_fold_prompt({ ...args, resolve });
    });
  }, []);

  const run_sync = React.useCallback(() => run({ ask_fold }), [ask_fold]);

  return (
    <React.Fragment>
      <Await fallback={<Ink.Text color={colors.yellow}>Syncing…</Ink.Text>} function={run_sync} />

      {!fold_prompt ? null : (
        <FoldPrompt
          state={fold_prompt}
          onAnswer={(answer) => {
            fold_prompt.resolve(answer);
            set_fold_prompt(null);
          }}
        />
      )}
    </React.Fragment>
  );
}

async function run(run_args: { ask_fold: AskFold }) {
  const state = Store.getState();
  const actions = state.actions;
  const argv = state.argv;
  const branch_name = state.branch_name;
  const commit_map = state.commit_map;
  const master_branch = state.master_branch;
  const repo_path = state.repo_path;
  const sync_github = state.sync_github;
  const labels = argv.label ?? [];

  invariant(branch_name, "branch_name must exist");
  invariant(commit_map, "commit_map must exist");
  invariant(repo_path, "repo_path must exist");
  invariant(sync_github, "sync_github must exist");

  let commit_range = sync_github.commit_range;

  let DEFAULT_PR_BODY = "";
  if (state.pr_template_body) {
    DEFAULT_PR_BODY = state.pr_template_body;
  }

  let push_group_list = get_push_group_list();

  // for all push targets in push_group_list
  // things that can be done in parallel are grouped by numbers
  //
  // --------------------------------------
  // 1 push simultaneously to github
  // --------------------------------------
  // 2 create PR / edit PR
  // --------------------------------------

  function create_git_push_command(
    base: string,
    target: string,
    options: { dry_run?: boolean; no_verify?: boolean } = {},
  ) {
    const command = [`${base} push -f origin`];

    if (options.dry_run) {
      command.push("--dry-run");
    }

    if (options.no_verify || argv.verify === false) {
      command.push("--no-verify");
    }

    command.push(target);
    return command;
  }

  try {
    await push_groups();

    const pr_url_by_group_id: Record<string, string> = {};

    const after_push_tasks = [];
    for (const group of push_group_list) {
      after_push_tasks.push(after_push({ group, pr_url_by_group_id }));
    }

    await Promise.all(after_push_tasks);

    // finally, ensure all prs have the updated stack table from updated pr_url_by_group_id
    // this step must come after the after_push since that step may create new PRs
    // we need the urls for all prs at this step so we run it after the after_push
    const all_pr_groups: Array<CommitMetadataGroup> = [];
    // collect all groups and existing pr urls
    for (const group of commit_range.group_list) {
      if (group.id !== commit_range.UNASSIGNED) {
        // collect all groups
        all_pr_groups.push(group);

        if (group.pr) {
          pr_url_by_group_id[group.id] = group.pr.url;
        }
      }
    }

    // get pr url list for all pr groups
    const pr_url_list = all_pr_groups.map((g) => pr_url_by_group_id[g.id]);

    // update PR body for all pr groups (not just push_group_list)
    const update_pr_tasks = [];
    for (let i = 0; i < all_pr_groups.length; i++) {
      const group = all_pr_groups[i];

      const selected_url = pr_url_by_group_id[group.id];

      const task = update_pr({ group, selected_url, pr_url_list, labels });
      update_pr_tasks.push(task);
    }

    await Promise.all(update_pr_tasks);

    actions.unregister_abort_handler();

    // invalidate cache for PRs we pushed
    actions.set((state) => {
      for (const group of push_group_list) {
        if (group.pr) {
          delete state.pr[group.pr.headRefName];
          delete state.cache_gh_cli_by_branch[group.pr.headRefName];
        }
      }
    });

    // wait a bit for github to settle after push / edits above
    // we github.pr_list returns outdated information if called too quickly
    await sleep(400);

    // gather all open prs in repo at once
    // cheaper query to populate cache
    await github.pr_list();

    // move to next step
    actions.set((state) => {
      state.step = "post-rebase-status";
    });
  } catch (err) {
    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.error("Unable to sync.");
    actions.exit(15);
  }

  function get_push_group_list() {
    const push_group_list = [];

    for (let group of commit_range.group_list) {
      // skip the unassigned commits group
      if (group.id === commit_range.UNASSIGNED) continue;

      // if not --force, skip non-dirty groups
      if (!group.dirty && !argv.force) continue;

      push_group_list.unshift(group);
    }

    return push_group_list;
  }

  async function refresh_commit_range() {
    commit_range = await CommitMetadata.range(commit_map ?? undefined);
    push_group_list = get_push_group_list();

    actions.set((state) => {
      state.sync_github = { commit_range };
    });
  }

  async function push_groups() {
    if (argv.verify === false) {
      await push_groups_batched_no_verify();
      return;
    }

    let should_retry_validation = true;
    while (should_retry_validation) {
      const result = await verify_stack_tip_push();
      if (result === "retry") {
        await refresh_commit_range();
        continue;
      }

      should_retry_validation = false;
    }

    await push_groups_batched_no_verify();
  }

  async function push_groups_batched_no_verify() {
    const before_push_tasks = [];
    for (const group of push_group_list) {
      before_push_tasks.push(before_push({ group }));
    }

    await Promise.all(before_push_tasks);

    try {
      const git_push_target_list: Array<string> = [];

      for (const group of push_group_list) {
        const last_commit = last(group.commits);
        invariant(last_commit, "last_commit must exist");

        // push group in isolation if master_base is set
        if (group.master_base) {
          await push_master_group(group, { no_verify: true });
          continue;
        }

        git_push_target_list.push(get_push_target({ group, last_commit }));
      }

      if (git_push_target_list.length > 0) {
        const push_target = git_push_target_list.join(" ");
        const git_push_command = create_git_push_command("git", push_target, {
          no_verify: true,
        });
        await cli(git_push_command);
      }
    } catch (err) {
      await restore_pr_bases_after_push(push_group_list);
      throw err;
    }
  }

  async function verify_stack_tip_push(): Promise<"done" | "retry"> {
    const group = get_stack_tip_group();
    const last_commit = last(group.commits);
    invariant(last_commit, "last_commit must exist");

    let push_error: unknown;
    let should_retry = false;
    const before_status = await get_worktree_status();

    try {
      const git_push_command = create_git_push_command("git", `HEAD:refs/heads/${group.id}`, {
        dry_run: true,
      });
      await cli(git_push_command);
    } catch (err) {
      push_error = err;

      should_retry = await handle_failed_verified_push({
        before_status,
        group,
        last_commit,
      });
    }

    if (should_retry) {
      return "retry";
    }

    if (push_error) {
      throw push_error;
    }

    return "done";
  }

  function get_stack_tip_group() {
    const head_commit = last(commit_range.commit_list);
    invariant(head_commit, "head_commit must exist");

    const head_group_id = commit_map?.[head_commit.sha]?.id ?? head_commit.branch_id;
    const group = commit_range.group_list.find((group) => group.id === head_group_id);
    if (group && group.id !== commit_range.UNASSIGNED) {
      return group;
    }

    throw new Error("Unable to find stack tip group");
  }

  function get_push_target(args: { group: CommitMetadataGroup; last_commit: git.Commit }) {
    const { group, last_commit } = args;

    // explicit refs/heads head branch to avoid push failing
    //
    //   ❯ git push -f origin --no-verify f6e249051b4820a03deb957ddebc19acfd7dfd7c:gs-ED2etrzv2
    //   error: The destination you provided is not a full refname (i.e.,
    //   starting with "refs/"). We tried to guess what you meant by:
    //
    //   - Looking for a ref that matches 'gs-ED2etrzv2' on the remote side.
    //   - Checking if the <src> being pushed ('f6e249051b4820a03deb957ddebc19acfd7dfd7c')
    //     is a ref in "refs/{heads,tags}/". If so we add a corresponding
    //     refs/{heads,tags}/ prefix on the remote side.
    //
    //   Neither worked, so we gave up. You must fully qualify the ref.
    //   hint: The <src> part of the refspec is a commit object.
    //   hint: Did you mean to create a new branch by pushing to
    //   hint: 'f6e249051b4820a03deb957ddebc19acfd7dfd7c:refs/heads/gs-ED2etrzv2'?
    //   error: failed to push some refs to 'github.com:magus/git-multi-diff-playground.git'
    //
    return `${last_commit.sha}:refs/heads/${group.id}`;
  }

  async function get_worktree_status() {
    return (await cli("git status --porcelain", { quiet: true })).stdout;
  }

  async function handle_failed_verified_push(args: {
    before_status: string;
    group: CommitMetadataGroup;
    last_commit: git.Commit;
  }) {
    const { before_status, group, last_commit } = args;

    const after_status = await get_worktree_status();
    if (before_status || !after_status) {
      return false;
    }

    const diff_stat = (await cli("git --no-pager diff --stat --color=never", { quiet: true }))
      .stdout;

    let diff = "";
    if (argv.verbose) {
      diff = (await cli("git --no-pager diff --color=never", { quiet: true })).stdout;
    }

    const should_fold = await run_args.ask_fold({
      commit_sha: last_commit.sha,
      diff,
      diff_stat,
      group_id: group.id,
      status: after_status,
      subject: last_commit.subject_line,
    });

    if (!should_fold) {
      return false;
    }

    await fold_worktree_changes_into_commit(last_commit.sha);
    return true;
  }

  async function fold_worktree_changes_into_commit(commit_sha: string) {
    actions.output(
      <FormatText
        wrapper={<Ink.Text color={colors.yellow} />}
        message="Folding pre-push changes into {sha}…"
        values={{
          sha: <Parens>{commit_sha.slice(0, 12)}</Parens>,
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
    } catch (err) {
      actions.error("🚨 Autosquash hit conflicts while folding pre-push changes");
      actions.error("Resolve the conflicts, run `git add ...`, then `git rebase --continue`.");
      actions.error("Or run `git rebase --abort` to abandon the fold.");
      throw err;
    }
  }

  async function before_push(args: { group: CommitMetadataGroup }) {
    const { group } = args;

    invariant(group.base, "group.base must exist");

    // before pushing reset base to master temporarily
    // avoid accidentally pointing to orphaned parent commit
    // should hopefully fix issues where a PR includes a bunch of commits after pushing
    if (group.pr) {
      // only update base if it is different
      // github api started returning errors here on 2025-12-08
      //
      // ```
      // [2025-12-08 17:54:44.114] [start] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master
      // [2025-12-08 17:54:45.935] [end] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // [2025-12-08 17:54:45.937] GraphQL: A pull request already exists for base branch 'master' and head branch 'noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu' (updatePullRequest)
      //
      // [2025-12-08 17:54:45.938] gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // GraphQL: A pull request already exists for base branch 'master' and head branch 'noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu' (updatePullRequest)
      // gh pr edit noah/cua-images-chatgpt-prod-tags---4h0tk3liqmmplu --base master (exit_code=1 duration=1.8s)
      // Unable to sync.
      // ```
      //
      if (!is_pr_master_base(group)) {
        await github.pr_edit({
          branch: group.id,
          base: master_branch,
        });
      }
    }
  }

  async function after_push(args: {
    group: CommitMetadataGroup;
    pr_url_by_group_id: Record<string, string>;
  }) {
    const { group } = args;

    invariant(group.base, "group.base must exist");

    if (group.pr) {
      await restore_pr_base_after_push(group);
    } else {
      // create pr in github
      const pr_url = await github.pr_create({
        branch: group.id,
        base: group.base,
        title: group.title,
        body: DEFAULT_PR_BODY,
        draft: argv.draft,
        labels,
      });

      if (!pr_url) {
        throw new Error("unable to create pr");
      }

      // update pr_url_by_group_id with created pr_url
      args.pr_url_by_group_id[group.id] = pr_url;
    }
  }

  async function restore_pr_base_after_push(group: CommitMetadataGroup) {
    invariant(group.base, "group.base must exist");

    // there are two scenarios where we should restore the base after push
    // 1. if we aren't master base and pr is master base we should fix it
    const base_mismatch = !group.master_base && is_pr_master_base(group);
    // 2. if group pr was not master before the push we set it to master before pushing
    //    now we need to restore it back to how it was before the before_push
    const was_modified_before_push = !is_pr_master_base(group);

    const needs_base_fix = base_mismatch || was_modified_before_push;
    if (needs_base_fix) {
      // ensure base matches pr in github
      await github.pr_edit({ branch: group.id, base: group.base });
    }
  }

  async function restore_pr_bases_after_push(group_list: Array<CommitMetadataGroup>) {
    const tasks = [];
    for (const group of group_list) {
      if (group.pr) {
        tasks.push(restore_pr_base_after_push(group));
      }
    }

    await Promise.all(tasks);
  }

  async function update_pr(args: {
    group: CommitMetadataGroup;
    selected_url: string;
    pr_url_list: Array<string>;
    labels: Array<string>;
  }) {
    const { group, selected_url, pr_url_list } = args;

    invariant(group.base, "group.base must exist");

    const body = group.pr?.body || DEFAULT_PR_BODY;

    const update_body = StackSummaryTable.write({
      body,
      pr_url_list,
      selected_url,
    });

    const debug_meta = `${group.id} ${selected_url}`;

    const body_changed = update_body !== body;
    const needs_labels = args.labels.length > 0;

    if (!body_changed && !needs_labels) {
      actions.debug(`Skipping update ${debug_meta}`);
      return;
    }

    actions.debug(`Update PR ${debug_meta}`);

    const edit_args: Parameters<typeof github.pr_edit>[0] = {
      branch: group.id,
      base: group.base,
    };

    if (body_changed) {
      edit_args.body = update_body;
    }

    if (needs_labels) {
      edit_args.add_labels = args.labels;
    }

    await github.pr_edit(edit_args);
  }

  function is_pr_master_base(group: CommitMetadataGroup) {
    if (!group.pr) {
      return false;
    }

    return `origin/${group.pr.baseRefName}` === master_branch;
  }

  async function push_master_group(
    group: CommitMetadataGroup,
    options: { dry_run?: boolean; no_verify?: boolean } = {},
  ) {
    invariant(repo_path, "repo_path must exist");

    const commit_list = group.commits;
    const { worktree_path } = await git.worktree_add({ commit_list });

    const push_target = `HEAD:refs/heads/${group.id}`;
    const git_push_command = create_git_push_command(
      `git -C ${worktree_path}`,
      push_target,
      options,
    );

    await cli(git_push_command);
  }
}

type CommitMetadataGroup = CommitMetadata.CommitRange["group_list"][number];

type AskFold = (args: FoldPromptArgs) => Promise<boolean>;

type FoldPromptArgs = {
  commit_sha: string;
  diff: string;
  diff_stat: string;
  group_id: string;
  status: string;
  subject: string;
};

type FoldPromptState = FoldPromptArgs & {
  resolve: (answer: boolean) => void;
};

function FoldPrompt(props: { state: FoldPromptState; onAnswer: (answer: boolean) => void }) {
  const { state } = props;

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />
      <FormatText
        wrapper={<Ink.Text color={colors.yellow} />}
        message="Pre-push modified files while verifying {group}."
        values={{
          group: <Command>{state.group_id}</Command>,
        }}
      />
      <FormatText
        wrapper={<Ink.Text color={colors.gray} />}
        message="Target commit: {subject} {sha}"
        values={{
          sha: <Parens>{state.commit_sha.slice(0, 12)}</Parens>,
          subject: <Ink.Text color={colors.white}>{state.subject}</Ink.Text>,
        }}
      />

      <Ink.Box height={1} />
      <Ink.Text color={colors.gray}>git status --short</Ink.Text>
      <Ink.Text>{state.status}</Ink.Text>

      {state.diff_stat ? (
        <React.Fragment>
          <Ink.Box height={1} />
          <Ink.Text color={colors.gray}>git diff --stat</Ink.Text>
          <Ink.Text>{state.diff_stat}</Ink.Text>
        </React.Fragment>
      ) : null}

      {state.diff ? (
        <React.Fragment>
          <Ink.Box height={1} />
          <Ink.Text color={colors.gray}>git diff</Ink.Text>
          <Ink.Text>{state.diff}</Ink.Text>
        </React.Fragment>
      ) : null}

      {!state.diff ? (
        <Ink.Text color={colors.gray}>Run with --verbose to show the full diff here.</Ink.Text>
      ) : null}

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
