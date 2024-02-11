import * as React from "react";

import * as Ink from "ink";

import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

export function Brackets(props: Props) {
  const color = colors.orange;
  const text_color = colors.blue;

  return (
    <Ink.Text color={text_color}>
      <Ink.Text color={color}>[</Ink.Text>
      {props.children}
      <Ink.Text color={color}>]</Ink.Text>
    </Ink.Text>
  );
}
