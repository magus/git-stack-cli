import * as React from "react";

import * as Ink from "ink-cjs";

import { colors } from "~/core/colors";

type Props = InkTextProps & {
  children: React.ReactNode;
};

type InkTextProps = React.ComponentProps<typeof Ink.Text>;

export function Url(props: Props) {
  return (
    <Ink.Text bold color={colors.blue} {...props}>
      {props.children}
    </Ink.Text>
  );
}
