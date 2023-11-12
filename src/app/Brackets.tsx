import * as React from "react";

import * as Ink from "ink";

type Props = {
  children: React.ReactNode;
};

export function Brackets(props: Props) {
  const color = "#f97316";
  const text_color = "#06b6d4";

  return (
    <Ink.Text color={text_color}>
      <Ink.Text color={color}>[</Ink.Text>
      {props.children}
      <Ink.Text color={color}>]</Ink.Text>
    </Ink.Text>
  );
}
