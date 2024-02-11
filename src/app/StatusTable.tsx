import * as React from "react";

import * as Ink from "ink-cjs";

import { Store } from "~/app/Store";
import { Table } from "~/app/Table";
import { Url } from "~/app/Url";
import { assertNever } from "~/core/assertNever";
import { colors } from "~/core/colors";
import { invariant } from "~/core/invariant";

import type { TableColumnProps } from "~/app/Table";

export function StatusTable() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  const row_list = [];

  for (const group of commit_range.group_list) {
    const row: Row = {
      count: "",
      status: "NEW",
      title: "",
      url: "",
    };

    if (group.id === commit_range.UNASSIGNED) {
      row.status = "NEW";
      row.title = "Unassigned";
      row.count = `0/${group.commits.length}`;
      row.url = "";
    } else {
      if (group.dirty) {
        row.status = "OUTDATED";
      } else {
        row.status = "SYNCED";
      }

      if (group.pr) {
        if (group.pr.state === "MERGED") {
          row.status = "MERGED";
        }

        row.title = group.pr.title;
        row.count = `${group.pr.commits.length}/${group.commits.length}`;
        row.url = group.pr.url;
      } else {
        row.title = group.title || group.id;
        row.count = `0/${group.commits.length}`;
      }
    }

    row_list.push(row);
  }

  return (
    <Table
      data={row_list}
      fillColumn="title"
      maxWidth={{
        status: (v) => v + 2,
      }}
      columnGap={3}
      columns={{
        status: StatusColumn,
        count: CountColumn,
        title: TitleColumn,
        url: UrlColumn,
      }}
    />
  );
}

type Row = {
  status: "NEW" | "OUTDATED" | "MERGED" | "SYNCED";
  count: string;
  title: string;
  url: string;
};

function StatusColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return (
    <Ink.Text
      color={get_status_color(props.row)}
      bold={get_status_bold(props.row)}
    >
      {get_status_icon(props.row)} {value}
    </Ink.Text>
  );
}

function CountColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return <Ink.Text dimColor>{value}</Ink.Text>;
}

function TitleColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return <Ink.Text wrap="truncate-end">{value}</Ink.Text>;
}

function UrlColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return <Url dimColor>{value}</Url>;
}

function get_status_icon(row: Row) {
  switch (row.status) {
    case "NEW":
      return "⭑";
    case "OUTDATED":
      return "!";
    case "MERGED":
      return "↗";
    case "SYNCED":
      return "✔";
    default:
      assertNever(row.status);
      return "?";
    // unicode question mark in box
  }
}

function get_status_color(row: Row) {
  switch (row.status) {
    case "NEW":
      return colors.yellow;
    case "OUTDATED":
      return colors.red;
    case "MERGED":
      return colors.purple;
    case "SYNCED":
      return colors.green;
    default:
      assertNever(row.status);
      return colors.gray;
  }
}

function get_status_bold(row: Row) {
  switch (row.status) {
    case "NEW":
    case "OUTDATED":
      return true;
    default:
      return false;
  }
}
