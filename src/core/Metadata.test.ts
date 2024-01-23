import { test, expect } from "bun:test";

import * as Metadata from "./Metadata.js";

test("read handles bulleted lists", () => {
  const body = [
    "[feat] implement various features",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
    "",
    "git-stack-id: DdKIFyufW",
  ].join("\n");

  expect(Metadata.read(body)).toEqual("DdKIFyufW");
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

  expect(Metadata.write(body, "abcd1234")).toEqual(
    [
      "[feat] implement various features",
      "",
      "- keyboard modality escape key",
      "- centralize settings",
      "- move logic inside if branch",
      "",
      "git-stack-id: abcd1234",
    ].join("\n")
  );
});
