import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

type Props = {
  children: React.ReactNode;
};

export function RequireBranch(props: Props) {
  const fallback = <Ink.Text color={colors.yellow}>Gathering local git information…</Ink.Text>;

  return (
    <Await fallback={fallback} function={run}>
      {props.children}
    </Await>
  );
}

async function run() {
  const state = Store.getState();
  const actions = Store.getState().actions;
  const master_branch = state.master_branch;
  const head = state.head;
  const branch_name = state.branch_name;
  const merge_base = state.merge_base;

  invariant(head, "head must exist");
  invariant(branch_name, "branch_name must exist");
  invariant(merge_base, "merge_base must exist");

  try {
    // handle detahed head state
    if (branch_name === "HEAD") {
      actions.error("Must run within a branch.");
      actions.exit(0);
      return;
    }

    // handle when there are no detected changes
    if (`origin/${branch_name}` === master_branch) {
      actions.error("Must run within a branch.");
      actions.exit(0);
      return;
    }

    // handle when there are no detected changes
    if (head === merge_base) {
      actions.newline();
      actions.output(<Ink.Text color={colors.gray}>No changes detected.</Ink.Text>);
      actions.exit(0);
      return;
    }
  } catch (err) {
    actions.error("Unable to detect branch changes.");

    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.exit(17);
  }
}
