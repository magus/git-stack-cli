#!/usr/bin/env node

import * as React from "react";

import * as Ink from "ink-cjs";

import { App } from "~/app/App";
import { Store } from "~/app/Store";
import { command } from "~/command";

command()
  .then((argv) => {
    const ink = Ink.render(<App />);

    Store.setState((state) => {
      state.ink = ink;
      state.process_argv = process.argv;
      state.argv = argv;
      state.cwd = process.cwd();
    });

    Store.getState().actions.debug(JSON.stringify(argv, null, 2));
  })
  // eslint-disable-next-line no-console
  .catch(console.error);
