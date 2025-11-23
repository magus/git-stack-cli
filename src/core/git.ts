import * as Metadata from "~/core/Metadata";
import { cli } from "~/core/cli";

export type Commit = Awaited<ReturnType<typeof commit>>;

export async function get_commits(dot_range: string) {
  const log_result = await cli(`git log ${dot_range} --oneline --format=%H --color=never`);

  if (!log_result.stdout) {
    return [];
  }

  const sha_list = lines(log_result.stdout).reverse();

  const commit_metadata_list = [];

  for (let i = 0; i < sha_list.length; i++) {
    const sha = sha_list[i];
    const commit_metadata = await commit(sha);
    commit_metadata_list.push(commit_metadata);
  }

  return commit_metadata_list;
}

async function commit(sha: string) {
  const full_message = (await cli(`git show -s --format=%B ${sha}`)).stdout;
  const metadata = await Metadata.read(full_message);
  const branch_id = metadata?.id;
  const subject_line = get_subject_line(full_message);
  const title = metadata?.title;

  return {
    sha,
    full_message,
    subject_line,
    branch_id,
    title,
  };
}

function get_subject_line(message: string) {
  const line_list = lines(message);
  const first_line = line_list[0];
  return Metadata.remove(first_line);
}

function lines(value: string) {
  return value.split("\n");
}
