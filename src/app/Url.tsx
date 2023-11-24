import * as React from "react";

import * as Ink from "ink";

type Props = InkTextProps & {
  children: React.ReactNode;
};

type InkTextProps = React.ComponentProps<typeof Ink.Text>;

export function Url(props: Props) {
  const text_color = "#38bdf8";

  return (
    <Ink.Text bold color={text_color} {...props}>
      {props.children}
    </Ink.Text>
  );
}
