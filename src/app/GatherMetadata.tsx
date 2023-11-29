import * as React from "react";

import * as Ink from "ink";

import { cli } from "../core/cli.js";
import { colors } from "../core/colors.js";
import { invariant } from "../core/invariant.js";
import { match_group } from "../core/match_group.js";

import { Await } from "./Await.js";
import { Store } from "./Store.js";

type Props = {
  children: React.ReactNode;
};

export function GatherMetadata(props: Props) {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  const fallback = (
    <Ink.Text color={colors.yellow}>
      Gathering local git information...
    </Ink.Text>
  );

  return (
    <Await fallback={fallback} function={gather_metadata}>
      {props.children}
    </Await>
  );
}

async function gather_metadata() {
  const actions = Store.getState().actions;

  try {
    const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

    // handle when there are no detected changes
    if (branch_name === "master") {
      actions.newline();
      actions.error("Must run within a branch.");
      actions.exit(0);
      return;
    }

    const head = (await cli("git rev-parse HEAD")).stdout;
    const merge_base = (await cli("git merge-base HEAD master")).stdout;

    // handle when there are no detected changes
    if (head === merge_base) {
      actions.newline();
      actions.output(
        <Ink.Text color={colors.gray}>No changes detected.</Ink.Text>
      );
      actions.exit(0);
      return;
    }

    // git@github.com:magus/git-multi-diff-playground.git
    // https://github.com/magus/git-multi-diff-playground.git
    const origin_url = (await cli(`git config --get remote.origin.url`)).stdout;
    const repo_path = match_group(origin_url, RE.repo_path, "repo_path");

    Store.setState((state) => {
      state.repo_path = repo_path;
      state.head = head;
      state.merge_base = merge_base;
      state.branch_name = branch_name;
    });
  } catch (err) {
    actions.error("Unable to gather git metadata.");

    if (err instanceof Error) {
      if (actions.isDebug()) {
        actions.error(err.message);
      }
    }
  }
}

const RE = {
  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  repo_path: /(?<repo_path>[^:^/]+\/[^/]+)\.git/,
};
