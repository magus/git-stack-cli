import * as React from "react";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { StatusTable } from "./StatusTable.js";
import { Store } from "./Store.js";

import type { Argv } from "../command.js";

export function Status() {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  return <Await fallback={null} function={() => run({ argv })} />;
}

type Args = {
  argv: Argv;
};

async function run(args: Args) {
  const actions = Store.getState().actions;
  const commit_range = Store.getState().commit_range;

  invariant(commit_range, "commit_range must exist");

  actions.output(<StatusTable />);

  let needs_rebase = false;
  let needs_update = false;

  for (const group of commit_range.group_list) {
    if (group.dirty) {
      needs_update = true;
    }

    if (group.pr?.state === "MERGED") {
      needs_rebase = true;
    }
  }

  for (let i = 0; i < commit_range.commit_list.length; i++) {
    const commit = commit_range.commit_list[i];
    const commit_pr = commit_range.pr_lookup[commit.branch_id || ""];

    if (commit.branch_id && !commit_pr) {
      needs_rebase = true;
    }
  }

  if (args.argv.check) {
    actions.exit(0);
  } else if (needs_rebase) {
    Store.setState((state) => {
      state.step = "pre-local-merge-rebase";
    });
  } else if (needs_update) {
    Store.setState((state) => {
      state.step = "pre-select-commit-ranges";
    });
  } else if (args.argv.force) {
    Store.setState((state) => {
      state.step = "select-commit-ranges";
    });
  } else {
    actions.output(<Ink.Text>✅ Everything up to date.</Ink.Text>);
    actions.output(
      <Ink.Text color="gray">
        <Ink.Text>Run with</Ink.Text>
        <Ink.Text bold color="yellow">
          {` --force `}
        </Ink.Text>
        <Ink.Text>to force update all pull requests.</Ink.Text>
      </Ink.Text>
    );

    actions.exit(0);
  }
}
