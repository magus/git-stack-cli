import * as React from "react";

import * as Ink from "ink";

import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

export function Parens(props: Props) {
  const color = colors.blue;

  return (
    <Ink.Text>
      <Ink.Text color={color}>(</Ink.Text>
      {props.children}
      <Ink.Text color={color}>)</Ink.Text>
    </Ink.Text>
  );
}
