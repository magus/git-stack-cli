#!/usr/bin/env node

/* eslint-disable no-console */

import * as React from "react";

import * as Ink from "ink-cjs";

import { App } from "~/app/App";
import { Store } from "~/app/Store";
import { command } from "~/command";
import { pretty_json } from "~/core/pretty_json";

(async function main() {
  try {
    const argv = await command();

    // required to get bun working with ink
    // https://github.com/oven-sh/bun/issues/6862#issuecomment-2429444852
    process.stdin.resume();

    process.on("uncaughtException", (error) => {
      console.error("🚨 uncaughtException");
      console.error(error);
      maybe_verbose_help();
      process.exit(237);
    });

    process.on("unhandledRejection", (reason, _promise) => {
      console.error("🚨 unhandledRejection");
      console.error(reason);
      maybe_verbose_help();
      process.exit(238);
    });

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

    function maybe_verbose_help() {
      if (!argv.verbose) {
        console.error();
        console.error("Try again with `--verbose` to see more information.");
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(236);
  }
})().catch((err) => {
  console.error(err);
});
