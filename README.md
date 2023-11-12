# git-multi-diff

## install

```bash
npm i -g git-multi-diff

git multi-diff
```

## development

```bash
npm run dev
npm link
git multi-diff
```


## TODO

- select commit ranges

  - manual rebase to re-label commits locally
  - capture PR title when creating new group

- flow

  walk commits and gather commit ranges
  commit ranges <--> PRs
  if we cannot gather commit ranges it means we have new or re-ordered commits
  -> display PR status table (new, outdated, etc.)

  if --check
    -> exit

  if any metadata.id are out of place
  if any new commits
    -> select commit ranges
    -> update local commit metadata

  if needs update
  if --force
    -> sync

  -> display PR status table (new, outdated, etc.)


- build table of stacked PRs to add to each PR as comment
  - order based on local sha ordering (i.e. group_list, which reflects PR order)
  - delete and update comment in pr if necessary (use regex)

- avoid updating commits which have not changed
  - during first walk discover first dirty/new commit and start new branch from that sha
  - this avoids the cherry pick which creates a new sha, meaning the sha will stay the same
  - then we can add back the force functionality to forcefully push to remote overriding this optimization


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
