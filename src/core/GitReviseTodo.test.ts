import { test, expect } from "bun:test";

import { GitReviseTodo } from "~/core/GitReviseTodo";

import type * as CommitMetadata from "~/core/CommitMetadata";

test("git-revise-todo from commit range with single new commit", () => {
  const rebase_group_index = 1;
  const commit_range = SINGLE_COMMIT_EXISTING_GROUP;

  const git_revise_todo = GitReviseTodo({ rebase_group_index, commit_range });

  expect(git_revise_todo).toBe(
    [
      "++ pick 3cb22661ecff",
      "lemon color",
      "",
      "git-stack-id: E63ytp5dj",
      "git-stack-title: lemon color",
      "",
      "++ pick d36d63499425",
      "cantaloupe color",
      "",
      "git-stack-id: E63ytp5dj",
      "git-stack-title: lemon color",
      "",
      "++ pick 4f98dd3e67d0",
      "banana sweet",
      "",
      "git-stack-id: E63ytp5dj",
      "git-stack-title: lemon color",
      "",
      "++ pick f143d03c723c",
      "apple sweet",
      "",
      "git-stack-id: E63ytp5dj",
      "git-stack-title: lemon color",
    ].join("\n"),
  );
});

test("git-revise-todo from commit range with single new commit in new group", () => {
  const rebase_group_index = 2;
  const commit_range = SINGLE_COMMIT_NEW_GROUP;

  const git_revise_todo = GitReviseTodo({ rebase_group_index, commit_range });

  expect(git_revise_todo).toBe(
    [
      //force line break
      "++ pick f143d03c723c",
      "apple sweet",
      "",
      "git-stack-id: 6Ak-qn+5Z",
      "git-stack-title: new group",
    ].join("\n"),
  );
});

test("git-revise-todo handles double quotes in commit message", () => {
  const rebase_group_index = 0;
  const commit_range = COMMIT_MESSAGE_WITH_QUOTES;

  const git_revise_todo = GitReviseTodo({ rebase_group_index, commit_range });

  expect(git_revise_todo).toBe(
    [
      //force line break
      "++ pick f143d03c723c",
      '[new] invalid "by me" quotes',
      "",
      "git-stack-id: 6Ak-qn+5Z",
      'git-stack-title: [new] invalid "by me" quotes',
    ].join("\n"),
  );
});

test("git-revise-todo from commit range with single new commit", () => {
  const rebase_group_index = 0;
  const commit_range = SYNC_WITH_UNASSIGNED;

  const git_revise_todo = GitReviseTodo({ rebase_group_index, commit_range });

  const expected = [
    "++ pick 55771391b49e",
    "head~7",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick 391476bbfc6b",
    "head~6",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick 5a98cf8f0406",
    "head~5",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick e820018cb370",
    "head~4",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick e6d1dfc7ec00",
    "head~3",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick a26f21025a55",
    "head~2",
    "",
    "git-stack-id: gs---4gvxa-5v-2mx26",
    "git-stack-title: pr-title",
    "",
    "++ pick 90667fe97e05",
    "head~1",
    "",
    "++ pick b61c5b09a4b7",
    "head",
  ].join("\n");

  expect(git_revise_todo).toBe(expected);
});

