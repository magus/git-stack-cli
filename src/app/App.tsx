import * as React from "react";

import * as Ink from "ink";

import { Counter } from "./Counter.js";
import { DependencyCheck } from "./DependencyCheck.js";
import { Store } from "./Store.js";

export function App() {
  const { isFocused } = Ink.useFocus();

  const output = Store.useState((state) => state.output);
  const ink = Store.useState((state) => state.ink);

  if (!ink) {
    return null;
  }

  return (
    <React.Fragment>
      <Ink.Static items={output}>
        {(node, i) => {
          return <Ink.Box key={i}>{node}</Ink.Box>;
        }}
      </Ink.Static>

      <DependencyCheck>
        <Ink.Box flexDirection="column">
          <Ink.Text>Ready</Ink.Text>
          <Ink.Text>focus={String(isFocused)}</Ink.Text>
        </Ink.Box>

        <Counter />
      </DependencyCheck>
    </React.Fragment>
  );
}
