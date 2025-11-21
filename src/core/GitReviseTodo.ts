import fs from "node:fs/promises";
import path from "node:path";

import { Store } from "~/app/Store";
import * as Metadata from "~/core/Metadata";
import { cli } from "~/core/cli";
import { get_tmp_dir } from "~/core/get_tmp_dir";
import { invariant } from "~/core/invariant";
import { safe_rm } from "~/core/safe_rm";

import * as CommitMetadata from "~/core/CommitMetadata";

// https://git-revise.readthedocs.io/en/latest/man.html#interactive-mode
//
// # Interactive Revise Todos(4 commands)
// #
// # Commands:
// #  p, pick <commit> = use commit
// #  r, reword <commit> = use commit, but edit the commit message
// #  s, squash <commit> = use commit, but meld into previous commit
// #  f, fixup <commit> = like squash, but discard this commit's message
// #  c, cut <commit> = interactively split commit into two smaller commits
// #  i, index <commit> = leave commit changes staged, but uncommitted
// #
// # Each command block is prefixed by a '++' marker, followed by the command to
// # run, the commit hash and after a newline the complete commit message until
// # the next '++' marker or the end of the file.
// #
// # Commit messages will be reworded to match the provided message before the
// # command is performed.
// #
// # These blocks are executed from top to bottom. They can be re-ordered and
// # their commands can be changed, however the number of blocks must remain
// # identical. If present, index blocks must be at the bottom of the list,
// # i.e. they can not be followed by non-index blocks.
// #
// #
// # If you remove everything, the revising process will be aborted.

// calculate git-revise-todo from commit_range and rebase_group_index
//
// Example
// ----------------------------
//   ++ pick d36d63499425
//   cantaloupe color
//
//   git-stack-id: E63ytp5dj
//
//   ++ pick 4f98dd3e67d0
//   banana sweet
//
//   git-stack-id: E63ytp5dj
//
//   ++ pick f143d03c723c
//   apple sweet
//
export function GitReviseTodo(args: Args): string {
  const commit_list = [];

  const group_list = args.commit_range.group_list;
  // console.debug({ group_list });

  for (let i = args.rebase_group_index; i < group_list.length; i++) {
    const group = group_list[i];

    for (const commit of group.commits) {
      commit_list.push(commit);
    }
  }

  // console.debug({ commit_list });
  const todo = GitReviseTodo.todo({ commit_list });
  return todo;
}

type CommitListArgs = {
  commit_list: CommitMetadata.CommitRange["commit_list"];
};

GitReviseTodo.todo = function todo(args: CommitListArgs) {
  const entry_list = [];

  for (const commit of args.commit_list) {
    // get first 12 characters of commit sha
    const sha = commit.sha.slice(0, 12);

    // generate git revise entry
    const entry_lines = [`++ pick ${sha}`];

    // update git commit message with stack id
    const id = commit.branch_id;
    if (id == null || id === CommitMetadata.UNASSIGNED) {
      entry_lines.push(commit.full_message);
    } else {
      // console.debug({ commit });
      const title = commit.title;
      invariant(title, "commit.title must exist");

      const metadata = { id, title };
      const unsafe_message_with_id = Metadata.write(commit.full_message, metadata);
      const message_with_id = unsafe_message_with_id;
      entry_lines.push(message_with_id);
    }

    const entry = entry_lines.join("\n");
    entry_list.push(entry);
  }

  const todo = entry_list.join("\n\n");
  return todo;
};

GitReviseTodo.execute = async function grt_execute(args: ExecuteArgs) {
  const argv = Store.getState().argv;
  const actions = Store.getState().actions;

  // replaced at build time with literal contents of `scripts/git-sequence-editor.sh`
  const GIT_SEQUENCE_EDITOR_SCRIPT = process.env.GIT_SEQUENCE_EDITOR_SCRIPT;
  invariant(GIT_SEQUENCE_EDITOR_SCRIPT, "GIT_SEQUENCE_EDITOR_SCRIPT must exist");

  // generate temporary directory and drop sequence editor script
  // write script to temporary path and ensure script is executable
  const tmp_git_sequence_editor_path = path.join(await get_tmp_dir(), "git-sequence-editor.sh");
  await fs.writeFile(tmp_git_sequence_editor_path, GIT_SEQUENCE_EDITOR_SCRIPT);
  await fs.chmod(tmp_git_sequence_editor_path, "755");

  // write git revise todo to a temp path for use by sequence editor script
  const tmp_path_git_revise_todo = path.join(await get_tmp_dir(), "git-revise-todo.txt");
  await fs.writeFile(tmp_path_git_revise_todo, GitReviseTodo(args));

  // execute cli with temporary git sequence editor script
  // revise from merge base to pick correct commits
  const command = [
    `GIT_EDITOR="${tmp_git_sequence_editor_path}"`,
    `GIT_REVISE_TODO="${tmp_path_git_revise_todo}"`,
    `git`,
  ];

  if (!argv["revise-sign"]) {
    command.push(...["-c", "commit.gpgsign=false"]);
  }

  command.push(`revise --edit -i ${args.rebase_merge_base}`);

  try {
    // `ignore` hides output which helps prevent scrollback clear
    // `pipe` helps see failures when git revise fails
    // https://github.com/magus/git-stack-cli/commit/f9f10e3ac3cd9a35ee75d3e0851a48391967a23f
    await cli(command, { stdio: ["pipe", "pipe", "pipe"] });
  } catch (err) {
    if (err instanceof Error) {
      actions.error(err.message);
      if (err.message.includes("gpg failed to sign commit")) {
        actions.error("\n\n");
        actions.error("🚨 git revise failed to sign commit");
        actions.error("💡 Try again with `--no-revise-sign`?");
        actions.error("\n\n");
        actions.exit(21);
      }
    }
  }

  // cleanup tmp_git_sequence_editor_path
  await safe_rm(tmp_git_sequence_editor_path);
};

type ExecuteArgs = {
  rebase_group_index: number;
  rebase_merge_base: string;
  commit_range: CommitMetadata.CommitRange;
};

type Args = {
  rebase_group_index: number;
  commit_range: CommitMetadata.CommitRange;
};
