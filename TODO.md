# TODO

- **automating publish**

  - pull `package.json` `version` first and ensure tag for `version` does not already exist
  - automate `npm i`, `git commit` and `git tag`
  - run `npm run build:standalone`
  - publish release to github
  - update `homebrew/git-stack.rb` formula
  - use `shasum -a 256 git-stack-cli-[linux|macos]` to update `sha256` field
  - update `version` field
  - update `url` to github release download url

- **multiselect with more items than terminal rows needs pagination**

  - maybe default to window size of about 10 and display a scrollbar to indicate more items in either direction?
  - allow typing to filder the list based on regex match?
  - quicksearch may be similar or at least inspo
  - https://github.com/Eximchain/ink-quicksearch-input

- **interactive PR status table**

  - ▶ Unassigned (8 commits)
  - ▶ #764 Title B (2/3 commits) https://github.com/...
  - ▶ #742 Title A (5/5 commits) https://github.com/...

  - `folder: { on: '▼', off: '▶' },`
  - the first local row shows new commits not synced to any PR
  - (2/3 commits) means 3 commits locally and 2 commits in remote (mismatch)
  - focus + enter toggles the list open to view each commit
  - when expanded
    - each commit should also show status, e.g. new commits should show with NEW
    - show actions, e.g. Shift+D -> Delete

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
