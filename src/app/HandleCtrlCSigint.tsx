import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { sleep } from "~/core/sleep";

export function HandleCtrlCSigint() {
  const actions = Store.useActions();

  Ink.useInput((input, key) => {
    handle_input().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("🚨 HandleCtrlCSigint catch");
      // eslint-disable-next-line no-console
      console.error(err);
    });

    async function handle_input() {
      if (input === "c" && key.ctrl) {
        actions.clear();

        actions.output(
          <Ink.Text color={colors.red}>
            <FormatText message="🚨 Ctrl+C detected" />
          </Ink.Text>,
        );

        await sleep(1);

        try {
          actions.exit(HandleCtrlCSigint.ExitCode);
        } catch {
          // ignore intentional throw from actions.exit
        }
      }
    }
  });

  return null;
}

HandleCtrlCSigint.ExitCode = 235;
