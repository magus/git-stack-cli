import { Store } from "~/app/Store";
import * as Metadata from "~/core/Metadata";
import { cli } from "~/core/cli";
import { invariant } from "~/core/invariant";

type CommitList = Awaited<ReturnType<typeof get_commits>>;

export type Commit = CommitList[0];

export async function get_commits(dot_range: string) {
  const log_result = await cli(`git log ${dot_range} --format=${FORMAT} --color=never`);

  if (!log_result.stdout) {
    return [];
  }

  const commit_list = [];

  for (let record of log_result.stdout.split(SEP.record)) {
    record = record.replace(/^\n/, "");
    record = record.replace(/\n$/, "");

    if (!record) continue;

    const [sha, full_message] = record.split(SEP.field);

    // ensure sha is a hex string, otherwise we should throw an error
    if (!RE.git_sha.test(sha)) {
      const actions = Store.getState().actions;
      const sep_values = JSON.stringify(Object.values(SEP));
      const message = `unable to parse git commits, maybe commit message contained ${sep_values}`;
      actions.error(message);
      actions.exit(19);
    }

    const metadata = Metadata.read(full_message);
    const branch_id = metadata.id;
    const subject_line = metadata.subject || "";
    const title = metadata.title;
    const master_base = metadata.base === "master";

    const commit = {
      sha,
      full_message,
      subject_line,
      branch_id,
      title,
      master_base,
    };

    commit_list.push(commit);
  }

  commit_list.reverse();

  return commit_list;
}

export async function get_diff(commit_list: CommitList) {
  invariant(commit_list.length, "commit_list must exist");
  const first_commit = commit_list[0];
  const last_commit = commit_list[commit_list.length - 1];
  const sha_range = `${first_commit.sha}~1..${last_commit.sha}`;
  const diff_result = await cli(`git --no-pager diff --color=never ${sha_range}`);
  return diff_result.stdout;
}

// Why these separators?
// - Rare in human written text
// - Supported in git %xNN to write bytes
// - Supported in javascript \xNN to write bytes
// - Used historically as separators in unicode
//   https://en.wikipedia.org/wiki/C0_and_C1_control_codes#Field_separators
const SEP = {
  record: "\x1e",
  field: "\x1f",
};

const FORMAT = `%H${SEP.field}%B${SEP.record}`;

const RE = {
  git_sha: /^[0-9a-fA-F]{40}$/,
};