const SINGLE_COMMIT_EXISTING_GROUP: CommitMetadata.CommitRange = {
  invalid: false,
  group_list: [
    {
      id: "AAWsYx1UU",
      title: "banana",
      pr: {
        id: "PR_kwDOKjvFM85ghvAH",
        isDraft: false,
        baseRefName: "master",
        body: "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
        commits: [
          {
            authoredDate: "2024-02-25T03:41:42Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:42Z",
            messageBody: "git-stack-id: AAWsYx1UU",
            messageHeadline: "banana color",
            oid: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          },
        ],
        headRefName: "AAWsYx1UU",
        number: 43,
        state: "OPEN",
        title: "banana",
        url: "https://github.com/magus/git-multi-diff-playground/pull/43",
      },
      base: "master",
      dirty: false,
      commits: [
        {
          sha: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          full_message: "banana color\n\ngit-stack-id: AAWsYx1UU",
          subject_line: "banana color",
          branch_id: "AAWsYx1UU",
          title: "banana",
          master_base: false,
        },
      ],
      master_base: false,
    },
    {
      id: "E63ytp5dj",
      title: "lemon color",
      pr: {
        id: "PR_kwDOKjvFM85gwTkx",
        isDraft: false,
        baseRefName: "AAWsYx1UU",
        body: "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
        commits: [
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "lemon color",
            oid: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          },
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "cantaloupe color",
            oid: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          },
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "banana sweet",
            oid: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          },
        ],
        headRefName: "E63ytp5dj",
        number: 47,
        state: "OPEN",
        title: "lemon color",
        url: "https://github.com/magus/git-multi-diff-playground/pull/47",
      },
      base: "AAWsYx1UU",
      dirty: true,
      commits: [
        {
          sha: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          full_message: "lemon color\n\ngit-stack-id: E63ytp5dj",
          subject_line: "lemon color",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
        {
          sha: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          full_message: "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
          subject_line: "cantaloupe color",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
        {
          sha: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          full_message: "banana sweet\n\ngit-stack-id: E63ytp5dj",
          subject_line: "banana sweet",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
        {
          sha: "f143d03c723c9f5231a81c1e12098511611898cb",
          full_message: "apple sweet",
          subject_line: "apple sweet",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
      ],
      master_base: false,
    },
  ],
  commit_list: [
    {
      sha: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
      full_message: "banana color\n\ngit-stack-id: AAWsYx1UU",
      subject_line: "banana color",
      branch_id: "AAWsYx1UU",
      title: "banana",
      master_base: false,
    },
    {
      sha: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
      full_message: "lemon color\n\ngit-stack-id: E63ytp5dj",
      subject_line: "lemon color",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
      full_message: "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
      subject_line: "cantaloupe color",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
      full_message: "banana sweet\n\ngit-stack-id: E63ytp5dj",
      subject_line: "banana sweet",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "f143d03c723c9f5231a81c1e12098511611898cb",
      full_message: "apple sweet",
      subject_line: "apple sweet",
      branch_id: "6Ak-qn+5Z",
      title: "new group",
      master_base: false,
    },
  ],
  pr_lookup: {
    AAWsYx1UU: {
      id: "PR_kwDOKjvFM85ghvAH",
      isDraft: false,
      baseRefName: "master",
      body: "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      commits: [
        {
          authoredDate: "2024-02-25T03:41:42Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:42Z",
          messageBody: "git-stack-id: AAWsYx1UU",
          messageHeadline: "banana color",
          oid: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
        },
      ],
      headRefName: "AAWsYx1UU",
      number: 43,
      state: "OPEN",
      title: "banana",
      url: "https://github.com/magus/git-multi-diff-playground/pull/43",
    },
    E63ytp5dj: {
      id: "PR_kwDOKjvFM85gwTkx",
      isDraft: false,
      baseRefName: "AAWsYx1UU",
      body: "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
      commits: [
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "lemon color",
          oid: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
        },
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "cantaloupe color",
          oid: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
        },
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "banana sweet",
          oid: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
        },
      ],
      headRefName: "E63ytp5dj",
      number: 47,
      state: "OPEN",
      title: "lemon color",
      url: "https://github.com/magus/git-multi-diff-playground/pull/47",
    },
  },
  UNASSIGNED: "unassigned",
};

