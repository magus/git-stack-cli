import * as React from "react";

import * as Ink from "ink";

type Props = {
  children: React.ReactNode;
};

export function Command(props: Props) {
  const text_color = "#f97316";

  return (
    <Ink.Text bold color={text_color}>
      {props.children}
    </Ink.Text>
  );
}
