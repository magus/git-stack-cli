import { v4 as uuid_v4 } from "uuid";

import { color } from "./core/color";
import { invariant } from "./core/invariant";
import { dependency_check } from "./core/dependency_check";
import { exit } from "./core/exit";
import { cli } from "./core/cli";

main();

async function main() {
  await dependency_check();

  const [, , flag] = process.argv;

  const head_sha = (await cli("git rev-parse HEAD")).stdout;
  const merge_base = (await cli("git merge-base HEAD master")).stdout;

  // handle when there are no detected changes
  if (head_sha === merge_base) {
    console.error(color.dim("No changes detected."));
    return exit(0);
  }

  const branch_name = (await cli("git rev-parse --abbrev-ref HEAD")).stdout;

  // git@github.com:magus/git-multi-diff-playground.git
  // https://github.com/magus/git-multi-diff-playground.git
  const origin_url = (await cli(`git config --get remote.origin.url`)).stdout;
  const repo_path = match_group(origin_url, RE.repo_path, "repo_path");

  const sha_list = lines(
    (await cli(`git log master..HEAD --oneline --format=%H --color=never`))
      .stdout,
  ).reverse();

  let commit_metadata_list = await Promise.all(
    sha_list.map((sha) => get_commit_metadata(branch_name, sha)),
  );

  print_table(repo_path, branch_name, commit_metadata_list);

  const needs_update = commit_metadata_list.some(commit_needs_update);

  const flag_check = flag.match(RE.flag_check);

  if (flag_check) {
    return exit(0);
  }

  const flag_force = flag.match(RE.flag_force);

  if (!flag_force && !needs_update) {
    console.debug();
    console.debug("Everything up to date.");
    console.debug("Run with `--force` to force update all pull requests.");
    return exit(0);
  }

  const temp_branch_name = `${branch_name}_${uuid_v4()}`;

  try {
    // create temporary branch based on merge base
    await cli(`git checkout -b ${temp_branch_name} ${merge_base}`);

    // cherry-pick and amend commits one by one
    for (let i = 0; i < sha_list.length; i++) {
      const sha = sha_list[i];
      await cli(`git cherry-pick ${sha}`);

      const args = await get_commit_metadata(branch_name, sha);

      if (!args.metadata.id) {
        args.metadata.id = uuid_v4();
        await write_metadata(args);
      }

      // always push to origin since github requires commit shas to line up perfectly
      console.debug();
      console.debug(`Syncing [${args.pr_branch}] ...`);
      await cli(`git push -f origin HEAD:${args.pr_branch}`);
    }

    // after all commits have been cherry-picked and amended
    // move the branch pointer to the temporary branch (with the metadata)
    await cli(`git branch -f ${branch_name} ${temp_branch_name}`);
  } catch (err) {
    console.debug("Restoring original branch...");
    console.error(err);
  } finally {
    // always put self back in original branch
    await cli(`git checkout ${branch_name}`);
    // ...and cleanup temporary branch
    await cli(`git branch -D ${temp_branch_name}`);
  }

  commit_metadata_list = await Promise.all(
    sha_list.map((sha) => get_commit_metadata(branch_name, sha)),
  );

  print_table(repo_path, branch_name, commit_metadata_list);
}

async function print_table(
  repo_path: string,
  branch_name: string,
  commit_metadata_list: Array<Awaited<ReturnType<typeof get_commit_metadata>>>,
) {
  console.debug();
  for (const args of commit_metadata_list) {
    print_table_row(repo_path, args);
  }
}

async function print_table_row(
  repo_path: string,
  args: Awaited<ReturnType<typeof get_commit_metadata>>,
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
  console.debug(
    icon,
    "  ",
    col(status, 10, "left"),
    col(args.message, 80, "left"),
  );

  if (args.pr_branch) {
    const pr_url = get_pr_url(repo_path, args.pr_branch);
    console.debug(" ".repeat(16), pr_url);
  }

  console.debug();
}

function commit_needs_update(
  meta: Awaited<ReturnType<typeof get_commit_metadata>>,
) {
  return !meta.pr_exists || meta.pr_dirty;
}

async function get_commit_metadata(branch_name: string, sha: string) {
  const raw_message = await commit_message(sha);
  const metadata = await read_metadata(raw_message);
  const message = display_message(raw_message);

  let pr_branch;
  let pr_exists;
  let pr_dirty;

  if (metadata.id) {
    pr_branch = get_pr_branch(branch_name, metadata);

    // get pr status relative to local commit
    pr_exists = Boolean(
      (await cli(`git ls-remote --heads origin ${pr_branch}`)).stdout,
    );

    pr_dirty = Boolean(
      (await cli(`git diff origin/${pr_branch}..${sha}`)).stdout,
    );
  } else {
    pr_branch = null;
    pr_exists = false;
    pr_dirty = false;
  }

  return {
    message,
    pr_branch,
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

  metadata.id = match.groups.id;

  return metadata;
}

function get_pr_branch(branch_name: string, metadata: Metadata) {
  return `${branch_name}/${metadata.id}`;
}

// https://github.com/magus/git-multi-diff-playground/compare/dev/noah/a-test/e0f8182f-12c1-441a-81ad-20e0b58efa8d?expand=1
function get_pr_url(repo_path: string, pr_branch: string) {
  return `https://github.com/${repo_path}/compare/${pr_branch}?expand=1`;
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
