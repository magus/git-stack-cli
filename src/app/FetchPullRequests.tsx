import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { colors } from "~/core/colors";
import * as github from "~/core/github";

type Props = {
  children: React.ReactNode;
};

export function FetchPullRequests(props: Props) {
  const fallback = <Ink.Text color={colors.yellow}>Fetching pull requests…</Ink.Text>;

  return (
    <Await fallback={fallback} function={run}>
      {props.children}
    </Await>
  );
}

async function run() {
  const actions = Store.getState().actions;

  try {
    // gather all open prs in repo at once
    // cheaper query to populate cache
    await github.pr_list();
  } catch (err) {
    actions.error("Unable to fetch pull requests.");

    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.exit(24);
  }
}
