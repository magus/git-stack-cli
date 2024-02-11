import * as React from "react";

import * as Ink from "ink";

import { Parens } from "~/app/Parens";
import { colors } from "~/core/colors";

type Props = {
  message: React.ReactNode;
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

  // prettier-ignore
  const y = <Ink.Text bold color={colors.green}>Y</Ink.Text>;
  const n = <Ink.Text color={colors.red}>n</Ink.Text>;

  let choices;

  switch (answer) {
    case "y":
      choices = y;
      break;

    case "n":
      choices = n;
      break;

    default:
      choices = (
        <React.Fragment>
          {y}
          <Ink.Text>/</Ink.Text>
          {n}
        </React.Fragment>
      );
  }

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box>
        {typeof props.message === "object" ? (
          props.message
        ) : (
          <Ink.Text color={colors.yellow}>{props.message}</Ink.Text>
        )}

        <Ink.Text> </Ink.Text>

        <Parens>
          <Ink.Text color={colors.gray}>{choices}</Ink.Text>
        </Parens>
      </Ink.Box>
    </Ink.Box>
  );
}
