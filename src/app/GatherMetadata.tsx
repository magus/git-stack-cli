import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import { cli } from "../core/cli.js";
import * as github from "../core/github.js";
import { invariant } from "../core/invariant.js";
import * as json from "../core/json.js";
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
    <Ink.Text color="yellow">Fetching PR status from Github...</Ink.Text>
  );

  if (argv["mock-metadata"]) {
    return (
      <Await fallback={fallback} function={mock_metadata}>
        {props.children}
      </Await>
    );
  }

  return (
    <Await fallback={fallback} function={gather_metadata}>
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
    actions.exit(0);
    return;
  }

  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  const origin_url = (await cli(`git config --get remote.origin.url`)).stdout;
  const repo_path = match_group(origin_url, RE.repo_path, "repo_path");

  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

  Store.setState((state) => {
    state.repo_path = repo_path;
    state.head = head;
    state.merge_base = merge_base;
    state.branch_name = branch_name;
  });

  try {
    const commit_range = await CommitMetadata.range();

    Store.setState((state) => {
      state.commit_range = commit_range;
      state.step = "status";
    });
  } catch (err) {
    actions.output(
      <Ink.Text color="#ef4444">Error gathering metadata.</Ink.Text>
    );

    if (err instanceof Error) {
      actions.debug(<Ink.Text color="#ef4444">{err.message}</Ink.Text>);
    }
  }
}

const RE = {
  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  repo_path: /(?<repo_path>[^:^/]+\/[^/]+)\.git/,
};
