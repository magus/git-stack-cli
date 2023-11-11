import * as React from "react";

import { Exit } from "./Exit.js";
import { Store } from "./Store.js";
import { YesNoPrompt } from "./YesNoPrompt.js";

export function PreSelectCommitRanges() {
  const actions = Store.useActions();

  return (
    <YesNoPrompt
      message="Some commits are new or outdated, would you like to select new commit ranges?"
      onYes={() => {
        actions.set((state) => {
          state.step = "select-commit-ranges";
        });
      }}
      onNo={() => {
        actions.output(<Exit clear code={0} />);
      }}
    />
  );
}
