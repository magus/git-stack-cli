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
  - capture PR title when creating new group

- display PR status table (new, outdated, etc.) after sync

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
