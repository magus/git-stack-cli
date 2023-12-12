import * as React from "react";

import * as Ink from "ink";

import { Store } from "./Store.js";

export function Output() {
  const output = Store.useState((state) => state.output);
  const pending_output = Store.useState((state) => state.pending_output);
  const pending_output_items = Object.values(pending_output);

  return (
    <React.Fragment>
      <Ink.Static items={output}>
        {(node, i) => {
          return <Ink.Box key={i}>{node}</Ink.Box>;
        }}
      </Ink.Static>

      {pending_output_items.map((node_list, i) => {
        return (
          <Ink.Box key={i}>
            <Ink.Text>
              {node_list.map((text, j) => {
                return (
                  <React.Fragment key={j}>
                    <Ink.Text>{text}</Ink.Text>
                  </React.Fragment>
                );
              })}
            </Ink.Text>
          </Ink.Box>
        );
      })}
    </React.Fragment>
  );
}
