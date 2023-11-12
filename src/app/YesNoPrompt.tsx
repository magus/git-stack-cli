import * as React from "react";

import * as Ink from "ink";

import { Parens } from "./Parens.js";

type Props = {
  message: string;
  onYes(): void;
  onNo(): void;
};

export function YesNoPrompt(props: Props) {
  const [answer, set_answer] = React.useState("");

  Ink.useInput((input) => {
    const inputLower = input.toLowerCase();

    set_answer(inputLower);

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
            {answer && answer !== "y" ? null : (
              <Ink.Text bold color="#22c55e">
                Y
              </Ink.Text>
            )}

            {answer ? null : <Ink.Text>/</Ink.Text>}

            {answer && answer !== "n" ? null : (
              <Ink.Text color="#ef4444">n</Ink.Text>
            )}
          </Ink.Text>
        </Parens>
      </Ink.Box>
    </Ink.Box>
  );
}
