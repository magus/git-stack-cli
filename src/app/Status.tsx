import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { StatusTable } from "~/app/StatusTable";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

export function Status() {
  return <Await fallback={null} function={run} />;
}

async function run() {
  const state = Store.getState();
  const actions = state.actions;
  const argv = state.argv;

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

  if (argv.check) {
    actions.exit(0);
  } else if (needs_rebase) {
    Store.setState((state) => {
      state.step = "pre-local-merge-rebase";
    });
  } else if (needs_update) {
    Store.setState((state) => {
      state.step = "pre-select-commit-ranges";
    });
  } else if (argv.force) {
    Store.setState((state) => {
      state.step = "select-commit-ranges";
    });
  } else {
    actions.output(<Ink.Text>✅ Everything up to date.</Ink.Text>);
    actions.output(
      <Ink.Text color={colors.gray}>
        <Ink.Text>Run with</Ink.Text>
        <Ink.Text bold color={colors.yellow}>
          {` --force `}
        </Ink.Text>
        <Ink.Text>to force update all pull requests.</Ink.Text>
      </Ink.Text>,
    );

    actions.exit(0);
  }
}
