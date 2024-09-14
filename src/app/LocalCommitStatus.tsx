import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { colors } from "~/core/colors";
import * as json from "~/core/json";

type Props = {
  children: React.ReactNode;
};

export function LocalCommitStatus(props: Props) {
  const argv = Store.useState((state) => state.argv);

  const fallback = (
    <Ink.Text color={colors.yellow}>Fetching PR status from Github…</Ink.Text>
  );

  if (argv["mock-metadata"]) {
    return (
      <Await fallback={fallback} function={mock_metadata}>
        {props.children}
      </Await>
    );
  }

  return (
    <Await fallback={fallback} function={run}>
      {props.children}
    </Await>
  );
}

async function mock_metadata() {
  const module = await import("../__fixtures__/metadata");

  const deserialized = json.deserialize(module.METADATA);

  Store.setState((state) => {
    Object.assign(state, deserialized);
    state.step = "status";
  });
}

async function run() {
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
      if (actions.isDebug()) {
        actions.error(err.message);
      }
    }
  }
}
