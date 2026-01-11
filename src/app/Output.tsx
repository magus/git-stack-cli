import * as React from "react";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";

export function Output() {
  const output = Store.useState((state) => state.output);
  const pending_output = Store.useState((state) => state.pending_output);

  return (
    <React.Fragment>
      <Ink.Static items={output}>
        {(node, i) => {
          return <Ink.Box key={i}>{node}</Ink.Box>;
        }}
      </Ink.Static>

      {Object.entries(pending_output).map((entry) => {
        const [id, node_list] = entry;
        return (
          <Ink.Box key={id} flexDirection="column">
            {node_list}
          </Ink.Box>
        );
      })}
    </React.Fragment>
  );
}
