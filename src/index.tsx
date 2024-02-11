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
      state.argv = argv;
      state.cwd = process.cwd();
    });
  })
  // eslint-disable-next-line no-console
  .catch(console.error);
