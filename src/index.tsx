#!/usr/bin/env node

import * as React from "react";

import * as Ink from "ink-cjs";

import { App } from "~/app/App";
import { Store } from "~/app/Store";
import { command } from "~/command";
import { pretty_json } from "~/core/pretty_json";

(async function main() {
  try {
    const argv = await command();

    const ink = Ink.render(<App />, {
      // If true, each update will be rendered as a separate output, without replacing the previous one.
      // debug: true,
      //
      // Configure whether Ink should listen to Ctrl+C keyboard input and exit the app.
      // We intentionally handle this ourselves in `<Exit />`
      exitOnCtrlC: false,
    });

    Store.setState((state) => {
      state.ink = ink;
      state.process_argv = process.argv;
      state.argv = argv;
      state.cwd = process.cwd();
    });

    Store.getState().actions.debug(pretty_json(argv as any));

    await ink.waitUntilExit();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(235);
  }
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
});
