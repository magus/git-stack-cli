import { expect, test } from "bun:test";

import type { CommitMetadataGroup } from "./SyncGithub";
import { _is_master_base } from "./SyncGithub";

function buildGroup(overrides: Partial<CommitMetadataGroup> = {}): CommitMetadataGroup {
  return {
    id: "group-1",
    title: "title",
    master_base: false,
    base: "feature/base",
    dirty: false,
    commits: [],
    pr: {
      id: "pr-id",
      number: 1,
      state: "OPEN",
      baseRefName: "master",
      headRefName: "group-1",
      commits: [] as any,
      title: "t",
      body: "",
      url: "https://example.com/pr/1",
      isDraft: false,
    },
    ...overrides,
  } as CommitMetadataGroup;
}

test("treats master_base flag as master", () => {
  const group = buildGroup({ master_base: true, base: "feature/base" });

  const result = _is_master_base({ group, master_branch: "origin/master" });

  expect(result).toBe(true);
});

test("treats group base matching master as master", () => {
  const group = buildGroup({ base: "origin/master", master_base: false });

  const result = _is_master_base({ group, master_branch: "origin/master" });

  expect(result).toBe(true);
});

test("ignores pr base when group base differs", () => {
  const group = buildGroup({ base: "feature/base", master_base: false });

  const result = _is_master_base({ group, master_branch: "origin/master" });

  expect(result).toBe(false);
});
