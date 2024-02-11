import * as React from "react";

import { Store } from "~/app/Store";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { invariant } from "~/core/invariant";

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
      message="Local branch needs to be rebased, would you like to rebase to update your local branch?"
      onYes={() => {
        actions.set((state) => {
          state.step = "local-merge-rebase";
        });
      }}
      onNo={() => actions.exit(0)}
    />
  );
}
