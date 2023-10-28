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
