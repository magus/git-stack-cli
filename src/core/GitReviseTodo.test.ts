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
      "",
      "++ pick d36d63499425",
      "cantaloupe color",
      "",
      "git-stack-id: E63ytp5dj",
      "",
      "++ pick 4f98dd3e67d0",
      "banana sweet",
      "",
      "git-stack-id: E63ytp5dj",
      "",
      "++ pick f143d03c723c",
      "apple sweet",
      "",
      "git-stack-id: E63ytp5dj",
    ].join("\n")
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
    ].join("\n")
  );
});

const SINGLE_COMMIT_EXISTING_GROUP: CommitMetadata.CommitRange = {
  "invalid": false,
  "group_list": [
    {
      "id": "AAWsYx1UU",
      "title": "banana",
      "pr": {
        "baseRefName": "master",
        "body":
          "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
        "commits": [
          {
            "authoredDate": "2024-02-25T03:41:42Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:42Z",
            "messageBody": "git-stack-id: AAWsYx1UU",
            "messageHeadline": "banana color",
            "oid": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          },
        ],
        "headRefName": "AAWsYx1UU",
        "number": 43,
        "state": "OPEN",
        "title": "banana",
        "url": "https://github.com/magus/git-multi-diff-playground/pull/43",
      },
      "base": "master",
      "dirty": false,
      "commits": [
        {
          "sha": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          "full_message": "banana color\n\ngit-stack-id: AAWsYx1UU",
          "subject_line": "banana color",
          "branch_id": "AAWsYx1UU",
        },
      ],
    },
    {
      "id": "E63ytp5dj",
      "title": "lemon color",
      "pr": {
        "baseRefName": "AAWsYx1UU",
        "body":
          "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
        "commits": [
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "lemon color",
            "oid": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          },
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "cantaloupe color",
            "oid": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          },
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "banana sweet",
            "oid": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          },
        ],
        "headRefName": "E63ytp5dj",
        "number": 47,
        "state": "OPEN",
        "title": "lemon color",
        "url": "https://github.com/magus/git-multi-diff-playground/pull/47",
      },
      "base": "AAWsYx1UU",
      "dirty": true,
      "commits": [
        {
          "sha": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          "full_message": "lemon color\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "lemon color",
          "branch_id": "E63ytp5dj",
        },
        {
          "sha": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          "full_message": "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "cantaloupe color",
          "branch_id": "E63ytp5dj",
        },
        {
          "sha": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          "full_message": "banana sweet\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "banana sweet",
          "branch_id": "E63ytp5dj",
        },
        {
          "sha": "f143d03c723c9f5231a81c1e12098511611898cb",
          "full_message": "apple sweet",
          "subject_line": "apple sweet",
          "branch_id": null,
        },
      ],
    },
  ],
  "commit_list": [
    {
      "sha": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
      "full_message": "banana color\n\ngit-stack-id: AAWsYx1UU",
      "subject_line": "banana color",
      "branch_id": "AAWsYx1UU",
    },
    {
      "sha": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
      "full_message": "lemon color\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "lemon color",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
      "full_message": "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "cantaloupe color",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
      "full_message": "banana sweet\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "banana sweet",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "f143d03c723c9f5231a81c1e12098511611898cb",
      "full_message": "apple sweet",
      "subject_line": "apple sweet",
      "branch_id": null,
    },
  ],
  "pr_lookup": {
    "AAWsYx1UU": {
      "baseRefName": "master",
      "body":
        "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "commits": [
        {
          "authoredDate": "2024-02-25T03:41:42Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:42Z",
          "messageBody": "git-stack-id: AAWsYx1UU",
          "messageHeadline": "banana color",
          "oid": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
        },
      ],
      "headRefName": "AAWsYx1UU",
      "number": 43,
      "state": "OPEN",
      "title": "banana",
      "url": "https://github.com/magus/git-multi-diff-playground/pull/43",
    },
    "E63ytp5dj": {
      "baseRefName": "AAWsYx1UU",
      "body":
        "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
      "commits": [
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "lemon color",
          "oid": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
        },
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "cantaloupe color",
          "oid": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
        },
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "banana sweet",
          "oid": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
        },
      ],
      "headRefName": "E63ytp5dj",
      "number": 47,
      "state": "OPEN",
      "title": "lemon color",
      "url": "https://github.com/magus/git-multi-diff-playground/pull/47",
    },
  },
  "UNASSIGNED": "unassigned",
};

