import * as React from "react";

import * as Ink from "ink";

export function Counter() {
  const { isFocused } = Ink.useFocus();

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
    <Ink.Text color="green">
      {counter} tests passed (focus:{String(isFocused)})
    </Ink.Text>
  );
}
