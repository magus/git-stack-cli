import * as React from "react";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";

export function Update() {
  return <Await fallback={null} function={run} />;
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;

  actions.exit(0);
}
