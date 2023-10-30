import * as React from "react";

import * as Ink from "ink";

import { capitalize } from "../core/capitalize.js";
import { clamp } from "../core/clamp.js";
import { invariant } from "../core/invariant.js";

import { Store } from "./Store.js";

import type { State } from "./Store.js";

type CommitMetadataList = NonNullable<State["commit_metadata_list"]>;
type CommitMetadata = CommitMetadataList[number];
type PullRequest = NonNullable<CommitMetadata["pr"]>;

export function StatusTable() {
  const commit_metadata_list = Store.useState(
    (state) => state.commit_metadata_list
  );

  invariant(commit_metadata_list, "commit_metadata_list must exist");

  const commit_range = get_commit_range(commit_metadata_list);
  const data = [];
  const local = [];

  for (const group of commit_range.group_map.values()) {
    const row = {
      icon: "",
      count: "",
      status: "",
      title: "",
      url: "",
    };

    if (group.pr) {
      let dirty = false;

      if (group.pr.commits.length !== group.commits.length) {
        dirty = true;
      } else {
        for (let i = 0; i < group.pr.commits.length; i++) {
          const pr_commit = group.pr.commits[i];
          const local_commit = group.commits[i];

          if (pr_commit.oid !== local_commit.sha) {
            dirty = true;
          }
        }
      }

      if (dirty) {
        row.icon = "✓";
        row.status = "SYNCED";
      } else {
        row.icon = "↺";
        row.status = "OUTDATED";
      }

      row.title = group.pr.title;
      row.count = `${group.pr.commits.length}/${group.commits.length}`;
      row.url = group.pr.url;

      data.push(row);
    } else {
      row.icon = "★";
      row.status = "NEW";
      row.title = capitalize(UNASSIGNED);
      row.count = `0/${group.commits.length}`;
      row.url = "";

      local.push(row);
    }
  }

  if (!data.length) {
    return <Ink.Text dimColor>No data found.</Ink.Text>;
  }

  // walk data and discover max width for each column
  const sample_row = data[0];
  type ColKey = keyof typeof sample_row;
  const col_list = Object.keys(sample_row) as Array<ColKey>;
  const max_col_width = {} as { [key in ColKey]: number };

  for (const col of col_list) {
    max_col_width[col] = 0;
  }

  for (const row of data) {
    for (const col of col_list) {
      const value = row[col];
      max_col_width[col] = Math.max(value.length, max_col_width[col]);
    }
  }

  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns;
  const col_gap = 2;
  const breathing_room = 10;

  const max_title_width = Math.min(max_col_width.title, MAX_TITLE_LENGTH);

  const remaining_space = clamp(
    available_width -
      // icon
      max_col_width.icon -
      // status
      max_col_width.status -
      // commits
      max_col_width.count -
      // url
      max_col_width.url -
      // gap * col count
      col_gap * col_list.length -
      // remove some extra space
      breathing_room,
    0,
    max_title_width
  );

  const title_width = remaining_space;

  // reverse data to match git log
  data.reverse();

  const row_list = [...local, ...data];

  return (
    <Ink.Box flexDirection="column" width={available_width}>
      {row_list.map((row) => {
        return (
          <Ink.Box
            key={row.url}
            // borderStyle="round"
            flexDirection="row"
            gap={col_gap}
            width={available_width}
          >
            <Ink.Box width={max_col_width.icon}>
              <Ink.Text>{row.icon}</Ink.Text>
            </Ink.Box>

            <Ink.Box width={max_col_width.status}>
              <Ink.Text>{row.status}</Ink.Text>
            </Ink.Box>

            <Ink.Box width={max_col_width.count}>
              <Ink.Text>{row.count}</Ink.Text>
            </Ink.Box>

            <Ink.Box width={title_width}>
              <Ink.Text wrap="truncate-end">{row.title}</Ink.Text>
            </Ink.Box>

            <Ink.Box width={max_col_width.url}>
              <Ink.Text>{row.url}</Ink.Text>
            </Ink.Box>
          </Ink.Box>
        );
      })}
    </Ink.Box>
  );
}

type CommitGroup = {
  id: string;
  pr: null | PullRequest;
  commits: Array<CommitMetadata>;
};

function get_commit_range(commit_metadata_list: CommitMetadataList) {
  let invalid = false;
  const group_map = new Map<string, CommitGroup>();

  for (const commit of commit_metadata_list) {
    let id = commit.metadata.id;
    const pr = commit.pr;

    if (!pr) {
      // console.debug("INVALID", "MISSING PR", { commit });
      invalid = true;
    }

    if (id) {
      const group_key_list = Array.from(group_map.keys());
      const last_key = group_key_list[group_key_list.length - 1];

      if (group_map.has(id) && last_key !== id) {
        // if we've seen this id before and it's not
        // the last added key then we are out of order
        console.debug("INVALID", "OUT OF ORDER", { commit });
        invalid = true;
      }
    } else {
      // console.debug("INVALID", "NEW COMMIT", { commit });
      invalid = true;

      id = UNASSIGNED;
    }

    const group = group_map.get(id) || { id, pr, commits: [] };
    group.commits.push(commit);
    group_map.set(id, group);
  }

  return { invalid, group_map };
}

const MAX_TITLE_LENGTH = 50;
const UNASSIGNED = "unassigned";
