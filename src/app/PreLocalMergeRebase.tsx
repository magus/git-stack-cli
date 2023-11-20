import * as React from "react";

import { invariant } from "../core/invariant.js";

import { Store } from "./Store.js";
import { YesNoPrompt } from "./YesNoPrompt.js";

export function PreLocalMergeRebase() {
  const actions = Store.useActions();
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  React.useEffect(() => {
    if (argv.force) {
      Store.setState((state) => {
        state.step = "local-merge-rebase";
      });
    }
  }, [argv]);

  return (
    <YesNoPrompt
      message="Merged PRs detected, would you like to rebase to update your local branch?"
      onYes={() => {
        actions.set((state) => {
          state.step = "local-merge-rebase";
        });
      }}
      onNo={() => actions.exit(0)}
    />
  );
}
