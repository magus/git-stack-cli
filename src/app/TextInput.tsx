import * as React from "react";

import * as Ink from "ink";

type Props = {
  multiline?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export function TextInput(props: Props) {
  const [value, set_value] = React.useState(get_value(props));

  React.useEffect(
    function sync_value_prop() {
      set_value(get_value(props));
    },
    [props.value]
  );

  const [caret_visible, set_caret_visible] = React.useState(false);

  React.useEffect(function blink_caret() {
    const interval_ms = 500;

    let timeoutId = setTimeout(tick, interval_ms);

    function tick() {
      set_caret_visible((visible) => !visible);
      timeoutId = setTimeout(tick, interval_ms);
    }

    return function cleanup() {
      clearTimeout(timeoutId);
    };
  }, []);

  Ink.useInput((input, key) => {
    let next_value = value;

    // console.debug("[useInput]", { input, key });

    if (key.backspace || key.delete) {
      next_value = value.slice(0, -1);
    } else if (key.return) {
      props.onSubmit?.(next_value);
    } else {
      switch (input) {
        case "\r":
          if (props.multiline) {
            next_value = `${value}\n`;
          }

          break;

        default:
          next_value = `${value}${input}`;
      }
    }

    set_value(next_value);
    props.onChange?.(next_value);
  });

  // console.debug("[TextInput]", { value });

  return (
    <Ink.Box
      borderStyle="single"
      minHeight={1}
      borderColor="yellow"
      borderDimColor
    >
      <Ink.Text>{value || ""}</Ink.Text>

      <Ink.Text color="yellow" dimColor inverse={caret_visible}>
        {" "}
      </Ink.Text>
    </Ink.Box>
  );
}

function get_value(props: Props) {
  return props.value || "";
}
