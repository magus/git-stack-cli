import * as React from "react";

import * as Ink from "ink";

import * as CommitMetadata from "../core/CommitMetadata.js";
import { cli } from "../core/cli.js";
import { invariant } from "../core/invariant.js";

import { Await } from "./Await.js";
import { Exit } from "./Exit.js";
import { Store } from "./Store.js";

import type { Argv } from "../command.js";

type Props = {
  children: React.ReactNode;
};

export function GatherMetadata(props: Props) {
  const argv = Store.useState((state) => state.argv);
  invariant(argv, "argv must exist");

  return (
    <Await fallback={null} function={() => gather_metadata({ argv })}>
      {props.children}
    </Await>
  );
}

type Args = {
  argv: Argv;
};

async function gather_metadata(args: Args) {
  const actions = Store.getState().actions;

  const head = (await cli("git rev-parse HEAD")).stdout;
  const merge_base = (await cli("git merge-base HEAD master")).stdout;

  // handle when there are no detected changes
  if (head === merge_base) {
    actions.newline();
    actions.output(<Ink.Text color="gray">No changes detected.</Ink.Text>);
    actions.output(<Exit clear code={0} />);
    return;
  }

  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

  const commit_metadata_list = await CommitMetadata.all();

  Store.setState((state) => {
    state.head = head;
    state.merge_base = merge_base;
    state.branch_name = branch_name;
    state.commit_metadata_list = commit_metadata_list;
  });

  // TODO output table of commits
  // print_table(repo_path, commit_metadata_list);

  // TODO this check will become more complex with commit ranges
  const needs_update = commit_metadata_list.some(
    (meta) => !meta.pr_exists || meta.pr_dirty
  );

  if (args.argv.check) {
    actions.output(<Exit clear code={0} />);
    return;
  }

  if (!args.argv.force && !needs_update) {
    actions.newline();
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
    actions.output(<Exit clear code={0} />);
  }

  Store.setState((state) => {
    state.step = "select-commit-ranges";
  });
}
