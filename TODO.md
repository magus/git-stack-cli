# TODO

- Fullscreen UI
  - problem with active UI is it doesn't persist (only things written to Ink.Static persist
    - but could we write current visible state to stderr on Exit?
    - maybe just `actions.output(<StatusTable />)` is sufficient too since that's the critical info
  - Always show StatusTable and update it as script runs (locked to bottom)
  - Write high level actions like fetch, rebase, sync to easily track progress
  - Show debug logs only when verbose as a static N-line box
    - create Array<string> buffer of all output
    - ensure each is exactly one line, wrap to terminal width, etc. 
    - this is critical so we can 'tail' the buffer to last N lines and render an Ink.Box with that exact height

- graphite does breakpoints, consider a hotkey for inserting "breakpoint group", e.g. "b"

- select all commits first, then press "c" to create the group

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
