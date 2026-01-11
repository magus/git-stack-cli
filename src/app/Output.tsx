import * as React from "react";

import * as Ink from "ink-cjs";

import { DebugOutput } from "~/app/DebugOutput";
import { Store } from "~/app/Store";

export function Output() {
  const output = Store.useState((state) => state.output);
  const pending_output = Store.useState((state) => state.pending_output);

  return (
    <React.Fragment>
      <Ink.Static items={output}>
        {(entry) => {
          const [id, node] = entry;
          return <Ink.Box key={id}>{node}</Ink.Box>;
        }}
      </Ink.Static>

      {Object.entries(pending_output).map((entry) => {
        const [id, content_list] = entry;
        const content = content_list.join("");
        return <DebugOutput key={id} node={content} />;
      })}
    </React.Fragment>
  );
}
