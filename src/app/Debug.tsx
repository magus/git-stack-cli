import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import * as json from "~/core/json";

export function Debug() {
  const actions = Store.useActions();
  const state = Store.useState((state) => state);
  const argv = Store.useState((state) => state.argv);
  const debug = Store.useState((state) => state.select.debug(state));

  React.useEffect(
    function debugMessageOnce() {
      if (debug) {
        actions.output(
          <Ink.Text color={colors.yellow}>Debug mode enabled</Ink.Text>
        );
      }
    },
    [argv]
  );

  React.useEffect(
    function syncStateJson() {
      if (!argv?.["write-state-json"]) {
        return;
      }

      const output_file = path.join(state.cwd, "git-stack-state.json");

      if (fs.existsSync(output_file)) {
        fs.rmSync(output_file);
      }

      const serialized = json.serialize(state);
      const content = JSON.stringify(serialized, null, 2);
      fs.writeFileSync(output_file, content);
    },
    [argv, state]
  );

  return null;
}
