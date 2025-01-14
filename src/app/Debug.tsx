import * as React from "react";

import fs from "node:fs/promises";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import * as json from "~/core/json";
import { pretty_json } from "~/core/pretty_json";
import { safe_rm } from "~/core/safe_rm";

export function Debug() {
  const actions = Store.useActions();
  const state = Store.useState((state) => state);
  const argv = Store.useState((state) => state.argv);
  const debug = Store.useState((state) => state.select.debug(state));

  React.useEffect(
    function debugMessageOnce() {
      if (debug) {
        actions.output(<Ink.Text color={colors.yellow}>Debug mode enabled</Ink.Text>);
      }
    },
    [argv]
  );

  React.useEffect(
    function sync_state_json() {
      if (!argv?.["write-state-json"]) {
        return;
      }

      sync().catch(actions.error);

      async function sync() {
        const output_file = path.join(state.cwd, "git-stack-state.json");

        await safe_rm(output_file);

        const serialized = json.serialize(state);
        const content = pretty_json(serialized);
        await fs.writeFile(output_file, content);
      }
    },
    [argv, state]
  );

  return null;
}
