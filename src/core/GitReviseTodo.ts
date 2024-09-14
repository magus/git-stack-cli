import * as Metadata from "~/core/Metadata";

import type * as CommitMetadata from "~/core/CommitMetadata";

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
  const entry_list = [];

  const group_list = args.commit_range.group_list;

  for (let i = args.rebase_group_index; i < group_list.length; i++) {
    const group = group_list[i];

    for (const commit of group.commits) {
      // update git commit message with stack id
      const metadata = { id: group.id, title: group.title };
      const unsafe_message_with_id = Metadata.write(
        commit.full_message,
        metadata
      );

      let message_with_id = unsafe_message_with_id;

      message_with_id = message_with_id.replace(/[^\\]"/g, '\\"');

      // get first 12 characters of commit sha
      const sha = commit.sha.slice(0, 12);

      // generate git revise entry
      const entry_lines = [`++ pick ${sha}`, message_with_id];
      const entry = entry_lines.join("\n");

      entry_list.push(entry);
    }
  }

  const todo = entry_list.join("\n\n");
  return todo;
}

type Args = {
  rebase_group_index: number;
  commit_range: CommitMetadata.CommitRange;
};
