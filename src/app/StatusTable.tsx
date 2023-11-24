import * as React from "react";

import * as Ink from "ink";

import { assertNever } from "../core/assertNever.js";
import { invariant } from "../core/invariant.js";

import { Store } from "./Store.js";
import { Table } from "./Table.js";
import { Url } from "./Url.js";

import type { TableColumnProps } from "./Table.js";

export function StatusTable() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  const row_list = [];

  for (const group of commit_range.group_list) {
    const row: Row = {
      icon: "",
      count: "",
      status: "NEW",
      title: "",
      url: "",
    };

    if (group.id === commit_range.UNASSIGNED) {
      row.icon = "⭑";
      row.status = "NEW";
      row.title = "Unassigned";
      row.count = `0/${group.commits.length}`;
      row.url = "";
    } else {
      if (group.dirty) {
        row.icon = "!";
        row.status = "OUTDATED";
      } else {
        row.icon = "✔";
        row.status = "SYNCED";
      }

      if (group.pr) {
        if (group.pr.state === "MERGED") {
          row.icon = "↗";
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
      // maxWidth={{
      //   title: 30,
      // }}
      columnGap={3}
      columns={{
        icon: IconColumn,
        status: StatusColumn,
        count: CountColumn,
        title: TitleColumn,
        url: UrlColumn,
      }}
    />
  );
}

type Row = {
  icon: string;
  status: "NEW" | "OUTDATED" | "MERGED" | "SYNCED";
  count: string;
  title: string;
  url: string;
};

function IconColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return (
    <Ink.Text
      color={get_status_color(props.row)}
      bold={get_status_bold(props.row)}
    >
      {value}
    </Ink.Text>
  );
}

function StatusColumn(props: TableColumnProps<Row>) {
  const value = props.row[props.column];

  return (
    <Ink.Text
      color={get_status_color(props.row)}
      bold={get_status_bold(props.row)}
    >
      {value}
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

function get_status_color(row: Row) {
  switch (row.status) {
    case "NEW":
      return "yellow";
    case "OUTDATED":
      return "red";
    case "MERGED":
      return "purple";
    case "SYNCED":
      return "green";
    default:
      assertNever(row.status);
      return "gray";
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