const SINGLE_COMMIT_NEW_GROUP: CommitMetadata.CommitRange = {
  invalid: false,
  group_list: [
    {
      id: "AAWsYx1UU",
      title: "banana",
      pr: {
        id: "PR_kwDOKjvFM85ghvAH",
        isDraft: false,
        baseRefName: "master",
        body: "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
        commits: [
          {
            authoredDate: "2024-02-25T03:41:42Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:42Z",
            messageBody: "git-stack-id: AAWsYx1UU",
            messageHeadline: "banana color",
            oid: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          },
        ],
        headRefName: "AAWsYx1UU",
        number: 43,
        state: "OPEN",
        title: "banana",
        url: "https://github.com/magus/git-multi-diff-playground/pull/43",
      },
      base: "master",
      dirty: false,
      commits: [
        {
          sha: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          full_message: "banana color\n\ngit-stack-id: AAWsYx1UU",
          subject_line: "banana color",
          branch_id: "AAWsYx1UU",
          title: "banana",
          master_base: false,
        },
      ],
      master_base: false,
    },
    {
      id: "E63ytp5dj",
      title: "lemon color",
      pr: {
        id: "PR_kwDOKjvFM85gwTkx",
        isDraft: false,
        baseRefName: "AAWsYx1UU",
        body: "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
        commits: [
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "lemon color",
            oid: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          },
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "cantaloupe color",
            oid: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          },
          {
            authoredDate: "2024-02-25T03:41:46Z",
            authors: [
              {
                email: "noah@iamnoah.com",
                id: "MDQ6VXNlcjI5MDA4NA==",
                login: "magus",
                name: "magus",
              },
            ],
            committedDate: "2024-02-25T03:41:46Z",
            messageBody: "git-stack-id: E63ytp5dj",
            messageHeadline: "banana sweet",
            oid: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          },
        ],
        headRefName: "E63ytp5dj",
        number: 47,
        state: "OPEN",
        title: "lemon color",
        url: "https://github.com/magus/git-multi-diff-playground/pull/47",
      },
      base: "AAWsYx1UU",
      dirty: false,
      commits: [
        {
          sha: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          full_message: "lemon color\n\ngit-stack-id: E63ytp5dj",
          subject_line: "lemon color",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
        {
          sha: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          full_message: "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
          subject_line: "cantaloupe color",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
        {
          sha: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          full_message: "banana sweet\n\ngit-stack-id: E63ytp5dj",
          subject_line: "banana sweet",
          branch_id: "E63ytp5dj",
          title: "lemon color",
          master_base: false,
        },
      ],
      master_base: false,
    },
    {
      id: "6Ak-qn+5Z",
      title: "new group",
      pr: null,
      base: "E63ytp5dj",
      dirty: true,
      commits: [
        {
          sha: "f143d03c723c9f5231a81c1e12098511611898cb",
          full_message: "apple sweet",
          subject_line: "apple sweet",
          branch_id: "6Ak-qn+5Z",
          title: "new group",
          master_base: false,
        },
      ],
      master_base: false,
    },
  ],
  commit_list: [
    {
      sha: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
      full_message: "banana color\n\ngit-stack-id: AAWsYx1UU",
      subject_line: "banana color",
      branch_id: "AAWsYx1UU",
      title: "banana",
      master_base: false,
    },
    {
      sha: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
      full_message: "lemon color\n\ngit-stack-id: E63ytp5dj",
      subject_line: "lemon color",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
      full_message: "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
      subject_line: "cantaloupe color",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
      full_message: "banana sweet\n\ngit-stack-id: E63ytp5dj",
      subject_line: "banana sweet",
      branch_id: "E63ytp5dj",
      title: "lemon color",
      master_base: false,
    },
    {
      sha: "f143d03c723c9f5231a81c1e12098511611898cb",
      full_message: "apple sweet",
      subject_line: "apple sweet",
      branch_id: "6Ak-qn+5Z",
      title: "new group",
      master_base: false,
    },
  ],
  pr_lookup: {
    AAWsYx1UU: {
      id: "PR_kwDOKjvFM85ghvAH",
      isDraft: false,
      baseRefName: "master",
      body: "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      commits: [
        {
          authoredDate: "2024-02-25T03:41:42Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:42Z",
          messageBody: "git-stack-id: AAWsYx1UU",
          messageHeadline: "banana color",
          oid: "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
        },
      ],
      headRefName: "AAWsYx1UU",
      number: 43,
      state: "OPEN",
      title: "banana",
      url: "https://github.com/magus/git-multi-diff-playground/pull/43",
    },
    E63ytp5dj: {
      id: "PR_kwDOKjvFM85gwTkx",
      isDraft: false,
      baseRefName: "AAWsYx1UU",
      body: "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
      commits: [
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "lemon color",
          oid: "3cb22661ecff6c872e96ce9c40b31c824938cab7",
        },
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "cantaloupe color",
          oid: "d36d63499425bb46a1e62c2c9df1a4332b13004f",
        },
        {
          authoredDate: "2024-02-25T03:41:46Z",
          authors: [
            {
              email: "noah@iamnoah.com",
              id: "MDQ6VXNlcjI5MDA4NA==",
              login: "magus",
              name: "magus",
            },
          ],
          committedDate: "2024-02-25T03:41:46Z",
          messageBody: "git-stack-id: E63ytp5dj",
          messageHeadline: "banana sweet",
          oid: "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
        },
      ],
      headRefName: "E63ytp5dj",
      number: 47,
      state: "OPEN",
      title: "lemon color",
      url: "https://github.com/magus/git-multi-diff-playground/pull/47",
    },
  },
  UNASSIGNED: "unassigned",
};

