import * as React from "react";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";

export function render_node(node: React.ReactNode) {
  const actions = Store.getState().actions;

  if (node == null) {
    return null;
  }

  if (React.isValidElement(node)) {
    return node;
  }

  if (Array.isArray(node)) {
    return (
      <React.Fragment>
        {node.map((entry, index) => (
          <React.Fragment key={index}>{render_node(entry)}</React.Fragment>
        ))}
      </React.Fragment>
    );
  }

  switch (typeof node) {
    case "string":
    case "number":
    case "boolean":
      return <Ink.Text>{String(node)}</Ink.Text>;
    default:
      actions.debug(`unhandled node ${typeof node}`);
      return null;
  }
}
