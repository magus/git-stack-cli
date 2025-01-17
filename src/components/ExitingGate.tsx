import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

export function ExitingGate(props: Props) {
  const exit_mode = Store.useState((state) => state.exit_mode);

  if (!exit_mode) {
    return props.children;
  }

  switch (exit_mode) {
    case "quiet":
      return null;

    case "normal":
      return (
        <Ink.Box flexDirection="column">
          <Ink.Text color={colors.red}>
            <FormatText message="🚨 Exiting…" />
          </Ink.Text>
        </Ink.Box>
      );

    default:
      exit_mode satisfies never;
      return null;
  }
}
