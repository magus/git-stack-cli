import * as React from "react";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import * as Ink from "ink-cjs";

import { Brackets } from "~/app/Brackets";
import { FormatText } from "~/app/FormatText";
import { Store } from "~/app/Store";
import { Timer } from "~/core/Timer";
import { cli } from "~/core/cli";
import { colors } from "~/core/colors";
import { get_tmp_dir } from "~/core/get_tmp_dir";
import { invariant } from "~/core/invariant";
import { safe_quote } from "~/core/safe_quote";
import { safe_rm } from "~/core/safe_rm";

export async function pr_list(): Promise<Array<PullRequest>> {
  const state = Store.getState();
  const actions = state.actions;

  const timer = Timer();
  actions.debug("start github.pr_list");

  const username = state.username;
  const repo_path = state.repo_path;
  invariant(username, "username must exist");
  invariant(repo_path, "repo_path must exist");

  const result_pr_list = await gh_json<Array<PullRequest>>(
    `pr list --repo ${repo_path} --author ${username} --state open ${JSON_FIELDS}`,
  );

  if (result_pr_list instanceof Error) {
    handle_error(result_pr_list.message);
  }

  if (actions.isDebug()) {
    actions.output(
      <FormatText
        wrapper={<Ink.Text dimColor />}
        message="Github cache {count} open PRs from {repo_path} authored by {username}"
        values={{
          count: (
            <Ink.Text bold color={colors.yellow}>
              {result_pr_list.length}
            </Ink.Text>
          ),
          repo_path: <Brackets>{repo_path}</Brackets>,
          username: <Brackets>{username}</Brackets>,
        }}
      />,
    );
  }

  actions.set((state) => {
    for (const pr of result_pr_list) {
      state.pr[pr.headRefName] = pr;
    }
  });

  const duration = timer.duration();
  actions.debug(`end github.pr_list (duration=${duration})`);
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
      actions.debug(
        cache_message({
          hit: true,
          message: "Github pr_status cache",
          extra: branch,
        }),
      );
    }

    return cache;
  }

  if (actions.isDebug()) {
    actions.debug(
      cache_message({
        hit: false,
        message: "Github pr_status cache",
        extra: branch,
      }),
    );
  }

  const commmand = `pr view ${branch} --repo ${repo_path} ${JSON_FIELDS}`;
  const pr = await gh_json<PullRequest>(commmand, { branch });

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
  //   ❯ gh pr create --head refs/heads/gs-ED2etrzv2 --base gs-6LAx-On45 --title="2024-01-05 test" --body=""
  //   pull request create failed: GraphQL: Head sha can't be blank, Base sha can't be blank, No commits between gs-6LAx-On45 and origin/gs-ED2etrzv2, Head ref must be a branch (createPullRequest)
  //
  // https://github.com/cli/cli/issues/5465

  const base = args.base.replace(/^origin\//, "");

  let command_parts = [
    "gh pr create",
    `--head refs/heads/${args.branch}`,
    `--base ${base}`,
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
  base?: string;
  body?: string;
};

export async function pr_edit(args: EditPullRequestArgs) {
  // const state = Store.getState();
  // const actions = state.actions;
  // actions.debug(`github.pr_edit ${JSON.stringify(args)}`);

  if (!args.base && !args.body) {
    return;
  }

  const command_parts = [`gh pr edit ${args.branch}`];

  if (args.base) {
    const base = args.base.replace(/^origin\//, "");
    command_parts.push(`--base ${base}`);
  }

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

  const mutation_name = args.draft ? "convertPullRequestToDraft" : "markPullRequestReadyForReview";

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

  const command_parts = [`gh api graphql -F id="${cache_pr.id}" -f query='${query}'`];

  const command = command_parts.join(" ");

  const cli_result = await cli(command);

  if (cli_result.code !== 0) {
    handle_error(cli_result.output);
  }
}

export async function pr_diff(branch: string) {
  // https://cli.github.com/manual/gh_pr_diff
  const result = await gh(`pr diff --color=never ${branch}`, { branch });

  if (result instanceof Error) {
    handle_error(result.message);
  }

  return result;
}

// pull request JSON fields
// https://cli.github.com/manual/gh_pr_list
// prettier-ignore
const JSON_FIELDS = "--json id,number,state,baseRefName,headRefName,commits,title,body,url,isDraft";

type GhCmdOptions = {
  branch?: string;
};

// consistent handle gh cli commands returning json
// redirect to tmp file to avoid scrollback overflow causing scrollback to be cleared
async function gh_json<T>(command: string, gh_options?: GhCmdOptions): Promise<T | Error> {
  const gh_result = await gh(command, gh_options);

  if (gh_result instanceof Error) {
    return gh_result;
  }

  try {
    const json = JSON.parse(gh_result);
    return json as T;
  } catch (error) {
    return new Error(`gh_json JSON.parse: ${error}`);
  }
}

// consistent handle gh cli commands
// redirect to tmp file to avoid scrollback overflow causing scrollback to be cleared
async function gh(command: string, gh_options?: GhCmdOptions): Promise<string | Error> {
  const state = Store.getState();
  const actions = state.actions;

  if (gh_options?.branch) {
    const branch = gh_options.branch;

    type CacheEntryByHeadRefName = (typeof state.cache_gh_cli_by_branch)[string][string];

    let cache: undefined | CacheEntryByHeadRefName = undefined;

    if (branch) {
      if (state.cache_gh_cli_by_branch[branch]) {
        cache = state.cache_gh_cli_by_branch[branch][command];
      }
    }

    if (cache) {
      if (actions.isDebug()) {
        actions.debug(
          cache_message({
            hit: true,
            message: "gh cache",
            extra: command,
          }),
        );
      }

      return cache;
    }

    if (actions.isDebug()) {
      actions.debug(
        cache_message({
          hit: false,
          message: "gh cache",
          extra: command,
        }),
      );
    }
  }

  // hash command for unique short string
  let hash = crypto.createHash("md5").update(command).digest("hex");
  let tmp_filename = safe_filename(`gh-${hash}`);
  const tmp_filepath = path.join(await get_tmp_dir(), `${tmp_filename}`);

  const options = { ignoreExitCode: true };
  const cli_result = await cli(`gh ${command} > ${tmp_filepath}`, options);

  if (cli_result.code !== 0) {
    return new Error(cli_result.output);
  }

  // read from file
  let content = String(await fs.readFile(tmp_filepath));
  content = content.trim();

  if (gh_options?.branch) {
    const branch = gh_options.branch;

    actions.set((state) => {
      if (!state.cache_gh_cli_by_branch[branch]) {
        state.cache_gh_cli_by_branch[branch] = {};
      }
      state.cache_gh_cli_by_branch[branch][command] = content;
    });
  }

  return content;
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

  // ensure unique filename is safe for filesystem
  // args.branch_id (group id) might contain slashes, e.g. dev/magus/gs-3cmrMBSUj
  // the flashes would mess up the filesystem path to this file
  const branch = args.branch;
  let tmp_filename = safe_filename(`git-stack-body-${branch}`);

  const temp_path = path.join(await get_tmp_dir(), tmp_filename);

  await safe_rm(temp_path);

  await fs.writeFile(temp_path, args.body);

  return temp_path;
}

function safe_filename(value: string): string {
  return value.replace(RE.non_alphanumeric_dash, "-");
}

type CacheMessageArgs = {
  hit: boolean;
  message: React.ReactNode;
  extra: React.ReactNode;
};

function cache_message(args: CacheMessageArgs) {
  const status = args.hit ? (
    <Ink.Text bold color={colors.green}>
      HIT
    </Ink.Text>
  ) : (
    <Ink.Text bold color={colors.red}>
      MISS
    </Ink.Text>
  );

  return (
    <FormatText
      wrapper={<Ink.Text dimColor />}
      message="{message} {status} {extra}"
      values={{
        message: args.message,
        status,
        extra: args.extra,
      }}
    />
  );
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
