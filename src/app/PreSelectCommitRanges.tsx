import * as React from "react";

import { invariant } from "../core/invariant.js";

import { Store } from "./Store.js";
import { YesNoPrompt } from "./YesNoPrompt.js";

export function PreSelectCommitRanges() {
  const actions = Store.useActions();
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  React.useEffect(() => {
    if (argv.force) {
      Store.setState((state) => {
        state.step = "select-commit-ranges";
      });
    }
  }, [argv]);

  return (
    <YesNoPrompt
      message="Some commits are new or outdated, would you like to select new commit ranges?"
      onYes={() => {
        actions.set((state) => {
          state.step = "select-commit-ranges";
        });
      }}
      onNo={() => actions.exit(0)}
    />
  );
}
