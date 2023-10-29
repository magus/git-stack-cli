import * as React from "react";

import * as Ink from "ink";

import { Store } from "./Store.js";

export function Output() {
  const output = Store.useState((state) => state.output);

  return (
    <Ink.Static items={output}>
      {(node, i) => {
        return <Ink.Box key={i}>{node}</Ink.Box>;
      }}
    </Ink.Static>
  );
}
