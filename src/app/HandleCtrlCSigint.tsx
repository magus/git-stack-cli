import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { sleep } from "~/core/sleep";

export function HandleCtrlCSigint() {
  const actions = Store.useActions();

  const [exiting, set_exiting] = React.useState(false);

  Ink.useInput((input, key) => {
    handle_input().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err);
    });

    async function handle_input() {
      if (input === "c" && key.ctrl) {
        actions.clear();

        actions.output(
          <Ink.Text color={colors.red}>
            <FormatText message="🚨 Ctrl+C detected" />
          </Ink.Text>
        );

        set_exiting(true);
        await sleep(1);
        actions.exit(235);
      }
    }
  });

  if (exiting) {
    return (
      <Ink.Text color={colors.red}>
        <FormatText message="🚨 Exiting…" />
      </Ink.Text>
    );
  }

  return null;
}
