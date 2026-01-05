import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import * as CommitMetadata from "~/core/CommitMetadata";
import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

export function LocalCommitStatus(props: Props) {
  return (
    <Await
      fallback={<Ink.Text color={colors.yellow}>Fetching PR status from Github…</Ink.Text>}
      function={run}
    >
      {props.children}
    </Await>
  );
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
      actions.error(err.message);
    }
  }
}
