# git-multi-diff

## install

```bash
npm i -g git-multi-diff

git multi-diff
```

## development

```bash
npm link
git multi-diff
```


## TODO
- use gh cli to retrieve pr status
  - https://cli.github.com/manual/gh_pr_list

  ```bash
  gh pr list --json number,headRefName,author --state='open' --limit=250 --author="magus" -q '.[] | select(.author.login == "magus") | .'
  ```

  - can also filter by headRefName (branch name)
  - build comment table with each pr in stack
  - order based on local sha ordering
  - delete and update comment in pr if necessary (use regex)


- set base for PR as previous commit branch
    - `master` ← `branch/1`
    - `branch/1` ← `branch/2`
    - can we do this via some official CLI rather than having to create personal access tokens?

- remove branch name from remote branch name
  - problematic since it means if you change the local branch name things will not line up anymore
  - we need to avoid this entirely by using guid alone

- avoid updating commits which have not changed
  - during first walk discover first dirty/new commit and start new branch from that sha
  - this avoids the cherry pick which creates a new sha, meaning the sha will stay the same
  - then we can add back the force functionality to forcefully push to remote overriding this optimization

- fetch all PR status before command runs and build a look up with branchName guid (id) as key
  - use GitHub lookup to quickly decide if a branch is dirty or not (only need to compare git sha now, no need to git diff!)

- handle changing the first commit correctly
  - if you edit the commit message of first commit the sha will change however the diff will show it is not dirty
  - this is wrong because the new sha needs to be reflected for GitHub to correctly recognize it in the branch for the second commit (since it’ll be pointed at the old sha unless we update it)
  - so we need to check the head sha on GitHub using gh pr maybe? to make this determination



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
