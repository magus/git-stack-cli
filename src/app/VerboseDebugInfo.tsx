import * as React from "react";

import path from "node:path";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { pretty_json } from "~/core/pretty_json";

type Props = {
  children: React.ReactNode;
};

export function VerboseDebugInfo(props: Props) {
  const fallback = <Ink.Text color={colors.yellow}>Logging verbose debug information…</Ink.Text>;

  return (
    <Await fallback={fallback} function={run}>
      {props.children}
    </Await>
  );
}

async function run() {
  const actions = Store.getState().actions;

  try {
    await cli(`echo HOME=$HOME`);
    await cli(`echo USER=$USER`);
    await cli(`echo GIT_AUTHOR_NAME=$GIT_AUTHOR_NAME`);
    await cli(`echo GIT_AUTHOR_EMAIL=$GIT_AUTHOR_EMAIL`);

    const PATH = process.env["PATH"];
    const PATH_LIST = pretty_json(PATH.split(path.delimiter));
    actions.debug(`process.env.PATH ${PATH_LIST}`);

    await cli(`git config --list --show-origin`);
  } catch (err) {
    actions.error("Unable to log verbose debug information.");

    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.exit(14);
  }
}
