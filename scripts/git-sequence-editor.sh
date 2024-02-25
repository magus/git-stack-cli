#!/bin/sh

# Example
#
#   GIT_REVISE_TODO="abc" GIT_EDITOR="$(pwd)/scripts/git-sequence-editor.sh" git revise --edit -i head~4
#
#   Note
#   ----------------
#   Use `GIT_EDITOR` above instead of `GIT_SEQUENCE_EDITOR` because `git revise` does not use
#   `GIT_SEQUENCE_EDITOR` when passing the `--edit` flag, but does work without the `--edit` flag
#
#

# debug print env variables
echo "GIT_REVISE_TODO=$GIT_REVISE_TODO"
echo "CLI=$0 $*"
echo "PWD=$(pwd)"

# ensure `GIT_REVISE_TODO` is not empty
if [ -z "$GIT_REVISE_TODO" ]; then
  echo "🚨 GIT_REVISE_TODO environment variable is empty" >&2
  exit 1
fi

# first argument into git sequence editor is git-revise-todo file
git_revise_todo_path="$1"

# debug print git-revise-todo file passed into command
echo "$git_revise_todo_path"
echo "----- START -----"
cat "$git_revise_todo_path"
echo "------ END ------"

# write content of `GIT_REVISE_TODO` env variable to `git_revise_todo_path`
echo "$GIT_REVISE_TODO" > "$git_revise_todo_path"
