import * as React from "react";

import * as Ink from "ink";

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
      <Ink.Box height={1} />

      <Ink.Box>
        <Ink.Text color="yellow">{props.message}</Ink.Text>

        <Ink.Text> </Ink.Text>

        <Ink.Text color="blue">
          (
          <Ink.Text color="gray">
            <Ink.Text color="green" dimColor>
              Y
            </Ink.Text>
            /
            <Ink.Text color="red" dimColor>
              n
            </Ink.Text>
          </Ink.Text>
          )
        </Ink.Text>
      </Ink.Box>
    </Ink.Box>
  );
}
