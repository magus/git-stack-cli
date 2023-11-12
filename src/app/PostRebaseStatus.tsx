import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { StatusTable } from "./StatusTable.js";
import { Store } from "./Store.js";

export function PostRebaseStatus() {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  return <Await fallback={null} function={run} />;
}

async function run() {
  const actions = Store.getState().actions;

  // reset github pr cache before refreshing via commit range below
  actions.reset_pr();

  const commit_range = await CommitMetadata.range();

  actions.set((state) => {
    state.commit_range = commit_range;
  });

  actions.output(<StatusTable />);

  actions.output(<Ink.Text>✅ Everything up to date.</Ink.Text>);
}
