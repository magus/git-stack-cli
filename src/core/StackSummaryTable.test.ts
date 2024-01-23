import { test, expect } from "bun:test";

import * as StackSummaryTable from "./StackSummaryTable.js";

test("blank", () => {
  const output = StackSummaryTable.write({
    body: "",
    pr_url_list: [],
    selected_url: "",
  });

  expect(output).toBe("");
});

test("no prs does not modify body", () => {
  const args = {
    body: [
      "## Problem,",
      "",
      ",Description of the problem,",
      "",
      ",## Solution,",
      "",
      ",Solved problem by doing x, y, z.",
    ].join("\n"),
    pr_url_list: [],
    selected_url: "",
  };

  const output = StackSummaryTable.write(args);

  expect(output).toBe(args.body);
});

test("handles bulleted lists", () => {
  const body = [
    "## Problem",
    "",
    "Description of the problem",
    "",
    "## Solution",
    "",
    "- keyboard modality escape key",
    "- centralize settings",
    "- move logic inside if branch",
  ].join("\n");

  const args = {
    body,
    pr_url_list: [],
    selected_url: "",
  };

  const output = StackSummaryTable.write(args);

  expect(output).toBe(args.body);
});

test("builds list of prs with selected emoji", () => {
  const args = {
    body: [
      "## Problem,",
      "",
      ",Description of the problem,",
      "",
      ",## Solution,",
      "",
      ",Solved problem by doing x, y, z.",
    ].join("\n"),
    pr_url_list: [
      "https://github.com/magus/git-multi-diff-playground/pull/43",
      "https://github.com/magus/git-multi-diff-playground/pull/47",
    ],
    selected_url: "https://github.com/magus/git-multi-diff-playground/pull/43",
  };

  const output = StackSummaryTable.write(args);

  expect(output.split("\n")).toEqual([
    ...args.body.split("\n"),
    "",
    "#### git stack",
    "- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
  ]);
});

test("can parse stack table from body", () => {
  const body_line_list = [
    "",
    "",
    "#### git stack",
    "- invalid line that will be dropped",
    "- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
  ];

  const parsed = StackSummaryTable.parse(body_line_list.join("\n"));

  expect(Array.from(parsed.entries())).toEqual([
    [
      "https://github.com/magus/git-multi-diff-playground/pull/47",
      {
        icon: "⏳",
        num: "2",
        pr_url: "https://github.com/magus/git-multi-diff-playground/pull/47",
      },
    ],
    [
      "https://github.com/magus/git-multi-diff-playground/pull/43",
      {
        icon: "👉",
        num: "1",
        pr_url: "https://github.com/magus/git-multi-diff-playground/pull/43",
      },
    ],
  ]);
});

test("persists removed pr urls from previous stack table", () => {
  const args = {
    body: [
      "Summary of problem",
      "",
      "#### git stack",
      "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
      "- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
      "- ⏳ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    ].join("\n"),

    pr_url_list: [
      "https://github.com/magus/git-multi-diff-playground/pull/47",
      "https://github.com/magus/git-multi-diff-playground/pull/54",
      "https://github.com/magus/git-multi-diff-playground/pull/61",
    ],

    selected_url: "https://github.com/magus/git-multi-diff-playground/pull/47",
  };

  const output = StackSummaryTable.write(args);

  expect(output.split("\n")).toEqual([
    "Summary of problem",
    "",
    "#### git stack",
    "- ⏳ `5` https://github.com/magus/git-multi-diff-playground/pull/61",
    "- ⏳ `4` https://github.com/magus/git-multi-diff-playground/pull/54",
    "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- ✅ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
    "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
  ]);

  // run again on the output to make sure it doesn't change
  const rerun_output = StackSummaryTable.write({ ...args, body: output });

  expect(rerun_output).toBe(output);
});
