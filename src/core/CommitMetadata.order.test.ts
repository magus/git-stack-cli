import { expect, test } from "bun:test";

import * as CommitMetadata from "~/core/CommitMetadata";

test("stack_order preserves stack group order", () => {
  const commit_range = range(["A", "B", "C"]);
  const actual = CommitMetadata.stack_order(commit_range);

  expect(ids(actual)).toEqual(["A", "B", "C"]);
});

test("rebase_order reverses stack order", () => {
  const commit_range = range(["A", "B", "C"]);
  const actual = CommitMetadata.rebase_order(commit_range);

  expect(ids(actual)).toEqual(["C", "B", "A"]);
});

test("rebase_order moves master_base groups to the front", () => {
  const commit_range = range(["A", { id: "B", master_base: true }, "C"]);

  const actual = CommitMetadata.rebase_order(commit_range);
  expect(ids(actual)).toEqual(["B", "C", "A"]);

  const [first_group] = actual;
  expect(first_group).toBeDefined();
  expect(first_group.dirty).toBe(true);
});

function ids(group_list: CommitMetadata.CommitGroupList) {
  return group_list.map((group) => group.id);
}

function range(input_list: Array<GroupInput>): CommitMetadata.CommitRange {
  const groups = input_list.map((input) =>
    typeof input === "string"
      ? { id: input, dirty: false, master_base: false }
      : { dirty: false, master_base: false, ...input },
  );

  return {
    invalid: false,
    group_list: groups.map((group, index) => {
      return {
        id: group.id,
        title: group.id,
        pr: null,
        base: index === 0 ? "master" : groups[index - 1]!.id,
        dirty: group.dirty,
        commits: [
          {
            sha: group.id,
            full_message: group.id,
            subject_line: group.id,
            branch_id: group.id,
            title: group.id,
            master_base: group.master_base,
          },
        ],
        master_base: group.master_base,
      };
    }),
    commit_list: [],
    pr_lookup: {},
    UNASSIGNED: CommitMetadata.UNASSIGNED,
  };
}

type GroupInput = string | GroupObject;

type GroupObject = {
  id: string;
  dirty?: boolean;
  master_base?: boolean;
};