const COMMIT_MESSAGE_WITH_QUOTES: CommitMetadata.CommitRange = {
  invalid: false,
  group_list: [
    {
      id: "6Ak-qn+5Z",
      title: '[new] invalid "by me" quotes',
      pr: null,
      base: "E63ytp5dj",
      dirty: true,
      commits: [
        {
          sha: "f143d03c723c9f5231a81c1e12098511611898cb",
          full_message: '[new] invalid "by me" quotes',
          subject_line: '[new] invalid "by me" quotes',
          branch_id: "6Ak-qn+5Z",
          title: '[new] invalid "by me" quotes',
          master_base: false,
        },
      ],
      master_base: false,
    },
  ],
  commit_list: [
    {
      sha: "f143d03c723c9f5231a81c1e12098511611898cb",
      full_message: '[new] invalid "by me" quotes',
      subject_line: '[new] invalid "by me" quotes',
      branch_id: "6Ak-qn+5Z",
      title: '[new] invalid "by me" quotes',
      master_base: false,
    },
  ],
  pr_lookup: {},
  UNASSIGNED: "unassigned",
};

// capture via `throw new Error` in `ManualRebase`
// doc-link capture-git-revise-todo
const SYNC_WITH_UNASSIGNED: CommitMetadata.CommitRange = {
  invalid: false,
  group_list: [
    {
      id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      pr: null,
      base: "master",
      dirty: true,
      commits: [
        {
          sha: "55771391b49e301f51b22cbc2b745e8d3e4a357a",
          full_message: "head~7",
          subject_line: "head~7",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
        {
          sha: "391476bbfc6b77b60a3ef7fa97155496a9f8f27f",
          full_message: "head~6",
          subject_line: "head~6",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
        {
          sha: "5a98cf8f0406712405d41af07c3a012f72ad36fa",
          full_message: "head~5",
          subject_line: "head~5",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
        {
          sha: "e820018cb370bb6cda118dc649e841c75d797188",
          full_message: "head~4",
          subject_line: "head~4",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
        {
          sha: "e6d1dfc7ec007468712bfc015884cc22bfa79e1d",
          full_message: "head~3",
          subject_line: "head~3",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
        {
          sha: "a26f21025a558968554c439ab9b942d5fe84bccb",
          full_message: "head~2",
          subject_line: "head~2",
          branch_id: "gs---4gvxa-5v-2mx26",
          title: "pr-title",
          master_base: false,
        },
      ],
      master_base: false,
    },
    {
      id: "unassigned",
      title: "allow_unassigned",
      pr: null,
      base: null,
      dirty: true,
      commits: [
        {
          sha: "90667fe97e059e8285e070d6268f2b4035b2ebd4",
          full_message: "head~1",
          subject_line: "head~1",
          branch_id: "unassigned",
          title: "allow_unassigned",
          master_base: false,
        },
        {
          sha: "b61c5b09a4b7c9dcff9a9071386b134997569a01",
          full_message: "head",
          subject_line: "head",
          branch_id: "unassigned",
          title: "allow_unassigned",
          master_base: false,
        },
      ],
      master_base: false,
    },
  ],
  commit_list: [
    {
      sha: "55771391b49e301f51b22cbc2b745e8d3e4a357a",
      full_message: "head~7",
      subject_line: "head~7",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "391476bbfc6b77b60a3ef7fa97155496a9f8f27f",
      full_message: "head~6",
      subject_line: "head~6",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "5a98cf8f0406712405d41af07c3a012f72ad36fa",
      full_message: "head~5",
      subject_line: "head~5",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "e820018cb370bb6cda118dc649e841c75d797188",
      full_message: "head~4",
      subject_line: "head~4",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "e6d1dfc7ec007468712bfc015884cc22bfa79e1d",
      full_message: "head~3",
      subject_line: "head~3",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "a26f21025a558968554c439ab9b942d5fe84bccb",
      full_message: "head~2",
      subject_line: "head~2",
      branch_id: "gs---4gvxa-5v-2mx26",
      title: "pr-title",
      master_base: false,
    },
    {
      sha: "90667fe97e059e8285e070d6268f2b4035b2ebd4",
      full_message: "head~1",
      subject_line: "head~1",
      branch_id: "unassigned",
      title: "allow_unassigned",
      master_base: false,
    },
    {
      sha: "b61c5b09a4b7c9dcff9a9071386b134997569a01",
      full_message: "head",
      subject_line: "head",
      branch_id: "unassigned",
      title: "allow_unassigned",
      master_base: false,
    },
  ],
  pr_lookup: {},
  UNASSIGNED: "unassigned",
};
