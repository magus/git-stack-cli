import * as React from "react";

import fs from "node:fs";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Command } from "~/app/Command";
import { Store } from "~/app/Store";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";

type Props = {
  children: React.ReactNode;
};

type State = {
  status: "init" | "prompt" | "done";
};

function reducer(state: State, patch: Partial<State>) {
  return { ...state, ...patch };
}

export function CherryPickCheck(props: Props) {
  const actions = Store.useActions();

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
              <Command>git cherry-pick</Command> detected, would you like to
              abort it?
            </Ink.Text>
          }
          onYes={async () => {
            await cli(`git cherry-pick --abort`);
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
          function={run}
          fallback={
            <Ink.Text color={colors.yellow}>
              Checking for <Command>git cherry-pick</Command>…
            </Ink.Text>
          }
        />
      );
  }

  async function run() {
    const actions = Store.getState().actions;

    try {
      const git_dir = (await cli(`git rev-parse --absolute-git-dir`)).stdout;

      const is_cherry_pick = fs.existsSync(
        path.join(git_dir, "CHERRY_PICK_HEAD")
      );

      const status = is_cherry_pick ? "prompt" : "done";
      patch({ status });
    } catch (err) {
      actions.error("Must be run from within a git repository.");

      if (err instanceof Error) {
        if (actions.isDebug()) {
          actions.error(err.message);
        }
      }

      actions.exit(11);
    }
  }
}
