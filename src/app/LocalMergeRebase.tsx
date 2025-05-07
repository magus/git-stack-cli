import * as React from "react";

import { Store } from "~/app/Store";
import { Rebase } from "~/commands/Rebase";

export function LocalMergeRebase() {
  const actions = Store.useActions();

  return (
    <Rebase
      onComplete={() => {
        actions.set((state) => {
          state.step = "status";
        });
      }}
    />
  );
}
