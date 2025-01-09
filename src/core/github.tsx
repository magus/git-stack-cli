import * as React from "react";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { Store } from "~/app/Store";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";
import { safe_quote } from "~/core/safe_quote";
import { safe_rm } from "~/core/safe_rm";

export async function pr_list(): Promise<Array<PullRequest>> {
  const state = Store.getState();
  const actions = state.actions;

  const username = state.username;
  const repo_path = state.repo_path;
  invariant(username, "username must exist");
  invariant(repo_path, "repo_path must exist");

  const result_pr_list = await gh_json<Array<PullRequest>>(
    `pr list --repo ${repo_path} --author ${username} --state open ${JSON_FIELDS}`
  );

  if (result_pr_list instanceof Error) {
    handle_error(result_pr_list.message);
  }

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

  const pr = await gh_json<PullRequest>(
    `pr view ${branch} --repo ${repo_path} ${JSON_FIELDS}`
  );

  if (pr instanceof Error) {
    return null;
  }

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
  draft: boolean;
};

export async function pr_create(args: CreatePullRequestArgs) {
  const title = safe_quote(args.title);

  // explicit refs/heads head branch to avoid creation failing
  //
  //   ❯ gh pr create --head origin/gs-ED2etrzv2 --base gs-6LAx-On45 --title="2024-01-05 test" --body=""
  //   pull request create failed: GraphQL: Head sha can't be blank, Base sha can't be blank, No commits between gs-6LAx-On45 and origin/gs-ED2etrzv2, Head ref must be a branch (createPullRequest)
  //
  // https://github.com/cli/cli/issues/5465
  let command_parts = [
    "gh pr create",
    `--head refs/heads/${args.branch}`,
    `--base ${args.base}`,
    `--title="${title}"`,
    `--body="${args.body}"`,
  ];

  if (args.draft) {
    command_parts.push("--draft");
  }

  const cli_result = await cli(command_parts);

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
    return null;
  }

  return cli_result.stdout;
}

type EditPullRequestArgs = {
  branch: string;
  base: string;
  body?: string;
};

export async function pr_edit(args: EditPullRequestArgs) {
  const command_parts = [`gh pr edit ${args.branch} --base ${args.base}`];

  let body_file: string | undefined;

  if (args.body) {
    body_file = await write_body_file(args);
    command_parts.push(`--body-file="${body_file}"`);
  }

  const cli_result = await cli(command_parts);

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
  }

  // cleanup body_file
  if (body_file) {
    await safe_rm(body_file);
  }
}

type DraftPullRequestArgs = {
  branch: string;
  draft: boolean;
};

export async function pr_draft(args: DraftPullRequestArgs) {
  // https://cli.github.com/manual/gh_api
  // https://docs.github.com/en/graphql/reference/mutations#convertpullrequesttodraft
  // https://docs.github.com/en/graphql/reference/mutations#markpullrequestreadyforreview

  const mutation_name = args.draft
    ? "convertPullRequestToDraft"
    : "markPullRequestReadyForReview";

  let query = `
    mutation($id: ID!) {
      ${mutation_name}(input: { pullRequestId: $id }) {
        pullRequest {
          id
          number
          isDraft
        }
      }
    }
  `;

  query = query.replace(/\n/g, " ");
  query = query.replace(/\s+/g, " ");
  query = query.trim();

  // lookup id from pr cache using args.branch
  const state = Store.getState();
  const cache_pr = state.pr[args.branch];
  invariant(cache_pr, "cache_pr must exist");

  const command_parts = [
    `gh api graphql -F id="${cache_pr.id}" -f query='${query}'`,
  ];

  const command = command_parts.join(" ");

  const cli_result = await cli(command);

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
  }
}

// prettier-ignore
const JSON_FIELDS = "--json id,number,state,baseRefName,headRefName,commits,title,body,url,isDraft";

// consistent handle gh cli commands returning json
// redirect to tmp file to avoid scrollback overflow causing scrollback to be cleared
async function gh_json<T>(command: string): Promise<T | Error> {
  const tmp_pr_json = path.join(os.tmpdir(), "git-stack-gh.json");

  const options = { ignoreExitCode: true };
  const cli_result = await cli(`gh ${command} > ${tmp_pr_json}`, options);

  if (cli_result.code !== 0) {
    return new Error(cli_result.output);
  }

  // read from file
  const json_str = await fs.readFile(tmp_pr_json, "utf-8");
  const json = JSON.parse(json_str);
  return json;
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
async function write_body_file(args: EditPullRequestArgs) {
  invariant(args.body, "args.body must exist");

  const temp_dir = os.tmpdir();

  // ensure unique filename is safe for filesystem
  // base (group id) might contain slashes, e.g. dev/magus/gs-3cmrMBSUj
  // the flashes would mess up the filesystem path to this file
  let temp_filename = `git-stack-body-${args.base}`;
  temp_filename = temp_filename.replace(RE.non_alphanumeric_dash, "-");

  const temp_path = path.join(temp_dir, temp_filename);

  await safe_rm(temp_path);

  await fs.writeFile(temp_path, args.body);

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
  id: string;
  number: number;
  state: "OPEN" | "MERGED" | "CLOSED";
  baseRefName: string;
  headRefName: string;
  commits: Array<Commit>;
  title: string;
  body: string;
  url: string;
  isDraft: boolean;
};

const RE = {
  non_alphanumeric_dash: /[^a-zA-Z0-9_-]+/g,
};
