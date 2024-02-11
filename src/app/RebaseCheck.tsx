import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

type Props = {
  children: React.ReactNode;
};

type State = {
  status: "init" | "prompt" | "done";
};

function reducer(state: State, patch: Partial<State>) {
  return { ...state, ...patch };
}

export function RebaseCheck(props: Props) {
  const actions = Store.useActions();
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  const [state, patch] = React.useReducer(reducer, {
    status: "init",
  });

  switch (state.status) {
    case "done":
      return props.children;

    case "prompt":
      return (
        <YesNoPrompt
          message={
            <Ink.Text color={colors.yellow}>
              Rebase detected, would you like to abort it?
            </Ink.Text>
          }
          onYes={async () => {
            await cli(`git rebase --abort`);
            patch({ status: "done" });
          }}
          onNo={async () => {
            actions.exit(0);
          }}
        />
      );

    default:
      return (
        <Await
          fallback={
            <Ink.Text color={colors.yellow}>Checking for rebase...</Ink.Text>
          }
          function={rebase_check}
        />
      );
  }

  async function rebase_check() {
    const actions = Store.getState().actions;
    const argv = Store.getState().argv;

    invariant(argv, "argv must exist");

    try {
      const repo_root = (await cli(`git rev-parse --absolute-git-dir`)).stdout;

      let is_rebase = false;
      is_rebase ||= fs.existsSync(path.join(repo_root, "rebase-apply"));
      is_rebase ||= fs.existsSync(path.join(repo_root, "rebase-merge"));

      const status = is_rebase ? "prompt" : "done";
      patch({ status });
    } catch (err) {
      actions.error("Unable to check for rebase.");

      if (err instanceof Error) {
        if (actions.isDebug()) {
          actions.error(err.message);
        }
      }

      actions.exit(9);
    }
  }
}
