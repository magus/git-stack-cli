import * as React from "react";

import { GithubApiError } from "~/app/GithubApiError";
import { LocalMergeRebase } from "~/app/LocalMergeRebase";
import { ManualRebase } from "~/app/ManualRebase";
import { PostRebaseStatus } from "~/app/PostRebaseStatus";
import { PreLocalMergeRebase } from "~/app/PreLocalMergeRebase";
import { PreManualRebase } from "~/app/PreManualRebase";
import { PreSelectCommitRanges } from "~/app/PreSelectCommitRanges";
import { SelectCommitRanges } from "~/app/SelectCommitRanges";
import { Status } from "~/app/Status";
import { Store } from "~/app/Store";
import { SyncGithub } from "~/app/SyncGithub";
import { assertNever } from "~/core/assertNever";

export function Main() {
  const step = Store.useState((state) => state.step);

  switch (step) {
    case "loading":
      return null;

    case "github-api-error":
      return <GithubApiError />;

    case "status":
      return <Status />;

    case "local-merge-rebase":
      return <LocalMergeRebase />;

    case "pre-local-merge-rebase":
      return <PreLocalMergeRebase />;

    case "pre-select-commit-ranges":
      return <PreSelectCommitRanges />;

    case "select-commit-ranges":
      return <SelectCommitRanges />;

    case "pre-manual-rebase":
      return <PreManualRebase />;

    case "manual-rebase":
      return <ManualRebase />;

    case "sync-github":
      return <SyncGithub />;

    case "post-rebase-status":
      return <PostRebaseStatus />;

    default:
      assertNever(step);
      return null;
  }
}
