import { test, expect } from "bun:test";

import * as StackSummaryTable from "~/core/StackSummaryTable";

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
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47",
  ]);
});

test("can parse stack table from body", () => {
  const body_line_list = [
    "",
    "",
    "#### [git stack](https://github.com/magus/git-stack-cli)",
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
      "#### [git stack](https://github.com/magus/git-stack-cli)",
      "- ⏳ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
      "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
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
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- ✅ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
    "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- ⏳ `4` https://github.com/magus/git-multi-diff-playground/pull/54",
    "- ⏳ `5` https://github.com/magus/git-multi-diff-playground/pull/61",
  ]);

  // run again on the output to make sure it doesn't change
  const rerun_output = StackSummaryTable.write({ ...args, body: output });

  expect(rerun_output).toBe(output);
});

test("appends current stack after submitted rows when rebased to master", () => {
  const args = {
    body: [
      "Summary of problem",
      "",
      "#### [git stack](https://github.com/magus/git-stack-cli)",
      "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "- ✅ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
      "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
    ].join("\n"),

    pr_url_list: [
      "https://github.com/magus/git-multi-diff-playground/pull/47",
      "https://github.com/magus/git-multi-diff-playground/pull/54",
      "https://github.com/magus/git-multi-diff-playground/pull/61",
    ],

    selected_url: "https://github.com/magus/git-multi-diff-playground/pull/54",
  };

  const output = StackSummaryTable.write(args);

  expect(output.split("\n")).toEqual([
    "Summary of problem",
    "",
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- ✅ `2` https://github.com/magus/git-multi-diff-playground/pull/44",
    "- ⏳ `3` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- 👉 `4` https://github.com/magus/git-multi-diff-playground/pull/54",
    "- ⏳ `5` https://github.com/magus/git-multi-diff-playground/pull/61",
  ]);
});

test("persist only valid urls, removed broken branch ids from interrupted sync", () => {
  const args = {
    body: [
      "Summary of problem",
      "",
      "#### [git stack](https://github.com/magus/git-stack-cli)",
      "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "- ✅ `2` gs-P4EBkJm+q",
      "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
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
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- 👉 `2` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- ⏳ `3` https://github.com/magus/git-multi-diff-playground/pull/54",
    "- ⏳ `4` https://github.com/magus/git-multi-diff-playground/pull/61",
  ]);

  // run again on the output to make sure it doesn't change
  const rerun_output = StackSummaryTable.write({ ...args, body: output });

  expect(rerun_output).toBe(output);
});

test("can parse legacy git stack", () => {
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

test("converts legacy git stack to link version", () => {
  const args = {
    body: [
      "Summary of problem",
      "",
      "#### git stack",
      "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "- ✅ `2` gs-P4EBkJm+q",
      "- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47",
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
    "#### [git stack](https://github.com/magus/git-stack-cli)",
    "- ✅ `1` https://github.com/magus/git-multi-diff-playground/pull/43",
    "- 👉 `2` https://github.com/magus/git-multi-diff-playground/pull/47",
    "- ⏳ `3` https://github.com/magus/git-multi-diff-playground/pull/54",
    "- ⏳ `4` https://github.com/magus/git-multi-diff-playground/pull/61",
  ]);
});
