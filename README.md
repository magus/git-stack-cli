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
- ⚡ **Faster, in-memory rebase via [`git revise`](https://github.com/mystor/git-revise)**

## Demo

> <img alt="git stack demo" src="https://github.com/magus/git-multi-diff-playground/assets/290084/069c304b-80cb-49a9-9dc6-4ed3b061a5bc">

## Install

> [!TIP]
>
> Install via **[Homebrew](https://brew.sh/)** to ensure the **[official Github CLI](https://cli.github.com/)** and **[git revise](https://github.com/mystor/git-revise)** dependencies are installed automatically
>
> ```bash
> brew install magus/git-stack/git-stack
> ```
>
> <details>
>
> <summary>
> npm alternative
> </summary>
>
> If you prefer to use **[npm](https://www.npmjs.com/)** you will need to install the **[official Github CLI](https://cli.github.com/)** and **[git revise](https://github.com/mystor/git-revise)** dependencies separarely
>
> ```bash
> brew install gh
> brew install git-revise
>
> npm i -g git-stack-cli
> ```
>
> </details>

## Usage

```bash
git stack             # group and sync commits in branch to Github

git stack --check     # print status only, skipping rebase and sync to Github
git stack --verbose   # print more detailed logs for debugging internals
git stack --no-verify # skip git hooks such as pre-commit and pre-push

git stack help        # print a table of all CLI arguments
```

### Editing existing commits and pull requests

Sometimes you want to add changes to an existing commit or pull request.
With `git-stack` this is as simple as amending the commit.

1. `git add` your changes to the stage
2. `git stack log` to find the relative commit number you want to amend
3. `git stack fixup <number>` to amend the specific commit with your staged changes.

```bash
git add -p
git stack log
git stack fixup 2
```

> <img alt="git stack fixup demo" src="https://github.com/user-attachments/assets/2cdfaa5b-00be-4ed3-8bed-4a24c412979b">

Running `git stack` afterward will update any existing pull requests with your changes.

## Why?

The goal of `git stack` is to combine the **simplicity of developing in a single branch** in order to **preserve your commit history** while also **grouping commits into pull requests for code review**.

Often pushing all your commits to a single pull request is the simplest and fastest approach to development.
This comes at a price, your teammates have to review larger, less related pieces of code and you will lose some of your atomic commit history if you "Squash and merge".

When you decide to break changes up into multiple diffs that depend on one another this process is commonly referred to as **[stacked diffs](https://graphite.dev/guides/stacked-diffs)** (pull requests that depend on other pull requests).
This approach is popular at many major companies such as Twitter, Facebook, etc.
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
- `git stack` does not break if you land pull requests through Github directly, `ghstack` requires landing from the CLI interface
- `git stack` uses the [official GitHub CLI](https://cli.github.com/) (`gh`) instead of personal access tokens

## Development

Ensure `node --version` is the same across both projects you are using to test the `git-stack` cli

```bash
git submodule update --init --recursive
npm i
npm run dev
npm unlink git-stack-cli
npm link

# navigate to project to test within
npm unlink git-stack-cli
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
> **You must update the `version` in `package.json` before running `npm run release`.
> DO NOT use `npm version` or commit the change, the release scripts handle git tags etc.**

```bash
npm run release

# release individually
npm run release:npm
npm run release:github
npm run release:brew
```
