# TODO

- auto update
  - check npm for latest version
  - compare against local package.json
  - offer to update YesNoPrompt


- color + style StatusTable


- rebase prompt
  - when MERGED pr group detected, YesNoPrompt to fetch and rebase (equivalent to git sync)
  - "Merged PRs detected, you must update the [master] branch to properly rebase"
  - for rebase we can skip groups with merged pr, might be simplest approach?
  - we should update and do a rebase against latest master though to ensure we are up to date
  - use the git pr that landed to skip and rebase on top of all the commits
  - normal rebase against master may cause conflicts if "squash and merge" was used in github ui, because the single commit won't line up with the many commits locally
  - instead, drop the commits tagged for the PR entirely before rebasing, start from the first not merged PR in the stack for the rebase


- `id.js` create shorter unique identifiers instead of uuid (too long!)

- `--debug` show output from git push command

- add `-—no-verify` flag to pass into git push to skip pre-commit (sync step is slow on work laptop because of this I suspect)

- capture PR title when creating new group

- ManualRebase
  - set nice PR title and summary (diff stack table)

  - build table of stacked PRs to add to each PR as comment
    - order based on local sha ordering (i.e. group_list, which reflects PR order)
    - delete and update comment in pr if necessary (use regex)


- interactive PR status table
  - ▶ Unassigned (8 commits)
  - ▶ #764 Title B (2/3 commits)  https://github.com/...
  - ▶ #742 Title A (5/5 commits)  https://github.com/...

  - `folder: { on: '▼', off: '▶' },`
  - the first local row shows new commits not synced to any PR
  - (2/3 commits) means 3 commits locally and 2 commits in remote (mismatch)
  - focus + enter toggles the list open to view each commit
  - when expanded
    - each commit should also show status, e.g. new commits should show with NEW
    - show actions, e.g. Shift+D -> Delete


- multiselect with more items than terminal rows needs pagination
  - maybe default to window size of about 10 and display a scrollbar to indicate more items in either direction?
  - allow typing to filder the list based on regex match?
  - quicksearch may be similar or at least inspo
  - https://github.com/Eximchain/ink-quicksearch-input

## names

- stack
- prs
- batch
- cake
- pancake
- bake
- pile
- ladder
- steps
- stairs
- chain
