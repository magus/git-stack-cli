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
  gather all unique metadata id with active PR
  best effort to reselect based on commit metadata id (longest continuous range?)
  allow create new PR from this ui
  display linear list of commits (same order as git log)
  select start and stop (continuous)
  manual rebase to re-label commits locally

  ```bash
  ◯ cantaloupe line2 changed line3 'abc' line4 line5 "hello world" Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim ven…
  ◯ orange color
  ◯ strawberry
  ◯ remove num
  ◯ more remove

  <-  (2/4) #742 Title A ->
  ```

  - display `(2/4)` to indicate how many PR buckets and orient user
  - press left and right to select PR bucket (metadata.id)
  - multiselect with default selection state (commit metadata.id)

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


- display PR status table
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
  - new commits can choose to create a new PR or go into an existing PR
  - some ui to move commits between PR buckets

- allow commits to be grouped
  - list commits from base
  - single key interactions
  - enter, toggle group for commit
  - g, group
  - c, cycle group
  - a, abort
  - d, done

- each group must match PR commits otherwise it's dirty, not just first commit

- build comment table with each pr in stack
  - order based on local sha ordering
  - delete and update comment in pr if necessary (use regex)

- avoid updating commits which have not changed
  - during first walk discover first dirty/new commit and start new branch from that sha
  - this avoids the cherry pick which creates a new sha, meaning the sha will stay the same
  - then we can add back the force functionality to forcefully push to remote overriding this optimization


- multiselect with more items than terminal rows needs pagination
  - maybe default to window size of about 10 and display a scrollbar to indicate more items in either direction?
  - allow typing to filder the list based on regex match?
  - quicksearch may be similar or at least inspo
  - https://github.com/Eximchain/ink-quicksearch-input

## names

- git-prs
- batch
- cake
- pancake
- bake
- pile
- ladder
- steps
- stairs
- chain
