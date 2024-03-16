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
