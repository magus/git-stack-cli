import { test, expect } from "bun:test";

import * as Metadata from "~/core/Metadata";

test("read handles bulleted lists", () => {
  const body = [
    "[feat] implement various features",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
    "",
    "git-stack-id: DdKIFyufW",
    "git-stack-title: saved group title",
  ].join("\n");

  const metadata = Metadata.read(body);

  expect(metadata).toEqual({
    id: "DdKIFyufW",
    title: "saved group title",
  });
});

test("write handles bulleted lists", () => {
  const body = [
    "[feat] implement various features",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
    "",
    "git-stack-id: DdKIFyufW",
  ].join("\n");

  const metadata = {
    id: "abcd1234",
    title: "banana",
  };

  expect(Metadata.write(body, metadata)).toEqual(
    [
      "[feat] implement various features",
      "",
      "- keyboard modality escape key",
      "- centralize settings",
      "- move logic inside if branch",
      "",
      "git-stack-id: abcd1234",
      "git-stack-title: banana",
    ].join("\n")
  );
});

test("read handles slashes in branch name", () => {
  const body = [
    "[fix] slash in branch name",
    "",
    "git-stack-id: dev/noah/fix-slash-branch",
    "git-stack-title: fix slash branch",
  ].join("\n");

  const metadata = Metadata.read(body);

  expect(metadata).toEqual({
    id: "dev/noah/fix-slash-branch",
    title: "fix slash branch",
  });
});

test("write handles bulleted lists", () => {
  const body = [
    "[feat] implement various features",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
    "",
    "git-stack-id: DdKIFyufW",
  ].join("\n");

  const metadata = {
    id: "fix-slash-branch",
    title: "fix slash branch",
  };

  expect(Metadata.write(body, metadata)).toEqual(
    [
      "[feat] implement various features",
      "",
      "- keyboard modality escape key",
      "- centralize settings",
      "- move logic inside if branch",
      "",
      "git-stack-id: fix-slash-branch",
      "git-stack-title: fix slash branch",
    ].join("\n")
  );
});

test("read handles double quotes", () => {
  const body = [
    'Revert "[abc / 123] subject (#1234)"',
    "",
    "git-stack-id: dev/noah/fix-slash-branch",
    'git-stack-title: Revert \\"[abc / 123] subject (#1234)\\"',
  ].join("\n");

  const metadata = Metadata.read(body);

  expect(metadata).toEqual({
    id: "dev/noah/fix-slash-branch",
    title: 'Revert \\"[abc / 123] subject (#1234)\\"',
  });
});

test("write handles double quotes", () => {
  const body = [
    // force line break
    'Revert "[abc / 123] subject (#1234)"',
    "",
  ].join("\n");

  const metadata = {
    id: "abc123",
    title: 'Revert "[abc / 123] subject (#1234)"',
  };

  expect(Metadata.write(body, metadata)).toEqual(
    [
      // force line break
      'Revert \\"[abc / 123] subject (#1234)\\"',
      "",
      "git-stack-id: abc123",
      'git-stack-title: Revert \\"[abc / 123] subject (#1234)\\"',
    ].join("\n")
  );
});

test("removes metadata", () => {
  const body = [
    "[feat] implement various features",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
    "",
    "git-stack-id: DdKIFyufW",
    "git-stack-title: this is a PR title",
  ].join("\n");

  expect(Metadata.remove(body)).toEqual(
    [
      "[feat] implement various features",
      "",
      "- keyboard modality escape key",
      "- centralize settings",
      "- move logic inside if branch",
    ].join("\n")
  );
});
