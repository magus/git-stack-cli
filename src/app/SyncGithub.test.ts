import { expect, test } from "bun:test";

import { stack_table_data } from "~/app/SyncGithub";
import * as StackSummaryTable from "~/core/StackSummaryTable";

test("stack table rows follow the base chain even when group_list is reversed", () => {
  const pr_url_by_group_id = {
    A: "https://github.com/magus/git-multi-diff-playground/pull/43",
    B: "https://github.com/magus/git-multi-diff-playground/pull/47",
    C: "https://github.com/magus/git-multi-diff-playground/pull/61",
  };

  const commit_range = range(["A", "B", "C"], pr_url_by_group_id);
  commit_range.group_list.reverse();

  const { pr_url_list } = stack_table_data({
    commit_range,
    pr_url_by_group_id: {},
  });

  const output = StackSummaryTable.write({
    body: "Summary of problem",
    pr_url_list,
    selected_url: pr_url_by_group_id.B,
  });

  expect(output.split("\n")).toEqual([
    "Summary of problem",
    "",
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- ⏳ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- 👉 `2` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- ⏳ `3` https://github.com/magus/git-multi-diff-playground/pull/61",
  ]);
});

function range(group_id_list: Array<string>, pr_url_by_group_id: Record<string, string>) {
  return {
    invalid: false,
    group_list: group_id_list.map((group_id, index) => {
      return {
        id: group_id,
        title: group_id,
        pr: pull_request(pr_url_by_group_id[group_id]!),
        base: index === 0 ? "master" : group_id_list[index - 1]!,
        dirty: false,
        commits: [
          {
            sha: group_id,
            full_message: group_id,
            subject_line: group_id,
            branch_id: group_id,
            title: group_id,
            master_base: false,
          },
        ],
        master_base: false,
      };
    }),
    commit_list: [],
    pr_lookup: {},
    UNASSIGNED: "unassigned",
  };
}

function pull_request(url: string) {
  return {
    id: "id",
    number: 1,
    state: "OPEN" as const,
    baseRefName: "master",
    headRefName: "branch",
    commits: [],
    title: "title",
    body: "",
    url,
    isDraft: false,
  };
}
