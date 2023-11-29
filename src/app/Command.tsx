import * as React from "react";

import * as Ink from "ink";

import { colors } from "../core/colors.js";

type Props = {
  children: React.ReactNode;
};

export function Command(props: Props) {
  const text_color = colors.orange;

  return (
    <Ink.Text bold color={text_color}>
      {props.children}
    </Ink.Text>
  );
}
