import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import { invariant } from "../core/invariant.js";
import * as json from "../core/json.js";

import { Await } from "./Await.js";
import { Store } from "./Store.js";

type Props = {
  children: React.ReactNode;
};

export function LocalCommitStatus(props: Props) {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  const fallback = (
    <Ink.Text color="yellow">Fetching PR status from Github...</Ink.Text>
  );

  if (argv["mock-metadata"]) {
    return (
      <Await fallback={fallback} function={mock_metadata}>
        {props.children}
      </Await>
    );
  }

  return (
    <Await fallback={fallback} function={gather_metadata}>
      {props.children}
    </Await>
  );
}

async function mock_metadata() {
  const module = await import("../__fixtures__/metadata.js");

  const deserialized = json.deserialize(module.METADATA);

  Store.setState((state) => {
    Object.assign(state, deserialized);

    state.step = "status";
  });
}

async function gather_metadata() {
  const actions = Store.getState().actions;

  try {
    const commit_range = await CommitMetadata.range();

    Store.setState((state) => {
      state.commit_range = commit_range;
      state.step = "status";
    });
  } catch (err) {
    actions.error("Unable to retrieve local commit status.");

    if (err instanceof Error) {
      if (actions.debug()) {
        actions.error(err.message);
      }
    }
  }
}
