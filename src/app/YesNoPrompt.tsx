import * as React from "react";

import * as Ink from "ink-cjs";

import { FormatText } from "~/app/FormatText";
import { Parens } from "~/app/Parens";
import { colors } from "~/core/colors";

type Handler = () => void;

type Props = {
  message: React.ReactNode;
  onYes: Handler;
  onNo: Handler;
};

export function YesNoPrompt(props: Props) {
  const [answer, set_answer] = React.useState("");

  const answered_ref = React.useRef(false);

  Ink.useInput((input) => {
    // prevent answering multiple times
    if (answered_ref.current) {
      return;
    }

    const input_lower = input.toLowerCase();

    let handler: undefined | Handler;

    switch (input_lower) {
      case "n":
        handler = props.onNo;
        break;

      case "y":
        handler = props.onYes;
        break;
    }

    // handler if valid answer (y or n)
    if (handler) {
      answered_ref.current = true;
      set_answer(input_lower);
      handler();
    }
  });

  const choices = (function get_choices() {
    // prettier-ignore
    const y = <Ink.Text bold color={colors.green}>Y</Ink.Text>;
    const n = <Ink.Text color={colors.red}>n</Ink.Text>;

    switch (answer) {
      case "y":
        return y;

      case "n":
        return n;

      default:
        return <FormatText message="{y}/{n}" values={{ y, n }} />;
    }
  })();

  return (
    <Ink.Box flexDirection="column">
      <Ink.Box alignItems="flex-end">
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
