import * as React from "react";

import * as Ink from "ink-cjs";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { match_group } from "~/core/match_group";

type Props = {
  children: React.ReactNode;
};

export function GatherMetadata(props: Props) {
  const fallback = <Ink.Text color={colors.yellow}>Gathering local git information…</Ink.Text>;

  return (
    <Await fallback={fallback} function={run}>
      {props.children}
    </Await>
  );
}

async function run() {
  const actions = Store.getState().actions;
  const argv = Store.getState().argv;

  try {
    // default to master branch, fallback to main
    let master_branch: string;

    if (argv.branch) {
      actions.debug(
        <FormatText
          message="Setting master branch to {branch}"
          values={{
            branch: <Brackets>{argv.branch}</Brackets>,
          }}
        />,
      );

      master_branch = argv.branch;
    } else {
      const detect_master = await cli(
        `git branch --list --remote "${BRANCH.master}" --color=never`,
      );

      if (detect_master.stdout !== "") {
        master_branch = BRANCH.master;
      } else {
        actions.debug(
          <FormatText
            message="Could not find {master} branch, falling back to {main}"
            values={{
              master: <Brackets>{BRANCH.master}</Brackets>,
              main: <Brackets>{BRANCH.main}</Brackets>,
            }}
          />,
        );

        master_branch = BRANCH.main;
      }
    }

    actions.debug(`master_branch = ${master_branch}`);

    const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

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

    const head = (await cli("git rev-parse HEAD")).stdout;
    const merge_base = (await cli(`git merge-base HEAD ${master_branch}`)).stdout;

    // handle when there are no detected changes
    if (head === merge_base) {
      actions.newline();
      actions.output(<Ink.Text color={colors.gray}>No changes detected.</Ink.Text>);
      actions.exit(0);
      return;
    }

    // git@github.com:magus/git-multi-diff-playground.git
    // https://github.com/magus/git-multi-diff-playground.git
    const origin_url = (await cli(`git config --get remote.origin.url`)).stdout;
    const repo_path = match_group(origin_url, RE.repo_path, "repo_path");

    const repo_root = (await cli(`git rev-parse --show-toplevel`)).stdout;

    Store.setState((state) => {
      state.repo_path = repo_path;
      state.repo_root = repo_root;
      state.master_branch = master_branch;
      state.head = head;
      state.branch_name = branch_name;
    });
  } catch (err) {
    actions.error("Unable to gather git metadata.");

    if (err instanceof Error) {
      actions.error(err.message);
    }

    actions.exit(7);
  }
}

const RE = {
  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  repo_path: /(?<repo_path>[^:^/]+\/[^/]+)\.git/,
};

const BRANCH = {
  master: "origin/master",
  main: "origin/main",
};
