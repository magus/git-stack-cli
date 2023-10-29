import { v4 as uuid_v4 } from "uuid";

import { cli } from "./core/cli.js";
import { color } from "./core/color.js";
import * as github from "./core/github.js";
import { invariant } from "./core/invariant.js";

import type { Argv } from "./command.js";

export async function main(argv: Argv) {
  const head_sha = (await cli("git rev-parse HEAD")).stdout;
  const merge_base = (await cli("git merge-base HEAD master")).stdout;

  // handle when there are no detected changes
  if (head_sha === merge_base) {
    console.error(color.dim("No changes detected."));
    return process.exit();
  }

  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  const origin_url = (await cli(`git config --get remote.origin.url`)).stdout;
  const repo_path = match_group(origin_url, RE.repo_path, "repo_path");

  const commit_metadata_list = await get_commit_metadata_list();

  print_table(repo_path, commit_metadata_list);

  const needs_update = commit_metadata_list.some(commit_needs_update);

  if (argv.check) {
    return process.exit();
  }

  if (!argv.force && !needs_update) {
    console.debug();
    console.debug("Everything up to date.");
    console.debug("Run with `--force` to force update all pull requests.");
    return process.exit();
  }

  const temp_branch_name = `${branch_name}_${uuid_v4()}`;

  try {
    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${merge_base}`);

    const picked_commit_metadata_list = [];

    // cherry-pick and amend commits one by one
    for (let i = 0; i < commit_metadata_list.length; i++) {
      const sha = commit_metadata_list[i].sha;

      let base;
      if (i === 0) {
        base = "master";
      } else {
        base = picked_commit_metadata_list[i - 1].metadata.id;
        invariant(base, `metadata must be set on previous commit [${i}]`);
      }

      await cli(`git cherry-pick ${sha}`);

      const args = await get_commit_metadata(sha, base);

      if (!args.metadata.id) {
        args.metadata.id = uuid_v4();
        await write_metadata(args);
      }

      picked_commit_metadata_list.push(args);

      // always push to origin since github requires commit shas to line up perfectly
      console.debug();
      console.debug(`Syncing [${args.metadata.id}] ...`);

      await cli(`git push -f origin HEAD:${args.metadata.id}`);

      if (args.pr_exists) {
        // ensure base matches pr in github
        await github.pr_base(args.metadata.id, base);
      } else {
        try {
          // delete metadata id branch if leftover
          await cli(`git branch -D ${args.metadata.id}`, {
            ignoreExitCode: true,
          });

          // move to temporary branch for creating pr
          await cli(`git checkout -b ${args.metadata.id}`);

          // create pr in github
          await github.pr_create(args.metadata.id, base);
        } catch (err) {
          console.error("Moving back to temp branch...");
          console.error(err);
        } finally {
          // move back to temp branch
          await cli(`git checkout ${temp_branch_name}`);

          // delete metadata id branch if leftover
          await cli(`git branch -D ${args.metadata.id}`, {
            ignoreExitCode: true,
          });
        }
      }
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the temporary branch (with the metadata)
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);
  } catch (err) {
    console.error("Restoring original branch...");
    console.error(err);
  } finally {
    // always put self back in original branch
    await cli(`git checkout ${branch_name}`);
    // ...and cleanup temporary branch
    await cli(`git branch -D ${temp_branch_name}`, { ignoreExitCode: true });
  }

  print_table(repo_path, await get_commit_metadata_list());
}

function print_table(
  repo_path: string,
  commit_metadata_list: Array<Awaited<ReturnType<typeof get_commit_metadata>>>
) {
  console.debug();
  for (const args of commit_metadata_list) {
    print_table_row(repo_path, args);
  }
}

function print_table_row(
  repo_path: string,
  args: Awaited<ReturnType<typeof get_commit_metadata>>
) {
  let icon;
  let status;

  if (!args.pr_exists) {
    icon = "🌱";
    status = "NEW";
  } else if (args.pr_dirty) {
    icon = "⚠️";
    status = "OUTDATED";
  } else {
    icon = "✅";
    status = "SYNCED";
  }

  // print clean metadata about this commit / branch
  const parts = [
    icon,
    " ",
    col(status, 10, "left"),
    col(args.message, 80, "left"),
  ];

  if (args.pr?.number) {
    parts.push(` https://github.com/${repo_path}/pull/${args.pr.number}`);
  }

  console.debug(...parts);
}

