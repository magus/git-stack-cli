import { test, expect } from "bun:test";

import * as GatherMetadata from "~/app/GatherMetadata";

test("invalid origin", () => {
  const origin_url = "";
  const repo_path = GatherMetadata.get_repo_path(origin_url);
  expect(repo_path).toBe(null);
});

test("https .git", () => {
  const origin_url = "https://github.com/magus/git-multi-diff-playground.git";
  const repo_path = GatherMetadata.get_repo_path(origin_url);
  expect(repo_path).toBe("magus/git-multi-diff-playground");
});

test("https without .git", () => {
  const origin_url = "https://github.com/magus/git-multi-diff-playground";
  const repo_path = GatherMetadata.get_repo_path(origin_url);
  expect(repo_path).toBe("magus/git-multi-diff-playground");
});

test("git@ .git", () => {
  const origin_url = "git@github.com:magus/git-multi-diff-playground.git";
  const repo_path = GatherMetadata.get_repo_path(origin_url);
  expect(repo_path).toBe("magus/git-multi-diff-playground");
});

test("git@ without .git", () => {
  const origin_url = "git@github.com:magus/git-multi-diff-playground";
  const repo_path = GatherMetadata.get_repo_path(origin_url);
  expect(repo_path).toBe("magus/git-multi-diff-playground");
});
