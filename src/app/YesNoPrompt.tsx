import * as React from "react";

import * as Ink from "ink";

import { Parens } from "./Parens.js";

type Props = {
  message: string;
  onYes(): void;
  onNo(): void;
};

export function YesNoPrompt(props: Props) {
  Ink.useInput((input) => {
    const inputLower = input.toLowerCase();

    switch (inputLower) {
      case "n":
        return props.onNo();

      case "y":
        return props.onYes();
    }
  });

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box>
        <Ink.Text color="yellow">{props.message}</Ink.Text>

        <Ink.Text> </Ink.Text>

        <Parens>
          <Ink.Text color="gray">
            <Ink.Text bold color="#22c55e">
              Y
            </Ink.Text>
            /<Ink.Text color="#ef4444">n</Ink.Text>
          </Ink.Text>
        </Parens>
      </Ink.Box>
    </Ink.Box>
  );
}
