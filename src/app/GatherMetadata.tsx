import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import { cli } from "../core/cli.js";
import { invariant } from "../core/invariant.js";
import * as json from "../core/json.js";

import { Await } from "./Await.js";
import { Exit } from "./Exit.js";
import { Store } from "./Store.js";

type Props = {
  children: React.ReactNode;
};

export function GatherMetadata(props: Props) {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  if (argv["mock-metadata"]) {
    return (
      <Await fallback={null} function={mock_metadata}>
        {props.children}
      </Await>
    );
  }

  return (
    <Await fallback={null} function={gather_metadata}>
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

  const head = (await cli("git rev-parse HEAD")).stdout;
  const merge_base = (await cli("git merge-base HEAD master")).stdout;

  // handle when there are no detected changes
  if (head === merge_base) {
    actions.newline();
    actions.output(<Ink.Text color="gray">No changes detected.</Ink.Text>);
    actions.output(<Exit clear code={0} />);
    return;
  }

  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

  const commit_range = await CommitMetadata.range();

  Store.setState((state) => {
    state.head = head;
    state.merge_base = merge_base;
    state.branch_name = branch_name;
    state.commit_range = commit_range;

    state.step = "status";
  });
}
