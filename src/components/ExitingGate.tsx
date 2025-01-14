import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

export function ExitingGate(props: Props) {
  const is_exiting = Store.useState((state) => state.is_exiting);

  if (!is_exiting) {
    return props.children;
  }

  return (
    <Ink.Box flexDirection="column">
      <Ink.Text color={colors.red}>
        <FormatText message="🚨 Exiting…" />
      </Ink.Text>
    </Ink.Box>
  );
}
