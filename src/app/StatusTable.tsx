import * as React from "react";

import * as Ink from "ink";

import { invariant } from "../core/invariant.js";

import { Store } from "./Store.js";

export function StatusTable() {
  const commit_range = Store.useState((state) => state.commit_range);

  invariant(commit_range, "commit_range must exist");

  const row_list = [];

  for (const group of commit_range.group_list) {
    const row: Row = {
      id: group.id,
      icon: "",
      count: "",
      status: "",
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

  if (!row_list.length) {
    return (
      <Container>
        <Ink.Text dimColor>No data found.</Ink.Text>
      </Container>
    );
  }

  // walk data and discover max width for each column
  const max_col_width = {} as {
    [key in (typeof RowColumnList)[number]]: number;
  };

  for (const col of RowColumnList) {
    max_col_width[col] = 0;
  }

  for (const row of row_list) {
    for (const col of RowColumnList) {
      const row_col = row[col];
      max_col_width[col] = Math.max(row_col.length, max_col_width[col]);
    }
  }

  const { stdout } = Ink.useStdout();
  const available_width = stdout.columns;
  const columnGap = 2;
  const breathing_room = 0;

  const remaining_space =
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
    columnGap * RowColumnList.length -
    // remove some extra space
    breathing_room;

  // add one for ellipsis character
  max_col_width.title = Math.min(max_col_width.title, remaining_space + 1);

  // console.debug({ available_width, remaining_space, max_col_width });

  return (
    <Container>
      {row_list.map((row) => {
        return (
          <Ink.Box
            key={row.id}
            // borderStyle="round"
            flexDirection="row"
            columnGap={columnGap}
            width={available_width}
          >
            {RowColumnList.map((column) => {
              const ColumnComponent = ColumnComponentMap[column];

              return (
                <Ink.Box key={column} width={max_col_width[column]}>
                  <ColumnComponent key={column} row={row} column={column} />
                </Ink.Box>
              );
            })}
          </Ink.Box>
        );
      })}
    </Container>
  );
}

function Container(props: { children: React.ReactNode }) {
  return (
    <Ink.Box flexDirection="column">
      <Ink.Box height={1} />
      {props.children}
      <Ink.Box height={1} />
    </Ink.Box>
  );
}

const RowColumnList = ["icon", "status", "count", "title", "url"] as const;

type Column = (typeof RowColumnList)[number];
type Row = { [key in Column]: string } & { id: string };

const ColumnComponentMap: ColumnComponentMapType = {
  icon: Icon,
  status: Status,
  count: Count,
  title: Title,
  url: Url,
};

type ColumnComponentMapType = {
  [key in Column]: (props: ColumnProps) => React.ReactNode;
};

type ColumnProps = { row: Row; column: Column };

function Icon(props: ColumnProps) {
  const value = props.row[props.column];

  return (
    <Ink.Text color="yellow" bold>
      {value}
    </Ink.Text>
  );
}

function Status(props: ColumnProps) {
  const value = props.row[props.column];

  return <Ink.Text>{value}</Ink.Text>;
}

function Count(props: ColumnProps) {
  const value = props.row[props.column];

  return <Ink.Text>{value}</Ink.Text>;
}

function Title(props: ColumnProps) {
  const value = props.row[props.column];

  return <Ink.Text wrap="truncate-end">{value}</Ink.Text>;
}

function Url(props: ColumnProps) {
  const value = props.row[props.column];

  return <Ink.Text>{value}</Ink.Text>;
}
