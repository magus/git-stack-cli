import * as React from "react";

import * as Ink from "ink-cjs";
import cloneDeep from "lodash/cloneDeep";

import { Await } from "~/app/Await";
import { Brackets } from "~/app/Brackets";
import { Command } from "~/app/Command";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { Url } from "~/app/Url";
import { YesNoPrompt } from "~/app/YesNoPrompt";
import * as CommitMetadata from "~/core/CommitMetadata";
import { GitReviseTodo } from "~/core/GitReviseTodo";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import * as github from "~/core/github";
import { invariant } from "~/core/invariant";

type Props = {
  children: React.ReactNode;
};

type PullRequest = NonNullable<Awaited<ReturnType<typeof github.pr_status>>>;

type State = {
  status: "init" | "prompt" | "revise" | "done";
  pr: null | PullRequest;
};

function reducer(state: State, patch: Partial<State>) {
  return { ...state, ...patch };
}

export function DetectInitialPR(props: Props) {
  const actions = Store.useActions();
  const branch_name = Store.useState((state) => state.branch_name);

  const [state, patch] = React.useReducer(reducer, {
    status: "init",
    pr: null,
  });

  switch (state.status) {
    case "done":
      return props.children;

    case "revise":
      return (
        <Await
          function={run_revise}
          fallback={
            <Ink.Text color={colors.yellow}>
              Synchronizing local commit metadata with remote branch on Github…
            </Ink.Text>
          }
        />
      );

    case "prompt":
      return (
        <YesNoPrompt
          message={
            <Ink.Box flexDirection="column">
              <FormatText
                wrapper={<Ink.Text color={colors.yellow} />}
                message="{branch_name} exists on Github and was not generated with {git_stack}."
                values={{
                  branch_name: <Brackets>{branch_name}</Brackets>,
                  git_stack: <Command>git stack</Command>,
                }}
              />
              <Ink.Text> </Ink.Text>
              <FormatText
                message="  {url}"
                values={{
                  url: <Url>{state.pr?.url}</Url>,
                }}
              />
              <Ink.Text> </Ink.Text>
              <FormatText
                wrapper={<Ink.Text color={colors.yellow} />}
                message="In order to synchronize we need to rename your local branch, would you like to proceed?"
              />
            </Ink.Box>
          }
          onYes={async () => {
            patch({ status: "revise" });
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
          fallback={<Ink.Text color={colors.yellow}>Checking for existing PR on Github…</Ink.Text>}
        />
      );
  }

  async function run() {
    const actions = Store.getState().actions;
    const branch_name = Store.getState().branch_name;
    const commit_range = Store.getState().commit_range;

    invariant(branch_name, "branch_name must exist");
    invariant(commit_range, "branch_name must exist");

    try {
      let has_existing_metadata = false;
      for (const commit of commit_range.commit_list) {
        if (commit.branch_id) {
          has_existing_metadata = true;
          break;
        }
      }

      if (!has_existing_metadata) {
        // check for pr with matching branch name to initialize group
        const pr = await github.pr_status(branch_name);

        if (pr && pr.state === "OPEN") {
          return patch({ status: "prompt", pr });
        }
      }

      patch({ status: "done" });
    } catch (err) {
      actions.error("Must be run from within a git repository.");

      if (err instanceof Error) {
        if (actions.isDebug()) {
          actions.error(err.message);
        }
      }

      actions.exit(9);
    }
  }

  async function run_revise() {
    const actions = Store.getState().actions;
    const master_branch = Store.getState().master_branch;
    const branch_name = Store.getState().branch_name;
    const commit_range = cloneDeep(Store.getState().commit_range);

    invariant(branch_name, "branch_name must exist");
    invariant(commit_range, "branch_name must exist");

    for (const group of commit_range.group_list) {
      group.id = branch_name;
      group.title = state.pr?.title || "-";
      for (const commit of commit_range.commit_list) {
        commit.branch_id = group.id;
        commit.title = group.title;
      }
    }

    // get latest merge_base relative to local master
    const rebase_group_index = 0;

    const rebase_merge_base = (await cli(`git merge-base HEAD ${master_branch}`)).stdout;

    await GitReviseTodo.execute({
      rebase_group_index,
      rebase_merge_base,
      commit_range,
    });

    const new_branch_name = `${branch_name}-sync`;
    await cli(`git checkout -b ${new_branch_name}`);

    await cli(`git branch -D ${branch_name}`);

    const commit_range_new = await CommitMetadata.range();

    actions.set((state) => {
      state.branch_name = new_branch_name;
      state.commit_range = commit_range_new;
    });

    patch({ status: "done" });
  }
}