const SINGLE_COMMIT_NEW_GROUP: CommitMetadata.CommitRange = {
  "invalid": false,
  "group_list": [
    {
      "id": "AAWsYx1UU",
      "title": "banana",
      "pr": {
        "baseRefName": "master",
        "body":
          "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
        "commits": [
          {
            "authoredDate": "2024-02-25T03:41:42Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:42Z",
            "messageBody": "git-stack-id: AAWsYx1UU",
            "messageHeadline": "banana color",
            "oid": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          },
        ],
        "headRefName": "AAWsYx1UU",
        "number": 43,
        "state": "OPEN",
        "title": "banana",
        "url": "https://github.com/magus/git-multi-diff-playground/pull/43",
      },
      "base": "master",
      "dirty": false,
      "commits": [
        {
          "sha": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
          "full_message": "banana color\n\ngit-stack-id: AAWsYx1UU",
          "subject_line": "banana color",
          "branch_id": "AAWsYx1UU",
        },
      ],
    },
    {
      "id": "E63ytp5dj",
      "title": "lemon color",
      "pr": {
        "baseRefName": "AAWsYx1UU",
        "body":
          "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
        "commits": [
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "lemon color",
            "oid": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          },
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "cantaloupe color",
            "oid": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          },
          {
            "authoredDate": "2024-02-25T03:41:46Z",
            "authors": [
              {
                "email": "noah@iamnoah.com",
                "id": "MDQ6VXNlcjI5MDA4NA==",
                "login": "magus",
                "name": "magus",
              },
            ],
            "committedDate": "2024-02-25T03:41:46Z",
            "messageBody": "git-stack-id: E63ytp5dj",
            "messageHeadline": "banana sweet",
            "oid": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          },
        ],
        "headRefName": "E63ytp5dj",
        "number": 47,
        "state": "OPEN",
        "title": "lemon color",
        "url": "https://github.com/magus/git-multi-diff-playground/pull/47",
      },
      "base": "AAWsYx1UU",
      "dirty": false,
      "commits": [
        {
          "sha": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
          "full_message": "lemon color\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "lemon color",
          "branch_id": "E63ytp5dj",
        },
        {
          "sha": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
          "full_message": "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "cantaloupe color",
          "branch_id": "E63ytp5dj",
        },
        {
          "sha": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
          "full_message": "banana sweet\n\ngit-stack-id: E63ytp5dj",
          "subject_line": "banana sweet",
          "branch_id": "E63ytp5dj",
        },
      ],
    },
    {
      "id": "6Ak-qn+5Z",
      "title": "new group",
      "pr": null,
      "base": "E63ytp5dj",
      "dirty": true,
      "commits": [
        {
          "sha": "f143d03c723c9f5231a81c1e12098511611898cb",
          "full_message": "apple sweet",
          "subject_line": "apple sweet",
          "branch_id": null,
        },
      ],
    },
  ],
  "commit_list": [
    {
      "sha": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
      "full_message": "banana color\n\ngit-stack-id: AAWsYx1UU",
      "subject_line": "banana color",
      "branch_id": "AAWsYx1UU",
    },
    {
      "sha": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
      "full_message": "lemon color\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "lemon color",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
      "full_message": "cantaloupe color\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "cantaloupe color",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
      "full_message": "banana sweet\n\ngit-stack-id: E63ytp5dj",
      "subject_line": "banana sweet",
      "branch_id": "E63ytp5dj",
    },
    {
      "sha": "f143d03c723c9f5231a81c1e12098511611898cb",
      "full_message": "apple sweet",
      "subject_line": "apple sweet",
      "branch_id": null,
    },
  ],
  "pr_lookup": {
    "AAWsYx1UU": {
      "baseRefName": "master",
      "body":
        "adsf\r\n\r\n#### git stack\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/47\n- 👉 `1` https://github.com/magus/git-multi-diff-playground/pull/43",
      "commits": [
        {
          "authoredDate": "2024-02-25T03:41:42Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:42Z",
          "messageBody": "git-stack-id: AAWsYx1UU",
          "messageHeadline": "banana color",
          "oid": "35ff24f920c0778a8560e9a3ccdd1ca5ec16172b",
        },
      ],
      "headRefName": "AAWsYx1UU",
      "number": 43,
      "state": "OPEN",
      "title": "banana",
      "url": "https://github.com/magus/git-multi-diff-playground/pull/43",
    },
    "E63ytp5dj": {
      "baseRefName": "AAWsYx1UU",
      "body":
        "\r\n\r\n#### git stack\n- 👉 `3` https://github.com/magus/git-multi-diff-playground/pull/47\n- ⏳ `2` https://github.com/magus/git-multi-diff-playground/pull/43\n- ✅ `1`\n  https://github.com/magus/git-multi-diff-playground/pull/42",
      "commits": [
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "lemon color",
          "oid": "3cb22661ecff6c872e96ce9c40b31c824938cab7",
        },
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "cantaloupe color",
          "oid": "d36d63499425bb46a1e62c2c9df1a4332b13004f",
        },
        {
          "authoredDate": "2024-02-25T03:41:46Z",
          "authors": [
            {
              "email": "noah@iamnoah.com",
              "id": "MDQ6VXNlcjI5MDA4NA==",
              "login": "magus",
              "name": "magus",
            },
          ],
          "committedDate": "2024-02-25T03:41:46Z",
          "messageBody": "git-stack-id: E63ytp5dj",
          "messageHeadline": "banana sweet",
          "oid": "4f98dd3e67d03b79d7a12480c7d1c2fcbd186ac5",
        },
      ],
      "headRefName": "E63ytp5dj",
      "number": 47,
      "state": "OPEN",
      "title": "lemon color",
      "url": "https://github.com/magus/git-multi-diff-playground/pull/47",
    },
  },
  "UNASSIGNED": "unassigned",
};
