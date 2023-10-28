import React from "react";

import { Text } from "ink";

import type { Argv } from "../command.js";

type Props = {
  argv: Argv;
};

export function Counter(props: Props) {
  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prevCounter) => prevCounter + 1);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Text color="green">
      {counter} tests passed (force: {String(props.argv.force)})
    </Text>
  );
}
