import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";
import * as json from "../core/json.js";

import { Store } from "./Store.js";

export function Debug() {
  const state = Store.useState((state) => state);
  const actions = Store.useActions();
  const debug = Store.useState((state) => state.argv?.debug);

  React.useEffect(
    function debugMessageOnce() {
      if (debug) {
        actions.output(<Ink.Text color="yellow">Debug mode enabled</Ink.Text>);
      }
    },
    [debug]
  );

  React.useEffect(
    function syncStateJson() {
      invariant(state.cwd, "state.cwd must exist");

      if (!debug) {
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
    [debug, state]
  );

  return null;
}
