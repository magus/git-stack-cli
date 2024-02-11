import * as React from "react";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as Ink from "ink";

import { Brackets } from "~/app/Brackets";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { safe_quote } from "~/core/safe_quote";

// prettier-ignore
const JSON_FIELDS = "--json number,state,baseRefName,headRefName,commits,title,body,url";

export async function pr_list(): Promise<Array<PullRequest>> {
  const state = Store.getState();
  const actions = state.actions;

  const username = state.username;
  const repo_path = state.repo_path;
  invariant(username, "username must exist");
  invariant(repo_path, "repo_path must exist");

  const cli_result = await cli(
    `gh pr list --repo ${repo_path} --author ${username} --state open ${JSON_FIELDS}`,
    {
      ignoreExitCode: true,
    }
  );

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
  }

  const result_pr_list: Array<PullRequest> = JSON.parse(cli_result.stdout);

  if (actions.isDebug()) {
    actions.output(
      <Ink.Text dimColor>
        <Ink.Text>{"Github cache "}</Ink.Text>
        <Ink.Text bold color={colors.yellow}>
          {result_pr_list.length}
        </Ink.Text>
        <Ink.Text>{" open PRs from "}</Ink.Text>
        <Brackets>{repo_path}</Brackets>
        <Ink.Text>{" authored by "}</Ink.Text>
        <Brackets>{username}</Brackets>
      </Ink.Text>
    );
  }

  actions.set((state) => {
    for (const pr of result_pr_list) {
      state.pr[pr.headRefName] = pr;
    }
  });

  return result_pr_list;
}

export async function pr_status(branch: string): Promise<null | PullRequest> {
  const state = Store.getState();
  const actions = state.actions;

  const username = state.username;
  const repo_path = state.repo_path;
  invariant(username, "username must exist");
  invariant(repo_path, "repo_path must exist");

  const cache = state.pr[branch];

  if (cache) {
    if (actions.isDebug()) {
      actions.output(
        <Ink.Text>
          <Ink.Text dimColor>Github pr_status cache</Ink.Text>
          <Ink.Text> </Ink.Text>
          <Ink.Text bold color={colors.green}>
            {"HIT "}
          </Ink.Text>
          <Ink.Text> </Ink.Text>
          <Ink.Text dimColor>{branch}</Ink.Text>
        </Ink.Text>
      );
    }

    return cache;
  }

  if (actions.isDebug()) {
    actions.output(
      <Ink.Text>
        <Ink.Text dimColor>Github pr_status cache</Ink.Text>
        <Ink.Text> </Ink.Text>
        <Ink.Text bold color={colors.red}>
          MISS
        </Ink.Text>
        <Ink.Text> </Ink.Text>
        <Ink.Text dimColor>{branch}</Ink.Text>
      </Ink.Text>
    );
  }

  const cli_result = await cli(
    `gh pr view ${branch} --repo ${repo_path} ${JSON_FIELDS}`,
    {
      ignoreExitCode: true,
    }
  );

  if (cli_result.code !== 0) {
    // handle_error(cli_result.output);
    return null;
  }

  const pr: PullRequest = JSON.parse(cli_result.stdout);

  actions.set((state) => {
    state.pr[pr.headRefName] = pr;
  });

  return pr;
}

type CreatePullRequestArgs = {
  branch: string;
  base: string;
  title: string;
  body: string;
};

export async function pr_create(args: CreatePullRequestArgs) {
  const title = safe_quote(args.title);

  const cli_result = await cli(
    `gh pr create --fill --head ${args.branch} --base ${args.base} --title="${title}" --body="${args.body}"`
  );

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
    return null;
  }

  return cli_result.stdout;
}

type EditPullRequestArgs = {
  branch: string;
  base: string;
  body: string;
};

export async function pr_edit(args: EditPullRequestArgs) {
  const cli_result = await cli(
    // prettier-ignore
    `gh pr edit ${args.branch} --base ${args.base} --body-file="${body_file(args.body)}"`
  );

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
  }
}

function handle_error(output: string): never {
  const state = Store.getState();
  const actions = state.actions;

  actions.set((state) => {
    state.step = "github-api-error";
  });

  throw new Error(output);
}

// convert a string to a file for use via github cli `--body-file`
function body_file(body: string) {
  const temp_dir = os.tmpdir();
  const temp_path = path.join(temp_dir, "git-stack-body");
  if (fs.existsSync(temp_path)) {
    fs.rmSync(temp_path);
  }
  fs.writeFileSync(temp_path, body);
  return temp_path;
}

type Commit = {
  authoredDate: string; // "2023-10-22T23:13:35Z"
  authors: [
    {
      email: string;
      id: string;
      login: string; // magus
      name: string; // magus
    },
  ];
  committedDate: string; // "2023-10-23T08:41:27Z"
  messageBody: string;
  messageHeadline: string;
  oid: string; // "ce7eadaa73518a92ae6a892c1e54c4f4afa6fbdd"
};

export type PullRequest = {
  number: number;
  state: "OPEN" | "MERGED" | "CLOSED";
  baseRefName: string;
  headRefName: string;
  commits: Array<Commit>;
  title: string;
  body: string;
  url: string;
};
