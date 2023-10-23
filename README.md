# git-multi-diff

## development

```bash
npm link
git-multi-diff
```


## TODO


- push each commit to github, with `origin/branch/n` where `n` is the commit number

- set base for PR as previous commit branch
    - `master` ← `branch/1`
    - `branch/1` ← `branch/2`
    - can we do this via some official CLI rather than having to create personal access tokens?

- Updating/Syncing
  - diff with `origin/branch/n` where `n` is the commit number or from commit message
  - print nice table sha and status, eg NEW/OK/OLD
  - update branch base if needed
  - diff with origin and push only if changed (prevent rerunning ci if not necessary)
  - flag to force push (ignore diff check)
  - flag to just check status, not push
