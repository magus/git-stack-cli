import * as React from "react";

import * as Ink from "ink";

type Props = {
  children: React.ReactNode;
};

export function Url(props: Props) {
  const text_color = "#38bdf8";

  return (
    <Ink.Text bold color={text_color}>
      {props.children}
    </Ink.Text>
  );
}
