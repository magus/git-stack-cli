import * as React from "react";

import { assertNever } from "../core/assertNever.js";

import { GithubApiError } from "./GithubApiError.js";
import { ManualRebase } from "./ManualRebase.js";
import { PostRebaseStatus } from "./PostRebaseStatus.js";
import { PreSelectCommitRanges } from "./PreSelectCommitRanges.js";
import { SelectCommitRanges } from "./SelectCommitRanges.js";
import { Status } from "./Status.js";
import { Store } from "./Store.js";

export function Main() {
  const step = Store.useState((state) => state.step);

  switch (step) {
    case "github-api-error":
      return <GithubApiError />;

    case "loading":
      return null;

    case "status":
      return <Status />;

    case "pre-select-commit-ranges":
      return <PreSelectCommitRanges />;

    case "select-commit-ranges":
      return <SelectCommitRanges />;

    case "manual-rebase":
      return <ManualRebase />;

    case "manual-rebase-no-sync":
      return <ManualRebase skipSync />;

    case "post-rebase-status":
      return <PostRebaseStatus />;

    default:
      assertNever(step);
      return null;
  }
}
