# git-stack-cli

- ✨ **[Stacked diffs](https://graphite.dev/guides/stacked-diffs) for `git`**
- 🚀 **Simple one-branch workflow**
- 🎯 **Interactively select commits for each pull request**
- 💬 **Group commits for focused code review**
- 🌐 **Use the [official GitHub CLI](https://cli.github.com/)**
- ♻️ **Automatically synchronize each pull request in the stack**
- 💪 **Work seamlessly with GitHub's interface**
- 🚫 **Avoid juggling mutiple branches and complex rebasing**
- 📚 **Preserve your detailed commit history**

## Demo

> <img src="https://github.com/magus/git-multi-diff-playground/assets/290084/069c304b-80cb-49a9-9dc6-4ed3b061a5bc">

## Install

```bash
npm i -g git-stack-cli
```

## Usage

```bash
git stack

git stack --verbose   # print more detailed logs for debugging internals
git stack --no-verify # skip git hooks such as pre-commit and pre-push

git-stack --help      # print a table of all command-line arguments
```

## Why?

The goal of `git stack` is to combine the **simplicity of developing in a single branch** in order to **preserve your commit history** while also **grouping commits into pull requests for code review**.

Often pushing all your commits to a single pull request is the simplest and fastest approach to development.
This comes at a price, your teammates have to review larger, less related pieces of code and you will lose some of your atomic commit history if you "Squash and merge".

When you decide to break changes up into multiple diffs that depend on one another this process is commonly referred to as **[stacked diffs](https://graphite.dev/guides/stacked-diffs)** (pull requests that depend on other pull requests).
This appraoch is popular at many major comparnies such as Twitter, Facebook, etc.
Managing stacked diffs manually involves managing multiple local branches, jumping between them, rebasing, etc.
This process gets even more complicated when you start getting feedback in code review and have to update individual branches.
Managing even a few stacked diffs requires a relatively strong knowledge of `git`, even with tricks like [`--update-refs`](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt---update-refs).

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
git submodule update --init --recursive
npm i
npm run dev
npm link

# navigate to project to test within
npm link git-stack-cli

git stack --verbose
```

## Build standalone executable

```bash
npm run build:standalone
```

## Publishing

> [!IMPORTANT]
>
> **You must update the `version` in `package.json` and commit all changes first!**

```bash
npm i
git commit
npm publish
```
