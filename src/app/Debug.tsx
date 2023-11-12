import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";
import * as json from "../core/json.js";

import { Store } from "./Store.js";

export function Debug() {
  const actions = Store.useActions();
  const state = Store.useState((state) => state);
  const argv = Store.useState((state) => state.argv);

  React.useEffect(
    function debugMessageOnce() {
      actions.debug(<Ink.Text color="yellow">Debug mode enabled</Ink.Text>);
      if (argv?.verbose) {
        actions.debug(
          <Ink.Text dimColor>{JSON.stringify(argv, null, 2)}</Ink.Text>
        );
      }
    },
    [argv]
  );

  React.useEffect(
    function syncStateJson() {
      invariant(state.cwd, "state.cwd must exist");

      if (!argv?.debug) {
        return;
      }

      const output_file = path.join(state.cwd, "git-multi-diff-state.json");

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
