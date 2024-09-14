import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
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

export function DirtyCheck(props: Props) {
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
            <Ink.Box flexDirection="column">
              <FormatText
                wrapper={<Ink.Text color={colors.yellow} />}
                message="{git} repo has uncommitted changes."
                values={{
                  git: <Command>git</Command>,
                  git_stack: <Command>git stack</Command>,
                }}
              />
              <FormatText
                wrapper={<Ink.Text color={colors.yellow} />}
                message="Changes may be lost during {git_stack}, are you sure you want to proceed?"
                values={{
                  git: <Command>git</Command>,
                  git_stack: <Command>git stack</Command>,
                }}
              />
            </Ink.Box>
          }
          onYes={async () => {
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
              Ensuring <Command>git status --porcelain</Command>…
            </Ink.Text>
          }
        />
      );
  }

  async function run() {
    const actions = Store.getState().actions;

    try {
      const git_dirty = (await cli(`git status --porcelain`)).stdout;

      const status = git_dirty ? "prompt" : "done";
      patch({ status });
    } catch (err) {
      actions.error("Must be run from within a git repository.");

      if (err instanceof Error) {
        if (actions.isDebug()) {
          actions.error(err.message);
        }
      }

      actions.exit(12);
    }
  }
}