function commit_needs_update(
  meta: Awaited<ReturnType<typeof get_commit_metadata>>
) {
  return !meta.pr_exists || meta.pr_dirty;
}

async function get_commit_metadata(sha: string, base: null | string) {
  const raw_message = await commit_message(sha);
  const metadata = await read_metadata(raw_message);
  const message = display_message(raw_message);

  let pr = null;
  let pr_exists = false;
  let pr_dirty = false;

  if (metadata.id) {
    const pr_branch = get_pr_branch(metadata);

    pr = await github.pr_status(pr_branch);

    if (pr && pr.state === "OPEN") {
      pr_exists = true;

      const last_commit = pr.commits[pr.commits.length - 1];
      pr_dirty = last_commit.oid !== sha;

      if (pr.baseRefName !== base) {
        // requires base update
        pr_dirty = true;
      }
    }
  }

  return {
    sha,
    base,
    message,
    pr,
    pr_exists,
    pr_dirty,
    metadata,
  };
}

const TEMPLATE = {
  metadata_id(id: string) {
    return `git-multi-diff-id: ${id}`;
  },
};

const RE = {
  flag_check: /(--check|check|-c)/i,
  flag_force: /(--force|force|-f)/i,

  all_double_quote: /"/g,
  all_newline: /\n/g,

  metadata_id: new RegExp(TEMPLATE.metadata_id("(?<id>[a-z0-9-]+)")),

  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  repo_path: /(?<repo_path>[^:^/]+\/[^/]+)\.git/,
};

type Metadata = {
  id: null | string;
};

async function write_metadata(args: { metadata: Metadata; message: string }) {
  invariant(args.metadata.id, "metadata must have id");

  let message = args.message;
  message = message.replace(RE.all_double_quote, '\\"');

  const line_list = [message, "", TEMPLATE.metadata_id(args.metadata.id)];
  const new_message = line_list.join("\n");

  await cli(`git commit --amend -m "${new_message}"`);
}

async function read_metadata(message: string): Promise<Metadata> {
  const match = message.match(RE.metadata_id);

  const metadata: Metadata = {
    id: null,
  };

  if (!match?.groups) {
    return metadata;
  }

  const id = match.groups["id"];
  invariant(id, "id must exist");

  metadata.id = id;

  return metadata;
}

function get_pr_branch(metadata: Metadata) {
  return `${metadata.id}`;
}

async function commit_message(sha: string) {
  return (await cli(`git show -s --format=%B ${sha}`)).stdout;
}

function display_message(message: string) {
  // remove metadata
  let result = message;
  result = result.replace(RE.metadata_id, "");
  result = result.trimEnd();
  return result;
}

function lines(value: string) {
  return value.split("\n");
}

function trunc(value: string, length: number) {
  return value.substring(0, length);
}

function pad(value: string, length: number, align: "left" | "right") {
  const space_count = Math.max(0, length - value.length);
  const padding = " ".repeat(space_count);

  if (align === "left") {
    return `${value}${padding}`;
  } else {
    return `${padding}${value}`;
  }
}

function col(value: string, length: number, align: "left" | "right") {
  let column = value;
  column = column.replace(RE.all_newline, " ");
  column = trunc(column, length);
  column = pad(column, length, align);
  return column;
}

function match_group(value: string, re: RegExp, group: string) {
  const match = value.match(re);
  const debug = `[${value}.match(${re})]`;
  invariant(match?.groups, `match.groups must exist ${debug}`);
  const result = match?.groups[group];
  invariant(result, `match.groups must contain [${group}] ${debug}`);
  return result;
}

async function get_commit_metadata_list() {
  const log_result = await cli(
    `git log master..HEAD --oneline --format=%H --color=never`
  );

  const sha_list = lines(log_result.stdout).reverse();

  const commit_metadata_list = [];

  for (let i = 0; i < sha_list.length; i++) {
    const sha = sha_list[i];

    let base;
    if (i === 0) {
      base = "master";
    } else {
      base = commit_metadata_list[i - 1].metadata.id;
    }

    const commit_metadata = await get_commit_metadata(sha, base);
    commit_metadata_list.push(commit_metadata);
  }

  return commit_metadata_list;
}
