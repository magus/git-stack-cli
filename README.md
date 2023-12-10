# git-stack-cli

- 🚀 **Simple one-branch workflow**
- 🎯 **Interactively select commits for each pull request**
- 📚 **Preserve your detailed commit history**
- ♻️ **Automatically synchronize each pull request in the stack**
- 💬 **Group commits for focused code review**
- 🚫 **Avoid mutiple branch juggling and complex rebasing**
- 💪 **Work seamlessly with GitHub's interface**
- 🌐 **Leverage the [official GitHub CLI](https://cli.github.com/)**

## Demo

> <img src="https://github.com/magus/git-multi-diff-playground/assets/290084/cc583c01-4c3b-4416-b6a5-9702e5401c1b" width="720">

## Install

```bash
npm i -g git-stack-cli

git stack
```


## Why?

Most developers might not see much reason to **preserve commit history** or **create multiple pull requests of smaller changes**.
Often pushing all your commits to a single pull request is the simplest and fastest approach to development.
However, there is a cost to this, your teammates have to review larger, less related pieces of code and you will lose some of your atomic commit history if you squahs and merge.


Okay, so you decide to break changes up. This process is commonly referred to as **[stacked diffs](https://graphite.dev/guides/stacked-diffs)** (pull requests that depend on other pull requests).
Manually this means managing multiple local branches, jumping between them, rebasing, etc.
This process gets even more complicated when you start getting feedback in code review and have to update individual branches.
Managing even a few stacked diffs requires a relatively strong knowledge of `git`, even with tricks like [`--update-refs`](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---update-refs).

The goal of `git stack` is to combine the **simplicity of developing in a single branch** in order to **preserve your commit history** while also **grouping commits into pull requests for code review**.

## How is this different than **`x`**

### [`ghstack`](https://github.com/ezyang/ghstack)

- `git stack` automatically synchronizes each pull request in your stack, as needed
- `git stack` does not create local branches (instead it annotates commits locally with metadata to denote groups of commits, e.g. `git-stack-id: E63ytp5dj`)
- `ghstack` requires rebasing and squashing since each commit creates a pull request, which means you lose commit history
- `git stack` allows developing in a single local branch and selecting groups of commits for each pull request
- `git stack` adds a clear comment to each pull request in the stack showing the entire stack
- `git stack` does not break if you land pull requests through Github directly, `ghstack` requires landing from the command-line interface
- `git stack` uses the [official GitHub CLI](https://cli.github.com/) (`gh`) instead of personal access tokens

## Development

```bash
npm run dev
npm link

git stack --verbose
```


